export type HardwareVram = '6GB' | '8GB' | '12GB' | '16GB' | '24GB+' | 'Mac_Silicon';

export interface RecommendedSettings {
  model: string;
  resolution: string;
  aspectRatio: string;
  frames: number;
  fps: number;
  steps: number;
  cfgScale: number;
  flowShift: number;
  motionStrength: number;
  sampler: string;
  vramOffload: string;
  precision: string;
  imageDenoise: number;
}

export type VideoTargetEngine = 
  | 'wan2gp'          // #1 Most checked-in (Wan 2.1 14B/1.3B)
  | 'ltx_video'       // #2 Fastest DiT (Lightricks LTX-Video / Director)
  | 'hunyuan_video'   // #3 Tencent HunyuanVideo 720p/1080p
  | 'cogvideox'       // #4 THUDM CogVideoX 5B DiT
  | 'comfyui_video'   // #5 ComfyUI Video Workflows
  | 'maestro'         // #6 Maestro Local Studio Timeline
  | 'liveportrait'    // #7 LivePortrait Facial Animator
  | 'animatediff'     // #8 AnimateDiff SD1.5/SDXL Motion
  | 'svd';            // #9 Stable Video Diffusion

export interface AIAnalysisResult {
  mediaType?: 'image' | 'video';
  subjectAnalysis: string;
  environmentAndLighting: string;
  suggestedCameraMotion: string;
  motionDynamics: string;
  wan2gpPrompt: string;
  wan2gpNegativePrompt: string;
  ltxPrompt: string;
  ltxNegativePrompt: string;
  hunyuanPrompt?: string;
  hunyuanNegativePrompt?: string;
  cogvideoPrompt?: string;
  comfyuiPrompt?: string;
  maestroScreenplay?: string;
  videoMotionAnalysis?: {
    cameraSpeed: string;
    dynamicScore: number; // 1 to 10
    opticalFlowDirection: string;
    fpsDetected?: number;
    recommendedFPS: number;
    pacing: string;
  };
  topRatedToolsMatched?: {
    toolId: VideoTargetEngine;
    name: string;
    checkInRank: number;
    stars: string;
    badge: string;
    description: string;
  }[];
  recommendedSettings: RecommendedSettings;
  pinokioExecutionTips: string;
}

export interface Wan2GPSettings {
  model: 'wan2.1_14b_i2v_480p' | 'wan2.1_14b_i2v_720p' | 'wan2.1_1.3b_t2v' | 'ltx_video_0.9.5' | 'hunyuan_video' | 'maestro_director';
  mode: 'i2v' | 't2v' | 'v2v';
  vramProfile: HardwareVram;
  resolution: '832x480' | '480x832' | '1280x720' | '720x1280' | '624x624' | '960x544';
  aspectRatio: '16:9' | '9:16' | '1:1' | '21:9';
  frameCount: number;
  fps: number;
  steps: number;
  cfgScale: number;
  flowShift: number;
  motionStrength: number;
  sampler: 'FlowMatch Euler' | 'UniPC' | 'DPM++ 2M Karras' | 'Euler';
  vramOffload: 'Sequential CPU Offload' | 'Model CPU Offload' | 'None (Pure VRAM)';
  precision: 'FP8 (Optimized)' | 'GGUF Q4_K_M (Low VRAM)' | 'GGUF Q8_0' | 'BF16 (Full Quality)';
  attentionBackend: 'SageAttention' | 'FlashAttention-2' | 'SDPA' | 'xFormers';
  seed: number;
  imageDenoise: number;
  positivePrompt: string;
  negativePrompt: string;
  firstFrameImage?: string;
  lastFrameImage?: string;
}

export interface PinokioApp {
  id: string;
  name: string;
  author: string;
  version: string;
  description: string;
  tags: string[];
  category: 'video' | 'audio' | 'image' | 'coding' | '3d' | 'utility';
  repoUrl: string;
  minVram: string;
  recommendedGpu: string;
  featured?: boolean;
  supportedModels?: string[];
  keyMenus: {
    menuName: string;
    description: string;
    criticalSettings: string[];
  }[];
  launchCommand: string;
  argsFlag: string;
  troubleshootingTips: string[];
}

export interface ChatAttachment {
  name: string;
  type: 'image' | 'file';
  mimeType: string;
  dataUrl: string;
  size?: number;
}

export type AIProvider = 'gemini' | 'openrouter' | 'mistral';

export interface AIProviderModel {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
  badge: string;
  contextLength?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  provider?: AIProvider;
  modelUsed?: string;
  attachments?: ChatAttachment[];
  attachedSettings?: Partial<Wan2GPSettings>;
}

export interface SystemErrorLog {
  id: string;
  timestamp: string;
  source: 'client' | 'server' | 'pinokio' | 'ai_provider' | 'cuda';
  level: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  stack?: string;
  context?: {
    endpoint?: string;
    model?: string;
    provider?: string;
    gpuVram?: string;
    targetApp?: string;
    statusCode?: number;
    [key: string]: any;
  };
  resolved?: boolean;
}

