import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Cpu,
  Download,
  ExternalLink,
  FileJson,
  Film,
  FolderOpen,
  HardDrive,
  Info,
  Layers,
  Loader2,
  Play,
  PlugZap,
  RefreshCw,
  Server,
  Sparkles,
  Terminal,
  Wand2,
  XCircle,
  Zap,
} from 'lucide-react';
import type {
  HardwareVram,
  LoraArtifact,
  LoraBaseModelId,
  LoraGuaardvarkHealth,
  LoraPlanRequest,
  LoraTrainingSettings,
  LoraWanGpFolderInfo,
} from '../types';
import {
  LORA_BASE_MODELS,
  LORA_BASE_MODEL_ORDER,
  buildLoraPlan,
  defaultLoraRequest,
  formatDuration,
  formatVram,
  planHasBlockingError,
  recommendSettings,
} from '../services/lora/loraPlanBuilder';

interface LoraTrainingStudioProps {
  selectedVram: HardwareVram;
}

interface RemoteStatus {
  subjectId: number;
  status: string;
  error?: string | null;
  baseModelId?: string;
  loraPath?: string | null;
}

const CARD = 'bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg';
const INPUT =
  'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono';
const LABEL = 'text-[11px] font-semibold text-slate-400 block mb-1 uppercase tracking-wide';

const SectionCard: React.FC<{
  step: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
}> = ({ step, title, icon, hint, children }) => (
  <section className={`${CARD} p-5 space-y-4`}>
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">{step}</span>
          {title}
        </h2>
        {hint && <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{hint}</p>}
      </div>
    </div>
    {children}
  </section>
);

const NumberField: React.FC<{
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  suffix?: string;
  hint?: string;
}> = ({ label, value, min, max, step, suffix, hint, onChange }) => (
  <div>
    <label className={LABEL}>{label}</label>
    <div className="relative">
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className={INPUT}
      />
      {suffix && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">{suffix}</span>
      )}
    </div>
    {hint && <p className="text-[10px] text-slate-500 mt-1">{hint}</p>}
  </div>
);

const StatChip: React.FC<{ icon: React.ReactNode; label: string; value: string; tone?: 'ok' | 'warn' | 'bad' }> = ({
  icon,
  label,
  value,
  tone = 'ok',
}) => {
  const toneClass =
    tone === 'bad'
      ? 'text-red-300 border-red-500/30 bg-red-500/5'
      : tone === 'warn'
      ? 'text-amber-300 border-amber-500/30 bg-amber-500/5'
      : 'text-emerald-300 border-emerald-500/30 bg-emerald-500/5';
  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide opacity-80">
        {icon}
        {label}
      </div>
      <div className="text-sm font-bold text-white mt-0.5">{value}</div>
    </div>
  );
};

const IssueRow: React.FC<{ level: 'error' | 'warning' | 'tip'; message: string; fix?: string }> = ({
  level,
  message,
  fix,
}) => {
  const config = {
    error: { icon: <XCircle className="w-3.5 h-3.5" />, cls: 'border-red-500/40 bg-red-500/5 text-red-200' },
    warning: { icon: <AlertTriangle className="w-3.5 h-3.5" />, cls: 'border-amber-500/40 bg-amber-500/5 text-amber-100' },
    tip: { icon: <Info className="w-3.5 h-3.5" />, cls: 'border-sky-500/30 bg-sky-500/5 text-sky-100' },
  }[level];
  return (
    <div className={`rounded-xl border px-3 py-2 text-[11px] leading-relaxed ${config.cls}`}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">{config.icon}</span>
        <div>
          <p className="font-semibold">{message}</p>
          {fix && <p className="text-[11px] opacity-80 mt-0.5">→ {fix}</p>}
        </div>
      </div>
    </div>
  );
};

