import { useEffect, useState } from 'react';
import { scenes, type Scene } from './scenes';

const pickScene = (w: number, h: number): Scene => {
  const ar = w / h;
  return scenes.reduce((best, s) => {
    const sar = s.width / s.height;
    const bsar = best.width / best.height;
    return Math.abs(sar - ar) < Math.abs(bsar - ar) ? s : best;
  });
};

/** The scene whose intrinsic aspect ratio is closest to the viewport's, recomputed on resize. */
export const useScene = (): Scene => {
  const [scene, setScene] = useState<Scene>(() => pickScene(window.innerWidth, window.innerHeight));
  useEffect(() => {
    const onResize = () => setScene(pickScene(window.innerWidth, window.innerHeight));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return scene;
};
