/**
 * Parse age strings from adoption sites into approximate years.
 * Returns null when age cannot be determined.
 */
export function parseAgeYears(age?: string | null): number | null {
  if (!age) return null;

  const lower = age.toLowerCase().trim();

  if (lower.includes("senior")) return 10;
  if (
    lower.includes("kitten") ||
    lower.includes("baby") ||
    /\byoung\b/.test(lower)
  ) {
    return 0;
  }

  const yearsMonths = lower.match(/(\d+)\s*years?\s*(?:\d+\s*months?)?/);
  if (yearsMonths) return parseInt(yearsMonths[1], 10);

  const yearsOnly = lower.match(/(\d+)\s*y(?:rs?|ears?)?\b/);
  if (yearsOnly) return parseInt(yearsOnly[1], 10);

  const monthsOnly = lower.match(/(\d+)\s*months?/);
  if (monthsOnly) return parseInt(monthsOnly[1], 10) / 12;

  return null;
}

/** Returns true if cat is at or over max age (should be excluded). */
export function isOverMaxAge(
  age?: string | null,
  maxYears = 6
): boolean | null {
  const years = parseAgeYears(age);
  if (years !== null) return years >= maxYears;

  if (!age) return null;

  const lower = age.toLowerCase();
  if (lower.includes("senior")) return true;

  return null;
}