// ============================================================================
// PHASE 5.X — KAI CINEMATIC EXPERIENCE ENGINE TYPES
// ============================================================================

export type KaiOrbState = 
  | 'idle'
  | 'listening'
  | 'planning'
  | 'generating'
  | 'coding'
  | 'testing'
  | 'fixing'
  | 'done';

export type CinematicCapability =
  | 'CINEMATIC_WEB_EXPERIENCE'
  | 'PRODUCT_STORYTELLING'
  | 'SCROLL_STORYTELLING'
  | 'PRODUCT_REVEAL'
  | 'PRODUCT_ASSEMBLY'
  | 'EXPLODED_VIEW'
  | 'IMMERSIVE_HERO'
  | 'CAMERA_CHOREOGRAPHY'
  | 'SCROLL_SCRUB_VIDEO'
  | 'IMAGE_SEQUENCE_SCROLL'
  | 'TRUE_3D_PRODUCT'
  | 'HYBRID_3D_VIDEO_DOM'
  | 'PARALLAX_DEPTH'
  | 'KINETIC_TYPOGRAPHY'
  | 'MATERIAL_REVEAL'
  | 'CINEMATIC_TRANSITIONS';

export type ExperienceStrategy =
  | 'TRUE_3D'
  | 'VIDEO_SCROLL'
  | 'IMAGE_SEQUENCE'
  | 'DOM_MOTION'
  | 'WEBGL_EFFECT'
  | 'HYBRID';

export type AssetClassificationStatus =
  | 'ASSET_USABLE'
  | 'ASSET_NEEDS_PROCESSING'
  | 'ASSET_MISSING'
  | 'ASSET_OPTIONAL';

export type ExecutionPolicy =
  | 'LOCAL_FIRST'
  | 'LOCAL_ONLY'
  | 'AUTO'
  | 'CLOUD_FIRST'
  | 'CLOUD_ONLY';

export type CostPolicy =
  | 'FREE'
  | 'ECO'
  | 'BALANCED'
  | 'MAX_QUALITY';

export type QualityGateStatus =
  | 'PASS'
  | 'WARNING'
  | 'FAIL'
  | 'NOT_TESTED';

export type RecipeFamily =
  | 'PRODUCT_GENESIS'
  | 'EXPLODED_PRODUCT'
  | 'CINEMATIC_LAUNCH'
  | 'IMMERSIVE_PORTFOLIO'
  | 'TECHNICAL_PRODUCT';

export interface ProductIdentity {
  name: string;
  category: string;
  shape: string;
  materials: string[];
  colors: string[];
  proportions: string;
  logoPlacement?: string;
  distinctiveFeatures: string[];
}

export interface NarrativeScene {
  id: string;
  order: number;
  name: string;
  scrollStart: number; // 0.0 - 1.0
  scrollEnd: number;   // 0.0 - 1.0
  headline: string;
  subhead: string;
  visualFocus: string;
  cameraChoreography: {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
    description: string;
  };
  lightingDescription: string;
  motionVectors: string;
  assemblyProgress: number; // 0 to 100%
  explodedDistance: number; // 0 to 1
  particleDensity?: number;
}

export interface CreativeBrief {
  id: string;
  clientGoal: string;
  targetProduct: ProductIdentity;
  recipeFamily: RecipeFamily;
  emotionalTone: 'luxury_craft' | 'hyper_tech' | 'minimal_pure' | 'raw_industrial' | 'editorial_elegance';
  visualPace: 'deliberate' | 'kinetic' | 'poetic' | 'explosive';
  targetAudience: string;
  keyMoments: string[];
}

export interface AssetPlanItem {
  id: string;
  name: string;
  type: '3d_model' | 'video_timeline' | 'image_sequence' | 'texture_pbr' | 'audio_stem' | 'vector_path';
  status: AssetClassificationStatus;
  sourceEngine?: 'WanGP' | 'LTX' | 'Three.js' | 'ComfyUI' | 'LocalWebGL' | 'BrowserSVG';
  fallbackStrategy?: string;
  estimatedWeightKb: number;
}

export interface PerformanceBudget {
  maxInitialJsKb: number;
  maxMediaWeightMb: number;
  max3dAssetWeightMb: number;
  maxTexturesWeightMb: number;
  maxWebGLContexts: number;
  targetFps: number;
  estimatedMemoryImpactMb: number;
}

export interface QualityGateCheck {
  id: string;
  name: string;
  category: 'build' | 'assets' | 'performance' | 'accessibility' | 'responsive' | 'motion' | 'narrative' | 'strategy';
  status: QualityGateStatus;
  message: string;
  metric?: string;
}

