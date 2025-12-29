# WiFi Analyzer - Call Center 📡

## Descripción del Proyecto

Aplicación web moderna que convierte el analizador WiFi de Python (código desktop con Tkinter) en una aplicación web full-stack profesional para analizar gateways WiFi en call centers.

## Arquitectura

```
wifi-analyzer/
├── frontend/          # Next.js 14 + React + TypeScript (Vercel)
├── backend/           # Node.js + Express (Render)
├── database/          # PostgreSQL (Render)
└── docs/              # Documentación
```

### Stack Tecnológico

**Frontend (Vercel):**
- Next.js 14 con App Router
- React 18 con TypeScript
- TailwindCSS para estilos
- Zustand para estado global
- React Query para data fetching
- Axios para API calls

**Backend (Render):**
- Node.js + Express
- PostgreSQL con pg
- Google Gemini AI para análisis
- Axios para llamadas API
- Rate limiting y seguridad

**Base de Datos (Render PostgreSQL):**
- PostgreSQL 14+
- Schema optimizado para análisis WiFi
- Índices para búsquedas rápidas
- Triggers automáticos

## Características Implementadas

✅ **Análisis Individual y en Lote**
- Análisis de un gateway individual
- Análisis masivo de múltiples gateways
- Almacenamiento de resultados en PostgreSQL

✅ **Integración con Google Gemini AI**
- Generación de informes en lenguaje natural
- Chat contextual sobre los análisis
- Recomendaciones técnicas automáticas

✅ **Gestión de Datos Técnicos**
- Extracción completa de datos del gateway
- Análisis de señal óptica
- Dispositivos conectados
- Configuración WiFi (2.4G y 5G)
- Redes vecinas
- Eventos y reinicios
- Puertos LAN

✅ **Chat Interactivo**
- Conversación con IA sobre los datos técnicos
- Historial de chat persistente
- Respuestas contextuales

✅ **Historial y Estadísticas**
- Historial completo de análisis
- Filtros por MAC, estado, fecha
- Estadísticas agregadas
- Visualización de tendencias

✅ **Interfaz Moderna**
- Diseño responsivo
- Tema claro profesional
- Estados de carga optimizados
- Manejo de errores robusto

## Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- PostgreSQL 14+
- Cuenta en Render.com
- Cuenta en Vercel.com
- API Key de Google Gemini

### 1. Clonar el Repositorio

```bash
git clone https://github.com/cvergarach/wifi-analyzer.git
cd wifi-analyzer
```

### 2. Configurar Base de Datos PostgreSQL en Render

1. Crear base de datos en Render:
   - Ir a https://dashboard.render.com/
   - New → PostgreSQL
   - Copiar el `Database URL` (Internal o External)

2. Ejecutar schema:
```bash
psql <DATABASE_URL> < database/schema.sql
```

O desde Render Dashboard:
- Connect → ejecutar el contenido de `database/schema.sql`

### 3. Configurar Backend (Render)

1. Crear archivo `.env` en `/backend`:
```env
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
GEMINI_API_KEY=your_gemini_api_key
GATEWAY_BASE_URL=https://176.52.129.49:26335
GATEWAY_USERNAME=Claro_cvergara_API
GATEWAY_PASSWORD=H0men3tw0rk@api
ALLOWED_ORIGINS=https://your-frontend.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

2. Instalar dependencias:
```bash
cd backend
npm install
```

3. Desarrollo local:
```bash
npm run dev
```

4. Deploy en Render:
   - New → Web Service
   - Connect GitHub repo
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
   - Agregar variables de entorno del `.env`

### 4. Configurar Frontend (Vercel)

1. Crear archivo `.env.local` en `/frontend`:
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

2. Instalar dependencias:
```bash
cd frontend
npm install
```

3. Desarrollo local:
```bash
npm run dev
```

4. Deploy en Vercel:
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel

# Para producción
vercel --prod
```

O desde Vercel Dashboard:
- Import Project
- Select GitHub repo
- Framework: Next.js
- Root Directory: `frontend`
- Add Environment Variable: `NEXT_PUBLIC_API_URL`

## Estructura del Código

### Backend

```
backend/
├── src/
│   ├── server.js                    # Entry point
│   ├── config/
│   │   └── database.js              # PostgreSQL config
│   ├── routes/
│   │   ├── gateway.js               # Rutas para análisis
│   │   ├── analysis.js              # Rutas para chat/AI
│   │   └── history.js               # Rutas para historial
│   ├── services/
│   │   ├── gatewayService.js        # Llamadas API Gateway
│   │   └── aiService.js             # Google Gemini AI
│   └── middleware/
│       └── errorHandler.js          # Manejo de errores
├── package.json
└── .env
```

