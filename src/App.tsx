import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { VisionAnalyzer } from './components/VisionAnalyzer';
import { Wan2GPConfigurator } from './components/Wan2GPConfigurator';
import { LtxDirectorStudio } from './components/LtxDirectorStudio';
import { AppDirectory } from './components/AppDirectory';
import { DiskSaverDoctor } from './components/DiskSaverDoctor';
import { ScriptGenerator } from './components/ScriptGenerator';
import { ErrorLogManager } from './components/ErrorLogManager';
import { KaiCinematicStudio } from './components/KaiCinematicStudio';
import { AiChatCopilot } from './components/AiChatCopilot';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { LoraTrainingStudio } from './components/LoraTrainingStudio';
import { HardwareVram, Wan2GPSettings, PinokioApp, AIProviderModel, SystemErrorLog } from './types';
import { VRAM_PRESET_CONFIGS } from './data/pinokioDatabase';

const DEFAULT_AI_MODELS: AIProviderModel[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'gemini',
    description: 'Vitesse extrême, compréhension multimodale native & vision vidéo',
    badge: 'Recommandé Vidéo',
    contextLength: '1M tokens',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    description: 'Raisonnement complexe approfondi, analyse de scripts et codes Pinokio',
    badge: 'Raisonnement Pro',
    contextLength: '2M tokens',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (OpenRouter)',
    provider: 'openrouter',
    description: 'Expert en scripts complexes, architectures logiques & correction',
    badge: 'OpenRouter',
    contextLength: '200k tokens',
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3 (OpenRouter)',
    provider: 'openrouter',
    description: 'Raisonnement pointu sur les optimisations VRAM & paramètres',
    badge: 'OpenRouter',
    contextLength: '64k tokens',
  },
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large 2',
    provider: 'mistral',
    description: 'Excellence en prompt crafting cinématographique & code',
    badge: 'Mistral AI',
    contextLength: '128k tokens',
  },
  {
    id: 'codestral-latest',
    name: 'Codestral (Mistral)',
    provider: 'mistral',
    description: 'Spécialiste de la génération de scripts Pinokio.js, install & run',
    badge: 'Mistral Code',
    contextLength: '256k tokens',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'vision' | 'configurator' | 'ltx_director' | 'apps' | 'doctor' | 'scripts' | 'logs' | 'cinematic' | 'lora'>('cinematic');
  const [selectedVram, setSelectedVram] = useState<HardwareVram>('8GB');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);

  // Dynamic AI Models fetched from /api/models
  const [availableModels, setAvailableModels] = useState<AIProviderModel[]>(DEFAULT_AI_MODELS);
  const [selectedAiModel, setSelectedAiModel] = useState<AIProviderModel>(DEFAULT_AI_MODELS[0]);
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);

  // Function to refresh models from API
  const refreshAiModels = async () => {
    setIsRefreshingModels(true);
    try {
      const res = await fetch('/api/models?provider=all');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.models) && data.models.length > 0) {
          setAvailableModels(data.models);
          // Keep current model if still present, or pick first matching
          const stillThere = data.models.find((m: AIProviderModel) => m.id === selectedAiModel.id);
          if (!stillThere) {
            setSelectedAiModel(data.models[0]);
          }
        }
      }
    } catch (err) {
      console.error('Erreur chargement modèles IA:', err);
    } finally {
      setIsRefreshingModels(false);
    }
  };

  useEffect(() => {
    refreshAiModels();
  }, []);

  // Initialize Wan2GP Settings with the default 8GB VRAM profile
  const [wan2gpSettings, setWan2gpSettings] = useState<Wan2GPSettings>({
    model: 'wan2.1_14b_i2v_480p',
    mode: 'i2v',
    vramProfile: '8GB',
    resolution: VRAM_PRESET_CONFIGS['8GB'].resolution,
    aspectRatio: VRAM_PRESET_CONFIGS['8GB'].aspectRatio,
    frameCount: VRAM_PRESET_CONFIGS['8GB'].frameCount,
    fps: VRAM_PRESET_CONFIGS['8GB'].fps,
    steps: VRAM_PRESET_CONFIGS['8GB'].steps,
    cfgScale: VRAM_PRESET_CONFIGS['8GB'].cfgScale,
    flowShift: VRAM_PRESET_CONFIGS['8GB'].flowShift,
    motionStrength: VRAM_PRESET_CONFIGS['8GB'].motionStrength,
    sampler: 'FlowMatch Euler',
    vramOffload: VRAM_PRESET_CONFIGS['8GB'].vramOffload,
    precision: VRAM_PRESET_CONFIGS['8GB'].precision,
    attentionBackend: VRAM_PRESET_CONFIGS['8GB'].attentionBackend,
    seed: 42,
    imageDenoise: 0.85,
    positivePrompt: 'Cinematic fluid motion, realistic lighting, highly detailed textures, smooth 24fps camera tracking',
    negativePrompt: 'static, low quality, morphing limbs, distorted, blurry, artifacts, flickering',
  });

  // Handle changing VRAM hardware profile globally
  const handleApplyVramPreset = (vram: HardwareVram) => {
    setSelectedVram(vram);
    const preset = VRAM_PRESET_CONFIGS[vram];
    setWan2gpSettings((prev) => ({
      ...prev,
      vramProfile: vram,
      resolution: preset.resolution,
      aspectRatio: preset.aspectRatio,
      frameCount: preset.frameCount,
      fps: preset.fps,
      steps: preset.steps,
      cfgScale: preset.cfgScale,
      flowShift: preset.flowShift,
      motionStrength: preset.motionStrength,
      vramOffload: preset.vramOffload,
      precision: preset.precision,
      attentionBackend: preset.attentionBackend,
    }));
  };

  // Handle auto-injecting AI Vision Analysis result into Wan2GP configurator
  const handleApplyFromVision = (
    newSettings: Partial<Wan2GPSettings>,
    positivePrompt: string,
    negativePrompt: string,
    imageSrc?: string
  ) => {
    setWan2gpSettings((prev) => ({
      ...prev,
      ...newSettings,
      positivePrompt,
      negativePrompt,
      firstFrameImage: imageSrc || prev.firstFrameImage,
    }));
  };

  // Handle selecting an app from AppDirectory
  const handleSelectAppForConfig = (app: PinokioApp) => {
    if (app.id === 'wan2gp') {
      setActiveTab('configurator');
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e12] text-slate-200 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedVram={selectedVram}
        setSelectedVram={handleApplyVramPreset}
        toggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        onOpenApiSettings={() => setIsApiSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'vision' && (
          <VisionAnalyzer
            selectedVram={selectedVram}
            onApplySettingsToConfigurator={handleApplyFromVision}
            onSwitchToConfigurator={() => setActiveTab('configurator')}
          />
        )}

        {activeTab === 'configurator' && (
          <Wan2GPConfigurator
            settings={wan2gpSettings}
            setSettings={setWan2gpSettings}
            selectedVram={selectedVram}
            onApplyVramPreset={handleApplyVramPreset}
            onSwitchToVision={() => setActiveTab('vision')}
          />
        )}

        {activeTab === 'ltx_director' && (
          <LtxDirectorStudio
            selectedVram={selectedVram}
            onOpenCopilot={() => setIsChatOpen(true)}
          />
        )}

        {activeTab === 'apps' && (
          <AppDirectory onSelectAppForConfig={handleSelectAppForConfig} />
        )}

        {activeTab === 'doctor' && (
          <DiskSaverDoctor />
        )}

        {activeTab === 'cinematic' && (
          <KaiCinematicStudio />
        )}

        {activeTab === 'lora' && (
          <LoraTrainingStudio selectedVram={selectedVram} />
        )}

        {activeTab === 'scripts' && (
          <ScriptGenerator selectedVram={selectedVram} />
        )}

        {activeTab === 'logs' && (
          <ErrorLogManager
            selectedVram={selectedVram}
            availableModels={availableModels}
            onOpenCopilotWithLog={() => setIsChatOpen(true)}
          />
        )}
      </main>

      {/* AI Assistant Drawer */}
      <AiChatCopilot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        selectedVram={selectedVram}
        currentSettings={wan2gpSettings}
        availableModels={availableModels}
        selectedModel={selectedAiModel}
        onSelectModel={setSelectedAiModel}
        onOpenApiSettings={() => setIsApiSettingsOpen(true)}
      />

      {/* API Settings & Models Management Modal */}
      <ApiSettingsModal
        isOpen={isApiSettingsOpen}
        onClose={() => setIsApiSettingsOpen(false)}
        availableModels={availableModels}
        selectedModel={selectedAiModel}
        onSelectModel={setSelectedAiModel}
        onRefreshModels={refreshAiModels}
        isRefreshingModels={isRefreshingModels}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white">Pinokio AI Studio Copilot</span>
            <span>•</span>
            <span>Conçu pour Wan2GP, LTX Video, Maestro, YuE2 & l'Écosystème Pinokio.co</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Sécurité Serveur Gemini API Active</span>
            <span>•</span>
            <a
              href="https://pinokio.co"
              target="_blank"
              rel="noreferrer"
              className="hover:text-amber-400 transition-colors"
            >
              Pinokio.co
            </a>
            <span>•</span>
            <a
              href="https://github.com/deepbeepmeep/Wan2GP"
              target="_blank"
              rel="noreferrer"
              className="hover:text-amber-400 transition-colors"
            >
              Wan2GP GitHub
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
