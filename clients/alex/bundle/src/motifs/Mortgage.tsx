import type { MotifProps } from './index';
import type { CSSProperties } from 'react';

export const Mortgage = ({ accent, accent2 }: MotifProps) => (
  <div className="mortgage-motif" style={{ '--a': accent, '--b': accent2 } as CSSProperties}>
    <div className="mortgage-glow mortgage-glow-a" />
    <div className="mortgage-glow mortgage-glow-b" />

    <div className="mortgage-header">
      <i />
      <b />
      <span />
    </div>

    <div className="mortgage-summary-card">
      <i />
      <b />
      <span />
    </div>

    <div className="mortgage-chart-card">
      <div className="mortgage-chart-title">
        <i />
        <b />
      </div>

      <div className="mortgage-grid">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>

      <svg className="mortgage-costs" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path className="mortgage-cost-a-fill" d="M 0 88 L 34 58 L 62 35 L 62 88 Z" />
        <path className="mortgage-cost-b-fill" d="M 0 88 L 34 64 L 100 38 L 100 88 Z" />
        <path className="mortgage-cost-a" d="M 0 88 C 16 74, 36 56, 62 35" />
        <path className="mortgage-cost-b" d="M 0 88 C 20 74, 46 58, 100 38" />
        <path className="mortgage-cursor" d="M 48 12 L 48 91" />
      </svg>

      <div className="mortgage-tooltip">
        <i />
        <b />
        <span />
      </div>

      <div className="mortgage-dot mortgage-dot-a" />
      <div className="mortgage-dot mortgage-dot-b" />
    </div>
  </div>
);
