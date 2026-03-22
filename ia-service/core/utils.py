import json
import re
import requests
from PIL import Image
from io import BytesIO

def extrair_json_robusto(texto_resposta):
    """Garante que a resposta da IA vire um Dicionário/Lista Python, mesmo com sujeira no texto."""
    try:
        texto_limpo = texto_resposta.replace("```json", "").replace("```", "").strip()
        return json.loads(texto_limpo)
    except json.JSONDecodeError:
        # Tenta extrair array [...] primeiro (agente_match retorna lista)
        try:
            match = re.search(r"\[.*\]", texto_resposta, re.DOTALL)
            if match:
                return json.loads(match.group())
        except:
            pass
        # Fallback: tenta extrair objeto {...}
        try:
            match = re.search(r"\{.*\}", texto_resposta, re.DOTALL)
            if match:
                return json.loads(match.group())
        except:
            pass
        print(f"⚠️ Não foi possível extrair JSON da resposta: {texto_resposta[:200]}")
        return None

def carregar_imagem(url):
    """Baixa a imagem da URL para a memória, evitando quebrar o código se o link for inválido."""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            print(f"⚠️ Aviso: Imagem inacessível (Erro HTTP {response.status_code}) -> {url}")
            return None
        return Image.open(BytesIO(response.content)).convert("RGB")
    except Exception as e:
        print(f"❌ Erro interno ao processar a imagem {url}: {e}")
        return None