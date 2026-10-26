/**
 * LoRA TRAINING PLAN BUILDER
 * ==========================================================================
 * Cœur de calcul du LoRA Studio : un module pur (aucune dépendance réseau, ni
 * navigateur, ni Node) importé à la fois par l'UI React et par server.ts.
 *
 * Il répond à une seule question : « pour CE modèle de base, CE dataset et CE
 * GPU, quels hyperparamètres sont raisonnables, combien de VRAM/temps cela
 * coûte, et quels fichiers faut-il lancer ? »
 *
 * Les chiffres de VRAM et de vitesse sont des ordres de grandeur assumés
 * (mesures communautaires Wan/FLUX/SDXL/LTX + budget déclaré par guaardvark
 * pour Z-Image) : ils servent à empêcher une config impossible, pas à prédire
 * la seconde près.
 */
import type {
  HardwareVram,
  LoraArtifact,
  LoraBaseModelId,
  LoraDatasetConfig,
  LoraGuaardvarkBinding,
  LoraPlan,
  LoraPlanEstimate,
  LoraPlanIssue,
  LoraPlanRequest,
  LoraTrainFramework,
  LoraTrainingSettings,
  LoraWanGpTarget,
} from '../../types';

// ---------------------------------------------------------------------------
// Hardware
// ---------------------------------------------------------------------------

export const VRAM_GB: Record<HardwareVram, number> = {
  '6GB': 6,
  '8GB': 8,
  '12GB': 12,
  '16GB': 16,
  '24GB+': 24,
  Mac_Silicon: 32,
};

/** Facteur de vitesse par rapport à une carte 24 Go (4090/3090) sur la même archi. */
const HARDWARE_SPEED_FACTOR: Record<HardwareVram, number> = {
  '6GB': 2.6,
  '8GB': 2.1,
  '12GB': 1.6,
  '16GB': 1.3,
  '24GB+': 1.0,
  Mac_Silicon: 5.5,
};

const isMac = (hardware: HardwareVram) => hardware === 'Mac_Silicon';

// ---------------------------------------------------------------------------
// Presets par modèle de base
// ---------------------------------------------------------------------------

export interface LoraBaseModelPreset {
  id: LoraBaseModelId;
  label: string;
  shortLabel: string;
  family: 'video' | 'image';
  repoId: string;
  /** Nom exact du dépôt / fichier de poids, affiché dans les scripts. */
  weightsHint: string;
  framework: LoraTrainFramework;
  frameworkLabel: string;
  nativeResolution: number;
  resolutions: number[];
  rankOptions: number[];
  defaultRank: number;
  maxRank: number;
  stepsPerImage: number;
  minSteps: number;
  maxSteps: number;
  defaultClassToken: string;
  minVramGb: number;
  comfortableVramGb: number;
  /** VRAM observée à nativeResolution, rank 16, batch 1, gradient checkpointing ON. */
  vramBaseMb: number;
  /** Secondes par step à nativeResolution sur une carte 24 Go. */
  secondsPerStep: number;
  /** Secondes par step mesurées sur Apple Silicon (MPS), si connues. */
  secondsPerStepMps?: number;
  supportsBlocksToSwap: boolean;
  maxBlocksToSwap: number;
  /** ai-toolkit low_vram / layer offloading disponible (H3 surtout). */
  supportsLowVram?: boolean;
  /** Empreinte VRAM à nativeResolution quand l'offloading est actif. */
  vramLowMb?: number;
  /** Sous-dossier `loras/<key>` de WanGP ; absent si le modèle n'y existe pas. */
  wangpFolder?: string;
  /** Rang visé quand la carte est large (défaut : 32). H3 reste à 16. */
  bigGpuRank?: number;
  /** alpha = rank (défaut des recettes kohya / guaardvark / H3). */
  alphaEqualsRank?: boolean;
  guaardvarkBaseModelId: 'zimage-turbo' | 'flux-dev' | 'sdxl-legacy';
  guaardvarkTrainReady: boolean;
  docsUrl: string;
  notes: string[];
}

