/** A neutral accent gradient — shown while an animation loads, or if it fails (never a blank screen). */
export const AccentFill = () => (
  <div
    aria-hidden
    style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--a), var(--b))' }}
  />
);
