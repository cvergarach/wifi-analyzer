'use client';

import { useAppStore } from '@/store/appStore';
import { Copy, Download, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function ReportDisplay() {
  const { currentAnalysis, setError } = useAppStore();
  const [copied, setCopied] = useState(false);

  if (!currentAnalysis) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentAnalysis.report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([currentAnalysis.report], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `informe_${currentAnalysis.mac}_${new Date().toISOString()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getStatusColor = () => {
    switch (currentAnalysis.metrics?.generalStatus) {
      case 'good':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Informe de Diagnóstico
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            MAC: <span className="font-mono">{currentAnalysis.mac}</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="btn-secondary flex items-center space-x-2"
            title="Copiar al portapapeles"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">
              {copied ? 'Copiado!' : 'Copiar'}
            </span>
          </button>
          
          <button
            onClick={handleDownload}
            className="btn-secondary flex items-center space-x-2"
            title="Descargar como archivo"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Descargar</span>
          </button>
        </div>
      </div>

      {/* Métricas rápidas */}
      {currentAnalysis.metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Estado General</p>
            <p className={`text-lg font-semibold ${
              currentAnalysis.metrics.generalStatus === 'good' ? 'text-green-600' :
              currentAnalysis.metrics.generalStatus === 'warning' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {currentAnalysis.metrics.generalStatus === 'good' ? '✅ Bueno' :
               currentAnalysis.metrics.generalStatus === 'warning' ? '⚠️ Advertencia' :
               '❌ Crítico'}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Dispositivos</p>
            <p className="text-lg font-semibold text-gray-900">
              {currentAnalysis.metrics.devicesCount}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Reinicios</p>
            <p className="text-lg font-semibold text-gray-900">
              {currentAnalysis.metrics.rebootCount}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Cambios Canal</p>
            <p className="text-lg font-semibold text-gray-900">
              {currentAnalysis.metrics.channelChangeCount}
            </p>
          </div>
        </div>
      )}

      {/* Informe completo */}
      <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
        <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
          {currentAnalysis.report}
        </pre>
      </div>

      {/* Tiempo de análisis */}
      <div className="mt-4 text-sm text-gray-500 text-right">
        Análisis completado en {(currentAnalysis.duration / 1000).toFixed(2)}s
      </div>
    </div>
  );
}
