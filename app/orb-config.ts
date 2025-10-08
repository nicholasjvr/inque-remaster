export type OrbConfig = {
  color: string;
  ior: number;
  thickness: number;
  chromaticAberration: number;
  anisotropy: number;
  distortion: number;
  temporalDistortion: number;
  attenuationColor: string;
  attenuationDistance: number;
  bloom: number;
  caX: number;
  caY: number;
  wobbleSpeed: number;
  wobbleAmp: number;
};

export const defaultOrbConfig: OrbConfig = {
  color: '#ffffff',
  ior: 1.5,
  thickness: 0.5,
  chromaticAberration: 0.02,
  anisotropy: 0.3,
  distortion: 0.2,
  temporalDistortion: 0.25,
  attenuationColor: '#ff9cfb',
  attenuationDistance: 0.8,
  bloom: 0.6,
  caX: 0.001,
  caY: -0.001,
  wobbleSpeed: 0.35,
  wobbleAmp: 0.12,
};


