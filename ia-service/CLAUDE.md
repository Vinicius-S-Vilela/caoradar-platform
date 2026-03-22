# CLAUDE.md

Este arquivo fornece orientações ao Claude Code (claude.ai/code) ao trabalhar com o código neste repositório.

## Executando o Serviço

```bash
pip install -r requirements.txt
python app.py
```

O servidor inicia em `http://0.0.0.0:8000`. A documentação Swagger está disponível em `http://localhost:8000/docs`.

## Arquitetura

Este é um microsserviço FastAPI para detecção e correspondência de cães, parte da plataforma **CaoRadar** (localizador de cães perdidos). Possui três camadas:

- **`app.py`** — Aplicação FastAPI com 3 endpoints REST (processamento de vídeo, relatos de cães perdidos, registro de avistamentos)
- **`core/agents.py`** — Quatro agentes Gemini via framework `agno`: filtro, comparador, classificador e matcher
- **`services/`** — Lógica de negócio: `monitoramento.py` (processamento de vídeo com YOLO), `ia_match.py` (matching multimodal), `matching_service.py` (consulta CSV + orquestração de match), `relatos_service.py` (persistência de relatos)
- **`config/settings.py`** — Caminhos de arquivos, configuração das APIs Cloudinary/Google e parâmetros de ajuste do YOLO

## Fluxo Principal de Dados

**Processamento de Vídeo** (`POST /api/video/process`): Executa em uma thread em segundo plano. Baixa o vídeo → OpenCV lê os frames → YOLOv8 detecta cães (classe 16, confiança > 0,45, 5 fps) → Agentes Gemini filtram/comparam frames para selecionar o melhor frame por cão → Gemini classifica raça/cor/porte → envia para o Cloudinary → salva em `avistamentos_detectados.csv`.

**Matching**: Tanto `/api/relato/criar` quanto `/api/avistamento/criar` consultam o CSV oposto por raça, depois enviam as imagens ao `agente_match` (gemini-2.5-pro) para comparação forense multimodal. Retorna pontuações de probabilidade de 0–100% com justificativa.

**Armazenamento**: Atualmente baseado em CSV (dois arquivos: `avistamentos_detectados.csv` e `relatos_perdidos.csv`). A integração com banco de dados é uma migração planejada.

## Variáveis de Ambiente

Requer um arquivo `.env` com:
```
GOOGLE_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Configurações Principais (`config/settings.py`)

```python
YOLO_POR_SEGUNDO = 5          # Taxa de inferência do YOLO
TEMPO_IA_SEGUNDOS = 0.5       # Intervalo do filtro Gemini por cão rastreado
TEMPO_SUMICO_SEGUNDOS = 2     # Segundos até um rastreamento ser considerado encerrado
```

## Modelos Gemini Utilizados

- `agente_filtro`, `agente_comparador` → `gemini-2.5-flash`
- `agente_classificador`, `agente_match` → `gemini-2.5-pro`
