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

export interface CreativeDirectorOutput {
  brief: CreativeBrief;
  scenes: NarrativeScene[];
  assetPlan: AssetPlanItem[];
  performanceBudget: PerformanceBudget;
  recommendedStrategy: ExperienceStrategy;
  subCapabilities: CinematicCapability[];
}

export class CreativeDirector {
  /**
   * Transforms a natural language user request into a complete creative roadmap.
   * Dynamically adapts narrative to the requested product category.
   */
  public static planExperience(
    userPrompt: string, 
    referenceImageSrc?: string,
    hasGlbModel: boolean = false,
    isMobile: boolean = false
  ): CreativeDirectorOutput {
    const promptLower = userPrompt.toLowerCase();
    
    // 1. Identify Product Identity
    const product = this.extractProductIdentity(promptLower, userPrompt);
    
    // 2. Select appropriate recipe
    let recipeFamily: RecipeFamily = 'PRODUCT_GENESIS';
    if (promptLower.includes('éclat') || promptLower.includes('exploded') || promptLower.includes('composant')) {
      recipeFamily = 'EXPLODED_PRODUCT';
    } else if (promptLower.includes('lancement') || promptLower.includes('launch') || promptLower.includes('hero')) {
      recipeFamily = 'CINEMATIC_LAUNCH';
    } else if (promptLower.includes('technique') || promptLower.includes('spec') || promptLower.includes('moteur')) {
      recipeFamily = 'TECHNICAL_PRODUCT';
    }

    // 3. Generate Visual Narrative (Scenes)
    const scenes = this.buildNarrativeScenes(product, recipeFamily);

    // 4. Create Asset Plan
    const assetPlan = this.buildAssetPlan(product, hasGlbModel);

    // 5. Select Strategy based on constraints
    let recommendedStrategy: ExperienceStrategy = 'TRUE_3D';
    if (isMobile) {
      recommendedStrategy = 'HYBRID';
    } else if (hasGlbModel) {
      recommendedStrategy = 'TRUE_3D';
    } else if (promptLower.includes('vidéo') || promptLower.includes('video')) {
      recommendedStrategy = 'VIDEO_SCROLL';
    } else if (promptLower.includes('sequence') || promptLower.includes('images')) {
      recommendedStrategy = 'IMAGE_SEQUENCE';
    } else {
      recommendedStrategy = 'HYBRID'; // Best resilient strategy combining WebGL canvas + DOM motion
    }

    // 6. Define Sub-capabilities
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

    // 7. Calculate realistic performance budget
    const performanceBudget: PerformanceBudget = {
      maxInitialJsKb: isMobile ? 180 : 320,
      maxMediaWeightMb: isMobile ? 6.5 : 18.0,
      max3dAssetWeightMb: isMobile ? 3.0 : 8.5,
      maxTexturesWeightMb: isMobile ? 4.0 : 12.0,
      maxWebGLContexts: 1, // Strict single context discipline
      targetFps: 60,
      estimatedMemoryImpactMb: isMobile ? 65 : 140
    };

    const brief: CreativeBrief = {
      id: `brief-${Date.now()}`,
      clientGoal: userPrompt,
      targetProduct: product,
      recipeFamily,
      emotionalTone: promptLower.includes('luxe') || promptLower.includes('montre') ? 'luxury_craft' : 'hyper_tech',
      visualPace: 'deliberate',
      targetAudience: 'Amateurs de design de haute précision, esthètes & acheteurs avertis',
      keyMoments: [
        'Éveil de la matière première brute sous éclairage rasant',
        'Déconstruction atomique et mise en lévitation des composants',
        'Horlogerie / mécanique interne en mouvement synchronisé',
        'Convergence cinématique et assemblage magnétique fluide',
        'Révélation finale en majesté avec reflets dynamiques au scroll'
      ]
    };

    return {
      brief,
      scenes,
      assetPlan,
      performanceBudget,
      recommendedStrategy,
      subCapabilities
    };
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

  private static buildNarrativeScenes(product: ProductIdentity, recipe: RecipeFamily): NarrativeScene[] {
    return [
      {
        id: 'scene-01',
        order: 1,
        name: 'RAW MATERIAL',
        scrollStart: 0.0,
        scrollEnd: 0.20,
        headline: 'L’ORIGINE MINÉRALE',
        subhead: `Bloc pur de ${product.materials[0] || 'titane brut'} soumis à un premier façonnage dans l’obscurité.`,
        visualFocus: 'Texture brute, étincelles d’usinage, reflets rasants spéculaires.',
        cameraChoreography: {
          position: [0, 1.2, 5.0],
          target: [0, 0, 0],
          fov: 38,
          description: 'Traveling avant lent et majestueux vers le cœur de la matière brute.'
        },
        lightingDescription: 'Lumière d’ambiance bleu nuit glaciale (Key Light 2800K rasant, Rim Light 6500K)',
        motionVectors: 'Rotations lentes sur l’axe Y, micro-vibrations cinématiques',
        assemblyProgress: 0,
        explodedDistance: 1.0,
        particleDensity: 120
      },
      {
        id: 'scene-02',
        order: 2,
        name: 'CRAFT & COMPONENTS',
        scrollStart: 0.20,
        scrollEnd: 0.42,
        headline: 'L’USINAGE DE PRÉCISION',
        subhead: `${product.distinctiveFeatures[0] || 'Composants micrométriques'} taillés au laser et usinés au micron près.`,
        visualFocus: 'Décomposition et lévitation des rouages, vis et platines squelettées.',
        cameraChoreography: {
          position: [2.5, 0.8, 3.8],
          target: [0, 0.2, 0],
          fov: 34,
          description: 'Rotation orbitale à 45° révélant la volumétrie des pièces séparées.'
        },
        lightingDescription: 'Éclairage d’atelier d’horloger, faisceaux directionnels chauds mettant en valeur le poli bloqué.',
        motionVectors: 'Dispersion radiale contrôlée des éléments sur les 3 axes X, Y, Z',
        assemblyProgress: 25,
        explodedDistance: 0.82,
        particleDensity: 80
      },
      {
        id: 'scene-03',
        order: 3,
        name: 'THE MECHANISM',
        scrollStart: 0.42,
        scrollEnd: 0.65,
        headline: 'LE CŒUR PULSANT',
        subhead: 'La cinématique interne s’enclenche : balancier, rouages et différentiels s’animent en cadence.',
        visualFocus: 'Mouvement synchronisé des engrenages intérieurs et réfraction de la lumière.',
        cameraChoreography: {
          position: [-1.8, -0.4, 2.9],
          target: [0, 0, 0],
          fov: 28,
          description: 'Macro plongeante dans les profondeurs du calibre mécanique.'
        },
        lightingDescription: 'Contre-jour ambré et reflets dorés soulignant l’échappement et le spiral.',
        motionVectors: 'Oscillations à fréquence harmonique, rotation continue des axes',
        assemblyProgress: 60,
        explodedDistance: 0.45,
        particleDensity: 40
      },
      {
        id: 'scene-04',
        order: 4,
        name: 'ASSEMBLY',
        scrollStart: 0.65,
        scrollEnd: 0.85,
        headline: 'CONVERGENCE PARFAITE',
        subhead: 'Sous l’effet du défilement, le boîtier, le verre saphir et la lunette s’emboîtent au millième.',
        visualFocus: 'Ajustement parfait des tolérances mécaniques, claquement visuel magnétique.',
        cameraChoreography: {
          position: [0.5, 1.5, 4.2],
          target: [0, 0, 0],
          fov: 35,
          description: 'Redressement vertical régulier accompagnant la fermeture des éléments.'
        },
        lightingDescription: 'Lumière blanche zénithale de studio de luxe, double rim light sculptant les arêtes.',
        motionVectors: 'Attraction centripète guidée, amortissement exponentiel',
        assemblyProgress: 92,
        explodedDistance: 0.12,
        particleDensity: 20
      },
      {
        id: 'scene-05',
        order: 5,
        name: 'FINAL PRODUCT',
        scrollStart: 0.85,
        scrollEnd: 1.0,
        headline: 'L’ŒUVRE ACCOMPLIE',
        subhead: `${product.name} dans son éclat final, paré pour l’éternité. Défilement et interaction 360° débloqués.`,
        visualFocus: 'Reflet de verre saphir, éclat des biseaux satinés, perfection absolue.',
        cameraChoreography: {
          position: [0, 0, 3.4],
          target: [0, 0, 0],
          fov: 32,
          description: 'Vue frontale iconique avec légère inclinaison de 12° invitant à l’interaction.'
        },
        lightingDescription: 'Studio commercial Apple/luxe, halo doux en arrière-plan et contraste dramatique.',
        motionVectors: 'Interactivité inertielle contrôlée au curseur et gyroscope mobile',
        assemblyProgress: 100,
        explodedDistance: 0.0,
        particleDensity: 0
      }
    ];
  }

  private static buildAssetPlan(product: ProductIdentity, hasGlb: boolean): AssetPlanItem[] {
    return [
      {
        id: 'asset-mesh-core',
        name: `${product.name} Procedural PBR Assembly Model`,
        type: '3d_model',
        status: hasGlb ? 'ASSET_USABLE' : 'ASSET_USABLE',
        sourceEngine: 'Three.js',
        fallbackStrategy: 'WebGL Procedural Geometry with PBR shaders',
        estimatedWeightKb: 1450
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
        name: 'Brushed Titanium & Sapphire PBR Texture Set',
        type: 'texture_pbr',
        status: 'ASSET_USABLE',
        sourceEngine: 'LocalWebGL',
        fallbackStrategy: 'Procedural algorithmic normal/roughness generation',
        estimatedWeightKb: 620
      },
      {
        id: 'asset-vector-schematics',
        name: 'Horological Caliber Schematics & Wireframe Overlay',
        type: 'vector_path',
        status: 'ASSET_USABLE',
        sourceEngine: 'BrowserSVG',
        fallbackStrategy: 'Native SVG vector paths',
        estimatedWeightKb: 85
      }
    ];
  }
}
