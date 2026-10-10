import {
  CreativeBrief,
  NarrativeScene,
  AssetPlanItem,
  PerformanceBudget,
  ProductIdentity,
  RecipeFamily,
  ExperienceStrategy,
  CinematicCapability
} from '../../types';
import { ExperienceStrategyEngine, StrategyEvaluationResult } from './experienceStrategyEngine';

export interface PlanOptions {
  /** Respect prefers-reduced-motion (forces DOM_MOTION through the strategy engine). */
  prefersReducedMotion?: boolean;
  /** Override the video detection performed on the prompt. */
  hasCinematicVideo?: boolean;
  /** Override the strategy detection performed on the prompt. */
  userExplicitPreference?: ExperienceStrategy;
}

export interface CreativeDirectorOutput {
  brief: CreativeBrief;
  scenes: NarrativeScene[];
  assetPlan: AssetPlanItem[];
  performanceBudget: PerformanceBudget;
  recommendedStrategy: ExperienceStrategy;
  subCapabilities: CinematicCapability[];
  strategyEvaluation: StrategyEvaluationResult;
}

type ProductKind = 'watch' | 'car' | 'sneaker' | 'generic';

interface NarrativeTheme {
  tone: CreativeBrief['emotionalTone'];
  pace: CreativeBrief['visualPace'];
  audience: string;
  keyMoments: string[];
  sceneNames: string[];
  headlines: string[];
  subheads: ((p: ProductIdentity) => string)[];
  visualFocus: string[];
  lighting: string[];
  motion: string[];
}

const WATCH_THEME: NarrativeTheme = {
  tone: 'luxury_craft',
  pace: 'deliberate',
  audience: 'Amateurs de design de haute précision, esthètes & acheteurs avertis',
  keyMoments: [
    'Éveil de la matière première brute sous éclairage rasant',
    'Déconstruction atomique et mise en lévitation des composants',
    'Horlogerie / mécanique interne en mouvement synchronisé',
    'Convergence cinématique et assemblage magnétique fluide',
    'Révélation finale en majesté avec reflets dynamiques au scroll'
  ],
  sceneNames: ['RAW MATERIAL', 'CRAFT & COMPONENTS', 'THE MECHANISM', 'ASSEMBLY', 'FINAL PRODUCT'],
  headlines: ['L’ORIGINE MINÉRALE', 'L’USINAGE DE PRÉCISION', 'LE CŒUR PULSANT', 'CONVERGENCE PARFAITE', 'L’ŒUVRE ACCOMPLIE'],
  subheads: [
    (p) => `Bloc pur de ${p.materials[0] || 'titane brut'} soumis à un premier façonnage dans l’obscurité.`,
    (p) => `${p.distinctiveFeatures[0] || 'Composants micrométriques'} taillés au laser et usinés au micron près.`,
    () => 'La cinématique interne s’enclenche : balancier, rouages et différentiels s’animent en cadence.',
    () => 'Sous l’effet du défilement, le boîtier, le verre saphir et la lunette s’emboîtent au millième.',
    (p) => `${p.name} dans son éclat final, paré pour l’éternité. Défilement et interaction 360° débloqués.`
  ],
  visualFocus: [
    'Texture brute, étincelles d’usinage, reflets rasants spéculaires.',
    'Décomposition et lévitation des rouages, vis et platines squelettées.',
    'Mouvement synchronisé des engrenages intérieurs et réfraction de la lumière.',
    'Ajustement parfait des tolérances mécaniques, claquement visuel magnétique.',
    'Reflet de verre saphir, éclat des biseaux satinés, perfection absolue.'
  ],
  lighting: [
    'Lumière d’ambiance bleu nuit glaciale (Key Light 2800K rasant, Rim Light 6500K)',
    'Éclairage d’atelier d’horloger, faisceaux directionnels chauds mettant en valeur le poli bloqué.',
    'Contre-jour ambré et reflets dorés soulignant l’échappement et le spiral.',
    'Lumière blanche zénithale de studio de luxe, double rim light sculptant les arêtes.',
    'Studio commercial Apple/luxe, halo doux en arrière-plan et contraste dramatique.'
  ],
  motion: [
    'Rotations lentes sur l’axe Y, micro-vibrations cinématiques',
    'Dispersion radiale contrôlée des éléments sur les 3 axes X, Y, Z',
    'Oscillations à fréquence harmonique, rotation continue des axes',
    'Attraction centripète guidée, amortissement exponentiel',
    'Interactivité inertielle contrôlée au curseur et gyroscope mobile'
  ]
};

