# 🐕 Cão Radar - Sistema de Localização de Cães Perdidos

![Cão Radar Logo](src/assets/logo.png)

## 📋 Sobre o Projeto

**Cão Radar** é uma aplicação web desenvolvida em Angular para auxiliar na localização de cães perdidos utilizando tecnologia de visão computacional (YOLO) integrada com câmeras públicas.

### Raças Identificadas
- Golden Retriever
- Yorkshire Terrier
- Poodle
- Bulldog Francês
- Pastor Alemão

---

## 🎨 Paleta de Cores

- **Azul Médio (Primária)**: `#2F80ED`
- **Azul Claro (Backgrounds)**: `#EAF2FD`
- **Verde Suave (Encontrado)**: `#27AE60`
- **Branco (Fundos)**: `#FFFFFF`
- **Cinza Neutro (Textos)**: `#4F4F4F`

---

## 🚀 Pré-requisitos (Windows)

Antes de iniciar, certifique-se de ter instalado:

### 1. Node.js e npm
- Baixe o instalador em: https://nodejs.org/
- Recomendado: versão LTS (Long Term Support)
- Durante a instalação, marque a opção "Add to PATH"

**Verificar instalação:**
```bash
node --version
npm --version
```

Versões recomendadas:
- Node.js: v18.x ou superior
- npm: v9.x ou superior

### 2. Angular CLI
Após instalar o Node.js, abra o **Prompt de Comando** ou **PowerShell** como Administrador e execute:

```bash
npm install -g @angular/cli
```

**Verificar instalação:**
```bash
ng version
```

### 3. Editor de Código (Opcional mas Recomendado)
- **Visual Studio Code**: https://code.visualstudio.com/

**Extensões recomendadas para VS Code:**
- Angular Language Service
- Angular Snippets
- Prettier - Code formatter
- ESLint

---

## 📦 Instalação e Execução Local

### Passo 1: Clonar/Baixar o Projeto
Baixe o projeto e extraia para uma pasta de sua preferência (exemplo: `C:\projetos\cao-radar`)

### Passo 2: Abrir o Terminal na Pasta do Projeto
1. Abra o **Prompt de Comando** ou **PowerShell**
2. Navegue até a pasta do projeto:
```bash
cd C:\projetos\cao-radar
```

### Passo 3: Instalar Dependências
Execute o comando para instalar todas as dependências do projeto:

```bash
npm install
```

**Este processo pode demorar alguns minutos.** Aguarde até que todas as dependências sejam instaladas.

### Passo 4: Executar o Servidor de Desenvolvimento
Após a instalação das dependências, execute:

```bash
ng serve
```

ou

```bash
npm start
```

### Passo 5: Acessar no Navegador
Quando aparecer a mensagem:
```
** Angular Live Development Server is listening on localhost:4200 **
```

Abra seu navegador e acesse:
```
http://localhost:4200
```

A aplicação será recarregada automaticamente sempre que você modificar algum arquivo!

---

## 🐛 Problemas Comuns e Soluções

### Erro: "ng não é reconhecido como comando"
**Solução:** Angular CLI não está instalado ou não está no PATH
```bash
npm install -g @angular/cli
```

### Erro: "Cannot find module"
**Solução:** Dependências não foram instaladas corretamente
```bash
# Deletar node_modules e reinstalar
rmdir /s /q node_modules
npm install
```

### Erro: Porta 4200 já está em uso
**Solução:** Use outra porta
```bash
ng serve --port 4300
```

### Erro de permissão no Windows
**Solução:** Execute o terminal como Administrador

### Aplicação não carrega após modificações
**Solução:** Reinicie o servidor
- Pressione `Ctrl + C` no terminal
- Execute `ng serve` novamente

---

## 📁 Estrutura do Projeto

```
cao-radar/
├── src/
│   ├── app/
│   │   ├── core/              # Serviços principais e guards
│   │   │   ├── guards/
│   │   │   ├── services/
│   │   │   └── models/
│   │   ├── shared/            # Componentes compartilhados
│   │   │   ├── components/
│   │   │   ├── pipes/
│   │   │   └── directives/
│   │   ├── pages/             # Páginas da aplicação
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── dashboard/
│   │   │   ├── cadastro-cao/
│   │   │   ├── caes-perdidos/
│   │   │   ├── caes-encontrados/
│   │   │   └── admin/
│   │   ├── app.component.ts
│   │   ├── app.routes.ts
│   │   └── app.config.ts
│   ├── assets/                # Imagens e recursos estáticos
│   ├── styles.css             # Estilos globais
│   └── index.html
├── angular.json               # Configuração do Angular
├── package.json               # Dependências do projeto
├── tsconfig.json              # Configuração do TypeScript
└── README.md
```

---

## 🌐 Deploy no Vercel (Produção)

### Preparação do Projeto

#### 1. Criar arquivo vercel.json
Na raiz do projeto, crie o arquivo `vercel.json`:

