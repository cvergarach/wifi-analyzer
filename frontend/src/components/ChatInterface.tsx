'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { analysisAPI } from '@/lib/api';

export default function ChatInterface() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const { currentAnalysis, chatHistory, setChatHistory, addChatMessage } = useAppStore();

  useEffect(() => {
    if (currentAnalysis?.analysisId) {
      loadChatHistory();
    }
  }, [currentAnalysis?.analysisId]);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const response = await analysisAPI.getChatHistory(currentAnalysis!.analysisId!);
      if (response.success) {
        setChatHistory(response.history);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !currentAnalysis?.analysisId) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    // Agregar mensaje del usuario inmediatamente
    addChatMessage({
      role: 'user',
      message: userMessage,
    });

    try {
      const response = await analysisAPI.chat(currentAnalysis.analysisId, userMessage);
      
      if (response.success) {
        addChatMessage({
          role: 'assistant',
          message: response.response,
        });
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      addChatMessage({
        role: 'assistant',
        message: 'Lo siento, hubo un error al procesar tu pregunta. Por favor intenta nuevamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentAnalysis) return null;

  return (
    <div className="card h-[500px] flex flex-col">
      <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-gray-200">
        <MessageSquare className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Chat con IA
        </h3>
        <span className="text-sm text-gray-500">
          Pregunta sobre el análisis
        </span>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {chatHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                Haz una pregunta sobre los datos técnicos del gateway
              </p>
            </div>
          </div>
        ) : (
          <>
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  {msg.timestamp && (
                    <p className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-primary-100' : 'text-gray-500'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
          placeholder="Escribe tu pregunta..."
          className="input-field"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !message.trim()}
          className="btn-primary"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
