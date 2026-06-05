/** The wireframe's pure-CSS B&W image placeholders, used until real imagery lands (#23). */
const KINDS = ['stripe', 'dot', 'cross', 'solid', 'stripe', 'dot'] as const;
export type PlaceholderKind = (typeof KINDS)[number] | 'lemon';

/** Deterministically pick a placeholder variant from a stable seed (the wireframe's pickKind). */
export function pickKind(seed: string): PlaceholderKind {
  let sum = 0;
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
  return KINDS[sum % KINDS.length]!;
}

export function Placeholder({
  kind,
  label,
  num,
}: {
  kind: PlaceholderKind;
  label?: string;
  num?: string;
}) {
  return (
    <div className={`placeholder placeholder--${kind}`}>
      {label && <span className="placeholder__label">{label}</span>}
      {num && <span className="placeholder__num">{num}</span>}
    </div>
  );
}

/** Format integer cents as the dollar amount only (the markup adds the $ and currency code). */
export function dollars(cents: number): string {
  return (cents / 100).toLocaleString('en-CA', { minimumFractionDigits: 0 });
}

/** Presentation-only catalog number derived from display order (we dropped stored JM-### — ADR D3). */
export function catalogNumber(order: number): string {
  return `JM-${String(order + 1).padStart(3, '0')}`;
}
