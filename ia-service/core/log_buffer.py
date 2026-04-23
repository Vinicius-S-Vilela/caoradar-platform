"""
Buffer circular para capturar logs (prints) do IA service.
Usado pelo endpoint GET /api/logs do app.py para expor a saída ao painel admin
do frontend (visível apenas para usuarios ADMIN).
"""

import sys
from collections import deque
from datetime import datetime, timezone
from threading import Lock


class LogBuffer:
    def __init__(self, maxlen: int = 500):
        self.buffer: deque = deque(maxlen=maxlen)
        self.lock = Lock()
        self._counter = 0

    def add(self, message: str) -> None:
        with self.lock:
            self._counter += 1
            self.buffer.append({
                "id": self._counter,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "message": message,
            })

    def get(self, since_id: int = 0, limit: int = 500) -> list:
        with self.lock:
            items = list(self.buffer)
        if since_id:
            items = [i for i in items if i["id"] > since_id]
        return items[-limit:]

    def stats(self) -> dict:
        with self.lock:
            items = list(self.buffer)
        errors = sum(1 for i in items if "❌" in i["message"] or "Erro" in i["message"])
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
    """Redireciona stdout e stderr para alimentar o log_buffer.
    Idempotente: chamar múltiplas vezes não empilha wrappers."""
    if not isinstance(sys.stdout, _TeeStream):
        sys.stdout = _TeeStream(sys.__stdout__)
    if not isinstance(sys.stderr, _TeeStream):
        sys.stderr = _TeeStream(sys.__stderr__)
