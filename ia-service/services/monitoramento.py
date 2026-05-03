"""
Serviço de Monitoramento de Vídeo
===================================
Pipeline completo para processar um vídeo de câmera:
  1. Download do vídeo (se URL remota)
  2. Detecção e rastreamento de cães com YOLOv8
  3. Filtragem de qualidade e seleção do melhor frame por cão (via Gemini)
  4. Upload do recorte para Cloudinary
  5. Classificação fenotípica (raça, cor, porte, detalhes) via Gemini
  6. Persistência do avistamento no backend (PostgreSQL)
  7. Matching automático contra relatos perdidos
"""

import cv2
import os
import json
import shutil
import uuid
import requests
from datetime import datetime
from ultralytics import YOLO
import cloudinary.uploader
from agno.media import Image as AgnoImage

from config.settings import (
    FOLDER_TEMP, BACKEND_API_URL,
    YOLO_POR_SEGUNDO, TEMPO_IA_SEGUNDOS, TEMPO_SUMICO_SEGUNDOS
)
from core.utils import extrair_json_robusto, normalizar_raca
from core.agents import agente_filtro, agente_comparador, agente_classificador
from services.ia_match import fazer_match_avistamento_detectado

print("⚙️ [SISTEMA] Carregando YOLOv8s...")
_modelo = YOLO("yolov8s.pt")


# ==========================================
# PERSISTÊNCIA NO BACKEND
# ==========================================

def _salvar_avistamento_no_backend(registro: dict, camera_origem_id: str) -> str | None:
    """
    POST /api/integracao/avistamentos
    Salva o avistamento detectado no banco via backend.
    Retorna o ID gerado pelo backend, ou None em caso de erro.
    """
    try:
        payload = {
            "codigoCamera": camera_origem_id,
            "snapshotUrl":  registro["snapshot_url"],
            "features": {
                "racaEstimada":          registro["features"].get("racaEstimada", "SDR"),
                "corPredominante":       registro["features"].get("corPredominante", ""),
                "porteEstimado":         registro["features"].get("porte", ""),
                "confiancaDetecao":      registro["features"].get("confiancaDetecao", 0.0),
                "caracteristicasExtras": [registro["features"].get("detalhesCao", "")],
            },
        }
        resp = requests.post(
            f"{BACKEND_API_URL}/api/integracao/avistamentos",
            json=payload,
            timeout=60,
        )
        resp.raise_for_status()
        backend_id = resp.json().get("id")
        print(f"   💾 Avistamento salvo no backend (ID: {backend_id})")
        return backend_id
    except Exception as e:
        print(f"   ⚠️ Falha ao salvar avistamento no backend: {e}")
        return None


# ==========================================
# FINALIZAÇÃO DE EVENTO (cão saiu da tela)
# ==========================================

