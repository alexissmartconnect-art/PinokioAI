import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  Video, 
  ArrowRight, 
  Copy, 
  Check, 
  Sliders, 
  Eye, 
  Flame, 
  Camera, 
  Wind, 
  Layers, 
  AlertCircle,
  RefreshCw,
  Cpu,
  HelpCircle,
  Download,
  FileCode,
  Play,
  Pause,
  Film,
  Zap,
  Star,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import { AIAnalysisResult, HardwareVram, Wan2GPSettings, VideoTargetEngine } from '../types';
import { SAMPLE_PRESET_IMAGES } from '../data/pinokioDatabase';

interface VisionAnalyzerProps {
  selectedVram: HardwareVram;
  onApplySettingsToConfigurator: (settings: Partial<Wan2GPSettings>, positivePrompt: string, negativePrompt: string, imageSrc?: string) => void;
  onSwitchToConfigurator: () => void;
}

// Top-rated Pinokio Video Tools ranked by community check-ins & stars
const TOP_PINOKIO_VIDEO_TOOLS: {
  id: VideoTargetEngine;
  name: string;
  author: string;
  badge: string;
  stars: string;
  checkInRank: number;
  description: string;
  iconColor: string;
}[] = [
  {
    id: 'wan2gp',
    name: 'Wan2GP',
    author: 'deepbeepmeep',
    badge: '#1 Top Check-ins Pinokio',
    stars: '4.9/5',
    checkInRank: 1,
    description: 'Le lanceur universel le plus populaire pour Wan 2.1 (14B/1.3B) avec offload CPU & FP8.',
    iconColor: 'text-amber-400'
  },
  {
    id: 'ltx_video',
    name: 'LTX-Video & Director',
    author: 'The-ShadowWalker / Lightricks',
    badge: 'Ultra Rapide DiT (~3s)',
    stars: '4.8/5',
    checkInRank: 2,
    description: 'Architecture Diffusion Transformer ultra-légère pour itérer instantanément.',
    iconColor: 'text-indigo-400'
  },
  {
    id: 'hunyuan_video',
    name: 'HunyuanVideo',
    author: 'Tencent',
    badge: 'Qualité Studio 720p',
    stars: '4.9/5',
    checkInRank: 3,
    description: 'Modèle vidéo open-source haute fidélité avec cinématique photo-réaliste.',
    iconColor: 'text-purple-400'
  },
  {
    id: 'cogvideox',
    name: 'CogVideoX 5B',
    author: 'THUDM / Zhipu AI',
    badge: 'DiT Temporel Avancé',
    stars: '4.7/5',
    checkInRank: 4,
    description: 'Excellente adhérence temporelle et compression VAE 3D.',
    iconColor: 'text-blue-400'
  },
  {
    id: 'comfyui_video',
    name: 'ComfyUI Video Nodes',
    author: 'comfyanonymous',
    badge: 'Modulaire & LoRA',
    stars: '4.9/5',
    checkInRank: 5,
    description: 'Noeuds WanVideoWrapper & LTXSampler partageant les modèles de Pinokio.',
    iconColor: 'text-emerald-400'
  },
  {
    id: 'maestro',
    name: 'Maestro Local Studio',
    author: 'blizaine',
    badge: 'Multi-Pistes Réalisateur',
    stars: '4.8/5',
    checkInRank: 6,
    description: 'Studio complet de réalisation, découpage en plans et montage non-linéaire.',
    iconColor: 'text-pink-400'
  }
];

