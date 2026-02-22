/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Send, 
  Trash2, 
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Zap,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { aggregator } from './services/aggregator';
import { ProviderConfig, ProviderResponse } from './services/providers/types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProviderResponse[]>([]);
  const [configs, setConfigs] = useState<Record<string, ProviderConfig>>({
    'Google Gemini': {
      model: 'gemini-3-flash-preview',
      temperature: 0.7,
      maxTokens: 1024,
    },
    'Groq': {
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      maxTokens: 1024,
    },
  });

  const providers = aggregator.getProviders();

  const handleRunAll = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const responses = await aggregator.runAll(prompt, configs);
      setResults(responses);
    } catch (error) {
      console.error('Aggregator error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPrompt('');
    setResults([]);
  };

  const updateConfig = (providerName: string, key: keyof ProviderConfig, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [providerName]: {
        ...prev[providerName],
        [key]: value
      }
    }));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FA]">
      {/* Sidebar */}
      <aside className="w-80 border-r border-[#E9ECEF] bg-white flex flex-col overflow-y-auto">
        <div className="p-6 border-bottom border-[#E9ECEF]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-black rounded-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">AI Aggregator</h1>
          </div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Model Configuration</p>
        </div>

        <div className="flex-1 p-6 space-y-8">
          {providers.map((provider) => (
            <div key={provider.name} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-gray-400" />
                  <h3 className="font-medium text-sm">{provider.name}</h3>
                </div>
                {provider.hasApiKey ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                    <CheckCircle2 className="w-3 h-3" /> Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-tighter">
                    <AlertCircle className="w-3 h-3" /> Key Missing
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mono-label block mb-1.5">Model</label>
                  <select 
                    className="w-full text-sm border border-[#E9ECEF] rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-black"
                    value={configs[provider.name]?.model}
                    onChange={(e) => updateConfig(provider.name, 'model', e.target.value)}
                  >
                    {provider.availableModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="mono-label">Temperature</label>
                    <span className="text-[10px] font-mono font-bold">{configs[provider.name]?.temperature}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1"
                    className="w-full accent-black"
                    value={configs[provider.name]?.temperature}
                    onChange={(e) => updateConfig(provider.name, 'temperature', parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <label className="mono-label block mb-1.5">Max Tokens</label>
                  <input 
                    type="number" 
                    className="w-full text-sm border border-[#E9ECEF] rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-black"
                    value={configs[provider.name]?.maxTokens}
                    onChange={(e) => updateConfig(provider.name, 'maxTokens', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-[#E9ECEF] bg-gray-50">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Parallel execution is enabled. Responses are collected and displayed as they arrive.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-[#E9ECEF] bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span className="text-xs font-semibold">Parallel Mode Active</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleClear}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-500"
              title="Clear all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={handleRunAll}
              disabled={loading || !prompt.trim()}
              className={cn(
                "flex items-center gap-2 px-6 py-2 bg-black text-white rounded-md font-medium transition-all",
                (loading || !prompt.trim()) ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800 active:scale-95"
              )}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Run All Models</span>
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Prompt Input */}
          <div className="max-w-4xl mx-auto w-full">
            <div className="relative">
              <textarea 
                placeholder="Enter your prompt here..."
                className="w-full min-h-[120px] p-6 text-lg border border-[#E9ECEF] rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-black/5 resize-none transition-all"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleRunAll();
                  }
                }}
              />
              <div className="absolute bottom-4 right-4 text-[10px] text-gray-400 font-mono uppercase">
                Enter to run • Shift + Enter for new line
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {results.length > 0 ? (
                results.map((res, idx) => (
                  <motion.div
                    key={`${res.providerName}-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.1 }}
                    className="data-card rounded-xl flex flex-col h-full"
                  >
                    <div className="p-5 border-b border-[#E9ECEF] flex items-center justify-between bg-gray-50/50 rounded-t-xl">
                      <div>
                        <h4 className="font-semibold text-sm">{res.providerName}</h4>
                        <p className="text-[11px] text-gray-500 font-mono">{res.model}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {res.latency && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400">
                            <Clock className="w-3 h-3" />
                            {res.latency}ms
                          </div>
                        )}
                        <div className="px-2 py-0.5 bg-white border border-[#E9ECEF] rounded text-[10px] font-bold uppercase tracking-tighter">
                          {res.error ? 'Failed' : 'Success'}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 flex-1">
                      {res.error ? (
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <p>{res.error}</p>
                        </div>
                      ) : (
                        <div className="markdown-body">
                          <Markdown>{res.content}</Markdown>
                        </div>
                      )}
                    </div>

                    {res.tokensUsed && (
                      <div className="px-6 py-3 border-t border-[#E9ECEF] bg-gray-50/30 rounded-b-xl flex gap-6">
                        <div className="flex flex-col">
                          <span className="mono-label">Prompt</span>
                          <span className="text-xs font-mono font-medium">{res.tokensUsed.prompt}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="mono-label">Completion</span>
                          <span className="text-xs font-mono font-medium">{res.tokensUsed.completion}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="mono-label">Total</span>
                          <span className="text-xs font-mono font-bold">{res.tokensUsed.total}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              ) : loading ? (
                // Skeleton Loaders
                [1, 2].map((i) => (
                  <div key={i} className="data-card rounded-xl h-[400px] animate-pulse flex flex-col">
                    <div className="h-16 bg-gray-100 rounded-t-xl" />
                    <div className="p-6 space-y-4 flex-1">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-4 bg-gray-100 rounded w-1/2" />
                      <div className="h-4 bg-gray-100 rounded w-5/6" />
                    </div>
                    <div className="h-12 bg-gray-50 rounded-b-xl" />
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <Layers className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="text-sm font-medium">No results to display yet.</p>
                  <p className="text-xs">Enter a prompt and click "Run All Models" to begin.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
