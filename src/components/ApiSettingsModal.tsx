import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  X, 
  Key, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  Zap, 
  Server, 
  Sliders, 
  Info,
  Sparkles
} from 'lucide-react';
import { AIProviderModel } from '../types';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableModels: AIProviderModel[];
  selectedModel: AIProviderModel;
  onSelectModel: (model: AIProviderModel) => void;
  onRefreshModels: () => Promise<void>;
  isRefreshingModels: boolean;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  availableModels,
  selectedModel,
  onSelectModel,
  onRefreshModels,
  isRefreshingModels,
}) => {
  const [providerStatuses, setProviderStatuses] = useState<{
    gemini: { available: boolean; label: string };
    openrouter: { available: boolean; label: string };
    mistral: { available: boolean; label: string };
  }>({
    gemini: { available: true, label: 'Gemini (Google GenAI)' },
    openrouter: { available: false, label: 'OpenRouter (Claude, DeepSeek)' },
    mistral: { available: false, label: 'Mistral AI (Large, Codestral)' },
  });

  const [filterProvider, setFilterProvider] = useState<'all' | 'gemini' | 'openrouter' | 'mistral'>('all');
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/health')
        .then((res) => res.json())
        .then((data) => {
          if (data?.providers) {
            setProviderStatuses(data.providers);
          }
        })
        .catch((err) => console.error('Error fetching health status:', err));
    }
  }, [isOpen]);

  const handleRefresh = async () => {
    await onRefreshModels();
    setRefreshSuccess(true);
    setTimeout(() => setRefreshSuccess(false), 2500);
  };

  if (!isOpen) return null;

  const filteredModels = filterProvider === 'all' 
    ? availableModels 
    : availableModels.filter(m => m.provider === filterProvider);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-[#0e1218] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Settings className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Réglages des APIs & Moteurs IA</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-semibold">
                  Multi-Fournisseurs
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Gestion des connexions Gemini, OpenRouter, Mistral et synchronisation en direct des modèles
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Section 1: Provider Status Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Statut des Clés d'API Serveur (Proxy Sécurisé)</span>
              </h3>
              <span className="text-[11px] text-slate-500">Pas d'exposition côté client</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Gemini */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Google Gemini</span>
                  {providerStatuses.gemini?.available ? (
                    <span className="flex items-center gap-1 text-[10px] text-green-400 font-mono font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Actif
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">Non configuré</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Vision, analyse multimodale et prompt engineering immédiat.
                </p>
                <div className="text-[10px] text-amber-400/80 font-mono">
                  GEMINI_API_KEY
                </div>
              </div>

              {/* OpenRouter */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">OpenRouter</span>
                  {providerStatuses.openrouter?.available ? (
                    <span className="flex items-center gap-1 text-[10px] text-green-400 font-mono font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Actif
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">En attente clé</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Accès à Claude 3.5 Sonnet, DeepSeek V3, Llama 3.3, Qwen 2.5.
                </p>
                <div className="text-[10px] text-amber-400/80 font-mono">
                  OPENROUTER_API_KEY
                </div>
              </div>

              {/* Mistral */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Mistral AI</span>
                  {providerStatuses.mistral?.available ? (
                    <span className="flex items-center gap-1 text-[10px] text-green-400 font-mono font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Actif
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">En attente clé</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Mistral Large 2, Codestral pour les scripts Pinokio.js et shell.
                </p>
                <div className="text-[10px] text-amber-400/80 font-mono">
                  MISTRAL_API_KEY
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Model Synchronization and Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modèles Récupérés par API ({availableModels.length})</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Sélectionnez le modèle actif pour assister vos configurations Wan2GP, LTX et Home Server
                </p>
              </div>

              {/* Refresh Models Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshingModels}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                title="Interroge les APIs pour mettre à jour la liste des modèles disponibles"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingModels ? 'animate-spin text-amber-400' : ''}`} />
                <span>{isRefreshingModels ? 'Synchronisation...' : 'Mettre à jour les modèles'}</span>
              </button>
            </div>

            {refreshSuccess && (
              <div className="p-2.5 rounded-xl bg-green-950/40 border border-green-800/80 text-green-300 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                <span>Liste des modèles mise à jour avec succès depuis les API officielles !</span>
              </div>
            )}

            {/* Provider Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
              {(['all', 'gemini', 'openrouter', 'mistral'] as const).map((prov) => (
                <button
                  key={prov}
                  onClick={() => setFilterProvider(prov)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all capitalize ${
                    filterProvider === prov
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {prov === 'all' ? 'Tous les modèles' : prov}
                </button>
              ))}
            </div>

            {/* Models Selection List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {filteredModels.map((m) => {
                const isSelected = selectedModel.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectModel(m)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-amber-500 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950 hover:bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-white truncate">{m.name}</span>
                        <span className="px-2 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-amber-300 border border-slate-700/80">
                          {m.badge}
                        </span>
                        {m.contextLength && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {m.contextLength}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {m.description}
                      </p>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ID API: {m.id}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
                        >
                          Choisir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Section 3: Pro Tips & Documentation for API Keys */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>Comment ajouter ou renouveler vos clés d'API ?</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pour des raisons strictes de sécurité, les clés secrètes ne sont jamais stockées dans le navigateur.
              Renseignez simplement vos variables d'environnement dans votre tableau de bord ou fichier <code className="text-amber-300 font-mono">.env</code> :
            </p>
            <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-300 space-y-1">
              <div><span className="text-amber-400">GEMINI_API_KEY</span>="AIzaSy..." <span className="text-slate-500">(Inclus par défaut sur AI Studio)</span></div>
              <div><span className="text-amber-400">OPENROUTER_API_KEY</span>="sk-or-v1-..." <span className="text-slate-500">(Optionnel pour Claude / DeepSeek)</span></div>
              <div><span className="text-amber-400">MISTRAL_API_KEY</span>="..." <span className="text-slate-500">(Optionnel pour Mistral / Codestral)</span></div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs">
          <div className="text-slate-400">
            Modèle actif : <span className="text-amber-300 font-bold">{selectedModel.name}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            Fermer les Réglages
          </button>
        </div>

      </div>
    </div>
  );
};
