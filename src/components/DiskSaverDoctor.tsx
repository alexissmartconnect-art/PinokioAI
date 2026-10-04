import React, { useState } from 'react';
import { 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Terminal, 
  Copy, 
  Check, 
  Layers, 
  FileCheck, 
  ShieldCheck, 
  Trash2,
  FolderTree,
  Cpu,
  Info
} from 'lucide-react';

export const DiskSaverDoctor: React.FC = () => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [caddyStatus, setCaddyStatus] = useState<'update_needed' | 'fixing' | 'updated'>('update_needed');
  const [dedupSimulationStatus, setDedupSimulationStatus] = useState<'idle' | 'scanning' | 'deduped'>('idle');
  const [savedSpaceGb, setSavedSpaceGb] = useState<number>(8.15);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleFixCaddy = () => {
    setCaddyStatus('fixing');
    setTimeout(() => {
      setCaddyStatus('updated');
    }, 1500);
  };

  const handleRunDeduplication = () => {
    setDedupSimulationStatus('scanning');
    setTimeout(() => {
      setSavedSpaceGb((prev) => +(prev + 0.64).toFixed(2));
      setDedupSimulationStatus('deduped');
    }, 1800);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 p-6 border border-slate-800 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
            <HardDrive className="w-3.5 h-3.5" />
            Diagnostic Système Pinokio & Disk Saver
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Maintenance Système, Déduplication & Réparation
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            Surveillez les 8 dépendances vitales de Pinokio (Conda, Caddy, UV, Git), résolvez les blocages de mise à jour 
            et libérez des dizaines de gigaoctets grâce aux liens matériels (hardlinks) de modèles IA.
          </p>
        </div>
      </div>

      {/* Grid: System Requirements (Left) & Disk Saver (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: System Requirements Check (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  État des Exigences Système (Pinokio Core)
                </h2>
                <span className="text-[11px] text-slate-400">
                  {caddyStatus === 'updated' ? '8 vérifications réussies' : '7 installés sur 8 • 1 action requise'}
                </span>
              </div>

              {caddyStatus === 'update_needed' ? (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Mise à jour requise
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 text-[11px] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  Tous opérationnels
                </span>
              )}
            </div>

            {/* List of requirements */}
            <div className="space-y-2">
              {[
                { name: 'conda', desc: 'Gestionnaire d’environnements virtuels (7zip, uv, git, caddy)', status: 'installed' },
                { name: 'zip', desc: 'Décompression des archives de modèles et dépôts', status: 'installed' },
                { name: 'git', desc: 'Clonage et synchronisation des dépôts IA', status: 'installed' },
                { name: 'uv', desc: 'Installeur Python ultra-rapide en Rust', status: 'installed' },
                { name: 'node', desc: 'Moteur JavaScript d’exécution pour Pinokio et Caddy', status: 'installed' },
                { 
                  name: 'caddy', 
                  desc: 'Serveur de proxy inverse local gérant les ports et les domaines .localhost', 
                  status: caddyStatus === 'updated' ? 'installed' : 'update_needed' 
                },
                { name: 'py', desc: 'Runtime Python 3.10 / 3.11 avec PyTorch CUDA', status: 'installed' },
                { name: 'bluefairy', desc: 'Daemon de surveillance et d’automatisation des tâches Pinokio', status: 'installed' },
              ].map((item) => (
                <div
                  key={item.name}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                    item.status === 'update_needed'
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs">{item.name}</span>
                      {item.status === 'update_needed' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                          Update needed
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 max-w-sm truncate">{item.desc}</div>
                  </div>

                  <div>
                    {item.status === 'update_needed' ? (
                      <button
                        onClick={handleFixCaddy}
                        disabled={caddyStatus === 'fixing'}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                      >
                        {caddyStatus === 'fixing' ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Réparation...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3" />
                            Mettre à jour
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        Installé
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* How to manually fix Caddy in Pinokio terminal */}
            <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-amber-300 flex items-center justify-between">
                <span>Commande manuelle en cas d'erreur de Caddy :</span>
                <button
                  onClick={() => copyToClipboard('pinokio install caddy --force', 'caddyfix')}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {copiedCmd === 'caddyfix' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  Copier
                </button>
              </div>
              <code className="block p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-amber-300">
                pinokio install caddy --force
              </code>
              <p className="text-[11px] text-slate-400">
                Cette commande rafraîchit le binaire Caddy situé dans <code className="text-slate-300">~/pinokio/bin/caddy</code> pour débloquer l'accès aux interfaces Gradio.
              </p>
            </div>

          </div>
        </div>

        {/* Right Column: Disk Saver & Deduplication (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  Pinokio Disk Saver (Déduplication NTFS/APFS)
                </h2>
                <span className="text-[11px] text-slate-400">
                  Dossier cible : ~/pinokio (Apps, Checkpoints, Bin, Cache)
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold font-mono">
                {savedSpaceGb} GB économisés
              </span>
            </div>

            {/* Storage Metric Bar */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">En cours d'utilisation : <strong className="text-white">174.71 GB</strong></span>
                <span className="text-amber-400 font-semibold font-mono">Économisé : {savedSpaceGb} GB</span>
              </div>
              
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden flex">
                <div className="bg-amber-500 h-full" style={{ width: '65%' }} title="Checkpoints IA" />
                <div className="bg-blue-500 h-full" style={{ width: '20%' }} title="Apps dépôts" />
                <div className="bg-green-500 h-full" style={{ width: '15%' }} title="Caches & Binaires" />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>Modèles Checkpoints (Wan, LTX, Flux)</span>
                <span>Dépôts Git (Maestro, Wan2GP, YuE2)</span>
                <span>Environnements Conda/UV</span>
              </div>
            </div>

            {/* Scanned duplicates list */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                <span>Fichiers volumineux dédoublonnables détectés</span>
                <span className="text-amber-400 text-[11px]">
                  {dedupSimulationStatus === 'deduped' ? '0 doublon restant' : '1 doublon • 643.41 MB'}
                </span>
              </div>

              {dedupSimulationStatus === 'deduped' ? (
                <div className="p-4 rounded-xl bg-green-950/30 border border-green-800/60 text-green-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  <span>Tous les doublons ont été fusionnés en hardlinks. 643.41 MB supplémentaires libérés !</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 overflow-hidden">
                    <div className="font-mono text-slate-200 truncate">
                      Pinokio / Apps / yue2-groove-pinokio.git
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      ↳ app / bin / yue2cpp • 643.41 MB
                    </div>
                  </div>

                  <button
                    onClick={handleRunDeduplication}
                    disabled={dedupSimulationStatus === 'scanning'}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                  >
                    {dedupSimulationStatus === 'scanning' ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Déduplication...
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        Dédupliquer (Hardlink)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Explanation of how Pinokio Disk Saver works */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Comment fonctionne la déduplication de Pinokio ?
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Pinokio utilise la technologie des <strong>liens matériels de système de fichiers (Hardlinks)</strong>. 
                Si vous avez le même modèle Wan 2.1 14B (20 GB) ou un binaire C++ dans Wan2GP, Maestro et ComfyUI, 
                Disk Saver pointe ces fichiers vers le même secteur disque physique. Vos applications fonctionnent 
                exactement de la même façon, mais vous ne consommez l'espace disque qu'une seule fois !
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
