import type { MotifProps } from './index';
import type { CSSProperties } from 'react';

export const PokerFlow = ({ accent, accent2 }: MotifProps) => (
  <div
    className="poker-flow-motif"
    style={{ '--a': accent, '--b': accent2 } as CSSProperties}
  >
    <div className="poker-flow-stats">
      <div>
        <i />
        <b />
      </div>
      <div>
        <i />
        <b />
      </div>
    </div>

    <div className="poker-flow-table">
      <div className="poker-flow-ring poker-flow-ring-outer" />
      <div className="poker-flow-ring poker-flow-ring-inner" />
      <div className="poker-flow-cards">
        <i />
        <i />
      </div>
      <div className="poker-flow-chip poker-flow-chip-a" />
      <div className="poker-flow-chip poker-flow-chip-b" />
    </div>

  </div>
);
