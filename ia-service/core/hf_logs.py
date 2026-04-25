"""
Cliente para a API de logs do Hugging Face Spaces.

A UI do HF expõe os logs de container e build via:
  GET https://huggingface.co/api/spaces/{owner}/{space}/logs/run
  GET https://huggingface.co/api/spaces/{owner}/{space}/logs/build

A resposta é um stream Server-Sent Events: cada linha começa com `data: {json}`.
Conectamos com timeout curto, lemos o backlog até o stream "calar" e fechamos.
"""

import json
import time
from typing import Iterable, Optional

import requests

from config.settings import HF_SPACE_ID, HF_TOKEN

HF_API_BASE = "https://huggingface.co/api/spaces"

# tempos curtos: o HF entrega o backlog imediato e depois fica esperando
# por novos eventos — nao queremos segurar a request do frontend.
CONNECT_TIMEOUT = 5.0
READ_TIMEOUT    = 2.0
HARD_DEADLINE   = 4.0   # corte global, mesmo que o stream nao silencie


def _parse_sse_line(raw: str) -> Optional[dict]:
    """Parseia uma linha SSE do HF. Retorna {timestamp, message} ou None."""
    if not raw:
        return None
    line = raw.strip()
    if not line or line.startswith(":"):
        return None
    if line.startswith("data:"):
        line = line[5:].strip()
    if not line:
        return None
    # tenta JSON; se falhar, trata como texto cru
    try:
        obj = json.loads(line)
    except Exception:
        return {"timestamp": None, "message": line}

    if isinstance(obj, dict):
        ts = obj.get("timestamp") or obj.get("time") or obj.get("ts")
        msg = obj.get("data") or obj.get("message") or obj.get("line") or obj.get("log")
        if msg is None:
            msg = json.dumps(obj, ensure_ascii=False)
        return {"timestamp": ts, "message": str(msg).rstrip()}
    return {"timestamp": None, "message": str(obj)}


def fetch_hf_logs(source: str = "run") -> Iterable[dict]:
    """Busca o backlog atual de logs do Space.

    source: "run" (container) ou "build".
    Yields: dicts {timestamp, message}.
    """
    if not HF_TOKEN:
        return
    if source not in ("run", "build"):
        source = "run"

    url = f"{HF_API_BASE}/{HF_SPACE_ID}/logs/{source}"
    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Accept": "text/event-stream",
    }

    started = time.monotonic()
    try:
        with requests.get(
            url,
            headers=headers,
            stream=True,
            timeout=(CONNECT_TIMEOUT, READ_TIMEOUT),
        ) as r:
            r.raise_for_status()
            for raw in r.iter_lines(decode_unicode=True):
                if raw is None:
                    continue
                entry = _parse_sse_line(raw)
                if entry:
                    yield entry
                if time.monotonic() - started > HARD_DEADLINE:
                    break
    except requests.exceptions.ReadTimeout:
        # esperado: significa que o backlog acabou e o stream esta ocioso
        return
    except requests.exceptions.HTTPError as e:
        status = e.response.status_code if e.response is not None else "?"
        yield {
            "timestamp": None,
            "message": f"[hf_logs] HF API HTTP {status} em /{source} — verifique HF_TOKEN/HF_SPACE_ID",
        }
    except Exception as e:
        yield {"timestamp": None, "message": f"[hf_logs] erro ao consultar HF: {e}"}
