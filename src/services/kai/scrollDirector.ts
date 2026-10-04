import { NarrativeScene } from '../../types';

export interface ScrollDirectorState {
  progress: number; // 0.0 to 1.0
  activeSceneIndex: number;
  activeScene: NarrativeScene;
  sceneProgress: number; // 0.0 to 1.0 within active scene
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
  };
  explodedDistance: number; // 0 (assembled) to 1.0 (fully exploded)
  assemblyPercent: number; // 0% to 100%
  particleAlpha: number;
  rotationY: number;
  rotationX: number;
  lightIntensity: number;
  blurPx: number;
  textOpacity: number;
}

export class ScrollDirector {
  private scenes: NarrativeScene[];
  private prefersReducedMotion: boolean = false;

  constructor(scenes: NarrativeScene[], prefersReducedMotion: boolean = false) {
    this.scenes = scenes;
    this.prefersReducedMotion = prefersReducedMotion;
  }

  public setReducedMotion(val: boolean) {
    this.prefersReducedMotion = val;
  }

  /**
   * Resolves the authoritative visual and spatial state for any scroll progress (0.0 to 1.0)
   */
  public resolveState(progress: number): ScrollDirectorState {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    
    // Find active scene
    let activeIndex = 0;
    for (let i = 0; i < this.scenes.length; i++) {
      if (clampedProgress >= this.scenes[i].scrollStart && clampedProgress <= this.scenes[i].scrollEnd) {
        activeIndex = i;
        break;
      }
      if (clampedProgress > this.scenes[i].scrollEnd) {
        activeIndex = i;
      }
    }

    const currentScene = this.scenes[activeIndex];
    const nextScene = this.scenes[Math.min(this.scenes.length - 1, activeIndex + 1)];

    // Calculate progression inside this scene
    const sceneSpan = Math.max(0.001, currentScene.scrollEnd - currentScene.scrollStart);
    const sceneProgress = Math.max(0, Math.min(1, (clampedProgress - currentScene.scrollStart) / sceneSpan));

    // Smooth lerp helper
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    // Reduced motion dampening
    const motionFactor = this.prefersReducedMotion ? 0.15 : 1.0;

    // Camera interpolation between current scene and next scene
    const t = sceneProgress;
    const camPos: [number, number, number] = [
      lerp(currentScene.cameraChoreography.position[0], nextScene.cameraChoreography.position[0], t * motionFactor),
      lerp(currentScene.cameraChoreography.position[1], nextScene.cameraChoreography.position[1], t * motionFactor),
      lerp(currentScene.cameraChoreography.position[2], nextScene.cameraChoreography.position[2], t * motionFactor),
    ];

    const camTarget: [number, number, number] = [
      lerp(currentScene.cameraChoreography.target[0], nextScene.cameraChoreography.target[0], t),
      lerp(currentScene.cameraChoreography.target[1], nextScene.cameraChoreography.target[1], t),
      lerp(currentScene.cameraChoreography.target[2], nextScene.cameraChoreography.target[2], t),
    ];

    const fov = lerp(currentScene.cameraChoreography.fov, nextScene.cameraChoreography.fov, t);

    // Exploded view distance: 1.0 (raw separated) -> 0.0 (assembled)
    const exploded = lerp(currentScene.explodedDistance, nextScene.explodedDistance, t);
    const assembly = lerp(currentScene.assemblyProgress, nextScene.assemblyProgress, t);

    // Dynamic rotation based on scroll progress
    const rotationY = (clampedProgress * Math.PI * 2.2) * motionFactor;
    const rotationX = (Math.sin(clampedProgress * Math.PI) * 0.25) * motionFactor;

    // Particle alpha: high in scene 1 and 2, fades out in assembled product
    const particleAlpha = Math.max(0, 1.0 - (assembly / 90));

    // Text reveals: peaks at middle of scene, subtle fade at edges
    const textOpacity = Math.sin(sceneProgress * Math.PI);

    return {
      progress: clampedProgress,
      activeSceneIndex: activeIndex,
      activeScene: currentScene,
      sceneProgress,
      camera: {
        position: camPos,
        target: camTarget,
        fov
      },
      explodedDistance: Math.max(0, exploded),
      assemblyPercent: Math.round(assembly),
      particleAlpha,
      rotationY,
      rotationX,
      lightIntensity: lerp(0.8, 1.4, clampedProgress),
      blurPx: Math.max(0, (1.0 - textOpacity) * 4),
      textOpacity: Math.max(0.2, textOpacity)
    };
  }
}
