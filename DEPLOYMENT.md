# Guía de Deployment Rápido 🚀

## Resumen

Esta guía te llevará desde cero hasta tener la aplicación completamente desplegada en producción.

## Tiempo estimado: 30-45 minutos

---

## 1. Preparación (5 min)

### Cuentas necesarias:
- [ ] GitHub (para código)
- [ ] Render.com (para backend y database)
- [ ] Vercel.com (para frontend)
- [ ] Google AI Studio (para Gemini API)

### Obtener API Keys:

**Google Gemini:**
1. Ir a https://makersuite.google.com/app/apikey
2. Crear nuevo proyecto o usar existente
3. Generar API Key
4. Guardar en lugar seguro

---

## 2. Deploy de Base de Datos (10 min)

### En Render.com:

1. **Crear PostgreSQL Database:**
   ```
   Dashboard → New → PostgreSQL
   ```
   
   Configuración:
   - Name: `wifi-analyzer-db`
   - Region: Oregon (o más cercano)
   - Plan: Free (o Starter $7/mes)

2. **Obtener credenciales:**
   - Copiar `Internal Database URL`
   - Guardar para uso posterior

3. **Ejecutar Schema:**
   
   Opción A - Desde Render Dashboard:
   ```
   Database → Connect → Shell
   ```
   Copiar y pegar contenido de `database/schema.sql`
   
   Opción B - Desde terminal local:
   ```bash
   psql <INTERNAL_DATABASE_URL> < database/schema.sql
   ```

4. **Verificar tablas creadas:**
   ```sql
   \dt
   ```
   Deberías ver: gateway_analyses, chat_history, bulk_analyses, custom_prompts

---

## 3. Deploy de Backend (10 min)

### En Render.com:

1. **Crear Web Service:**
   ```
   Dashboard → New → Web Service
   ```

2. **Conectar GitHub:**
   - Select repository: `wifi-analyzer`
   - Branch: `main`

3. **Configuración:**
   ```
   Name: wifi-analyzer-backend
   Region: Oregon (mismo que DB)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

4. **Variables de Entorno:**
   
   Click "Environment" tab → Add Environment Variables:
   
   ```env
   PORT=3001
   NODE_ENV=production
   DATABASE_URL=<COPIAR_INTERNAL_DATABASE_URL_DE_PASO_2>
   GEMINI_API_KEY=<TU_GEMINI_API_KEY>
   GATEWAY_BASE_URL=https://176.52.129.49:26335
   GATEWAY_USERNAME=Claro_cvergara_API
   GATEWAY_PASSWORD=H0men3tw0rk@api
   ALLOWED_ORIGINS=*
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```
   
   **IMPORTANTE:** `ALLOWED_ORIGINS` lo actualizaremos después con la URL de Vercel

5. **Deploy:**
   - Click "Create Web Service"
   - Esperar a que termine el build (~3-5 min)
   - Copiar la URL generada: `https://wifi-analyzer-backend.onrender.com`

6. **Verificar:**
   ```bash
   curl https://wifi-analyzer-backend.onrender.com/health
   ```
   Deberías ver: `{"status":"ok","timestamp":"..."}`

---

## 4. Deploy de Frontend (10 min)

### Opción A - Vercel CLI (Recomendado):

1. **Instalar Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd frontend
   vercel
   ```
   
   Responder:
   ```
   Set up and deploy? [Y/n] Y
   Which scope? <tu-cuenta>
   Link to existing project? [y/N] N
   Project name? wifi-analyzer-frontend
   In which directory is your code located? ./
   Want to modify settings? [y/N] N
   ```

4. **Agregar variable de entorno:**
   ```bash
   vercel env add NEXT_PUBLIC_API_URL
   ```
   Valor: `https://wifi-analyzer-backend.onrender.com`
   Environment: Production

5. **Deploy a producción:**
   ```bash
   vercel --prod
   ```

6. **Obtener URL:**
   La URL será algo como: `https://wifi-analyzer-frontend.vercel.app`

### Opción B - Vercel Dashboard:

