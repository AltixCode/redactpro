export type PiiType = 'credit_card' | 'iban' | 'email' | 'phone';

export interface DetectedEntity {
  type: PiiType;
  text: string;
  confidence: number;
}

export const REGEX_PATTERNS = {
  credit_card: /\b(?:\d[ -]*?){13,16}\b/g,
  iban: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  phone: /\b(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g,
};

/**
 * Validates a credit card number using Luhn's algorithm.
 */
export const luhnCheck = (numStr: string): boolean => {
  const clean = numStr.replace(/\D/g, '');
  if (clean.length < 13 || clean.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

/**
 * Detects all sensitive PII entities in an input string.
 */
export const detectPiiInText = (text: string): DetectedEntity[] => {
  const entities: DetectedEntity[] = [];

  // Emails
  const emailMatches = text.match(REGEX_PATTERNS.email) || [];
  emailMatches.forEach((m) => {
    entities.push({ type: 'email', text: m, confidence: 0.98 });
  });

  // Phone numbers
  const phoneMatches = text.match(REGEX_PATTERNS.phone) || [];
  phoneMatches.forEach((m) => {
    entities.push({ type: 'phone', text: m, confidence: 0.9 });
  });

  // IBAN
  const ibanMatches = text.match(REGEX_PATTERNS.iban) || [];
  ibanMatches.forEach((m) => {
    entities.push({ type: 'iban', text: m, confidence: 0.95 });
  });

  // Payment Cards
  const ccMatches = text.match(REGEX_PATTERNS.credit_card) || [];
  ccMatches.forEach((m) => {
    if (luhnCheck(m)) {
      entities.push({ type: 'credit_card', text: m, confidence: 0.99 });
    }
  });

  return entities;
};
