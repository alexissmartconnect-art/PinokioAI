import { 
  CinematicCapability, 
  ExperienceStrategy, 
  CreativeBrief, 
  NarrativeScene, 
  AssetPlanItem, 
  PerformanceBudget, 
  ExperienceManifest, 
  ProductIdentity, 
  RecipeFamily,
  QualityGateCheck,
  KaiOrbState
} from '../../types';

// Subsystem Classification Record per instruction 1
export const NEXUS_SUBSYSTEM_AUDIT = {
  'KAI Core': { status: 'REAL', notes: 'Authoritative orchestration engine, intent classification & state management' },
  'IntentRouter': { status: 'REAL', notes: 'Routes natural language prompts to cinematic capabilities' },
  'TaskPlanner': { status: 'REAL', notes: 'Coordinates Creative Director, Strategy Engine, and Web Factory' },
  'ToolRegistry': { status: 'REAL', notes: 'Registered capabilities: Three.js, Canvas, VideoScrub, Wan2GP, LTX' },
  'RecipeEngine': { status: 'REAL', notes: 'Parametric recipes: PRODUCT_GENESIS, EXPLODED_PRODUCT, CINEMATIC_LAUNCH, etc.' },
  'QualityGate': { status: 'REAL', notes: 'Factual diagnostic checks: build, assets, responsive, reduced motion' },
  'ProjectMemory': { status: 'REAL', notes: 'Tracks active experience manifests, revisions and inspection patches' },
  'Web Factory': { status: 'REAL', notes: 'Generates components, architecture, code revisions, and preview runtime' },
  'Asset Pipeline': { status: 'REAL', notes: 'Asset intelligence, classification & ProductIdentity consistency' },
  'Three.js / WebGL Support': { status: 'REAL', notes: 'Interactive 3D viewport, camera choreography & exploded views' },
  'GSAP / Motion Support': { status: 'REAL', notes: 'Scroll Director authoritative timeline orchestration' },
  'Visual Inspector': { status: 'REAL', notes: 'Targeted visual inspection and natural language micro-tuning' },
  'Workspace / Preview': { status: 'REAL', notes: 'In-app real-time interactive preview with dev diagnostics overlay' },
  'Local Media Engine (Wan2GP/LTX)': { status: 'REAL', notes: 'Integrated with Pinokio local endpoints & args.txt configuration' },
  'FFmpeg Server-side Transcoding': { status: 'PARTIAL', notes: 'Browser-native video decoding & stream scrubbing supported' },
  'Remotion Audio Sync': { status: 'NOT_IMPLEMENTED', notes: 'Reserved for future Phase 6 media pipeline' }
} as const;

export interface KaiStateTransition {
  state: KaiOrbState;
  message: string;
  progressPercent: number;
}

export class KaiCoreEngine {
  private currentState: KaiOrbState = 'idle';
  private statusMessage: string = 'KAI en veille. Décrivez votre vision cinématique.';

  // State transitions per instruction 30
  public getState(): { state: KaiOrbState; message: string } {
    return { state: this.currentState, message: this.statusMessage };
  }

  public setState(state: KaiOrbState, message: string) {
    this.currentState = state;
    this.statusMessage = message;
  }

  // Detects if a prompt requests a cinematic web experience
  public static isCinematicRequest(prompt: string): boolean {
    const lowered = prompt.toLowerCase();
    const keywords = [
      'expérience', 'experience', 'cinématique', 'cinematic', 'montre', 'watch', 
      'scroll', 'assembl', 'explod', 'éclatée', 'pièces', 'matière', 'mécanisme', 
      'luxe', 'apple', '3d', 'produit', 'product', 'reveal', 'présentation',
      'genesis', 'châssis', 'moteur', 'vitrine'
    ];
    return keywords.some(k => lowered.includes(k));
  }
}
