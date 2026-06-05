# 3. Referência da API REST

[← Anterior: Modelo de Dados](./02-modelo-de-dados.md) · [Índice](./README.md)

---

Todos os endpoints retornam/recebem **JSON**. Não há prefixo global de versão; cada controller define seu próprio caminho base. Atualmente **todos os endpoints são públicos** (Spring Security com `permitAll` — ver [doc 5](./05-seguranca-e-config.md)).

## Visão geral dos controllers

| Controller | Base | Consumidor | Documento |
|------------|------|-----------|-----------|
| `UserController` | `/users` | Front-end | [§3.1](#31-usercontroller----users) |
| `RelatoController` | `/relatos` | Front-end | [§3.2](#32-relatocontroller----relatos) |
| `AvistamentoController` | `/avistamentos` | Front-end | [§3.3](#33-avistamentocontroller----avistamentos) |
| `CameraController` | `/cameras` | Front-end | [§3.4](#34-cameracontroller----cameras) |
| `MatchController` | `/matches` | Front-end **e** IA Service | [§3.5](#35-matchcontroller----matches) |
| `VideoController` | `/api/video` | Front-end | [§3.6](#36-videocontroller----apivideo) |
| `WebhookIAController` | `/api/integracao` | **IA Service** | [§3.7](#37-webhookiacontroller----apiintegracao) |
| `HfLogsController` | `/admin` | Painel admin | [§3.8](#38-hflogscontroller----admin) |

---

## 3.1. `UserController` — `/users`

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/users` | Cria um usuário (tutor). Corpo: objeto `User`. O CPF é normalizado para só dígitos. |
| `GET` | `/users/{email}` | Busca usuário por e-mail. `404` se não existir. |
| `POST` | `/users/login` | Autentica. Corpo: `{ "email", "senha" }`. Retorna o `User` em caso de sucesso ou `401` se inválido. |

**Exemplo — criar usuário:**
```http
POST /users
Content-Type: application/json

{ "nome": "Maria", "cpf": "123.456.789-00", "email": "maria@ex.com",
  "passwordHash": "minhaSenha", "telefone": "11999990000", "role": "TUTOR" }
```

**Exemplo — login:**
```http
POST /users/login
{ "email": "maria@ex.com", "senha": "minhaSenha" }
```
> ⚠️ A "senha" é comparada diretamente com `passwordHash` (sem hashing real). Detalhe e implicações na [doc 5](./05-seguranca-e-config.md).

---

## 3.2. `RelatoController` — `/relatos`

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/relatos?tutorId={uuid}` | Cria um relato de perda vinculado ao tutor. **Dispara o matching na IA.** Retorna `400` se o tutor não existir. |
| `GET` | `/relatos/tutor/{tutorId}` | Lista todos os relatos de um tutor. |
| `GET` | `/relatos?status=&cor=&porte=&raca=` | Lista relatos com filtros opcionais combináveis. |
| `PUT` | `/relatos/{id}/status` | Atualiza o status. Corpo: `{ "status": "ENCONTRADO" }`. `400` se faltar o campo; `404` se o relato não existir. |
| `DELETE` | `/relatos/{id}` | Exclui o relato (e seus matches em cascata). `204` em sucesso, `404` se não existir. |

**Exemplo — criar relato (aciona a IA):**
```http
POST /relatos?tutorId=4f9c...
{
  "nomeCao": "Thor", "raca": "Vira-lata", "corPredominante": "Caramelo",
  "porteInformado": "Médio", "descricao": "Coleira azul",
  "latitude": -23.62, "longitude": -46.55,
  "fotosUrl": ["https://.../thor1.jpg"]
}
```
Ao salvar, o back-end faz `POST {IA_API_URL}/api/match/relato` em segundo plano. Ver [doc 4 — Fluxo A](./04-servicos-e-fluxos.md#42-fluxo-a--criação-de-relato-e-disparo-do-matching).

---

## 3.3. `AvistamentoController` — `/avistamentos`

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/avistamentos?codigoCamera=&cor=&raca=` | Lista avistamentos com filtros opcionais. **Cor e raça são filtradas dentro do JSONB** (`features`) em memória via Java Streams. |

**Exemplo:**
```http
GET /avistamentos?codigoCamera=CAM-01&cor=Caramelo&raca=Vira-lata
```

---

## 3.4. `CameraController` — `/cameras`

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/cameras` | Lista todas as câmeras cadastradas. |
| `GET` | `/cameras/ativas` | Lista apenas câmeras com `ativa = true`. |

---

## 3.5. `MatchController` — `/matches`

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/matches/relato/{relatoId}` | Lista os matches de um relato, **ordenados por score (maior primeiro)**. |
| `POST` | `/matches` | **Chamado pelo IA Service** para persistir um match final. Corpo abaixo. |

**Corpo do `POST /matches` (enviado pela IA):**
```json
{
  "relatoId": "uuid-do-relato",
  "avistamentoId": "uuid-do-avistamento",
  "score": 0.87,
  "justificativa": "Mesma raça, cor e coleira compatíveis."
}
```
Cria um `Match` com status `PENDENTE_ANALISE`. Retorna `{ "id": "..." }`, ou `400` se relato/avistamento não existirem.

---

## 3.6. `VideoController` — `/api/video`

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/video/processar` | Recebe um vídeo de câmera e **retorna `202 Accepted` imediatamente**, disparando o processamento da IA em *background*. |

**Corpo:**
```json
{ "cameraId": "CAM-01", "videoUrl": "https://.../video.mp4", "dataHora": "2026-06-04T10:00:00" }
```

Internamente faz `POST {IA_API_URL}/api/video/process` num `CompletableFuture` (não bloqueia a resposta). A IA pode levar 60–120 s; por isso o `202`. Ver [doc 4 — Fluxo B](./04-servicos-e-fluxos.md#43-fluxo-b--processamento-de-vídeo-da-câmera).

---

## 3.7. `WebhookIAController` — `/api/integracao`

> **Endpoint de entrada do IA Service** — é a "porta dos fundos" pela qual a IA devolve o que detectou.

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/integracao/avistamentos` | Recebe um avistamento detectado pela IA, persiste e dispara o matching preliminar. |

**Corpo (enviado pelo Python):**
```json
{
  "codigoCamera": "CAM-01",
  "snapshotUrl": "https://.../frame.jpg",
  "features": {
    "racaEstimada": "Golden Retriever", "corPredominante": "Caramelo",
    "porteEstimado": "Grande", "confiancaDetecao": 0.94,
    "caracteristicasExtras": ["coleira vermelha"]
  }
}
```
Delega a `ProcessamentoIAService.processarNovoAvistamento`, que vincula a câmera, salva o avistamento e gera matches preliminares (ver [doc 4](./04-servicos-e-fluxos.md#44-o-motor-de-matching-processamentoiaservice)). Retorna `{ "id", "message" }`.

---

## 3.8. `HfLogsController` — `/admin`

Proxy de observabilidade dos logs do IA Service hospedado no Hugging Face.

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/admin/ia-logs?since=&limit=&source=&force=` | Logs por **polling**. `source` = `run` (default) ou `build`. Retorna `{ logs, stats, source }`. |
| `GET` | `/admin/ia-logs/stream?source=` | Logs em **tempo real** via **SSE** (`text/event-stream`). |

Implementação (cache, deduplicação, reconexão) na [doc 4 §4.6](./04-servicos-e-fluxos.md#46-hflogsservice--proxy-de-logs-da-ia).

---

## Resumo dos códigos de status usados

| Código | Quando |
|--------|--------|
| `200 OK` | operação síncrona bem-sucedida |
| `202 Accepted` | vídeo recebido; processamento em background |
| `204 No Content` | exclusão bem-sucedida |
| `400 Bad Request` | entrada inválida / entidade referenciada inexistente |
| `401 Unauthorized` | credenciais inválidas no login |
| `404 Not Found` | recurso não encontrado |
| `500 Internal Server Error` | erro inesperado ao persistir |

---

[← Anterior: Modelo de Dados](./02-modelo-de-dados.md) · [Índice](./README.md) · [Próximo: Serviços e Fluxos →](./04-servicos-e-fluxos.md)
