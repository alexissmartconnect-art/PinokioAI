import React, { useState } from 'react';
import { 
  Eye, 
  Sliders, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Clock, 
  Compass, 
  Layers, 
  RefreshCw,
  Camera,
  Sun,
  Type
} from 'lucide-react';
import { NarrativeScene, ExperienceManifest } from '../types';

interface VisualInspectorPanelProps {
  activeScene: NarrativeScene;
  manifest: ExperienceManifest;
  onApplyPatch: (instruction: string) => string[];
  isPatching?: boolean;
}

export const VisualInspectorPanel: React.FC<VisualInspectorPanelProps> = ({
  activeScene,
  manifest,
  onApplyPatch,
  isPatching = false,
}) => {
  const [naturalCommand, setNaturalCommand] = useState('');
  const [lastPatchedNotice, setLastPatchedNotice] = useState<string | null>(null);

  const quickInspectorPresets = [
    { label: 'Ralentir l’animation', cmd: 'ralentis cette animation pour accentuer l’effet de lévitation' },
    { label: 'Rotation inverse', cmd: 'fais tourner le produit dans l\'autre sens au scroll' },
    { label: 'Ajuster le texte', cmd: 'ce texte arrive trop tôt, retarde son apparition à 40% de scroll' },
    { label: 'Augmenter profondeur', cmd: 'augmente la profondeur ici avec un éclairage spéculaire plus prononcé' },
    { label: 'Simplification mobile', cmd: 'sur mobile simplifie cet effet pour économiser le GPU' }
  ];

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalCommand.trim() || isPatching) return;
    
    const changes = onApplyPatch(naturalCommand.trim());
    setLastPatchedNotice(
      changes.length > 0
        ? `Patch appliqué : ${changes.join(' · ')}`
        : 'Aucune modification reconnue. Essayez : « ralentis », « autre sens », « à 40 % », « profondeur », « mobile ».'
    );
    if (changes.length > 0) setNaturalCommand('');
    setTimeout(() => setLastPatchedNotice(null), 5000);
  };

  return (
    <div className="p-5 rounded-3xl bg-[#0e1218] border border-slate-800 shadow-xl space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Eye className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Visual Inspector & Adaptateur de Patch Direct
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-mono font-bold">
          Inspection Scène {activeScene.order} : {activeScene.name}
        </span>
      </div>

      {/* Inspected Attributes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Camera className="w-3 h-3 text-indigo-400" />
            <span>Caméra FOV</span>
          </div>
          <div className="text-xs font-bold text-white font-mono">
            {activeScene.cameraChoreography.fov}°
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-400" />
            <span>Éclaté Partiel</span>
          </div>
          <div className="text-xs font-bold text-white font-mono">
            {(activeScene.explodedDistance * 100).toFixed(0)}%
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Sun className="w-3 h-3 text-yellow-400" />
            <span>Éclairage</span>
          </div>
          <div className="text-xs font-bold text-white font-mono truncate" title={activeScene.lightingDescription}>
            Key 2800K + Rim
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Timeline Scroll</span>
          </div>
          <div className="text-xs font-bold text-white font-mono">
            {(activeScene.scrollStart * 100).toFixed(0)}% → {(activeScene.scrollEnd * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Natural Language Micro-Tuning Input */}
      <form onSubmit={handleCommandSubmit} className="space-y-3">
        <label className="text-[11px] font-semibold text-slate-300 block">
          Ajustement en langage naturel via Visual Inspector :
        </label>
        
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={naturalCommand}
            onChange={(e) => setNaturalCommand(e.target.value)}
            disabled={isPatching}
            placeholder="Ex: 'ralentis cette animation', 'fais tourner le produit dans l\'autre sens'..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />

          <button
            type="submit"
            disabled={isPatching || !naturalCommand.trim()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-40"
          >
            {isPatching ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            )}
            <span>Patcher</span>
          </button>
        </div>

        {/* Quick presets from prompt specification */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {quickInspectorPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                const changes = onApplyPatch(preset.cmd);
                setLastPatchedNotice(
                  changes.length > 0
                    ? `Patch appliqué : ${changes.join(' · ')}`
                    : `Aucune modification pour cette scène (« ${preset.label} »).`
                );
                setTimeout(() => setLastPatchedNotice(null), 3500);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-mono border border-slate-800 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {lastPatchedNotice && (
          <div className="p-2.5 rounded-xl bg-green-950/40 border border-green-800/80 text-green-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            <span>{lastPatchedNotice}</span>
          </div>
        )}
      </form>

    </div>
  );
};