export interface ExperienceManifest {
  experienceId: string;
  title: string;
  version: string;
  strategy: ExperienceStrategy;
  subCapabilities: CinematicCapability[];
  brief: CreativeBrief;
  scenes: NarrativeScene[];
  assetPlan: AssetPlanItem[];
  performanceBudget: PerformanceBudget;
  breakpoints: {
    mobileMaxPx: number;
    tabletMaxPx: number;
    desktopMinPx: number;
  };
  fallbacks: {
    mobileStrategy: ExperienceStrategy;
    reducedMotionStrategy: ExperienceStrategy;
    offlineMediaFallback: string;
  };
  localMediaDependencies: {
    engine: string;
    registered: boolean;
    available: boolean;
  }[];
  externalDependencies: string[];
  qualityGateChecks: QualityGateCheck[];
  overallQualityStatus: QualityGateStatus;
  revisionId: string;
  createdAt: string;
}

export interface VisualInspectorElement {
  id: string;
  name: string;
  type: 'scene' | 'part' | 'camera' | 'light' | 'typography' | 'timeline';
  sceneId?: string;
  properties: {
    label: string;
    value: string | number;
    unit?: string;
    editable: boolean;
  }[];
}


// ============================================================================
// LORA TRAINING STUDIO — TYPES
// ============================================================================

export type LoraBaseModelId =
  | 'wan2.1_14b'     // Wan 2.1 / 2.2 14B (vidéo, musubi-tuner)
  | 'wan2.1_1.3b'    // Wan 2.1 1.3B (vidéo, GPU pauvres)
  | 'flux1_dev'      // FLUX.1 dev (image, ai-toolkit)
  | 'sdxl'           // SDXL base 1.0 (image, kohya-ss)
  | 'zimage_turbo'   // Z-Image Turbo (image, guaardvark / peft)
  | 'ltx_video';     // LTX-Video 0.9.x (vidéo, ltx-trainer)

export type LoraTrainFramework =
  | 'musubi'
  | 'kohya'
  | 'ai-toolkit'
  | 'ltx-trainer'
  | 'guaardvark';

export type LoraPrecision = 'bf16' | 'fp16' | 'fp32';
export type LoraOptimizer = 'adamw8bit' | 'adamw' | 'adafactor' | 'prodigy';
export type LoraCaptionStyle = 'trigger_class' | 'trigger_only' | 'natural_language';
export type LoraDatasetSource = 'photos' | 'renders' | 'mixed' | 'video_frames';

export interface LoraTrainingSettings {
  resolution: number;
  rank: number;
  alpha: number;
  learningRate: number;
  steps: number;
  batchSize: number;
  gradientAccumulation: number;
  precision: LoraPrecision;
  optimizer: LoraOptimizer;
  gradientCheckpointing: boolean;
  cacheLatents: boolean;
  blocksToSwap: number;
  seed: number;
}

export interface LoraDatasetConfig {
  path: string;
  imageCount: number;
  triggerWord: string;
  classToken: string;
  captionStyle: LoraCaptionStyle;
  source: LoraDatasetSource;
  regularisationImages: number;
}

export interface LoraPlanRequest {
  baseModel: LoraBaseModelId;
  hardware: HardwareVram;
  outputName: string;
  subjectId?: number;
  settings: LoraTrainingSettings;
  dataset: LoraDatasetConfig;
}

export type LoraIssueLevel = 'error' | 'warning' | 'tip';

export interface LoraPlanIssue {
  level: LoraIssueLevel;
  code: string;
  message: string;
  /** Suggestion la plus utile à appliquer, quand il y en a une. */
  fix?: string;
}

export interface LoraPlanEstimate {
  vramMb: number;
  vramAvailableMb: number;
  vramFit: 'fits' | 'tight' | 'exceeds';
  minutes: number;
  totalSteps: number;
  optimizerSteps: number;
  epochs: number;
  datasetMb: number;
  loraMb: number;
}

export interface LoraArtifact {
  id: string;
  filename: string;
  language: 'bash' | 'json' | 'toml' | 'yaml' | 'markdown' | 'python';
  purpose: string;
  content: string;
}

export interface LoraGuaardvarkBinding {
  baseModelId: 'zimage-turbo' | 'flux-dev' | 'sdxl-legacy';
  trainReady: boolean;
  note: string;
  payload: Record<string, unknown>;
  curl: string;
}

export interface LoraPlan {
  baseModel: LoraBaseModelId;
  baseModelLabel: string;
  framework: LoraTrainFramework;
  frameworkLabel: string;
  hardware: HardwareVram;
  outputName: string;
  subjectId?: number;
  settings: LoraTrainingSettings;
  recommended: LoraTrainingSettings;
  dataset: LoraDatasetConfig;
  estimate: LoraPlanEstimate;
  issues: LoraPlanIssue[];
  artifacts: LoraArtifact[];
  guaardvark: LoraGuaardvarkBinding;
  createdAt: string;
}

export interface LoraGuaardvarkHealth {
  reachable: boolean;
  baseUrl: string;
  version?: string;
  hardware?: Record<string, unknown>;
  trainingLibraries?: Record<string, unknown>;
  error?: string;
  checkedAt: string;
}

export interface LoraRemoteJob {
  subjectId: number;
  status: string;
  error?: string | null;
  baseModelId?: string;
  loraPath?: string | null;
  raw?: Record<string, unknown>;
}
