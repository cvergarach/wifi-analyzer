import { create } from 'zustand';

interface Analysis {
  id?: number;
  mac: string;
  report: string;
  technicalData: any;
  metrics: {
    devicesCount: number;
    rebootCount: number;
    channelChangeCount: number;
    generalStatus: string;
  };
  duration: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  message: string;
  timestamp?: string;
}

interface AppState {
  // Estado de análisis
  currentAnalysis: Analysis | null;
  setCurrentAnalysis: (analysis: Analysis | null) => void;
  
  // Estado de carga
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Errores
  error: string | null;
  setError: (error: string | null) => void;
  
  // Chat
  chatHistory: ChatMessage[];
  setChatHistory: (history: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  
  // Modo de análisis
  analysisMode: 'single' | 'bulk';
  setAnalysisMode: (mode: 'single' | 'bulk') => void;
  
  // MACs en bulk
  bulkMacs: string[];
  setBulkMacs: (macs: string[]) => void;
  
  // Resultados de bulk
  bulkResults: any[];
  setBulkResults: (results: any[]) => void;
  
  // Limpiar todo
  clearAll: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Estado inicial
  currentAnalysis: null,
  isLoading: false,
  error: null,
  chatHistory: [],
  analysisMode: 'single',
  bulkMacs: [],
  bulkResults: [],
  
  // Setters
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  setChatHistory: (history) => set({ chatHistory: history }),
  addChatMessage: (message) => 
    set((state) => ({ 
      chatHistory: [...state.chatHistory, message] 
    })),
  clearChat: () => set({ chatHistory: [] }),
  
  setAnalysisMode: (mode) => set({ analysisMode: mode }),
  setBulkMacs: (macs) => set({ bulkMacs: macs }),
  setBulkResults: (results) => set({ bulkResults: results }),
  
  clearAll: () => set({
    currentAnalysis: null,
    error: null,
    chatHistory: [],
    bulkMacs: [],
    bulkResults: [],
  }),
}));
