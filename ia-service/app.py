from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from config.settings import setup_apis
from services.monitoramento import processar_video_best_shot
from services.ia_match import fazer_match_relato_perdido, fazer_match_avistamento_detectado

# ==========================================
# INICIALIZAÇÃO DO FASTAPI
# ==========================================
app = FastAPI(
    title="CAORADAR IA Service API",
    description="API para processamento de vídeos e busca por matches de cães",
    version="1.0.0"
)

# CORS: Permitir requisições do Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Mudar para URL específica em produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Inicia as configurações de APIs
setup_apis()

# ==========================================
# PYDANTIC MODELS (DTOs)
# ==========================================

class ProcessarVideoRequest(BaseModel):
    """DTO para requisição de processamento de vídeo"""
    camera_origem_id: str  # UUID da câmera de origem
    video_url: str         # URL do vídeo no Cloudinary
    data_hora: str         # Data/hora do vídeo (ex: "2026-03-17T14:30:00")


class CriarRelatoRequest(BaseModel):
    """DTO para relatório de cão perdido (visão = PERDIDO)"""
    tutor_id: Optional[str] = None  # ID do tutor (opcional, pode ser anônimo)
    nome_cao: str          # Nome do cão
    descricao: str         # Descrição (cor, características, etc)
    foto_url: str          # URL da foto do cão
    latitude: float        # Localização onde desapareceu
    longitude: float
    data_desaparecimento: str  # Data em que desapareceu
    raca: Optional[str] = None    # Raça do cão (filtro principal do match)
    porte: Optional[str] = None   # "Pequeno", "Médio", "Grande"
    cor: Optional[str] = None     # Cor predominante


class CriarAvistamentoRequest(BaseModel):
    """DTO para avistamento detectado na câmera (visão = DETECTADO)"""
    camera_id: str         # ID da câmera
    snapshot_url: str      # URL da foto capturada
    raca_provavel: str     # Raça identificada pela IA
    cor_predominante: str  # Cor
    porte: str             # Porte
    detalhes: str          # Detalhes da detecção
    latitude: float        # Coordenadas da câmera
    longitude: float
    confianca_detecao: float  # Score de confiança (0-100)


class FeaturesAvistamento(BaseModel):
    """Features extraídas pela IA (armazenadas como JSONB)"""
    racaEstimada: str
    corPredominante: str
    porte: str
    confiancaDetecao: float
    detalhesCao: str


class AvistamentoDetectado(BaseModel):
    """Representa um cão detectado no vídeo"""
    id: str                              # UUID gerado
    created_at: str                      # Timestamp de criação
    updated_at: str                      # Timestamp de atualização
    camera_origem_id: Optional[str]      # FK para tb_cameras (pode ser nulo)
    data_hora: str                       # Momento exato da detecção
    snapshot_url: str                    # URL do recorte gerado pela IA
    features: FeaturesAvistamento        # Pacote completo da IA


class ProcessarVideoResponse(BaseModel):
    """Resposta de processamento de vídeo"""
    status: str
    avistamentos: List[AvistamentoDetectado]


class CriarRelatoResponse(BaseModel):
    """Resposta de criação de relato"""
    status: str
    relato_id: str
    message: str
    matches: Optional[List[dict]] = None


class CriarAvistamentoResponse(BaseModel):
    """Resposta de criação de avistamento"""
    status: str
    avistamento_id: str
    message: str
    matches: Optional[List[dict]] = None


# ==========================================
# ENDPOINTS REST
# ==========================================

@app.get("/", tags=["Health"])
async def root():
    """Endpoint de health check"""
    return {
        "status": "🐕 CAORADAR IA Service está PRONTO!",
        "version": "1.0.0",
        "documentacao": "Acesse /docs para Swagger UI"
    }


@app.post("/api/video/process", response_model=ProcessarVideoResponse, tags=["Video Processing"])
def processar_video_admin(request: ProcessarVideoRequest):
    """
    **ENDPOINT 1: Processamento de vídeo**

    Recebe um vídeo e retorna todos os cães detectados com seus dados completos.
    A IA irá:
    1. Detectar cães com YOLO
    2. Rastreá-los frame a frame
    3. Capturar o melhor frame por cão
    4. Classificar raça, cor, porte e detalhes com Gemini
    5. Fazer upload do recorte no Cloudinary

    **Executa sincronamente - retorna os avistamentos ao final**
    """
    try:
        print(f"\n🎬 [API] Recebida requisição de processar vídeo: {request.camera_origem_id}")

        registros = processar_video_best_shot(
            request.video_url,
            request.camera_origem_id,
            request.data_hora
        )

        avistamentos = [AvistamentoDetectado(**r) for r in registros]

        return ProcessarVideoResponse(
            status="completed",
            avistamentos=avistamentos
        )

    except Exception as e:
        print(f"❌ Erro ao processar vídeo: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar vídeo: {str(e)}")


