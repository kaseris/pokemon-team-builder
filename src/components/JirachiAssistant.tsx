import { Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { Box3, Vector3 } from 'three';
import type { Group, Object3D } from 'three';

const CANVAS_SIZE = 192;

useGLTF.preload('/models/jirachi.glb');

function centerInWorld(object: Object3D, targetSize = 1.15) {
  // Reset first so measurement is from the pristine pose and the result is
  // idempotent regardless of any prior transform.
  object.position.set(0, 0, 0);
  object.scale.setScalar(1);
  object.updateMatrixWorld(true);

  const box = new Box3().setFromObject(object);
  const center = box.getCenter(new Vector3());
  const size = box.getSize(new Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / maxDim;

  // Apply scale, then translate by the *scaled* center so the model lands
  // exactly on the world origin (translation isn't affected by object.scale).
  object.scale.setScalar(scale);
  object.position.copy(center).multiplyScalar(-scale);
  object.updateMatrixWorld(true);
}

// Bones we animate, paired with their rest-pose rotation so we can drive them
// relative to the bind pose instead of accumulating drift each frame.
type RiggedBone = { bone: Object3D; restX: number; restY: number; restZ: number };

function collectBones(root: Object3D, names: string[]): RiggedBone[] {
  const bones: RiggedBone[] = [];
  for (const name of names) {
    const bone = root.getObjectByName(name);
    if (bone) {
      bones.push({
        bone,
        restX: bone.rotation.x,
        restY: bone.rotation.y,
        restZ: bone.rotation.z,
      });
    }
  }
  return bones;
}

// One backflip lasts this long, in seconds.
const FLIP_DURATION = 0.85;

// Idle wave cadence: a wave starts every WAVE_INTERVAL seconds and lasts
// WAVE_DURATION; otherwise Jirachi rests still.
const WAVE_INTERVAL = 6;
const WAVE_DURATION = 1.8;

// Smooth ease-in-out so the flip accelerates and lands softly.
function easeInOutCubic(p: number) {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

// Per-frame bone animation lives in module-level helpers. The bones belong to
// the memoized model, and mutating them inline in the component would trip
// React's immutability lint; driving Object3D transforms imperatively is the
// normal react-three-fiber pattern, so we do it behind a function boundary.
function applyHeadBob(bones: RiggedBone[], t: number) {
  for (const { bone, restX } of bones) {
    bone.rotation.x = restX + Math.sin(t * 6) * 0.12; // medium-fast nod
  }
}

function applyWave(bones: RiggedBone[], env: number, wiggle: number) {
  bones.forEach(({ bone, restZ }, i) => {
    if (i === 0) {
      bone.rotation.z = restZ + env * 1.1; // raise the upper arm out to the side
    } else {
      bone.rotation.z = restZ + env * (0.3 + wiggle * 0.4); // forearm does the wave
    }
  });
}

// Drop the model down in the canvas (world units) so there's clear space above
// his head for the speech bubble to sit without overlapping.
const MODEL_Y = -0.15;

function JirachiModel() {
  // useGLTF returns a *shared, cached* scene instance. centerInWorld() mutates
  // position/scale in place and isn't idempotent, so reusing that instance
  // across mounts (e.g. toggling the assistant off/on) makes the model drift
  // and rescale. Clone per-mount so every mount starts from the pristine model.
  // SkeletonUtils.clone (not Object3D.clone) keeps the SkinnedMesh bound to its
  // skeleton so the rig still animates.
  const { scene } = useGLTF('/models/jirachi.glb');
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const groupRef = useRef<Group>(null);

  // Backflip state, kept in a ref so triggering it never re-renders.
  const flip = useRef({ active: false, elapsed: 0 });

  // The GLB ships a rig but no animation clips, so we drive these bones by hand.
  // waveArm[0] is the upper arm (raise), waveArm[1] the forearm (the wiggle).
  const waveArm = useMemo(() => collectBones(model, ['LArm', 'LForeArm']), [model]);
  const headBone = useMemo(() => collectBones(model, ['Head']), [model]);

  useLayoutEffect(() => {
    centerInWorld(model);
  }, [model]);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;

    // Rest pose: face forward, no spin.
    g.rotation.set(0, 0, 0);
    g.position.y = MODEL_Y;

    // Continuous medium-fast head bob.
    applyHeadBob(headBone, t);

    // Periodic LArm wave.
    const phase = t % WAVE_INTERVAL;
    const waving = phase < WAVE_DURATION;
    const env = waving ? Math.sin((phase / WAVE_DURATION) * Math.PI) : 0; // 0→1→0
    const wiggle = waving ? Math.sin(phase * 18) : 0;
    applyWave(waveArm, env, wiggle);

    g.position.y = MODEL_Y + env * 0.04;

    // Signature backflip on hover overrides the rest pose with one full backward
    // rotation about X plus a hop, then settles back down.
    if (flip.current.active) {
      flip.current.elapsed += delta;
      const p = Math.min(flip.current.elapsed / FLIP_DURATION, 1);
      g.rotation.x = -easeInOutCubic(p) * Math.PI * 2;
      g.position.y += Math.sin(p * Math.PI) * 0.35;
      if (p >= 1) {
        flip.current.active = false;
        flip.current.elapsed = 0;
        g.rotation.x = 0;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[0, 0, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        // Ignore re-entries while a flip is already in progress.
        if (!flip.current.active) {
          flip.current.active = true;
          flip.current.elapsed = 0;
        }
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
      }}
    >
      <primitive object={model} />
    </group>
  );
}

function JirachiScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.5], fov: 32, near: 0.1, far: 20 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
      style={{
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        display: 'block',
        background: 'transparent',
        // Re-enable hit-testing on the canvas (the widget wrapper is
        // pointer-events-none) so R3F can raycast the model for hover.
        pointerEvents: 'auto',
      }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x000000, 0);
        camera.lookAt(0, 0, 0);
      }}
    >
      <ambientLight intensity={0.95} />
      <directionalLight position={[1.5, 3, 2]} intensity={1.1} />
      <directionalLight position={[-1.5, 0.5, -1]} intensity={0.35} />
      <Suspense fallback={null}>
        <JirachiModel />
      </Suspense>
    </Canvas>
  );
}

function JirachiAssistantWidget() {
  return (
    <div
      className="pointer-events-none fixed left-6 bottom-6 z-[45] flex flex-col items-center"
      aria-hidden="true"
    >
      <div
        className="relative z-10 -mb-8 rounded-xl border border-border/80 bg-surface-raised/90 px-3 py-2 shadow-sm backdrop-blur-sm"
      >
        <p className="text-xs font-medium text-foreground">How can I help?</p>
        {/* Tail pointing down toward Jirachi, connecting the bubble to him. */}
        <div
          className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] border-b border-r border-border/80 bg-surface-raised/90"
        />
      </div>

      <Suspense fallback={null}>
        <JirachiScene />
      </Suspense>
    </div>
  );
}

export function JirachiAssistant() {
  return createPortal(<JirachiAssistantWidget />, document.body);
}
