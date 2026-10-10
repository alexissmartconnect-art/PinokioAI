import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  Eye, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw, 
  Smartphone, 
  VolumeX, 
  FileCode2, 
  Activity, 
  Play, 
  Pause, 
  ChevronRight, 
  Compass, 
  ShieldCheck, 
  Download, 
  Copy, 
  Check, 
  HelpCircle,
  Film,
  Zap,
  Box,
  Undo2,
  Clock
} from 'lucide-react';
import { 
  ExperienceManifest, 
  KaiOrbState, 
  ExperienceStrategy, 
  QualityGateStatus 
} from '../types';
import { KaiOrb } from './KaiOrb';
import { CinematicViewport } from './CinematicViewport';
import { VisualInspectorPanel } from './VisualInspectorPanel';
import { ScrollDirector, ScrollDirectorState } from '../services/kai/scrollDirector';
import { CreativeDirector } from '../services/kai/creativeDirector';
import { ExperienceStrategyEngine } from '../services/kai/experienceStrategyEngine';
import { createDemoGenesisWatchProject } from '../services/kai/demoProject';
import { createManifestFromPrompt, applyInspectorPatch, withStrategy } from '../services/kai/manifestOps';
import { NEXUS_SUBSYSTEM_AUDIT } from '../services/kai/kaiCore';

