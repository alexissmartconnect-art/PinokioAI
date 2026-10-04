import React from 'react';
import { 
  Sparkles, 
  Sliders, 
  Layers, 
  HardDrive, 
  FileCode2, 
  Bot, 
  Cpu, 
  Film,
  Settings,
  Bug,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { HardwareVram } from '../types';

interface NavbarProps {
  activeTab: 'vision' | 'configurator' | 'ltx_director' | 'apps' | 'doctor' | 'scripts' | 'logs' | 'cinematic';
  setActiveTab: (tab: 'vision' | 'configurator' | 'ltx_director' | 'apps' | 'doctor' | 'scripts' | 'logs' | 'cinematic') => void;
  selectedVram: HardwareVram;
  setSelectedVram: (vram: HardwareVram) => void;
  toggleChat: () => void;
  isChatOpen: boolean;
  onOpenApiSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedVram,
  setSelectedVram,
  toggleChat,
  isChatOpen,
  onOpenApiSettings,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0c0e12]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/20 font-black text-xl">
              <span className="transform -rotate-12 select-none">P</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">Pinokio</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  AI Studio Copilot
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Assistant Wan2GP, LTX Video & Écosystème Local</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60">
            <button
              onClick={() => setActiveTab('cinematic')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'cinematic'
                  ? 'bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-600 text-white font-bold shadow-md shadow-pink-500/25 ring-1 ring-white/30'
                  : 'text-amber-300 hover:text-white hover:bg-slate-800/50 bg-amber-500/10 border border-amber-500/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
              <span>KAI Expérience Cinématique</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 text-[9px] font-mono font-bold">Phase 5</span>
            </button>

            <button
              onClick={() => setActiveTab('vision')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'vision'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Vision & Prompts IA
            </button>

            <button
              onClick={() => setActiveTab('configurator')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'configurator'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Wan2GP & LTX Menus
            </button>

            <button
              onClick={() => setActiveTab('ltx_director')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'ltx_director'
                  ? 'bg-gradient-to-r from-indigo-500 to-amber-500 text-slate-950 font-bold shadow-md shadow-indigo-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              LTX Director & Plugins
            </button>

            <button
              onClick={() => setActiveTab('apps')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'apps'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Modules Pinokio
            </button>

            <button
              onClick={() => setActiveTab('doctor')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'doctor'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              Disk Saver & Système
            </button>

            <button
              onClick={() => setActiveTab('scripts')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'scripts'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              Scripts Pinokio.js
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'logs'
                  ? 'bg-gradient-to-r from-red-500 to-amber-500 text-slate-950 font-bold shadow-md shadow-red-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Bug className="w-3.5 h-3.5 text-red-400" />
              Logs & Crash Doctor
            </button>
          </nav>

          {/* Right Controls: VRAM profile & AI Chat Assistant */}
          <div className="flex items-center gap-3">
            {/* GPU Hardware Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] text-slate-400 font-mono">GPU:</span>
              <select
                value={selectedVram}
                onChange={(e) => setSelectedVram(e.target.value as HardwareVram)}
                className="bg-transparent text-xs text-amber-300 font-semibold outline-none cursor-pointer pr-1"
                title="Sélectionnez votre quantité de VRAM pour optimiser automatiquement les réglages"
              >
                <option value="6GB" className="bg-slate-900 text-slate-200">6GB (Poor GPU / RTX 2060)</option>
                <option value="8GB" className="bg-slate-900 text-slate-200">8GB (RTX 3070/4060)</option>
                <option value="12GB" className="bg-slate-900 text-slate-200">12GB (RTX 3060 12G/4070)</option>
                <option value="16GB" className="bg-slate-900 text-slate-200">16GB (RTX 4080)</option>
                <option value="24GB+" className="bg-slate-900 text-slate-200">24GB+ (RTX 3090/4090)</option>
                <option value="Mac_Silicon" className="bg-slate-900 text-slate-200">Mac M-Series (32GB+)</option>
              </select>
            </div>

            {/* API Settings Button */}
            <button
              onClick={onOpenApiSettings}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors shadow-sm"
              title="Réglages des APIs et mise à jour des modèles IA"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Réglages API</span>
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={toggleChat}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isChatOpen
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
                  : 'bg-slate-800/80 text-amber-300 border-amber-500/30 hover:bg-slate-700/80'
              }`}
            >
              <Bot className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Pinokio AI</span>
            </button>

            {/* Link to Pinokio.co */}
            <a
              href="https://pinokio.co"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
              title="Ouvrir le site officiel Pinokio.co"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center space-x-1 py-2 overflow-x-auto border-t border-slate-800/60">
          <button
            onClick={() => setActiveTab('vision')}
            className={`px-3 py-1 rounded-md text-xs whitespace-nowrap ${
              activeTab === 'vision' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
            }`}
          >
            Vision & Prompts
          </button>
          <button
            onClick={() => setActiveTab('configurator')}
            className={`px-3 py-1 rounded-md text-xs whitespace-nowrap ${
              activeTab === 'configurator' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
            }`}
          >
            Wan2GP & LTX
          </button>
          <button
            onClick={() => setActiveTab('apps')}
            className={`px-3 py-1 rounded-md text-xs whitespace-nowrap ${
              activeTab === 'apps' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
            }`}
          >
            Modules
          </button>
          <button
            onClick={() => setActiveTab('doctor')}
            className={`px-3 py-1 rounded-md text-xs whitespace-nowrap ${
              activeTab === 'doctor' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
            }`}
          >
            Disk Saver
          </button>
          <button
            onClick={() => setActiveTab('scripts')}
            className={`px-3 py-1 rounded-md text-xs whitespace-nowrap ${
              activeTab === 'scripts' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
            }`}
          >
            Scripts
          </button>
        </div>

      </div>
    </header>
  );
};