export const LORA_BASE_MODELS: Record<LoraBaseModelId, LoraBaseModelPreset> = {
  minimax_h3: {
    id: 'minimax_h3',
    label: 'MiniMax H3 FL2VA Pruned 20B',
    shortLabel: 'MiniMax H3',
    family: 'video',
    repoId: 'Comfy-Org/MiniMax-H3',
    weightsHint:
      'Comfy-Org/MiniMax-H3 · minimax_h3_fl2va_pruned_int8_convrot (20,97 Go) + Qwen3-VL-32B nvfp4 AWQ',
    framework: 'ai-toolkit',
    frameworkLabel: 'ai-toolkit · arch minimax_h3',
    nativeResolution: 512,
    resolutions: [384, 512, 768],
    rankOptions: [8, 16, 32],
    defaultRank: 16,
    maxRank: 32,
    stepsPerImage: 90,
    minSteps: 800,
    maxSteps: 3000,
    defaultClassToken: 'person',
    minVramGb: 12,
    comfortableVramGb: 24,
    vramBaseMb: 19000,
    vramLowMb: 10200,
    supportsLowVram: true,
    bigGpuRank: 16,
    alphaEqualsRank: true,
    secondsPerStep: 4.2,
    supportsBlocksToSwap: false,
    maxBlocksToSwap: 0,
    guaardvarkBaseModelId: 'flux-dev',
    guaardvarkTrainReady: false,
    wangpFolder: 'minimax_h3',
    docsUrl: 'https://ostris.com/docs/ai-toolkit/models/minimax-h3',
    notes: [
      'C’est le modèle que WanGP appelle « MiniMax H3 FL2VA Pruned 20B » : un LoRA entraîné ici se dépose dans loras/minimax_h3/.',
      'H3 est guidance-distilled : pas de CFG ni de negative prompt, et l’adaptateur de training ostris doit rester actif pendant l’entraînement (jamais fusionné).',
      'Les couches adaln_proj sont exclues (network_kwargs.ignore_if_contains) : ce sont elles que le checkpoint pruned a repliées dans adaln_t_table.',
      'Entraîné sur le build pruned : WanGP sait malgré tout relire un LoRA rank 8 ou rank 64 (traduction automatique via lora_affine).',
    ],
  },
  'wan2.1_14b': {
    id: 'wan2.1_14b',
    label: 'Wan 2.1 / 2.2 14B',
    shortLabel: 'Wan 14B',
    family: 'video',
    repoId: 'Wan-AI/Wan2.1-I2V-14B-480P',
    weightsHint: 'Wan-AI/Wan2.1-I2V-14B-480P (ou -T2V-14B)',
    framework: 'musubi',
    frameworkLabel: 'musubi-tuner (kohya fork)',
    nativeResolution: 480,
    resolutions: [480, 576, 720],
    rankOptions: [8, 16, 32, 64],
    defaultRank: 32,
    maxRank: 64,
    stepsPerImage: 100,
    minSteps: 600,
    maxSteps: 3000,
    defaultClassToken: 'person',
    minVramGb: 12,
    comfortableVramGb: 24,
    vramBaseMb: 20000,
    secondsPerStep: 1.9,
    supportsBlocksToSwap: true,
    maxBlocksToSwap: 40,
    guaardvarkBaseModelId: 'flux-dev',
    guaardvarkTrainReady: false,
    wangpFolder: 'wan_i2v',
    docsUrl: 'https://github.com/kohya-ss/musubi-tuner',
    notes: [
      'Le LoRA vidéo Wan 14B se pilote en 480p : au-delà, la VRAM explose pour un gain visuel faible.',
      'musubi-tuner accepte --blocks_to_swap pour descendre sous 24 Go (plus lent, mais stable).',
      'Nommez le LoRA et gardez le même trigger word dans Wan2GP / LTX Director / ComfyUI.',
    ],
  },
  'wan2.1_1.3b': {
    id: 'wan2.1_1.3b',
    label: 'Wan 2.1 1.3B',
    shortLabel: 'Wan 1.3B',
    family: 'video',
    repoId: 'Wan-AI/Wan2.1-T2V-1.3B',
    weightsHint: 'Wan-AI/Wan2.1-T2V-1.3B',
    framework: 'musubi',
    frameworkLabel: 'musubi-tuner (kohya fork)',
    nativeResolution: 480,
    resolutions: [480, 576, 720],
    rankOptions: [8, 16, 32],
    defaultRank: 16,
    maxRank: 32,
    stepsPerImage: 100,
    minSteps: 500,
    maxSteps: 2500,
    defaultClassToken: 'person',
    minVramGb: 8,
    comfortableVramGb: 12,
    vramBaseMb: 9000,
    secondsPerStep: 0.45,
    supportsBlocksToSwap: true,
    maxBlocksToSwap: 20,
    guaardvarkBaseModelId: 'flux-dev',
    guaardvarkTrainReady: false,
    wangpFolder: 'wan_1.3B',
    docsUrl: 'https://github.com/kohya-ss/musubi-tuner',
    notes: [
      'Le meilleur point d’entrée LoRA vidéo sur 8 Go : même recette que le 14B, 10× plus rapide.',
      'Idéal pour valider un dataset avant de dépenser des heures sur le 14B.',
    ],
  },
  flux1_dev: {
    id: 'flux1_dev',
    label: 'FLUX.1 dev',
    shortLabel: 'FLUX.1',
    family: 'image',
    repoId: 'black-forest-labs/FLUX.1-dev',
    weightsHint: 'black-forest-labs/FLUX.1-dev',
    framework: 'ai-toolkit',
    frameworkLabel: 'ai-toolkit (ostris)',
    nativeResolution: 1024,
    resolutions: [512, 768, 1024],
    rankOptions: [8, 16, 32, 64],
    defaultRank: 16,
    maxRank: 64,
    stepsPerImage: 90,
    minSteps: 800,
    maxSteps: 3000,
    defaultClassToken: 'person',
    minVramGb: 12,
    comfortableVramGb: 24,
    vramBaseMb: 17000,
    secondsPerStep: 1.2,
    supportsBlocksToSwap: false,
    maxBlocksToSwap: 0,
    guaardvarkBaseModelId: 'flux-dev',
    guaardvarkTrainReady: false,
    wangpFolder: 'flux',
    docsUrl: 'https://github.com/ostris/ai-toolkit',
    notes: [
      'FLUX se LoRA en 1024 : descendre à 512 donne des visages mous même avec 3000 steps.',
      'ai-toolkit quantize=true + adamw8bit est ce qui rend le 16 Go viable.',
      'Text encoder volontairement gelé : 4× moins de VRAM, qualité suffisante pour une identité.',
    ],
  },
  sdxl: {
    id: 'sdxl',
    label: 'SDXL 1.0',
    shortLabel: 'SDXL',
    family: 'image',
    repoId: 'stabilityai/stable-diffusion-xl-base-1.0',
    weightsHint: 'stabilityai/stable-diffusion-xl-base-1.0',
    framework: 'kohya',
    frameworkLabel: 'kohya-ss sd-scripts',
    nativeResolution: 1024,
    resolutions: [768, 1024],
    rankOptions: [8, 16, 32, 64],
    defaultRank: 16,
    maxRank: 64,
    stepsPerImage: 100,
    minSteps: 400,
    maxSteps: 2500,
    defaultClassToken: 'person',
    minVramGb: 10,
    comfortableVramGb: 16,
    vramBaseMb: 12500,
    secondsPerStep: 0.55,
    secondsPerStepMps: 2.5,
    supportsBlocksToSwap: false,
    maxBlocksToSwap: 0,
    guaardvarkBaseModelId: 'sdxl-legacy',
    guaardvarkTrainReady: true,
    docsUrl: 'https://github.com/kohya-ss/sd-scripts',
    notes: [
      'La recette historique de guaardvark : rank 16, alpha 16, lr 1e-4, 1024 px.',
      'Tous les LoRA SDXL existants restent compatibles, donc c’est le choix « zéro friction ».',
    ],
  },
  zimage_turbo: {
    id: 'zimage_turbo',
    label: 'Z-Image Turbo',
    shortLabel: 'Z-Image',
    family: 'image',
    repoId: 'Tongyi-MAI/Z-Image-Turbo',
    weightsHint: 'Tongyi-MAI/Z-Image-Turbo (via backend/venv guaardvark)',
    framework: 'guaardvark',
    frameworkLabel: 'guaardvark lora_trainer (PEFT)',
    nativeResolution: 512,
    resolutions: [512, 768, 1024],
    rankOptions: [8, 16, 32, 64],
    defaultRank: 16,
    maxRank: 64,
    stepsPerImage: 100,
    minSteps: 400,
    maxSteps: 1500,
    defaultClassToken: 'person',
    minVramGb: 12,
    comfortableVramGb: 16,
    vramBaseMb: 13000,
    secondsPerStep: 0.9,
    secondsPerStepMps: 11,
    supportsBlocksToSwap: false,
    maxBlocksToSwap: 0,
    guaardvarkBaseModelId: 'zimage-turbo',
    guaardvarkTrainReady: true,
    wangpFolder: 'z_image',
    docsUrl: 'https://github.com/guaardvark/guaardvark/tree/main/plugins/lora_trainer',
    notes: [
      'C’est le backend par défaut de guaardvark : 512 px est son réglage sûr pour 16 Go.',
      'Le sidecar JSON schema-v2 (base_model_id + lora_format) est écrit par guaardvark, pas par vous.',
      'Sur Apple Silicon, comptez ~11 s/step à 512 px (≈2 h pour 640 steps).',
    ],
  },
  ltx_video: {
    id: 'ltx_video',
    label: 'LTX-Video 0.9.x',
    shortLabel: 'LTX-Video',
    family: 'video',
    repoId: 'Lightricks/LTX-Video',
    weightsHint: 'Lightricks/LTX-Video',
    framework: 'ltx-trainer',
    frameworkLabel: 'ltx-trainer (Lightricks)',
    nativeResolution: 768,
    resolutions: [512, 768],
    rankOptions: [8, 16, 32, 64],
    defaultRank: 32,
    maxRank: 64,
    stepsPerImage: 110,
    minSteps: 600,
    maxSteps: 3000,
    defaultClassToken: 'person',
    minVramGb: 16,
    comfortableVramGb: 24,
    vramBaseMb: 15000,
    secondsPerStep: 0.7,
    supportsBlocksToSwap: false,
    maxBlocksToSwap: 0,
    guaardvarkBaseModelId: 'flux-dev',
    guaardvarkTrainReady: false,
    wangpFolder: 'ltxv',
    docsUrl: 'https://github.com/Lightricks/LTX-Video/tree/main/ltx-trainer',
    notes: [
      'LTX est un DiT rapide : un LoRA de style/mouvement converge en 600–900 steps.',
      'Pré-traitez le dataset (latents + captions) avant de lancer : ltx-trainer le fait en deux passes.',
    ],
  },
};

