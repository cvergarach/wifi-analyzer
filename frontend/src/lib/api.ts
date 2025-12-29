import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 2 minutos para análisis largos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const gatewayAPI = {
  // Analizar gateways
  analyze: async (macAddresses: string[], mode: 'single' | 'bulk' = 'single', promptTemplate?: string) => {
    const response = await api.post('/api/gateway/analyze', {
      macAddresses,
      mode,
      promptTemplate,
    });
    return response.data;
  },

  // Obtener información básica
  getInfo: async (mac: string) => {
    const response = await api.get(`/api/gateway/${mac}/info`);
    return response.data;
  },

  // Obtener dispositivos conectados
  getDevices: async (mac: string) => {
    const response = await api.get(`/api/gateway/${mac}/devices`);
    return response.data;
  },

  // Obtener configuración WiFi
  getWiFi: async (mac: string) => {
    const response = await api.get(`/api/gateway/${mac}/wifi`);
    return response.data;
  },

  // Obtener redes vecinas
  getNeighbors: async (mac: string) => {
    const response = await api.get(`/api/gateway/${mac}/neighbors`);
    return response.data;
  },
};

export const analysisAPI = {
  // Chat con IA
  chat: async (analysisId: number, message: string) => {
    const response = await api.post(`/api/analysis/${analysisId}/chat`, {
      message,
    });
    return response.data;
  },

  // Obtener historial de chat
  getChatHistory: async (analysisId: number) => {
    const response = await api.get(`/api/analysis/${analysisId}/chat/history`);
    return response.data;
  },

  // Regenerar informe
  regenerate: async (analysisId: number, promptTemplate: string) => {
    const response = await api.post(`/api/analysis/${analysisId}/regenerate`, {
      promptTemplate,
    });
    return response.data;
  },

  // Obtener prompts disponibles
  getPrompts: async () => {
    const response = await api.get('/api/analysis/prompts');
    return response.data;
  },

  // Obtener prompt específico
  getPrompt: async (id: number) => {
    const response = await api.get(`/api/analysis/prompts/${id}`);
    return response.data;
  },

  // Crear nuevo prompt
  createPrompt: async (data: {
    name: string;
    description?: string;
    prompt_template: string;
    is_default?: boolean;
  }) => {
    const response = await api.post('/api/analysis/prompts', data);
    return response.data;
  },
};

export const historyAPI = {
  // Obtener historial
  getHistory: async (params?: {
    page?: number;
    limit?: number;
    mac?: string;
    status?: string;
  }) => {
    const response = await api.get('/api/history', { params });
    return response.data;
  },

  // Obtener análisis específico
  getAnalysis: async (id: number) => {
    const response = await api.get(`/api/history/${id}`);
    return response.data;
  },

  // Obtener historial por MAC
  getMacHistory: async (mac: string, limit?: number) => {
    const response = await api.get(`/api/history/mac/${mac}`, {
      params: { limit },
    });
    return response.data;
  },

  // Obtener estadísticas
  getStats: async () => {
    const response = await api.get('/api/history/stats/overview');
    return response.data;
  },

  // Eliminar análisis
  deleteAnalysis: async (id: number) => {
    const response = await api.delete(`/api/history/${id}`);
    return response.data;
  },

  // Obtener resultado de bulk analysis
  getBulkAnalysis: async (batchId: string) => {
    const response = await api.get(`/api/history/bulk/${batchId}`);
    return response.data;
  },
};

export default api;
