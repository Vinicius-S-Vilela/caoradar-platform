"""
Serviço de Matching IA
======================
Responsável por:
  1. Buscar candidatos no backend (PostgreSQL) por raça
  2. Enviar cão-alvo + candidatos ao agente Gemini para scoring visual
  3. Persistir matches encontrados no backend
  4. Orquestrar o fluxo bidirecional:
       - Relato perdido  → busca avistamentos detectados
       - Avistamento     → busca relatos perdidos
"""

import json
import requests
from agno.media import Image as AgnoImage

from core.agents import agente_match
from core.utils import extrair_json_robusto
from config.settings import BACKEND_API_URL


# ==========================================
# UTILITÁRIOS
# ==========================================

def _verificar_url(url: str) -> str | None:
    """Retorna a URL se acessível, None caso contrário."""
    try:
        resp = requests.head(url, timeout=5)
        if resp.status_code == 200:
            return url
        print(f"⚠️ URL inacessível ({resp.status_code}): {url}")
        return None
    except Exception:
        return None


# ==========================================
# CONSULTA DE DADOS (BACKEND API → PostgreSQL)
# ==========================================

def buscar_avistamentos_por_raca(raca_alvo: str) -> list[dict]:
    """
    GET /avistamentos?raca={raca_alvo}
    Retorna avistamentos detectados por câmera filtrados por raça.
    """
    try:
        resp = requests.get(
            f"{BACKEND_API_URL}/avistamentos",
            params={"raca": raca_alvo},
            timeout=10
        )
        resp.raise_for_status()
        candidatos = []
        for av in resp.json():
            features = av.get("features", {})
            candidatos.append({
                "id":                av.get("id"),
                "snapshot_url":      av.get("snapshotUrl"),
                "raca_provavel":     features.get("racaEstimada", ""),
                "cor_predominante":  features.get("corPredominante", ""),
                "porte":             features.get("porteEstimado", ""),
                "confianca_detecao": features.get("confiancaDetecao", 0),
                "detalhes_observados": features.get("detalhesCao", ""),
            })
        print(f"🔍 [DB] {len(candidatos)} avistamento(s) de '{raca_alvo}' encontrado(s)")
        return candidatos
    except requests.ConnectionError:
        print(f"❌ Backend indisponível: {BACKEND_API_URL}")
        return []
    except Exception as e:
        print(f"❌ Erro ao buscar avistamentos: {e}")
        return []


def buscar_relatos_perdidos_por_raca(raca_alvo: str) -> list[dict]:
    """
    GET /relatos?status=EM_BUSCA&raca={raca_alvo}
    Retorna relatos de cães perdidos filtrados por raça.
    """
    try:
        resp = requests.get(
            f"{BACKEND_API_URL}/relatos",
            params={"status": "EM_BUSCA", "raca": raca_alvo},
            timeout=10
        )
        resp.raise_for_status()
        candidatos = []
        for rel in resp.json():
            fotos = rel.get("fotosUrl", [])
            candidatos.append({
                "id":               rel.get("id"),
                "nome_cao":         rel.get("nomeCao", ""),
                "descricao":        rel.get("descricao", ""),
                "foto_url":         fotos[0] if fotos else "",
                "raca_provavel":    rel.get("raca", ""),
                "cor_predominante": rel.get("corPredominante", ""),
                "porte":            rel.get("porteInformado", ""),
                "latitude":         rel.get("latitude"),
                "longitude":        rel.get("longitude"),
            })
        print(f"🔍 [DB] {len(candidatos)} relato(s) perdido(s) de '{raca_alvo}' encontrado(s)")
        return candidatos
    except requests.ConnectionError:
        print(f"❌ Backend indisponível: {BACKEND_API_URL}")
        return []
    except Exception as e:
        print(f"❌ Erro ao buscar relatos: {e}")
        return []


# ==========================================
# PERSISTÊNCIA DE MATCHES (BACKEND API)
# ==========================================

def salvar_matches_no_backend(relato_id: str, avistamento_id: str, matches: list[dict]):
    """
    POST /matches
    Persiste os matches encontrados pelo agente no banco de dados.
    Só salva matches com score >= 40 para evitar ruído.
    """
    salvos = 0
    for match in matches:
        score = match.get("probabilidade_match", 0)
        if score < 40:
            continue
        try:
            payload = {
                "relatoId":      relato_id,
                "avistamentoId": avistamento_id,
                "score":         score / 100.0,  # backend espera 0.0–1.0
                "justificativa": match.get("justificativa_visual_e_texto", ""),
            }
            resp = requests.post(f"{BACKEND_API_URL}/matches", json=payload, timeout=10)
            resp.raise_for_status()
            salvos += 1
        except Exception as e:
            print(f"⚠️ Erro ao salvar match no backend: {e}")

    if salvos:
        print(f"💾 {salvos} match(es) salvos no backend (relatoId={relato_id})")


# ==========================================
# MATCHING MULTIMODAL (GEMINI)
# ==========================================