```json
{
  "version": 2,
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

#### 2. Ajustar package.json
Certifique-se de que o `package.json` contém os scripts:

```json
{
  "scripts": {
    "build": "ng build --configuration production",
    "build:vercel": "ng build --configuration production --output-path=dist"
  }
}
```

#### 3. Criar arquivo .vercelignore
```
node_modules
.angular
.vscode
*.log
```

### Deploy Passo a Passo

#### Opção 1: Via Vercel Dashboard (Mais Simples)

1. **Criar conta no Vercel**
   - Acesse: https://vercel.com
   - Faça login com GitHub, GitLab ou Bitbucket

2. **Subir projeto no GitHub** (se ainda não estiver)
   - Crie um repositório no GitHub
   - Suba o código:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/seu-usuario/cao-radar.git
   git push -u origin main
   ```

3. **Importar no Vercel**
   - No dashboard do Vercel, clique em "Import Project"
   - Selecione seu repositório
   - Configure:
     - **Framework Preset**: Angular
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist/cao-radar/browser` (ou `dist/browser` dependendo da versão)
     - **Install Command**: `npm install`

4. **Deploy**
   - Clique em "Deploy"
   - Aguarde o processo (2-5 minutos)
   - Após concluído, você receberá uma URL pública!

#### Opção 2: Via Vercel CLI

1. **Instalar Vercel CLI**
```bash
npm install -g vercel
```

2. **Login no Vercel**
```bash
vercel login
```

3. **Build de Produção**
```bash
npm run build
```

4. **Deploy**
```bash
vercel --prod
```

5. **Seguir instruções no terminal**
   - Confirme o projeto
   - Aguarde o deploy
   - URL será gerada automaticamente

### Configurações Importantes para Angular no Vercel

#### angular.json - Verificar configuração de build
```json
{
  "projects": {
    "cao-radar": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "outputPath": "dist/cao-radar/browser",
              "optimization": true,
              "sourceMap": false,
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "2mb",
                  "maximumError": "5mb"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

### Após o Deploy

1. **URL Personalizada** (Opcional)
   - No dashboard do Vercel, vá em "Domains"
   - Adicione domínio personalizado

2. **Variáveis de Ambiente** (se necessário)
   - No dashboard: Settings > Environment Variables
   - Adicione variáveis necessárias

3. **Deploy Automático**
   - Conectado ao GitHub, cada push na branch `main` fará deploy automático

### Verificar Deploy

Após o deploy, teste:
- ✅ Todas as rotas funcionam
- ✅ Imagens carregam corretamente
- ✅ Navegação entre páginas
- ✅ Responsividade em mobile
- ✅ Performance (Lighthouse score)

### Dicas de Otimização

1. **Lazy Loading** - Já implementado no projeto
2. **Compressão de Imagens** - Use formatos WebP
3. **Cache** - Vercel configura automaticamente
4. **CDN** - Vercel usa CDN global

---

## 👥 Funcionalidades

### Área Pública
- ✅ Login e Cadastro de usuários
- ✅ Visualização de cães perdidos
- ✅ Visualização de cães encontrados
- ✅ Filtros por raça

### Área do Usuário (Autenticado)
- ✅ Dashboard pessoal
- ✅ Cadastro de cão perdido
- ✅ Visualização dos próprios cães
- ✅ Edição de informações

### Área Administrativa
- ✅ Gerenciamento de usuários
- ✅ Gerenciamento de cães
- ✅ Relatórios e estatísticas

---

## 🔐 Credenciais de Teste

### Usuário Normal
- **Email**: usuario@teste.com
- **Senha**: senha123

### Administrador
- **Email**: admin@cao-radar.com
- **Senha**: admin123

---

## 🛠️ Tecnologias Utilizadas

- **Angular 17+** - Framework frontend
- **TypeScript** - Linguagem principal
- **RxJS** - Programação reativa
- **Angular Router** - Navegação
- **Reactive Forms** - Formulários reativos
- **CSS3** - Estilização
- **Google Fonts** - Tipografia

---

## 📱 Responsividade

A aplicação é totalmente responsiva e foi testada em:
- 📱 **Mobile**: 320px - 767px
- 📱 **Tablet**: 768px - 1023px
- 💻 **Desktop**: 1024px+

---

## 🤝 Contribuindo

Este é um projeto acadêmico (TCC), mas sugestões são bem-vindas!

---

## 📄 Licença

Projeto desenvolvido para fins acadêmicos - TCC 2026

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a seção "Problemas Comuns"
2. Consulte a documentação do Angular: https://angular.io/docs
3. Verifique os logs no terminal

---

## ✨ Boas Práticas Implementadas

- ✅ Arquitetura modular
- ✅ Separação de responsabilidades
- ✅ Componentes reutilizáveis
- ✅ Serviços mockados
- ✅ Guards para rotas protegidas
- ✅ Validação de formulários
- ✅ Feedback visual
- ✅ Acessibilidade (ARIA labels)
- ✅ Performance otimizada

---

**Desenvolvido com 💙 para o TCC - Sistema Cão Radar**
