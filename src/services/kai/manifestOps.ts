import { ExperienceManifest, ExperienceStrategy, NarrativeScene } from '../../types';
import { CreativeDirector } from './creativeDirector';
import { CinematicQualityGate, STRATEGY_CAPABILITY } from './qualityGate';

const round2 = (v: number) => Math.round(v * 100) / 100;
const round3 = (v: number) => Math.round(v * 1000) / 1000;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const revision = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

/**
 * Builds a complete, audited manifest from a natural language request.
 * Shared by the KAI orb, the acceptance tests and any future entry point.
 */
export function createManifestFromPrompt(
  prompt: string,
  options: { isMobile?: boolean; prefersReducedMotion?: boolean; hasGlbModel?: boolean } = {}
) {
  const isMobile = options.isMobile ?? false;
  const plan = CreativeDirector.planExperience(prompt, undefined, options.hasGlbModel ?? false, isMobile, {
    prefersReducedMotion: options.prefersReducedMotion ?? false
  });

  const manifest: ExperienceManifest = {
    experienceId: revision('exp'),
    title: `${plan.brief.targetProduct.name} — Expérience KAI`,
    version: '1.1.0',
    strategy: plan.recommendedStrategy,
    subCapabilities: plan.subCapabilities,
    brief: plan.brief,
    scenes: plan.scenes,
    assetPlan: plan.assetPlan,
    performanceBudget: plan.performanceBudget,
    breakpoints: { mobileMaxPx: 640, tabletMaxPx: 1024, desktopMinPx: 1025 },
    fallbacks: {
      mobileStrategy: plan.strategyEvaluation.mobileStrategy,
      reducedMotionStrategy: plan.strategyEvaluation.reducedMotionStrategy,
      offlineMediaFallback: 'Génération procédurale de maillage PBR'
    },
    localMediaDependencies: [
      { engine: 'WanGP (Pinokio Local)', registered: true, available: true },
      { engine: 'LTX Director v1.3.25', registered: true, available: true },
      { engine: 'Three.js WebGL Canvas', registered: true, available: true }
    ],
    externalDependencies: ['three', 'motion', 'lucide-react'],
    qualityGateChecks: [],
    overallQualityStatus: 'PASS',
    revisionId: revision('rev'),
    createdAt: new Date().toISOString()
  };

  return { manifest: CinematicQualityGate.withAudit(manifest), plan };
}

/**
 * Switches the manifest strategy and keeps its capabilities consistent with it.
 * Returns a new manifest; the input is never mutated.
 */
export function withStrategy(manifest: ExperienceManifest, strategy: ExperienceStrategy): ExperienceManifest {
  const strategyCaps = Object.values(STRATEGY_CAPABILITY);
  const kept = manifest.subCapabilities.filter((c) => !strategyCaps.includes(c));
  const cap = STRATEGY_CAPABILITY[strategy];
  return CinematicQualityGate.withAudit({
    ...manifest,
    strategy,
    subCapabilities: cap ? [...kept, cap] : kept,
    revisionId: revision('strat')
  });
}

/**
 * Applies a natural language micro-adjustment to one scene.
 * Returns the new manifest and the list of changes actually performed.
 * When no rule matches, the manifest is returned unchanged with an empty change list.
 */
export function applyInspectorPatch(
  manifest: ExperienceManifest,
  sceneIndex: number,
  instruction: string
): { manifest: ExperienceManifest; changes: string[] } {
  const lower = instruction.toLowerCase();
  const changes: string[] = [];

  // Immutable copy of the scenes (deep enough for the fields we touch)
  const scenes: NarrativeScene[] = manifest.scenes.map((s) => ({
    ...s,
    cameraChoreography: {
      ...s.cameraChoreography,
      position: [...s.cameraChoreography.position] as [number, number, number],
      target: [...s.cameraChoreography.target] as [number, number, number]
    }
  }));
  const idx = clamp(sceneIndex, 0, scenes.length - 1);
  const scene = scenes[idx];

  // 1. Motion: slower / smoother damping
  if (/(ralenti|lent|amortis|fluide)/.test(lower) && !scene.motionVectors.includes('Amortissement étendu')) {
    scene.motionVectors = `${scene.motionVectors} · Amortissement étendu ×1.5`;
    changes.push('Mouvement : amortissement étendu ×1.5');
  }

  // 2. Camera orientation: mirror the orbit on the X axis
  if (/(autre sens|inverse|tourne|rotation)/.test(lower)) {
    scene.cameraChoreography.position[0] = -scene.cameraChoreography.position[0];
    changes.push('Caméra : orbite miroir sur l’axe X');
  }

  // 3. Timing: "... à 40 %" moves the start of the scene, keeping the scroll tiling intact
  const pct = lower.match(/(\d{1,3})\s*%/);
  if (pct && /(texte|tard|tôt|tot|retard|apparai|commenc|arriv)/.test(lower)) {
    const target = round3(clamp(parseInt(pct[1], 10) / 100, 0, 1));
    const prev = scenes[idx - 1];
    if (!prev) {
      changes.push('Timing ignoré : la première scène doit démarrer à 0 %');
    } else {
      const min = round3(prev.scrollStart + 0.01);
      const max = round3(scene.scrollEnd - 0.01);
      if (target >= min && target <= max) {
        prev.scrollEnd = target;
        scene.scrollStart = target;
        changes.push(`Timing : la scène ${scene.order} démarre à ${Math.round(target * 100)} %`);
      } else {
        changes.push(`Timing ignoré : ${pct[1]} % hors de la plage autorisée ${Math.round(min * 100)}–${Math.round(max * 100)} %`);
      }
    }
  }

  // 4. Depth (exploded view) and lighting
  if (/(profondeur|éclat|eclat)/.test(lower)) {
    scene.explodedDistance = round2(clamp(scene.explodedDistance + 0.2, 0, 1));
    changes.push(`Profondeur : vue éclatée portée à ${scene.explodedDistance}`);
  }
  if (/(spéculaire|speculaire|éclairage|eclairage|lumière|lumiere)/.test(lower) && !scene.lightingDescription.includes('spéculaires renforcés')) {
    scene.lightingDescription = `${scene.lightingDescription} · Reflets spéculaires renforcés`;
    changes.push('Éclairage : reflets spéculaires renforcés');
  }

  // 5. Mobile simplification: halve particle density
  if (/(mobile|simplif|gpu|batterie)/.test(lower)) {
    const before = scene.particleDensity ?? 0;
    scene.particleDensity = Math.floor(before / 2);
    changes.push(`Mobile : densité de particules ${before} → ${scene.particleDensity}`);
  }

  if (changes.length === 0) {
    return { manifest, changes };
  }

  const next = CinematicQualityGate.withAudit({
    ...manifest,
    scenes,
    revisionId: revision('patch')
  });
  return { manifest: next, changes };
}
