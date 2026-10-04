import { ExperienceManifest } from '../../types';
import { CreativeDirector } from './creativeDirector';
import { CinematicQualityGate } from './qualityGate';

export function createDemoGenesisWatchProject(): ExperienceManifest {
  const prompt = "Crée-moi une expérience premium pour cette montre mécanique. Je veux voir la matière brute, les pièces, le mécanisme, puis la montre qui s'assemble progressivement pendant le scroll.";
  
  const directorOutput = CreativeDirector.planExperience(prompt, undefined, false, false);

  const manifest: ExperienceManifest = {
    experienceId: 'exp-aethelgard-genesis-t33',
    title: 'Aethelgard Genesis Tourbillon T33 — Expérience Cinématique',
    version: '1.0.0-phase5',
    strategy: 'HYBRID', // Legitimately combining high-fidelity WebGL procedural PBR + DOM motion
    subCapabilities: directorOutput.subCapabilities,
    brief: directorOutput.brief,
    scenes: directorOutput.scenes,
    assetPlan: directorOutput.assetPlan,
    performanceBudget: directorOutput.performanceBudget,
    breakpoints: {
      mobileMaxPx: 640,
      tabletMaxPx: 1024,
      desktopMinPx: 1025
    },
    fallbacks: {
      mobileStrategy: 'DOM_MOTION',
      reducedMotionStrategy: 'DOM_MOTION',
      offlineMediaFallback: 'Génération procédurale de maillage géométrique PBR'
    },
    localMediaDependencies: [
      { engine: 'WanGP (Pinokio Local)', registered: true, available: true },
      { engine: 'LTX Director v1.3.25', registered: true, available: true },
      { engine: 'Three.js Native WebGL Canvas', registered: true, available: true }
    ],
    externalDependencies: [
      'three',
      'motion',
      'lucide-react'
    ],
    qualityGateChecks: [],
    overallQualityStatus: 'PASS',
    revisionId: 'rev-001-init',
    createdAt: new Date().toISOString()
  };

  // Run initial Quality Gate audit
  const audit = CinematicQualityGate.runAudit(manifest);
  manifest.qualityGateChecks = audit.checks;
  manifest.overallQualityStatus = audit.overallStatus;

  return manifest;
}
