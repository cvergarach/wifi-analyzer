#!/bin/bash

echo "🚀 WiFi Analyzer - Setup Script"
echo "================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Verificar Node.js
echo "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    echo "Por favor instala Node.js 18+ desde https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v)
print_success "Node.js encontrado: $NODE_VERSION"
echo ""

# Verificar npm
echo "Verificando npm..."
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi

NPM_VERSION=$(npm -v)
print_success "npm encontrado: $NPM_VERSION"
echo ""

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
if [ ! -f ".env" ]; then
    print_info "Creando archivo .env desde .env.example"
    cp .env.example .env
    print_info "Por favor edita backend/.env con tus credenciales"
fi

npm install
if [ $? -eq 0 ]; then
    print_success "Dependencias del backend instaladas"
else
    print_error "Error instalando dependencias del backend"
    exit 1
fi
cd ..
echo ""

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd frontend
if [ ! -f ".env.local" ]; then
    print_info "Creando archivo .env.local desde .env.local.example"
    cp .env.local.example .env.local
    print_info "Por favor edita frontend/.env.local con la URL de tu backend"
fi

npm install
if [ $? -eq 0 ]; then
    print_success "Dependencias del frontend instaladas"
else
    print_error "Error instalando dependencias del frontend"
    exit 1
fi
cd ..
echo ""

# Resumen
echo "================================"
print_success "Setup completado exitosamente!"
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Configurar base de datos PostgreSQL:"
echo "   - Crear database en Render o local"
echo "   - Ejecutar: psql <DATABASE_URL> < database/schema.sql"
echo ""
echo "2. Configurar variables de entorno:"
echo "   - Editar backend/.env con tus credenciales"
echo "   - Editar frontend/.env.local con la URL del backend"
echo ""
echo "3. Iniciar backend:"
echo "   cd backend && npm run dev"
echo ""
echo "4. Iniciar frontend (en otra terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo "5. Abrir navegador:"
echo "   http://localhost:3000"
echo ""
print_info "Para deployment en producción, ver DEPLOYMENT.md"
echo ""
