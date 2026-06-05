# Documentação do Back-end — CãoRadar

> API REST transacional do **CãoRadar**, o sistema de identificação e reidentificação de cães perdidos por meio de Visão Computacional e IA Generativa Multimodal (TCC — Ciência da Computação, USCS).

Este back-end é o **núcleo transacional** da plataforma. Ele guarda o estado do sistema (usuários, relatos de perda, câmeras, avistamentos e matches), expõe a API consumida pelo front-end em Angular e atua como **orquestrador** do microsserviço cognitivo de IA (Python), que faz a detecção e o reconhecimento dos cães.

```
┌─────────────┐      REST       ┌──────────────────┐     REST/Webhook    ┌────────────────────┐
│  Front-end  │ ───────────────▶│   Back-end Java   │◀───────────────────▶│  IA Service Python  │
│  (Angular)  │◀─────────────── │   (Spring Boot)   │                     │ (YOLOv8 + Agno/Gemini)│
└─────────────┘                 └──────────────────┘                     └────────────────────┘
                                          │
                                          ▼
                                 ┌──────────────────┐
                                 │   PostgreSQL      │
                                 │ (relacional+JSONB)│
                                 └──────────────────┘
```

---

## Índice da documentação

| # | Documento | Conteúdo |
|---|-----------|----------|
| 1 | [Arquitetura e Visão Geral](./01-arquitetura.md) | Stack, camadas, papel de cada componente e como o back-end se integra ao IA Service |
| 2 | [Modelo de Dados](./02-modelo-de-dados.md) | Entidades JPA, relacionamentos, enums e a persistência híbrida (JSONB) |
| 3 | [Referência da API REST](./03-api-rest.md) | Todos os endpoints, parâmetros, corpos de requisição e respostas |
| 4 | [Serviços e Fluxos de Negócio](./04-servicos-e-fluxos.md) | Regras de negócio, o motor de matching e os fluxos ponta a ponta |
| 5 | [Segurança e Configuração](./05-seguranca-e-config.md) | CORS, Spring Security, variáveis de ambiente e perfis local/nuvem |
| 6 | [Build, Execução e Deploy](./06-build-e-deploy.md) | Como rodar localmente, Docker e publicação na nuvem |

---

## Stack tecnológica (resumo)

| Camada | Tecnologia |
|--------|------------|
| Linguagem | **Java 21** |
| Framework | **Spring Boot 4.0.1** (Web MVC, Data JPA, Security, Validation) |
| Persistência | **PostgreSQL** + Hibernate (ORM) com suporte a **JSONB** |
| Build | **Maven** |
| Utilitários | **Lombok**, **Jackson** (serialização JSON/JSONB) |
| Integração externa | **RestTemplate** (chamadas ao IA Service) e **HttpClient** (proxy de logs SSE) |
| Empacotamento | **Docker** (multi-stage build) |

---

## Mapa rápido do código

```
backend/
├── pom.xml                      # Dependências e build (Maven)
├── Dockerfile                   # Build multi-stage (Maven → JRE Alpine)
├── src/main/resources/
│   └── application.properties   # Conexão com o banco e Hibernate
└── src/main/java/com/caoradar/backend/
    ├── BackendApplication.java  # Ponto de entrada Spring Boot
    ├── SecurityConfig.java      # CORS + Spring Security
    ├── config/
    │   └── RestClientConfig.java  # Bean RestTemplate
    ├── model/                   # Entidades JPA + enums (ver doc 2)
    ├── repository/              # Repositórios Spring Data (ver doc 2)
    ├── service/                # Regras de negócio (ver doc 4)
    └── controller/             # Endpoints REST (ver doc 3)
```

> **Nota acadêmica:** trata-se de um **protótipo de TCC**. Algumas decisões (autenticação simplificada, `ddl-auto=update`, `permitAll` no Security) priorizam a validação experimental do pipeline cognitivo sobre o endurecimento de produção. Esses pontos estão sinalizados ao longo da documentação — em especial na [doc 5](./05-seguranca-e-config.md).