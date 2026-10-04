import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Mic, 
  Volume2, 
  Activity, 
  Compass, 
  Layers, 
  CheckCircle2, 
  RefreshCw,
  Eye,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { KaiOrbState } from '../types';

interface KaiOrbProps {
  state: KaiOrbState;
  statusMessage: string;
  onSendPrompt: (prompt: string) => void;
  isLoading?: boolean;
}

export const KaiOrb: React.FC<KaiOrbProps> = ({
  state,
  statusMessage,
  onSendPrompt,
  isLoading = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendPrompt(inputText.trim());
    setInputText('');
  };

  const quickPrompts = [
    "Crée-moi une expérience premium pour cette montre mécanique. Je veux voir la matière brute, les pièces, le mécanisme, puis la montre qui s'assemble progressivement pendant le scroll.",
    "Fais-moi un site pour un concept hypercar électrique : reveal aérodynamique, éclaté du pack batterie et assemblage châssis.",
    "Expérience sneaker de course ultra-légère : décomposition des mousses, semelle carbone et reveal cinématique.",
    "Je veux un rendu Apple / luxe / cinématique avec apparition progressive de chaque composant."
  ];

  // Dynamic visual styling for Orb states
  const getOrbGradient = () => {
    switch (state) {
      case 'listening':
        return 'from-cyan-400 via-blue-500 to-indigo-600 shadow-cyan-500/50';
      case 'planning':
        return 'from-amber-400 via-orange-500 to-yellow-300 shadow-amber-500/50';
      case 'generating':
        return 'from-purple-500 via-pink-500 to-rose-400 shadow-purple-500/50';
      case 'coding':
        return 'from-emerald-400 via-teal-500 to-cyan-500 shadow-emerald-500/50';
      case 'testing':
        return 'from-blue-400 via-indigo-500 to-violet-600 shadow-blue-500/50';
      case 'fixing':
        return 'from-rose-500 via-red-500 to-amber-500 shadow-red-500/50';
      case 'done':
        return 'from-amber-300 via-yellow-400 to-amber-600 shadow-amber-400/60';
      case 'idle':
      default:
        return 'from-indigo-500 via-purple-600 to-amber-400 shadow-indigo-500/40';
    }
  };

  const getStateBadge = () => {
    switch (state) {
      case 'planning': return { label: 'PLANNING', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'generating': return { label: 'GENERATING', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'coding': return { label: 'CODING', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'testing': return { label: 'TESTING', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'fixing': return { label: 'FIXING', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'done': return { label: 'EXPERIENCE READY', color: 'bg-green-500/20 text-green-300 border-green-500/40' };
      default: return { label: 'KAI READY', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
    }
  };

  const badge = getStateBadge();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#10141e] via-[#0b0e14] to-[#07090d] border border-indigo-500/20 p-6 sm:p-8 shadow-2xl space-y-6">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section with Orb Core */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Orb Graphic & Status text */}
        <div className="flex items-center gap-5">
          {/* Animated 3D-like Glowing Orb */}
          <div className="relative flex items-center justify-center shrink-0">
            {/* Outer pulsating energy rings */}
            <div className={`absolute w-24 h-24 rounded-full border border-indigo-400/20 animate-ping opacity-40`} />
            <div className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400/20 to-purple-500/20 animate-pulse blur-md" />
            
            {/* Main Orb Sphere */}
            <div className={`relative w-16 h-16 rounded-full bg-gradient-to-tr ${getOrbGradient()} shadow-lg flex items-center justify-center transition-all duration-700 cursor-pointer hover:scale-105 active:scale-95 group`}>
              <div className="w-14 h-14 rounded-full bg-slate-950/30 backdrop-blur-sm flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white animate-spin" style={{ animationDuration: '8s' }} />
                </div>
              </div>
              {/* Highlight gleam */}
              <div className="absolute top-1.5 left-2.5 w-4 h-2 rounded-full bg-white/50 blur-[1px] rotate-[-30deg]" />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-indigo-200 uppercase">
                KAI ORB CORE
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badge.color}`}>
                {badge.label}
              </span>
            </div>
            
            <p className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />}
              <span>{statusMessage}</span>
            </p>

            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
              <span>Direction Artistique</span>
              <span>•</span>
              <span className="text-amber-300">Zéro Code Requis</span>
              <span>•</span>
              <span className="text-indigo-300">Orchestration KAI</span>
            </div>
          </div>
        </div>

        {/* System telemetry badge */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-slate-400">Web Factory:</span>
            <strong className="text-white">Active</strong>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Inspector:</span>
            <strong className="text-amber-300">Ready</strong>
          </div>
        </div>
      </div>

      {/* Conversational Natural Language Input */}
      <form onSubmit={handleSubmit} className="relative z-10 space-y-3">
        <div className="relative flex items-center bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 focus-within:border-amber-400/80 rounded-2xl p-1.5 transition-all shadow-inner">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder="Ex: 'Crée-moi une expérience premium pour cette montre. Je veux voir la matière brute, les pièces, puis l'assemblage au scroll...'"
            className="w-full bg-transparent px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
          />

          <div className="flex items-center gap-1.5 pr-2">
            <button
              type="button"
              onClick={() => {
                setIsVoiceActive(!isVoiceActive);
                if (!inputText) setInputText(quickPrompts[0]);
              }}
              className={`p-2 rounded-xl transition-all ${
                isVoiceActive 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Simulation vocale Orbe KAI"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-slate-950" />
              )}
              <span className="hidden sm:inline">Créer l’Expérience</span>
            </button>
          </div>
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="space-y-1.5">
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Exemples d’intentions cinématiques directes à l'Orbe :</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInputText(prompt)}
                className="text-left px-3 py-1.5 rounded-xl bg-slate-900/70 hover:bg-indigo-950/40 text-slate-300 hover:text-white text-xs border border-slate-800/80 hover:border-indigo-500/40 transition-all"
              >
                {prompt.length > 70 ? `${prompt.slice(0, 70)}...` : prompt}
              </button>
            ))}
          </div>
        </div>
      </form>

    </div>
  );
};
