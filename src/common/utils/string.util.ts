/**
 * String manipulation and normalization utilities
 */

/**
 * Trim leading/trailing whitespace and collapse multiple consecutive spaces into a single space.
 */
export function cleanWhitespace(value?: string | null): string {
  if (!value || typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Convert string to Title Case (Capitalizes first letter of each word, rest lowercase).
 * Collapses redundant spaces and handles hyphenated compound words.
 *
 * @example
 * toTitleCase("ram Kumar") // "Ram Kumar"
 * toTitleCase("  mumbai  ") // "Mumbai"
 * toTitleCase("NEW YORK") // "New York"
 * toTitleCase("acme   technologies  pvt   ltd") // "Acme Technologies Pvt Ltd"
 */
export function toTitleCase(value?: string | null): string {
  const cleaned = cleanWhitespace(value);
  if (!cleaned) return '';

  return cleaned
    .toLowerCase()
    .split(' ')
    .map((word) =>
      word
        .split('-')
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ''))
        .join('-'),
    )
    .join(' ');
}

/**
 * Clean and lowercase email address, removing any accidental spaces.
 *
 * @example
 * cleanEmail("  John.Doe@Acme.Com  ") // "john.doe@acme.com"
 */
export function cleanEmail(value?: string | null): string {
  if (!value || typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, '').toLowerCase();
}

/**
 * Clean phone number: remove extra leading/trailing/multiple internal spaces.
 *
 * @example
 * cleanPhone("  +91  98765   43210  ") // "+91 98765 43210"
 */
export function cleanPhone(value?: string | null): string {
  if (!value || typeof value !== 'string') return '';
  return cleanWhitespace(value);
}
