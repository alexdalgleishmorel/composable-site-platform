/**
 * Derive a display name and avatar initials from the signed-in email. Our session only carries an
 * email (no display-name claim), so the account UI synthesises a friendly label from the local part.
 */

/** Up-to-two-letter initials, e.g. "jack.dalgleish-morel@x.com" → "JD". */
export function initialsOf(email: string): string {
  const local = email.split('@')[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  const letters =
    parts.length >= 2 ? (parts[0]![0] ?? '') + (parts[1]![0] ?? '') : local.slice(0, 2) || '?';
  return letters.toUpperCase();
}

/** Title-cased name from the local part, e.g. "jack.dalgleish-morel@x.com" → "Jack Dalgleish Morel". */
export function displayName(email: string): string {
  const local = email.split('@')[0] ?? email;
  const words = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1));
  return words.join(' ') || email;
}
