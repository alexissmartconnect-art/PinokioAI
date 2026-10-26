import { PinokioApp } from '../types';

export const PINOKIO_APPS: PinokioApp[] = [
  {
    id: 'wan2gp',
    name: 'Wan2GP',
    author: 'deepbeepmeep',
    version: 'v2.2.4',
    description: '1-click WanGP Launcher. Super Optimized Gradio UI for AI video creation for GPU poor machines (6GB+ VRAM). Supports Wan 2.1/2.2, Qwen, Hunyuan Video, LTX Video and Flux.',
    tags: ['#video-generation', '#ai', '#video', '#wan2.1', '#ltx-video', '#hunyuan', '#low-vram'],
    category: 'video',
    repoUrl: 'https://github.com/deepbeepmeep/Wan2GP',
    minVram: '6GB VRAM',
    recommendedGpu: 'NVIDIA RTX 3060 12GB / RTX 4070 or RTX 2060 6GB with CPU Offload',
    featured: true,
    supportedModels: ['Wan 2.1 (14B & 1.3B)', 'Wan 2.2', 'LTX-Video (0.9.1, 0.9.5)', 'HunyuanVideo', 'Qwen2-VL', 'Flux.1'],
    keyMenus: [
      {
        menuName: 'Generation Mode (T2V / I2V / V2V)',
        description: 'Choose between Text to Video, Image to Video (animating starting image), or Video to Video.',
        criticalSettings: ['Input Image Upload', 'Image Strength / Noise Augmentation', 'Interpolation Frame (Last frame)']
      },
      {
        menuName: 'Model & Quantization Selection',
        description: 'Select backbone architecture and memory quantization to match your exact GPU capacity.',
        criticalSettings: ['Wan2.1-I2V-14B (480p/720p)', 'LTX-Video 0.9.5 (Fast DiT)', 'FP8 vs GGUF Q4_K_M vs BF16', 'UMT5 Text Encoder Offload']
      },
      {
        menuName: 'Sampling & Guidance Controls',
        description: 'Control motion stability, adherence to prompt, and visual fidelity.',
        criticalSettings: ['Inference Steps (Wan: 30-35, LTX: 20-30)', 'CFG / Guidance Scale (Wan: 5.0, LTX: 3.5)', 'Flow Shift (Wan: 3.0-5.0, LTX: 3.0)', 'Sampler (FlowMatch Euler)']
      },
      {
        menuName: 'Resolution & Motion Dynamics',
        description: 'Set dimensions, frame count, and frame rate.',
        criticalSettings: ['Resolution (832x480 for 6-8GB, 1280x720 for 12GB+)', 'Frames (49 or 81 frames)', 'FPS (16, 24, 25)', 'Motion Score / Camera vectors']
      },
      {
        menuName: 'Hardware & Memory Offloading',
        description: 'Enable sequential layer offloading and advanced attention kernels to prevent CUDA Out Of Memory.',
        criticalSettings: ['Sequential CPU Offload', 'SageAttention / FlashAttention-2', 'Attention Slicing', 'VRAM Budgeting']
      }
    ],
    launchCommand: 'python wgp.py --listen 127.0.0.1 --port 7860 --args args.txt',
    argsFlag: '--lowvram --fp8 --attention sageattention --cpu-offload',
    troubleshootingTips: [
      'If you get "CUDA out of memory", switch quantization from BF16 to GGUF Q4_K_M and enable "Sequential CPU Offload".',
      'For LTX-Video, lower CFG Guidance scale to 3.0 - 3.8. A CFG higher than 5.0 in LTX causes severe artifacts and burn-in.',
      'For Wan 2.1 I2V, maintain aspect ratio within 832x480 or 1280x720 to prevent facial deformation.'
    ]
  },
  {
    id: 'maestro',
    name: 'Maestro',
    author: 'blizaine',
    version: 'v2.4.0',
    description: 'An all-in-one, 100% local AI creative studio, director, and multi-track editor. Generate with MiniMax H3, LTX-2 5.2 3, Wan, Flux, Qwen, and more: turn an idea or song into a planned production, then finish it on the timeline.',
    tags: ['#video-generation', '#director', '#timeline', '#multitrack', '#ai', '#ltx-2'],
    category: 'video',
    repoUrl: 'https://github.com/blizaine/Maestro',
    minVram: '6GB+ VRAM',
    recommendedGpu: 'NVIDIA RTX 3070 8GB / RTX 4080 16GB',
    featured: true,
    supportedModels: ['MiniMax H3', 'LTX-2 5.2 3', 'Wan 2.1', 'Flux', 'Qwen'],
    keyMenus: [
      {
        menuName: 'Director Screenplay & Storyboard',
        description: 'Auto-breakdown user prompts into sequential camera shots with shot list angles.',
        criticalSettings: ['Shot Duration', 'Camera Motion (Dolly, Pan, Orbit, Drone)', 'Character Consistency Seed']
      },
      {
        menuName: 'Multi-track Timeline Editor',
        description: 'Non-linear video and audio arrangement with real-time transition previews.',
        criticalSettings: ['Track Layers', 'Audio Sync Track', 'Cut Points', 'Render Resolution']
      }
    ],
    launchCommand: 'npm start -- --port 3200',
    argsFlag: '--device cuda --cache-dir checkpoints',
    troubleshootingTips: [
      'Sync checkpoints with Pinokio Disk Saver to avoid duplicate 20GB downloads between Wan2GP and Maestro.',
      'Use the LTX-2 mode for fast pre-visualization drafts before rendering final passes in Wan 2.1 14B.'
    ]
  },
  {
    id: 'yue2-groove',
    name: 'YUE2 // GROOVE',
    author: 'bearbone',
    version: 'v1.0.8',
    description: 'The latest music studio built on the open-source Yue2 model and its inference stack. Generate high-quality full songs from style and lyrics with an editable score plan, SheetSage2, MERT2, GGUF 8-bit engine.',
    tags: ['#music-generation', '#song-generation', '#audio', '#yue2', '#sheet-sage'],
    category: 'audio',
    repoUrl: 'https://github.com/bearbone/yue2-groove-pinokio',
    minVram: '8GB VRAM (with GGUF 8-bit)',
    recommendedGpu: 'NVIDIA RTX 2070 8GB (GGUF) or 24GB VRAM for unquantized CFG 1.0',
    featured: true,
    supportedModels: ['YuE2 full model', 'YuE2 GGUF 8-bit backbone', 'SheetSage2', 'MERT2'],
    keyMenus: [
      {
        menuName: 'Style & Genre Prompting',
        description: 'Define vocal gender, tempo BPM, instrumentation, and sonic atmosphere.',
        criticalSettings: ['Genre Tags', 'Vocal Style', 'Mood', 'Audio Reference Cover']
      },
      {
        menuName: 'Lyrics & Score Plan',
        description: 'Structured [Verse], [Chorus], [Bridge], [Outro] timing editor with syllable metric analysis.',
        criticalSettings: ['Section Length', 'Metronome BPM', 'Melody Conditioning']
      }
    ],
    launchCommand: 'python app.py --listen 0.0.0.0 --port 7865',
    argsFlag: '--gguf-8bit --lowvram',
    troubleshootingTips: [
      'On Windows with < 16GB VRAM, always select the GGUF 8-bit backbone (8.2 GB peak VRAM).',
      'Ensure Caddy is running if accessing the web UI remotely via local network.'
    ]
  },
  {
    id: 'phosphene',
    name: 'Phosphene',
    author: 'bizarro',
    version: 'v4.16',
    description: 'The comprehensive local Music Studio with 70+ audio processing nodes, stem separation, synth generation, and real-time audio routing.',
    tags: ['#music', '#daw', '#audio-generation', '#stems'],
    category: 'audio',
    repoUrl: 'https://pinokio.co/bizarro/phosphene',
    minVram: '4GB VRAM',
    recommendedGpu: 'Any modern GPU or Apple Silicon',
    featured: true,
    keyMenus: [
      {
        menuName: 'Synthesizer & Sequencer Rack',
        description: 'Modular DSP and neural audio synthesizers.',
        criticalSettings: ['Audio Buffer Size', 'Sample Rate (48kHz)', 'Neural Latency']
      }
    ],
    launchCommand: 'npm run dev',
    argsFlag: '',
    troubleshootingTips: ['Set ASIO audio driver on Windows for zero-latency audio buffer monitoring.']
  },
  {
    id: 'pulseforge',
    name: 'PulseForge',
    author: 'theAwakenOne',
    version: 'v5.0',
    description: 'A fully local, cross-platform audio visualizer editor. Create reactive music videos with layered graphics, AI-transcribed lyrics, and frame-perfect MP4 exports.',
    tags: ['#video', '#audio', '#visualizer', '#motion'],
    category: 'video',
    repoUrl: 'https://github.com/theAwakenOne/PulseForge',
    minVram: '4GB VRAM',
    recommendedGpu: 'NVIDIA or Apple Silicon',
    keyMenus: [
      {
        menuName: 'Audio Frequency Analyzer',
        description: 'Bind bass, mids, and treble to 3D motion channels.',
        criticalSettings: ['FFT Smoothing', 'Bass Kick Threshold', 'Particle Count']
      }
    ],
    launchCommand: 'python main.py',
    argsFlag: '--hardware-acceleration',
    troubleshootingTips: ['Export with hardware NVENC encoder for 5x faster rendering.']
  },
  {
    id: 'thedaw',
    name: 'theDAW',
    author: 'gantasmo',
    version: 'v7.0',
    description: 'Full-featured DAW, DJ, and VJ app interoperable with Ableton, Reaper, Resolume. Stable Audio 2, Magenta RT2, Suno API, Chimera track fusion, Demucs stems.',
    tags: ['#music', '#daw', '#stems', '#stable-audio'],
    category: 'audio',
    repoUrl: 'https://github.com/gantasmo/theDAW-Pinokio',
    minVram: '6GB VRAM',
    recommendedGpu: 'NVIDIA RTX 3060 12GB',
    keyMenus: [
      {
        menuName: 'Demucs Stem Separator',
        description: 'Split any song into Drums, Bass, Vocals, and Other stems in seconds.',
        criticalSettings: ['Model (htdemucs_ft)', 'Shifts', 'Overlap']
      }
    ],
    launchCommand: 'python launch.py',
    argsFlag: '--cuda',
    troubleshootingTips: ['Use Demucs v4 for cleanest vocal isolation before feeding into YuE2.']
  },
  {
    id: 'comfyui-portable',
    name: 'ComfyUI Portable',
    author: 'comfyanonymous',
    version: 'v0.3.18',
    description: 'The standard node-based GUI for Stable Diffusion, Flux.1, Wan 2.1, and LTX-Video. Deep integration with Pinokio Checkpoints and Disk Saver.',
    tags: ['#comfyui', '#image-generation', '#video-generation', '#nodes'],
    category: 'utility',
    repoUrl: 'https://github.com/comfyanonymous/ComfyUI',
    minVram: '4GB - 24GB VRAM',
    recommendedGpu: 'NVIDIA RTX 3060 / 4070 / 4090',
    keyMenus: [
      {
        menuName: 'Wan 2.1 & LTX Video Nodes',
        description: 'ComfyUI native nodes for WanVideoWrapper and LTXSampler.',
        criticalSettings: ['WanVideoModelLoader', 'EmptyWanLatentVideo', 'KSamplerAdvanced']
      }
    ],
    launchCommand: 'python main.py --windows-standalone-build --listen 127.0.0.1 --port 8188',
    argsFlag: '--highvram or --lowvram --preview-method auto',
    troubleshootingTips: ['Set checkpoints folder path to ~/pinokio/checkpoints to share weights with Wan2GP.']
  },
  {
    id: 'coding-agents',
    name: 'Pinokio AI Coding Agents & Plugins',
    author: 'pinokio-ecosystem',
    version: 'v2026.3',
    description: 'Full suite of autonomous terminal and desktop coding agents integrated inside Pinokio: Claude Code, OpenCode, Grok Build, Antigravity CLI, Cursor, and VS Code.',
    tags: ['#agent', '#coding', '#utility', '#claude-code', '#opencode'],
    category: 'coding',
    repoUrl: 'https://pinokio.co/plugins',
    minVram: 'CPU / API based',
    recommendedGpu: 'Any',
    keyMenus: [
      {
        menuName: 'Terminal Agents',
        description: 'Launch autonomous agents directly with file access to ~/pinokio/apps.',
        criticalSettings: ['Auto-Approval mode', 'Working directory', 'Model selection']
      }
    ],
    launchCommand: 'pinokio run plugin',
    argsFlag: '',
    troubleshootingTips: ['Use Claude Code Auto or OpenCode to customize your local Gradio interfaces.']
  },
  {
    id: 'guaardvark',
    name: 'Guaardvark',
    author: 'guaardvark',
    version: 'v3.3.0',
    description:
      'Self-hosted AI studio on your own GPU: chat with your files (RAG), screen and browser agents, coding swarms, LoRA training, an MCP server for Claude Code and Cursor, plus local video, image, music and voice generation. No telemetry.',
    tags: ['#studio', '#lora-training', '#self-hosted', '#rag', '#agents', '#mcp', '#local', '#z-image', '#sdxl'],
    category: 'utility',
    repoUrl: 'https://github.com/guaardvark/guaardvark',
    minVram: '12GB VRAM (LoRA Z-Image/SDXL)',
    recommendedGpu: 'NVIDIA RTX 3090/4090 24GB (ou 16GB avec gradient checkpointing)',
    featured: true,
    supportedModels: [
      'Z-Image Turbo (LoRA par défaut)',
      'SDXL 1.0 (back-end legacy PEFT)',
      'FLUX.1 dev (recette en cours)',
      'Qwen2.5 / Gemma (fine-tune texte)',
      'Wan, LTX, ACE-Step (génération)',
    ],
    keyMenus: [
      {
        menuName: 'Cast Studio > LoRA Training',
        description:
          'Le plugin lora_trainer entraîne un LoRA d’identité (personnage, décor, objet) depuis les images de référence du sujet.',
        criticalSettings: [
          'base_model_id (zimage-turbo par défaut, sdxl-legacy en secours)',
          'resolution 512 (sûr pour 16 Go) · rank 16 · alpha 16 · lr 1e-4',
          'steps = min(1500, max(400, nb_images × 100))',
          'Training libraries installées (Settings > Training libraries)',
        ],
      },
      {
        menuName: 'plugins/lora_trainer > Backends',
        description:
          'Sélection real/auto/mock : mock est réservé aux tests (NO-MOCKS policy), auto exige un accélérateur CUDA ou MPS.',
        criticalSettings: [
          'GUAARDVARK_LORA_BACKEND=auto | real | mock',
          'scripts/setup_venv.sh (venv-torch ~7 Go pour SDXL)',
          'ZIMAGE_TURBO_TRAIN_ADAPTER (adaptateur turbo optionnel)',
          'Timeouts : 15 min de chargement / 30 min de train sur CUDA',
        ],
      },
      {
        menuName: 'Settings > Training libraries',
        description:
          'Bibliothèques épinglées, modèles de base téléchargeables et verdict matériel. Aucun job ne démarre sans elles.',
        criticalSettings: [
          'Install / Remove (token à usage unique)',
          'Download du modèle de base (jamais pendant un job)',
          'Verdict GPU vs budget VRAM déclaré par le modèle',
        ],
      },
    ],
    launchCommand: './start.sh',
    argsFlag: 'FLASK_PORT=5000 VITE_PORT=5173',
    troubleshootingTips: [
      'Le backend Flask écoute sur :5000 (:5055 sur macOS) : c’est l’URL à donner au LoRA Studio de Pinokio AI.',
      'Une erreur 400 BASE_MODEL_UNAVAILABLE signifie que le registre média ne déclare pas la base « train ready » : restez sur zimage-turbo ou sdxl-legacy.',
      'Si GUAARDVARK_API_KEY est défini, chaque appel doit porter l’en-tête X-API-Key (Pinokio AI le fait via GUAARDVARK_API_KEY).',
      'Un job bloqué à « training » sans progression : vérifiez nvidia-smi puis relancez avec GUAARDVARK_LORA_BACKEND=real pour court-circuiter la sonde.',
    ],
  }
];

