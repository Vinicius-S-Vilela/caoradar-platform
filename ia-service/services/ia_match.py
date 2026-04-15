import json
import requests
from agno.media import Image as AgnoImage

from core.agents import agente_match
from core.utils import extrair_json_robusto
from config.settings import BACKEND_API_URL


# ==========================================
# UTILIDADES
# ==========================================

def verificar_url(url):
    """Verifica se a URL está acessível antes de enviar ao agente."""
    try:
        resp = requests.head(url, timeout=5)
        if resp.status_code == 200:
            return url
        print(f"⚠️ URL inacessível -> {url}")
        return None
    except:
        return None


# ==========================================
# CONSULTA DE DADOS (BACKEND API → PostgreSQL)
# ==========================================

def buscar_caes_detectados_por_raca(raca_alvo: str):
    """Busca avistamentos detectados no banco via API do backend."""
    try:
        url = f"{BACKEND_API_URL}/avistamentos"
        params = {"raca": raca_alvo}
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()

        avistamentos = resp.json()
        # Adapta formato do backend para o formato esperado pelo matching
        candidatos = []
        for av in avistamentos:
            features = av.get("features", {})
            candidatos.append({
                "id": av.get("id"),
                "snapshot_url": av.get("snapshotUrl"),
                "features": features,
                "raca_provavel": features.get("racaEstimada", ""),
                "cor_predominante": features.get("corPredominante", ""),
                "porte": features.get("porteEstimado", ""),
                "confianca_detecao": features.get("confiancaDetecao", 0),
                "detalhes_observados": features.get("detalhesCao", ""),
            })

        print(f"🔍 [DB] {len(candidatos)} avistamento(s) de '{raca_alvo}' encontrado(s) no banco")
        return candidatos

    except requests.exceptions.ConnectionError:
        print(f"❌ Backend indisponível em {BACKEND_API_URL}")
        return []
    except Exception as e:
        print(f"❌ Erro ao buscar avistamentos no backend: {e}")
        return []


def buscar_relatos_perdidos_por_raca(raca_alvo: str):
    """Busca relatos de cães perdidos no banco via API do backend."""
    try:
        url = f"{BACKEND_API_URL}/relatos"
        params = {"status": "EM_BUSCA", "raca": raca_alvo}
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()

        relatos = resp.json()
        # Adapta formato do backend para o formato esperado pelo matching
        candidatos = []
        for rel in relatos:
            fotos = rel.get("fotosUrl", [])
            candidatos.append({
                "id": rel.get("id"),
                "relato_id": rel.get("id"),
                "nome_cao": rel.get("nomeCao", ""),
                "descricao": rel.get("descricao", ""),
                "foto_url": fotos[0] if fotos else "",
                "raca_provavel": rel.get("raca", ""),
                "cor_predominante": rel.get("corPredominante", ""),
                "porte": rel.get("porteInformado", ""),
                "latitude": rel.get("latitude"),
                "longitude": rel.get("longitude"),
            })

        print(f"🔍 [DB] {len(candidatos)} relato(s) de '{raca_alvo}' perdido(s) encontrado(s) no banco")
        return candidatos

    except requests.exceptions.ConnectionError:
        print(f"❌ Backend indisponível em {BACKEND_API_URL}")
        return []
    except Exception as e:
        print(f"❌ Erro ao buscar relatos no backend: {e}")
        return []


# ==========================================
# MATCHING MULTIMODAL (GEMINI)
# ==========================================

def realizar_match_multimodal(cao_alvo: dict, lista_candidatos: list):
    """Envia cão alvo + candidatos ao agente_match e retorna scores."""
    status_alvo = cao_alvo.get('visao_det_per', 'DESCONHECIDO').upper()
    status_candidatos = "PERDIDOS" if status_alvo == "DETECTADO" else "DETECTADOS"
    print(f"\n🧠 [IA MATCH] 1 Alvo ({status_alvo}) vs {len(lista_candidatos)} Candidatos ({status_candidatos})...")

    texto_prompt = (
        "Aqui estão os dados estruturados. "
        "A PRIMEIRA IMAGEM anexada é o CÃO ALVO. "
        "As imagens seguintes correspondem aos CANDIDATOS, na exata ordem.\n\n"
    )
    imagens_para_enviar = []

    alvo_temp = {k: v for k, v in cao_alvo.items() if k not in ('url_img_short', 'url_img_full', 'frame_origem')}
    texto_prompt += f"--- CÃO ALVO ---\nAtributos: {json.dumps(alvo_temp, ensure_ascii=False)}\n\n"
    url_alvo = cao_alvo.get('url_img_short') or cao_alvo.get('snapshot_url') or cao_alvo.get('foto_url')
    if url_alvo and verificar_url(url_alvo):
        imagens_para_enviar.append(AgnoImage(url=url_alvo))

    for i, candidato in enumerate(lista_candidatos):
        cand_temp = {k: v for k, v in candidato.items() if k not in ('url_img_short', 'url_img_full', 'frame_origem', 'foto_url', 'snapshot_url')}
        url_cand = candidato.get('snapshot_url') or candidato.get('url_img_short') or candidato.get('foto_url')
        texto_prompt += f"--- CANDIDATO {i+1} (ID: {candidato.get('id', 'N/A')}) ---\nAtributos: {json.dumps(cand_temp, ensure_ascii=False)}\n\n"
        if url_cand and verificar_url(url_cand):
            imagens_para_enviar.append(AgnoImage(url=url_cand))

    try:
        resposta = agente_match.run(texto_prompt, images=imagens_para_enviar)
        resultado = extrair_json_robusto(resposta.content)
        if resultado:
            print(f"\n{'─'*50}")
            print(f"✅ RESULTADOS DE MATCH: {len(resultado)} candidato(s)")
            print(f"{'─'*50}")
            for i, m in enumerate(resultado):
                score = m.get('probabilidade_match', 0)
                id_cand = m.get('id_candidato', 'N/A')
                justificativa = m.get('justificativa_visual_e_texto', 'Sem justificativa')
                nivel = "🟢 ALTO" if score >= 75 else "🟡 MÉDIO" if score >= 40 else "🔴 BAIXO"
                print(f"  [{i+1}] Candidato: {id_cand}")
                print(f"      Score: {score}% ({nivel})")
                print(f"      Justificativa: {justificativa[:120]}{'...' if len(str(justificativa)) > 120 else ''}")
            print(f"{'─'*50}\n")
        else:
            print("⚠️ Agente não retornou resultados parseáveis")
        return resultado
    except Exception as e:
        print(f"❌ Erro no Agente IA Match: {e}")
        return None