const GENERIC_THEME: NarrativeTheme = {
  tone: 'hyper_tech',
  pace: 'deliberate',
  audience: 'Acheteurs exigeant un design de haute précision et une mise en scène soignée',
  keyMoments: [
    'Matière d’origine révélée sous éclairage rasant',
    'Anatomie du produit : chaque élément isolé et mis en valeur',
    'Cœur technique en mouvement, fonctions clés démontrées',
    'Convergence des éléments vers la forme finale',
    'Révélation finale avec interaction au scroll'
  ],
  sceneNames: ['RAW MATERIAL', 'ANATOMY', 'CORE SYSTEM', 'ASSEMBLY', 'FINAL PRODUCT'],
  headlines: ['L’ORIGINE DES MATÉRIAUX', 'ANATOMIE DU PRODUIT', 'LE CŒUR TECHNIQUE', 'CONVERGENCE & ASSEMBLAGE', 'LA RÉVÉLATION FINALE'],
  subheads: [
    (p) => `${p.materials[0] || 'Matériau principal'} façonné avec précision, surfaces prêtes pour la mise en scène.`,
    (p) => `${p.distinctiveFeatures[0] || 'Les sous-ensembles'} isolés pour révéler la structure du produit.`,
    (p) => `${p.distinctiveFeatures[1] || p.distinctiveFeatures[0] || 'Le système central'} entre en fonctionnement.`,
    () => 'Les éléments convergent et s’emboîtent avec précision jusqu’à la forme finale.',
    (p) => `${p.name} dans sa forme finale. Interaction 360° débloquée.`
  ],
  visualFocus: [
    'Texture de surface, reflets rasants, détails de finition.',
    'Éclatement contrôlé des sous-ensembles sur trois axes.',
    'Mise en mouvement des fonctions clés, lisibilité du mécanisme.',
    'Convergence fluide, alignement précis des pièces.',
    'Silhouette complète, éclat des matériaux, cadrage iconique.'
  ],
  lighting: [
    'Key light chaude frontale, fill doux et rim light froide',
    'Éclairage directionnel mettant en valeur les surfaces usinées',
    'Contre-jour contrasté soulignant les volumes internes',
    'Lumière zénithale studio neutre, reflets contrôlés',
    'Studio commercial, halo doux en arrière-plan et contraste dramatique'
  ],
  motion: [
    'Rotation lente sur l’axe Y, micro-vibrations cinématiques',
    'Dispersion radiale contrôlée des sous-ensembles',
    'Mouvements synchronisés des fonctions clés',
    'Attraction guidée et amortissement exponentiel',
    'Interactivité inertielle au curseur et gyroscope mobile'
  ]
};

const CAMERA_PRESETS: { position: [number, number, number]; target: [number, number, number]; fov: number; description: string }[] = [
  { position: [0, 1.2, 5.0], target: [0, 0, 0], fov: 38, description: 'Traveling avant lent et majestueux vers le cœur de la matière brute.' },
  { position: [2.5, 0.8, 3.8], target: [0, 0.2, 0], fov: 34, description: 'Rotation orbitale à 45° révélant la volumétrie des pièces séparées.' },
  { position: [-1.8, -0.4, 2.9], target: [0, 0, 0], fov: 28, description: 'Macro plongeante dans les profondeurs du mécanisme.' },
  { position: [0.5, 1.5, 4.2], target: [0, 0, 0], fov: 35, description: 'Redressement vertical régulier accompagnant la fermeture des éléments.' },
  { position: [0, 0, 3.4], target: [0, 0, 0], fov: 32, description: 'Vue frontale iconique avec légère inclinaison de 12° invitant à l’interaction.' }
];