export const VisionAnalyzer: React.FC<VisionAnalyzerProps> = ({
  selectedVram,
  onApplySettingsToConfigurator,
  onSwitchToConfigurator,
}) => {
  // File state (Image OR Video)
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(SAMPLE_PRESET_IMAGES[0].imageUrl);
  const [capturedFrameUrl, setCapturedFrameUrl] = useState<string | null>(SAMPLE_PRESET_IMAGES[0].imageUrl);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    sizeKb: number;
    mimeType: string;
    videoDuration?: number;
    resolution?: string;
  } | null>({
    name: 'cyberpunk_neon_alley.jpg',
    sizeKb: 340,
    mimeType: 'image/jpeg',
  });

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);

  // Video playback & scrubber state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // Prompt configuration & engine target
  const [userGoal, setUserGoal] = useState<string>(SAMPLE_PRESET_IMAGES[0].sampleGoal);
  const [targetEngine, setTargetEngine] = useState<VideoTargetEngine>('wan2gp');
  const [activePromptTab, setActivePromptTab] = useState<'primary' | 'all_tools' | 'motion' | 'settings'>('primary');

  // Analysis result state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Hidden canvas for frame extraction from video
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Capture current video frame into a base64 image
  const captureFrameFromVideo = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedFrameUrl(dataUrl);
    return dataUrl;
  };

  // Process incoming file (image OR video)
  const processUploadedFile = (file: File) => {
    setErrorMessage(null);
    setAnalysisResult(null);

    const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/i.test(file.name);
    const isImg = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);

    if (!isVid && !isImg) {
      setErrorMessage("Format de fichier non pris en charge. Veuillez importer une image (PNG, JPG, WebP) ou une vidéo (MP4, WebM, MOV).");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const details = {
      name: file.name,
      sizeKb: Math.round(file.size / 1024),
      mimeType: file.type || (isVid ? 'video/mp4' : 'image/jpeg'),
    };

    if (isVid) {
      setMediaType('video');
      setSelectedMediaUrl(objectUrl);
      setFileDetails(details);
      // Wait for video metadata to capture initial frame
      setTimeout(() => {
        captureFrameFromVideo();
      }, 500);
    } else {
      setMediaType('image');
      setSelectedMediaUrl(objectUrl);
      setCapturedFrameUrl(objectUrl);
      setFileDetails(details);
    }
  };

  // Handle native file input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUploadedFile(file);
  };

  // Handle Drag & Drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processUploadedFile(file);
  };

  // Prepare Base64 data for server vision request
  const getPayloadBase64 = async (): Promise<string> => {
    // If video, use captured frame
    if (mediaType === 'video') {
      const extracted = captureFrameFromVideo() || capturedFrameUrl;
      if (extracted) return extracted;
    }

    if (selectedMediaUrl) {
      if (selectedMediaUrl.startsWith('data:image')) {
        return selectedMediaUrl;
      }
      const response = await fetch(selectedMediaUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    throw new Error("Aucun média sélectionné pour l'analyse.");
  };

  // Execute AI Analysis
  const handleAnalyze = async () => {
    if (!selectedMediaUrl) {
      setErrorMessage("Veuillez sélectionner ou importer une image ou une vidéo d'abord.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAppliedSuccess(false);

    try {
      const base64Data = await getPayloadBase64();
      
      const res = await fetch('/api/analyze-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaBase64: base64Data,
          mediaType,
          userGoal,
          gpuVram: selectedVram,
          targetModel: targetEngine,
          mimeType: fileDetails?.mimeType || 'image/jpeg',
          videoMetadata: mediaType === 'video' ? {
            duration: videoDuration,
            fps: 24,
            resolution: fileDetails?.resolution || '1280x720',
          } : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur serveur (${res.status})`);
      }

      const data: AIAnalysisResult = await res.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.error('Media analysis error:', err);
      setErrorMessage(err.message || "Échec de l'analyse par l'IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Apply generated prompts and sliders directly into Wan2GP / LTX configurator
  const applyToConfigurator = () => {
    if (!analysisResult) return;

    const rec = analysisResult.recommendedSettings;
    const isLtx = targetEngine === 'ltx_video';

    const chosenPrompt = isLtx 
      ? analysisResult.ltxPrompt 
      : (targetEngine === 'hunyuan_video' && analysisResult.hunyuanPrompt ? analysisResult.hunyuanPrompt : analysisResult.wan2gpPrompt);

    const chosenNegPrompt = isLtx 
      ? analysisResult.ltxNegativePrompt 
      : (targetEngine === 'hunyuan_video' && analysisResult.hunyuanNegativePrompt ? analysisResult.hunyuanNegativePrompt : analysisResult.wan2gpNegativePrompt);

    const settingsPayload: Partial<Wan2GPSettings> = {
      model: isLtx ? 'ltx_video_0.9.5' : (rec.resolution.includes('720') ? 'wan2.1_14b_i2v_720p' : 'wan2.1_14b_i2v_480p'),
      mode: 'i2v',
      vramProfile: selectedVram,
      resolution: (rec.resolution.includes('720') ? '1280x720' : '832x480') as any,
      frameCount: rec.frames || 81,
      fps: rec.fps || 24,
      steps: rec.steps || (isLtx ? 25 : 30),
      cfgScale: rec.cfgScale || (isLtx ? 3.5 : 5.0),
      flowShift: rec.flowShift || (isLtx ? 3.0 : 3.5),
      motionStrength: rec.motionStrength || 7,
      sampler: 'FlowMatch Euler',
      imageDenoise: rec.imageDenoise || 0.85,
      firstFrameImage: capturedFrameUrl || selectedMediaUrl || undefined,
    };

    onApplySettingsToConfigurator(settingsPayload, chosenPrompt, chosenNegPrompt, capturedFrameUrl || selectedMediaUrl || undefined);
    setAppliedSuccess(true);
    setTimeout(() => {
      onSwitchToConfigurator();
    }, 450);
  };

  // Export full Pinokio ready JSON payload
  const exportPinokioJsonFromVision = () => {
    if (!analysisResult) return;
    const rec = analysisResult.recommendedSettings;

    const payload = {
      pinokio_target_app: targetEngine,
      source_module: "Pinokio AI Vision & Media Studio",
      timestamp: new Date().toISOString(),
      media_analyzed: {
        type: mediaType,
        filename: fileDetails?.name,
      },
      hardware_vram_target: selectedVram,
      prompts_generated: {
        wan2gp_prompt: analysisResult.wan2gpPrompt,
        wan2gp_negative: analysisResult.wan2gpNegativePrompt,
        ltx_prompt: analysisResult.ltxPrompt,
        ltx_negative: analysisResult.ltxNegativePrompt,
        hunyuan_prompt: analysisResult.hunyuanPrompt,
        cogvideo_prompt: analysisResult.cogvideoPrompt,
        comfyui_prompt: analysisResult.comfyuiPrompt,
      },
      sliders_and_settings: rec,
      pinokio_cli_launch: `pinokio run ${targetEngine === 'ltx_video' ? 'wan2gp' : targetEngine} --args "--lowvram --fp8 --attention sageattention --cpu-offload"`,
      execution_tips: analysisResult.pinokioExecutionTips
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pinokio-media-${targetEngine}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6 animate-fadeIn">
      
      {/* Hidden canvas for video frame extraction */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#10141e] via-[#0d1017] to-amber-950/30 p-6 md:p-8 border border-slate-800 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Studio Vision & Prompts IA : Images & Vidéos (Pinokio Multi-Outils)</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Analyse Multimodale & Générateur de Prompts Vidéo Pinokio
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Importez une <strong>image</strong> ou une <strong>vidéo</strong> : notre IA analyse les textures, l'éclairage cinématique, 
            les vecteurs de caméra et la dynamique temporelle pour générer automatiquement les prompts optimaux adaptés aux 
            <strong> meilleurs outils vidéo de Pinokio</strong> (Wan2GP #1, LTX-Video #2, HunyuanVideo #3, CogVideoX, ComfyUI, Maestro).
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>Profil GPU : <strong>{selectedVram} VRAM</strong></span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-indigo-300 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5" />
              <span>Supporte : PNG, JPG, WebP, MP4, WebM, MOV</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Controls on left (5 cols), Results on right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Media Uploader & Parameters */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Media Ingestion Box (Images & Videos) */}
          <div className="bg-[#0e1218] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                {mediaType === 'video' ? <Video className="w-4 h-4 text-indigo-400" /> : <ImageIcon className="w-4 h-4 text-amber-400" />}
                <span>Média Source : {mediaType.toUpperCase()}</span>
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">Glisser-déposer actif</span>
            </div>

            {/* Drop / Preview Area */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-2xl overflow-hidden border-2 transition-all aspect-video flex items-center justify-center bg-black/90 ${
                isDragging 
                  ? 'border-amber-400 bg-amber-500/10 scale-[1.01]' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {selectedMediaUrl ? (
                <>
                  {mediaType === 'video' ? (
                    <div className="relative w-full h-full flex flex-col justify-center items-center">
                      <video
                        ref={videoRef}
                        src={selectedMediaUrl}
                        className="w-full h-full object-contain"
                        onTimeUpdate={() => {
                          if (videoRef.current) {
                            setVideoCurrentTime(videoRef.current.currentTime);
                          }
                        }}
                        onLoadedMetadata={() => {
                          if (videoRef.current) {
                            setVideoDuration(videoRef.current.duration);
                            captureFrameFromVideo();
                          }
                        }}
                        controls={false}
                        loop
                        muted
                      />

                      {/* Video Controls Overlay */}
                      <div className="absolute bottom-2 inset-x-2 p-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => {
                            if (!videoRef.current) return;
                            if (isPlayingVideo) {
                              videoRef.current.pause();
                              setIsPlayingVideo(false);
                            } else {
                              videoRef.current.play();
                              setIsPlayingVideo(true);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold"
                        >
                          {isPlayingVideo ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>

                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max={videoDuration || 10}
                            step="0.1"
                            value={videoCurrentTime}
                            onChange={(e) => {
                              const t = parseFloat(e.target.value);
                              setVideoCurrentTime(t);
                              if (videoRef.current) videoRef.current.currentTime = t;
                            }}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                          />
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {videoCurrentTime.toFixed(1)}s / {videoDuration.toFixed(1)}s
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={captureFrameFromVideo}
                          className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 shrink-0"
                          title="Capturer cette frame pour l'analyse IA"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Frame Clé</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={selectedMediaUrl}
                      alt="Source preview"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Change Media Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
                    <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xl transition-transform active:scale-95">
                      <Upload className="w-4 h-4" />
                      <span>Remplacer le média (Image/Vidéo)</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleFileInputChange}
                      />
                    </label>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center p-6 text-center w-full h-full hover:bg-slate-900/40 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="text-xs font-bold text-white">Importer une Image ou une Vidéo</span>
                  <span className="text-[11px] text-slate-400 mt-1">Glissez-déposez MP4, WebM, MOV, PNG, JPG ou WebP</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                </label>
              )}
            </div>

            {/* Media Metadata Badge */}
            {fileDetails && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-white font-medium truncate">{fileDetails.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300">{fileDetails.sizeKb} KB</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase">{mediaType}</span>
                </div>
              </div>
            )}

            {/* Presets Gallery */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Ou essayez un preset cinématique :
              </label>
              <div className="grid grid-cols-4 gap-2">
                {SAMPLE_PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setMediaType('image');
                      setSelectedMediaUrl(preset.imageUrl);
                      setCapturedFrameUrl(preset.imageUrl);
                      setUserGoal(preset.sampleGoal);
                      setFileDetails({
                        name: `${preset.id}.jpg`,
                        sizeKb: 420,
                        mimeType: 'image/jpeg',
                      });
                      setAnalysisResult(null);
                      setErrorMessage(null);
                    }}
                    className={`relative rounded-xl overflow-hidden border aspect-square transition-all ${
                      selectedMediaUrl === preset.imageUrl
                        ? 'border-amber-400 ring-2 ring-amber-400/40 scale-95'
                        : 'border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'
                    }`}
                    title={`${preset.title} - ${preset.subtitle}`}
                  >
                    <img
                      src={preset.imageUrl}
                      alt={preset.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Target Engine & Motion Instructions */}
          <div className="bg-[#0e1218] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            
            {/* Target Pinokio Engine Selector (Ranked by check-ins) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider block flex items-center justify-between">
                <span>Outil Vidéo Pinokio Cible</span>
                <span className="text-[10px] text-amber-400 font-mono">Classé par popularité</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TOP_PINOKIO_VIDEO_TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setTargetEngine(tool.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      targetEngine === tool.id
                        ? 'bg-gradient-to-br from-indigo-950/60 to-slate-900 border-amber-400 shadow-md ring-1 ring-amber-400/30'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold text-white ${tool.iconColor}`}>
                        {tool.name}
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        #{tool.checkInRank}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 line-clamp-1">
                      {tool.badge}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Motion & Camera Direction Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white uppercase tracking-wider block flex items-center justify-between">
                <span>Intention de Mouvement & Scène</span>
                <span className="text-[10px] text-slate-500 font-mono">Facultatif</span>
              </label>
              
              <textarea
                value={userGoal}
                onChange={(e) => setUserGoal(e.target.value)}
                placeholder="Ex: Travelling avant lent et majestueux, reflets de néons sous la pluie, fumée volumétrique et flou d'arrière-plan à 24fps..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
              />

              {/* Quick Keywords Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'Travelling avant cinématique',
                  'Macro lente 24fps',
                  'Éclairage néon rasant',
                  'Dynamique de fluide & reflets',
                  'Zoom orbital 360°'
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setUserGoal(prev => prev ? `${prev}, ${chip}` : chip)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-slate-300 hover:text-white border border-slate-800 transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !selectedMediaUrl}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Analyse {mediaType.toUpperCase()} & Prompting en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Générer les Prompts pour {TOP_PINOKIO_VIDEO_TOOLS.find(t => t.id === targetEngine)?.name}</span>
                </>
              )}
            </button>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

          </div>

        </div>

        {/* Right Column: AI Generated Multi-Tool Prompts & Visual Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          
          {analysisResult ? (
            <div className="bg-[#0e1218] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-fadeIn">
              
              {/* Header result bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                    <Sparkles className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Prompts & Paramètres Générés</span>
                      <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-[10px] font-mono font-bold">
                        {analysisResult.mediaType?.toUpperCase() || 'MÉDIA'} ANALYSÉ
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Optimisé pour <strong>{TOP_PINOKIO_VIDEO_TOOLS.find(t => t.id === targetEngine)?.name}</strong> sur GPU <strong>{selectedVram} VRAM</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={applyToConfigurator}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    {appliedSuccess ? <Check className="w-4 h-4 text-slate-950" /> : <Sliders className="w-4 h-4 text-slate-950" />}
                    <span>{appliedSuccess ? 'Appliqué !' : 'Injecter dans Wan2GP'}</span>
                  </button>

                  <button
                    onClick={exportPinokioJsonFromVision}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs border border-slate-700"
                    title="Exporter le JSON Pinokio complet"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sub-Tabs for Result Inspection */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setActivePromptTab('primary')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activePromptTab === 'primary' 
                      ? 'bg-amber-400 text-slate-950 shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  Prompt Cible ({targetEngine.toUpperCase()})
                </button>

                <button
                  onClick={() => setActivePromptTab('all_tools')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activePromptTab === 'all_tools' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  Tous les Outils Pinokio
                </button>

                <button
                  onClick={() => setActivePromptTab('motion')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activePromptTab === 'motion' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  Décomposition Visuelle & Caméra
                </button>

                <button
                  onClick={() => setActivePromptTab('settings')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activePromptTab === 'settings' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  Curseurs & CLI
                </button>
              </div>

              {/* TAB 1: Primary Target Engine Prompt */}
              {activePromptTab === 'primary' && (
                <div className="space-y-4">
                  {/* Positive Prompt */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>Prompt Positif Recommandé :</span>
                      </span>

                      <button
                        onClick={() => copyToClipboard(
                          targetEngine === 'ltx_video' ? analysisResult.ltxPrompt : (targetEngine === 'hunyuan_video' && analysisResult.hunyuanPrompt ? analysisResult.hunyuanPrompt : analysisResult.wan2gpPrompt),
                          'pos'
                        )}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                      >
                        {copiedField === 'pos' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copier</span>
                      </button>
                    </div>

                    <p className="text-xs font-mono text-slate-200 leading-relaxed bg-black/50 p-3 rounded-xl border border-slate-800">
                      {targetEngine === 'ltx_video' 
                        ? analysisResult.ltxPrompt 
                        : (targetEngine === 'hunyuan_video' && analysisResult.hunyuanPrompt ? analysisResult.hunyuanPrompt : analysisResult.wan2gpPrompt)
                      }
                    </p>
                  </div>

                  {/* Negative Prompt */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        <span>Prompt Négatif Anti-Artefacts :</span>
                      </span>

                      <button
                        onClick={() => copyToClipboard(
                          targetEngine === 'ltx_video' ? analysisResult.ltxNegativePrompt : (targetEngine === 'hunyuan_video' && analysisResult.hunyuanNegativePrompt ? analysisResult.hunyuanNegativePrompt : analysisResult.wan2gpNegativePrompt),
                          'neg'
                        )}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                      >
                        {copiedField === 'neg' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copier</span>
                      </button>
                    </div>

                    <p className="text-xs font-mono text-slate-300 leading-relaxed bg-black/50 p-3 rounded-xl border border-slate-800">
                      {targetEngine === 'ltx_video' 
                        ? analysisResult.ltxNegativePrompt 
                        : (targetEngine === 'hunyuan_video' && analysisResult.hunyuanNegativePrompt ? analysisResult.hunyuanNegativePrompt : analysisResult.wan2gpNegativePrompt)
                      }
                    </p>
                  </div>

                  {/* Pinokio Execution Tips */}
                  <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-1">
                    <span className="text-indigo-300 font-bold flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Conseils d'exécution Pinokio ({selectedVram} VRAM) :</span>
                    </span>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                      {analysisResult.pinokioExecutionTips}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: Multi-Tool Prompts for Pinokio Ecosystem */}
              {activePromptTab === 'all_tools' && (
                <div className="space-y-4">
                  {/* Wan2GP */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                        <Flame className="w-4 h-4" />
                        <span>Wan2GP (Wan 2.1 14B / 1.3B) — #1 Check-ins</span>
                      </span>
                      <button
                        onClick={() => copyToClipboard(analysisResult.wan2gpPrompt, 'wan')}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                      >
                        {copiedField === 'wan' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copier</span>
                      </button>
                    </div>
                    <p className="text-xs font-mono text-slate-200 bg-black/50 p-2.5 rounded-xl border border-slate-800">
                      {analysisResult.wan2gpPrompt}
                    </p>
                  </div>

                  {/* LTX-Video */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span>LTX-Video 0.9.5 / LTX Director — Ultra Rapide</span>
                      </span>
                      <button
                        onClick={() => copyToClipboard(analysisResult.ltxPrompt, 'ltx')}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                      >
                        {copiedField === 'ltx' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copier</span>
                      </button>
                    </div>
                    <p className="text-xs font-mono text-slate-200 bg-black/50 p-2.5 rounded-xl border border-slate-800">
                      {analysisResult.ltxPrompt}
                    </p>
                  </div>

                  {/* HunyuanVideo */}
                  {analysisResult.hunyuanPrompt && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-400 flex items-center gap-2">
                          <Film className="w-4 h-4" />
                          <span>HunyuanVideo (Tencent 720p)</span>
                        </span>
                        <button
                          onClick={() => copyToClipboard(analysisResult.hunyuanPrompt || '', 'hun')}
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                        >
                          {copiedField === 'hun' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Copier</span>
                        </button>
                      </div>
                      <p className="text-xs font-mono text-slate-200 bg-black/50 p-2.5 rounded-xl border border-slate-800">
                        {analysisResult.hunyuanPrompt}
                      </p>
                    </div>
                  )}

                  {/* Maestro Screenplay */}
                  {analysisResult.maestroScreenplay && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-pink-400 flex items-center gap-2">
                        <Sliders className="w-4 h-4" />
                        <span>Maestro Screenplay Breakdown (Plans de Réalisateur)</span>
                      </span>
                      <p className="text-xs font-mono text-slate-300 bg-black/50 p-2.5 rounded-xl border border-slate-800">
                        {analysisResult.maestroScreenplay}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Visual & Camera Motion Breakdown */}
              {activePromptTab === 'motion' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Analyse du Sujet & Textures</span>
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {analysisResult.subjectAnalysis}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5" />
                        <span>Éclairage & Colorimétrie</span>
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {analysisResult.environmentAndLighting}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Mouvement de Caméra Cinématographique Suggéré</span>
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {analysisResult.suggestedCameraMotion}
                    </p>
                  </div>

                  {analysisResult.videoMotionAnalysis && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-2">
                      <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider block">
                        Métriques de Flux Optique & Dynamique Temporelle
                      </span>
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                        <div className="p-2 rounded-xl bg-black/40">
                          <span className="text-slate-500 block text-[10px]">Vitesse caméra</span>
                          <strong className="text-white">{analysisResult.videoMotionAnalysis.cameraSpeed}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-black/40">
                          <span className="text-slate-500 block text-[10px]">Score dynamique</span>
                          <strong className="text-amber-400">{analysisResult.videoMotionAnalysis.dynamicScore} / 10</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-black/40">
                          <span className="text-slate-500 block text-[10px]">Pacing recommandé</span>
                          <strong className="text-emerald-400">{analysisResult.videoMotionAnalysis.pacing}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Recommended Sliders & Launch Command */}
              {activePromptTab === 'settings' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500">Résolution</span>
                      <div className="text-sm font-bold text-white">{analysisResult.recommendedSettings.resolution}</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500">Frames / Durée</span>
                      <div className="text-sm font-bold text-amber-400">{analysisResult.recommendedSettings.frames} frames ({analysisResult.recommendedSettings.fps} fps)</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500">CFG Guidance</span>
                      <div className="text-sm font-bold text-white">{analysisResult.recommendedSettings.cfgScale}</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500">Flow Shift</span>
                      <div className="text-sm font-bold text-indigo-300">{analysisResult.recommendedSettings.flowShift}</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500">Inference Steps</span>
                      <div className="text-sm font-bold text-white">{analysisResult.recommendedSettings.steps}</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500">Motion Strength</span>
                      <div className="text-sm font-bold text-white">{analysisResult.recommendedSettings.motionStrength}</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500">Quantization</span>
                      <div className="text-sm font-bold text-emerald-400">{analysisResult.recommendedSettings.precision}</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-500">CPU Offload</span>
                      <div className="text-sm font-bold text-white">{analysisResult.recommendedSettings.vramOffload}</div>
                    </div>
                  </div>

                  {/* CLI Launch Command */}
                  <div className="p-4 rounded-2xl bg-black/90 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono">Commande Pinokio CLI recommandée :</span>
                      <button
                        onClick={() => copyToClipboard(`pinokio run ${targetEngine === 'ltx_video' ? 'wan2gp' : targetEngine} --args "--lowvram --fp8 --attention sageattention --cpu-offload"`, 'cli')}
                        className="text-amber-400 hover:text-white flex items-center gap-1 font-mono"
                      >
                        {copiedField === 'cli' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copier</span>
                      </button>
                    </div>

                    <code className="text-xs font-mono text-green-400 block break-all">
                      pinokio run {targetEngine === 'ltx_video' ? 'wan2gp' : targetEngine} --args "--lowvram --fp8 --attention sageattention --cpu-offload"
                    </code>
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* Empty state when no analysis yet */
            <div className="bg-[#0e1218] border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <Film className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Prêt pour l'Analyse d'Image ou de Vidéo
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Importez n'importe quelle image ou extrait vidéo à gauche et cliquez sur "Générer les Prompts". 
                  L'IA extraira la composition, la vitesse de caméra et formulera les prompts exacts pour Wan2GP, LTX et les outils top-rated de Pinokio.
                </p>
              </div>

              {/* Badges of supported tools */}
              <div className="pt-4 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {TOP_PINOKIO_VIDEO_TOOLS.map((t) => (
                  <span key={t.id} className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
