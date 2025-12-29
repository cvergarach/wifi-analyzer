-- WiFi Analyzer Database Schema
-- Para PostgreSQL en Render

-- Tabla de análisis de gateways
CREATE TABLE IF NOT EXISTS gateway_analyses (
    id SERIAL PRIMARY KEY,
    mac_address VARCHAR(17) NOT NULL,
    analysis_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Datos técnicos crudos
    raw_data JSONB NOT NULL,
    
    -- Información básica
    gateway_info JSONB,
    
    -- Estado general
    general_status VARCHAR(50),
    status_emoji VARCHAR(10),
    
    -- Señal óptica
    optical_rx_power DECIMAL(10,2),
    optical_tx_power DECIMAL(10,2),
    optical_status VARCHAR(50),
    
    -- Dispositivos conectados
    connected_devices JSONB,
    devices_count INTEGER DEFAULT 0,
    
    -- Configuración WiFi
    wifi_2g_config JSONB,
    wifi_5g_config JSONB,
    
    -- Redes vecinas
    neighboring_networks JSONB,
    
    -- Eventos
    events_summary JSONB,
    reboot_count INTEGER DEFAULT 0,
    channel_change_count INTEGER DEFAULT 0,
    
    -- Puertos LAN
    lan_ports JSONB,
    
    -- Análisis de AI
    ai_report TEXT,
    ai_recommendations TEXT,
    problems_detected JSONB,
    
    -- Metadata
    analysis_duration_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Índices
    CONSTRAINT unique_mac_timestamp UNIQUE (mac_address, analysis_timestamp)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_gateway_mac ON gateway_analyses(mac_address);
CREATE INDEX IF NOT EXISTS idx_gateway_timestamp ON gateway_analyses(analysis_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gateway_created ON gateway_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gateway_status ON gateway_analyses(general_status);

-- Tabla de historial de chat
CREATE TABLE IF NOT EXISTS chat_history (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER REFERENCES gateway_analyses(id) ON DELETE CASCADE,
    mac_address VARCHAR(17) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Metadata
    tokens_used INTEGER,
    response_time_ms INTEGER,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para chat
CREATE INDEX IF NOT EXISTS idx_chat_analysis ON chat_history(analysis_id);
CREATE INDEX IF NOT EXISTS idx_chat_mac ON chat_history(mac_address);
CREATE INDEX IF NOT EXISTS idx_chat_timestamp ON chat_history(timestamp DESC);

-- Tabla de análisis en batch/bulk
CREATE TABLE IF NOT EXISTS bulk_analyses (
    id SERIAL PRIMARY KEY,
    batch_id UUID NOT NULL DEFAULT gen_random_uuid(),
    mac_addresses TEXT[] NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    total_count INTEGER NOT NULL,
    completed_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    
    -- Resultados
    results JSONB,
    errors JSONB,
    
    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para bulk
CREATE INDEX IF NOT EXISTS idx_bulk_batch ON bulk_analyses(batch_id);
CREATE INDEX IF NOT EXISTS idx_bulk_status ON bulk_analyses(status);
CREATE INDEX IF NOT EXISTS idx_bulk_started ON bulk_analyses(started_at DESC);

-- Tabla de configuración de prompts personalizados
CREATE TABLE IF NOT EXISTS custom_prompts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prompt_template TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar prompt por defecto
INSERT INTO custom_prompts (name, description, prompt_template, is_default, is_active)
VALUES (
    'Informe Estándar Call Center',
    'Prompt optimizado para agentes de call center',
    '# ROL Y OBJETIVO
Actúa como un ingeniero de redes senior y experto en soporte técnico. Tu misión es traducir los siguientes datos técnicos crudos en un informe ejecutivo para un agente de call center que necesita entender rápidamente la situación de un cliente y darle soluciones claras. El informe debe ser accionable, preciso y fácil de digerir.

# REGLAS CRÍTICAS DE FORMATO Y TONO
- **Formato Estricto**: USA ÚNICAMENTE TEXTO PLANO. Está ABSOLUTAMENTE PROHIBIDO el uso de markdown.
- **Títulos**: Usa MAYÚSCULAS sostenidas para los títulos de las secciones principales.
- **Iconografía Simple**: Solo puedes usar estos emojis para indicar estado:
  - ✅: Bueno, sin problemas detectados.
  - ⚠️: Advertencia, algo podría mejorar o requiere monitoreo.
  - ❌: Problema crítico, requiere acción inmediata.

--- DATOS TÉCNICOS RAW ---
{contenido}',
    true,
    true
) ON CONFLICT DO NOTHING;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_gateway_analyses_updated_at 
    BEFORE UPDATE ON gateway_analyses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bulk_analyses_updated_at 
    BEFORE UPDATE ON bulk_analyses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_prompts_updated_at 
    BEFORE UPDATE ON custom_prompts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vista para análisis recientes con resumen
CREATE OR REPLACE VIEW recent_analyses AS
SELECT 
    id,
    mac_address,
    analysis_timestamp,
    general_status,
    status_emoji,
    devices_count,
    reboot_count,
    channel_change_count,
    optical_status,
    analysis_duration_ms,
    created_at
FROM gateway_analyses
ORDER BY created_at DESC
LIMIT 100;

-- Vista para estadísticas por MAC
CREATE OR REPLACE VIEW mac_statistics AS
SELECT 
    mac_address,
    COUNT(*) as total_analyses,
    AVG(devices_count) as avg_devices,
    AVG(reboot_count) as avg_reboots,
    AVG(channel_change_count) as avg_channel_changes,
    MAX(analysis_timestamp) as last_analysis,
    MIN(analysis_timestamp) as first_analysis
FROM gateway_analyses
GROUP BY mac_address;

COMMENT ON TABLE gateway_analyses IS 'Almacena todos los análisis de gateways WiFi realizados';
COMMENT ON TABLE chat_history IS 'Historial de conversaciones con IA por análisis';
COMMENT ON TABLE bulk_analyses IS 'Análisis en lote de múltiples gateways';
COMMENT ON TABLE custom_prompts IS 'Plantillas personalizadas de prompts para la IA';