export class CreativeDirector {
  /**
   * Transforms a natural language user request into a complete creative roadmap.
   * Narrative, recipe and strategy all adapt to the detected product category.
   */
  public static planExperience(
    userPrompt: string,
    referenceImageSrc?: string,
    hasGlbModel: boolean = false,
    isMobile: boolean = false,
    options: PlanOptions = {}
  ): CreativeDirectorOutput {
    const promptLower = userPrompt.toLowerCase();

    // 1. Product identity & narrative theme
    const product = this.extractProductIdentity(promptLower, userPrompt);
    const kind = this.detectProductKind(product);
    const theme = this.selectTheme(kind, promptLower);

    // 2. Recipe (actually applied to the scenes below)
    const recipeFamily = this.selectRecipe(promptLower);

    // 3. Strategy: single source of truth = ExperienceStrategyEngine
    const strategyEvaluation = ExperienceStrategyEngine.evaluateStrategy({
      hasGlbModel,
      hasCinematicVideo: options.hasCinematicVideo ?? /vid[ée]o/.test(promptLower),
      isMobileDevice: isMobile,
      prefersReducedMotion: options.prefersReducedMotion ?? false,
      userExplicitPreference: options.userExplicitPreference ?? this.detectExplicitStrategy(promptLower)
    });
    const recommendedStrategy = strategyEvaluation.selectedStrategy;

    // 4. Narrative & asset plan
    const scenes = this.buildNarrativeScenes(product, recipeFamily, theme);
    const assetPlan = this.buildAssetPlan(product, hasGlbModel);

    // 5. Sub-capabilities consistent with the selected strategy
    const subCapabilities: CinematicCapability[] = [
      'CINEMATIC_WEB_EXPERIENCE',
      'PRODUCT_STORYTELLING',
      'SCROLL_STORYTELLING',
      'PRODUCT_REVEAL',
      'PRODUCT_ASSEMBLY',
      'EXPLODED_VIEW',
      'CAMERA_CHOREOGRAPHY',
      'KINETIC_TYPOGRAPHY',
      'MATERIAL_REVEAL'
    ];
    if (recommendedStrategy === 'TRUE_3D') subCapabilities.push('TRUE_3D_PRODUCT');
    if (recommendedStrategy === 'VIDEO_SCROLL') subCapabilities.push('SCROLL_SCRUB_VIDEO');
    if (recommendedStrategy === 'IMAGE_SEQUENCE') subCapabilities.push('IMAGE_SEQUENCE_SCROLL');
    if (recommendedStrategy === 'HYBRID') subCapabilities.push('HYBRID_3D_VIDEO_DOM');

    // 6. Performance budget
    const performanceBudget: PerformanceBudget = {
      maxInitialJsKb: isMobile ? 180 : 320,
      maxMediaWeightMb: isMobile ? 6.5 : 18.0,
      max3dAssetWeightMb: isMobile ? 3.0 : 8.5,
      maxTexturesWeightMb: isMobile ? 4.0 : 12.0,
      maxWebGLContexts: 1,
      targetFps: 60,
      estimatedMemoryImpactMb: isMobile ? 65 : 140
    };

    const brief: CreativeBrief = {
      id: `brief-${Date.now().toString(36)}`,
      clientGoal: userPrompt,
      targetProduct: product,
      recipeFamily,
      emotionalTone: theme.tone,
      visualPace: recommendedStrategy === 'VIDEO_SCROLL' ? 'poetic' : theme.pace,
      targetAudience: theme.audience,
      keyMoments: theme.keyMoments
    };

    return {
      brief,
      scenes,
      assetPlan,
      performanceBudget,
      recommendedStrategy,
      subCapabilities,
      strategyEvaluation
    };
  }

  /** Recipe families are selected from explicit keywords; default is PRODUCT_GENESIS. */
  private static selectRecipe(lower: string): RecipeFamily {
    if (/(éclat|eclat|exploded|composant)/.test(lower)) return 'EXPLODED_PRODUCT';
    if (/(lancement|launch|hero)/.test(lower)) return 'CINEMATIC_LAUNCH';
    if (/(technique|spec|moteur)/.test(lower)) return 'TECHNICAL_PRODUCT';
    if (/(portfolio|galerie)/.test(lower)) return 'IMMERSIVE_PORTFOLIO';
    return 'PRODUCT_GENESIS';
  }