1. **Import Project:**
   - Ir a https://vercel.com/new
   - Import Git Repository
   - Select `wifi-analyzer`

2. **Configuración:**
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL = https://wifi-analyzer-backend.onrender.com
   ```

4. **Deploy:**
   - Click "Deploy"
   - Esperar build (~2-3 min)

---

## 5. Configuración Final (5 min)

### Actualizar CORS en Backend:

1. **En Render Dashboard:**
   - Ir a `wifi-analyzer-backend`
   - Environment tab
   - Edit `ALLOWED_ORIGINS`
   - Cambiar de `*` a: `https://wifi-analyzer-frontend.vercel.app`
   - Save Changes
   - Esto reiniciará el backend automáticamente

### Verificar funcionamiento:

1. **Abrir frontend:**
   ```
   https://wifi-analyzer-frontend.vercel.app
   ```

2. **Probar análisis:**
   - Ingresar una MAC address de prueba
   - Click "Analizar Gateway"
   - Debería mostrar loading y luego el informe

3. **Verificar base de datos:**
   ```sql
   -- En Render DB Shell
   SELECT COUNT(*) FROM gateway_analyses;
   ```
   Debería mostrar al menos 1 registro

---

## 6. Troubleshooting Común

### Error: "Failed to fetch" en frontend
- Verificar que `NEXT_PUBLIC_API_URL` esté correcto
- Verificar que el backend esté running en Render
- Revisar logs del backend

### Error: "CORS policy"
- Verificar que `ALLOWED_ORIGINS` incluya la URL de Vercel
- Reiniciar backend después de cambiar

### Error: "Database connection failed"
- Verificar que `DATABASE_URL` sea correcto
- Verificar que la DB esté running
- Verificar que el schema se ejecutó

### Error: "Gemini API error"
- Verificar que `GEMINI_API_KEY` sea válida
- Verificar cuota en Google AI Studio
- Revisar logs del backend

### Backend en Render tarda en responder primera vez
- Render Free tier tiene "cold start"
- Primera request puede tomar 30-60 segundos
- Después responde normalmente

---

## 7. URLs de Referencia

Guarda estas URLs:

```
Frontend: https://wifi-analyzer-frontend.vercel.app
Backend:  https://wifi-analyzer-backend.onrender.com
Database: [Internal URL en Render Dashboard]

Dashboards:
- Vercel: https://vercel.com/dashboard
- Render: https://dashboard.render.com
- Google AI: https://makersuite.google.com
```

---

## 8. Siguiente Paso: Desarrollo Local

Si quieres desarrollar localmente:

1. **Clonar repo:**
   ```bash
   git clone <tu-repo>
   cd wifi-analyzer
   ```

2. **Backend:**
   ```bash
   cd backend
   cp .env.example .env
   # Editar .env con tus credenciales
   npm install
   npm run dev
   ```

3. **Frontend:**
   ```bash
   cd frontend
   cp .env.local.example .env.local
   # Editar con http://localhost:3001
   npm install
   npm run dev
   ```

---

## 9. Actualizar Código

Para actualizar después de cambios:

**Backend:**
```bash
git add .
git commit -m "Update backend"
git push
# Render auto-deploys
```

**Frontend:**
```bash
git add .
git commit -m "Update frontend"
git push
# Vercel auto-deploys
```

O manualmente:
```bash
cd frontend
vercel --prod
```

---

## ✅ Checklist Final

- [ ] Base de datos PostgreSQL creada en Render
- [ ] Schema ejecutado correctamente
- [ ] Backend desplegado en Render
- [ ] Variables de entorno configuradas en backend
- [ ] Backend responde en /health
- [ ] Frontend desplegado en Vercel
- [ ] Variable NEXT_PUBLIC_API_URL configurada
- [ ] CORS actualizado con URL de Vercel
- [ ] Análisis de prueba funciona
- [ ] URLs guardadas

---

## 🎉 ¡Listo!

Tu aplicación está en producción y lista para usar.

Para soporte: cesarvergarachile@gmail.com
