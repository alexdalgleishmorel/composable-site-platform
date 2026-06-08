export interface Bbox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Scene {
  src: string;
  width: number;
  height: number;
  bbox: Bbox;
}

/**
 * The four background renders + the magenta "laptop screen" bounding box (as % of the scene) for each
 * aspect ratio. Pure presentation — carried over verbatim from the standalone portfolio.
 */
export const scenes: Scene[] = [
  {
    src: '/scene-wide.png',
    width: 1916,
    height: 821,
    bbox: { left: 17.19, top: 42.23, width: 20.27, height: 28.08 },
  },
  {
    src: '/scene.png',
    width: 1672,
    height: 941,
    bbox: { left: 18.68, top: 41.58, width: 25.98, height: 27.15 },
  },
  {
    src: '/scene-square.png',
    width: 1448,
    height: 1086,
    bbox: { left: 19.42, top: 46.56, width: 27.11, height: 21.7 },
  },
  {
    src: '/scene-mobile.png',
    width: 941,
    height: 1672,
    bbox: { left: 25.64, top: 53.97, width: 45.85, height: 15.99 },
  },
];
