
import { FractalType, type FractalParameters, type LightSettings } from './types';

export const AUTO_ROTATE_DELAY = 3000; // ms
export const AUTO_ROTATE_SPEED = 0.002;

export const DEFAULT_FRACTAL_PARAMS: FractalParameters = {
  type: FractalType.SierpinskiTetrahedron,
  level: 2, // Reduced default for performance
  size: 5.1,
  color: '#1E90FF',
};

export const DEFAULT_LIGHT_SETTINGS: LightSettings = {
  ambientIntensity: 0.8,
  directionalIntensity: 1.2,
  directionalPosition: { x: 15, y: 25, z: 30 },
  fillIntensity: 0.5,
  hemisphereIntensity: 0.7,
};

export const MAX_LEVELS: Record<FractalType, number> = {
  [FractalType.SierpinskiTetrahedron]: 10, // Adjusted for performance
  [FractalType.MengerSponge]: 10,          // Adjusted for performance
  [FractalType.SierpinskiOctahedron]: 10,  // Adjusted for performance
};