export const SAMPLE_PRESET_IMAGES = [
  {
    id: 'cyberpunk_rain',
    title: 'Cyberpunk Neon Alley',
    subtitle: 'High reflection, rain droplets, volumetric neon light',
    category: 'Sci-Fi / Cinematic',
    recommendedFor: 'Wan 2.1 I2V / LTX-Video',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80',
    sampleGoal: 'Create a cinematic slow-motion pan of rain dripping from neon signs as smoke drifts across the alleyway.'
  },
  {
    id: 'portrait_golden_hour',
    title: 'Golden Hour Portrait',
    subtitle: 'Shallow depth of field, delicate hair strands in wind',
    category: 'Realistic / Human',
    recommendedFor: 'LTX-Video 0.9.5 / Wan 2.1',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
    sampleGoal: 'Gentle breeze blowing through hair, natural blinking, warm sun rays shifting across face, subtle smile.'
  },
  {
    id: 'drone_nature_fjord',
    title: 'Misty Mountain Fjord',
    subtitle: 'Volumetric mist, cascading waterfall, epic scale',
    category: 'Landscape / Drone',
    recommendedFor: 'Wan 2.1 14B 720p',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    sampleGoal: 'High-altitude drone forward flight sweeping over the misty pine forest toward the reflective water below.'
  },
  {
    id: 'sports_car_track',
    title: 'Supercar on Coastal Road',
    subtitle: 'High speed tracking shot, asphalt reflection, motion blur',
    category: 'Action / Vehicle',
    recommendedFor: 'Wan2GP LTX High Speed',
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=80',
    sampleGoal: 'Low-angle chase camera tracking the sleek supercar as wheels spin with realistic motion blur and sun lens flare.'
  }
];

