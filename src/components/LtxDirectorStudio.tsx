import React, { useState } from 'react';
import {
  Film,
  Play,
  Layers,
  Sparkles,
  Sliders,
  SlidersHorizontal,
  Clock,
  Volume2,
  Image as ImageIcon,
  Type,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  Server,
  Network,
  Cpu,
  RefreshCw,
  HelpCircle,
  FolderPlus,
  ExternalLink,
  Wand2,
  Box,
  Share2,
  ChevronRight,
  Wifi,
  Settings,
  AlertCircle,
  Terminal,
  Activity,
  FileDown,
  CheckCircle2
} from 'lucide-react';
import { HardwareVram } from '../types';

interface LtxDirectorStudioProps {
  selectedVram: HardwareVram;
  onOpenCopilot: () => void;
}

interface TimelineSegment {
  id: string;
  type: 'text' | 'image' | 'audio';
  title: string;
  startTime: number;
  duration: number;
  prompt: string;
  imagePreview?: string;
  audioTrack?: string;
}

export const LtxDirectorStudio: React.FC<LtxDirectorStudioProps> = ({
  selectedVram,
  onOpenCopilot,
}) => {
  // Tabs inside LTX Director Studio
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'plugins' | 'homeserver'>('timeline');

  // LTX Director Configuration
  const [model, setModel] = useState<'LTX-2 2.3 Distilled 1.1 22B · LTX-2' | 'LTX-Video 0.9.5 DiT' | 'MiniMax H3 Director (Hybrid)'>('LTX-2 2.3 Distilled 1.1 22B · LTX-2');
  const [resolutionCategory, setResolutionCategory] = useState<'720p' | '480p' | '1080p'>('720p');
  const [resolutionBudget, setResolutionBudget] = useState('512x960');
  const [globalPrompt, setGlobalPrompt] = useState('Cinematic shot, hyperrealistic, dynamic lighting, professional color grade, 4k resolution');
  const [negativePrompt, setNegativePrompt] = useState('static, low quality, morphing limbs, distorted, flickering, artifacts, bad anatomy');
  
  // Advanced generation sliders
  const [seed, setSeed] = useState(-1);
  const [phases, setPhases] = useState<'Two Phases' | 'Single Phase'>('Two Phases');
  const [switchThreshold, setSwitchThreshold] = useState(0);
  const [guidanceScale, setGuidanceScale] = useState(5.0);
  const [guidanceScalePhase2, setGuidanceScalePhase2] = useState(5.0);
  const [flowShift, setFlowShift] = useState(5.0);
  const [fps, setFps] = useState(24);
  const [durationSec, setDurationSec] = useState(5);
  const [winFrames, setWinFrames] = useState(481);
  const [ovlFrames, setOvlFrames] = useState(17);
  const [bands, setBands] = useState(true);
  const [snap, setSnap] = useState(true);

  // Timeline segments
  const [segments, setSegments] = useState<TimelineSegment[]>([
    {
      id: 'seg-1',
      type: 'text',
      title: '1 · Establish Island',
      startTime: 0,
      duration: 15.0,
      prompt: 'The alien from Picture 3 stands on the floating island from Picture 1, wind moving the grass, camera drifting slowly forward.',
    },
    {
      id: 'seg-2',
      type: 'text',
      title: '2 · Mount the animal',
      startTime: 15.0,
      duration: 15.0,
      prompt: 'Subject approaches the creature smoothly, cinematic side tracking shot with golden rim lighting.',
    },
    {
      id: 'seg-3',
      type: 'text',
      title: '3 · Launch',
      startTime: 30.0,
      duration: 15.0,
      prompt: 'Dramatic take off towards the horizon, camera swoops beneath the flying creature, epic scale.',
    },
    {
      id: 'seg-4',
      type: 'text',
      title: '4 · Toward the falls',
      startTime: 45.0,
      duration: 15.0,
      prompt: 'High altitude dive near the massive waterfalls, mist scattering the volumetric sun rays.',
    }
  ]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('seg-1');

  // Copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Home Server state
  const [serverPort, setServerPort] = useState(7860);
  const [serverLocalIp, setServerLocalIp] = useState('192.168.1.42');
  const [caddyReverseProxy, setCaddyReverseProxy] = useState(true);
  const [authPin, setAuthPin] = useState('8492');
  const [homeServerInstalled, setHomeServerInstalled] = useState(false);
  const [isInstallingHomeServer, setIsInstallingHomeServer] = useState(false);

  // Pinokio Connection Test & Windows 11 Installer state
  const [pinokioHostInput, setPinokioHostInput] = useState('127.0.0.1');
  const [pinokioPortInput, setPinokioPortInput] = useState(42000);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [installerDownloaded, setInstallerDownloaded] = useState<string | null>(null);

  const handleTestPinokioConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-pinokio-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: pinokioHostInput,
          port: pinokioPortInput,
          targetApp: 'wan2gp_ltx_director',
        }),
      });
      const data = await res.json().catch(() => null);
      setTestResult(
        data || { connected: false, diagnostics: { status: 'OFFLINE', recommendation: `Réponse illisible du serveur (HTTP ${res.status}).` } }
      );
    } catch (err: any) {
      setTestResult({
        connected: false,
        diagnostics: {
          status: 'OFFLINE',
          recommendation: `Impossible de contacter le serveur de test : ${err?.message || 'Erreur réseau'}`,
        },
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleDownloadWindowsInstaller = (format: 'ps1' | 'bat') => {
    setInstallerDownloaded(format);
    window.location.href = `/api/installer-windows?format=${format}`;
    setTimeout(() => setInstallerDownloaded(null), 3000);
  };

  // Copied helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const selectedSegment = segments.find(s => s.id === selectedSegmentId) || segments[0];

  // Auto-optimize LTX settings based on VRAM
  const handleAutoTuneForHardware = () => {
    if (selectedVram === '6GB' || selectedVram === '8GB') {
      setResolutionCategory('480p');
      setResolutionBudget('480x832');
      setGuidanceScale(3.5);
      setGuidanceScalePhase2(3.5);
      setFlowShift(3.0);
      setWinFrames(121);
      setOvlFrames(12);
    } else {
      setResolutionCategory('720p');
      setResolutionBudget('512x960');
      setGuidanceScale(4.5);
      setGuidanceScalePhase2(4.5);
      setFlowShift(4.0);
      setWinFrames(362);
      setOvlFrames(18);
    }
  };

  // Export JSON configuration for Pinokio / Wan2GP
  const exportLtxDirectorJson = () => {
    const payload = {
      plugin: "LTX Director v1.3.25 · T33",
      created_by: "The-ShadowWalker",
      wan_gp_backend: "WanGP v13.1315 by DeepBeepMeep",
      model: model,
      export_timestamp: new Date().toISOString(),
      vram_target: selectedVram,
      director_settings: {
        category: resolutionCategory,
        resolution_budget: resolutionBudget,
        global_prompt: globalPrompt,
        negative_prompt: negativePrompt,
        fps: fps,
        duration_s: durationSec,
        sliding_window: {
          win_frames: winFrames,
          ovl_frames: ovlFrames,
          bands: bands,
          snap: snap,
        },
        advanced: {
          seed: seed,
          phases: phases,
          switch_threshold: switchThreshold,
          guidance_scale_cfg: guidanceScale,
          guidance_scale_phase2: guidanceScalePhase2,
          flow_shift: flowShift,
        }
      },
      timeline_segments: segments,
      pinokio_home_server: {
        port: serverPort,
        caddy: caddyReverseProxy,
        recommended_cli: `pinokio run wan2gp --listen 0.0.0.0 --port ${serverPort} --caddy`,
      }
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ltx-director-t33-${resolutionCategory}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header Banner - LTX Director Identity */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5" />
              LTX Director v1.3.25 · T33
            </span>
            <span className="text-xs text-slate-400 font-mono">créé par The-ShadowWalker</span>
            <span className="text-xs text-amber-400 font-mono">WanGP v13.1315 (DeepBeepMeep)</span>
          </div>

          <h1 className="text-xl md:text-2xl font-black text-white mt-1.5 flex items-center gap-2">
            <span>Studio Réalisation LTX Director & Écosystème Plugins</span>
          </h1>

          <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
            Glissez vos keyframes images, prompts textuels et clips audio sur la timeline multi-pistes.
            Gérez tous les plugins WanGP (H3 Director, LoRA Merger, Krea 2 Identity) et connectez votre instance Pinokio via Home Server.
          </p>
        </div>

        {/* Action Buttons Top */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAutoTuneForHardware}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Ajuste automatiquement les résolutions et fenêtres glissantes à votre VRAM"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Auto-Régler ({selectedVram})</span>
          </button>

          <button
            onClick={exportLtxDirectorJson}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-amber-500 hover:from-indigo-400 hover:to-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter en JSON</span>
          </button>

          <button
            onClick={onOpenCopilot}
            className="px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Assistance IA Dédiée</span>
          </button>
        </div>
      </div>

      {/* Studio Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 py-2 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'timeline'
                ? 'bg-indigo-500 text-slate-950 shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Timeline LTX & Multi-Pistes</span>
          </button>

          <button
            onClick={() => setActiveSubTab('plugins')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'plugins'
                ? 'bg-indigo-500 text-slate-950 shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Catalogue des Plugins WanGP (13.1315)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('homeserver')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'homeserver'
                ? 'bg-indigo-500 text-slate-950 shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Connexion Home Server & Réseau Local</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
          Sauvegarde automatique toutes les 5s activée
        </span>
      </div>

      {/* SUB-TAB 1: LTX TIMELINE & DIRECTOR CONTROLS */}
      {activeSubTab === 'timeline' && (
        <div className="space-y-6">

          {/* Global Prompt Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Global prompt (s'applique à toute la vidéo)
              </label>
              <button
                onClick={() => setGlobalPrompt('Masterpiece, 4k cinematic footage, smooth natural motions, coherent lighting, realistic depth of field')}
                className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold flex items-center gap-1"
              >
                <Wand2 className="w-3 h-3" />
                Injecter preset cinéma
              </button>
            </div>
            <textarea
              value={globalPrompt}
              onChange={(e) => setGlobalPrompt(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-400 leading-relaxed font-sans"
              placeholder="Ex: high quality, cinematic, ultra-detailed lighting..."
            />
          </div>

          {/* Virtual Timeline Canvas Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            
            {/* Timeline Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const newSeg: TimelineSegment = {
                      id: `seg-${Date.now()}`,
                      type: 'text',
                      title: `${segments.length + 1} · Nouveau Segment`,
                      startTime: segments.length * 15,
                      duration: 15.0,
                      prompt: 'Camera smoothly tracking the main subject through atmospheric fog.',
                    };
                    setSegments([...segments, newSeg]);
                    setSelectedSegmentId(newSeg.id);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-colors border border-slate-700/80"
                >
                  <Type className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Add Text</span>
                </button>

                <button
                  onClick={() => {
                    const newSeg: TimelineSegment = {
                      id: `seg-${Date.now()}`,
                      type: 'image',
                      title: `${segments.length + 1} · Keyframe Image`,
                      startTime: segments.length * 15,
                      duration: 15.0,
                      prompt: 'Inject starting keyframe for temporal morphing and seamless interpolation.',
                    };
                    setSegments([...segments, newSeg]);
                    setSelectedSegmentId(newSeg.id);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-colors border border-slate-700/80"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add Image</span>
                </button>

                <button
                  onClick={() => {
                    const newSeg: TimelineSegment = {
                      id: `seg-${Date.now()}`,
                      type: 'audio',
                      title: `${segments.length + 1} · Audio Clip`,
                      startTime: segments.length * 15,
                      duration: 15.0,
                      prompt: 'Audio track sync for dynamic lip movement and sound design.',
                    };
                    setSegments([...segments, newSeg]);
                    setSelectedSegmentId(newSeg.id);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-colors border border-slate-700/80"
                >
                  <Volume2 className="w-3.5 h-3.5 text-green-400" />
                  <span>Add Audio</span>
                </button>

                <div className="h-4 w-px bg-slate-800" />

                {/* Parameters in timeline */}
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>FPS:</span>
                  <input
                    type="number"
                    value={fps}
                    onChange={(e) => setFps(Number(e.target.value))}
                    className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-white font-mono"
                  />
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>Duration (s):</span>
                  <input
                    type="number"
                    value={durationSec}
                    onChange={(e) => setDurationSec(Number(e.target.value))}
                    className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-white font-mono"
                  />
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>Win:</span>
                  <input
                    type="number"
                    value={winFrames}
                    onChange={(e) => setWinFrames(Number(e.target.value))}
                    className="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-amber-300 font-mono"
                  />
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>Ovl:</span>
                  <input
                    type="number"
                    value={ovlFrames}
                    onChange={(e) => setOvlFrames(Number(e.target.value))}
                    className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-amber-300 font-mono"
                  />
                </div>

                <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer ml-1">
                  <input
                    type="checkbox"
                    checked={bands}
                    onChange={(e) => setBands(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-500"
                  />
                  <span>bands</span>
                </label>

                <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={snap}
                    onChange={(e) => setSnap(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-500"
                  />
                  <span>snap</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert("Lecture de la timeline en cours (simulation des 4 fenêtres DiT)")}
                  className="px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-300 font-bold flex items-center gap-1 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>[Play]</span>
                </button>

                <button
                  onClick={() => setSegments([])}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>

                <span className="font-mono text-slate-400 text-xs pl-2">
                  0.00s / {durationSec}.00s
                </span>
              </div>
            </div>

            {/* Time ruler */}
            <div className="h-6 bg-slate-950 border border-slate-800/80 rounded-lg flex items-center px-3 text-[10px] text-slate-500 font-mono justify-between select-none">
              <span>0.0s</span>
              <span>2.5s</span>
              <span>5.0s</span>
              <span>10.0s</span>
              <span>15.0s</span>
              <span>25.0s</span>
              <span>35.0s</span>
              <span>45.0s</span>
              <span>60.0s</span>
            </div>

            {/* Multi-Track Container */}
            <div className="bg-[#12151b] border border-slate-800 rounded-xl p-3 space-y-2">
              
              {/* VIDEO Track */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
                  <span>VIDEO (images · text prompts)</span>
                  <span className="text-indigo-400 font-semibold">{segments.length} segments</span>
                </div>

                <div className="min-h-16 bg-slate-950 rounded-lg p-1.5 border border-slate-800/80 flex items-center gap-2 overflow-x-auto">
                  {segments.map((seg) => (
                    <button
                      key={seg.id}
                      onClick={() => setSelectedSegmentId(seg.id)}
                      className={`h-12 px-3 rounded-md text-xs font-semibold flex items-center gap-2 transition-all border shrink-0 text-left ${
                        selectedSegmentId === seg.id
                          ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md shadow-indigo-500/20'
                          : 'bg-indigo-950/20 border-indigo-900/40 text-indigo-300 hover:bg-indigo-900/30'
                      }`}
                      style={{ minWidth: '170px' }}
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                      <div className="truncate">
                        <div className="font-bold text-[11px]">{seg.title}</div>
                        <div className="text-[10px] text-indigo-300/70 truncate max-w-[140px]">{seg.prompt}</div>
                      </div>
                    </button>
                  ))}
                  {segments.length === 0 && (
                    <div className="w-full text-center text-xs text-slate-500 py-3">
                      Timeline vide. Cliquez sur "Add Text" ou "Add Image" pour commencer.
                    </div>
                  )}
                </div>
              </div>

              {/* AUDIO Track */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
                  <span>AUDIO</span>
                  <span className="text-yellow-400 text-[10px]">piste maître active</span>
                </div>
                <div className="h-10 bg-slate-950 rounded-lg p-2 border border-slate-800/80 flex items-center gap-2">
                  <div className="h-6 px-3 bg-yellow-500/20 border border-yellow-500/40 rounded text-yellow-300 text-[10px] font-mono flex items-center gap-1.5">
                    <Volume2 className="w-3 h-3" />
                    <span>audio_theme_cinematic.wav (15.08s)</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Segment Inspector & Editor */}
            {selectedSegment && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Segment actif
                    </span>
                    <span>{selectedSegment.title}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSegments(segments.filter(s => s.id !== selectedSegment.id));
                    }}
                    className="text-red-400 hover:text-red-300 text-xs font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Supprimer ce segment</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                  <div className="md:col-span-8 space-y-1.5">
                    <label className="text-slate-400 font-semibold">Prompt du segment (Shot prompt) :</label>
                    <textarea
                      value={selectedSegment.prompt}
                      onChange={(e) => {
                        const updated = segments.map(s => s.id === selectedSegment.id ? { ...s, prompt: e.target.value } : s);
                        setSegments(updated);
                      }}
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white font-sans focus:outline-none focus:border-indigo-400 leading-relaxed"
                    />
                  </div>

                  <div className="md:col-span-4 space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Début :</span>
                      <span className="font-mono text-white">{selectedSegment.startTime}s</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Longueur :</span>
                      <span className="font-mono text-amber-300">{selectedSegment.duration}s</span>
                    </div>
                    <button
                      onClick={onOpenCopilot}
                      className="w-full py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-300" />
                      <span>Optimiser avec IA</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Model & Advanced DiT Generation Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Model & Resolution Budget */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Box className="w-4 h-4 text-indigo-400" />
                <span>Modèle & Budget de Résolution LTX</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Model (LTX only) :</label>
                  <select
                    value={model}
                    onChange={(e: any) => setModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-400"
                  >
                    <option value="LTX-2 2.3 Distilled 1.1 22B · LTX-2">LTX-2 2.3 Distilled 1.1 22B · LTX-2</option>
                    <option value="LTX-Video 0.9.5 DiT">LTX-Video 0.9.5 DiT</option>
                    <option value="MiniMax H3 Director (Hybrid)">MiniMax H3 Director (Hybrid AV model)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Catégorie :</label>
                    <select
                      value={resolutionCategory}
                      onChange={(e: any) => setResolutionCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-indigo-400"
                    >
                      <option value="720p">720p (HD)</option>
                      <option value="480p">480p (Fast / Low VRAM)</option>
                      <option value="1080p">1080p (Full HD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-semibold block mb-1">Budget Pixels :</label>
                    <select
                      value={resolutionBudget}
                      onChange={(e) => setResolutionBudget(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-400"
                    >
                      <option value="512x960">512x960 (9:16 Portrait)</option>
                      <option value="960x512">960x512 (16:9 Landscape)</option>
                      <option value="768x768">768x768 (1:1 Carré)</option>
                      <option value="704x1280">704x1280 (HD Vertical)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Negative Prompt :</label>
                  <input
                    type="text"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-sans focus:outline-none focus:border-indigo-400 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Right: Sliders (CFG Phase 1, Phase 2, Flow Shift, Two Phases) */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <span>Curseurs de Guidage DiT (Two Phases)</span>
                </span>
                <span className="text-[11px] text-amber-400 font-mono">Tuning T33</span>
              </h3>

              <div className="space-y-3.5 text-xs">
                
                {/* CFG Phase 1 */}
                <div>
                  <div className="flex justify-between text-slate-300 font-medium mb-1">
                    <span>Guidance Scale (CFG Phase 1) :</span>
                    <span className="font-mono text-amber-400">{guidanceScale.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.1"
                    value={guidanceScale}
                    onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* CFG Phase 2 */}
                <div>
                  <div className="flex justify-between text-slate-300 font-medium mb-1">
                    <span>Guidance Scale (Phase 2) :</span>
                    <span className="font-mono text-amber-400">{guidanceScalePhase2.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.1"
                    value={guidanceScalePhase2}
                    onChange={(e) => setGuidanceScalePhase2(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                {/* Flow Shift */}
                <div>
                  <div className="flex justify-between text-slate-300 font-medium mb-1">
                    <span>Flow Shift (Shift Scale) :</span>
                    <span className="font-mono text-indigo-400">{flowShift.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={flowShift}
                    onChange={(e) => setFlowShift(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Phases & Switch Threshold */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block mb-1">Phases :</span>
                    <select
                      value={phases}
                      onChange={(e: any) => setPhases(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                    >
                      <option value="Two Phases">Two Phases</option>
                      <option value="Single Phase">Single Phase</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Switch Threshold :</span>
                    <input
                      type="number"
                      value={switchThreshold}
                      onChange={(e) => setSwitchThreshold(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUB-TAB 2: CATALOGUE DES PLUGINS WANGP */}
      {activeSubTab === 'plugins' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-indigo-400" />
                  <span>Gestionnaire de Plugins WanGP (v13.1315)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Répertoire officiel des extensions intégrées créées par DeepBeepMeep, The-ShadowWalker et Tophness.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-bold">
                8 Plugins Détectés
              </span>
            </div>

            {/* Plugins Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* LTX Director */}
              <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">LTX Director (v1.3.25 · T33)</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">Actif</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">Auteur: The-ShadowWalker (id: LTX-Director)</div>
                <p className="text-xs text-slate-300">
                  Timeline editor pour LTX video generation: drag images, write per-segment prompts, and place audio clips on one canvas to direct LTX video output.
                </p>
              </div>

              {/* H3 Director */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">H3 Director (v1.5.5)</span>
                  <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-300 text-[10px] font-bold">Installé</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">Auteur: The-ShadowWalker (id: MiniMax-H3-Director)</div>
                <p className="text-xs text-slate-300">
                  Timeline director for MiniMax H3 with a React UI, including the Hybrid AV model backend, multi-window generation (4 windows x 344 frames).
                </p>
              </div>

              {/* Motion Designer */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Motion Designer (v1.0.0)</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">Bundled</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">Auteur: DeepBeepMeep (id: motion_designer)</div>
                <p className="text-xs text-slate-300">
                  Découpez des objets, dessinez leurs trajectoires de mouvement vectorielles, prévisualisez l'animation et injectez le masque directement dans WanGP.
                </p>
              </div>

              {/* LoRA Manager */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">LoRA Manager (v2.5.5)</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">Installé</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">Auteur: Tophness (id: wan2gp-lora-manager)</div>
                <p className="text-xs text-slate-300">
                  Gestion des LoRAs locaux avec support lset et injection granulaire de prompts et fichiers par bloc de transformer.
                </p>
              </div>

              {/* Krea 2 Identity Edit */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Krea 2 Identity Edit (v2.0.0)</span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">Model</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">Auteur: totideyouover2026-max</div>
                <p className="text-xs text-slate-300">
                  Préservation d'identité faciale et corporelle avec contrôle expérimental de carte de profondeur pour WanGP.
                </p>
              </div>

              {/* File Gallery */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">File Gallery (v2.0.3)</span>
                  <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px] font-bold">App</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">Auteur: Tophness & Neires (id: wan2gp-gallery)</div>
                <p className="text-xs text-slate-300">
                  Visualisez les métadonnées de tous les rendus dans vos dossiers de sortie et raccordez les segments vidéo en 1 clic.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: HOME SERVER CONNECTIVITY */}
      {activeSubTab === 'homeserver' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl">
            
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-400" />
                  <span>Pinokio Home Server & Accès Réseau Distant</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Activez le composant réseau local de Pinokio pour partager Wan2GP et LTX Director sur tout votre réseau domestique (PC, Mac, iPad, iPhone) via Caddy Reverse Proxy.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${homeServerInstalled ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-xs font-mono text-slate-300">
                  {homeServerInstalled ? 'Serveur En Ligne' : 'Non Installé'}
                </span>
              </div>
            </div>

            {/* Setup Card mimicking Pinokio Home Server UI */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 max-w-xl mx-auto shadow-inner">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-red-400 font-semibold">Home Server</span>
                <span className="text-slate-500 font-mono">Setup local networking</span>
              </div>

              {!homeServerInstalled ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white">Install Home Server support</div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Pinokio needs its local networking component before it can share this computer on your home network.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsInstallingHomeServer(true);
                      setTimeout(() => {
                        setIsInstallingHomeServer(false);
                        setHomeServerInstalled(true);
                      }, 1800);
                    }}
                    disabled={isInstallingHomeServer}
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    {isInstallingHomeServer ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                        <span>Installation du composant réseau Pinokio...</span>
                      </>
                    ) : (
                      <>
                        <Network className="w-4 h-4 text-amber-400" />
                        <span>Install Home Server support</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-3 rounded-xl bg-green-950/30 border border-green-800/60 text-green-300 text-xs flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-green-400 shrink-0" />
                    <span>Home Server opérationnel ! Votre application est accessible sur le réseau local.</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400">URL d'accès réseau local :</span>
                      <span className="font-mono text-amber-300 font-bold">http://{serverLocalIp}:{serverPort}</span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Reverse Proxy Caddy :</span>
                      <span className="font-mono text-green-400">Activé (Port 80/443 auto-bind)</span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400">PIN de Sécurité :</span>
                      <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded">{authPin}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => copyToClipboard(`http://${serverLocalIp}:${serverPort}`, 'local_url')}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
                  >
                    {copiedKey === 'local_url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'local_url' ? 'URL Copiée !' : 'Copier l\'adresse pour smartphone ou tablette'}</span>
                  </button>
                </div>
              )}

              {/* Command for manual launch */}
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span>Commande CLI Pinokio équivalente :</span>
                <pre className="mt-1 p-2 rounded bg-slate-900 font-mono text-amber-400/90 overflow-x-auto">
                  pinokio run wan2gp --listen 0.0.0.0 --port {serverPort}
                </pre>
              </div>

            </div>

            {/* NEW SECTION 1: Tester la Connexion à Pinokio */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 max-w-2xl mx-auto shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Test de Connexion Pinokio en Direct</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Port par défaut: 42000 ou 7860</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                <div className="sm:col-span-7 space-y-1">
                  <label className="text-slate-400 font-semibold block">Hôte ou IP locale :</label>
                  <input
                    type="text"
                    value={pinokioHostInput}
                    onChange={(e) => setPinokioHostInput(e.target.value)}
                    placeholder="127.0.0.1 ou 192.168.1.X"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="sm:col-span-5 space-y-1">
                  <label className="text-slate-400 font-semibold block">Port Pinokio :</label>
                  <input
                    type="number"
                    value={pinokioPortInput}
                    onChange={(e) => setPinokioPortInput(Number(e.target.value))}
                    placeholder="42000"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <button
                onClick={handleTestPinokioConnection}
                disabled={isTestingConnection}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-amber-500 hover:from-indigo-400 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isTestingConnection ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Vérification de la liaison en cours...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5" />
                    <span>Tester la connexion à Pinokio</span>
                  </>
                )}
              </button>

              {/* Diagnostic Results */}
              {testResult && (
                <div className={`p-4 rounded-xl border text-xs space-y-2 animate-fadeIn ${
                  testResult.connected
                    ? 'bg-green-950/30 border-green-800/80 text-green-300'
                    : 'bg-amber-950/30 border-amber-800/80 text-amber-300'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {testResult.connected ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
                      <span>Statut : {testResult.diagnostics?.status || testResult.error || 'ERREUR'}</span>
                    </span>
                    {testResult.diagnostics?.latencyMs && (
                      <span className="font-mono text-[11px] text-green-400">
                        {testResult.diagnostics.latencyMs} ms latence
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {testResult.diagnostics?.recommendation || testResult.message}
                  </p>
                  <div className="pt-2 border-t border-slate-800/60 font-mono text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Cible : {testResult.testedEndpoint}</span>
                    <span>Application ciblée : Wan2GP LTX</span>
                  </div>
                </div>
              )}
            </div>

            {/* NEW SECTION 2: Installateur Automatisé pour Windows 11 */}
            <div className="p-5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-4 max-w-2xl mx-auto shadow-xl">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Installateur 1-Click pour Windows 11</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Déploie Wan2GP v13.1315, LTX Director v1.3.25 T33, CUDA, Disk Saver et raccourci Bureau en une seule commande.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                  Windows 11 Ready
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  <span>Vérification automatique de <code>nvidia-smi</code> et accélération GPU</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  <span>Installation automatique de Git via Windows Winget si absent</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  <span>Génération du fichier <code>args.txt</code> pré-réglé avec <code>--lowvram --fp8 --cpu-offload</code></span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  <span>Création automatique du raccourci Bureau <strong>"Lancer Wan2GP LTX Director"</strong></span>
                </div>
              </div>

              {/* Action Buttons: PowerShell & Batch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleDownloadWindowsInstaller('ps1')}
                  className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <FileDown className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Télécharger Script PowerShell (.ps1)</span>
                </button>

                <button
                  onClick={() => handleDownloadWindowsInstaller('bat')}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-700/80 shadow-md active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Télécharger Batch (.bat)</span>
                </button>
              </div>

              {installerDownloaded && (
                <div className="p-2.5 rounded-xl bg-green-950/40 border border-green-800 text-green-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  <span>Installateur <strong>.{installerDownloaded}</strong> téléchargé ! Faites clic droit &gt; "Exécuter avec PowerShell" ou double-cliquez sur le .bat.</span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
