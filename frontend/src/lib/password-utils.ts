/**
 * Generates a cryptographically secure random password.
 * Uses Web Crypto API (crypto.getRandomValues) — no Math.random().
 * Guarantees: 1 uppercase, 1 lowercase, 1 digit, 1 symbol, 16 chars total.
 * Excludes ambiguous characters: 0, O, I, l, 1.
 */
export function generateSecurePassword(length: number = 16): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*?";
  const all = upper + lower + digits + symbols;

  const secureRandom = (max: number): number => {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  };

  const pick = (charset: string) => charset[secureRandom(charset.length)];

  // Guarantee at least 1 from each category
  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)];

  // Fill remaining chars
  const remaining = Array.from({ length: length - 4 }, () => pick(all));

  // Fisher-Yates shuffle
  const chars = [...required, ...remaining];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandom(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