# ==========================================
# ORQUESTRAÇÃO DE MATCH
# ==========================================

def fazer_match_relato_perdido(relato_data: dict):
    """
    Relato de cão PERDIDO criado → busca avistamentos DETECTADOS de mesma raça no banco
    e retorna matches ordenados por probabilidade.
    """
    nome = relato_data.get('nome_cao', '?')
    raca_alvo = relato_data.get('raca_provavel_estimada') or relato_data.get('raca') or 'Desconhecida'
    cor = relato_data.get('cor') or relato_data.get('corPredominante') or '?'
    porte = relato_data.get('porte') or relato_data.get('porteInformado') or '?'

    print(f"\n{'='*50}")
    print(f"🔍 [MATCHING] NOVO RELATO DE CÃO PERDIDO")
    print(f"   🐕 Nome: {nome} | Raça: {raca_alvo} | Cor: {cor} | Porte: {porte}")
    print(f"   📍 Lat: {relato_data.get('latitude')} | Lon: {relato_data.get('longitude')}")
    print(f"{'='*50}")

    candidatos = buscar_caes_detectados_por_raca(raca_alvo)
    if not candidatos:
        print(f"   ℹ️  Nenhum avistamento de '{raca_alvo}' no banco. Match encerrado.")
        return []

    cao_alvo = {
        'id_cao': relato_data.get('relato_id', 'REL_NOVO'),
        'raca_provavel': raca_alvo,
        'cor_predominante': relato_data.get('cor') or relato_data.get('corPredominante'),
        'porte': relato_data.get('porte') or relato_data.get('porteInformado', 'Desconhecido'),
        'detalhes_observados': relato_data.get('descricao', ''),
        'url_img_short': relato_data.get('foto_url', ''),
        'visao_det_per': 'PERDIDO'
    }

    try:
        matches = realizar_match_multimodal(cao_alvo, candidatos)
        if matches:
            return sorted(matches, key=lambda x: x.get('probabilidade_match', 0), reverse=True)
    except Exception as e:
        print(f"❌ Erro ao fazer matching: {e}")

    return []


def fazer_match_avistamento_detectado(avistamento_data: dict):
    """
    Avistamento DETECTADO registrado → busca relatos PERDIDOS de mesma raça no banco
    e retorna matches ordenados por probabilidade.
    """
    raca_alvo = avistamento_data.get('raca_provavel', 'Desconhecida')
    cor = avistamento_data.get('cor_predominante', '?')
    porte = avistamento_data.get('porte', '?')

    print(f"\n{'='*50}")
    print(f"🔍 [MATCHING] NOVO AVISTAMENTO DETECTADO")
    print(f"   📹 Câmera: {avistamento_data.get('camera_id')} | Raça: {raca_alvo} | Cor: {cor} | Porte: {porte}")
    print(f"   📍 Lat: {avistamento_data.get('latitude')} | Lon: {avistamento_data.get('longitude')}")
    print(f"{'='*50}")

    candidatos = buscar_relatos_perdidos_por_raca(raca_alvo)
    if not candidatos:
        print(f"   ℹ️  Nenhum relato de '{raca_alvo}' perdido no banco. Match encerrado.")
        return []

    cao_alvo = {
        'id_cao': avistamento_data.get('avistamento_id', 'AVS_NOVO'),
        'raca_provavel': raca_alvo,
        'cor_predominante': avistamento_data.get('cor_predominante'),
        'porte': avistamento_data.get('porte', 'Desconhecido'),
        'detalhes_observados': avistamento_data.get('detalhes', ''),
        'url_img_short': avistamento_data.get('snapshot_url', ''),
        'visao_det_per': 'DETECTADO'
    }

    try:
        matches = realizar_match_multimodal(cao_alvo, candidatos)
        if matches:
            return sorted(matches, key=lambda x: x.get('probabilidade_match', 0), reverse=True)
    except Exception as e:
        print(f"❌ Erro ao fazer matching: {e}")

    return []
