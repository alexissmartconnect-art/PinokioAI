import React, { useState } from 'react';
import { 
  Search, 
  Layers, 
  Video, 
  Music, 
  Terminal, 
  Sliders, 
  ExternalLink, 
  Copy, 
  Check, 
  Cpu, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertCircle
} from 'lucide-react';
import { PINOKIO_APPS } from '../data/pinokioDatabase';
import { PinokioApp } from '../types';

interface AppDirectoryProps {
  onSelectAppForConfig?: (app: PinokioApp) => void;
}

export const AppDirectory: React.FC<AppDirectoryProps> = ({ onSelectAppForConfig }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedAppId, setExpandedAppId] = useState<string | null>('wan2gp');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredApps = PINOKIO_APPS.filter((app) => {
    const matchesSearch = 
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const copyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 p-6 border border-slate-800 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5" />
            Écosystème & Modules Pinokio.co
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Annuaire & Spécifications des Modules Pinokio
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            Explorez les menus, les exigences VRAM matérielles et les commandes d'exécution des meilleurs outils IA 1-click : 
            Wan2GP, Maestro, YuE2 Groove, theDAW, ComfyUI et les Agents de Code.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, tag (#video-generation, #music, #agent)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Tous' },
              { id: 'video', label: 'Vidéo' },
              { id: 'audio', label: 'Audio / Musique' },
              { id: 'coding', label: 'Agents Code' },
              { id: 'utility', label: 'Utilitaires' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* App List */}
      <div className="space-y-4">
        {filteredApps.map((app) => {
          const isExpanded = expandedAppId === app.id;

          return (
            <div
              key={app.id}
              className={`rounded-2xl border transition-all ${
                isExpanded
                  ? 'bg-slate-900/95 border-amber-500/40 shadow-xl'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div
                onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 text-amber-400 font-bold text-lg shadow-inner">
                    {app.category === 'video' && <Video className="w-6 h-6" />}
                    {app.category === 'audio' && <Music className="w-6 h-6" />}
                    {app.category === 'coding' && <Terminal className="w-6 h-6" />}
                    {app.category === 'utility' && <Sliders className="w-6 h-6" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-white hover:text-amber-300 transition-colors">
                        {app.name}
                      </h2>
                      <span className="text-[11px] font-mono text-slate-400">
                        par {app.author}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                        {app.version}
                      </span>
                      {app.featured && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Vedette Pinokio
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                      {app.description}
                    </p>

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {app.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800/80">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Requirements & Expand toggle */}
                <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 justify-end">
                      <Cpu className="w-3 h-3 text-amber-400" />
                      <span>{app.minVram}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 max-w-[140px] truncate">
                      {app.recommendedGpu}
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-5 animate-fadeIn">
                  
                  {/* Key Menus Breakdown */}
                  <div>
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      Menus Principaux & Réglages Déterminants
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {app.keyMenus.map((menu, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                          <div className="font-bold text-white mb-0.5">{menu.menuName}</div>
                          <div className="text-slate-400 text-[11px] mb-2">{menu.description}</div>
                          <div className="flex flex-wrap gap-1">
                            {menu.criticalSettings.map((setting, sIdx) => (
                              <span key={sIdx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-slate-300">
                                {setting}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Troubleshooting & Hardware Advice */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      Astuces d'Optimisation & Dépannage
                    </h3>
                    <ul className="space-y-1.5">
                      {app.troubleshootingTips.map((tip, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Launch Command & Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2 flex-1 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 overflow-x-auto">
                      <span className="text-slate-500 select-none">$</span>
                      <span className="truncate">{app.launchCommand}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyCommand(app.launchCommand, app.id)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        {copiedId === app.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === app.id ? 'Copié !' : 'Copier commande'}
                      </button>

                      <a
                        href={app.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Voir Repo
                      </a>

                      {app.id === 'wan2gp' && onSelectAppForConfig && (
                        <button
                          onClick={() => onSelectAppForConfig(app)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          Configurer les Sliders
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
