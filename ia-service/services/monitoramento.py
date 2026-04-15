# ia-services/services/monitoramento.py
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

from config.settings import FOLDER_TEMP, BACKEND_API_URL, YOLO_POR_SEGUNDO, TEMPO_IA_SEGUNDOS, TEMPO_SUMICO_SEGUNDOS
from core.utils import extrair_json_robusto
from core.agents import agente_filtro, agente_comparador, agente_classificador

print("⚙️ [SISTEMA] Carregando YOLOv8...")
model_tracker = YOLO('yolov8s.pt')

def finalizar_evento(amostra_referencia, registros, track_id, camera_origem_id, data_hora):
    if not amostra_referencia: return

    print("\n" + "="*60)
    print(f"🛑 [CÃO {track_id}] SAIU DA TELA. PROCESSANDO CLOUDINARY + IA...")

    try:
        ts = datetime.now().strftime('%Y%m%d_%H%M%S')
        path_temp_short = f"{FOLDER_TEMP}/temp_short_{track_id}.jpg"
        path_temp_full = f"{FOLDER_TEMP}/temp_full_{track_id}.jpg"

        cv2.imwrite(path_temp_short, amostra_referencia['crop'])
        cv2.imwrite(path_temp_full, amostra_referencia['full_marked'])

        print(f"   ☁️ Fazendo upload das imagens para o Cloudinary...")
        upload_short = cloudinary.uploader.upload(path_temp_short, folder="cao_radar/short", public_id=f"DOG_{track_id}_{ts}_short")
        cloudinary.uploader.upload(path_temp_full, folder="cao_radar/full", public_id=f"DOG_{track_id}_{ts}_full")

        url_short = upload_short['secure_url']
        print(f"   🔗 Link Imagem (Recorte): {url_short}")

        resp_class = agente_classificador.run(
            "Analise e classifique o cão na imagem.",
            images=[AgnoImage(filepath=path_temp_short)]
        )
        dados_class = extrair_json_robusto(resp_class.content)

        if dados_class:
            agora = datetime.now().isoformat()
            registro = {
                'id': str(uuid.uuid4()),
                'created_at': agora,
                'updated_at': agora,
                'camera_origem_id': camera_origem_id,
                'data_hora': data_hora,
                'snapshot_url': url_short,
                'features': {
                    'racaEstimada': dados_class.get('raca_provavel', 'SDR'),
                    'corPredominante': dados_class.get('cor_predominante', ''),
                    'porte': dados_class.get('porte', ''),
                    'confiancaDetecao': round(float(dados_class.get('confianca_detecao', 0.0)), 4),
                    'detalhesCao': dados_class.get('detalhes_observados', ''),
                }
            }
            registros.append(registro)
            feat = registro['features']
            print(f"   ✅ CÃO CLASSIFICADO:")
            print(f"      🏷️  Raça: {feat['racaEstimada']} | Cor: {feat['corPredominante']} | Porte: {feat['porte']}")
            print(f"      📊 Confiança: {feat['confiancaDetecao']*100:.1f}%")
            print(f"      📝 Detalhes: {feat['detalhesCao'][:80]}..." if len(feat.get('detalhesCao','')) > 80 else f"      📝 Detalhes: {feat.get('detalhesCao','N/A')}")
            print(f"      🔗 Snapshot: {url_short}")

        if os.path.exists(path_temp_short): os.remove(path_temp_short)
        if os.path.exists(path_temp_full): os.remove(path_temp_full)

    except Exception as e:
        print(f"   ❌ Erro Crítico no processamento do Cão {track_id}: {e}")
    print("="*60)


