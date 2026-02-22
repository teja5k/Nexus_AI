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
  Info,
  MessageSquare,
  History as HistoryIcon,
  X,
  ChevronDown,
  ChevronUp,
  LogIn,
  LogOut,
  Lock,
  Mail
} from 'lucide-react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { aggregator } from './services/aggregator';
import { ProviderConfig, ProviderResponse, HistoryItem } from './services/providers/types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_TEMPERATURE = 0.7;

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@nexusai.com' && password === '123456') {
      localStorage.setItem('isLoggedIn', 'true');
      onLogin();
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-[#E9ECEF] p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-black rounded-xl mb-4">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Nexus AI</h1>
          <p className="text-gray-500 text-sm">Sign in to access the aggregator</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <Mail className="w-3 h-3" /> Email Address
            </label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 rounded-xl border border-[#E9ECEF] focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
              placeholder="admin@nexusai.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <Lock className="w-3 h-3" /> Password
            </label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-xl border border-[#E9ECEF] focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-red-600 text-xs font-medium bg-red-50 p-3 rounded-lg border border-red-100"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}

          <button 
            type="submit"
            className="w-full bg-black text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#E9ECEF] text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
            Nexus Intelligence Systems v1.0
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ProviderResponse[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('ai-aggregator-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

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

  useEffect(() => {
    localStorage.setItem('ai-aggregator-history', JSON.stringify(history));
  }, [history]);

  const providers = aggregator.getProviders();

  const handleRunAll = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResults([]);
    
    // Update configs with default temperature before running
    const currentConfigs = { ...configs };
    Object.keys(currentConfigs).forEach(key => {
      currentConfigs[key].temperature = DEFAULT_TEMPERATURE;
    });

    try {
      const responses = await aggregator.runAll(prompt, currentConfigs);
      setResults(responses);

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: crypto.randomUUID(),
        prompt: prompt,
        responses: responses.map(r => ({
          provider: r.providerName,
          model: r.model,
          content: r.content,
          error: r.error
        })),
        temperature: DEFAULT_TEMPERATURE,
        timestamp: new Date().toLocaleString()
      };
      setHistory(prev => [newHistoryItem, ...prev]);
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

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('ai-aggregator-history');
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

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

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
              onClick={() => {
                localStorage.removeItem('isLoggedIn');
                setIsLoggedIn(false);
              }}
              className="p-2 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors text-gray-500 flex items-center gap-2 text-xs font-medium"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "p-2 rounded-md transition-colors flex items-center gap-2",
                showHistory ? "bg-black text-white" : "hover:bg-gray-100 text-gray-500"
              )}
              title="Toggle History"
            >
              <HistoryIcon className="w-5 h-5" />
              {history.length > 0 && (
                <span className="text-[10px] font-bold bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-full">
                  {history.length}
                </span>
              )}
            </button>
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
        <div className="flex-1 overflow-y-auto p-8 space-y-8 relative">
          {/* History Panel Overlay */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute top-0 right-0 w-96 h-full bg-white border-l border-[#E9ECEF] shadow-2xl z-50 flex flex-col"
              >
                <div className="p-6 border-b border-[#E9ECEF] flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-2">
                    <HistoryIcon className="w-4 h-4 text-gray-400" />
                    <h2 className="font-semibold text-sm">Conversation History</h2>
                  </div>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-8">
                      <HistoryIcon className="w-8 h-8 opacity-10 mb-2" />
                      <p className="text-xs">No history yet. Run a query to see it here.</p>
                    </div>
                  ) : (
                    history.map((item) => (
                      <div 
                        key={item.id} 
                        className="border border-[#E9ECEF] rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <button 
                          onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                          className="w-full p-4 text-left hover:bg-gray-50/50 transition-colors flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                              <p className="text-xs font-semibold text-gray-900 line-clamp-1">{item.prompt}</p>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{item.timestamp}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-1">
                            {expandedHistoryId === item.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {expandedHistoryId === item.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-[#E9ECEF] bg-gray-50/50"
                            >
                              <div className="p-4 space-y-4">
                                {item.responses.map((res, idx) => (
                                  <div key={idx} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{res.provider}</span>
                                      <span className="text-[9px] font-mono text-gray-400">{res.model}</span>
                                    </div>
                                    <div className="text-xs text-gray-700 bg-white p-3 rounded border border-[#E9ECEF] max-h-40 overflow-y-auto">
                                      {res.error ? (
                                        <span className="text-red-500 italic">{res.error}</span>
                                      ) : (
                                        <Markdown>{res.content}</Markdown>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  )}
                </div>

                {history.length > 0 && (
                  <div className="p-4 border-t border-[#E9ECEF] bg-gray-50">
                    <button 
                      onClick={clearHistory}
                      className="w-full py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-100 rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear History
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

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
