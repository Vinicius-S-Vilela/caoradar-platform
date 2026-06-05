# 5. Segurança e Configuração

[← Anterior: Serviços e Fluxos](./04-servicos-e-fluxos.md) · [Índice](./README.md)

---

## 5.1. Spring Security (`SecurityConfig`)

A configuração de segurança é deliberadamente **permissiva**, adequada a um protótipo de validação:

```java
http
  .csrf(csrf -> csrf.disable())          // CSRF desabilitado (API stateless consumida por SPA)
  .cors(...)                              // CORS configurável (ver abaixo)
  .authorizeHttpRequests(auth -> auth
      .anyRequest().permitAll());         // todos os endpoints são públicos
```

- **CSRF desabilitado** — coerente com uma API REST sem sessões consumida por uma SPA Angular.
- **`permitAll`** — não há filtro de autenticação/autorização nos endpoints. O controle de acesso fica a cargo do front-end.

> ⚠️ **Implicação para produção:** qualquer cliente pode chamar qualquer endpoint. Para evoluir o protótipo, o caminho natural é introduzir autenticação por **JWT** (ou OAuth2 Resource Server) e restringir rotas por `Role` (`ADMIN`/`TUTOR`).

---

## 5.2. CORS

A origem permitida é parametrizada pela variável **`CORS_ORIGINS`** (default `http://localhost:4200` — a porta padrão do Angular). Aceita múltiplas origens separadas por vírgula.

| Configuração | Valor |
|--------------|-------|
| Origens | `CORS_ORIGINS` (lista separada por vírgula) |
| Métodos | `GET, POST, PUT, DELETE, OPTIONS, PATCH` |
| Headers | `*` |
| Credenciais | habilitadas (`allowCredentials = true`) |

---

## 5.3. Autenticação de usuário (`UserService`)

O login (`POST /users/login`) compara a senha recebida **diretamente** com o campo `passwordHash`:

```java
if (user.getPasswordHash().equals(senha)) { ... }
```

> ⚠️ Apesar do nome do campo, **não há hashing** — a senha é guardada e comparada em texto plano. Em uma evolução para produção, deve-se aplicar **BCrypt** (`PasswordEncoder`) na escrita e na verificação.

O `UserService` também **normaliza o CPF** removendo tudo que não for dígito antes de salvar, garantindo unicidade consistente.

---

## 5.4. Configuração do banco (`application.properties`)

A conexão é **"inteligente"**: usa variáveis de ambiente quando disponíveis (nuvem) e cai em defaults locais caso contrário.

```properties
spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/caoradar_db}
spring.datasource.username=${DB_USER:admin}
spring.datasource.password=${DB_PASS:admin}

spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

- **`ddl-auto=update`** — o Hibernate cria/atualiza o esquema automaticamente a partir das entidades. Conveniente em desenvolvimento; em produção recomenda-se migrações versionadas (Flyway/Liquibase) e `validate`.

---

## 5.5. Variáveis de ambiente

| Variável | Default | Usada por | Função |
|----------|---------|-----------|--------|
| `DB_URL` | `jdbc:postgresql://localhost:5432/caoradar_db` | `application.properties` | URL do PostgreSQL |
| `DB_USER` | `admin` | `application.properties` | usuário do banco |
| `DB_PASS` | `admin` | `application.properties` | senha do banco |
| `CORS_ORIGINS` | `http://localhost:4200` | `SecurityConfig` | origens permitidas no CORS |
| `IA_API_URL` | `http://localhost:8000` (`RelatoService`) / `http://host.docker.internal:8000` (`VideoController`) | serviços de integração | URL base do IA Service Python |
| `HF_TOKEN` | *(vazio)* | `HfLogsService` | token de acesso aos logs do Hugging Face |
| `HF_SPACE_ID` | `PalmaPedroA/caoradar-iaservice` | `HfLogsService` | identificador do Space do IA Service |

> Atenção ao default divergente de `IA_API_URL`: em ambiente Docker, o `VideoController` aponta para `host.docker.internal` (acesso ao host a partir do contêiner), enquanto o `RelatoService` usa `localhost`. Em deploy real, **defina `IA_API_URL` explicitamente** para uniformizar.

---

## 5.6. Checklist de hardening (evolução pós-TCC)

Itens conscientemente simplificados no protótipo e o caminho recomendado:

- [ ] **Autenticação real** — JWT/OAuth2 + autorização por `Role`, substituindo `permitAll`.
- [ ] **Hashing de senha** — BCrypt no lugar da comparação em texto plano.
- [ ] **Migrações de esquema** — Flyway/Liquibase + `ddl-auto=validate`.
- [ ] **Segredos** — mover credenciais e tokens para um cofre/secret manager.
- [ ] **CORS restrito** — origens fixas por ambiente, sem curingas.
- [ ] **Autenticação dos webhooks** — proteger `/api/integracao/*` e `/matches` (hoje abertos) com um segredo compartilhado entre back-end e IA Service.

---

[← Anterior: Serviços e Fluxos](./04-servicos-e-fluxos.md) · [Índice](./README.md) · [Próximo: Build e Deploy →](./06-build-e-deploy.md)
