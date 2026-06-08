import type { Animation as AnimationData } from '@csp/blocks';
import { lazy, Suspense } from 'react';
import { motifs } from '../motifs';
import { AccentFill } from './AccentFill';

// Lazy so lottie-web is code-split out of the main bundle and only fetched when an uploaded
// animation is actually rendered (it also touches canvas APIs on import, which jsdom lacks).
const LottiePlayer = lazy(() => import('./LottiePlayer'));

interface Props {
  animation: AnimationData;
  accent: string;
  accent2: string;
}

/**
 * Renders a project's animation on the laptop screen: a built-in motif maps to the CSS-motif registry;
 * an uploaded Lottie animation is fetched and played. This is what lets a new project with a new
 * (uploaded) animation appear with no redeploy.
 */
export const Animation = ({ animation, accent, accent2 }: Props) => {
  if (animation.kind === 'builtin') {
    const Motif = motifs[animation.key];
    return <Motif accent={accent} accent2={accent2} />;
  }
  return (
    <Suspense fallback={<AccentFill />}>
      <LottiePlayer url={animation.url} />
    </Suspense>
  );
};
