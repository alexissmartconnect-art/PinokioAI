import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  NarrativeScene, 
  ExperienceStrategy, 
  VisualInspectorElement 
} from '../types';
import { ScrollDirectorState } from '../services/kai/scrollDirector';
import { 
  Layers, 
  Eye, 
  Sparkles, 
  Maximize2, 
  RotateCw, 
  Activity, 
  Zap,
  Sliders,
  CheckCircle2
} from 'lucide-react';

interface CinematicViewportProps {
  scrollState: ScrollDirectorState;
  activeStrategy: ExperienceStrategy;
  onSelectInspectorElement?: (element: VisualInspectorElement) => void;
  selectedElementId?: string;
  isReducedMotion?: boolean;
}

export const CinematicViewport: React.FC<CinematicViewportProps> = ({
  scrollState,
  activeStrategy,
  onSelectInspectorElement,
  selectedElementId,
  isReducedMotion = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Real-time FPS monitoring (not fake)
  const [fps, setFps] = useState<number>(60);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());

  // 3D Scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const partsGroupRef = useRef<THREE.Group | null>(null);

  // Discrete 3D Part refs for exploded view
  const watchPartsRef = useRef<{
    caseMesh?: THREE.Mesh;
    bezelMesh?: THREE.Mesh;
    crystalMesh?: THREE.Mesh;
    dialMesh?: THREE.Mesh;
    tourbillonGroup?: THREE.Group;
    gearTrainGroup?: THREE.Group;
    handsGroup?: THREE.Group;
    particles?: THREE.Points;
  }>({});

  // Mouse interaction for Scene 5
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const userRotationRef = useRef({ x: 0, y: 0 });

  // Initialize Three.js scene once
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 520;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.5);
    cameraRef.current = camera;

    // 3. Renderer with strict single-context discipline
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    // 4. Lighting Choreography
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 1.8); // 3200K warm luxury light
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x8bc34a, 1.2); // Cool rim light
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    const studioLight = new THREE.PointLight(0x60a5fa, 1.4, 15); // Subtle cobalt glow
    studioLight.position.set(0, -3, 2);
    scene.add(studioLight);

    // 5. Build Procedural Watch Assembly (Titanium, Sapphire, Rubies, Gold gears)
    const masterGroup = new THREE.Group();
    partsGroupRef.current = masterGroup;
    scene.add(masterGroup);

    // A. Main Titanium Case (Octagonal / sculpted)
    const caseGeo = new THREE.CylinderGeometry(1.4, 1.45, 0.35, 8);
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0x24272c,
      roughness: 0.25,
      metalness: 0.95,
    });
    const caseMesh = new THREE.Mesh(caseGeo, caseMat);
    masterGroup.add(caseMesh);
    watchPartsRef.current.caseMesh = caseMesh;

    // B. Bezel (Brushed Titanium ring with bevels)
    const bezelGeo = new THREE.TorusGeometry(1.35, 0.12, 16, 8);
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x3a3f47,
      roughness: 0.18,
      metalness: 0.98,
    });
    const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
    bezelMesh.rotation.x = Math.PI / 2;
    bezelMesh.position.y = 0.18;
    masterGroup.add(bezelMesh);
    watchPartsRef.current.bezelMesh = bezelMesh;

    // C. Sapphire Crystal (Transparent refractive disc)
    const crystalGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.04, 32);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.92,
      opacity: 0.85,
      transparent: true,
      roughness: 0.05,
      ior: 1.77, // Real Sapphire index of refraction
      reflectivity: 0.6,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.position.y = 0.28;
    masterGroup.add(crystalMesh);
    watchPartsRef.current.crystalMesh = crystalMesh;

    // D. Dial & Skeleton Bridges Plate
    const dialGeo = new THREE.CylinderGeometry(1.22, 1.22, 0.05, 32);
    const dialMat = new THREE.MeshStandardMaterial({
      color: 0x14181f,
      roughness: 0.4,
      metalness: 0.8,
    });
    const dialMesh = new THREE.Mesh(dialGeo, dialMat);
    dialMesh.position.y = 0.06;
    masterGroup.add(dialMesh);
    watchPartsRef.current.dialMesh = dialMesh;

    // E. Gear Train Group (Brass / Gold gears)
    const gearTrainGroup = new THREE.Group();
    gearTrainGroup.position.y = 0.1;
    const gearMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Gold alloy
      roughness: 0.22,
      metalness: 0.9,
    });

    for (let i = 0; i < 4; i++) {
      const gGeo = new THREE.CylinderGeometry(0.35 - i * 0.06, 0.35 - i * 0.06, 0.03, 16);
      const gMesh = new THREE.Mesh(gGeo, gearMat);
      gMesh.position.set(Math.cos(i * 1.5) * 0.45, 0.02 * i, Math.sin(i * 1.5) * 0.45);
      gearTrainGroup.add(gMesh);
    }
    masterGroup.add(gearTrainGroup);
    watchPartsRef.current.gearTrainGroup = gearTrainGroup;

    // F. Tourbillon Cage & Balance Wheel at 6 o'clock
    const tourbillonGroup = new THREE.Group();
    tourbillonGroup.position.set(0, 0.12, 0.55);

    const cageGeo = new THREE.TorusGeometry(0.3, 0.025, 8, 24);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Electric blue titanium bridge
      roughness: 0.2,
      metalness: 0.95,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    cageMesh.rotation.x = Math.PI / 2;
    tourbillonGroup.add(cageMesh);

    // Ruby jewel in the center
    const rubyGeo = new THREE.OctahedronGeometry(0.08, 2);
    const rubyMat = new THREE.MeshPhysicalMaterial({
      color: 0xe11d48, // Ruby synthetic red
      transmission: 0.7,
      transparent: true,
      roughness: 0.1,
    });
    const rubyMesh = new THREE.Mesh(rubyGeo, rubyMat);
    tourbillonGroup.add(rubyMesh);

    masterGroup.add(tourbillonGroup);
    watchPartsRef.current.tourbillonGroup = tourbillonGroup;

    // G. Hands Group (Skeletonized Blue & Rose Gold Hands)
    const handsGroup = new THREE.Group();
    handsGroup.position.y = 0.22;

    const handMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.15,
      metalness: 0.9,
    });

    const hourHandGeo = new THREE.BoxGeometry(0.06, 0.02, 0.6);
    const hourHand = new THREE.Mesh(hourHandGeo, handMat);
    hourHand.position.z = 0.3;
    handsGroup.add(hourHand);

    const minuteHandGeo = new THREE.BoxGeometry(0.04, 0.02, 0.9);
    const minuteHand = new THREE.Mesh(minuteHandGeo, handMat);
    minuteHand.position.z = 0.45;
    minuteHand.rotation.y = Math.PI / 3;
    handsGroup.add(minuteHand);

    masterGroup.add(handsGroup);
    watchPartsRef.current.handsGroup = handsGroup;

    // H. Atmospheric Sparking Particles (Raw Material & Machining stage)
    const pCount = 180;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i += 3) {
      pPositions[i] = (Math.random() - 0.5) * 5;
      pPositions[i + 1] = (Math.random() - 0.5) * 4;
      pPositions[i + 2] = (Math.random() - 0.5) * 5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.045,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);
    watchPartsRef.current.particles = particles;

    // 6. Resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 7. Render Loop with real 60fps monitor
    let animId: number;
    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);

      // Measure real FPS
      frameCountRef.current++;
      if (time - lastFpsTimeRef.current >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (time - lastFpsTimeRef.current)));
        frameCountRef.current = 0;
        lastFpsTimeRef.current = time;
      }

      // Continuous mechanical movement (tourbillon & gears)
      if (watchPartsRef.current.tourbillonGroup) {
        watchPartsRef.current.tourbillonGroup.rotation.y += 0.04;
      }
      if (watchPartsRef.current.gearTrainGroup) {
        watchPartsRef.current.gearTrainGroup.rotation.y += 0.015;
      }
      if (watchPartsRef.current.particles) {
        watchPartsRef.current.particles.rotation.y += 0.002;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Three.js scene dynamically when scrollState changes
  useEffect(() => {
    if (!partsGroupRef.current || !cameraRef.current) return;

    const {
      camera,
      explodedDistance,
      assemblyPercent,
      rotationY,
      rotationX,
      particleAlpha,
      lightIntensity
    } = scrollState;

    // 1. Camera position and FOV
    cameraRef.current.position.set(camera.position[0], camera.position[1], camera.position[2]);
    cameraRef.current.lookAt(camera.target[0], camera.target[1], camera.target[2]);
    cameraRef.current.fov = camera.fov;
    cameraRef.current.updateProjectionMatrix();

    // 2. Master group orientation (Scroll rotation + user drag rotation in Scene 5)
    partsGroupRef.current.rotation.y = rotationY + userRotationRef.current.y;
    partsGroupRef.current.rotation.x = rotationX + userRotationRef.current.x;

    // 3. Exploded View choreography:
    // Separate parts along Y axis when explodedDistance > 0
    const parts = watchPartsRef.current;
    const factor = isReducedMotion ? explodedDistance * 0.3 : explodedDistance;

    if (parts.crystalMesh) {
      parts.crystalMesh.position.y = 0.28 + factor * 1.5;
    }
    if (parts.bezelMesh) {
      parts.bezelMesh.position.y = 0.18 + factor * 1.0;
    }
    if (parts.handsGroup) {
      parts.handsGroup.position.y = 0.22 + factor * 0.7;
    }
    if (parts.dialMesh) {
      parts.dialMesh.position.y = 0.06 + factor * 0.3;
    }
    if (parts.gearTrainGroup) {
      parts.gearTrainGroup.position.y = 0.10 - factor * 0.4;
    }
    if (parts.tourbillonGroup) {
      parts.tourbillonGroup.position.y = 0.12 - factor * 0.8;
    }
    if (parts.caseMesh) {
      parts.caseMesh.position.y = -factor * 0.9;
    }

    // 4. Particle opacity fade
    if (parts.particles) {
      const mat = parts.particles.material as THREE.PointsMaterial;
      mat.opacity = particleAlpha * 0.85;
      parts.particles.visible = particleAlpha > 0.02;
    }
  }, [scrollState, isReducedMotion]);

  // Interactive 360° mouse drag on the completed watch (Scene 5)
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    userRotationRef.current.y += deltaX * 0.008;
    userRotationRef.current.x += deltaY * 0.008;

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full h-[540px] sm:h-[620px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#090b10] via-[#05070a] to-[#020305] border border-slate-800 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
    >
      {/* Three.js Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Narrative Scene Typography Layer (Hybrid kinetic overlay) */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 sm:p-10 z-10">
        
        {/* Top bar info */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest text-amber-400 font-bold uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              SCÈNE {scrollState.activeScene.order} / 5 : {scrollState.activeScene.name}
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
              {scrollState.activeScene.headline}
            </h2>
          </div>

          {/* Strategy badge */}
          <div className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-mono text-slate-300 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Stratégie: <strong className="text-white">{activeStrategy}</strong></span>
          </div>
        </div>

        {/* Center / Bottom Subhead and dynamic data */}
        <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
          <div className="max-w-lg space-y-2">
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed drop-shadow-lg">
              {scrollState.activeScene.subhead}
            </p>

            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span>Focus : <strong className="text-amber-200">{scrollState.activeScene.visualFocus}</strong></span>
            </div>
          </div>

          {/* Assembly Gauge */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-right space-y-1 min-w-[140px] pointer-events-auto">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Assemblage
            </div>
            <div className="text-2xl font-black text-white font-mono flex items-baseline justify-end gap-1">
              <span>{scrollState.assemblyPercent}</span>
              <span className="text-xs text-amber-400 font-bold">%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${scrollState.assemblyPercent}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Floating 360° Drag Hint in Scene 5 */}
      {scrollState.activeScene.order === 5 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-amber-400/40 text-[11px] text-amber-200 font-mono flex items-center gap-2 animate-bounce pointer-events-none">
          <RotateCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Glissez la souris pour faire pivoter le garde-temps à 360°</span>
        </div>
      )}

      {/* Developer Diagnostics HUD */}
      <div className="absolute top-4 right-4 z-20 hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-slate-800/80 font-mono text-[10px] text-slate-300 pointer-events-none">
        <span className="flex items-center gap-1 text-green-400">
          <Activity className="w-3 h-3" />
          <span>{fps} FPS</span>
        </span>
        <span className="text-slate-600">•</span>
        <span>Scroll: <strong>{Math.round(scrollState.progress * 100)}%</strong></span>
        <span className="text-slate-600">•</span>
        <span>Éclaté: <strong>{(scrollState.explodedDistance * 100).toFixed(0)}%</strong></span>
        <span className="text-slate-600">•</span>
        <span>Context WebGL: <strong>1</strong></span>
      </div>

    </div>
  );
};
