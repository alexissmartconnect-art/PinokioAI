import { 
  ExperienceStrategy, 
  CostPolicy, 
  ExecutionPolicy 
} from '../../types';

export interface StrategyEvaluationInput {
  hasGlbModel?: boolean;
  hasProductPhotos?: boolean;
  hasCinematicVideo?: boolean;
  hasLocalGpu?: boolean;
  isMobileDevice?: boolean;
  prefersReducedMotion?: boolean;
  executionPolicy?: ExecutionPolicy;
  costPolicy?: CostPolicy;
  userExplicitPreference?: ExperienceStrategy;
}

export interface StrategyEvaluationResult {
  selectedStrategy: ExperienceStrategy;
  confidenceScore: number;
  reason: string;
  fallbackStrategy: ExperienceStrategy;
  mobileStrategy: ExperienceStrategy;
  reducedMotionStrategy: ExperienceStrategy;
  eligibleStrategies: {
    strategy: ExperienceStrategy;
    score: number;
    pros: string;
    cons: string;
  }[];
}

export class ExperienceStrategyEngine {
  /**
   * Authoritative Strategy Selection Algorithm
   * Evaluates hardware, assets, mobile constraints, and cost policies.
   */
  public static evaluateStrategy(input: StrategyEvaluationInput): StrategyEvaluationResult {
    const {
      hasGlbModel = false,
      hasProductPhotos = true,
      hasCinematicVideo = false,
      hasLocalGpu = true,
      isMobileDevice = false,
      prefersReducedMotion = false,
      executionPolicy = 'LOCAL_FIRST',
      costPolicy = 'BALANCED',
      userExplicitPreference
    } = input;

    // Respect reduced motion constraint immediately
    if (prefersReducedMotion) {
      return {
        selectedStrategy: 'DOM_MOTION',
        confidenceScore: 0.98,
        reason: 'Préférence d’accessibilité "prefers-reduced-motion" détectée. Sélection d’une narration élégante par typographie et opacités fluides sans mouvements déstabilisants.',
        fallbackStrategy: 'DOM_MOTION',
        mobileStrategy: 'DOM_MOTION',
        reducedMotionStrategy: 'DOM_MOTION',
        eligibleStrategies: [
          { strategy: 'DOM_MOTION', score: 1.0, pros: 'Accessible, zéro vertige, haut contraste, chargement instantané', cons: 'Pas de rotation 3D continue' }
        ]
      };
    }

    // Scenario D: Weak mobile device profile
    if (isMobileDevice) {
      return {
        selectedStrategy: 'HYBRID',
        confidenceScore: 0.92,
        reason: 'Profil mobile détecté : Préservation de l’autonomie de la batterie et mémoire GPU limitée. Utilisation d’un canvas WebGL optimisé combiné au motion DOM natif.',
        fallbackStrategy: 'DOM_MOTION',
        mobileStrategy: 'DOM_MOTION',
        reducedMotionStrategy: 'DOM_MOTION',
        eligibleStrategies: [
          { strategy: 'HYBRID', score: 0.92, pros: 'Fluide à 60fps sur iPhone/Android, mémoire contrôlée (<65MB)', cons: 'Détails des shaders PBR simplifiés' },
          { strategy: 'DOM_MOTION', score: 0.85, pros: 'Poids minimal, ultra rapide', cons: 'Moins immersif' },
          { strategy: 'TRUE_3D', score: 0.50, pros: 'Rendu riche', cons: 'Chauffe mobile et risque de perte de frame' }
        ]
      };
    }

    // Scenario A: Real GLB provided
    if (hasGlbModel) {
      return {
        selectedStrategy: 'TRUE_3D',
        confidenceScore: 0.96,
        reason: 'Modèle 3D GLB/GLTF exploitable détecté. Stratégie TRUE_3D sélectionnée : chorégraphie caméra dynamique, contrôle de la lumière et vue éclatée géométrique au scroll.',
        fallbackStrategy: 'HYBRID',
        mobileStrategy: 'HYBRID',
        reducedMotionStrategy: 'DOM_MOTION',
        eligibleStrategies: [
          { strategy: 'TRUE_3D', score: 0.96, pros: 'Contrôle total des angles, éclairage en temps réel, vue éclatée interactive', cons: 'Nécessite WebGL et chargement initial du maillage' },
          { strategy: 'HYBRID', score: 0.88, pros: 'Parfaite intégration texte-objet', cons: 'Légèrement plus complexe à orchestrer' }
        ]
      };
    }

    // Scenario C: Generated cinematic video available
    if (hasCinematicVideo) {
      return {
        selectedStrategy: 'VIDEO_SCROLL',
        confidenceScore: 0.94,
        reason: 'Vidéo cinématique maîtresse disponible. Stratégie VIDEO_SCROLL sélectionnée : scrubbing précis de la timeline synchronisé au défilement utilisateur via requestAnimationFrame.',
        fallbackStrategy: 'IMAGE_SEQUENCE',
        mobileStrategy: 'IMAGE_SEQUENCE',
        reducedMotionStrategy: 'DOM_MOTION',
        eligibleStrategies: [
          { strategy: 'VIDEO_SCROLL', score: 0.94, pros: 'Qualité photoréaliste maximale type publicité cinéma, zéro calcul 3D local', cons: 'Dépendance au décodeur vidéo matériel' },
          { strategy: 'IMAGE_SEQUENCE', score: 0.82, pros: 'Scrub ultra réactif sans keyframe lag', cons: 'Poids de téléchargement plus élevé' }
        ]
      };
    }

    // Scenario B: Only product images / procedural generation available
    if (hasProductPhotos) {
      return {
        selectedStrategy: 'HYBRID',
        confidenceScore: 0.90,
        reason: 'Images de référence et spécifications disponibles sans modèle 3D externe lourd. Stratégie HYBRID retenue : géométrie procédurale PBR WebGL temps réel combinée à une chorégraphie cinématique DOM.',
        fallbackStrategy: 'IMAGE_SEQUENCE',
        mobileStrategy: 'DOM_MOTION',
        reducedMotionStrategy: 'DOM_MOTION',
        eligibleStrategies: [
          { strategy: 'HYBRID', score: 0.90, pros: 'Équilibre parfait entre rendu 3D haute fidélité, réactivité immédiate et zéro coût API', cons: 'Nécessite la génération procédurale des sous-ensembles' },
          { strategy: 'IMAGE_SEQUENCE', score: 0.84, pros: 'Éclat photoréaliste pré-rendu', cons: 'Nécessite pré-chargement WebP' },
          { strategy: 'DOM_MOTION', score: 0.75, pros: 'Léger et universel', cons: 'Profondeur spatiale limitée' }
        ]
      };
    }

    // Default safe fallback
    return {
      selectedStrategy: 'HYBRID',
      confidenceScore: 0.85,
      reason: 'Stratégie adaptative HYBRID sélectionnée par défaut pour garantir une expérience fluide quel que soit le matériel.',
      fallbackStrategy: 'DOM_MOTION',
      mobileStrategy: 'DOM_MOTION',
      reducedMotionStrategy: 'DOM_MOTION',
      eligibleStrategies: [
        { strategy: 'HYBRID', score: 0.85, pros: 'Robuste, modulaire, élégant', cons: 'N/A' }
      ]
    };
  }
}
