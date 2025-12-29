'use client';

import { useState } from 'react';
import { Search, Loader2, Plus, X } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { gatewayAPI } from '@/lib/api';

export default function AnalyzerForm() {
  const [macInput, setMacInput] = useState('');
  const {
    analysisMode,
    setAnalysisMode,
    bulkMacs,
    setBulkMacs,
    setCurrentAnalysis,
    setIsLoading,
    isLoading,
    setError,
    clearAll,
  } = useAppStore();

  const handleAddMac = () => {
    if (macInput.trim()) {
      setBulkMacs([...bulkMacs, macInput.trim()]);
      setMacInput('');
    }
  };

  const handleRemoveMac = (index: number) => {
    setBulkMacs(bulkMacs.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    try {
      clearAll();
      setIsLoading(true);
      setError(null);

      const macs = analysisMode === 'single' 
        ? [macInput.trim()] 
        : bulkMacs;

      if (macs.length === 0 || (analysisMode === 'single' && !macInput.trim())) {
        setError('Por favor ingresa al menos una MAC address');
        setIsLoading(false);
        return;
      }

      const result = await gatewayAPI.analyze(macs, analysisMode);
      
      if (result.success) {
        if (analysisMode === 'single') {
          setCurrentAnalysis(result);
        }
        // Para bulk, mostrar resultados en otro componente
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al analizar el gateway');
      console.error('Analysis error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Nuevo Análisis
        </h2>
        <p className="text-sm text-gray-600">
          Ingresa la MAC address del gateway para diagnosticar
        </p>
      </div>

      {/* Selector de modo */}
      <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setAnalysisMode('single')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            analysisMode === 'single'
              ? 'bg-white shadow-sm text-primary-700 font-medium'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Individual
        </button>
        <button
          onClick={() => setAnalysisMode('bulk')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            analysisMode === 'bulk'
              ? 'bg-white shadow-sm text-primary-700 font-medium'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Múltiple
        </button>
      </div>

      {analysisMode === 'single' ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              MAC Address
            </label>
            <input
              type="text"
              value={macInput}
              onChange={(e) => setMacInput(e.target.value)}
              placeholder="XX:XX:XX:XX:XX:XX"
              className="input-field"
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              disabled={isLoading}
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agregar MAC Address
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={macInput}
                onChange={(e) => setMacInput(e.target.value)}
                placeholder="XX:XX:XX:XX:XX:XX"
                className="input-field"
                onKeyPress={(e) => e.key === 'Enter' && handleAddMac()}
                disabled={isLoading}
              />
              <button
                onClick={handleAddMac}
                className="btn-secondary"
                disabled={isLoading}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {bulkMacs.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MACs a analizar ({bulkMacs.length})
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {bulkMacs.map((mac, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm font-mono">{mac}</span>
                    <button
                      onClick={() => handleRemoveMac(index)}
                      className="text-red-600 hover:text-red-800"
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <button
        onClick={handleAnalyze}
        disabled={isLoading}
        className="btn-primary w-full flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Analizando...</span>
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            <span>Analizar Gateway</span>
          </>
        )}
      </button>

      {isLoading && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Esto puede tomar algunos segundos...
          </p>
        </div>
      )}
    </div>
  );
}