@app.post("/api/relato/criar", response_model=CriarRelatoResponse, tags=["Lost Dog Reports"])
async def criar_relato_cao_perdido(request: CriarRelatoRequest):
    """
    **ENDPOINT 2: Criar relato de cão perdido**
    
    Usuário (tutor) envia dados de um cão PERDIDO.
    A IA irá:
    1. Salvar os dados do relato
    2. Buscar matches em avistamentos detectados (visão = DETECTADO)
    3. Retornar candidates que podem ser o seu cão
    
    **Executa sincronamente - retorna matches imediatamente**
    """
    try:
        print(f"\n🐕 [API] Novo relato de cão perdido: {request.nome_cao}")
        
        # Validações
        if not request.nome_cao or not request.foto_url:
            raise HTTPException(status_code=400, detail="nome_cao e foto_url são obrigatórios")
        
        # Gerar ID do relato
        relato_id = f"REL_{request.tutor_id or 'ANONIMO'}_{request.nome_cao.replace(' ', '_')}"
        
        # Preparar dados para matching
        relato_data = {
            'relato_id': relato_id,
            'tutor_id': request.tutor_id,
            'nome_cao': request.nome_cao,
            'descricao': request.descricao,
            'foto_url': request.foto_url,
            'latitude': request.latitude,
            'longitude': request.longitude,
            'data_desaparecimento': request.data_desaparecimento,
            'raca_provavel_estimada': request.raca,
            'porte': request.porte,
            'cor': request.cor,
        }
        
        # FAZER MATCHING (dados vêm do PostgreSQL via API do backend)
        print(f"🔍 Iniciando busca de matches para {request.nome_cao}...")
        matches = fazer_match_relato_perdido(relato_data)
        
        return CriarRelatoResponse(
            status="created",
            relato_id=relato_id,
            message=f"{len(matches)} match(es) encontrado(s) para {request.nome_cao}." if matches else f"Nenhum match encontrado para {request.nome_cao} no momento.",
            matches=matches
        )
    
    except Exception as e:
        print(f"❌ Erro ao criar relato: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar relato: {str(e)}")


@app.post("/api/avistamento/criar", response_model=CriarAvistamentoResponse, tags=["Sightings"])
async def criar_avistamento_detector(request: CriarAvistamentoRequest):
    """
    **ENDPOINT 3: Criar avistamento (cão detectado na câmera)**
    
    Quando um cão é detectado por câmera (já processado pela IA).
    A IA irá:
    1. Registrar o avistamento
    2. Buscar matches em relatos de cães PERDIDOS
    3. Notificar tutores de possíveis matches
    
    **Executa sincronamente - retorna matches imediatamente**
    """
    try:
        print(f"\n📹 [API] Novo avistamento detectado na câmera: {request.camera_id}")
        
        # Validações
        if not request.camera_id or not request.snapshot_url:
            raise HTTPException(status_code=400, detail="camera_id e snapshot_url são obrigatórios")
        
        # Gerar ID do avistamento
        avistamento_id = f"AVS_{request.camera_id}_{request.raca_provavel.replace(' ', '_')}"
        
        # Preparar dados para matching
        avistamento_data = {
            'avistamento_id': avistamento_id,
            'camera_id': request.camera_id,
            'snapshot_url': request.snapshot_url,
            'raca_provavel': request.raca_provavel,
            'cor_predominante': request.cor_predominante,
            'porte': request.porte,
            'detalhes': request.detalhes,
            'latitude': request.latitude,
            'longitude': request.longitude,
            'confianca_detecao': request.confianca_detecao
        }
        
        # FAZER MATCHING
        print(f"🔍 Iniciando busca de matches para avistamento {request.raca_provavel}...")
        matches = fazer_match_avistamento_detectado(avistamento_data)
        
        return CriarAvistamentoResponse(
            status="created",
            avistamento_id=avistamento_id,
            message=f"Avistamento registrado: {request.raca_provavel}. {len(matches)} matches encontrados!",
            matches=matches
        )
    
    except Exception as e:
        print(f"❌ Erro ao criar avistamento: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao criar avistamento: {str(e)}")


# ==========================================
# TESTES LOCAIS (Descomente para testar)
# ==========================================

if __name__ == "__main__":
    import uvicorn
    
    print("\n🚀 Iniciando CAORADAR IA Service...")
    print("📚 Documentação: http://localhost:8000/docs")
    
    # Rodar o servidor
    uvicorn.run(
        "app:app",
        host="0.0.0.0",     
        port=8000  # Recarrega ao salvar arquivo (desabilitar em produção)
    )