# 6. Build, Execução e Deploy

[← Anterior: Segurança e Configuração](./05-seguranca-e-config.md) · [Índice](./README.md)

---

## 6.1. Pré-requisitos

| Ferramenta | Versão |
|------------|--------|
| JDK | **21** |
| Maven | 3.9+ (ou o `mvnw` do projeto) |
| PostgreSQL | 14+ (local ou em nuvem) |
| Docker | opcional, para empacotamento |

---

## 6.2. Execução local

1. **Suba um PostgreSQL** e crie o banco (ou use os defaults `caoradar_db` / `admin` / `admin`):
   ```sql
   CREATE DATABASE caoradar_db;
   ```
2. **(Opcional) Exporte variáveis** caso não use os defaults — ver [doc 5 §5.5](./05-seguranca-e-config.md#55-variáveis-de-ambiente). Em PowerShell:
   ```powershell
   $env:DB_URL = "jdbc:postgresql://localhost:5432/caoradar_db"
   $env:IA_API_URL = "http://localhost:8000"
   $env:CORS_ORIGINS = "http://localhost:4200"
   ```
3. **Rode a aplicação:**
   ```bash
   mvn spring-boot:run
   ```
   O Hibernate cria/atualiza o esquema automaticamente (`ddl-auto=update`). A API sobe na porta **8080**.

> Para o sistema funcionar de ponta a ponta é preciso ter também o **IA Service Python** acessível em `IA_API_URL` e o **front-end Angular** em `CORS_ORIGINS`.

---

## 6.3. Build do artefato

```bash
mvn clean package          # gera target/*.jar
java -jar target/cao-radar-0.0.1-SNAPSHOT.jar
```

Para pular testes durante o empacotamento: `mvn clean package -DskipTests`.

---

## 6.4. Docker (build multi-stage)

O `Dockerfile` usa **dois estágios** — compila com Maven e roda sobre uma JRE Alpine enxuta:

```dockerfile
# Estágio 1: build com Maven + Temurin 21
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Estágio 2: runtime enxuto
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Construir e rodar:**
```bash
docker build -t caoradar-backend .
docker run -p 8080:8080 \
  -e DB_URL="jdbc:postgresql://host.docker.internal:5432/caoradar_db" \
  -e DB_USER="admin" -e DB_PASS="admin" \
  -e IA_API_URL="http://host.docker.internal:8000" \
  -e CORS_ORIGINS="http://localhost:4200" \
  caoradar-backend
```

> Em contêiner, use `host.docker.internal` para alcançar serviços (banco, IA) que rodam na máquina host.

---

## 6.5. Deploy em nuvem

O `Dockerfile` expõe a porta **8080** e foi pensado para plataformas PaaS baseadas em contêiner (o comentário no arquivo cita o **Render**). O fluxo típico:

1. A plataforma builda a imagem a partir do `Dockerfile`.
2. As **variáveis de ambiente** ([doc 5 §5.5](./05-seguranca-e-config.md#55-variáveis-de-ambiente)) são definidas no painel do provedor — principalmente `DB_URL`/`DB_USER`/`DB_PASS` (banco gerenciado), `IA_API_URL` (URL pública do IA Service no Hugging Face) e `CORS_ORIGINS` (domínio do front-end).
3. O contêiner sobe e a API fica disponível na porta exposta.

---

## 6.6. Topologia de produção (referência)

```
[ Front-end Angular ]  →  CORS_ORIGINS
        │ HTTPS
        ▼
[ Back-end Spring Boot (contêiner, :8080) ]
        │                         ▲
        │ IA_API_URL              │ webhooks (/api/integracao, /matches)
        ▼                         │
[ IA Service Python (Hugging Face Spaces) ]
        ▲
        │ HF_TOKEN / HF_SPACE_ID (proxy de logs)
        │
[ PostgreSQL gerenciado ]  ← DB_URL/DB_USER/DB_PASS
```

---

[← Anterior: Segurança e Configuração](./05-seguranca-e-config.md) · [Índice](./README.md)