### Frontend

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Layout principal
│   │   └── page.tsx                 # Página home
│   ├── components/
│   │   ├── AnalyzerForm.tsx         # Formulario de análisis
│   │   ├── ReportDisplay.tsx        # Visualización de informe
│   │   ├── ChatInterface.tsx        # Chat con IA
│   │   ├── HistoryPanel.tsx         # Panel de historial
│   │   ├── StatsPanel.tsx           # Panel de estadísticas
│   │   └── Providers.tsx            # React Query provider
│   ├── lib/
│   │   └── api.ts                   # Cliente API
│   ├── store/
│   │   └── appStore.ts              # Zustand store
│   └── styles/
│       └── globals.css              # Estilos globales
├── package.json
└── .env.local
```

### Base de Datos

```
database/
└── schema.sql                       # Schema completo
    ├── gateway_analyses             # Análisis principales
    ├── chat_history                 # Historial de chat
    ├── bulk_analyses                # Análisis en lote
    └── custom_prompts               # Prompts personalizados
```

## API Endpoints

### Gateway

```
POST   /api/gateway/analyze          # Analizar gateway(s)
GET    /api/gateway/:mac/info        # Info básica
GET    /api/gateway/:mac/devices     # Dispositivos conectados
GET    /api/gateway/:mac/wifi        # Config WiFi
GET    /api/gateway/:mac/neighbors   # Redes vecinas
```

### Análisis

```
POST   /api/analysis/:id/chat        # Chat con IA
GET    /api/analysis/:id/chat/history # Historial de chat
POST   /api/analysis/:id/regenerate  # Regenerar informe
GET    /api/analysis/prompts         # Lista de prompts
GET    /api/analysis/prompts/:id     # Prompt específico
POST   /api/analysis/prompts         # Crear prompt
```

### Historial

```
GET    /api/history                  # Lista con paginación
GET    /api/history/:id              # Análisis específico
GET    /api/history/mac/:mac         # Por MAC
GET    /api/history/stats/overview   # Estadísticas
DELETE /api/history/:id              # Eliminar
GET    /api/history/bulk/:batchId    # Resultado bulk
```

## Componentes Faltantes por Crear

Para completar el frontend, necesitas crear:

### 1. ReportDisplay.tsx
```typescript
// Muestra el informe generado por la IA
// con formato de texto plano, sin markdown
// Incluye botones para copiar y descargar
```

### 2. ChatInterface.tsx
```typescript
// Interfaz de chat con la IA
// Input para preguntas
// Historial de mensajes
// Indicador de escritura
```

### 3. HistoryPanel.tsx
```typescript
// Tabla de análisis históricos
// Filtros por MAC, estado, fecha
// Paginación
// Ver detalles de cada análisis
```

### 4. StatsPanel.tsx
```typescript
// Dashboard con estadísticas
// Gráficos de tendencias
// Métricas agregadas
// Top MACs problemáticas
```

## Diferencias con el Código Python Original

### Mejoras Implementadas

1. **Arquitectura Web vs Desktop**
   - Python: GUI con Tkinter
   - Web: Frontend React + Backend Node.js

2. **Almacenamiento**
   - Python: Archivos locales
   - Web: PostgreSQL con histórico completo

3. **Escalabilidad**
   - Python: Un análisis a la vez
   - Web: Análisis concurrentes, mode bulk

4. **Accesibilidad**
   - Python: Instalación local requerida
   - Web: Acceso desde cualquier navegador

5. **Colaboración**
   - Python: Un usuario
   - Web: Multi-usuario con historial compartido

## Variables de Entorno Requeridas

### Backend (.env)
```
PORT=3001
NODE_ENV=production
DATABASE_URL=<Render PostgreSQL URL>
GEMINI_API_KEY=<Google Gemini API Key>
GATEWAY_BASE_URL=https://176.52.129.49:26335
GATEWAY_USERNAME=<username>
GATEWAY_PASSWORD=<password>
ALLOWED_ORIGINS=<Vercel URL>
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=<Render Backend URL>
```

## Testing

### Backend
```bash
cd backend
npm run dev

# Test endpoints
curl http://localhost:3001/health
```

### Frontend
```bash
cd frontend
npm run dev

# Abrir http://localhost:3000
```

## Troubleshooting

### Error de CORS
- Verificar que `ALLOWED_ORIGINS` en backend incluya tu dominio Vercel
- Verificar que `NEXT_PUBLIC_API_URL` apunte al backend correcto

### Error de Base de Datos
- Verificar que `DATABASE_URL` sea correcto
- Verificar que el schema se ejecutó correctamente
- Revisar logs en Render Dashboard

### Error de Google Gemini
- Verificar que `GEMINI_API_KEY` sea válida
- Revisar límites de cuota en Google AI Studio

### SSL Certificate Error
- El backend usa `rejectUnauthorized: false` para el Gateway API
- Esto es necesario para el endpoint del gateway

## Próximos Pasos

1. ✅ Crear componentes faltantes del frontend
2. ✅ Implementar gráficos con Recharts o Chart.js
3. ✅ Agregar exportación a PDF/Excel
4. ✅ Implementar autenticación de usuarios
5. ✅ Agregar notificaciones push
6. ✅ Crear tests unitarios y de integración
7. ✅ Optimizar queries de base de datos
8. ✅ Implementar caché con Redis

## Soporte

Para problemas o consultas:
- Email: cesarvergarachile@gmail.com
- GitHub: https://github.com/cvergarach/wifi-analyzer

## Licencia

MIT License - Ver archivo LICENSE para más detalles

---

**Desarrollado por Alquimia Datalive**
Cesar Vergara - CTO & Co-Founder
