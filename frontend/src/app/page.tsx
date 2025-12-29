'use client';

import { useState } from 'react';
import { Wifi, Search, Database, MessageSquare, TrendingUp } from 'lucide-react';
import AnalyzerForm from '@/components/AnalyzerForm';
import ReportDisplay from '@/components/ReportDisplay';
import ChatInterface from '@/components/ChatInterface';
import HistoryPanel from '@/components/HistoryPanel';
import StatsPanel from '@/components/StatsPanel';
import { useAppStore } from '@/store/appStore';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'history' | 'stats'>('analyzer');
  const { currentAnalysis } = useAppStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Wifi className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  WiFi Analyzer
                </h1>
                <p className="text-sm text-gray-600">
                  Diagnóstico de Gateways para Call Center
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('analyzer')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'analyzer'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">Analizador</span>
              </button>
              
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'history'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Database className="w-5 h-5" />
                <span className="hidden sm:inline">Historial</span>
              </button>
              
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'stats'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="hidden sm:inline">Estadísticas</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'analyzer' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario de análisis */}
            <div className="lg:col-span-1">
              <AnalyzerForm />
            </div>

            {/* Resultados y Chat */}
            <div className="lg:col-span-2 space-y-6">
              {currentAnalysis ? (
                <>
                  <ReportDisplay />
                  <ChatInterface />
                </>
              ) : (
                <div className="card h-96 flex flex-col items-center justify-center text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No hay análisis activo
                  </h3>
                  <p className="text-gray-500">
                    Ingresa una MAC address para comenzar el análisis
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && <HistoryPanel />}
        {activeTab === 'stats' && <StatsPanel />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              © 2025 WiFi Analyzer by Alquimia Datalive
            </div>
            <div className="flex items-center space-x-4">
              <span>Powered by Google Gemini AI</span>
              <span>•</span>
              <span>v1.0.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
