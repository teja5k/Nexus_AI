/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { 
  Cpu,
  Send, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Zap,
  Layers,
  MessageSquare,
  History as HistoryIcon,
  X,
  ChevronDown,
  ChevronUp,
  Settings2,
  ToggleLeft,
  ToggleRight,
  Menu,
  Sparkles,
  Settings as SettingsIcon,
  Search,
  ArrowRight,
  Loader2
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

interface ChatTurn {
  id: string;
  prompt: string;
  responses: ProviderResponse[];
  timestamp: string;
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const resultsEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [configs, setConfigs] = useState<Record<string, ProviderConfig>>({
    'Google Gemini': {
      model: 'gemini-3-flash-preview',
      temperature: 0.7,
      maxTokens: 1024,
      enabled: true,
    },
    'Groq': {
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      maxTokens: 1024,
      enabled: true,
    },
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('nexusai_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (err) {
        console.error('Failed to parse saved history:', err);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('nexusai_history', JSON.stringify(history));
  }, [history]);

  // Auto-scroll to bottom when new results arrive or loading state changes
  useEffect(() => {
    if (resultsEndRef.current) {
      resultsEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [chatTurns, loading]);

  const providers = aggregator.getProviders();

  const handleRunAll = async () => {
    if (!prompt.trim()) return;
    const currentPrompt = prompt;
    setLoading(true);
    setHasSearched(true);
    setPrompt(''); // Clear input immediately for chat feel
    
    const currentConfigs = { ...configs };
    Object.keys(currentConfigs).forEach(key => {
      currentConfigs[key].temperature = DEFAULT_TEMPERATURE;
    });

    try {
      const responses = await aggregator.runAll(currentPrompt, currentConfigs);
      
      const newTurn: ChatTurn = {
        id: crypto.randomUUID(),
        prompt: currentPrompt,
        responses: responses,
        timestamp: new Date().toLocaleString()
      };

      setChatTurns(prev => [...prev, newTurn]);
      setHasSearched(true);

      // Save to local history
      const newHistoryItem: HistoryItem = {
        id: crypto.randomUUID(),
        prompt: currentPrompt,
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
    setChatTurns([]);
    setHasSearched(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('nexusai_history');
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
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
    <div className="flex h-screen overflow-hidden bg-[#050505] text-white">
      {/* Sidebar - History */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-white/5 bg-[#0A0A0A] flex flex-col overflow-hidden shrink-0"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">History</h2>
              </div>
              <button 
                onClick={clearHistory}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                title="Clear History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 text-center p-8">
                  <MessageSquare className="w-8 h-8 opacity-10 mb-4" />
                  <p className="text-xs font-medium">No conversations yet</p>
                </div>
              ) : (
                history.map((item) => (
                  <div 
                    key={item.id} 
                    className={cn(
                      "group border border-white/5 rounded-2xl overflow-hidden transition-all duration-300",
                      expandedHistoryId === item.id ? "bg-white/5 border-white/10" : "hover:bg-white/[0.02]"
                    )}
                  >
                    <div className="flex items-center pr-2">
                      <button 
                        onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}
                        className="flex-1 p-4 text-left flex items-start justify-between gap-3 min-w-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-300 line-clamp-1 mb-1">{item.prompt}</p>
                          <div className="flex items-center gap-2 text-[9px] text-gray-500 font-mono">
                            <Clock className="w-3 h-3" />
                            <span>{item.timestamp}</span>
                          </div>
                        </div>
                        <ChevronDown className={cn(
                          "w-4 h-4 text-gray-600 transition-transform duration-300 shrink-0",
                          expandedHistoryId === item.id && "rotate-180"
                        )} />
                      </button>
                      <button 
                        onClick={() => deleteHistoryItem(item.id)}
                        className="p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <AnimatePresence>
                      {expandedHistoryId === item.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-white/5 bg-black/20"
                        >
                          <div className="p-4 space-y-4">
                            {item.responses.map((res, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex items-center justify-between px-1">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">{res.provider}</span>
                                </div>
                                <div className="text-[11px] text-gray-400 bg-black/40 p-3 rounded-xl border border-white/5 max-h-32 overflow-y-auto">
                                  {res.error ? (
                                    <span className="text-red-400 italic">{res.error}</span>
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
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Navigation Bar */}
        <header className="h-20 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 z-30 sticky top-0">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 hover:bg-white/5 rounded-xl text-gray-400 transition-all active:scale-95"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">NexusAI</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Parallel Intelligence</span>
            </div>
            
            <div className="w-px h-6 bg-white/10 mx-2" />
            
            <button 
              onClick={() => setSettingsOpen(true)}
              className="p-2.5 hover:bg-white/5 rounded-xl text-gray-400 transition-all active:scale-95"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Workspace */}
        <main ref={scrollContainerRef} className="flex-1 overflow-y-auto relative scroll-smooth flex flex-col">
          <LayoutGroup>
            <div className="flex-1 max-w-6xl mx-auto w-full p-8 lg:p-12 space-y-12">
              <AnimatePresence mode="wait">
                {!hasSearched ? (
                  /* Hero / Initial State */
                  <motion.section 
                    key="hero"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center justify-center text-center space-y-12 py-24 min-h-[60vh]"
                  >
                    <div className="space-y-4">
                      <motion.h2 
                        layoutId="title"
                        className="text-5xl lg:text-7xl font-bold tracking-tight text-white"
                      >
                        Aggregate Intelligence.
                      </motion.h2>
                      <motion.p 
                        layoutId="subtitle"
                        className="text-gray-400 max-w-2xl mx-auto text-xl"
                      >
                        Query multiple state-of-the-art AI models simultaneously and compare results in real-time.
                      </motion.p>
                    </div>

                    <motion.div 
                      layoutId="search-bar"
                      className="w-full max-w-3xl relative group"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-20 group-focus-within:opacity-40 transition duration-500" />
                      <div className="relative bg-[#0F0F0F] border border-white/10 rounded-[2rem] p-2 flex items-end gap-2 shadow-2xl">
                        <textarea 
                          placeholder="Ask anything..."
                          className="flex-1 bg-transparent border-none focus:ring-0 text-lg p-6 min-h-[140px] max-h-[400px] resize-none text-white placeholder:text-gray-600"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleRunAll();
                            }
                          }}
                        />
                        <div className="p-4 flex flex-col gap-2">
                          <button 
                            onClick={handleClear}
                            className="p-3 hover:bg-white/5 rounded-2xl text-gray-500 transition-colors"
                            title="Clear"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={handleRunAll}
                            disabled={loading || !prompt.trim()}
                            className={cn(
                              "p-4 rounded-2xl transition-all flex items-center justify-center shadow-lg",
                              (loading || !prompt.trim()) 
                                ? "bg-white/5 text-gray-600 cursor-not-allowed" 
                                : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:scale-105 active:scale-95 shadow-indigo-500/20"
                            )}
                          >
                            {loading ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                              <Send className="w-6 h-6" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="mt-6 flex items-center justify-center gap-8 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600">
                        <span className="flex items-center gap-2"><Zap className="w-3 h-3" /> Parallel Processing</span>
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> Real-time Sync</span>
                      </div>
                    </motion.div>
                  </motion.section>
                ) : (
                  /* Results State */
                  <motion.div 
                    key="results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-24 pb-12"
                  >
                    {chatTurns.map((turn, turnIdx) => (
                      <div key={turn.id} className="space-y-12">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <MessageSquare className="w-6 h-6 text-indigo-400" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-xl font-bold text-white leading-tight">{turn.prompt}</h3>
                            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{turn.timestamp}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <AnimatePresence mode="popLayout">
                            {turn.responses.map((res, idx) => (
                              <motion.div
                                key={`${res.providerName}-${idx}`}
                                initial={{ opacity: 0, y: 40, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ 
                                  type: "spring",
                                  damping: 25,
                                  stiffness: 120,
                                  delay: idx * 0.1 
                                }}
                                className="data-card animate-slide-up rounded-[2rem] flex flex-col overflow-hidden group shadow-2xl shadow-black/50"
                              >
                                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-indigo-500/30 transition-colors">
                                      <Cpu className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-sm tracking-tight">{res.providerName}</h4>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-gray-500 uppercase">{res.model}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {res.latency && (
                                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded-lg">
                                        <Clock className="w-3 h-3" />
                                        {res.latency}ms
                                      </div>
                                    )}
                                    <div className={cn(
                                      "px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border",
                                      res.error 
                                        ? "bg-red-500/10 text-red-400 border-red-500/20" 
                                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    )}>
                                      {res.error ? 'Error' : 'Success'}
                                    </div>
                                  </div>
                                </div>

                                <div className="p-8 flex-1 overflow-y-auto max-h-[500px] scroll-smooth">
                                  {res.error ? (
                                    <div className="flex items-start gap-4 p-5 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-400 text-sm leading-relaxed">
                                      <AlertCircle className="w-5 h-5 shrink-0" />
                                      <p>{res.error}</p>
                                    </div>
                                  ) : (
                                    <div className="markdown-body">
                                      <Markdown>{res.content}</Markdown>
                                    </div>
                                  )}
                                </div>

                                {res.tokensUsed && (
                                  <div className="px-8 py-4 border-t border-white/5 bg-black/20 flex items-center justify-between">
                                    <div className="flex gap-8">
                                      <div className="flex flex-col">
                                        <span className="mono-label mb-1">Prompt</span>
                                        <span className="text-xs font-mono font-bold text-gray-400">{res.tokensUsed.prompt}</span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="mono-label mb-1">Completion</span>
                                        <span className="text-xs font-mono font-bold text-gray-400">{res.tokensUsed.completion}</span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <span className="mono-label mb-1">Total Tokens</span>
                                      <span className="text-sm font-mono font-black text-indigo-400 tracking-tighter">{res.tokensUsed.total}</span>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="space-y-12">
                        <div className="flex items-center gap-6 animate-pulse">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <div className="w-6 h-6 bg-white/10 rounded-full" />
                          </div>
                          <div className="h-6 bg-white/10 rounded-full w-48" />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {[1, 2].map((i) => (
                            <div key={i} className="data-card rounded-[2rem] h-[500px] animate-pulse flex flex-col">
                              <div className="h-20 bg-white/5 rounded-t-[2rem]" />
                              <div className="p-8 space-y-6 flex-1">
                                <div className="h-4 bg-white/5 rounded-full w-3/4" />
                                <div className="h-4 bg-white/5 rounded-full w-1/2" />
                                <div className="h-4 bg-white/5 rounded-full w-5/6" />
                              </div>
                              <div className="h-16 bg-white/5 rounded-b-[2rem]" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={resultsEndRef} className="h-1" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Chat-style Fixed Input (Visible only after first search) */}
            <AnimatePresence>
              {hasSearched && (
                <motion.div 
                  layoutId="search-bar"
                  className="sticky bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent z-40"
                >
                  <div className="max-w-4xl mx-auto relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-10 group-focus-within:opacity-30 transition duration-500" />
                    <div className="relative bg-[#0F0F0F] border border-white/10 rounded-2xl p-2 flex items-end gap-2 shadow-2xl">
                      <textarea 
                        placeholder="Ask a follow-up..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-base p-4 min-h-[60px] max-h-[200px] resize-none text-white placeholder:text-gray-600"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleRunAll();
                          }
                        }}
                      />
                      <div className="p-2 flex items-center gap-2">
                        <button 
                          onClick={handleClear}
                          className="p-2 hover:bg-white/5 rounded-xl text-gray-500 transition-colors"
                          title="New Chat"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={handleRunAll}
                          disabled={loading || !prompt.trim()}
                          className={cn(
                            "p-3 rounded-xl transition-all flex items-center justify-center shadow-lg",
                            (loading || !prompt.trim()) 
                              ? "bg-white/5 text-gray-600 cursor-not-allowed" 
                              : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:scale-105 active:scale-95 shadow-indigo-500/20"
                          )}
                        >
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Send className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>
        </main>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0F0F0F] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <SettingsIcon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">Provider Settings</h2>
                </div>
                <button 
                  onClick={() => setSettingsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl text-gray-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                {providers.map((provider) => (
                  <div key={provider.name} className="space-y-6 p-6 border border-white/5 rounded-3xl bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => updateConfig(provider.name, 'enabled', !configs[provider.name]?.enabled)}
                          className="transition-all active:scale-90"
                        >
                          {configs[provider.name]?.enabled !== false ? (
                            <ToggleRight className="w-8 h-8 text-indigo-500" />
                          ) : (
                            <ToggleLeft className="w-8 h-8 text-gray-700" />
                          )}
                        </button>
                        <div>
                          <h3 className={cn(
                            "font-bold text-base transition-opacity",
                            configs[provider.name]?.enabled === false && "opacity-40"
                          )}>
                            {provider.name}
                          </h3>
                          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                            {configs[provider.name]?.model}
                          </p>
                        </div>
                      </div>
                      {provider.hasApiKey ? (
                        <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                          <AlertCircle className="w-3 h-3" /> Key Missing
                        </span>
                      )}
                    </div>

                    {configs[provider.name]?.enabled !== false && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                        <div className="space-y-2">
                          <label className="mono-label block px-1">Model Selection</label>
                          <select 
                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            value={configs[provider.name]?.model}
                            onChange={(e) => updateConfig(provider.name, 'model', e.target.value)}
                          >
                            {provider.availableModels.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="mono-label block px-1">Max Tokens</label>
                          <input 
                            type="number" 
                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            value={configs[provider.name]?.maxTokens}
                            onChange={(e) => updateConfig(provider.name, 'maxTokens', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-end">
                <button 
                  onClick={() => setSettingsOpen(false)}
                  className="px-8 py-3 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
