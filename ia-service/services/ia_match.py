import json
import os
import requests
import pandas as pd
from datetime import datetime
from agno.media import Image as AgnoImage

from core.agents import agente_match
from core.utils import extrair_json_robusto
from config.settings import CSV_AVISTAMENTOS_DETECTADOS, CSV_RELATOS_PERDIDOS


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
# CONSULTA DE DADOS (CSV)
# ==========================================

def buscar_caes_detectados_por_raca(raca_alvo: str):
    """Retorna avistamentos detectados com a mesma raça."""
    if not os.path.exists(CSV_AVISTAMENTOS_DETECTADOS):
        print(f"⚠️ CSV de avistamentos não encontrado: {CSV_AVISTAMENTOS_DETECTADOS}")
        return []
    try:
        df = pd.read_csv(CSV_AVISTAMENTOS_DETECTADOS)
        df['features'] = df['features'].apply(lambda x: json.loads(x) if isinstance(x, str) else x)
        candidatos = df[df['features'].apply(lambda f: f.get('racaEstimada', '').lower() == raca_alvo.lower())].to_dict('records')
        print(f"🔍 {len(candidatos)} cão(ões) '{raca_alvo}' detectado(s) encontrado(s)")
        return candidatos
    except Exception as e:
        print(f"❌ Erro ao ler CSV de avistamentos: {e}")
        return []


def buscar_relatos_perdidos_por_raca(raca_alvo: str):
    """Retorna relatos de cães perdidos com a mesma raça."""
    if not os.path.exists(CSV_RELATOS_PERDIDOS):
        print(f"⚠️ CSV de relatos não encontrado: {CSV_RELATOS_PERDIDOS}")
        return []
    try:
        df = pd.read_csv(CSV_RELATOS_PERDIDOS)
        candidatos = df[df['raca_provavel'].str.lower() == raca_alvo.lower()].to_dict('records')
        print(f"🔍 {len(candidatos)} relato(s) de '{raca_alvo}' perdido(s) encontrado(s)")
        return candidatos
    except Exception as e:
        print(f"❌ Erro ao ler CSV de relatos: {e}")
        return []


def salvar_relato_perdido(relato_data: dict):
    """Persiste um novo relato de cão perdido no CSV."""
    try:
        nova_linha = {
            'relato_id': relato_data.get('relato_id'),
            'tutor_id': relato_data.get('tutor_id', 'ANONIMO'),
            'nome_cao': relato_data.get('nome_cao'),
            'descricao': relato_data.get('descricao', ''),
            'foto_url': relato_data.get('foto_url'),
            'latitude': relato_data.get('latitude'),
            'longitude': relato_data.get('longitude'),
            'data_desaparecimento': relato_data.get('data_desaparecimento'),
            'raca_provavel': relato_data.get('raca_provavel_estimada', 'Desconhecida'),
            'porte': relato_data.get('porte', 'Desconhecido'),
            'cor': relato_data.get('cor', 'Desconhecida'),
            'timestamp_criacao': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'status': 'ATIVO'
        }

        if os.path.exists(CSV_RELATOS_PERDIDOS):
            df_final = pd.concat([pd.read_csv(CSV_RELATOS_PERDIDOS), pd.DataFrame([nova_linha])], ignore_index=True)
        else:
            df_final = pd.DataFrame([nova_linha])

        df_final.to_csv(CSV_RELATOS_PERDIDOS, index=False)
        print(f"✅ Relato '{relato_data.get('nome_cao')}' salvo.")
        return relato_data.get('relato_id')

    except Exception as e:
        print(f"❌ Erro ao salvar relato: {e}")
        return None


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
        texto_prompt += f"--- CANDIDATO {i+1} ---\nAtributos: {json.dumps(cand_temp, ensure_ascii=False)}\n\n"
        if url_cand and verificar_url(url_cand):
            imagens_para_enviar.append(AgnoImage(url=url_cand))

    try:
        resposta = agente_match.run(texto_prompt, images=imagens_para_enviar)
        resultado = extrair_json_robusto(resposta.content)
        if resultado:
            print(f"✅ {len(resultado)} resultado(s) de match obtido(s)")
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
    Relato de cão PERDIDO criado → busca avistamentos DETECTADOS de mesma raça
    e retorna matches ordenados por probabilidade.
    """
    print(f"\n🔍 [MATCHING] Cão perdido: {relato_data.get('nome_cao')}")

    raca_alvo = relato_data.get('raca_provavel_estimada') or 'Desconhecida'
    candidatos = buscar_caes_detectados_por_raca(raca_alvo)
    if not candidatos:
        return []

    cao_alvo = {
        'id_cao': relato_data.get('relato_id', 'REL_NOVO'),
        'raca_provavel': raca_alvo,
        'cor_predominante': relato_data.get('cor'),
        'porte': relato_data.get('porte', 'Desconhecido'),
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
    Avistamento DETECTADO registrado → busca relatos PERDIDOS de mesma raça
    e retorna matches ordenados por probabilidade.
    """
    print(f"\n🔍 [MATCHING] Avistamento câmera: {avistamento_data.get('camera_id')}")

    raca_alvo = avistamento_data.get('raca_provavel', 'Desconhecida')
    candidatos = buscar_relatos_perdidos_por_raca(raca_alvo)
    if not candidatos:
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
