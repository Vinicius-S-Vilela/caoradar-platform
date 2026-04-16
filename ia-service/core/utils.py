import json
import re


def extrair_json_robusto(texto_resposta: str):
    """
    Converte a resposta em texto do Gemini para dict/list Python.
    Tenta múltiplas estratégias para lidar com resíduos de markdown.
    Retorna None se nenhuma estratégia funcionar.
    """
    if not texto_resposta:
        return None

    # 1. Remove blocos de markdown ```json ... ```
    texto_limpo = texto_resposta.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(texto_limpo)
    except json.JSONDecodeError:
        pass

    # 2. Tenta extrair array [...] primeiro (agente_match retorna lista)
    try:
        match = re.search(r"\[.*\]", texto_resposta, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception:
        pass

    # 3. Fallback: tenta extrair objeto {...}
    try:
        match = re.search(r"\{.*\}", texto_resposta, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception:
        pass

    print(f"⚠️ Não foi possível extrair JSON: {texto_resposta[:200]}")
    return None
