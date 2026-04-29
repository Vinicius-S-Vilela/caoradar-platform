# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo shape

Monorepo with three independently deployed services:

- `backend/` — Spring Boot 4 + Java 21, deployed to Render via `backend/Dockerfile`
- `ia-service/` — FastAPI + Python 3.11 (YOLOv8 + Gemini agents via Agno framework), deployed to HuggingFace Spaces
- `frontend/` — Angular 17 SPA, deployed to Vercel

Database is PostgreSQL (NeonDB in prod, local Docker via `docker-compose.yml`). Image/video CDN is Cloudinary. There is a more detailed `ia-service/CLAUDE.md` for that subservice.

## Common commands

### Backend (`backend/`)
```bash
mvn spring-boot:run               # run dev server on :8080
mvn clean spring-boot:run         # full rebuild — required after Java changes
mvn -Dtest=ClassName#method test  # run a single test
mvn clean package -DskipTests     # build the jar (same as Dockerfile stage 1)
```

### IA Service (`ia-service/`)
```bash
pip install -r requirements.txt
python app.py                     # FastAPI on :8000, Swagger at /docs
```
First run downloads `yolov8s.pt` (~22 MB). `.env` must define `GOOGLE_API_KEY` and the four `CLOUDINARY_*` vars or agents will fail at runtime.

### Frontend (`frontend/`)
```bash
npm start                         # ng serve on :4200, with proxy.conf.json
npm run build:prod                # production build (used by Vercel)
npm test                          # Karma + Jasmine
ng test --include='**/foo.spec.ts'  # single spec
```
`proxy.conf.json` rewrites `/api-proxy/*` → Render backend and `/ia-proxy/*` → HF IA Space, so dev `ng serve` talks to **production** services by default — there is no local-only mode wired into the proxy. Point services at localhost manually if you need fully local dev.

### Local DB
```bash
docker-compose up -d              # PostgreSQL + pgAdmin (admin@caoradar.com / admin)
```

## Architecture — things that span multiple files

### Three-way request flow
The three services call each other in both directions; this is not a strict layering:
- **Frontend → Backend**: standard REST under `/relatos`, `/matches`, `/cameras`, `/users`, `/avistamentos`.
- **Frontend → Cloudinary direct**: photos and videos are uploaded from the browser straight to Cloudinary (XHR with progress). The backend never receives the binary — only the resulting URL.
- **Backend → IA Service**: `RelatoService` triggers `/api/match/relato`; `VideoController` proxies to `/api/video/process`. Uses `RestTemplate` (configured in `config/RestClientConfig.java`).
- **IA Service → Backend (callbacks)**: IA persists results back via `POST /api/integracao/avistamentos` (webhook in `WebhookIAController`) and `POST /matches`. It also reads via `GET /avistamentos?raca=X` and `GET /relatos?status=EM_BUSCA&raca=X` to drive matchings.

When changing endpoint shapes or query params on either side, search the *other* service for hard-coded URLs/paths — they are not generated from a shared schema.

### Async video pipeline
`POST /api/video/processar` returns **`202 Accepted` immediately** and dispatches the IA call on a `CompletableFuture`. The IA pipeline (YOLO → `agente_filtro` → `agente_comparador` → `agente_classificador` → Cloudinary upload → backend webhook → `agente_match`) takes 60–120 s and runs entirely server-side; the frontend learns about results via polling/streamed logs, not via the original HTTP response.

### HF logs proxy + SSE
`HfLogsService` (backend) is a deduped, in-memory buffer + SSE relay over the HuggingFace Spaces logs API, used by the admin panel. Two cache rules to respect when editing:
- Polling endpoint refetches HF only every `CACHE_TTL_MS = 10s` (or when `force=true`); the buffer is capped at 500 entries.
- The streaming endpoint (`openStream`) uses a virtual thread per client and auto-reconnects to HF on stream close — don't replace it with a plain `Thread.start` without preserving the reconnect loop.
Requires `HF_TOKEN` env var; without it the service degrades to "disabled" instead of erroring.

### Schema management
`spring.jpa.hibernate.ddl-auto=update` — Hibernate mutates the schema on boot. There are **no migrations**. Renaming/removing JPA fields will silently leave dead columns in NeonDB; additive changes are safe but destructive ones need manual SQL.

### Match score threshold
The IA persists matches with `score ≥ 0.40`, but the frontend only renders `score ≥ 0.75`. If a match "isn't appearing", check both thresholds before assuming the pipeline failed.

### CORS
Both backend (`SecurityConfig`) and IA service (`config/settings.py`) read a comma-separated `CORS_ORIGINS` env var. Adding a new frontend origin requires updating both.

## Deploy

- **Backend**: push to the Render-tracked branch → Render rebuilds `backend/Dockerfile` automatically. Verify `DB_URL` (with `?sslmode=require` for NeonDB), `IA_API_URL`, and `CORS_ORIGINS` in the Render dashboard.
- **Frontend**: Vercel auto-deploys from the repo using `npm run build:vercel`.
- **IA Service**: HuggingFace Spaces auto-builds on push. Logs are exposed back into the app via the backend's `HfLogsService`.
