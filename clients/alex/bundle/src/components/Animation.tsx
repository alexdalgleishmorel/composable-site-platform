import type { Animation as AnimationData } from '@csp/blocks';
import { motifs } from '../motifs';

interface Props {
  animation: AnimationData;
  accent: string;
  accent2: string;
}

/**
 * Renders a project's animation on the laptop screen. A built-in motif maps to the CSS-motif registry;
 * an uploaded Lottie animation is played in U5 (#72) — until then it shows a neutral accent fill so
 * the screen is never blank.
 */
export const Animation = ({ animation, accent, accent2 }: Props) => {
  if (animation.kind === 'builtin') {
    const Motif = motifs[animation.key];
    return <Motif accent={accent} accent2={accent2} />;
  }
  return (
    <div
      aria-hidden
      style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--a), var(--b))' }}
    />
  );
};
