import { useEffect, useMemo, useState } from 'react';
import { Leva, useControls, folder, button } from 'leva';
import GlassOrbCanvas from './GlassOrbCanvas';
import type { OrbConfig } from '../orb-config';
import { defaultOrbConfig } from '../orb-config';

const STORAGE_KEY = 'orb-config-v1';
const PRESETS_KEY = 'orb-presets-v1';

type Props = { showControls?: boolean };

export default function GlassOrbWithControls({ showControls = false }: Props) {
  const [initial, setInitial] = useState<OrbConfig>(defaultOrbConfig);

  // load from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setInitial({ ...defaultOrbConfig, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const presets = {
    glassy: { color: '#ffffff', attenuationColor: '#aefaff', ior: 1.45, thickness: 0.28, chromaticAberration: 0.008, anisotropy: 0.2, distortion: 0.08, temporalDistortion: 0.12, attenuationDistance: 0.9, bloom: 0.7, caX: 0.0004, caY: -0.0004, wobbleSpeed: 0.25, wobbleAmp: 0.08 },
    nebula: { color: '#77e1ff', attenuationColor: '#ff9cfb', ior: 1.6, thickness: 0.6, chromaticAberration: 0.028, anisotropy: 0.35, distortion: 0.24, temporalDistortion: 0.3, attenuationDistance: 0.7, bloom: 1.1, caX: 0.001, caY: -0.001, wobbleSpeed: 0.38, wobbleAmp: 0.14 },
    midnight: { color: '#8fd3ff', attenuationColor: '#00e6ff', ior: 1.52, thickness: 0.44, chromaticAberration: 0.012, anisotropy: 0.28, distortion: 0.18, temporalDistortion: 0.22, attenuationDistance: 1.1, bloom: 0.5, caX: 0.0002, caY: -0.0002, wobbleSpeed: 0.2, wobbleAmp: 0.06 }
  } as const;

  // Persisted config controls
  const controls = useControls({
    Orb: folder({
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
    }, { collapsed: false }),
    Presets: folder({
      applyGlassy: button(() => setInitial(prev => ({ ...prev, ...presets.glassy }))),
      applyNebula: button(() => setInitial(prev => ({ ...prev, ...presets.nebula }))),
      applyMidnight: button(() => setInitial(prev => ({ ...prev, ...presets.midnight }))),
      resetDefaults: button(() => setInitial(defaultOrbConfig)),
      clearStorage: button(() => { try { localStorage.removeItem(STORAGE_KEY); } catch {} }),
      saveAs: button(() => {
        const name = typeof window !== 'undefined' ? window.prompt('Save preset as:') : null;
        if (!name) return;
        const presetsMap = readPresets();
        presetsMap[name] = config;
        writePresets(presetsMap);
      }),
      loadByName: button(() => {
        const keys = Object.keys(readPresets());
        const name = typeof window !== 'undefined' ? window.prompt(`Load preset (available: ${keys.join(', ')})`) : null;
        if (!name) return;
        const p = readPresets()[name];
        if (p) setInitial({ ...defaultOrbConfig, ...p });
      }),
      deleteByName: button(() => {
        const keys = Object.keys(readPresets());
        const name = typeof window !== 'undefined' ? window.prompt(`Delete preset (available: ${keys.join(', ')})`) : null;
        if (!name) return;
        const map = readPresets();
        if (map[name]) { delete map[name]; writePresets(map); }
      }),
      exportJSON: button(async () => {
        try { await navigator.clipboard.writeText(JSON.stringify(config, null, 2)); } catch {}
      }),
      importJSON: button(() => {
        const raw = typeof window !== 'undefined' ? window.prompt('Paste preset JSON:') : null;
        if (!raw) return;
        try { const parsed = JSON.parse(raw) as OrbConfig; setInitial({ ...defaultOrbConfig, ...parsed }); } catch {}
      }),
    }, { collapsed: true })
  });

  const config: OrbConfig = useMemo(() => ({ ...defaultOrbConfig, ...controls }), [controls]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch {}
  }, [config]);

  // simple helpers to persist user presets
  function readPresets(): Record<string, OrbConfig> {
    try {
      const raw = localStorage.getItem(PRESETS_KEY);
      return raw ? JSON.parse(raw) as Record<string, OrbConfig> : {};
    } catch { return {}; }
  }
  function writePresets(presetsMap: Record<string, OrbConfig>) {
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(presetsMap)); } catch {}
  }

  return (
    <>
      {showControls ? (
        <div className="orb-leva" style={{ position: 'fixed', top: 12, right: 12, zIndex: 9999, pointerEvents: 'auto' }}>
          <Leva collapsed={false} oneLineLabels theme={{ sizes: { rootWidth: '320px' } }} />
        </div>
      ) : null}
      <GlassOrbCanvas config={config} />
    </>
  );
}
