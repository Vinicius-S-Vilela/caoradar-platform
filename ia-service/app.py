"""
CAORADAR IA Service
====================
API FastAPI responsável por:
  - Processar vídeos de câmeras (YOLO + Gemini)
  - Disparar matching de cães perdidos vs detectados

Endpoints:
  GET  /                        -> health check
  POST /api/video/process       -> processa vídeo, detecta cães, salva avistamentos, faz matching
  POST /api/match/relato        -> matching quando backend cria novo relato perdido

Documentação interativa: /docs
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from config.settings import setup_apis, CORS_ORIGINS, HF_TOKEN
from core.log_buffer import log_buffer, hf_log_buffers, install_stdout_capture
from core.hf_logs import fetch_hf_logs
from services.monitoramento import processar_video_best_shot
from services.ia_match import fazer_match_relato_perdido

# Sem HF_TOKEN (dev local), capturamos stdout pra alimentar o buffer.
# Em produção (Space com HF_TOKEN setado) preferimos a API do HF —
# ela vê tambem logs de boot/erro fatal que o capture local perderia.
if not HF_TOKEN:
    install_stdout_capture()

# ==========================================
# APP
# ==========================================

app = FastAPI(
    title="CAORADAR IA Service",
    description="Processamento de vídeo e matching de cães com YOLO + Gemini",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

setup_apis()


# ==========================================
# MODELS (DTOs)
# ==========================================

class ProcessarVideoRequest(BaseModel):
    """Payload enviado pelo backend após upload de vídeo."""
    camera_origem_id: str   # código da câmera (ex: CAM_001)
    video_url: str          # URL pública do vídeo (Cloudinary)
    data_hora: str          # ISO 8601, ex: "2026-04-15T14:30:00"


class FeaturesAvistamento(BaseModel):
    racaEstimada: str
    corPredominante: str
    porte: str
    confiancaDetecao: float
    detalhesCao: str


class AvistamentoDetectado(BaseModel):
    id: str
    created_at: str
    updated_at: str
    camera_origem_id: Optional[str]
    data_hora: str
    snapshot_url: str
    features: FeaturesAvistamento


class ProcessarVideoResponse(BaseModel):
    status: str
    total_detectados: int
    avistamentos: list[AvistamentoDetectado]


class MatchRelatoRequest(BaseModel):
    """Payload enviado pelo backend quando um novo relato de cão perdido é criado."""
    relato_id: Optional[str] = None   # opcional para compatibilidade com backend antigo
    nome_cao: str
    foto_url: Optional[str] = None
    raca: Optional[str] = None
    porte: Optional[str] = None
    cor: Optional[str] = None
    descricao: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class MatchRelatoResponse(BaseModel):
    status: str
    relato_id: str
    total_matches: int
    matches: list[dict]


# ==========================================
# ENDPOINTS
# ==========================================

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "service": "CAORADAR IA Service",
        "version": "2.0.0",
        "docs": "/docs",
    }


@app.post("/api/video/process", response_model=ProcessarVideoResponse, tags=["Video"])
def processar_video(request: ProcessarVideoRequest):
    """
    Processa um vídeo de câmera de segurança.

    Fluxo interno:
    1. Baixa o vídeo (se URL remota)
    2. Detecta e rastreia cães com YOLOv8
    3. Seleciona o melhor frame por cão (filtro + comparação Gemini)
    4. Classifica raça, cor, porte e detalhes (Gemini Pro)
    5. Faz upload do recorte para Cloudinary
    6. Salva avistamento no backend (PostgreSQL)
    7. Executa matching automático contra relatos perdidos
    """
    try:
        print(f"\n🎬 [API] /api/video/process — câmera: {request.camera_origem_id}")
        registros = processar_video_best_shot(
            request.video_url,
            request.camera_origem_id,
            request.data_hora,
        )
        avistamentos = [AvistamentoDetectado(**r) for r in registros]
        return ProcessarVideoResponse(
            status="completed",
            total_detectados=len(avistamentos),
            avistamentos=avistamentos,
        )
    except Exception as e:
        print(f"❌ Erro: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/logs", tags=["Admin"])
def get_logs(since: int = 0, limit: int = 500, source: str = "run"):
    """Retorna logs recentes do serviço.

    Em produção (HF_TOKEN setado), os logs vêm da API do Hugging Face Spaces
    — os mesmos exibidos em /spaces/<space>?logs=container. O `source` aceita
    "run" (container) ou "build". Em dev local, lê do capture de stdout.

    Params:
      since:  retorna apenas logs com id > since (cursor)
      limit:  limite de entradas (default 500)
      source: "run" | "build" — apenas relevante quando HF_TOKEN existe
    """
    if HF_TOKEN:
        src = source if source in ("run", "build") else "run"
        buf = hf_log_buffers[src]
        for entry in fetch_hf_logs(source=src):
            buf.add(entry["message"], timestamp=entry.get("timestamp"))
        return {
            "logs": buf.get(since_id=since, limit=limit),
            "stats": buf.stats(),
            "source": src,
        }

    return {
        "logs": log_buffer.get(since_id=since, limit=limit),
        "stats": log_buffer.stats(),
        "source": "stdout",
    }


@app.post("/api/match/relato", response_model=MatchRelatoResponse, tags=["Matching"])
@app.post("/api/relato/criar", response_model=MatchRelatoResponse, tags=["Matching"])
def match_relato(request: MatchRelatoRequest):
    """
    Dispara matching para um relato de cão perdido recém-criado.
    Deve ser chamado pelo backend após persistir um novo relato.

    Retorna os candidatos ordenados por probabilidade de match (desc).
    """
    try:
        print(f"\n🐕 [API] /api/match/relato — {request.nome_cao} (ID: {request.relato_id})")
        relato_data = {
            "relato_id":              request.relato_id,
            "nome_cao":               request.nome_cao,
            "foto_url":               request.foto_url,
            "raca_provavel_estimada": request.raca,
            "porte":                  request.porte,
            "cor":                    request.cor,
            "descricao":              request.descricao,
            "latitude":               request.latitude,
            "longitude":              request.longitude,
        }
        matches = fazer_match_relato_perdido(relato_data)
        return MatchRelatoResponse(
            status="completed",
            relato_id=request.relato_id,
            total_matches=len(matches),
            matches=matches,
        )
    except Exception as e:
        print(f"❌ Erro: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# EXECUÇÃO LOCAL
# ==========================================

if __name__ == "__main__":
    import uvicorn
    print("\n🚀 CAORADAR IA Service — http://localhost:8000/docs")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
