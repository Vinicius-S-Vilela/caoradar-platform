"""
Buffer circular de logs do IA service.

Duas fontes alimentam o buffer:
  - capture local de stdout/stderr (fallback p/ dev local sem HF_TOKEN)
  - poll na API do Hugging Face (preferencial, em produção no Space)

O buffer dedupa entradas por hash de (timestamp + message) para que polls
repetidos na API do HF não causem entradas duplicadas. Cada entrada nova
recebe um id incremental, usado pelo frontend como cursor (?since=N).
"""

import hashlib
import sys
from collections import deque
from datetime import datetime, timezone
from threading import Lock
from typing import Optional


class LogBuffer:
    def __init__(self, maxlen: int = 500, dedupe_window: int = 2000):
        self.buffer: deque = deque(maxlen=maxlen)
        self._seen: deque = deque(maxlen=dedupe_window)
        self._seen_set: set = set()
        self.lock = Lock()
        self._counter = 0

    @staticmethod
    def _hash(timestamp: Optional[str], message: str) -> str:
        h = hashlib.md5()
        h.update((timestamp or "").encode("utf-8", "ignore"))
        h.update(b"|")
        h.update(message.encode("utf-8", "ignore"))
        return h.hexdigest()

    def add(self, message: str, timestamp: Optional[str] = None) -> bool:
        """Adiciona um log se ainda não estiver no buffer (dedupe).
        Retorna True se foi adicionado, False se duplicado."""
        ts = timestamp or datetime.now(timezone.utc).isoformat()
        key = self._hash(ts, message)
        with self.lock:
            if key in self._seen_set:
                return False
            self._counter += 1
            entry = {
                "id": self._counter,
                "timestamp": ts,
                "message": message,
            }
            self.buffer.append(entry)
            if len(self._seen) == self._seen.maxlen:
                old = self._seen.popleft()
                self._seen_set.discard(old)
            self._seen.append(key)
            self._seen_set.add(key)
            return True

    def get(self, since_id: int = 0, limit: int = 500) -> list:
        with self.lock:
            items = list(self.buffer)
        if since_id:
            items = [i for i in items if i["id"] > since_id]
        return items[-limit:]

    def stats(self) -> dict:
        with self.lock:
            items = list(self.buffer)
        errors = sum(1 for i in items if "❌" in i["message"] or "erro" in i["message"].lower())
        videos = sum(1 for i in items if "/api/video/process" in i["message"])
        matches = sum(1 for i in items if "/api/match/relato" in i["message"])
        return {
            "total": len(items),
            "errors": errors,
            "videos_processados": videos,
            "matches_iniciados": matches,
            "last_id": items[-1]["id"] if items else 0,
        }


log_buffer = LogBuffer(maxlen=500)
hf_log_buffers: dict = {
    "run":   LogBuffer(maxlen=500),
    "build": LogBuffer(maxlen=500),
}


class _TeeStream:
    """Escreve no stream original + alimenta o log_buffer linha a linha."""

    def __init__(self, original):
        self.original = original
        self._pending = ""

    def write(self, data: str) -> int:
        try:
            self.original.write(data)
        except Exception:
            pass
        self._pending += data
        while "\n" in self._pending:
            line, self._pending = self._pending.split("\n", 1)
            line = line.rstrip("\r")
            if line.strip():
                log_buffer.add(line)
        return len(data)

    def flush(self) -> None:
        try:
            self.original.flush()
        except Exception:
            pass

    def isatty(self) -> bool:
        try:
            return self.original.isatty()
        except Exception:
            return False


def install_stdout_capture() -> None:
    """Redireciona stdout/stderr para alimentar o log_buffer (fallback local).
    Idempotente: chamar múltiplas vezes não empilha wrappers."""
    if not isinstance(sys.stdout, _TeeStream):
        sys.stdout = _TeeStream(sys.__stdout__)
    if not isinstance(sys.stderr, _TeeStream):
        sys.stderr = _TeeStream(sys.__stderr__)
