import type { MotifProps } from './index';
import type { CSSProperties } from 'react';

export const AverageCost = ({ accent, accent2 }: MotifProps) => (
  <div className="average-cost-motif" style={{ '--a': accent, '--b': accent2 } as CSSProperties}>
    <div className="average-cost-cards">
      <div className="average-cost-card average-cost-card-a">
        <i />
        <b />
        <span />
      </div>
      <div className="average-cost-card average-cost-card-b">
        <i />
        <b />
        <span />
      </div>
    </div>

    <div className="average-cost-chart">
      <div className="average-cost-grid">
        <i />
        <i />
        <i />
        <i />
      </div>

      <svg className="average-cost-line" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          pathLength="170"
          d="M 0 50 C 6 16, 12 16, 18 50 S 30 84, 36 50 S 48 14, 54 50 S 66 86, 72 50 S 84 18, 90 50 L 100 55"
        />
      </svg>

      <svg className="average-cost-baseline" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 0 66 L 100 66" />
      </svg>

      <div className="average-cost-anomaly average-cost-anomaly-a" />
      <div className="average-cost-anomaly average-cost-anomaly-b" />
    </div>

    <div className="average-cost-slider">
      <i />
      <b />
    </div>
  </div>
);