  /** Detects an explicit strategy request such as "en séquence d'images" or "version GLB". */
  private static detectExplicitStrategy(lower: string): ExperienceStrategy | undefined {
    if (/\b(glb|gltf|true 3d|3d réel)\b/.test(lower)) return 'TRUE_3D';
    if (/(séquence|sequence) d.images|image sequence/.test(lower)) return 'IMAGE_SEQUENCE';
    if (/(vid[ée]o).{0,20}(scrub|scroll|défilement)/.test(lower)) return 'VIDEO_SCROLL';
    return undefined;
  }

  private static detectProductKind(product: ProductIdentity): ProductKind {
    const cat = product.category.toLowerCase();
    if (cat.includes('horlogerie')) return 'watch';
    if (cat.includes('hypercar') || cat.includes('grand tourisme')) return 'car';
    if (cat.includes('sneaker')) return 'sneaker';
    return 'generic';
  }

  private static selectTheme(kind: ProductKind, lower: string): NarrativeTheme {
    const base = kind === 'watch' ? WATCH_THEME : GENERIC_THEME;
    const theme: NarrativeTheme = { ...base };
    if (kind === 'car') theme.pace = 'explosive';
    if (kind === 'sneaker') theme.pace = 'kinetic';
    if (lower.includes('luxe')) theme.tone = 'luxury_craft';
    return theme;
  }

  private static extractProductIdentity(lower: string, original: string): ProductIdentity {
    if (lower.includes('montre') || lower.includes('watch') || lower.includes('chronograph')) {
      return {
        name: 'Aethelgard Genesis Tourbillon T33',
        category: 'Haute Horlogerie Mécanique',
        shape: 'Boîtier octogonal biseauté 41mm',
        materials: ['Titane Grade 5 sablé', 'Verre Saphir antireflet double face', 'Rubis synthétiques d’échappement', 'Carbone forgé'],
        colors: ['Gris Titane Anthracite', 'Bleu Cobalt Électrique', 'Or Rose Cuivré', 'Noir Obsidian'],
        proportions: 'Diamètre 41.5mm / Épaisseur 10.8mm',
        logoPlacement: 'Cadran supérieur à 12h & gravure masse oscillante',
        distinctiveFeatures: ['Tourbillon volant à 6h', 'Ponts squelettés ajourés', 'Index luminescents Super-LumiNova BGW9']
      };
    } else if (lower.includes('voiture') || lower.includes('car') || lower.includes('auto') || lower.includes('véhicule')) {
      return {
        name: 'Veloce Hyperion GT Concept',
        category: 'Hypercar Électrique Grand Tourisme',
        shape: 'Lignes aérodynamiques fluides et cockpit en goutte d’eau',
        materials: ['Monocoque Fibre de Carbone pré-imprégnée', 'Aluminium aéronautique 7075', 'Verre photochromique intelligent'],
        colors: ['Argent Liquide Stellaire', 'Noir Brillant Carbone', 'Liseré Orange Borealis'],
        proportions: 'Longueur 4780mm / Empattement 2950mm / Hauteur 1190mm',
        logoPlacement: 'Capot avant épuré & bandeau lumineux arrière traversant',
        distinctiveFeatures: ['Aérodynamique active adaptative', 'Pack batterie structurel intégré au châssis', 'Jantes à ailettes de refroidissement']
      };
    } else if (lower.includes('sneaker') || lower.includes('chaussure') || lower.includes('shoe')) {
      return {
        name: 'Aether Runner Ultra Strata',
        category: 'Sneaker Athlétique Haute Performance',
        shape: 'Profil biomécanique profilé avec semelle découpée géométrique',
        materials: ['Mesh tricoté recyclé sans couture', 'Mousse supercritique infusée d’azote', 'Plaque carbone ondulée'],
        colors: ['Craie Minérale', 'Vert Néon Volt', 'Gris Graphite'],
        proportions: 'Pointure 42 standard / Drop 6mm',
        logoPlacement: 'Empeigne latérale discrète thermo-collée',
        distinctiveFeatures: ['Semelle intermédiaire à alvéoles ventilées', 'Contrefort talon anatomique externe']
      };
    } else {
      // Generic high-end tech/industrial product
      return {
        name: 'KAI Kinetic Core Device',
        category: 'Instrument Électronique de Précision',
        shape: 'Monolithe curviligne en aluminium brossé et verre trempé',
        materials: ['Aluminium anodisé recyclable', 'Verre Gorilla Glass Armor', 'Polymère texturé soft-touch'],
        colors: ['Gris Sidéral Profond', 'Accents Cuivre Anodisé', 'Blanc Céramique'],
        proportions: 'Ratio d’or 1.618 / Épaisseur ultra-fine 8.2mm',
        logoPlacement: 'Gravure laser subtile face arrière',
        distinctiveFeatures: ['Châssis unibody scellé', 'Composants internes optimisés pour le refroidissement passif']
      };
    }
  }