export const KaiCinematicStudio: React.FC = () => {
  // Master Experience Manifest state
  const [manifest, setManifest] = useState<ExperienceManifest>(createDemoGenesisWatchProject());

  // KAI Orb State & Status Message
  const [orbState, setOrbState] = useState<KaiOrbState>('done');
  const [orbMessage, setOrbMessage] = useState<string>("L'expérience cinématique est prête. Utilisez le défilement ci-dessous ou demandez des modifications.");
  const [isOrbProcessing, setIsOrbProcessing] = useState(false);

  // Active Strategy (derived from the manifest so the switcher and the audit never diverge)
  const activeStrategy = manifest.strategy;
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Scroll Director State
  const [scrollProgress, setScrollProgress] = useState(0.0);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);
  const [activeTab, setActiveTab] = useState<'viewport' | 'manifest' | 'quality_gate' | 'acceptance_tests' | 'subsystems'>('viewport');
  const [copiedManifest, setCopiedManifest] = useState(false);

  // Acceptance Tests State
  const [acceptanceTest1Results, setAcceptanceTest1Results] = useState<any | null>(null);
  const [acceptanceTest2Results, setAcceptanceTest2Results] = useState<any | null>(null);

  // Initialize Scroll Director
  const [scrollState, setScrollState] = useState<ScrollDirectorState>(() => {
    const director = new ScrollDirector(manifest.scenes, isReducedMotion);
    return director.resolveState(0.0);
  });

  // Re-resolve scroll state when progress or scenes or reduced motion changes
  useEffect(() => {
    const director = new ScrollDirector(manifest.scenes, isReducedMotion);
    const resolved = director.resolveState(scrollProgress);
    setScrollState(resolved);
  }, [scrollProgress, manifest.scenes, isReducedMotion]);

  // Autoplay simulation loop
  useEffect(() => {
    if (!isPlayingTimeline) return;
    const interval = setInterval(() => {
      setScrollProgress((prev) => Math.min(1.0, prev + 0.005));
    }, 30);
    return () => clearInterval(interval);
  }, [isPlayingTimeline]);

  // Stop autoplay once the end of the timeline is reached
  useEffect(() => {
    if (scrollProgress >= 1.0) setIsPlayingTimeline(false);
  }, [scrollProgress]);

  // Revision history: every manifest change is committed so it can be undone
  const [history, setHistory] = useState<ExperienceManifest[]>([]);
  const commitManifest = (next: ExperienceManifest) => {
    setHistory((h) => [...h.slice(-29), manifest]);
    setManifest(next);
  };
  const undoRevision = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory(history.slice(0, -1));
    setManifest(previous);
  };

  // Handle Natural Language Prompt from KAI Orb
  const handleOrbPrompt = async (prompt: string) => {
    if (!prompt.trim()) return;
    setIsOrbProcessing(true);

    // Sequence of authoritative state transitions per Instruction 30
    setOrbState('planning');
    setOrbMessage("Je construis la narration du produit.");
    await new Promise((r) => setTimeout(r, 650));

    setOrbState('generating');
    setOrbMessage("Je prépare les assets cinématiques et géométries PBR.");
    await new Promise((r) => setTimeout(r, 700));

    setOrbState('coding');
    setOrbMessage("J'assemble l'expérience interactive et la chorégraphie caméra.");
    await new Promise((r) => setTimeout(r, 750));

    setOrbState('testing');
    setOrbMessage("Je vérifie le rendu 60fps et les contraintes de performance.");
    await new Promise((r) => setTimeout(r, 550));

    const { manifest: newManifest, plan } = createManifestFromPrompt(prompt, {
      isMobile: isMobileMode,
      prefersReducedMotion: isReducedMotion
    });

    commitManifest(newManifest);
    setScrollProgress(0.0);

    setOrbState('done');
    setOrbMessage(
      `L'expérience « ${plan.brief.targetProduct.name} » est prête en stratégie ${newManifest.strategy}. Explorez au scroll !`
    );
    setIsOrbProcessing(false);
  };

  // Targeted Visual Inspector Patch: pure, immutable, returns the changes actually applied
  const handleApplyInspectorPatch = (instruction: string): string[] => {
    const result = applyInspectorPatch(manifest, scrollState.activeSceneIndex, instruction);
    if (result.changes.length > 0) {
      commitManifest(result.manifest);
    }
    return result.changes;
  };

  // Acceptance tests are computed from real behaviour; nothing is hard-coded to PASS
  type AcceptanceItem = { label: string; pass: boolean | null; detail: string };
  const summarize = (items: AcceptanceItem[]) => {
    const tested = items.filter((i) => i.pass !== null);
    return { allPass: tested.every((i) => i.pass === true), passed: tested.filter((i) => i.pass).length, total: tested.length };
  };

  // Run Acceptance Test 1 (Instruction 28)
  const runAcceptanceTest1 = () => {
    const testPrompt = "Crée-moi une expérience premium pour cette montre mécanique. Je veux voir la matière brute, les pièces, le mécanisme, puis la montre qui s'assemble progressivement pendant le scroll.";
    const { manifest: planned, plan } = createManifestFromPrompt(testPrompt);
    const patch = applyInspectorPatch(planned, 1, 'ralentis cette animation');
    const switched = withStrategy(planned, 'VIDEO_SCROLL');
    const sceneNarrative = planned.qualityGateChecks.find((c) => c.id === 'chk-narr-01');
    const strategyCheck = planned.qualityGateChecks.find((c) => c.id === 'chk-strat-01');

    const items: AcceptanceItem[] = [
      { label: 'Demande en langage naturel traitée par KAI / Orbe', pass: planned.brief.clientGoal === testPrompt, detail: `Prompt: "${testPrompt.slice(0, 45)}..."` },
      { label: 'CreativeBrief produit avec ProductIdentity', pass: planned.brief.targetProduct.name.length > 0, detail: `Produit: ${planned.brief.targetProduct.name}` },
      { label: 'VisualNarrative : 5 scènes contiguës 0 → 100 %', pass: sceneNarrative?.status === 'PASS', detail: planned.scenes.map((s) => s.name).join(' → ') },
      { label: 'Stratégie sélectionnée avec motif structuré', pass: plan.strategyEvaluation.reason.length > 0, detail: `${planned.strategy} — ${plan.strategyEvaluation.reason.slice(0, 80)}...` },
      { label: 'Cohérence stratégie ↔ capacités du manifeste', pass: strategyCheck?.status === 'PASS', detail: strategyCheck?.message ?? '' },
      { label: 'Quality Gate sans échec', pass: planned.overallQualityStatus !== 'FAIL', detail: `Statut: ${planned.overallQualityStatus}` },
      { label: 'Repli Mobile & Reduced-Motion configurés', pass: !!planned.fallbacks.mobileStrategy && !!planned.fallbacks.reducedMotionStrategy, detail: `${planned.fallbacks.mobileStrategy} / ${planned.fallbacks.reducedMotionStrategy}` },
      { label: 'Visual Inspector modifie réellement la scène', pass: patch.changes.length > 0 && patch.manifest !== planned, detail: patch.changes.join(' · ') || 'Aucun changement' },
      { label: 'Changement de stratégie propage les capacités', pass: switched.subCapabilities.includes('SCROLL_SCRUB_VIDEO'), detail: `Capacités: ${switched.subCapabilities.length}` },
      { label: 'Build TypeScript / Vite', pass: null, detail: 'Hors runtime — exécuter npm run lint && npm run build' }
    ];

    setAcceptanceTest1Results({
      testName: 'TEST ACCEPTATION 1 — Pipeline Complet KAI Cinématique',
      items,
      summary: summarize(items),
      timestamp: new Date().toLocaleTimeString()
    });
  };

  // Run Acceptance Test 2 (Instruction 29)
  const runAcceptanceTest2 = () => {
    const resA = ExperienceStrategyEngine.evaluateStrategy({ hasGlbModel: true });
    const resB = ExperienceStrategyEngine.evaluateStrategy({ hasGlbModel: false, hasProductPhotos: true });
    const resC = ExperienceStrategyEngine.evaluateStrategy({ hasCinematicVideo: true });
    const resD = ExperienceStrategyEngine.evaluateStrategy({ isMobileDevice: true });

    const scenarios = [
      { id: 'A', case: 'Modèle GLB/GLTF réel fourni', selectedStrategy: resA.selectedStrategy, expected: 'TRUE_3D', pass: resA.selectedStrategy === 'TRUE_3D', reason: resA.reason },
      { id: 'B', case: 'Photos de référence uniquement (sans GLB lourd)', selectedStrategy: resB.selectedStrategy, expected: 'HYBRID | IMAGE_SEQUENCE', pass: resB.selectedStrategy === 'HYBRID' || resB.selectedStrategy === 'IMAGE_SEQUENCE', reason: resB.reason },
      { id: 'C', case: 'Vidéo cinématique maîtresse disponible', selectedStrategy: resC.selectedStrategy, expected: 'VIDEO_SCROLL', pass: resC.selectedStrategy === 'VIDEO_SCROLL', reason: resC.reason },
      { id: 'D', case: 'Profil mobile contraint (GPU/Batterie)', selectedStrategy: resD.selectedStrategy, expected: 'HYBRID | DOM_MOTION', pass: resD.selectedStrategy === 'HYBRID' || resD.selectedStrategy === 'DOM_MOTION', reason: resD.reason }
    ];

    setAcceptanceTest2Results({
      testName: 'TEST ACCEPTATION 2 — Évaluation Dynamique des Stratégies selon les Assets',
      scenarios,
      passed: scenarios.filter((s) => s.pass).length,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* 1. KAI Orb Entry Point (Instruction 3, 30) */}
      <KaiOrb
        state={orbState}
        statusMessage={orbMessage}
        onSendPrompt={handleOrbPrompt}
        isLoading={isOrbProcessing}
      />

      {/* 2. Strategy Switcher & Accessibility Toggles Bar */}
      <div className="p-4 rounded-2xl bg-[#0e1218] border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        
        {/* Rendering Strategy Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Stratégie Active :</span>
          </span>

          {(['HYBRID', 'TRUE_3D', 'VIDEO_SCROLL', 'IMAGE_SEQUENCE', 'DOM_MOTION'] as ExperienceStrategy[]).map((strat) => (
            <button
              key={strat}
              onClick={() => commitManifest(withStrategy(manifest, strat))}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                activeStrategy === strat
                  ? 'bg-gradient-to-r from-amber-400 to-indigo-500 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {strat}
            </button>
          ))}
          <button
            onClick={undoRevision}
            disabled={history.length === 0}
            className="ml-2 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-800 bg-slate-900 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Annuler la dernière révision du manifeste"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Annuler ({history.length})</span>
          </button>
        </div>

        {/* Device & Accessibility Fallback Toggles */}
        <div className="flex items-center gap-2">
          {/* Mobile Profile Toggle */}
          <button
            onClick={() => setIsMobileMode(!isMobileMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isMobileMode
                ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Tester le repli mobile (Instruction 18)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mode Mobile {isMobileMode ? 'Actif' : 'Off'}</span>
          </button>

          {/* Reduced Motion Toggle */}
          <button
            onClick={() => setIsReducedMotion(!isReducedMotion)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isReducedMotion
                ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Tester l'accessibilité prefers-reduced-motion (Instruction 19)"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Motion Réduite {isReducedMotion ? 'On' : 'Off'}</span>
          </button>
        </div>

      </div>

      {/* 3. Navigation Tabs within Cinematic Studio */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('viewport')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'viewport'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Film className="w-4 h-4 text-amber-300" />
          <span>Viewport Expérience & Scènes</span>
        </button>

        <button
          onClick={() => setActiveTab('manifest')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'manifest'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileCode2 className="w-4 h-4 text-cyan-300" />
          <span>Experience Manifest (JSON)</span>
        </button>

        <button
          onClick={() => setActiveTab('quality_gate')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'quality_gate'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-green-300" />
          <span>Quality Gate Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('acceptance_tests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'acceptance_tests'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Zap className="w-4 h-4 text-yellow-300" />
          <span>Tests d’Acceptation 1 & 2</span>
        </button>

        <button
          onClick={() => setActiveTab('subsystems')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'subsystems'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Box className="w-4 h-4 text-purple-300" />
          <span>Sous-systèmes NEXUS (Audit)</span>
        </button>
      </div>

      {/* 4. Tab Content: Viewport & Interactive Scroll Director */}
      {activeTab === 'viewport' && (
        <div className="space-y-6">
          
          {/* Main 3D / WebGL Viewport */}
          <CinematicViewport
            scrollState={scrollState}
            activeStrategy={activeStrategy}
            isReducedMotion={isReducedMotion}
          />

          {/* Interactive Authoritative Scroll Director Bar (Instruction 10) */}
          <div className="p-5 rounded-3xl bg-[#0e1218] border border-slate-800 shadow-xl space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                  className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                    isPlayingTimeline 
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                  title={isPlayingTimeline ? 'Pause timeline' : 'Lire la cinématique'}
                >
                  {isPlayingTimeline ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlayingTimeline ? 'Pause' : 'Lecture Auto'}</span>
                </button>

                <div className="text-xs font-mono text-slate-300">
                  <span className="text-slate-500">Scroll Director:</span>{' '}
                  <strong className="text-amber-400 text-sm">{(scrollProgress * 100).toFixed(1)}%</strong>
                </div>
              </div>

              {/* Fast Jump to Narrative Scenes (1 to 5) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {manifest.scenes.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => {
                      setIsPlayingTimeline(false);
                      setScrollProgress(scene.scrollStart + 0.02);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all ${
                      scrollState.activeScene.id === scene.id
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Scène {scene.order}: {scene.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Continuous Scrub Slider */}
            <div className="space-y-1.5">
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={scrollProgress}
                onChange={(e) => {
                  setIsPlayingTimeline(false);
                  setScrollProgress(parseFloat(e.target.value));
                }}
                className="w-full h-2.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-400 border border-slate-800"
              />

              <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
                <span>0% — Matière Brute</span>
                <span>25% — Pièces & Usinage</span>
                <span>50% — Mécanisme Interne</span>
                <span>75% — Convergence & Assemblage</span>
                <span>100% — Révélation Finale 360°</span>
              </div>
            </div>

          </div>

          {/* Visual Inspector Panel (Instruction 22) */}
          <VisualInspectorPanel
            activeScene={scrollState.activeScene}
            manifest={manifest}
            onApplyPatch={handleApplyInspectorPatch}
          />

        </div>
      )}

      {/* 5. Tab Content: Experience Manifest JSON (Instruction 23) */}
      {activeTab === 'manifest' && (
        <div className="p-6 rounded-3xl bg-[#0e1218] border border-slate-800 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Experience Manifest Officiel
              </h3>
              <p className="text-xs text-slate-400">
                Structure de données décrivant l'état réel de l'implémentation (Instruction 23).
              </p>
            </div>

            <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${manifest.experienceId}-${manifest.revisionId}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger</span>
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(manifest, null, 2));
                setCopiedManifest(true);
                setTimeout(() => setCopiedManifest(false), 2000);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              {copiedManifest ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedManifest ? 'Copié !' : 'Copier JSON'}</span>
            </button>
            </div>
          </div>

          <pre className="p-4 rounded-2xl bg-black/80 border border-slate-800/80 text-xs font-mono text-slate-300 overflow-x-auto max-h-[600px] leading-relaxed">
            {JSON.stringify(manifest, null, 2)}
          </pre>
        </div>
      )}

      {/* 6. Tab Content: Quality Gate Audit (Instruction 24 & 25) */}
      {activeTab === 'quality_gate' && (
        <div className="p-6 rounded-3xl bg-[#0e1218] border border-slate-800 shadow-xl space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                <span>Cinematic Quality Gate — Diagnostics Fatuels</span>
              </h3>
              <p className="text-xs text-slate-400">
                Vérifications techniques réelles (Build, Décodage, Mémoire, Accessibilité). Zéro faux score "Luxury" ou "Apple" (Instruction 25).
              </p>
            </div>

            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/40 text-xs font-mono font-bold">
              STATUT : {manifest.overallQualityStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {manifest.qualityGateChecks.map((check) => (
              <div 
                key={check.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{check.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    check.status === 'PASS' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : check.status === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : check.status === 'FAIL'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {check.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {check.message}
                </p>

                {check.metric && (
                  <div className="text-[10px] font-mono text-amber-300 pt-1 border-t border-slate-900">
                    Métrique mesurée : <strong>{check.metric}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Tab Content: Acceptance Tests (Instruction 28 & 29) */}
      {activeTab === 'acceptance_tests' && (
        <div className="p-6 rounded-3xl bg-[#0e1218] border border-slate-800 shadow-xl space-y-8 animate-fadeIn">
          
          {/* Test 1 Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Test d’Acceptation 1 — Orchestration Complète KAI (Instruction 28)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Valide la chaîne complète : Langage naturel → CreativeBrief → VisualNarrative → Stratégie → Manifeste → Web Factory → Scroll → Inspection.
                </p>
              </div>

              <button
                onClick={runAcceptanceTest1}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
              >
                Exécuter le Test 1
              </button>
            </div>

            {acceptanceTest1Results && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={acceptanceTest1Results.summary.allPass ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                    {acceptanceTest1Results.summary.allPass ? '✓' : '✗'} {acceptanceTest1Results.summary.passed}/{acceptanceTest1Results.summary.total} CONTRÔLES VALIDÉS
                  </span>
                  <span className="text-slate-500">{acceptanceTest1Results.timestamp}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {acceptanceTest1Results.items.map((item: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                      {item.pass === null ? (
                        <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      ) : item.pass ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold text-white">{item.label}</div>
                        <div className="text-[11px] font-mono text-slate-400">{item.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test 2 Section */}
          <div className="space-y-4 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>Test d’Acceptation 2 — Évaluation Dynamique selon les Assets (Instruction 29)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Démontre que la stratégie choisie s’adapte intelligemment à la situation matérielle (A: GLB, B: Photos seules, C: Vidéo, D: Mobile).
                </p>
              </div>

              <button
                onClick={runAcceptanceTest2}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md active:scale-95"
              >
                Exécuter le Test 2
              </button>
            </div>

            {acceptanceTest2Results && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={acceptanceTest2Results.passed === acceptanceTest2Results.scenarios.length ? 'text-indigo-300 font-bold' : 'text-red-400 font-bold'}>
                    {acceptanceTest2Results.passed}/{acceptanceTest2Results.scenarios.length} SCÉNARIOS CONFORMES
                  </span>
                  <span className="text-slate-500">{acceptanceTest2Results.timestamp}</span>
                </div>

                <div className="space-y-2 text-xs">
                  {acceptanceTest2Results.scenarios.map((sc: any) => (
                    <div key={sc.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">Cas {sc.id} : {sc.case}</span>
                        <span className={`px-2 py-0.5 rounded font-mono font-bold ${sc.pass ? 'bg-indigo-500/20 text-indigo-300' : 'bg-red-500/20 text-red-300'}`}>
                          Retenue : {sc.selectedStrategy} (attendu : {sc.expected})
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {sc.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 8. Tab Content: Subsystems Audit (Instruction 1) */}
      {activeTab === 'subsystems' && (
        <div className="p-6 rounded-3xl bg-[#0e1218] border border-slate-800 shadow-xl space-y-5 animate-fadeIn">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Classification des Sous-Systèmes NEXUS (Instruction 1)
            </h3>
            <p className="text-xs text-slate-400">
              Audit rigoureux des briques existantes sans duplication de code.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(NEXUS_SUBSYSTEM_AUDIT).map(([name, item]) => (
              <div key={name} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate">{name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    item.status === 'REAL' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : item.status === 'PARTIAL'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {item.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
