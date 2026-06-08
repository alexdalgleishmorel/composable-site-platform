import type { MotifProps } from './index';
import type { CSSProperties } from 'react';

export const FlowReport = ({ accent, accent2 }: MotifProps) => (
  <div
    className="flow-report-motif"
    style={{ '--a': accent, '--b': accent2 } as CSSProperties}
  >
    <div className="flow-report-panel flow-report-panel-a">
      <div className="flow-report-mini-bars">
        {Array.from({ length: 24 }).map((_, i) => (
          <i key={`mini-a-${i}`} />
        ))}
      </div>
    </div>

    <div className="flow-report-panel flow-report-panel-b">
      <div className="flow-report-mini-bars">
        {Array.from({ length: 24 }).map((_, i) => (
          <i key={`mini-b-${i}`} />
        ))}
      </div>
    </div>

    <div className="flow-report-chart">
      <div className="flow-report-bars">
        {Array.from({ length: 24 }).map((_, i) => (
          <i key={`bar-${i}`} />
        ))}
      </div>

      <svg className="flow-report-temp" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 3 62 C 12 64, 21 61, 28 66 S 40 49, 48 42 S 62 31, 71 36 S 82 59, 97 62" />
      </svg>
    </div>
  </div>
);