export const LoraTrainingStudio: React.FC<LoraTrainingStudioProps> = ({ selectedVram }) => {
  const [request, setRequest] = useState<LoraPlanRequest>(() => defaultLoraRequest(selectedVram));
  const [autoTune, setAutoTune] = useState(true);
  const [activeArtifact, setActiveArtifact] = useState<string>('checklist');
  const [copied, setCopied] = useState<string | null>(null);

  // --- guaardvark bridge state -------------------------------------------
  const [baseUrl, setBaseUrl] = useState('http://127.0.0.1:5000');
  const [subjectId, setSubjectId] = useState<string>('');
  const [health, setHealth] = useState<LoraGuaardvarkHealth | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [remote, setRemote] = useState<RemoteStatus | null>(null);
  const pollRef = useRef<number | null>(null);

  // --- livraison WanGP ---------------------------------------------------
  const [wangp, setWangp] = useState<LoraWanGpFolderInfo | null>(null);
  const [wangpError, setWangpError] = useState<string | null>(null);
  const [isLoadingWangp, setIsLoadingWangp] = useState(false);

  const preset = LORA_BASE_MODELS[request.baseModel];
  const plan = useMemo(() => buildLoraPlan(request), [request]);
  const blocking = planHasBlockingError(plan);

  // Le sélecteur GPU global (Navbar) pilote aussi ce studio.
  useEffect(() => {
    setRequest((prev) => {
      if (prev.hardware === selectedVram) return prev;
      const nextPreset = LORA_BASE_MODELS[prev.baseModel];
      return {
        ...prev,
        hardware: selectedVram,
        settings: autoTune ? recommendSettings(nextPreset, selectedVram, prev.dataset.imageCount) : prev.settings,
      };
    });
  }, [selectedVram, autoTune]);

  useEffect(() => {
    if (plan.artifacts.length && !plan.artifacts.some((a) => a.id === activeArtifact)) {
      setActiveArtifact(plan.artifacts[0].id);
    }
  }, [plan.artifacts, activeArtifact]);

  useEffect(() => {
    fetch('/api/lora/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.baseUrl) setBaseUrl(data.baseUrl);
      })
      .catch(() => undefined);
  }, []);

  useEffect(
    () => () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    },
    []
  );

  const patchSettings = (patch: Partial<LoraTrainingSettings>) => {
    setAutoTune(false);
    setRequest((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  };

  const patchDataset = (patch: Partial<LoraPlanRequest['dataset']>) => {
    setRequest((prev) => {
      const dataset = { ...prev.dataset, ...patch };
      if (!autoTune) return { ...prev, dataset };
      const settings =
        typeof patch.imageCount === 'number'
          ? { ...prev.settings, steps: recommendSettings(preset, prev.hardware, dataset.imageCount).steps }
          : prev.settings;
      return { ...prev, dataset, settings };
    });
  };

  const selectBaseModel = (id: LoraBaseModelId) => {
    const nextPreset = LORA_BASE_MODELS[id];
    setAutoTune(true);
    setRequest((prev) => {
      // La classe ne suit la nouvelle base que si l'utilisateur n'a pas saisi la
      // sienne : sinon on écrase silencieusement son vocabulaire de légende.
      const classToken =
        prev.dataset.classToken === LORA_BASE_MODELS[prev.baseModel].defaultClassToken
          ? nextPreset.defaultClassToken
          : prev.dataset.classToken;
      return {
        ...prev,
        baseModel: id,
        dataset: { ...prev.dataset, classToken },
        settings: recommendSettings(nextPreset, prev.hardware, prev.dataset.imageCount),
      };
    });
  };

  const applyRecommendation = () => {
    setAutoTune(true);
    setRequest((prev) => ({
      ...prev,
      settings: recommendSettings(preset, prev.hardware, prev.dataset.imageCount),
    }));
  };

  const copyToClipboard = async (artifact: LoraArtifact) => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(artifact.id);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  };

  const downloadArtifact = (artifact: LoraArtifact) => {
    const blob = new Blob([artifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = artifact.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const checkHealth = async () => {
    setIsChecking(true);
    setHealth(null);
    try {
      const res = await fetch('/api/lora/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl }),
      });
      const data = (await res.json()) as LoraGuaardvarkHealth;
      setHealth(data);
    } catch (error: any) {
      setHealth({
        reachable: false,
        baseUrl,
        error: error?.message || 'Requête impossible',
        checkedAt: new Date().toISOString(),
      });
    } finally {
      setIsChecking(false);
    }
  };

  const dispatchTraining = async () => {
    const id = Number(subjectId);
    if (!Number.isFinite(id) || id <= 0) {
      setDispatchError('Renseignez l’id du sujet (personnage) créé dans le Cast Studio de guaardvark.');
      return;
    }
    setIsDispatching(true);
    setDispatchError(null);
    setRemote(null);
    try {
      const res = await fetch('/api/lora/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl,
          subjectId: id,
          baseModel: request.baseModel,
          outputName: request.outputName,
          settings: plan.settings,
          dataset: request.dataset,
        }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        setDispatchError(data?.message || data?.error || `guaardvark a refusé la requête (${res.status}).`);
        return;
      }
      setRemote({
        subjectId: id,
        status: data?.status || 'training',
        baseModelId: data?.baseModelId,
      });
      startPolling(id);
    } catch (error: any) {
      setDispatchError(error?.message || 'Impossible de joindre guaardvark.');
    } finally {
      setIsDispatching(false);
    }
  };

  const startPolling = (id: number) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/lora/subjects/${id}?baseUrl=${encodeURIComponent(baseUrl)}`);
        if (!res.ok) return;
        const data = await res.json();
        setRemote({
          subjectId: id,
          status: data?.status || 'inconnu',
          error: data?.error || null,
          baseModelId: data?.baseModelId,
          loraPath: data?.loraPath || null,
        });
        if (['done', 'completed', 'failed', 'idle', 'cancelled'].includes(String(data?.status))) {
          if (pollRef.current) window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch {
        /* réseau instable : le prochain tick réessaiera */
      }
    }, 8000);
  };

  const cancelRemote = async () => {
    if (!remote) return;
    await fetch('/api/lora/train/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrl, subjectId: remote.subjectId }),
    }).catch(() => undefined);
    setRemote({ ...remote, status: 'cancelled' });
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = null;
  };

  const loadWangpFolder = async (folder: string) => {
    setIsLoadingWangp(true);
    setWangpError(null);
    try {
      const res = await fetch(`/api/lora/wangp/${folder}`);
      const data = await res.json();
      if (!res.ok) {
        setWangp(null);
        setWangpError(data?.message || `HTTP ${res.status}`);
        return;
      }
      setWangp(data as LoraWanGpFolderInfo);
    } catch (error: any) {
      setWangp(null);
      setWangpError(error?.message || 'Serveur injoignable.');
    } finally {
      setIsLoadingWangp(false);
    }
  };

  useEffect(() => {
    if (plan.wangp.folder) loadWangpFolder(plan.wangp.folder);
    else {
      setWangp(null);
      setWangpError(null);
    }
  }, [plan.wangp.folder]);

  /**
   * WanGP tourne sur la machine : une URL de preview distante ne lui parle pas.
   * On privilégie donc l'origine locale du port 3000 quand l'UI est ouverte
   * depuis un hôte hébergé.
   */
  const apiOrigin =
    typeof window !== 'undefined' &&
    /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)
      ? window.location.origin
      : 'http://127.0.0.1:3000';

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  };

  const artifact = plan.artifacts.find((a) => a.id === activeArtifact) || plan.artifacts[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Hero */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                LORA TRAINING
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {preset.frameworkLabel}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Entraîner un LoRA pour {preset.label}
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Le plan se recalcule à chaque réglage : VRAM et durée estimées pour votre profil{' '}
              <span className="text-amber-300 font-semibold">{request.hardware}</span>, alertes bloquantes, et
              fichiers prêts à exécuter (dataset, entraînement, envoi guaardvark).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={applyRecommendation}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-2 border border-amber-500/30 transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              Auto-régler pour mon GPU
            </button>
            <a
              href={preset.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Docs
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ---------------- Colonne configuration ---------------- */}
        <div className="lg:col-span-5 space-y-6">
          <SectionCard
            step={1}
            title="Modèle de base"
            icon={<Layers className="w-4 h-4" />}
            hint="Chaque base a sa recette : le framework, la résolution et la VRAM changent avec elle."
          >
            <div className="grid grid-cols-2 gap-2">
              {LORA_BASE_MODEL_ORDER.map((id) => {
                const item = LORA_BASE_MODELS[id];
                const active = request.baseModel === id;
                const impossible = item.family === 'video' && selectedVram === 'Mac_Silicon';
                return (
                  <button
                    key={id}
                    onClick={() => selectBaseModel(id)}
                    className={`text-left rounded-xl border px-3 py-2 transition-all ${
                      active
                        ? 'border-amber-500/70 bg-amber-500/10 shadow-md shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${active ? 'text-amber-200' : 'text-slate-200'}`}>
                        {item.shortLabel}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {item.family === 'video' ? 'VIDÉO' : 'IMAGE'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">
                      {item.minVramGb} Go min · r{item.defaultRank}
                    </p>
                    {impossible && <p className="text-[9px] text-red-400 mt-0.5">MPS non supporté</p>}
                  </button>
                );
              })}
            </div>
            <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 space-y-1">
              <p className="text-[10px] font-mono text-slate-400 break-all">{preset.weightsHint}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">{preset.notes[0]}</p>
            </div>
          </SectionCard>

          <SectionCard
            step={2}
            title="Dataset"
            icon={<FolderOpen className="w-4 h-4" />}
            hint="Un dossier d’images + un .txt de légende par image, avec le même trigger word."
          >
            <div>
              <label className={LABEL}>Dossier du dataset</label>
              <input
                type="text"
                value={request.dataset.path}
                onChange={(e) => patchDataset({ path: e.target.value })}
                className={INPUT}
                placeholder="~/pinokio/app/datasets/mon-sujet"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Images"
                value={request.dataset.imageCount}
                min={1}
                max={500}
                onChange={(imageCount) => patchDataset({ imageCount })}
                hint={`${Math.round(plan.estimate.epochs)} epochs`}
              />
              <NumberField
                label="Images de régularisation"
                value={request.dataset.regularisationImages}
                min={0}
                max={200}
                onChange={(regularisationImages) => patchDataset({ regularisationImages })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Trigger word</label>
                <input
                  type="text"
                  value={request.dataset.triggerWord}
                  onChange={(e) => patchDataset({ triggerWord: e.target.value })}
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Classe</label>
                <input
                  type="text"
                  value={request.dataset.classToken}
                  onChange={(e) => patchDataset({ classToken: e.target.value })}
                  className={INPUT}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Style de légende</label>
                <select
                  value={request.dataset.captionStyle}
                  onChange={(e) => patchDataset({ captionStyle: e.target.value as any })}
                  className={`${INPUT} font-sans`}
                >
                  <option value="trigger_class">trigger + classe + description</option>
                  <option value="trigger_only">trigger seul</option>
                  <option value="natural_language">phrase naturelle</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Source</label>
                <select
                  value={request.dataset.source}
                  onChange={(e) => patchDataset({ source: e.target.value as any })}
                  className={`${INPUT} font-sans`}
                >
                  <option value="photos">Photos réelles</option>
                  <option value="renders">Rendus 3D / IA</option>
                  <option value="mixed">Mixte</option>
                  <option value="video_frames">Frames extraites de vidéo</option>
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL}>Nom de sortie</label>
              <input
                type="text"
                value={request.outputName}
                onChange={(e) => setRequest((prev) => ({ ...prev, outputName: e.target.value }))}
                className={INPUT}
              />
            </div>
          </SectionCard>

          <SectionCard
            step={3}
            title="Hyperparamètres"
            icon={<Cpu className="w-4 h-4" />}
            hint={
              autoTune
                ? 'Mode auto : les valeurs suivent votre GPU et le nombre d’images. Touchez un champ pour reprendre la main.'
                : 'Mode manuel : les valeurs sont les vôtres, les alertes signalent les combinaisons risquées.'
            }
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Résolution</label>
                <select
                  value={request.settings.resolution}
                  onChange={(e) => patchSettings({ resolution: Number(e.target.value) })}
                  className={`${INPUT} font-sans`}
                >
                  {Array.from(new Set([...preset.resolutions, plan.settings.resolution]))
                    .sort((a, b) => a - b)
                    .map((res) => (
                      <option key={res} value={res}>
                        {res} px
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Precision</label>
                <select
                  value={request.settings.precision}
                  onChange={(e) => patchSettings({ precision: e.target.value as any })}
                  className={`${INPUT} font-sans`}
                >
                  <option value="bf16">bf16</option>
                  <option value="fp16">fp16</option>
                  <option value="fp32">fp32</option>
                </select>
              </div>
              <NumberField label="Rank (dim)" value={request.settings.rank} min={4} max={preset.maxRank} onChange={(rank) => patchSettings({ rank })} />
              <NumberField label="Alpha" value={request.settings.alpha} min={1} max={128} onChange={(alpha) => patchSettings({ alpha })} />
              <NumberField
                label="Learning rate"
                value={request.settings.learningRate}
                min={0.000001}
                step={0.00001}
                onChange={(learningRate) => patchSettings({ learningRate })}
              />
              <NumberField label="Steps" value={request.settings.steps} min={50} max={20000} onChange={(steps) => patchSettings({ steps })} />
              <NumberField label="Batch" value={request.settings.batchSize} min={1} max={8} onChange={(batchSize) => patchSettings({ batchSize })} />
              <NumberField
                label="Accumulation"
                value={request.settings.gradientAccumulation}
                min={1}
                max={64}
                onChange={(gradientAccumulation) => patchSettings({ gradientAccumulation })}
              />
              <div>
                <label className={LABEL}>Optimiseur</label>
                <select
                  value={request.settings.optimizer}
                  onChange={(e) => patchSettings({ optimizer: e.target.value as any })}
                  className={`${INPUT} font-sans`}
                >
                  <option value="adamw8bit">adamw8bit</option>
                  <option value="adamw">adamw (32-bit)</option>
                  <option value="adafactor">adafactor</option>
                  <option value="prodigy">prodigy</option>
                </select>
              </div>
              <NumberField label="Seed" value={request.settings.seed} min={0} onChange={(seed) => patchSettings({ seed })} />
              {preset.supportsBlocksToSwap && (
                <NumberField
                  label="Blocks to swap"
                  value={request.settings.blocksToSwap}
                  min={0}
                  max={preset.maxBlocksToSwap}
                  onChange={(blocksToSwap) => patchSettings({ blocksToSwap })}
                  hint="Déporte des blocs du DiT vers la RAM"
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={request.settings.gradientCheckpointing}
                  onChange={(e) => patchSettings({ gradientCheckpointing: e.target.checked })}
                  className="accent-amber-500"
                />
                Gradient checkpointing
              </label>
              <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={request.settings.cacheLatents}
                  onChange={(e) => patchSettings({ cacheLatents: e.target.checked })}
                  className="accent-amber-500"
                />
                Cache latents
              </label>
              {preset.supportsLowVram && (
                <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={request.settings.lowVram}
                    onChange={(e) => patchSettings({ lowVram: e.target.checked })}
                    className="accent-amber-500"
                  />
                  Low VRAM (layer offloading)
                </label>
              )}
              <span className="text-[10px] font-mono text-slate-500">
                {autoTune ? 'AUTO' : 'MANUEL'} · reco : {plan.recommended.resolution}px / r{plan.recommended.rank} /{' '}
                {plan.recommended.steps} steps
              </span>
            </div>
          </SectionCard>

          <SectionCard
            step={4}
            title="Envoi à guaardvark (optionnel)"
            icon={<Server className="w-4 h-4" />}
            hint="Si guaardvark tourne en local, le job part directement dans son Cast Studio. Sinon, gardez les scripts générés."
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>URL guaardvark</label>
                <input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Id du sujet</label>
                <input
                  type="number"
                  min={1}
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  placeholder="ex. 12"
                  className={INPUT}
                />
              </div>
            </div>

            <div className={`rounded-xl border px-3 py-2 text-[11px] leading-relaxed ${
              plan.guaardvark.trainReady
                ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-100'
                : 'border-amber-500/30 bg-amber-500/5 text-amber-100'
            }`}>
              <span className="font-semibold">backend {plan.guaardvark.baseModelId} · </span>
              {plan.guaardvark.note}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={checkHealth}
                disabled={isChecking}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                {isChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlugZap className="w-3.5 h-3.5 text-emerald-400" />}
                Tester la connexion
              </button>
              <button
                onClick={dispatchTraining}
                disabled={isDispatching || blocking}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all"
              >
                {isDispatching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Lancer l’entraînement
              </button>
            </div>

            {health && (
              <div
                className={`rounded-xl border px-3 py-2 text-[11px] ${
                  health.reachable
                    ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-100'
                    : 'border-red-500/40 bg-red-500/5 text-red-200'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {health.reachable ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {health.reachable ? `guaardvark joignable${health.version ? ` · v${health.version}` : ''}` : 'guaardvark injoignable'}
                </div>
                {!health.reachable && (
                  <p className="mt-1 opacity-90 leading-relaxed">
                    {health.error || 'Aucune réponse.'} Lancez-le avec <code className="font-mono">./start.sh</code> (backend Flask :5000), ou travaillez avec les scripts générés.
                  </p>
                )}
                {health.trainingLibraries && (
                  <p className="mt-1 opacity-80 font-mono text-[10px] break-all">
                    training libraries : {JSON.stringify(health.trainingLibraries).slice(0, 220)}
                  </p>
                )}
              </div>
            )}

            {dispatchError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/5 px-3 py-2 text-[11px] text-red-200 leading-relaxed">
                {dispatchError}
              </div>
            )}

            {remote && (
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-white flex items-center gap-2">
                    {['done', 'completed'].includes(remote.status) ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : remote.status === 'failed' ? (
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                    )}
                    Sujet #{remote.subjectId} · {remote.status}
                  </span>
                  <button
                    onClick={cancelRemote}
                    className="text-[10px] font-semibold text-red-300 hover:text-red-200"
                  >
                    Annuler
                  </button>
                </div>
                <p className="text-[10px] font-mono text-slate-400 break-all">
                  base : {remote.baseModelId || plan.guaardvark.baseModelId}
                  {remote.loraPath ? ` · lora : ${remote.loraPath}` : ''}
                </p>
                {remote.error && <p className="text-[10px] text-red-300">{remote.error}</p>}
              </div>
            )}
          </SectionCard>
        </div>

        {/* ---------------- Colonne plan / fichiers ---------------- */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`${CARD} p-5 space-y-4`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Estimation & faisabilité
              </h2>
              <span className="text-[10px] font-mono text-slate-500">{plan.frameworkLabel}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatChip
                icon={<Cpu className="w-3 h-3" />}
                label="VRAM"
                value={`${formatVram(plan.estimate.vramMb)} / ${formatVram(plan.estimate.vramAvailableMb)}`}
                tone={plan.estimate.vramFit === 'fits' ? 'ok' : plan.estimate.vramFit === 'tight' ? 'warn' : 'bad'}
              />
              <StatChip
                icon={<Clock className="w-3 h-3" />}
                label="Durée"
                value={formatDuration(plan.estimate.minutes)}
              />
              <StatChip
                icon={<RefreshCw className="w-3 h-3" />}
                label="Steps"
                value={`${plan.estimate.totalSteps} (${plan.estimate.optimizerSteps} opt.)`}
              />
              <StatChip
                icon={<HardDrive className="w-3 h-3" />}
                label="Sortie"
                value={`~${plan.estimate.loraMb} Mo`}
              />
            </div>

            <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-[11px] text-slate-300 space-y-1">
              <p>
                <span className="text-slate-500">Dataset :</span> {plan.dataset.imageCount} images (
                {plan.estimate.datasetMb} Mo) · {plan.estimate.epochs} epochs · trigger{' '}
                <span className="font-mono text-amber-300">{plan.dataset.triggerWord}</span>
              </p>
              <p>
                <span className="text-slate-500">Config :</span> {plan.settings.resolution} px · rank{' '}
                {plan.settings.rank} / alpha {plan.settings.alpha} · lr {plan.settings.learningRate} ·{' '}
                {plan.settings.optimizer} · {plan.settings.precision}
                {plan.settings.blocksToSwap > 0 ? ` · swap ${plan.settings.blocksToSwap}` : ''}
                {plan.settings.lowVram ? ' · low_vram' : ''}
              </p>
            </div>

            {plan.issues.length > 0 ? (
              <div className="space-y-2">
                {plan.issues.map((issue) => (
                  <IssueRow key={issue.code} level={issue.level} message={issue.message} fix={issue.fix} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-100 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Aucun blocage : cette configuration tient sur votre GPU et le dataset est cohérent.
              </div>
            )}
          </div>

          <div className={`${CARD} p-5 space-y-4`}>
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap">
                {plan.artifacts.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveArtifact(item.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all ${
                      activeArtifact === item.id
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.filename}
                  </button>
                ))}
              </div>
              {artifact && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(artifact)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {copied === artifact.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileJson className="w-3.5 h-3.5" />}
                    {copied === artifact.id ? 'Copié' : 'Copier'}
                  </button>
                  <button
                    onClick={() => downloadArtifact(artifact)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {artifact.filename}
                  </button>
                </div>
              )}
            </div>

            {artifact && (
              <>
                <p className="text-[11px] text-slate-400 leading-relaxed">{artifact.purpose}</p>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-200 font-mono overflow-auto max-h-[520px] leading-relaxed">
                  {artifact.content}
                </pre>
              </>
            )}
          </div>

          <div className={`${CARD} p-5 space-y-4`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-purple-300" />
                Livraison WanGP
              </h2>
              {plan.wangp.folder && (
                <button
                  onClick={() => loadWangpFolder(plan.wangp.folder as string)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {isLoadingWangp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Rafraîchir le dossier
                </button>
              )}
            </div>

            {plan.wangp.folder ? (
              <>
                <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 space-y-1">
                  <p className="text-[11px] text-slate-300">
                    Dossier cible : <span className="font-mono text-amber-300">{plan.wangp.pathHint}</span>
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 break-all">
                    racine loras : {wangp?.root || '…'}
                    {wangp?.rootSource === 'auto' && ' (détectée)'}
                    {wangp?.rootSource === 'env' && ' (WANGP_LORAS_ROOT)'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Échelle conseillée : <span className="text-amber-200 font-semibold">{plan.wangp.strengthHint}</span>
                  </p>
                </div>

                <ol className="text-[11px] text-slate-300 space-y-2 leading-relaxed">
                  <li>
                    <span className="text-amber-400 font-bold">1.</span> Entraînez avec le plan ci-contre
                    (ou envoyez le job à guaardvark).
                  </li>
                  <li>
                    <span className="text-amber-400 font-bold">2.</span> Deux façons de donner le fichier à WanGP :
                    <div className="mt-1 ml-3 space-y-1 text-[10px] font-mono text-slate-400">
                      <p>• copie : <span className="text-slate-200">install-to-wangp.sh /chemin/{plan.wangp.filename}</span></p>
                      <p>• sans copie : collez une URL ci-dessous dans « Enter Lora URL »</p>
                    </div>
                  </li>
                  <li>
                    <span className="text-amber-400 font-bold">3.</span> Dans WanGP : bouton <em>Refresh</em> en
                    haut, puis onglet <em>Advanced → Loras</em>.
                  </li>
                </ol>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wide text-slate-500">
                      .safetensors détectés dans {plan.wangp.folder}
                    </span>
                    {wangp && <span className="text-[10px] font-mono text-slate-500">{wangp.files.length}</span>}
                  </div>

                  {wangpError && (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/5 px-3 py-2 text-[11px] text-red-200">
                      {wangpError}
                    </div>
                  )}

                  {wangp && !wangp.exists && !wangpError && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-100 space-y-1">
                      <p>
                        Le dossier n’existe pas encore : il sera créé par WanGP au premier usage, ou lancez
                        le script de copie.
                      </p>
                      <p className="font-mono text-[10px] text-amber-200/80 break-all">{wangp.root}</p>
                      <p className="text-[10px] text-amber-200/70">
                        Mauvais emplacement ? Renseignez <span className="font-mono">WANGP_LORAS_ROOT</span> dans
                        le fichier .env puis relancez l’application.
                      </p>
                    </div>
                  )}

                  {wangp && wangp.exists && wangp.files.length === 0 && (
                    <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-[11px] text-slate-400">
                      Aucun LoRA dans ce dossier pour l’instant. C’est normal avant l’entraînement.
                    </div>
                  )}

                  {wangp?.files.map((file) => {
                    const url = `${apiOrigin}${file.url}`;
                    return (
                      <div
                        key={file.name}
                        className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono text-slate-200 truncate">{file.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {(file.size / (1024 * 1024)).toFixed(1)} Mo
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            readOnly
                            value={url}
                            onFocus={(e) => e.currentTarget.select()}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-300 font-mono focus:outline-none focus:border-amber-400"
                          />
                          <button
                            onClick={() => copyText(url, `wangp-${file.name}`)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold flex items-center gap-1 shrink-0"
                          >
                            {copied === `wangp-${file.name}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <FileJson className="w-3 h-3" />
                            )}
                            Copier l’URL
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Ces URL pointent sur <span className="font-mono">{apiOrigin}</span> : WanGP doit tourner sur la
                    même machine. Si WanGP est ailleurs sur le réseau, remplacez l’hôte par l’IP du poste
                    (et servez l’app en `--listen 0.0.0.0`).
                  </p>
                </div>

                <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 px-3 py-2 text-[11px] text-purple-100 leading-relaxed">
                  {plan.wangp.note}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-100 leading-relaxed">
                {plan.wangp.note}
              </div>
            )}
          </div>

          <div className={`${CARD} p-5 space-y-3`}>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Ce que ce plan suppose
            </h2>
            <ul className="text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
              {preset.notes.map((note) => (
                <li key={note} className="flex gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {note}
                </li>
              ))}
              <li className="flex gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                VRAM et durée sont des ordres de grandeur : mesurez le premier run, puis ajustez steps et
                résolution plutôt que de tout changer d’un coup.
              </li>
              <li className="flex gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                guaardvark n’est pas obligatoire : sans lui, les fichiers <code className="font-mono">train.sh</code> et{' '}
                <code className="font-mono">dataset.toml</code> suffisent dans un venv local.
              </li>
            </ul>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
              <Terminal className="w-3 h-3" />
              plan généré {new Date(plan.createdAt).toLocaleTimeString('fr-FR')} · {plan.artifacts.length} fichiers
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
