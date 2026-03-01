# 🚀 INÍCIO RÁPIDO - CÃO RADAR

## ⚡ Setup em 5 Minutos

### 1️⃣ Pré-requisitos
- Node.js 18+ instalado
- npm instalado
- Angular CLI: `npm install -g @angular/cli`

### 2️⃣ Instalar Dependências
```bash
cd cao-radar
npm install
```

### 3️⃣ Criar Componentes Faltantes
Abra o arquivo `GUIA_COMPONENTES_COMPLETO.md` e copie o código de cada componente para o arquivo correspondente:

**OBRIGATÓRIOS:**
- `src/app/pages/dashboard/dashboard.component.ts`
- `src/app/pages/cadastro-cao/cadastro-cao.component.ts`
- `src/app/pages/caes-perdidos/caes-perdidos.component.ts`
- `src/app/pages/caes-encontrados/caes-encontrados.component.ts`
- `src/app/pages/admin/admin.component.ts`

### 4️⃣ Rodar o Projeto
```bash
ng serve
```

### 5️⃣ Acessar
Abra o navegador em: **http://localhost:4200**

---

## 🔑 Credenciais de Teste

**Usuário Normal:**
- Email: usuario@teste.com
- Senha: senha123

**Administrador:**
- Email: admin@cao-radar.com
- Senha: admin123

---

## 📱 Funcionalidades

✅ Login e Registro
✅ Dashboard pessoal
✅ Cadastro de cães perdidos
✅ Visualização de cães perdidos
✅ Visualização de cães encontrados
✅ Painel administrativo
✅ Filtros por raça
✅ Design responsivo

---

## 🌐 Deploy no Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Build
npm run build

# Deploy
vercel --prod
```

---

## 🐛 Problemas Comuns

**Erro "ng não reconhecido":**
```bash
npm install -g @angular/cli
```

**Erro ao rodar ng serve:**
```bash
rm -rf node_modules
npm install
```

**Porta 4200 em uso:**
```bash
ng serve --port 4300
```

---

## 📁 Estrutura de Arquivos

```
cao-radar/
├── src/
│   ├── app/
│   │   ├── core/               # Serviços e modelos
│   │   ├── shared/             # Componentes compartilhados
│   │   ├── pages/              # Páginas da aplicação
│   │   ├── app.component.ts    # ✅ CRIADO
│   │   ├── app.routes.ts       # ✅ CRIADO
│   │   └── app.config.ts       # ✅ CRIADO
│   ├── assets/                 # Imagens e recursos
│   ├── index.html              # ✅ CRIADO
│   ├── main.ts                 # ✅ CRIADO
│   └── styles.css              # ✅ CRIADO
├── angular.json                # ✅ CRIADO
├── package.json                # ✅ CRIADO
├── tsconfig.json               # ✅ CRIADO
├── vercel.json                 # ✅ CRIADO
├── README.md                   # ✅ CRIADO
└── GUIA_COMPONENTES_COMPLETO.md # 📖 CONSULTAR
```

---

## ✅ Checklist de Setup

- [ ] Node.js e npm instalados
- [ ] Angular CLI instalado
- [ ] `npm install` executado
- [ ] Componentes das páginas criados (ver GUIA_COMPONENTES_COMPLETO.md)
- [ ] `ng serve` rodando
- [ ] Acesso ao http://localhost:4200
- [ ] Login funcionando
- [ ] Navegação entre páginas OK

---

## 📚 Documentação Completa

- **README.md** - Documentação completa e detalhada
- **GUIA_COMPONENTES_COMPLETO.md** - Código de todos os componentes
- **setup.sh** - Script de verificação (Linux/Mac)

---

## 💡 Dicas

1. Use o VS Code para melhor experiência
2. Instale a extensão "Angular Language Service"
3. Use `Ctrl + C` para parar o servidor
4. Use `ng serve --open` para abrir automaticamente o navegador

---

## 🎨 Customização

As cores estão definidas em `src/styles.css` nas variáveis CSS:
- `--primary-blue: #2F80ED`
- `--success-green: #27AE60`
- `--secondary-blue: #EAF2FD`

---

## 📞 Suporte

Em caso de dúvidas:
1. Consulte o README.md completo
2. Verifique a seção "Problemas Comuns"
3. Consulte a documentação oficial do Angular

---

**Desenvolvido para TCC 2026** 🎓