export const VRAM_PRESET_CONFIGS = {
  '6GB': {
    name: 'RTX 2060 / 3060 Laptop (6GB VRAM)',
    resolution: '832x480' as const,
    aspectRatio: '16:9' as const,
    frameCount: 49,
    fps: 16,
    steps: 25,
    cfgScale: 4.5,
    flowShift: 3.0,
    motionStrength: 6,
    vramOffload: 'Sequential CPU Offload' as const,
    precision: 'GGUF Q4_K_M (Low VRAM)' as const,
    attentionBackend: 'SageAttention' as const,
    notes: 'Sequential CPU offload and 4-bit GGUF quantization are strictly required to avoid CUDA Out of Memory.'
  },
  '8GB': {
    name: 'RTX 3070 / 4060 / 2070 (8GB VRAM)',
    resolution: '832x480' as const,
    aspectRatio: '16:9' as const,
    frameCount: 81,
    fps: 24,
    steps: 30,
    cfgScale: 5.0,
    flowShift: 3.5,
    motionStrength: 7,
    vramOffload: 'Sequential CPU Offload' as const,
    precision: 'FP8 (Optimized)' as const,
    attentionBackend: 'SageAttention' as const,
    notes: 'FP8 precision with SageAttention runs comfortably at 832x480 for 81 frames (approx. 3.4 seconds of 24fps).'
  },
  '12GB': {
    name: 'RTX 3060 12GB / RTX 4070 (12GB VRAM)',
    resolution: '1280x720' as const,
    aspectRatio: '16:9' as const,
    frameCount: 81,
    fps: 24,
    steps: 32,
    cfgScale: 5.0,
    flowShift: 4.0,
    motionStrength: 7,
    vramOffload: 'Model CPU Offload' as const,
    precision: 'FP8 (Optimized)' as const,
    attentionBackend: 'FlashAttention-2' as const,
    notes: 'Enables 720p HD rendering. Model CPU offload handles text encoder switching with high throughput.'
  },
  '16GB': {
    name: 'RTX 4080 / RTX 3090 (16GB VRAM)',
    resolution: '1280x720' as const,
    aspectRatio: '16:9' as const,
    frameCount: 113,
    fps: 24,
    steps: 35,
    cfgScale: 5.5,
    flowShift: 4.5,
    motionStrength: 8,
    vramOffload: 'Model CPU Offload' as const,
    precision: 'BF16 (Full Quality)' as const,
    attentionBackend: 'FlashAttention-2' as const,
    notes: 'Can run unquantized BF16 precision with long 113 frame sequences and sharp textures.'
  },
  '24GB+': {
    name: 'RTX 4090 / RTX 3090 24GB / Cloud GPU',
    resolution: '1280x720' as const,
    aspectRatio: '16:9' as const,
    frameCount: 113,
    fps: 25,
    steps: 40,
    cfgScale: 6.0,
    flowShift: 5.0,
    motionStrength: 8,
    vramOffload: 'None (Pure VRAM)' as const,
    precision: 'BF16 (Full Quality)' as const,
    attentionBackend: 'FlashAttention-2' as const,
    notes: 'Pure VRAM execution with zero CPU bottleneck. Fast rendering and full DiT layer retention.'
  },
  'Mac_Silicon': {
    name: 'Apple Silicon Mac (32GB+ Unified Memory)',
    resolution: '832x480' as const,
    aspectRatio: '16:9' as const,
    frameCount: 49,
    fps: 16,
    steps: 25,
    cfgScale: 4.0,
    flowShift: 3.0,
    motionStrength: 6,
    vramOffload: 'Sequential CPU Offload' as const,
    precision: 'GGUF Q8_0' as const,
    attentionBackend: 'SDPA' as const,
    notes: 'Uses Apple Metal MPS backend. GGUF quantization is ideal for unified memory architecture.'
  }
};