def processar_video_best_shot(video_path, camera_origem_id, data_hora):
    # Se a URL for remota, baixa localmente primeiro
    video_local = video_path
    arquivo_temp = None
    
    if video_path.startswith('http://') or video_path.startswith('https://'):
        print(f"\n📥 Baixando vídeo remoto: {video_path}")
        arquivo_temp = f"{FOLDER_TEMP}/video_temp_{camera_origem_id}.mp4"
        os.makedirs(FOLDER_TEMP, exist_ok=True)
        
        try:
            response = requests.get(video_path, timeout=60, stream=True)
            response.raise_for_status()
            
            with open(arquivo_temp, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            print(f"✅ Vídeo baixado com sucesso: {arquivo_temp}")
            video_local = arquivo_temp
        except Exception as e:
            print(f"❌ Erro ao baixar vídeo: {e}")
            return
    
    cap = cv2.VideoCapture(video_local)
    if not cap.isOpened():
        print(f"\n❌ [ERRO] Não foi possível abrir o vídeo no caminho: {video_path}")
        return

    # Garante que a pasta existe apenas enquanto a função roda
    os.makedirs(FOLDER_TEMP, exist_ok=True)

    registros = []
    frame_idx = 0
    caes_rastreados = {}

    fps_video = cap.get(cv2.CAP_PROP_FPS)
    if fps_video <= 0 or fps_video != fps_video: fps_video = 30.0

    pular_frames_yolo = max(1, int(fps_video / YOLO_POR_SEGUNDO))
    frames_para_ia = max(1, int(fps_video * TEMPO_IA_SEGUNDOS))
    frames_sumico = max(1, int(fps_video * TEMPO_SUMICO_SEGUNDOS))

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duracao_seg = total_frames / fps_video if fps_video > 0 else 0

    print("\n" + "#"*60)
    print(f"🎬 [SISTEMA] INICIANDO RASTREAMENTO")
    print(f"   📁 Arquivo: {video_path}")
    print(f"   📹 Câmera: {camera_origem_id}")
    print(f"   🎞️  Frames: {total_frames} | FPS: {fps_video:.1f} | Duração: {duracao_seg:.1f}s")
    print(f"   ⚙️  YOLO a cada {pular_frames_yolo} frames | IA a cada {frames_para_ia} frames")
    print("#"*60 + "\n")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break

        if frame_idx % pular_frames_yolo == 0:
            results = model_tracker.track(frame, persist=True, verbose=False, classes=[16], conf=0.45)
            ids_neste_frame = []

            if results and results[0].boxes:
                boxes = results[0].boxes
                if boxes.id is not None:
                    track_ids = boxes.id.int().cpu().tolist()
                    for box, track_id in zip(boxes, track_ids):
                        ids_neste_frame.append(track_id)
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        h, w, _ = frame.shape
                        
                        # ==========================================
                        # NOVO: MARGEM DE RESPIRACÃO PARA IA (PADDING)
                        # ==========================================
                        # Adiciona 20% de margem no recorte para a IA ver o contexto (pernas, rabo, chão)
                        margem_x = int((x2 - x1) * 0.20)
                        margem_y = int((y2 - y1) * 0.20)
                        
                        x1_m = max(0, x1 - margem_x)
                        y1_m = max(0, y1 - margem_y)
                        x2_m = min(w, x2 + margem_x)
                        y2_m = min(h, y2 + margem_y)
                        
                        roi = frame[y1_m:y2_m, x1_m:x2_m]
                        # ==========================================

                        if roi.size == 0: continue
                        frame_marked = frame.copy()
                        cv2.rectangle(frame_marked, (x1, y1), (x2, y2), (255, 255, 255), 2)

                        if track_id not in caes_rastreados:
                            tempo_atual = frame_idx / fps_video if fps_video > 0 else 0
                            tamanho_box = f"{x2-x1}x{y2-y1}px"
                            print(f"🐕 [CÃO {track_id}] Entrou na câmera | Frame {frame_idx} ({tempo_atual:.1f}s) | Box: {tamanho_box}")
                            caes_rastreados[track_id] = {'amostra_referencia': None, 'frames_sem_objeto': 0, 'timer_ia': 0}

                        cao = caes_rastreados[track_id]
                        cao['frames_sem_objeto'] = 0
                        cao['timer_ia'] += pular_frames_yolo
                        path_temp = f"{FOLDER_TEMP}/buffer_{track_id}.jpg"
                        path_ref = f"{FOLDER_TEMP}/ref_{track_id}.jpg"
                        cv2.imwrite(path_temp, roi)

                        if cao['amostra_referencia'] is None or cao['timer_ia'] >= frames_para_ia:
                            cao['timer_ia'] = 0
                            try:
                                resp = agente_filtro.run("Validar.", images=[AgnoImage(filepath=path_temp)])
                                dados_filtro = extrair_json_robusto(resp.content)
                                if dados_filtro and dados_filtro.get("aprovado"):
                                    nova_amostra = {'crop': roi.copy(), 'full_marked': frame_marked, 'frame': frame_idx}
                                    if cao['amostra_referencia'] is None:
                                        print(f"   ↳ 📸 Capturou primeira foto nítida do Cão {track_id}.")
                                        cao['amostra_referencia'] = nova_amostra
                                        cv2.imwrite(path_ref, roi)
                                    else:
                                        resp_comp = agente_comparador.run("Comparar.", images=[AgnoImage(filepath=path_ref), AgnoImage(filepath=path_temp)])
                                        dados_comp = extrair_json_robusto(resp_comp.content)
                                        if dados_comp and dados_comp.get("melhor_imagem") == 2:
                                            print(f"   ↳ ⭐ Atualizou foto do Cão {track_id} (Melhor ângulo).")
                                            cao['amostra_referencia'] = nova_amostra
                                            cv2.imwrite(path_ref, roi)
                            except Exception: pass

            for track_id in list(caes_rastreados.keys()):
                if track_id not in ids_neste_frame:
                    cao = caes_rastreados[track_id]
                    cao['frames_sem_objeto'] += pular_frames_yolo
                    if cao['frames_sem_objeto'] >= frames_sumico:
                        finalizar_evento(cao['amostra_referencia'], registros, track_id, camera_origem_id, data_hora)
                        del caes_rastreados[track_id]

        frame_idx += 1
    cap.release()
    
    # Limpar arquivo de vídeo temporário se foi baixado
    if arquivo_temp and os.path.exists(arquivo_temp):
        try:
            os.remove(arquivo_temp)
            print(f"🧹 Vídeo temporário removido: {arquivo_temp}")
        except Exception as e:
            print(f"⚠️ Aviso ao remover vídeo temporário: {e}")

    for track_id, dados_cao in caes_rastreados.items():
        if dados_cao['amostra_referencia']:
            finalizar_evento(dados_cao['amostra_referencia'], registros, track_id, camera_origem_id, data_hora)
    
    # ==========================================
    # PERSISTÊNCIA NO POSTGRESQL (VIA BACKEND API)
    # ==========================================
    if registros:
        salvos = 0
        for registro in registros:
            try:
                payload = {
                    "codigoCamera": camera_origem_id,
                    "snapshotUrl": registro["snapshot_url"],
                    "features": {
                        "racaEstimada": registro["features"].get("racaEstimada", "SDR"),
                        "corPredominante": registro["features"].get("corPredominante", ""),
                        "porteEstimado": registro["features"].get("porte", ""),
                        "confiancaDetecao": registro["features"].get("confiancaDetecao", 0.0),
                        "caracteristicasExtras": [registro["features"].get("detalhesCao", "")]
                    }
                }
                resp = requests.post(
                    f"{BACKEND_API_URL}/api/integracao/avistamentos",
                    json=payload,
                    timeout=60
                )
                resp.raise_for_status()
                salvos += 1
            except Exception as e:
                print(f"⚠️ Erro ao enviar avistamento ao backend: {e}")

        print(f"\n📊 Avistamentos salvos no PostgreSQL: {salvos}/{len(registros)} via API do backend.")

    print("\n" + "="*60)
    print(f"📋 RESUMO DO PROCESSAMENTO")
    print(f"   📹 Câmera: {camera_origem_id}")
    print(f"   🐕 Cães detectados: {len(registros)}")
    if registros:
        for i, r in enumerate(registros):
            f = r['features']
            print(f"   [{i+1}] {f['racaEstimada']} | {f['corPredominante']} | {f['porte']} | Conf: {f['confiancaDetecao']*100:.0f}%")
    print("="*60)

    print("\n🧹 Destruindo pasta temporária de serviços...")
    try:
        if os.path.exists(FOLDER_TEMP):
            shutil.rmtree(FOLDER_TEMP)
    except Exception as e:
        print(f"   Aviso: Não foi possível deletar a pasta temp: {e}")

    return registros