export const LORA_BASE_MODEL_ORDER: LoraBaseModelId[] = [
  'minimax_h3',
  'wan2.1_14b',
  'wan2.1_1.3b',
  'flux1_dev',
  'sdxl',
  'zimage_turbo',
  'ltx_video',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

const safeInt = (value: unknown, fallback: number) => {
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? Math.round(n as number) : fallback;
};

const safeFloat = (value: unknown, fallback: number) => {
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? (n as number) : fallback;
};

export const formatDuration = (minutes: number): string => {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (hours < 24) return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
  return `${Math.floor(hours / 24)} j ${hours % 24} h`;
};

export const formatVram = (mb: number): string =>
  mb >= 1024 ? `${(mb / 1024).toFixed(1)} Go` : `${Math.round(mb)} Mo`;

const slug = (value: string) =>
  (value || 'pinokio_lora')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'pinokio_lora';

// ---------------------------------------------------------------------------
// Estimation VRAM / temps
// ---------------------------------------------------------------------------

interface VramInput {
  resolution: number;
  rank: number;
  batchSize: number;
  precision: LoraTrainingSettings['precision'];
  gradientCheckpointing: boolean;
  blocksToSwap: number;
  lowVram?: boolean;
}

export function estimateVramMb(preset: LoraBaseModelPreset, input: VramInput): number {
  const resScale = (input.resolution / preset.nativeResolution) ** 2;
  const rankScale = 0.9 + (input.rank / 32) * 0.25;
  const batchScale = 0.55 + 0.45 * Math.max(1, input.batchSize);
  const precisionScale = input.precision === 'fp32' ? 1.45 : input.precision === 'fp16' ? 0.92 : 1;
  const gcScale = input.gradientCheckpointing ? 0.85 : 1.05;
  const swapScale = preset.supportsBlocksToSwap && input.blocksToSwap > 0
    ? Math.max(0.5, 1 - input.blocksToSwap * 0.035)
    : 1;
  // ai-toolkit low_vram / layer offloading : le transformer sort de la VRAM
  // couche par couche (plus lent, mais c'est ce qui fait tenir H3 sur 12 Go).
  const lowVramScale = input.lowVram && preset.vramLowMb ? preset.vramLowMb / preset.vramBaseMb : 1;
  return Math.round(
    preset.vramBaseMb * resScale * rankScale * batchScale * precisionScale * gcScale * swapScale * lowVramScale
  );
}

export function estimateStepSeconds(
  preset: LoraBaseModelPreset,
  input: { resolution: number; rank: number; hardware: HardwareVram }
): number {
  const resScale = (input.resolution / preset.nativeResolution) ** 2;
  const rankScale = (input.rank / 16) ** 0.25;
  if (isMac(input.hardware) && preset.secondsPerStepMps) {
    return preset.secondsPerStepMps * resScale * rankScale;
  }
  return preset.secondsPerStep * resScale * rankScale * HARDWARE_SPEED_FACTOR[input.hardware];
}

// ---------------------------------------------------------------------------
// Recommandation auto
// ---------------------------------------------------------------------------

export function recommendSettings(
  preset: LoraBaseModelPreset,
  hardware: HardwareVram,
  imageCount: number
): LoraTrainingSettings {
  const vramGb = VRAM_GB[hardware];
  const available = vramGb * 1024;
  const budget = available * 0.85;

  const gradientCheckpointing = vramGb <= preset.comfortableVramGb || isMac(hardware);
  const precision: LoraTrainingSettings['precision'] = 'bf16';
  const lowVram = Boolean(preset.supportsLowVram) && vramGb < preset.comfortableVramGb;

  // Rang : on garde le rang de référence sur les grosses cartes, on le divise
  // sur les petites (un rang élevé coûte de la VRAM sans aider si le dataset
  // est petit).
  const rank = clamp(
    vramGb >= 24
      ? Math.max(preset.defaultRank, preset.bigGpuRank ?? 32)
      : vramGb >= 12
      ? preset.defaultRank
      : Math.max(8, Math.round(preset.defaultRank / 2)),
    8,
    preset.maxRank
  );
  // guaardvark (Z-Image/SDXL) entraîne en alpha = rank ; les recettes vidéo et
  // FLUX utilisent alpha = rank/2, plus stable à l'échelle d'application.
  const alpha =
    preset.alphaEqualsRank || preset.framework === 'kohya' || preset.framework === 'guaardvark'
      ? rank
      : Math.max(8, Math.round(rank / 2));

  // Blocks to swap : soupape de VRAM du 14B Wan. On part du déficit théorique,
  // puis la boucle d'ajustement ci-dessous monte si nécessaire.
  const baseBlocks = preset.supportsBlocksToSwap
    ? clamp(Math.ceil(Math.max(0, preset.comfortableVramGb - vramGb) * 2), 0, preset.maxBlocksToSwap)
    : 0;

  /**
   * Trouve le couple (résolution, blocks_to_swap) le plus généreux qui tient
   * réellement dans le budget, en partant de la plus haute résolution et du
   * plus petit swap. Une recommandation « auto » ne doit jamais dépasser la
   * VRAM disponible : c'est tout l'intérêt du calcul.
   */
  const resolutionsDesc = [...preset.resolutions].sort((a, b) => b - a);
  const swapStep = preset.maxBlocksToSwap > 0 ? Math.max(1, Math.ceil(preset.maxBlocksToSwap / 20)) : 1;
  let resolution = resolutionsDesc[resolutionsDesc.length - 1];
  let blocksToSwap = baseBlocks;

  // Swap croissant en boucle externe, résolution décroissante en interne : à
  // swap égal on préfère la plus grande image, mais on n'ajoute jamais de swap
  // pour gagner des pixels (le swap coûte du temps à chaque step).
  outer: for (let swap = baseBlocks; swap <= preset.maxBlocksToSwap; swap += swapStep) {
    for (const candidate of resolutionsDesc) {
      const mb = estimateVramMb(preset, {
        resolution: candidate,
        rank,
        batchSize: 1,
        precision,
        gradientCheckpointing,
        blocksToSwap: swap,
        lowVram,
      });
      if (mb <= budget) {
        resolution = candidate;
        blocksToSwap = swap;
        break outer;
      }
    }
  }

  const steps = clamp(
    Math.round((Math.max(1, imageCount) * preset.stepsPerImage) / 10) * 10,
    preset.minSteps,
    preset.maxSteps
  );

  return {
    resolution,
    rank,
    alpha,
    learningRate: 1e-4,
    steps,
    batchSize: 1,
    gradientAccumulation: vramGb <= 8 ? 4 : 2,
    precision,
    optimizer: 'adamw8bit',
    gradientCheckpointing,
    cacheLatents: !isMac(hardware) || preset.framework !== 'musubi',
    blocksToSwap,
    lowVram,
    seed: 42,
  };
}

// ---------------------------------------------------------------------------
// Normalisation de la requête (client & serveur)
// ---------------------------------------------------------------------------

export const DEFAULT_DATASET: LoraDatasetConfig = {
  path: '~/pinokio/app/datasets/mon-sujet',
  imageCount: 16,
  triggerWord: 'pinokio_subject',
  classToken: 'person',
  captionStyle: 'trigger_class',
  source: 'photos',
  regularisationImages: 0,
};

export function defaultLoraRequest(hardware: HardwareVram = '8GB'): LoraPlanRequest {
  // MiniMax H3 par défaut : c'est la base que WanGP sert le plus (FL2VA Pruned 20B),
  // donc celle où un LoRA d'identité atterrit directement dans « Advanced > Loras ».
  const preset = LORA_BASE_MODELS['minimax_h3'];
  const dataset: LoraDatasetConfig = { ...DEFAULT_DATASET };
  return {
    baseModel: preset.id,
    hardware,
    outputName: 'pinokio_lora_v1',
    subjectId: undefined,
    dataset,
    settings: recommendSettings(preset, hardware, dataset.imageCount),
  };
}

/**
 * Convertit n'importe quel corps de requête (UI, curl, appel externe) en une
 * LoraPlanRequest complète et bornée : jamais de valeurs NaN/absurdes ne
 * doivent atteindre un script shell.
 */
export function normalizeLoraRequest(raw: any): LoraPlanRequest {
  const hardware: HardwareVram = Object.keys(VRAM_GB).includes(raw?.hardware)
    ? (raw.hardware as HardwareVram)
    : '8GB';
  const baseModel: LoraBaseModelId = raw?.baseModel && LORA_BASE_MODELS[raw.baseModel as LoraBaseModelId]
    ? (raw.baseModel as LoraBaseModelId)
    : 'minimax_h3';
  const preset = LORA_BASE_MODELS[baseModel];

  const dataset: LoraDatasetConfig = {
    path: typeof raw?.dataset?.path === 'string' && raw.dataset.path.trim() ? raw.dataset.path.trim() : DEFAULT_DATASET.path,
    imageCount: clamp(safeInt(raw?.dataset?.imageCount, DEFAULT_DATASET.imageCount), 1, 500),
    triggerWord:
      typeof raw?.dataset?.triggerWord === 'string' && raw.dataset.triggerWord.trim()
        ? raw.dataset.triggerWord.trim().slice(0, 40)
        : DEFAULT_DATASET.triggerWord,
    classToken:
      typeof raw?.dataset?.classToken === 'string' && raw.dataset.classToken.trim()
        ? raw.dataset.classToken.trim().slice(0, 40)
        : preset.defaultClassToken,
    captionStyle: ['trigger_class', 'trigger_only', 'natural_language'].includes(raw?.dataset?.captionStyle)
      ? raw.dataset.captionStyle
      : DEFAULT_DATASET.captionStyle,
    source: ['photos', 'renders', 'mixed', 'video_frames'].includes(raw?.dataset?.source)
      ? raw.dataset.source
      : DEFAULT_DATASET.source,
    regularisationImages: clamp(safeInt(raw?.dataset?.regularisationImages, 0), 0, 200),
  };

  const recommended = recommendSettings(preset, hardware, dataset.imageCount);
  const incoming = raw?.settings || {};

  const settings: LoraTrainingSettings = {
    resolution: clamp(
      roundTo(safeInt(incoming.resolution, recommended.resolution), 64),
      Math.min(...preset.resolutions),
      Math.max(...preset.resolutions)
    ),
    rank: clamp(safeInt(incoming.rank, recommended.rank), 4, preset.maxRank),
    alpha: clamp(safeInt(incoming.alpha, incoming.rank ? safeInt(incoming.rank, recommended.alpha) : recommended.alpha), 1, 128),
    learningRate: clamp(safeFloat(incoming.learningRate, recommended.learningRate), 1e-6, 5e-3),
    steps: clamp(safeInt(incoming.steps, recommended.steps), 50, 20000),
    batchSize: clamp(safeInt(incoming.batchSize, recommended.batchSize), 1, 8),
    gradientAccumulation: clamp(safeInt(incoming.gradientAccumulation, recommended.gradientAccumulation), 1, 64),
    precision: ['bf16', 'fp16', 'fp32'].includes(incoming.precision) ? incoming.precision : recommended.precision,
    optimizer: ['adamw8bit', 'adamw', 'adafactor', 'prodigy'].includes(incoming.optimizer)
      ? incoming.optimizer
      : recommended.optimizer,
    gradientCheckpointing:
      typeof incoming.gradientCheckpointing === 'boolean'
        ? incoming.gradientCheckpointing
        : recommended.gradientCheckpointing,
    cacheLatents: typeof incoming.cacheLatents === 'boolean' ? incoming.cacheLatents : recommended.cacheLatents,
    blocksToSwap: preset.supportsBlocksToSwap
      ? clamp(safeInt(incoming.blocksToSwap, recommended.blocksToSwap), 0, preset.maxBlocksToSwap)
      : 0,
    lowVram: preset.supportsLowVram
      ? typeof incoming.lowVram === 'boolean'
        ? incoming.lowVram
        : recommended.lowVram
      : false,
    seed: clamp(safeInt(incoming.seed, 42), 0, 2 ** 31 - 1),
  };

  const subjectIdRaw = safeInt(raw?.subjectId, 0);

  return {
    baseModel,
    hardware,
    outputName: slug(typeof raw?.outputName === 'string' ? raw.outputName : 'pinokio_lora_v1'),
    subjectId: subjectIdRaw > 0 ? subjectIdRaw : undefined,
    settings,
    dataset,
  };
}

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

function buildIssues(
  preset: LoraBaseModelPreset,
  request: LoraPlanRequest,
  estimate: LoraPlanEstimate
): LoraPlanIssue[] {
  const issues: LoraPlanIssue[] = [];
  const { settings, dataset, hardware } = request;
  const vramGb = VRAM_GB[hardware];

  const cudaOnly = preset.framework === 'musubi' || preset.framework === 'ltx-trainer';
  if (isMac(hardware) && cudaOnly) {
    issues.push({
      level: 'error',
      code: 'MPS_UNSUPPORTED',
      message: `${preset.frameworkLabel} ne tourne pas sur Metal/MPS : il exige CUDA.`,
      fix: 'Sur Mac, entraînez un LoRA Z-Image Turbo ou SDXL via guaardvark, ou passez sur une machine NVIDIA.',
    });
  } else if (isMac(hardware) && preset.framework === 'ai-toolkit') {
    issues.push({
      level: 'warning',
      code: 'MPS_UNSUPPORTED_AI_TOOLKIT',
      message: 'ai-toolkit est développé pour CUDA ; sur Apple Silicon, passez par guaardvark (Z-Image/SDXL).',
      fix: 'Choisissez Z-Image Turbo ou SDXL et envoyez le job à guaardvark.',
    });
  }

  if (vramGb < preset.minVramGb) {
    issues.push({
      level: 'warning',
      code: 'VRAM_BELOW_RECOMMENDED',
      message: `${preset.shortLabel} est conseillé à partir de ${preset.minVramGb} Go, votre profil indique ${vramGb} Go.`,
      fix:
        preset.family === 'video'
          ? 'Attendez-vous à des temps très longs ; Wan 1.3B (8 Go) est plus réaliste.'
          : 'Restez en basse résolution avec adamw8bit et gradient checkpointing, ou utilisez guaardvark sur une autre machine.',
    });
  }

  if (estimate.vramFit === 'exceeds') {
    issues.push({
      level: 'error',
      code: 'VRAM_WILL_OOM',
      message: `Cette configuration réclame ~${formatVram(estimate.vramMb)} pour ${formatVram(estimate.vramAvailableMb)} disponibles : risque d’OOM certain.`,
      fix: preset.supportsBlocksToSwap
        ? `Montez les blocks to swap (max ${preset.maxBlocksToSwap}), ou repassez en ${preset.resolutions[0]} px.`
        : `Repassez en ${preset.resolutions[0]} px avec gradient checkpointing et rank 16.`,
    });
  } else if (estimate.vramFit === 'tight') {
    issues.push({
      level: 'warning',
      code: 'VRAM_TIGHT',
      message: `~${formatVram(estimate.vramMb)} utilisés sur ${formatVram(estimate.vramAvailableMb)} : ça passe, mais fermez jeux et navigateur GPU.`,
      fix: 'Activez gradient checkpointing et fermez les autres apps qui tiennent du contexte CUDA.',
    });
  }

  // guaardvark garde des délais durs côté daemon : dépasser le budget de temps
  // fait tuer le run en pleine convergence, sans LoRA utilisable.
  if (preset.framework === 'guaardvark') {
    const capMinutes = isMac(hardware) ? 180 : 30;
    if (estimate.minutes > capMinutes) {
      const stepSeconds = (estimate.minutes * 60) / Math.max(1, settings.steps);
      const maxSteps = Math.max(100, Math.floor((capMinutes * 60) / Math.max(0.05, stepSeconds) / 50) * 50);
      issues.push({
        level: 'warning',
        code: 'GUAARDVARK_TRAIN_TIMEOUT',
        message: `guaardvark coupe un run au-delà de ${capMinutes} min (${isMac(hardware) ? 'MPS' : 'CUDA'}) : ${settings.steps} steps ≈ ${formatDuration(estimate.minutes)} seraient interrompus.`,
        fix: `Descendez à ~${maxSteps} steps, ou lancez le job hors guaardvark avec les scripts générés.`,
      });
    }
  }

  if (dataset.imageCount < 8) {
    issues.push({
      level: 'warning',
      code: 'DATASET_TOO_SMALL',
      message: `${dataset.imageCount} images, c’est peu : le LoRA va mémoriser au lieu d’apprendre.`,
      fix: 'Visez 12 à 25 images variées (angles, lumière, fonds) du même sujet.',
    });
  }
  if (dataset.imageCount > 60) {
    issues.push({
      level: 'tip',
      code: 'DATASET_LARGE',
      message: `${dataset.imageCount} images allongent le temps d’entraînement sans gain garanti.`,
      fix: 'Dédoublonnez et gardez 20–40 images les plus nettes.',
    });
  }
  if (!dataset.triggerWord) {
    issues.push({
      level: 'warning',
      code: 'NO_TRIGGER_WORD',
      message: 'Sans trigger word, le LoRA sera difficile à appeler dans vos prompts.',
      fix: 'Choisissez un jeton rare, ex. « pinokio_subject ».',
    });
  }
  if (preset.id === 'flux1_dev' && settings.resolution < 1024) {
    issues.push({
      level: 'warning',
      code: 'FLUX_LOW_RES',
      message: 'FLUX entraîné sous 1024 px perd le détail des visages et des matières.',
      fix: 'Remontez à 1024 px et baissez le batch à 1.',
    });
  }
  if (settings.learningRate > 2e-4) {
    issues.push({
      level: 'warning',
      code: 'LR_TOO_HIGH',
      message: `lr ${settings.learningRate} est agressif : brûlure des traits et perte de variété.`,
      fix: '1e-4 est la valeur de référence pour un LoRA de style ou d’identité.',
    });
  }
  if (settings.learningRate < 5e-6) {
    issues.push({
      level: 'warning',
      code: 'LR_TOO_LOW',
      message: `lr ${settings.learningRate} est trop faible pour converger en ${settings.steps} steps.`,
      fix: 'Remontez à 1e-4, ou augmentez fortement le nombre de steps.',
    });
  }
  if (settings.steps < preset.minSteps) {
    issues.push({
      level: 'tip',
      code: 'STEPS_BELOW_RECOMMENDED',
      message: `${settings.steps} steps sous le plancher conseillé (${preset.minSteps}) : le LoRA restera tiède.`,
      fix: `Visez au moins ${preset.minSteps} steps, ou activez « Auto-régler pour mon GPU ».`,
    });
  }
  if (settings.optimizer === 'adamw' && vramGb < 16) {
    issues.push({
      level: 'warning',
      code: 'OPTIMIZER_TOO_HEAVY',
      message: 'AdamW 32-bit consomme ~4 Go de plus que adamw8bit.',
      fix: 'Passez en adamw8bit, la qualité est identique en pratique.',
    });
  }
  if (settings.batchSize > 1 && vramGb <= 12) {
    issues.push({
      level: 'warning',
      code: 'BATCH_ON_SMALL_GPU',
      message: 'Batch > 1 sur une petite carte : préférez batch 1 + accumulation de gradient.',
      fix: `Batch 1 et gradient accumulation ×${settings.batchSize * settings.gradientAccumulation}.`,
    });
  }
  if (preset.id === 'wan2.1_14b' && hardware === '8GB') {
    issues.push({
      level: 'tip',
      code: 'WAN14B_ON_8GB',
      message: 'Le 14B en 8 Go n’est pas réaliste : même avec block swap, le DiT ne tient pas.',
      fix: 'Entraînez le LoRA sur Wan 1.3B puis réutilisez-le (partiellement) sur le 14B.',
    });
  }
  // guaardvark ne concerne que les bases image de son registre : inutile de
  // polluer la liste pour un LoRA Wan ou H3 qui part en local.
  if (!preset.guaardvarkTrainReady && preset.family === 'image') {
    issues.push({
      level: 'tip',
      code: 'GUAARDVARK_BASE_NOT_READY',
      message: `guaardvark ne sait pas encore entraîner ${preset.shortLabel} : son registre ne marque « train ready » que Z-Image Turbo et SDXL.`,
      fix: 'Lancez le job en local avec les scripts générés, ou utilisez Z-Image/SDXL si vous voulez passer par guaardvark.',
    });
  }
  if (settings.lowVram && vramGb >= preset.comfortableVramGb) {
    issues.push({
      level: 'tip',
      code: 'LOW_VRAM_UNNEEDED',
      message: 'Le layer offloading est actif alors que la VRAM suffit : chaque couche fait un aller-retour CPU/GPU.',
      fix: 'Décochez « Low VRAM » pour gagner ~25-40 % de vitesse à qualité identique.',
    });
  }

  if (preset.id === 'minimax_h3') {
    if (settings.resolution <= 384) {
      issues.push({
        level: 'tip',
        code: 'H3_LOW_RES',
        message: '384 px est le réglage de secours pour 12 Go : le visage perd du détail, le LoRA apprend surtout la silhouette.',
        fix: '512 px est le plancher utile pour une identité ; 768 px si vous avez 24 Go et du temps.',
      });
    }
    if (settings.rank > 16) {
      issues.push({
        level: 'tip',
        code: 'H3_RANK_ABOVE_16',
        message: 'Pour H3, les guides ai-toolkit partent sur rank 16 / alpha 16 (208 modules entraînés).',
        fix: 'Ne montez à 32 que si l’identité reste sous-apprise après 1500 steps.',
      });
    }
    if (vramGb < preset.minVramGb) {
      issues.push({
        level: 'warning',
        code: 'H3_BELOW_MIN_VRAM',
        message: `H3 sous ${preset.minVramGb} Go : même avec low_vram, le text encoder Qwen3-VL (15,7 Go en nvfp4) doit être entièrement déporté.`,
        fix: 'Attendez-vous à des heures par run, ou entraînez sur une machine 24 Go / louée.',
      });
    }
    if (!settings.lowVram && vramGb < preset.comfortableVramGb) {
      issues.push({
        level: 'warning',
        code: 'H3_LOW_VRAM_REQUIRED',
        message: `Sous ${preset.comfortableVramGb} Go, H3 a besoin de low_vram / layer offloading : sans lui, ~${formatVram(
          estimateVramMb(preset, {
            resolution: settings.resolution,
            rank: settings.rank,
            batchSize: settings.batchSize,
            precision: settings.precision,
            gradientCheckpointing: settings.gradientCheckpointing,
            blocksToSwap: settings.blocksToSwap,
          })
        )} contre ${formatVram(estimate.vramAvailableMb)} disponibles.`,
        fix: 'Recochez « Low VRAM » : le YAML généré remet low_vram + layer_offloading.',
      });
    }
  }

  if (settings.alpha > settings.rank * 2) {
    issues.push({
      level: 'tip',
      code: 'ALPHA_ABOVE_2X_RANK',
      message: `alpha ${settings.alpha} >> rank ${settings.rank} rend l’échelle d’application brutale.`,
      fix: `alpha = ${Math.max(8, Math.round(settings.rank / 2))} (ou = rank) est plus prévisible.`,
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Artifacts
// ---------------------------------------------------------------------------

const captionSample = (dataset: LoraDatasetConfig, index: number): string => {
  const descriptions = [
    'standing, neutral pose, soft window light, plain grey background',
    'three-quarter view, looking at camera, outdoor shade, shallow depth of field',
    'profile view, laughing, warm indoor lamp light, blurred apartment background',
    'full body, walking, overcast daylight, street background',
  ];
  const description = descriptions[index % descriptions.length];
  switch (dataset.captionStyle) {
    case 'trigger_only':
      return dataset.triggerWord;
    case 'natural_language':
      return `a detailed photo of ${dataset.triggerWord}, ${dataset.classToken}, ${description}`;
    default:
      return `${dataset.triggerWord} ${dataset.classToken}, ${description}`;
  }
};

const datasetChecklist = (preset: LoraBaseModelPreset, request: LoraPlanRequest, plan: LoraPlan): string => {
  const { dataset, settings } = request;
  const lines = [
    `# Dataset LoRA — ${request.outputName}`,
    '',
    `Modèle de base : **${preset.label}** (${preset.frameworkLabel})`,
    `Cible VRAM : **${request.hardware}** — résolution d’entraînement ${settings.resolution} px`,
    `Dossier : \`${dataset.path}\``,
    `Images : ${dataset.imageCount} · trigger : \`${dataset.triggerWord}\` · classe : \`${dataset.classToken}\``,
    `Durée estimée : ${formatDuration(plan.estimate.minutes)} pour ${settings.steps} steps`,
    '',
    '## Arborescence attendue',
    '',
    '```',
    `${dataset.path}/`,
    '├── 001.png',
    '├── 001.txt        # légende du même nom, extension .txt',
    '├── 002.png',
    '├── 002.txt',
    '└── ...',
    '```',
    '',
    '## Légendes (.txt, une par image)',
    '',
    `Style choisi : \`${dataset.captionStyle}\``,
    '',
    '```text',
    captionSample(dataset, 0),
    captionSample(dataset, 1),
    captionSample(dataset, 2),
    '```',
    '',
    dataset.captionStyle === 'trigger_only'
      ? 'Trigger seul = LoRA « objet/sujet pur ». Attention : il s’applique alors à tout ce que vous générez.'
      : 'Variez la description (pose, lumière, fond, tenue) et gardez le trigger + la classe identiques.',
    '',
    '## Contrôles qualité avant de lancer',
    '',
    '- [ ] Toutes les images montrent **le même sujet** (même visage / même objet).',
    '- [ ] Pas de doublons quasi identiques (dédoublonnez : 2 images identiques = 2× le poids).',
    '- [ ] Netteté suffisante : pas de flou de bougé, pas de JPEG à 60 %.',
    '- [ ] Variété : 3+ angles, 2+ éclairages, 2+ fonds.',
    '- [ ] Aucune image avec watermark ou texte parasite.',
    `- [ ] Résolution native ≥ ${settings.resolution} px sur le plus grand côté.`,
    dataset.regularisationImages > 0
      ? `- [ ] ${dataset.regularisationImages} images de régularisation de la classe \`${dataset.classToken}\` placées dans un dossier séparé.`
      : '- [ ] (optionnel) 5–10 images de régularisation si le fond ou le style « colle » trop.',
    '- [ ] Droits d’usage vérifiés sur les photos (surtout pour un visage réel).',
    '',
    '## Après l’entraînement',
    '',
    `1. Le fichier produit s’appelle \`${request.outputName}.safetensors\` (~${plan.estimate.loraMb} Mo).`,
    `2. Chargez-le avec le trigger \`${dataset.triggerWord}\` en tête de prompt.`,
    preset.family === 'video'
      ? '3. Wan2GP : LoRA Manager → ajoutez le .safetensors, forcez l’échelle 1.0 puis testez 0.7–0.9.'
      : '3. ComfyUI / A1111 / guaardvark : placez-le dans `models/loras` et appliquez une échelle 0.7–0.9.',
    '4. Si l’identité « déborde » sur les autres sujets, baissez l’échelle avant de relancer un entraînement.',
    '',
    '## Utilisation dans WanGP (Wan2GP)',
    '',
    plan.wangp.folder
      ? `- Dossier : \`${plan.wangp.pathHint}\` (sous la racine \`loras/\` de WanGP).`
      : '- WanGP n’héberge pas ce modèle : le LoRA est à charger dans ComfyUI / A1111 / guaardvark (`models/loras`).',
    plan.wangp.folder
      ? `- Échelle conseillée : ${plan.wangp.strengthHint}. Un LoRA d’identité trop fort casse la liberté de pose.`
      : null,
    plan.wangp.folder ? `- ${plan.wangp.note}` : null,
    plan.wangp.folder
      ? '- Sans copie de fichier : Pinokio AI expose le dossier et l’URL à coller dans « Enter Lora URL » (onglet LoRA Studio).'
      : null,
    '',
    '## Notes spécifiques au modèle',
    '',
    ...preset.notes.map((n) => `- ${n}`),
    '',
  ];
  return lines.filter((line) => line !== null).join('\n');
};

const musubiScript = (preset: LoraBaseModelPreset, request: LoraPlanRequest): string => {
  const s = request.settings;
  const task = preset.id === 'wan2.1_1.3b' ? 't2v-1.3B' : 'i2v-14B';
  const width = roundTo((s.resolution * 16) / 9, 16);
  const swapLine = s.blocksToSwap > 0 ? `  --blocks_to_swap ${s.blocksToSwap} \\` : '';
  return [
    '#!/usr/bin/env bash',
    '# Wan 2.1 LoRA — musubi-tuner (fork kohya sd-scripts pour Wan)',
    '# Installer une fois :',
    '#   git clone https://github.com/kohya-ss/musubi-tuner && cd musubi-tuner',
    '#   uv venv && uv pip install -r requirements.txt',
    `# Poids : huggingface-cli download ${preset.weightsHint} --local-dir ./wan`,
    'set -euo pipefail',
    '',
    `# Dataset : ${request.dataset.path} (décrit dans dataset.toml, à copier dans ce dossier)`,
    `OUTPUT_DIR="./output/${request.outputName}"`,
    'DIT_DIR="./wan"',
    '',
    'accelerate launch --num_cpu_threads_per_process 1 --mixed_precision=bf16 \\',
    '  wan_train_network.py \\',
    `  --task ${task} \\`,
    '  --dit "$DIT_DIR" \\',
    '  --dataset_config dataset.toml \\',
    '  --network_module networks.lora_wan \\',
    `  --network_dim ${s.rank} --network_alpha ${s.alpha} \\`,
    `  --learning_rate ${s.learningRate} --optimizer_type ${s.optimizer} \\`,
    `  --max_train_steps ${s.steps} --seed ${s.seed} \\`,
    `  --save_every_n_steps ${Math.max(100, Math.round(s.steps / 4))} \\`,
    '  --mixed_precision bf16 \\',
    s.gradientCheckpointing ? '  --gradient_checkpointing \\' : '',
    swapLine,
    `  --output_dir "$OUTPUT_DIR" --output_name ${request.outputName} \\`,
    '  --sample_prompts samples.txt   # retirez ce flag si le fichier n’existe pas',
    '',
    '# samples.txt : une ligne par prompt de contrôle, ex.',
    `# ${request.dataset.triggerWord} ${request.dataset.classToken}, cinematic portrait, soft light`,
    `# (la résolution de sampling doit rester ${width}x${s.resolution})`,
    '',
  ]
    .filter((line) => line !== '')
    .join('\n');
};

const musubiDatasetToml = (request: LoraPlanRequest): string => {
  const s = request.settings;
  const width = roundTo((s.resolution * 16) / 9, 16);
  return [
    '[general]',
    `resolution = [${s.resolution}, ${width}]`,
    'caption_extension = ".txt"',
    `batch_size = ${s.batchSize}`,
    'enable_bucket = true',
    'bucket_no_upscale = false',
    '',
    '[[datasets]]',
    `image_directory = "${request.dataset.path}"`,
    'num_repeats = 1',
    'cache_directory = "./cache"',
    '',
  ].join('\n');
};

const kohyaScript = (preset: LoraBaseModelPreset, request: LoraPlanRequest): string => {
  const s = request.settings;
  return [
    '#!/usr/bin/env bash',
    '# SDXL LoRA — kohya-ss sd-scripts',
    '# Installer une fois :',
    '#   git clone https://github.com/kohya-ss/sd-scripts && cd sd-scripts',
    '#   uv venv && uv pip install -r requirements.txt',
    'set -euo pipefail',
    '',
    `DATASET_DIR="${request.dataset.path}"`,
    `OUTPUT_DIR="./output/${request.outputName}"`,
    '',
    'accelerate launch --num_cpu_threads_per_process 1 sdxl_train_network.py \\',
    `  --pretrained_model_name_or_path ${preset.repoId} \\`,
    '  --train_data_dir "$DATASET_DIR" \\',
    `  --resolution ${s.resolution},${s.resolution} \\`,
    '  --output_dir "$OUTPUT_DIR" \\',
    `  --output_name ${request.outputName} \\`,
    '  --network_module networks.lora \\',
    `  --network_dim ${s.rank} --network_alpha ${s.alpha} \\`,
    `  --learning_rate ${s.learningRate} \\`,
    `  --optimizer_type ${s.optimizer === 'adamw8bit' ? 'AdamW8bit' : s.optimizer} \\`,
    `  --max_train_steps ${s.steps} \\`,
    `  --train_batch_size ${s.batchSize} --gradient_accumulation_steps ${s.gradientAccumulation} \\`,
    `  --save_every_n_epochs 1 --seed ${s.seed} \\`,
    `  --mixed_precision ${s.precision} \\`,
    '  --network_train_unet_only \\',
    '  --no_half_vae --cache_latents \\',
    s.gradientCheckpointing ? '  --gradient_checkpointing \\' : '',
    '  --caption_extension .txt',
    '',
    `# Fichiers produits : $OUTPUT_DIR/${request.outputName}.safetensors (à copier dans models/loras)`,
    '',
  ]
    .filter((line) => line !== '')
    .join('\n');
};

const kohyaDatasetToml = (request: LoraPlanRequest): string => {
  const s = request.settings;
  return [
    '[general]',
    'enable_bucket = true',
    `resolution = [${s.resolution}, ${s.resolution}]`,
    'caption_extension = ".txt"',
    '',
    '[[datasets]]',
    `image_directory = "${request.dataset.path}"`,
    'num_repeats = 8',
    '',
  ].join('\n');
};

const aiToolkitYaml = (preset: LoraBaseModelPreset, request: LoraPlanRequest): string => {
  const s = request.settings;
  return [
    '---',
    'job: extension',
    'config:',
    `  name: "${request.outputName}"`,
    '  process:',
    "    - type: 'sd_trainer'",
    '      training_folder: "output"',
    '      device: cuda:0',
    `      trigger_word: "${request.dataset.triggerWord}"`,
    '      network:',
    '        type: "lora"',
    `        linear: ${s.rank}`,
    `        linear_alpha: ${s.alpha}`,
    '      save:',
    '        dtype: float16',
    `        save_every: ${Math.max(250, Math.round(s.steps / 4))}`,
    '        max_step_saves_to_keep: 4',
    '      datasets:',
    `        - folder_path: "${request.dataset.path}"`,
    '          caption_ext: "txt"',
    '          caption_dropout_rate: 0.05',
    '          shuffle_tokens: false',
    '          cache_latents_to_disk: true',
    `          resolution: [${s.resolution}]`,
    '      train:',
    `        batch_size: ${s.batchSize}`,
    `        steps: ${s.steps}`,
    `        gradient_accumulation_steps: ${s.gradientAccumulation}`,
    '        train_unet: true',
    '        train_text_encoder: false',
    `        gradient_checkpointing: ${s.gradientCheckpointing}`,
    '        noise_scheduler: "flowmatch"',
    '        optimizer: "adamw8bit"',
    `        lr: ${s.learningRate}`,
    `        dtype: ${s.precision}`,
    '      model:',
    `        name_or_path: "${preset.repoId}"`,
    '        is_flux: true',
    '        quantize: true',
    '',
  ].join('\n');
};

const aiToolkitH3Yaml = (preset: LoraBaseModelPreset, request: LoraPlanRequest): string => {
  const s = request.settings;
  const sampleEvery = Math.max(250, Math.round(s.steps / 4));
  return [
    '---',
    'job: extension',
    'config:',
    `  name: "${request.outputName}"`,
    '  process:',
    "    - type: 'sd_trainer'",
    '      training_folder: "output"',
    '      device: cuda:0',
    `      trigger_word: "${request.dataset.triggerWord}"`,
    '      network:',
    '        type: "lora"',
    `        linear: ${s.rank}`,
    `        linear_alpha: ${s.alpha}`,
    '        network_kwargs:',
    '          # Le checkpoint pruned a replié l AdaLN dans adaln_t_table : ces',
    '          # projections n existent plus, on ne les entraîne donc pas.',
    '          ignore_if_contains: ["adaln_proj"]',
    '      save:',
    '        dtype: float16',
    `        save_every: ${sampleEvery}`,
    '        max_step_saves_to_keep: 4',
    '      datasets:',
    `        - folder_path: "${request.dataset.path}"`,
    '          caption_ext: "txt"',
    '          caption_dropout_rate: 0.05',
    '          num_frames: 1          # 1 = images fixes (identité) ; 17n+5 pour des clips',
    '          fps: 24',
    '          do_i2v: true           # première image = keyframe, comme FL2VA en inférence',
    '          do_audio: false',
    '          cache_latents_to_disk: true',
    `          resolution: [${s.resolution}]`,
    '      train:',
    `        batch_size: ${s.batchSize}`,
    `        steps: ${s.steps}`,
    `        gradient_accumulation: ${s.gradientAccumulation}`,
    `        gradient_checkpointing: ${s.gradientCheckpointing}`,
    '        noise_scheduler: "flowmatch"',
    '        timestep_type: "shift"   # shift 12 vidéo / 3 audio, gérés par le modèle',
    '        do_guidance_loss: true',
    '        guidance_loss_target: 3.5',
    "        audio_loss_multiplier: 0.0   # LoRA d'image/identité : on ignore l'audio",
    `        optimizer: "${s.optimizer}"`,
    `        lr: ${s.learningRate}`,
    `        dtype: ${s.precision}`,
    '        cache_text_embeddings: true',
    '      model:',
    `        name_or_path: "${preset.repoId}"`,
    '        arch: "minimax_h3"',
    '        quantize: true',
    '        qtype: "convrot8"',
    '        quantize_te: true',
    '        qtype_te: "nvfp4"',
    `        low_vram: ${s.lowVram}`,
    ...(s.lowVram
      ? [
          '        layer_offloading: true',
          '        layer_offloading_transformer_percent: 0.2',
          '        layer_offloading_text_encoder_percent: 0.2',
        ]
      : []),
    '        # Adaptateur de training v1 : neutralise la distillation du guidance,',
    "        # actif UNIQUEMENT pendant l'entraînement (jamais fusionné, inutile en inférence).",
    '        assistant_lora_path: "ostris/minimax_h3_training_adapter/minimax_h3_training_adapter_v1.safetensors"',
    '      sample:',
    '        sampler: "flowmatch"',
    `        sample_every: ${sampleEvery}`,
    `        width: ${s.resolution}`,
    `        height: ${s.resolution}`,
    '        num_frames: 1',
    '        guidance_scale: 1        # H3 est guidance-distilled : ni CFG ni négatif',
    '        sample_steps: 28',
    '        prompts:',
    `          - "${request.dataset.triggerWord} ${request.dataset.classToken}, close-up portrait, natural light"`,
    `          - "${request.dataset.triggerWord} ${request.dataset.classToken}, medium shot, looking at camera"`,
    '',
  ].join('\n');
};

const aiToolkitH3Run = (request: LoraPlanRequest): string =>
  [
    '#!/usr/bin/env bash',
    '# MiniMax H3 LoRA — ai-toolkit (ostris), arch minimax_h3',
    "# ai-toolkit exige CUDA : H3 ne s'entraîne pas sur Apple Silicon.",
    'set -euo pipefail',
    '',
    'git clone https://github.com/ostris/ai-toolkit.git',
    'cd ai-toolkit',
    'uv venv && uv pip install -r requirements.txt',
    '',
    `CONFIG="config/${request.outputName}.yaml"`,
    'mkdir -p config output',
    `# copiez ici le YAML généré dans le LoRA Studio :`,
    `# cp ${request.outputName}.yaml "$CONFIG"`,
    'python run.py "$CONFIG"',
    '',
    `# Sortie : output/${request.outputName}/*.safetensors`,
    '# -> à déposer dans loras/minimax_h3/ de WanGP (voir install-to-wangp.sh)',
    '',
  ].join('\n');

const aiToolkitRun = (request: LoraPlanRequest): string =>
  [
    '#!/usr/bin/env bash',
    '# FLUX.1 LoRA — ai-toolkit (ostris)',
    '# Installer une fois :',
    '#   git clone https://github.com/ostris/ai-toolkit && cd ai-toolkit',
    '#   uv venv && uv pip install -r requirements.txt',
    'set -euo pipefail',
    '',
    `CONFIG="config/${request.outputName}.yaml"`,
    'mkdir -p config output',
    '# copiez ici le YAML généré dans le LoRA Studio :',
    `# cp ${request.outputName}.yaml "$CONFIG"`,
    'python run.py "$CONFIG"',
    '',
    `# Sortie : output/${request.outputName}/*.safetensors -> models/loras`,
    '',
  ].join('\n');

const ltxTrainerShell = (preset: LoraBaseModelPreset, request: LoraPlanRequest): string => {
  const s = request.settings;
  return [
    '#!/usr/bin/env bash',
    '# LTX-Video LoRA — ltx-trainer (Lightricks)',
    '# Installer une fois :',
    '#   git clone https://github.com/Lightricks/LTX-Video && cd LTX-Video/ltx-trainer',
    '#   uv sync && uv run python -c "import ltx_trainer"',
    'set -euo pipefail',
    '',
    'DATASET_DIR="' + request.dataset.path + '"',
    '',
    '# 1) Pré-traitement (latents + embeddings texte)',
    `uv run python scripts/process_dataset.py "$DATASET_DIR" --resolution ${s.resolution} \\`,
    '  --text-encoder-model-path google/t5-v1_1-xxl --output-dir ./preprocessed',
    '',
    '# 2) Entraînement LoRA',
    'uv run accelerate launch scripts/train.py config/ltx_lora.yaml \\',
    `  --lora-rank ${s.rank} --learning-rate ${s.learningRate} --steps ${s.steps}`,
    '',
    `# Sortie : ./output/${request.outputName}.safetensors (chargeable dans LTX Director)`,
    '',
  ].join('\n');
};

const ltxTrainerYaml = (preset: LoraBaseModelPreset, request: LoraPlanRequest): string => {
  const s = request.settings;
  return [
    `# ${preset.label} — ltx-trainer. Les clés suivent configs/ du dépôt ;`,
    '# vérifiez-les sur votre version installée (le schéma évolue entre 0.9.x et 2.x).',
    'model:',
    `  model_path: "${preset.repoId}"`,
    '  text_encoder_model_name_or_path: "google/t5-v1_1-xxl"',
    'data:',
    '  preprocessed_data_root: "preprocessed"',
    '  num_dataloader_workers: 2',
    '  batch_size: 1',
    'validation:',
    '  prompts:',
    `    - "${request.dataset.triggerWord} ${request.dataset.classToken}, cinematic motion, soft light"`,
    '  interval: 250',
    'training:',
    `  steps: ${s.steps}`,
    `  learning_rate: ${s.learningRate}`,
    `  gradient_accumulation_steps: ${s.gradientAccumulation}`,
    `  seed: ${s.seed}`,
    `  lora_rank: ${s.rank}`,
    `  lora_alpha: ${s.alpha}`,
    '  optimizer: adamw8bit',
    '  gradient_checkpointing: true',
    'output:',
    `  output_dir: "output/${request.outputName}"`,
    '',
  ].join('\n');
};

const guaardvarkDispatch = (binding: LoraGuaardvarkBinding): string =>
  [
    '#!/usr/bin/env bash',
    '# Envoi du job d’entraînement à une instance guaardvark (Cast Studio).',
    binding.trainReady
      ? `# Base ${binding.baseModelId} : déclarée « train ready » par guaardvark.`
      : `# ATTENTION : ${binding.baseModelId} n’est PAS « train ready » dans guaardvark → réponse 400 attendue.`,
    ...(binding.trainReady
      ? []
      : ['# Entraînez en local avec les autres scripts de ce plan, ou ciblez zimage-turbo / sdxl-legacy.']),
    '# guaardvark doit tourner : cd guaardvark && ./start.sh (backend Flask sur :5000)',
    '# et son plugin lora_trainer doit être installé : plugins/lora_trainer/scripts/setup_venv.sh',
    'set -euo pipefail',
    '',
    'GUAARDVARK_URL="${GUAARDVARK_URL:-http://127.0.0.1:5000}"',
    'SUBJECT_ID="${SUBJECT_ID:-12}"   # id du sujet (personnage) dans le Cast Studio',
    '',
    'curl -sS -X POST "$GUAARDVARK_URL/api/cast/subjects/$SUBJECT_ID/train" \\',
    '  -H "Content-Type: application/json" \\',
    '  ${GUAARDVARK_API_KEY:+-H "X-API-Key: $GUAARDVARK_API_KEY"} \\',
    `  -d '${JSON.stringify(binding.payload, null, 2)}' | python3 -m json.tool`,
    '',
    '# Suivi : GET $GUAARDVARK_URL/api/cast/subjects/$SUBJECT_ID (champ training_status)',
    '',
  ].join('\n');

const wangpTarget = (preset: LoraBaseModelPreset, request: LoraPlanRequest): LoraWanGpTarget => {
  const filename = `${request.outputName}.safetensors`;
  if (!preset.wangpFolder) {
    return {
      filename,
      pathHint: '—',
      strengthHint: '—',
      note:
        'WanGP ne charge pas les LoRA SDXL : utilisez A1111 / ComfyUI / guaardvark (models/loras), ou entraînez une base que WanGP héberge.',
    };
  }
  const isH3 = preset.id === 'minimax_h3';
  return {
    folder: preset.wangpFolder,
    filename,
    pathHint: `loras/${preset.wangpFolder}/${filename}`,
    strengthHint: preset.family === 'video' ? '0,7 → 1,0' : '0,7 → 0,9',
    note: isH3
      ? 'Dans WanGP : modèle « MiniMax H3 FL2VA Pruned 20B », 480p, guidance 1 (H3 est guidance-distilled). Avec un LoRA Turbo en plus : 4 à 8 steps ; sans : 20 à 28 steps. Ne mélangez pas ce LoRA d’identité avec un LoRA Turbo au-delà de 1.0 d’échelle cumulée.'
      : `Déposez le fichier dans loras/${preset.wangpFolder}/, cliquez Refresh dans WanGP, puis activez-le dans Advanced > Loras (échelle ${preset.family === 'video' ? '0,7 à 1,0' : '0,7 à 0,9'}).`,
  };
};

const guaardvarkBinding = (preset: LoraBaseModelPreset, request: LoraPlanRequest): LoraGuaardvarkBinding => {
  const s = request.settings;
  const payload = {
    training_settings: {
      base_model_id: preset.guaardvarkBaseModelId,
      resolution: s.resolution,
      rank: s.rank,
      alpha: s.alpha,
      learning_rate: s.learningRate,
      steps: s.steps,
    },
    trigger_word: request.dataset.triggerWord,
    output_name: request.outputName,
  };
  return {
    baseModelId: preset.guaardvarkBaseModelId,
    trainReady: preset.guaardvarkTrainReady,
    note: preset.guaardvarkTrainReady
      ? `guaardvark entraîne ${preset.shortLabel} via son backend ${preset.guaardvarkBaseModelId} (plugin lora_trainer).`
      : `Le registre guaardvark ne marque pas ${preset.shortLabel} « train ready » : le job sera refusé (400). Utilisez les scripts locaux, ou visez Z-Image Turbo / SDXL.`,
    payload,
    curl: [
      `curl -X POST http://127.0.0.1:5000/api/cast/subjects/<SUBJECT_ID>/train \\`,
      '  -H "Content-Type: application/json" \\',
      '  -H "X-API-Key: $GUAARDVARK_API_KEY" \\',
      `  -d '${JSON.stringify(payload)}'`,
    ].join('\n'),
  };
};

function buildArtifacts(
  preset: LoraBaseModelPreset,
  request: LoraPlanRequest,
  plan: LoraPlan
): LoraArtifact[] {
  const artifacts: LoraArtifact[] = [
    {
      id: 'checklist',
      filename: 'dataset-checklist.md',
      language: 'markdown',
      purpose: 'Ce que le dataset doit contenir avant de lancer (format des légendes inclus).',
      content: datasetChecklist(preset, request, plan),
    },
  ];

  switch (preset.framework) {
    case 'musubi':
      artifacts.push(
        {
          id: 'train-sh',
          filename: 'train.sh',
          language: 'bash',
          purpose: 'Lancement de l’entraînement Wan avec musubi-tuner.',
          content: musubiScript(preset, request),
        },
        {
          id: 'dataset-conf',
          filename: 'dataset.toml',
          language: 'toml',
          purpose: 'Config dataset musubi (résolution, bucket, répertoire des latents).',
          content: musubiDatasetToml(request),
        }
      );
      break;
    case 'kohya':
      artifacts.push(
        {
          id: 'train-sh',
          filename: 'train.sh',
          language: 'bash',
          purpose: 'Lancement de l’entraînement SDXL avec kohya sd-scripts.',
          content: kohyaScript(preset, request),
        },
        {
          id: 'dataset-conf',
          filename: 'dataset.toml',
          language: 'toml',
          purpose: 'Config dataset kohya (buckets + repeats).',
          content: kohyaDatasetToml(request),
        }
      );
      break;
    case 'ai-toolkit':
      if (preset.id === 'minimax_h3') {
        artifacts.push(
          {
            id: 'train-yaml',
            filename: `${request.outputName}.yaml`,
            language: 'yaml',
            purpose:
              'Configuration ai-toolkit MiniMax H3 (arch minimax_h3, adaptateur de training, adaln_proj exclu).',
            content: aiToolkitH3Yaml(preset, request),
          },
          {
            id: 'train-sh',
            filename: 'run.sh',
            language: 'bash',
            purpose: 'Installation d’ai-toolkit puis lancement de l’entraînement H3.',
            content: aiToolkitH3Run(request),
          }
        );
      } else {
        artifacts.push(
          {
            id: 'train-yaml',
            filename: `${request.outputName}.yaml`,
            language: 'yaml',
            purpose: 'Configuration ai-toolkit pour FLUX (LoRA UNet, quantize, adamw8bit).',
            content: aiToolkitYaml(preset, request),
          },
          {
            id: 'train-sh',
            filename: 'run.sh',
            language: 'bash',
            purpose: 'Commande de lancement ai-toolkit.',
            content: aiToolkitRun(request),
          }
        );
      }
      break;
    case 'ltx-trainer':
      artifacts.push(
        {
          id: 'train-sh',
          filename: 'train.sh',
          language: 'bash',
          purpose: 'Pré-traitement puis entraînement LoRA LTX-Video.',
          content: ltxTrainerShell(preset, request),
        },
        {
          id: 'train-yaml',
          filename: 'ltx_lora.yaml',
          language: 'yaml',
          purpose: 'Config ltx-trainer (données, validation, optimisation).',
          content: ltxTrainerYaml(preset, request),
        }
      );
      break;
    case 'guaardvark':
    default:
      artifacts.push(
        {
          id: 'train-sh',
          filename: 'setup-guaardvark.sh',
          language: 'bash',
          purpose: 'Préparer guaardvark + son plugin lora_trainer pour Z-Image.',
          content: [
            '#!/usr/bin/env bash',
            '# Z-Image Turbo LoRA via guaardvark (backend PEFT, venv séparé)',
            'set -euo pipefail',
            '',
            'git clone https://github.com/guaardvark/guaardvark.git',
            'cd guaardvark',
            './start.sh                 # backend Flask :5000 + UI Vite :5173',
            '',
            '# Bibliothèques d’entraînement (Settings > Training libraries, ou) :',
            'cd plugins/lora_trainer && ./scripts/setup_venv.sh',
            '',
            '# Variables utiles si le trainer doit être forcé :',
            'export GUAARDVARK_LORA_BACKEND=real   # auto | real | mock (mock = tests seulement)',
            '',
          ].join('\n'),
        }
      );
      break;
  }

  if (preset.wangpFolder) {
    const folder = preset.wangpFolder;
    artifacts.push({
      id: 'wangp-install',
      filename: 'install-to-wangp.sh',
      language: 'bash',
      purpose: `Copie le .safetensors dans loras/${folder}/ pour que WanGP le propose dans l'onglet Advanced > Loras.`,
      content: [
        '#!/usr/bin/env bash',
        '# Installe le LoRA entraîné dans le dossier que WanGP lit pour ce modèle.',
        `# WanGP attend : <racine loras>/${folder}/ (par défaut ~/pinokio/app/loras/${folder}/)`,
        'set -euo pipefail',
        '',
        'LORA_FILE="${1:?usage: install-to-wangp.sh /chemin/vers/mon_lora.safetensors}"',
        'WANGP_LORAS="${WANGP_LORAS:-$HOME/pinokio/app/loras}"',
        `DEST="$WANGP_LORAS/${folder}"`,
        '',
        'mkdir -p "$DEST"',
        `cp "$LORA_FILE" "$DEST/${request.outputName}.safetensors"`,
        `echo "Installé : $DEST/${request.outputName}.safetensors"`,
        '',
        '# Dans WanGP : bouton Refresh (en haut), puis Advanced > Loras.',
        '# Alternative sans copie : collez l’URL du LoRA dans « Enter Lora URL ».',
        '#   Pinokio AI sert les fichiers présents dans ce dossier :',
        `#   http://127.0.0.1:3000/api/lora/wangp/${folder}/${request.outputName}.safetensors`,
        '',
      ].join('\n'),
    });
  }

  artifacts.push(
    {
      id: 'plan-json',
      filename: 'lora-plan.json',
      language: 'json',
      purpose: 'Le plan complet (base, hyperparamètres, estimations) pour rejouer ou archiver.',
      content: JSON.stringify(
        {
          baseModel: preset.id,
          baseModelRepo: preset.repoId,
          framework: preset.framework,
          hardware: request.hardware,
          outputName: request.outputName,
          dataset: request.dataset,
          settings: request.settings,
          estimate: plan.estimate,
          guaardvark: plan.guaardvark.payload,
          createdAt: plan.createdAt,
        },
        null,
        2
      ),
    },
    {
      id: 'guaardvark-curl',
      filename: 'dispatch-guaardvark.sh',
      language: 'bash',
      purpose: 'Envoi du job au Cast Studio de guaardvark (si vous en avez une instance).',
      content: guaardvarkDispatch(plan.guaardvark),
    }
  );

  return artifacts;
}

// ---------------------------------------------------------------------------
// Point d'entrée
// ---------------------------------------------------------------------------

export function buildLoraPlan(input: LoraPlanRequest | any): LoraPlan {
  const request = normalizeLoraRequest(input);
  const preset = LORA_BASE_MODELS[request.baseModel];
  const recommended = recommendSettings(preset, request.hardware, request.dataset.imageCount);

  const vramMb = estimateVramMb(preset, {
    resolution: request.settings.resolution,
    rank: request.settings.rank,
    batchSize: request.settings.batchSize,
    precision: request.settings.precision,
    gradientCheckpointing: request.settings.gradientCheckpointing,
    blocksToSwap: request.settings.blocksToSwap,
    lowVram: request.settings.lowVram,
  });
  const vramAvailableMb = VRAM_GB[request.hardware] * 1024;
  const vramFit: LoraPlanEstimate['vramFit'] =
    vramMb > vramAvailableMb ? 'exceeds' : vramMb > vramAvailableMb * 0.8 ? 'tight' : 'fits';

  const stepSeconds = estimateStepSeconds(preset, {
    resolution: request.settings.resolution,
    rank: request.settings.rank,
    hardware: request.hardware,
  });
  const steps = request.settings.steps;
  const minutes = (steps * stepSeconds) / 60;
  const optimizerSteps = Math.ceil(steps / Math.max(1, request.settings.gradientAccumulation));
  const epochs = steps / Math.max(1, request.dataset.imageCount);

  const estimate: LoraPlanEstimate = {
    vramMb,
    vramAvailableMb,
    vramFit,
    minutes,
    totalSteps: steps,
    optimizerSteps,
    epochs: Math.round(epochs * 10) / 10,
    datasetMb: Math.round(request.dataset.imageCount * 2.2),
    loraMb: Math.max(24, Math.round(request.settings.rank * 9 + 12)),
  };

  const plan: LoraPlan = {
    baseModel: preset.id,
    baseModelLabel: preset.label,
    framework: preset.framework,
    frameworkLabel: preset.frameworkLabel,
    hardware: request.hardware,
    outputName: request.outputName,
    subjectId: request.subjectId,
    settings: request.settings,
    recommended,
    dataset: request.dataset,
    estimate,
    issues: [],
    artifacts: [],
    guaardvark: guaardvarkBinding(preset, request),
    wangp: wangpTarget(preset, request),
    createdAt: new Date().toISOString(),
  };

  plan.issues = buildIssues(preset, request, estimate);
  plan.artifacts = buildArtifacts(preset, request, plan);

  return plan;
}

/** Vrai si le plan peut être lancé sans corriger une erreur bloquante. */
export const planHasBlockingError = (plan: LoraPlan): boolean =>
  plan.issues.some((issue) => issue.level === 'error');
