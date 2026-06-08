import type { PortfolioProject } from '@csp/blocks';
import type { CSSProperties } from 'react';
import { Animation } from './Animation';

interface Props {
  project: PortfolioProject;
  reducedMotion: boolean;
}

export const ProjectScreen = ({ project, reducedMotion }: Props) => {
  const { accent, accent2, animation } = project;
  const motifClass = animation.kind === 'builtin' ? `ps-motif-${animation.key}` : 'ps-motif-lottie';
  return (
    <div className="ps-root">
      <div
        className={`ps-motif ${motifClass} ${reducedMotion ? 'ps-static' : ''}`}
        style={{ '--a': accent, '--b': accent2 } as CSSProperties}
      >
        <Animation animation={animation} accent={accent} accent2={accent2} />
      </div>
    </div>
  );
};
