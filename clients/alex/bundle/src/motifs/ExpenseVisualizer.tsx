import type { MotifProps } from './index';
import type { CSSProperties } from 'react';

export const ExpenseVisualizer = ({ accent, accent2 }: MotifProps) => (
  <div
    className="expense-visualizer-motif"
    style={{ '--a': accent, '--b': accent2 } as CSSProperties}
  >
    {/* Hero donut chart */}
    <div className="ev-donut">
      <div className="ev-donut-ring" />
      <div className="ev-donut-sweep" />
      <div className="ev-donut-hole">
        <div className="ev-donut-total" />
        <div className="ev-donut-total ev-donut-total-sub" />
      </div>
    </div>

    {/* Category bar list */}
    <div className="ev-bars">
      {Array.from({ length: 4 }).map((_, i) => (
        <div className="ev-bar-row" key={`ev-row-${i}`}>
          <span className="ev-bar-track">
            <i />
          </span>
        </div>
      ))}
    </div>

    {/* Mini timeseries tile */}
    <div className="ev-spark">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          className="ev-spark-fill"
          d="M 2 70 C 14 66, 22 52, 33 56 S 50 36, 60 44 S 78 22, 98 30 L 98 100 L 2 100 Z"
        />
        <path
          className="ev-spark-line"
          d="M 2 70 C 14 66, 22 52, 33 56 S 50 36, 60 44 S 78 22, 98 30"
        />
      </svg>
      {/* AI spark — conversational-insights nod */}
      <span className="ev-ai-spark" />
    </div>
  </div>
);
