import type { CSSProperties } from 'react';

export const Bars = () => (
  <div className="bars">
    {[...Array(8)].map((_, i) => (
      <span key={i} style={{ '--i': i } as CSSProperties} />
    ))}
  </div>
);