def _finalizar_evento(
    amostra_referencia: dict,
    registros: list,
    track_id: int,
    camera_origem_id: str,
    data_hora: str,
):
    """Processa o melhor frame capturado para um cão: Cloudinary + Gemini + backend."""
    if not amostra_referencia:
        return

    print(f"\n{'='*60}")
    print(f"🛑 [CÃO {track_id}] Saiu da tela — processando...")

    try:
        os.makedirs(FOLDER_TEMP, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        path_short = f"{FOLDER_TEMP}/temp_short_{track_id}.jpg"
        path_full  = f"{FOLDER_TEMP}/temp_full_{track_id}.jpg"

        cv2.imwrite(path_short, amostra_referencia["crop"])
        cv2.imwrite(path_full,  amostra_referencia["full_marked"])

        # Upload para Cloudinary
        print("   ☁️ Upload para Cloudinary...")
        upload = cloudinary.uploader.upload(
            path_short, folder="cao_radar/short", public_id=f"DOG_{track_id}_{ts}_short"
        )
        cloudinary.uploader.upload(
            path_full, folder="cao_radar/full", public_id=f"DOG_{track_id}_{ts}_full"
        )
        url_short = upload["secure_url"]
        print(f"   🔗 Snapshot: {url_short}")

        # Classificação fenotípica via Gemini (bytes em memória para evitar race condition no cleanup)
        with open(path_short, "rb") as f:
            bytes_short = f.read()
        resp_class = agente_classificador.run(
            "Analise e classifique o cão na imagem.",
            images=[AgnoImage(content=bytes_short)],
        )
        dados = extrair_json_robusto(resp_class.content)

        if dados:
            agora = datetime.now().isoformat()
            registro = {
                "id":              str(uuid.uuid4()),
                "created_at":      agora,
                "updated_at":      agora,
                "camera_origem_id": camera_origem_id,
                "data_hora":       data_hora,
                "snapshot_url":    url_short,
                "features": {
                    "racaEstimada":     normalizar_raca(dados.get("raca_provavel")),
                    "corPredominante":  dados.get("cor_predominante", ""),
                    "porte":            dados.get("porte", ""),
                    "confiancaDetecao": round(float(dados.get("confianca_detecao", 0.0)), 4),
                    "detalhesCao":      dados.get("detalhes_observados", ""),
                },
            }
            registros.append(registro)

            feat = registro["features"]
            print(
                f"   ✅ Classificado: {feat['racaEstimada']} | "
                f"{feat['corPredominante']} | {feat['porte']} | "
                f"Conf: {feat['confiancaDetecao']*100:.0f}%"
            )

    except Exception as e:
        print(f"   ❌ Erro no processamento do Cão {track_id}: {e}")
    finally:
        for p in [path_short, path_full]:
            if os.path.exists(p):
                os.remove(p)

    print("="*60)


# ==========================================
# PIPELINE PRINCIPAL
# ==========================================

def processar_video_best_shot(
    video_path: str,
    camera_origem_id: str,
    data_hora: str,
) -> list[dict]:
    """
    Processa um vídeo e retorna a lista de avistamentos detectados.
    Para cada cão encontrado:
      - extrai o melhor frame
      - salva no backend
      - dispara matching automático contra relatos perdidos
    """
    os.makedirs(FOLDER_TEMP, exist_ok=True)

    # Download se URL remota
    arquivo_temp = None
    video_local  = video_path
    if video_path.startswith(("http://", "https://")):
        print(f"\n📥 Baixando vídeo: {video_path}")
        arquivo_temp = f"{FOLDER_TEMP}/video_{camera_origem_id}.mp4"
        try:
            r = requests.get(video_path, timeout=60, stream=True)
            r.raise_for_status()
            with open(arquivo_temp, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            video_local = arquivo_temp
            print("✅ Vídeo baixado.")
        except Exception as e:
            print(f"❌ Falha ao baixar vídeo: {e}")
            return []

    cap = cv2.VideoCapture(video_local)
    if not cap.isOpened():
        print(f"❌ Não foi possível abrir o vídeo: {video_local}")
        return []

    fps         = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_f     = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    pular_yolo  = max(1, int(fps / YOLO_POR_SEGUNDO))
    frames_ia   = max(1, int(fps * TEMPO_IA_SEGUNDOS))
    frames_sumico = max(1, int(fps * TEMPO_SUMICO_SEGUNDOS))

    print(f"\n{'#'*60}")
    print(f"🎬 Câmera: {camera_origem_id} | Frames: {total_f} | FPS: {fps:.1f}")
    print(f"   YOLO a cada {pular_yolo} frames | Gemini a cada {frames_ia} frames")
    print(f"{'#'*60}\n")

    registros      = []
    caes_rastreados = {}
    frame_idx      = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % pular_yolo == 0:
            results = _modelo.track(frame, persist=True, verbose=False, classes=[16], conf=0.45)
            ids_no_frame = set()

            if results and results[0].boxes and results[0].boxes.id is not None:
                for box, tid in zip(results[0].boxes, results[0].boxes.id.int().cpu().tolist()):
                    ids_no_frame.add(tid)
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    h, w = frame.shape[:2]

                    # Margem de 20% para a IA ver pernas, rabo e contexto
                    mx = int((x2 - x1) * 0.20)
                    my = int((y2 - y1) * 0.20)
                    roi = frame[max(0, y1-my):min(h, y2+my), max(0, x1-mx):min(w, x2+mx)]
                    if roi.size == 0:
                        continue

                    frame_marcado = frame.copy()
                    cv2.rectangle(frame_marcado, (x1, y1), (x2, y2), (255, 255, 255), 2)

                    if tid not in caes_rastreados:
                        print(f"🐕 [Cão {tid}] Entrou — frame {frame_idx} ({frame_idx/fps:.1f}s)")
                        caes_rastreados[tid] = {
                            "amostra_referencia": None,
                            "frames_sem_objeto":  0,
                            "timer_ia":           0,
                        }

                    cao = caes_rastreados[tid]
                    cao["frames_sem_objeto"] = 0
                    cao["timer_ia"] += pular_yolo

                    path_temp = f"{FOLDER_TEMP}/buf_{tid}.jpg"
                    path_ref  = f"{FOLDER_TEMP}/ref_{tid}.jpg"
                    cv2.imwrite(path_temp, roi)

                    if cao["amostra_referencia"] is None or cao["timer_ia"] >= frames_ia:
                        cao["timer_ia"] = 0
                        try:
                            # Lê bytes imediatamente para evitar leitura lazy após cleanup da pasta
                            with open(path_temp, "rb") as f:
                                bytes_temp = f.read()
                            r_filtro = agente_filtro.run("Validar.", images=[AgnoImage(content=bytes_temp)])
                            d_filtro = extrair_json_robusto(r_filtro.content)
                            if d_filtro and d_filtro.get("aprovado"):
                                nova = {"crop": roi.copy(), "full_marked": frame_marcado, "frame": frame_idx}
                                if cao["amostra_referencia"] is None:
                                    print(f"   📸 [Cão {tid}] Primeira foto nítida capturada.")
                                    cao["amostra_referencia"] = nova
                                    cv2.imwrite(path_ref, roi)
                                else:
                                    with open(path_ref, "rb") as f:
                                        bytes_ref = f.read()
                                    r_comp = agente_comparador.run(
                                        "Comparar.",
                                        images=[AgnoImage(content=bytes_ref), AgnoImage(content=bytes_temp)],
                                    )
                                    d_comp = extrair_json_robusto(r_comp.content)
                                    if d_comp and d_comp.get("melhor_imagem") == 2:
                                        print(f"   ⭐ [Cão {tid}] Foto atualizada (melhor ângulo).")
                                        cao["amostra_referencia"] = nova
                                        cv2.imwrite(path_ref, roi)
                        except Exception:
                            pass

            # Verifica cães que saíram da tela
            for tid in list(caes_rastreados.keys()):
                if tid not in ids_no_frame:
                    c = caes_rastreados[tid]
                    c["frames_sem_objeto"] += pular_yolo
                    if c["frames_sem_objeto"] >= frames_sumico:
                        _finalizar_evento(c["amostra_referencia"], registros, tid, camera_origem_id, data_hora)
                        del caes_rastreados[tid]

        frame_idx += 1

    cap.release()

    # Finaliza cães que ainda estavam na tela ao terminar o vídeo
    for tid, dados in caes_rastreados.items():
        if dados["amostra_referencia"]:
            _finalizar_evento(dados["amostra_referencia"], registros, tid, camera_origem_id, data_hora)

    # Limpa temporários
    if arquivo_temp and os.path.exists(arquivo_temp):
        os.remove(arquivo_temp)
    if os.path.exists(FOLDER_TEMP):
        shutil.rmtree(FOLDER_TEMP, ignore_errors=True)

    # ==========================================
    # PERSISTÊNCIA + MATCHING AUTOMÁTICO
    # ==========================================
    print(f"\n📊 {len(registros)} cão(ões) detectado(s). Salvando e rodando matching...")

    for registro in registros:
        backend_id = _salvar_avistamento_no_backend(registro, camera_origem_id)
        if backend_id:
            registro["id"] = backend_id  # sincroniza ID do banco

        # Dispara matching independente de ter salvado (usa ID local como fallback)
        fazer_match_avistamento_detectado({
            "avistamento_id":  registro.get("id"),
            "camera_id":       camera_origem_id,
            "snapshot_url":    registro["snapshot_url"],
            "raca_provavel":   registro["features"].get("racaEstimada", "Desconhecida"),
            "cor_predominante": registro["features"].get("corPredominante", ""),
            "porte":           registro["features"].get("porte", ""),
            "detalhes":        registro["features"].get("detalhesCao", ""),
        })

    print(f"✅ Pipeline concluído. {len(registros)} avistamento(s) processado(s).\n")
    return registros
