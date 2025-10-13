'use client';

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, MeshTransmissionMaterial, Sphere, Billboard, useTexture } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import type { OrbConfig } from '../orb-config';
import type { Group } from 'three';
import { AdditiveBlending, LinearFilter } from 'three';

function WobblingSphere({ config }: { config: OrbConfig }) {
  const safe = useMemo(() => ({
    wobbleAmp: config.wobbleAmp,
    wobbleSpeed: config.wobbleSpeed,
  }), [config.wobbleAmp, config.wobbleSpeed]);

  let t = 0;
  useFrame((_, delta) => {
    t += delta * safe.wobbleSpeed;
    const rx = Math.sin(t * 1.1) * safe.wobbleAmp;
    const ry = Math.cos(t * 0.9) * safe.wobbleAmp;
    const g = groupRef.current;
    if (g) {
      g.rotation.x = rx;
      g.rotation.y = ry;
    }
  });
  const groupRef = useRef<Group | null>(null);
  return (
    <group ref={groupRef}>
      <Sphere args={[1.0, 128, 128]}>
        <MeshTransmissionMaterial
          color={config.color}
          ior={config.ior}
          thickness={config.thickness}
          chromaticAberration={config.chromaticAberration}
          anisotropy={config.anisotropy}
          distortion={config.distortion}
          temporalDistortion={config.temporalDistortion}
          attenuationColor={config.attenuationColor}
          attenuationDistance={config.attenuationDistance}
          samples={8}
          resolution={256}
        />
      </Sphere>
    </group>
  );
}

export function GlassOrbCanvas({ config }: { config: OrbConfig }) {
  const safe = useMemo(() => ({
    ...config,
    bloom: Math.max(0, config.bloom),
    thickness: Math.max(0.01, config.thickness),
    ior: Math.min(Math.max(config.ior, 1.0), 2.5),
  }), [config]);

  return (
    <Canvas
      camera={{ fov: 32, position: [0, 0, 3.2] }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <Environment preset="sunset" resolution={256} />

        {/* Wobbling glass sphere */}
        <MysticPortal />
        <WobblingSphere config={safe} />

        {/* Simple idle wobble via group rotation driven by R3F state */}
        {/* Post effects */}
        <EffectComposer>
          <Bloom intensity={safe.bloom} mipmapBlur />
          <ChromaticAberration offset={[safe.caX, safe.caY]} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}

export default GlassOrbCanvas;

function MysticPortal() {
  const tex = useTexture('/maxime-hemon-gif-solo-portal.gif');
  // Soften and improve animated gif sampling
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  return (
    <Billboard position={[0, 0, -0.02]}>
      <mesh>
        <planeGeometry args={[2.7, 2.7]} />
        <meshBasicMaterial
          map={tex}
          transparent
          opacity={0.38}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </Billboard>
  );
}


