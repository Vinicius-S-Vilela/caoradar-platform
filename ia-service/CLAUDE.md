# CLAUDE.md — IA Service

Microsserviço FastAPI da plataforma **CaoRadar** (localizador de cães perdidos).

## Executando localmente

```bash
pip install -r requirements.txt
python app.py
# Swagger em http://localhost:8000/docs
```

## Arquitetura

```
ia-service/
├── app.py                        # FastAPI: endpoints e DTOs
├── config/
│   └── settings.py               # Variáveis de ambiente e parâmetros YOLO
├── core/
│   ├── agents.py                 # 4 agentes Gemini (agno framework)
│   └── utils.py                  # extrair_json_robusto()
└── services/
    ├── monitoramento.py          # Pipeline de vídeo: YOLO → Gemini → Cloudinary → backend
    └── ia_match.py               # Matching multimodal: busca no backend → Gemini → salva matches
```

## Endpoints

| Método | Rota                  | Descrição                                              |
|--------|-----------------------|--------------------------------------------------------|
| GET    | `/`                   | Health check                                           |
| POST   | `/api/video/process`  | Processa vídeo, detecta cães, salva avistamentos, match |
| POST   | `/api/match/relato`   | Matching quando backend cria novo relato perdido        |

## Fluxo de Processamento de Vídeo

```
Frontend → Backend /api/video/processar → IA /api/video/process
    ↓
  YOLOv8 detecta cães
    ↓
  Gemini (filtro + comparador) → melhor frame por cão
    ↓
  Gemini classificador → raça, cor, porte, detalhes
    ↓
  Cloudinary → URL do recorte
    ↓
  Backend POST /api/integracao/avistamentos → salva no PostgreSQL
    ↓
  Matching automático → busca relatos perdidos de mesma raça
    ↓
  Backend POST /matches → salva matches encontrados
```

## Fluxo de Matching ao Criar Relato

```
Frontend → Backend POST /relatos → Backend chama IA POST /api/match/relato
    ↓
  IA busca avistamentos no backend: GET /avistamentos?raca=X
    ↓
  Gemini agente_match → scoring forense 0–100%
    ↓
  Backend POST /matches → salva matches (score >= 40)
```

## Variáveis de Ambiente (.env)

```env
GOOGLE_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
BACKEND_API_URL=https://api-caoradar.onrender.com
FRONTEND_URL=https://caoradar.vercel.app
CORS_ORIGINS=https://caoradar.vercel.app,http://localhost:4200
```

## Agentes Gemini (core/agents.py)

| Agente             | Modelo              | Função                                              |
|--------------------|---------------------|-----------------------------------------------------|
| agente_filtro      | gemini-2.5-flash    | Valida se o frame é nítido e mostra características |
| agente_comparador  | gemini-2.5-flash    | Escolhe o melhor entre dois frames do mesmo cão     |
| agente_classificador | gemini-2.5-pro    | Extrai raça, cor, porte, detalhes únicos            |
| agente_match       | gemini-2.5-pro      | Scoring forense multimodal (0–100%)                 |

## Endpoints esperados no Backend

O IA Service consome estes endpoints do backend:

- `GET  /avistamentos?raca=X`            — busca avistamentos para matching
- `GET  /relatos?status=EM_BUSCA&raca=X` — busca relatos para matching
- `POST /api/integracao/avistamentos`    — salva avistamento detectado
- `POST /matches`                        — salva resultado de match
