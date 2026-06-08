import type { MotifProps } from './index';

export const Wave = ({ accent, accent2 }: MotifProps) => (
  <svg viewBox="0 0 400 200" preserveAspectRatio="none">
    <path d="M0,120 Q100,60 200,120 T400,120 L400,200 L0,200Z" fill={accent + '33'} />
    <path d="M0,140 Q100,90 200,140 T400,140 L400,200 L0,200Z" fill={accent2 + '33'} />
  </svg>
);
