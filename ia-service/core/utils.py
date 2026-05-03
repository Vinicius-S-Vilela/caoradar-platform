import json
import re
import unicodedata


# Vocabulário canônico de raças (espelha frontend RACAS_DISPONIVEIS).
# Grafias seguem o padrão oficial CBKC. Quando a IA devolver variações
# (ex: "Bulldog Francês", "French Bulldog"), mapeamos para o nome canônico
# senão o filtro `?raca=` no backend nunca casa.
RACAS_CANONICAS = [
    "Golden Retriever",
    "Yorkshire Terrier",
    "Poodle",
    "Buldogue Francês",
    "Pastor Alemão",
]

_ALIASES_RACA = {
    "buldogue frances": "Buldogue Francês",
    "bulldogue frances": "Buldogue Francês",
    "bulldog frances": "Buldogue Francês",
    "buldog frances": "Buldogue Francês",
    "french bulldog": "Buldogue Francês",
    "bouledogue francais": "Buldogue Francês",
    "pastor alemao": "Pastor Alemão",
    "german shepherd": "Pastor Alemão",
    "yorkshire": "Yorkshire Terrier",
    "yorkshire terrier": "Yorkshire Terrier",
    "yorkie": "Yorkshire Terrier",
    "golden": "Golden Retriever",
    "golden retriever": "Golden Retriever",
    "poodle": "Poodle",
}


def _strip_accents(texto: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    )


def normalizar_raca(raca: str | None) -> str:
    """Mapeia variações da IA para o nome canônico usado no frontend/backend."""
    if not raca:
        return "SDR"
    chave = _strip_accents(raca).strip().lower()
    chave = re.sub(r"\s+", " ", chave)
    if chave in _ALIASES_RACA:
        return _ALIASES_RACA[chave]
    for canonica in RACAS_CANONICAS:
        if _strip_accents(canonica).lower() == chave:
            return canonica
    return raca.strip()


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