def realizar_match_multimodal(cao_alvo: dict, lista_candidatos: list[dict]) -> list[dict]:
    """
    Envia cão-alvo + candidatos ao agente_match e retorna lista de scores.
    A primeira imagem é sempre o alvo; as seguintes são os candidatos na ordem.
    """
    visao = cao_alvo.get("visao_det_per", "?").upper()
    print(f"\n🧠 [IA MATCH] 1 Alvo ({visao}) vs {len(lista_candidatos)} candidato(s)...")

    # Monta prompt textual (sem URLs — ficam só nas imagens AgnoImage)
    alvo_texto = {k: v for k, v in cao_alvo.items() if k not in ("url_img_short", "foto_url", "snapshot_url")}
    prompt = (
        "A PRIMEIRA IMAGEM é o CÃO ALVO. "
        "As imagens seguintes são os CANDIDATOS na mesma ordem dos IDs abaixo.\n\n"
        f"--- CÃO ALVO ---\n{json.dumps(alvo_texto, ensure_ascii=False)}\n\n"
    )
    imagens = []

    url_alvo = cao_alvo.get("url_img_short") or cao_alvo.get("snapshot_url") or cao_alvo.get("foto_url")
    if url_alvo and _verificar_url(url_alvo):
        imagens.append(AgnoImage(url=url_alvo))

    for i, cand in enumerate(lista_candidatos):
        cand_texto = {k: v for k, v in cand.items() if k not in ("foto_url", "snapshot_url")}
        url_cand = cand.get("snapshot_url") or cand.get("foto_url")
        prompt += f"--- CANDIDATO {i+1} (ID: {cand.get('id', 'N/A')}) ---\n{json.dumps(cand_texto, ensure_ascii=False)}\n\n"
        if url_cand and _verificar_url(url_cand):
            imagens.append(AgnoImage(url=url_cand))

    try:
        resposta = agente_match.run(prompt, images=imagens)
        resultado = extrair_json_robusto(resposta.content)

        if resultado:
            print(f"{'─'*50}")
            for m in resultado:
                score = m.get("probabilidade_match", 0)
                nivel = "🟢 ALTO" if score >= 75 else "🟡 MÉDIO" if score >= 40 else "🔴 BAIXO"
                just = str(m.get("justificativa_visual_e_texto", ""))[:120]
                print(f"  ID {m.get('id_candidato')} → {score}% {nivel} | {just}")
            print(f"{'─'*50}")
            return sorted(resultado, key=lambda x: x.get("probabilidade_match", 0), reverse=True)
        else:
            print("⚠️ Agente não retornou JSON válido")
            return []

    except Exception as e:
        print(f"❌ Erro no agente_match: {e}")
        return []


# ==========================================
# ORQUESTRAÇÃO (PONTOS DE ENTRADA)
# ==========================================

def fazer_match_relato_perdido(relato_data: dict) -> list[dict]:
    """
    Chamado quando um novo relato de cão PERDIDO é criado (pelo backend).
    Busca avistamentos detectados de mesma raça e retorna matches.
    """
    nome      = relato_data.get("nome_cao", "?")
    raca      = relato_data.get("raca_provavel_estimada") or relato_data.get("raca") or "Desconhecida"
    relato_id = relato_data.get("relato_id") or relato_data.get("id", "")

    print(f"\n{'='*55}")
    print(f"🔍 [MATCH] RELATO PERDIDO → buscando avistamentos")
    print(f"   🐕 {nome} | Raça: {raca} | ID: {relato_id}")
    print(f"{'='*55}")

    candidatos = buscar_avistamentos_por_raca(raca)
    if not candidatos:
        print(f"   ℹ️  Sem avistamentos de '{raca}' no banco.")
        return []

    alvo = {
        "id_cao":            relato_id,
        "raca_provavel":     raca,
        "cor_predominante":  relato_data.get("cor") or relato_data.get("corPredominante", ""),
        "porte":             relato_data.get("porte") or relato_data.get("porteInformado", ""),
        "detalhes_observados": relato_data.get("descricao", ""),
        "url_img_short":     relato_data.get("foto_url", ""),
        "visao_det_per":     "PERDIDO",
    }

    matches = realizar_match_multimodal(alvo, candidatos)
    if matches and relato_id:
        for m in matches:
            salvar_matches_no_backend(relato_id, m.get("id_candidato", ""), [m])

    return matches


def fazer_match_avistamento_detectado(avistamento_data: dict) -> list[dict]:
    """
    Chamado após um cão ser detectado em vídeo.
    Busca relatos perdidos de mesma raça e retorna matches.
    """
    raca          = avistamento_data.get("raca_provavel", "Desconhecida")
    avistamento_id = avistamento_data.get("avistamento_id") or avistamento_data.get("id", "")

    print(f"\n{'='*55}")
    print(f"🔍 [MATCH] AVISTAMENTO → buscando relatos perdidos")
    print(f"   📹 Câmera: {avistamento_data.get('camera_id')} | Raça: {raca} | ID: {avistamento_id}")
    print(f"{'='*55}")

    candidatos = buscar_relatos_perdidos_por_raca(raca)
    if not candidatos:
        print(f"   ℹ️  Sem relatos de '{raca}' perdido no banco.")
        return []

    alvo = {
        "id_cao":            avistamento_id,
        "raca_provavel":     raca,
        "cor_predominante":  avistamento_data.get("cor_predominante", ""),
        "porte":             avistamento_data.get("porte", ""),
        "detalhes_observados": avistamento_data.get("detalhes", ""),
        "url_img_short":     avistamento_data.get("snapshot_url", ""),
        "visao_det_per":     "DETECTADO",
    }

    matches = realizar_match_multimodal(alvo, candidatos)
    if matches and avistamento_id:
        for m in matches:
            salvar_matches_no_backend(m.get("id_candidato", ""), avistamento_id, [m])

    return matches