  private static buildNarrativeScenes(product: ProductIdentity, recipe: RecipeFamily, theme: NarrativeTheme): NarrativeScene[] {
    const ranges: [number, number][] = [[0.0, 0.2], [0.2, 0.42], [0.42, 0.65], [0.65, 0.85], [0.85, 1.0]];
    const assembly = [0, 25, 60, 92, 100];
    const exploded = [1.0, 0.82, 0.45, 0.12, 0.0];
    const particles = [120, 80, 40, 20, 0];

    return ranges.map(([start, end], i) => {
      let explodedDistance = exploded[i];
      let headline = theme.headlines[i];
      let subhead = theme.subheads[i](product);
      let motionVectors = theme.motion[i];

      // Recipe modifiers: each recipe changes the narrative in a concrete, observable way
      if (recipe === 'EXPLODED_PRODUCT' && i <= 2) {
        explodedDistance = Math.min(1, explodedDistance + 0.15);
      }
      if (recipe === 'TECHNICAL_PRODUCT' && i === 2) {
        headline = 'SPÉCIFICATIONS & FONCTIONNEMENT';
        subhead = `Fiche technique : ${product.proportions}. ${subhead}`;
      }
      if (recipe === 'CINEMATIC_LAUNCH' && i === 4) {
        headline = 'LANCEMENT';
        motionVectors = `Entrée hero en travelling rapide, puis ${theme.motion[4]}`;
      }
      if (recipe === 'IMMERSIVE_PORTFOLIO' && i === 4) {
        subhead = `${product.name} : vue d’ensemble du portfolio. Naviguer au scroll pour explorer.`;
      }

      return {
        id: `scene-0${i + 1}`,
        order: i + 1,
        name: theme.sceneNames[i],
        scrollStart: start,
        scrollEnd: end,
        headline,
        subhead,
        visualFocus: theme.visualFocus[i],
        cameraChoreography: { ...CAMERA_PRESETS[i] },
        lightingDescription: theme.lighting[i],
        motionVectors,
        assemblyProgress: assembly[i],
        explodedDistance,
        particleDensity: particles[i]
      };
    });
  }

  private static buildAssetPlan(product: ProductIdentity, hasGlb: boolean): AssetPlanItem[] {
    return [
      {
        id: 'asset-mesh-core',
        name: `${product.name} — ${hasGlb ? 'maillage GLB fourni' : 'assemblage PBR procédural'}`,
        type: '3d_model',
        status: 'ASSET_USABLE',
        sourceEngine: 'Three.js',
        fallbackStrategy: 'WebGL Procedural Geometry with PBR shaders',
        estimatedWeightKb: hasGlb ? 4200 : 1450
      },
      {
        id: 'asset-video-timeline',
        name: 'Cinematic Atmosphere Scrub Loop',
        type: 'video_timeline',
        status: 'ASSET_OPTIONAL',
        sourceEngine: 'WanGP',
        fallbackStrategy: 'Canvas particle field & dynamic gradient shader',
        estimatedWeightKb: 3800
      },
      {
        id: 'asset-pbr-materials',
        name: 'PBR Texture Set (matériaux du produit)',
        type: 'texture_pbr',
        status: 'ASSET_USABLE',
        sourceEngine: 'LocalWebGL',
        fallbackStrategy: 'Procedural algorithmic normal/roughness generation',
        estimatedWeightKb: 620
      },
      {
        id: 'asset-vector-schematics',
        name: 'Schémas techniques & overlay vectoriel',
        type: 'vector_path',
        status: 'ASSET_USABLE',
        sourceEngine: 'BrowserSVG',
        fallbackStrategy: 'Native SVG vector paths',
        estimatedWeightKb: 85
      }
    ];
  }
}
