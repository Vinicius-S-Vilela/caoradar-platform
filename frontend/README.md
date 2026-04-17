# CaoRadar — Frontend

Angular 17 SPA do CaoRadar (TCC). Cadastro de cães perdidos, visualização de matches da IA e mapa de avistamentos.

## Rodando localmente

```bash
npm install
npm start       # http://localhost:4200
```

Para produção:

```bash
npm run build:prod
```

## Configuração

`src/environments/environment.ts` define `apiUrl`. Em desenvolvimento usa `/api-proxy` e o `proxy.conf.json` redireciona para o backend local (`http://localhost:8080`). Em produção aponta para a API hospedada.

Upload de fotos usa Cloudinary — preset configurado no mesmo arquivo.

## Estrutura

```
src/app/
├── core/
│   ├── guards/        authGuard, adminGuard, noAuthGuard
│   ├── models/        Cao, User, Camera, Match, helpers
│   └── services/      Api, Auth, Cao, Camera, Cloudinary, Notification
├── pages/
│   ├── login, register
│   ├── menu           tela inicial (notificações + mapa)
│   ├── dashboard      "Meus Cães" com modal de detalhes
│   ├── cadastro-cao   formulário + Leaflet + matching da IA
│   ├── caes-perdidos  listagem pública
│   ├── caes-encontrados  matches agrupados por relato
│   └── admin          painel de câmeras (apenas admin)
└── shared/components
    ├── navbar, toast
    ├── map            Leaflet + 3 tipos de pin (perdido/avistamento/encontrado)
    └── camera-card
```

## Rotas

| Rota | Auth | Descrição |
|---|---|---|
| `/` | — | redireciona para `/menu` |
| `/menu` | sim | tela inicial |
| `/dashboard` | sim | meus cães |
| `/cadastro-cao` | sim | cadastrar cão perdido |
| `/caes-perdidos` | não | listagem pública |
| `/matches` | sim | matches da IA |
| `/admin` | admin | gerenciar câmeras |

## Integração

- **Backend Spring Boot** (porta 8080): CRUD de relatos, matches, usuários.
- **IA Service** (porta 8000): chamado pelo backend após cadastro; compara visualmente e aplica peso de proximidade geográfica.
- **Cloudinary**: hospedagem das fotos.
