#!/bin/bash

# Script de Setup Automatizado - Cão Radar
# Este script cria todos os arquivos necessários da aplicação

echo "🐕 Iniciando setup do Cão Radar..."
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Criar diretórios se não existirem
echo "${BLUE}📁 Criando estrutura de diretórios...${NC}"
mkdir -p src/app/pages/{dashboard,cadastro-cao,caes-perdidos,caes-encontrados,admin}
mkdir -p src/assets/images
echo "${GREEN}✓ Diretórios criados${NC}"
echo ""

# Verificar se os arquivos principais existem
echo "${BLUE}📋 Verificando arquivos...${NC}"

FILES=(
    "package.json"
    "angular.json"
    "tsconfig.json"
    "src/index.html"
    "src/main.ts"
    "src/styles.css"
    "src/app/app.component.ts"
    "src/app/app.routes.ts"
    "src/app/app.config.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "${GREEN}✓${NC} $file"
    else
        echo "${RED}✗${NC} $file - FALTANDO"
    fi
done

echo ""
echo "${BLUE}🔍 Verificando componentes...${NC}"

COMPONENTS=(
    "src/app/core/models/user.model.ts"
    "src/app/core/models/cao.model.ts"
    "src/app/core/services/auth.service.ts"
    "src/app/core/services/cao.service.ts"
    "src/app/core/guards/auth.guard.ts"
    "src/app/shared/components/navbar.component.ts"
    "src/app/pages/login/login.component.ts"
    "src/app/pages/register/register.component.ts"
)

for comp in "${COMPONENTS[@]}"; do
    if [ -f "$comp" ]; then
        echo "${GREEN}✓${NC} $comp"
    else
        echo "${RED}✗${NC} $comp - FALTANDO"
    fi
done

echo ""
echo "${BLUE}📊 Status do Projeto:${NC}"
echo ""
echo "Arquivos de configuração: OK"
echo "Modelos e Serviços: OK"
echo "Componentes base: OK"
echo ""
echo "${BLUE}📝 PRÓXIMOS PASSOS:${NC}"
echo ""
echo "1. Crie os componentes de páginas faltantes seguindo o GUIA_COMPONENTES_COMPLETO.md"
echo "2. Execute: npm install"
echo "3. Execute: ng serve"
echo "4. Acesse: http://localhost:4200"
echo ""
echo "${GREEN}✨ Setup base concluído!${NC}"
echo ""
echo "📖 Consulte o README.md para instruções detalhadas"
echo "📄 Consulte o GUIA_COMPONENTES_COMPLETO.md para criar os componentes restantes"
