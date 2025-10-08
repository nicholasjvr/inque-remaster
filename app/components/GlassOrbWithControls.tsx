import { useEffect, useMemo, useState } from 'react';
import { Leva, useControls } from 'leva';
import GlassOrbCanvas from './GlassOrbCanvas';
import type { OrbConfig } from '../orb-config';
import { defaultOrbConfig } from '../orb-config';

const STORAGE_KEY = 'orb-config-v1';

export default function GlassOrbWithControls() {
  const [initial, setInitial] = useState<OrbConfig>(defaultOrbConfig);

  // load from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setInitial({ ...defaultOrbConfig, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const controls = useControls('Orb', {
    color: { value: initial.color },
    attenuationColor: { value: initial.attenuationColor },
    ior: { value: initial.ior, min: 1.0, max: 2.5, step: 0.01 },
    thickness: { value: initial.thickness, min: 0.01, max: 2, step: 0.01 },
    chromaticAberration: { value: initial.chromaticAberration, min: 0, max: 0.1, step: 0.001 },
    anisotropy: { value: initial.anisotropy, min: 0, max: 1, step: 0.01 },
    distortion: { value: initial.distortion, min: 0, max: 1, step: 0.01 },
    temporalDistortion: { value: initial.temporalDistortion, min: 0, max: 1, step: 0.01 },
    attenuationDistance: { value: initial.attenuationDistance, min: 0, max: 2, step: 0.01 },
    bloom: { value: initial.bloom, min: 0, max: 2, step: 0.01 },
    caX: { value: initial.caX, min: -0.01, max: 0.01, step: 0.0005 },
    caY: { value: initial.caY, min: -0.01, max: 0.01, step: 0.0005 },
    wobbleSpeed: { value: initial.wobbleSpeed, min: 0, max: 2, step: 0.01 },
    wobbleAmp: { value: initial.wobbleAmp, min: 0, max: 0.5, step: 0.005 },
  });

  const config: OrbConfig = useMemo(() => ({ ...defaultOrbConfig, ...controls }), [controls]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch {}
  }, [config]);

  return (
    <>
      <Leva collapsed={true} oneLineLabels hideCopyButton theme={{ sizes: { rootWidth: '320px' } }} />
      <GlassOrbCanvas config={config} />
    </>
  );
}
