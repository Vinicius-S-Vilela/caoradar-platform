<div align="center">

<img src="https://img.shields.io/badge/TCC-USCS%202026-1a1a2e?style=for-the-badge&logoColor=white" />

# 🐾 CaoRadar

### Plataforma de Monitoramento e Busca de Cães Perdidos com Inteligência Artificial

*Conectando tutores a câmeras urbanas de vigilância — em tempo real.*

<br/>

[![Angular](https://img.shields.io/badge/Angular_17-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot_4-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_15-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Java](https://img.shields.io/badge/Java_21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org)

<br/>

[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat-square&logo=vercel)](https://caoradar.vercel.app)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render&logoColor=black)](https://api-caoradar.onrender.com)
[![HuggingFace](https://img.shields.io/badge/IA_Service-HuggingFace_Spaces-FFD21E?style=flat-square&logo=huggingface&logoColor=black)](https://palmapedroa-caoradar-iaservice.hf.space)
[![NeonDB](https://img.shields.io/badge/Database-NeonDB-00E599?style=flat-square&logo=postgresql&logoColor=black)](https://neon.tech)

</div>

---

## 📖 Sobre o Projeto

O **CaoRadar** é um sistema SaaS de TCC desenvolvido para a **Universidade Municipal de São Caetano do Sul (USCS)**, integrado à iniciativa de vigilância urbana **Smart Sanca**.

A plataforma usa **visão computacional** (YOLOv8) e **IA multimodal** (Gemini 2.5) para:

- 📷 **Detectar cães** em vídeos de câmeras de monitoramento urbano
- 🔍 **Classificar** raça, cor, porte e características únicas automaticamente
- 🧠 **Comparar** visualmente cães detectados com relatos de cães perdidos
- 🗺️ **Localizar** e notificar tutores com score de similaridade e justificativa forense

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USUÁRIO / ADMIN                             │
│                     (Angular 17 — Vercel)                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Spring Boot 4 — Render)                 │
│                                                                     │
│  /relatos      /matches      /cameras      /users                   │
│  /avistamentos /api/video/processar  /api/integracao/avistamentos   │
│                                                                     │
│              ┌──────────────┐   ┌──────────────┐                   │
│              │  PostgreSQL  │   │  RestTemplate │                   │
│              │  (NeonDB)    │   │  (HTTP Client)│                   │
│              └──────────────┘   └──────┬────────┘                  │
└─────────────────────────────────────────┼───────────────────────────┘
                                          │ HTTP bidirecional
                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│               IA SERVICE (FastAPI — HuggingFace Spaces)             │
│                                                                     │
│   YOLOv8s ──► agente_filtro ──► agente_comparador                  │
│                                        │                            │
│                                   agente_classificador              │
│                                        │                            │
│                                   agente_match (Gemini 2.5 Pro)     │
│                                        │                            │
│                              Cloudinary (imagens)                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Fluxos Principais

<details>
<summary><b>📋 Fluxo 1 — Tutor cadastra cão perdido</b></summary>

```
1. Tutor preenche formulário (foto, raça, cor, localização)
2. Frontend faz upload das fotos direto ao Cloudinary
3. Frontend → POST /relatos?tutorId={id}  (Backend)
4. Backend salva relato no PostgreSQL (status = EM_BUSCA)
5. Backend → POST /api/match/relato  (IA Service)
6. IA busca avistamentos existentes: GET /avistamentos?raca=X
7. Gemini agente_match compara fotos (scoring forense 0–100%)
8. IA → POST /matches  (salva matches no Backend)
9. Frontend exibe matches com score ≥ 75% em overlay
```

</details>

<details>
<summary><b>📹 Fluxo 2 — Admin envia vídeo de câmera</b></summary>

```
1. Admin seleciona câmera e faz upload do vídeo
2. Frontend → Cloudinary  (upload direto, XHR com progresso 0–80%)
3. Frontend → POST /api/video/processar  (Backend)
4. Backend retorna 202 Accepted imediatamente ✅
5. Backend dispara IA em background (CompletableFuture)

   [Processamento assíncrono — 60 a 120s]
   6. IA baixa vídeo do Cloudinary
   7. YOLOv8 detecta cães frame a frame (~5fps, classe 16)
   8. agente_filtro (Gemini Flash) valida qualidade do frame
   9. agente_comparador (Gemini Flash) mantém o melhor frame por cão
  10. agente_classificador (Gemini Pro) extrai raça, cor, porte, detalhes
  11. Upload do crop para Cloudinary
  12. IA → POST /api/integracao/avistamentos  (Backend salva, retorna { "id" })
  13. IA busca relatos: GET /relatos?status=EM_BUSCA&raca=X
  14. agente_match compara snapshot vs fotos dos relatos
  15. IA → POST /matches  (persiste matches encontrados)
```

</details>

<details>
<summary><b>✅ Fluxo 3 — Tutor confirma o cão encontrado</b></summary>

```
1. Tutor acessa /matches e vê os resultados
2. Clica em "Marcar como Encontrado"
3. Frontend → PUT /relatos/{id}/status  { "status": "ENCONTRADO" }
4. Cão sai do feed público (/caes-perdidos)
5. IA para de incluir o relato em futuros matchings
6. Matches somem da página /matches
```

</details>

---

## 📁 Estrutura do Monorepo

```
caoradar-platform/
│
├── 🍃 backend/                  # Spring Boot 4 · Java 21 · Maven
│   ├── Dockerfile
│   └── src/main/java/com/caoradar/backend/
│       ├── controller/          # 7 controllers REST
│       ├── service/             # Lógica de negócio + integração IA
│       ├── model/               # Entidades JPA + Enums
│       ├── repository/          # Spring Data JPA
│       └── config/              # CORS, RestTemplate
│
├── 🐍 ia-service/               # FastAPI · Python · YOLOv8 · Gemini
│   ├── app.py                   # Endpoints + DTOs Pydantic
│   ├── core/
│   │   ├── agents.py            # 4 agentes Gemini especializados
│   │   └── utils.py             # Parser JSON robusto
│   ├── services/
│   │   ├── monitoramento.py     # Pipeline YOLO → Gemini → Cloudinary
│   │   └── ia_match.py          # Matching multimodal
│   └── config/settings.py       # Variáveis + constantes YOLO
│
├── 🅰️ frontend/                  # Angular 17 · TypeScript · Leaflet
│   └── src/app/
│       ├── core/
│       │   ├── services/        # ApiService, CaoService, CameraService
│       │   ├── models/          # Interfaces TypeScript
│       │   └── guards/          # authGuard, adminGuard
│       ├── pages/               # 8 páginas (login, menu, matches, admin…)
│       └── shared/components/   # Navbar, MapComponent, ToastComponent
│
├── 🐳 docker-compose.yml         # PostgreSQL + pgAdmin (dev local)
└── 📄 README.md
```

---

## 🛠️ Stack Tecnológica

### Backend
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Java | 21 | Linguagem |
| Spring Boot | 4.0.1 | Framework REST |
| Spring Data JPA | — | ORM / Hibernate |
| Spring Security | — | CORS dinâmico |
| PostgreSQL | 15 | Banco de dados (JSONB) |
| Maven | 3.9.6 | Build |
| Docker | — | Containerização |

### IA Service
| Tecnologia | Uso |
|-----------|-----|
| Python 3.11 | Linguagem |
| FastAPI | Framework REST |
| YOLOv8s | Detecção de cães (classe 16) |
| Gemini 2.5 Flash | Filtro e comparação de frames |
| Gemini 2.5 Pro | Classificação e matching forense |
| Agno Framework | Orquestração de agentes Gemini |
| OpenCV | Processamento de vídeo |
| Cloudinary SDK | Upload de imagens/vídeos |

### Frontend
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Angular | 17.3.0 | Framework SPA |
| TypeScript | 5.4.2 | Linguagem |
| Leaflet | 1.9.4 | Mapas interativos |
| RxJS | 7.8.0 | Estado reativo |
| Cloudinary | — | Upload direto de imagens |

### Infraestrutura
| Serviço | Uso |
|---------|-----|
| Vercel | Deploy do frontend |
| Render | Deploy do backend (Docker) |
| HuggingFace Spaces | Deploy da IA Service |
| NeonDB | PostgreSQL serverless (produção) |
| Cloudinary | CDN de imagens e vídeos |

---

## ⚡ Como Rodar Localmente

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) `>= 24`
- [Node.js](https://nodejs.org) `>= 20` + npm
- [Python](https://python.org) `>= 3.11`
- [Java 21](https://openjdk.org/projects/jdk/21/) + Maven 3.9+

---

### 1️⃣ Banco de Dados (Docker)

```bash
# Sobe PostgreSQL + pgAdmin
docker-compose up -d

# pgAdmin disponível em: http://localhost:5050
# Usuário: admin@caoradar.com | Senha: admin
# Banco:   caoradar_db (criado automaticamente)
```

---

### 2️⃣ Backend (Spring Boot)

```bash
cd backend

# Configurar variáveis (ou editar application.properties)
export DB_URL=jdbc:postgresql://localhost:5432/caoradar_db
export DB_USER=admin
export DB_PASS=admin
export IA_SERVICE_URL=http://localhost:8000
export CORS_ORIGINS=http://localhost:4200

# Rodar
mvn spring-boot:run

# API disponível em: http://localhost:8080
# Rebuild obrigatório após mudanças no código Java:
# mvn clean spring-boot:run
```

---

### 3️⃣ IA Service (FastAPI)

```bash
cd ia-service

# Instalar dependências
pip install -r requirements.txt

# Criar arquivo .env
cat > .env << EOF
GOOGLE_API_KEY=sua_chave_google_ai_studio
CLOUDINARY_CLOUD_NAME=dljzc4kbw
CLOUDINARY_API_KEY=sua_chave
CLOUDINARY_API_SECRET=seu_secret
BACKEND_API_URL=http://localhost:8080
EOF

# Rodar
python app.py

# API disponível em: http://localhost:8000
# Swagger interativo: http://localhost:8000/docs
# YOLOv8s.pt é baixado automaticamente (~22MB) na primeira execução
```

---

### 4️⃣ Frontend (Angular)

```bash
cd frontend

npm install

# Rodar em modo desenvolvimento (com proxy para o backend)
npm start

# Aplicação disponível em: http://localhost:4200
```

---

### ▶️ Ordem de inicialização recomendada

```bash
# Terminal 1 — Banco
docker-compose up -d

# Terminal 2 — Backend
cd backend && mvn spring-boot:run

# Terminal 3 — IA Service
cd ia-service && python app.py

# Terminal 4 — Frontend
cd frontend && npm start
```

---

## 🌐 Endpoints da API

<details>
<summary><b>Backend — Endpoints REST completos</b></summary>

### Relatos (Cães Perdidos)
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/relatos?tutorId={id}` | Criar relato + dispara matching IA |
| `GET` | `/relatos` | Listar com filtros (`?status` `?raca` `?cor` `?porte`) |
| `GET` | `/relatos/tutor/{tutorId}` | Relatos do usuário logado |
| `PUT` | `/relatos/{id}/status` | Atualizar status (`EM_BUSCA` / `ENCONTRADO` / `ARQUIVADO`) |
| `DELETE` | `/relatos/{id}` | Remover relato + cascade matches |

### Matches
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/matches/relato/{relatoId}` | Matches de um relato (ordem decrescente de score) |
| `POST` | `/matches` | Salvar match — chamado internamente pela IA Service |

### Câmeras e Vídeo
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/cameras` | Todas as câmeras |
| `GET` | `/cameras/ativas` | Apenas câmeras ativas |
| `POST` | `/api/video/processar` | Relay assíncrono → IA (retorna `202 Accepted`) |

### Avistamentos e Webhook
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/avistamentos` | Listar com filtros (`?codigoCamera` `?cor` `?raca`) |
| `POST` | `/api/integracao/avistamentos` | Webhook — IA envia avistamento detectado |

### Usuários
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/users` | Cadastro |
| `POST` | `/users/login` | Login |
| `GET` | `/users/{email}` | Busca por e-mail |

</details>

<details>
<summary><b>IA Service — Endpoints FastAPI</b></summary>

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/` | Health check |
| `POST` | `/api/video/process` | Processa vídeo (YOLO + Gemini), salva avistamentos e matches |
| `POST` | `/api/match/relato` | Matching de novo relato contra avistamentos existentes |

Swagger interativo disponível em `/docs` (dev: `http://localhost:8000/docs`).

</details>

---

## 🔑 Variáveis de Ambiente

<details>
<summary><b>Backend</b></summary>

| Variável | Descrição | Padrão (local) |
|----------|-----------|----------------|
| `DB_URL` | JDBC URL do PostgreSQL | `jdbc:postgresql://localhost:5432/caoradar_db` |
| `DB_USER` | Usuário do banco | `admin` |
| `DB_PASS` | Senha do banco | `admin` |
| `IA_SERVICE_URL` | URL da IA Service | `http://host.docker.internal:8000` |
| `CORS_ORIGINS` | Origens CORS (separadas por vírgula) | `http://localhost:4200` |

> Para produção (NeonDB): adicionar `?sslmode=require` na `DB_URL`.

</details>

<details>
<summary><b>IA Service</b></summary>

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `GOOGLE_API_KEY` | Chave da API Gemini (Google AI Studio) | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Nome do cloud Cloudinary | ✅ |
| `CLOUDINARY_API_KEY` | API Key Cloudinary | ✅ |
| `CLOUDINARY_API_SECRET` | Secret Cloudinary | ✅ |
| `BACKEND_API_URL` | URL do backend | `http://localhost:8080` |
| `FRONTEND_URL` | URL do frontend (CORS) | `http://localhost:4200` |
| `CORS_ORIGINS` | Origens permitidas no CORS | `http://localhost:4200` |

</details>

---

## 🗄️ Banco de Dados

### Diagrama simplificado

```
tb_users ──(1:N)──► tb_relatos_perda ──(1:N)──► tb_matches ◄──(N:1)── tb_avistamentos_ia
                          │                                                     │
                    (ElementCollection)                                   (N:1)  │
                    tb_relato_fotos                                    tb_cameras
```

### Tabelas principais

| Tabela | Descrição |
|--------|-----------|
| `tb_users` | Tutores e administradores |
| `tb_relatos_perda` | Relatos de cães perdidos |
| `tb_avistamentos_ia` | Detecções das câmeras (features em JSONB) |
| `tb_matches` | Resultados do matching (score 0.0–1.0) |
| `tb_cameras` | Câmeras de monitoramento cadastradas |
| `tb_relato_fotos` | URLs das fotos por relato (ElementCollection) |

> O schema é gerenciado automaticamente pelo Hibernate (`ddl-auto=update`). Nenhuma migration manual é necessária.

---

## 🤖 Agentes Gemini

| Agente | Modelo | Função |
|--------|--------|--------|
| `agente_filtro` | Gemini 2.5 Flash | Valida qualidade do frame (nitidez, visibilidade) |
| `agente_comparador` | Gemini 2.5 Flash | Seleciona o melhor frame entre dois candidatos |
| `agente_classificador` | Gemini 2.5 Pro | Extrai raça, cor, porte e características únicas |
| `agente_match` | Gemini 2.5 Pro | Análise forense biométrica — scoring 0–100% |

### Escala de score do matching

| Faixa | Significado |
|-------|-------------|
| 0 – 29% | Divergência anatômica clara |
| 30 – 59% | Falso positivo de raça (mesma raça, proporções diferentes) |
| 60 – 84% | Correspondência geométrica (além do padrão racial) |
| 85 – 100% | Match confirmado (geometria perfeita + identificador único) |

> O frontend exibe apenas matches com score ≥ **75%**.

## 👥 Equipe

| Nome | GitHub |
|------|--------|
| Pedro de Abreu Palma | [@pedroabreupalma](https://github.com/pedroabreupalma) |
| Douglas Primo | — |
| Vinicius Vilela | [@Vinicius-S-Vilela](https://github.com/Vinicius-S-Vilela) |
| Gabriel Shoga | — |
| Giovanni Chiarelli | — |

**Orientação:** Universidade Municipal de São Caetano do Sul (USCS) — Ciência da Computação — 2026

---

## 📚 Documentação

A documentação técnica completa do projeto está no vault Obsidian em `/docs`, cobrindo:

- Arquitetura detalhada de cada serviço
- Todos os endpoints com exemplos de request/response
- Schema completo do banco de dados
- Fluxos de integração entre os microsserviços
- Guias de configuração e deploy

---

<div align="center">

Feito com 🐾 por estudantes da USCS

</div>
