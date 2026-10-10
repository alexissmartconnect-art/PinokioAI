import { QualityGateCheck, QualityGateStatus, ExperienceManifest, ExperienceStrategy, CinematicCapability } from '../../types';

/** Capability that must be present in the manifest for each concrete strategy. */
export const STRATEGY_CAPABILITY: Partial<Record<ExperienceStrategy, CinematicCapability>> = {
  TRUE_3D: 'TRUE_3D_PRODUCT',
  VIDEO_SCROLL: 'SCROLL_SCRUB_VIDEO',
  IMAGE_SEQUENCE: 'IMAGE_SEQUENCE_SCROLL',
  HYBRID: 'HYBRID_3D_VIDEO_DOM'
};

const WEBGL_STRATEGIES: ExperienceStrategy[] = ['TRUE_3D', 'HYBRID', 'WEBGL_EFFECT'];

const sumMb = (kb: number) => Math.round((kb / 1024) * 100) / 100;

export class CinematicQualityGate {
  /**
   * Runs engineering diagnostics computed from the manifest itself.
   * Checks that cannot be verified from the manifest (compilation, runtime FPS) are reported
   * as NOT_TESTED instead of being declared PASS.
   */
  public static runAudit(manifest: ExperienceManifest): {
    overallStatus: QualityGateStatus;
    checks: QualityGateCheck[];
    summary: string;
  } {
    const checks: QualityGateCheck[] = [];

    // 1. Build: not verifiable from a manifest
    checks.push({
      id: 'chk-build-01',
      name: 'Compilation TypeScript & build Vite',
      category: 'build',
      status: 'NOT_TESTED',
      message: 'Non vérifiable depuis le manifeste. Exécuter `npm run lint` puis `npm run build`.',
      metric: 'hors runtime'
    });

    // 2. Narrative continuity: scenes must tile [0, 1] without gaps or overlaps
    const scenes = [...manifest.scenes].sort((a, b) => a.scrollStart - b.scrollStart);
    let narrativeGap: string | null = null;
    if (scenes.length === 0) {
      narrativeGap = 'aucune scène';
    } else if (scenes[0].scrollStart !== 0 || scenes[scenes.length - 1].scrollEnd !== 1) {
      narrativeGap = 'la narration ne couvre pas 0 % → 100 %';
    } else {
      for (let i = 0; i < scenes.length; i++) {
        if (scenes[i].scrollEnd <= scenes[i].scrollStart) {
          narrativeGap = `scène ${scenes[i].order} de durée nulle ou négative`;
          break;
        }
        if (i > 0 && Math.abs(scenes[i].scrollStart - scenes[i - 1].scrollEnd) > 1e-6) {
          narrativeGap = `trou ou chevauchement entre les scènes ${scenes[i - 1].order} et ${scenes[i].order}`;
          break;
        }
      }
    }
    checks.push({
      id: 'chk-narr-01',
      name: 'Continuité de la narration au scroll',
      category: 'narrative',
      status: narrativeGap ? 'FAIL' : 'PASS',
      message: narrativeGap
        ? `Narration discontinue : ${narrativeGap}.`
        : `${scenes.length} scènes couvrent 0 → 100 % sans trou ni chevauchement.`,
      metric: `${scenes.length} scènes`
    });

    // 3. Scene parameters must be physically sane
    const badScenes = manifest.scenes.filter((s) =>
      s.cameraChoreography.fov < 15 ||
      s.cameraChoreography.fov > 75 ||
      s.cameraChoreography.position.some((v) => !Number.isFinite(v)) ||
      s.explodedDistance < 0 || s.explodedDistance > 1 ||
      s.assemblyProgress < 0 || s.assemblyProgress > 100
    );
    checks.push({
      id: 'chk-narr-02',
      name: 'Paramètres caméra & assemblage valides',
      category: 'narrative',
      status: badScenes.length === 0 ? 'PASS' : 'FAIL',
      message: badScenes.length === 0
        ? 'FOV entre 15° et 75°, positions finies, éclatement et assemblage bornés.'
        : `Paramètres hors bornes : ${badScenes.map((s) => s.name).join(', ')}.`,
      metric: 'FOV 15–75°'
    });

    // 4. Strategy coherence: manifest capabilities must match the chosen strategy
    const expectedCap = STRATEGY_CAPABILITY[manifest.strategy];
    const strategyOk = !expectedCap || manifest.subCapabilities.includes(expectedCap);
    checks.push({
      id: 'chk-strat-01',
      name: 'Cohérence stratégie ↔ capacités',
      category: 'strategy',
      status: strategyOk ? 'PASS' : 'FAIL',
      message: strategyOk
        ? `La stratégie ${manifest.strategy} est déclarée par ses capacités.`
        : `La stratégie ${manifest.strategy} n’a pas sa capacité ${expectedCap} dans le manifeste.`,
      metric: manifest.strategy
    });

    // 5. Responsive fallback
    if (!manifest.fallbacks?.mobileStrategy) {
      checks.push({
        id: 'chk-resp-01',
        name: 'Stratégie de dégradation mobile',
        category: 'responsive',
        status: 'FAIL',
        message: 'Aucune stratégie de repli mobile n’est configurée dans le manifeste.'
      });
    } else if (manifest.fallbacks.mobileStrategy === 'TRUE_3D') {
      checks.push({
        id: 'chk-resp-01',
        name: 'Stratégie de dégradation mobile',
        category: 'responsive',
        status: 'WARNING',
        message: `Le repli mobile est TRUE_3D : rendu 3D lourd sur appareils contraints. Préférer HYBRID ou DOM_MOTION.`,
        metric: `Breakpoint <= ${manifest.breakpoints.mobileMaxPx}px`
      });
    } else {
      checks.push({
        id: 'chk-resp-01',
        name: 'Stratégie de dégradation mobile',
        category: 'responsive',
        status: 'PASS',
        message: `Repli mobile vers ${manifest.fallbacks.mobileStrategy} sous ${manifest.breakpoints.mobileMaxPx}px.`,
        metric: `Breakpoint <= ${manifest.breakpoints.mobileMaxPx}px`
      });
    }

    // 6. Reduced motion
    if (!manifest.fallbacks?.reducedMotionStrategy) {
      checks.push({
        id: 'chk-a11y-01',
        name: 'Support prefers-reduced-motion',
        category: 'motion',
        status: 'WARNING',
        message: 'Aucun repli motion réduite : risque pour les utilisateurs sensibles au mouvement.'
      });
    } else {
      const reduced = manifest.fallbacks.reducedMotionStrategy === 'DOM_MOTION';
      checks.push({
        id: 'chk-a11y-01',
        name: 'Support prefers-reduced-motion',
        category: 'motion',
        status: reduced ? 'PASS' : 'WARNING',
        message: reduced
          ? 'Repli DOM_MOTION (sans rotation 3D continue) en cas de préférence système.'
          : `Repli ${manifest.fallbacks.reducedMotionStrategy} : DOM_MOTION est recommandé pour la motion réduite.`,
        metric: 'prefers-reduced-motion: reduce'
      });
    }

    // 7. WebGL context discipline
    const usesWebGL = WEBGL_STRATEGIES.includes(manifest.strategy);
    const webglOk = manifest.performanceBudget.maxWebGLContexts <= 1;
    checks.push({
      id: 'chk-webgl-01',
      name: 'Discipline contexte WebGL unique',
      category: 'performance',
      status: webglOk ? 'PASS' : usesWebGL ? 'FAIL' : 'WARNING',
      message: webglOk
        ? 'Un seul contexte WebGL partagé : pas de fuite mémoire GPU.'
        : `${manifest.performanceBudget.maxWebGLContexts} contextes WebGL demandés : risque de perte de contexte.`,
      metric: `${manifest.performanceBudget.maxWebGLContexts} canvas WebGL`
    });

    // 8. Media weight vs budget (only assets that are actually loaded)
    const loaded = manifest.assetPlan.filter((a) => a.status !== 'ASSET_MISSING' && a.status !== 'ASSET_OPTIONAL');
    const totalMb = sumMb(loaded.reduce((acc, a) => acc + a.estimatedWeightKb, 0));
    const mediaBudget = manifest.performanceBudget.maxMediaWeightMb;
    checks.push({
      id: 'chk-perf-01',
      name: 'Budget poids média chargé',
      category: 'performance',
      status: totalMb <= mediaBudget ? 'PASS' : 'WARNING',
      message: totalMb <= mediaBudget
        ? `Poids chargé ${totalMb} MB sous le budget de ${mediaBudget} MB.`
        : `Poids chargé ${totalMb} MB dépasse le budget de ${mediaBudget} MB (connexions mobiles).`,
      metric: `${totalMb} / ${mediaBudget} MB`
    });

    // 9. 3D asset weight vs budget
    const model3dMb = sumMb(manifest.assetPlan.filter((a) => a.type === '3d_model' && a.status !== 'ASSET_MISSING')
      .reduce((acc, a) => acc + a.estimatedWeightKb, 0));
    const model3dBudget = manifest.performanceBudget.max3dAssetWeightMb;
    checks.push({
      id: 'chk-perf-02',
      name: 'Budget poids modèle 3D',
      category: 'performance',
      status: model3dMb <= model3dBudget ? 'PASS' : 'WARNING',
      message: model3dMb <= model3dBudget
        ? `Modèle 3D ${model3dMb} MB sous le budget de ${model3dBudget} MB.`
        : `Modèle 3D ${model3dMb} MB dépasse le budget de ${model3dBudget} MB.`,
      metric: `${model3dMb} / ${model3dBudget} MB`
    });

    // 10. Asset resilience
    const missing = manifest.assetPlan.filter((a) => a.status === 'ASSET_MISSING');
    const unresolved = missing.filter((a) => !a.fallbackStrategy);
    checks.push({
      id: 'chk-asset-01',
      name: 'Disponibilité & résilience des assets',
      category: 'assets',
      status: unresolved.length > 0 ? 'FAIL' : missing.length > 0 ? 'WARNING' : 'PASS',
      message: unresolved.length > 0
        ? `${unresolved.length} asset(s) manquant(s) sans repli : ${unresolved.map((a) => a.name).join(', ')}.`
        : missing.length > 0
          ? `${missing.length} asset(s) manquant(s), repli procédural actif.`
          : `Les ${manifest.assetPlan.length} assets ont une source ou un repli.`,
      metric: `${manifest.assetPlan.length - missing.length}/${manifest.assetPlan.length} assets disponibles`
    });

    // 11. Video decoding (only relevant for VIDEO_SCROLL)
    checks.push(manifest.strategy === 'VIDEO_SCROLL'
      ? {
          id: 'chk-video-01',
          name: 'Synchronisation vidéo au scroll',
          category: 'performance',
          status: 'NOT_TESTED',
          message: 'Scrub vidéo actif : la fluidité réelle dépend du décodeur matériel et doit être mesurée à l’exécution.'
        }
      : {
          id: 'chk-video-01',
          name: 'Décodage vidéo matériel',
          category: 'performance',
          status: 'NOT_TESTED',
          message: `Non applicable à la stratégie ${manifest.strategy}.`
        });

    // Overall: only tested checks count
    const tested = checks.filter((c) => c.status !== 'NOT_TESTED');
    let overallStatus: QualityGateStatus = 'PASS';
    if (tested.some((c) => c.status === 'FAIL')) overallStatus = 'FAIL';
    else if (tested.some((c) => c.status === 'WARNING')) overallStatus = 'WARNING';

    const count = (st: QualityGateStatus) => checks.filter((c) => c.status === st).length;
    const summary = `${count('PASS')} validés · ${count('WARNING')} avertissement(s) · ${count('FAIL')} échec(s) · ${count('NOT_TESTED')} non testé(s).`;

    return { overallStatus, checks, summary };
  }

  /** Returns a copy of the manifest with its quality gate re-computed. */
  public static withAudit(manifest: ExperienceManifest): ExperienceManifest {
    const audit = this.runAudit(manifest);
    return { ...manifest, qualityGateChecks: audit.checks, overallQualityStatus: audit.overallStatus };
  }
}
