export type PiiType = "credit_card" | "iban" | "email" | "phone";

export interface DetectedEntity {
  type: PiiType;
  text: string;
  confidence: number;
  /** Offset of the match within the scanned string, used to locate the word boxes that cover it. */
  start: number;
  end: number;
}

/**
 * Patterns are rebuilt per scan rather than shared: a module-level regex with
 * the /g flag carries `lastIndex` between calls, so a shared instance silently
 * skips matches on every other invocation.
 */
const buildPatterns = (): Record<PiiType, RegExp> => ({
  credit_card: /\b(?:\d[ -]*?){13,19}\b/g,
  iban: /\b[A-Z]{2}\d{2}[ ]?(?:[A-Z0-9]{4}[ ]?){2,7}[A-Z0-9]{1,4}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  phone: /(?:\+?\d{1,3}[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b/g,
});

const BASE_CONFIDENCE: Record<PiiType, number> = {
  credit_card: 0.99,
  iban: 0.95,
  email: 0.98,
  phone: 0.9,
};

/** Luhn checksum — rejects the many 13–19 digit runs that are not payment cards. */
export const luhnCheck = (numStr: string): boolean => {
  const clean = numStr.replace(/\D/g, "");
  if (clean.length < 13 || clean.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

/** Checked so an IBAN is not also reported as a phone number underneath it. */
const overlaps = (a: DetectedEntity, b: DetectedEntity): boolean =>
  a.start < b.end && b.start < a.end;

export const detectPiiInText = (text: string): DetectedEntity[] => {
  const patterns = buildPatterns();
  const found: DetectedEntity[] = [];

  // Ordered most to least specific: the first claim on a span wins.
  const order: PiiType[] = ["email", "iban", "credit_card", "phone"];

  for (const type of order) {
    const pattern = patterns[type];
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      const value = match[0];

      // Guard against a zero-width match locking the loop.
      if (match.index === pattern.lastIndex) pattern.lastIndex += 1;

      if (type === "credit_card" && !luhnCheck(value)) continue;

      const entity: DetectedEntity = {
        type,
        text: value,
        confidence: BASE_CONFIDENCE[type],
        start: match.index,
        end: match.index + value.length,
      };

      if (!found.some((existing) => overlaps(existing, entity))) {
        found.push(entity);
      }
    }
  }

  return found.sort((a, b) => a.start - b.start);
};
