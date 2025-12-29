import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Genera un informe de diagnóstico usando la IA
   */
  async generateReport(technicalData, promptTemplate) {
    try {
      // Formatear los datos técnicos
      const formattedData = this.formatTechnicalData(technicalData);
      
      // Reemplazar el placeholder en el prompt
      const finalPrompt = promptTemplate.replace('{contenido}', formattedData);
      
      console.log('🤖 Generating AI report...');
      const result = await this.model.generateContent(finalPrompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ AI report generated successfully');
      return text;
    } catch (error) {
      console.error('❌ Error generating AI report:', error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  /**
   * Responde a una pregunta del chat considerando el contexto
   */
  async chatResponse(question, technicalData, chatHistory = []) {
    try {
      // Construir el contexto con el historial
      let contextPrompt = `Eres un asistente experto en análisis de redes WiFi y gateways.

DATOS TÉCNICOS DEL GATEWAY:
${this.formatTechnicalData(technicalData)}

HISTORIAL DE CONVERSACIÓN:
${chatHistory.map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.message}`).join('\n')}

PREGUNTA ACTUAL DEL USUARIO:
${question}

Responde de manera clara, concisa y técnicamente precisa basándote en los datos proporcionados.`;

      console.log('💬 Generating chat response...');
      const result = await this.model.generateContent(contextPrompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Chat response generated');
      return text;
    } catch (error) {
      console.error('❌ Error generating chat response:', error);
      throw new Error(`Chat response failed: ${error.message}`);
    }
  }

  /**
   * Formatea los datos técnicos para mejor legibilidad
   */
  formatTechnicalData(data) {
    const sections = [];
    
    if (data.sections) {
      sections.push('='.repeat(80));
      sections.push('===== INFORMACIÓN BÁSICA DEL GATEWAY =====');
      sections.push('='.repeat(80));
      sections.push(JSON.stringify(data.sections.basic_info, null, 2));
      
      sections.push('\n' + '='.repeat(80));
      sections.push('===== DISPOSITIVOS CONECTADOS =====');
      sections.push('='.repeat(80));
      sections.push(JSON.stringify(data.sections.connected_devices, null, 2));
      
      sections.push('\n' + '='.repeat(80));
      sections.push('===== DATOS DE RENDIMIENTO =====');
      sections.push('='.repeat(80));
      sections.push(JSON.stringify(data.sections.performance_data, null, 2));
      
      sections.push('\n' + '='.repeat(80));
      sections.push('===== CONFIGURACIÓN WIFI =====');
      sections.push('='.repeat(80));
      sections.push(JSON.stringify(data.sections.wifi_band_info, null, 2));
      
      sections.push('\n' + '='.repeat(80));
      sections.push('===== REDES VECINAS =====');
      sections.push('='.repeat(80));
      sections.push(JSON.stringify(data.sections.neighboring_ssids, null, 2));
      
      sections.push('\n' + '='.repeat(80));
      sections.push('===== PUERTOS LAN =====');
      sections.push('='.repeat(80));
      sections.push(JSON.stringify(data.sections.downstream_ports, null, 2));
      
      sections.push('\n' + '='.repeat(80));
      sections.push('===== EVENTOS RECIENTES =====');
      sections.push('='.repeat(80));
      sections.push(JSON.stringify(data.sections.events, null, 2));
    } else {
      sections.push(JSON.stringify(data, null, 2));
    }
    
    return sections.join('\n');
  }

  /**
   * Analiza y extrae métricas clave de los datos técnicos
   */
  extractKeyMetrics(technicalData) {
    const metrics = {
      devicesCount: 0,
      rebootCount: 0,
      channelChangeCount: 0,
      opticalRxPower: null,
      opticalTxPower: null,
      generalStatus: 'unknown'
    };

    try {
      // Extraer conteo de dispositivos
      if (technicalData.sections?.connected_devices) {
        const devices = technicalData.sections.connected_devices;
        if (devices && !devices.error && devices['huawei-nce-resource-activation-configuration-home-gateway:sub-devices']) {
          const deviceList = devices['huawei-nce-resource-activation-configuration-home-gateway:sub-devices']['sub-device'] || [];
          metrics.devicesCount = deviceList.length;
        }
      }

      // Extraer eventos (reinicios y cambios de canal)
      if (technicalData.sections?.events) {
        const events = technicalData.sections.events;
        if (events && !events.error && events['huawei-nce-homeinsight-event-management:events']) {
          const eventList = events['huawei-nce-homeinsight-event-management:events']['event'] || [];
          
          metrics.rebootCount = eventList.filter(e => 
            e['event-type'] === 'GATEWAY_ONLINE' || e['event-type'] === 'GATEWAY_REBOOT'
          ).length;
          
          metrics.channelChangeCount = eventList.filter(e => 
            e['event-type'] === 'WIFI_CHANNEL_CHANGE'
          ).length;
        }
      }

      // Determinar estado general basado en métricas
      if (metrics.rebootCount > 3 || metrics.channelChangeCount > 10) {
        metrics.generalStatus = 'critical';
      } else if (metrics.rebootCount > 1 || metrics.channelChangeCount > 5) {
        metrics.generalStatus = 'warning';
      } else {
        metrics.generalStatus = 'good';
      }

    } catch (error) {
      console.error('Error extracting metrics:', error);
    }

    return metrics;
  }
}

export default new AIService();
