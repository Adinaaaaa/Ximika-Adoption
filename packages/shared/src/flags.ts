import type { CatRecord } from "./types";

const FIV_PATTERNS = [
  /\bfiv\s*\+?\b/i,
  /\bfiv[\s-]?positive\b/i,
  /\bfiv[\s-]?pos\b/i,
];

const SPECIAL_NEEDS_PATTERNS = [
  /\bspecial\s+needs?\b/i,
  /\bmedical\s+care\b/i,
  /\bdaily\s+(meds?|medication)\b/i,
  /\bdiabetic\b/i,
  /\bkidney\s+disease\b/i,
  /\bblind\b/i,
  /\bdeaf\b/i,
  /\brequires?\s+(ongoing|special)\s+care\b/i,
  /\bmedication\s+required\b/i,
];

const AGGRESSION_PATTERNS = [
  /\baggressive\b/i,
  /\bbite\s+history\b/i,
  /\bbites?\s+(people|humans|handlers?)\b/i,
  /\bscratches?\s+people\b/i,
  /\bnot\s+good\s+with\s+handling\b/i,
  /\bfear\s+aggressive\b/i,
  /\bbehavioral\s+issues?\b/i,
  /\bhas\s+bitten\b/i,
];

const BUDDY_PATTERNS = [
  /\bmust\s+be\s+adopted\s+with\b/i,
  /\bbuddy\s+cat\b/i,
  /\bbonded\s+pair\b/i,
  /\bas\s+a\s+pair\b/i,
  /\badopted\s+as\s+a\s+buddy\b/i,
  /\bneeds?\s+(a\s+)?(cat|feline)\s+(friend|companion)\b/i,
  /\bonly\s+pet\s+if\s+you\s+have\s+another\s+cat\b/i,
];

const LONG_HAIR_BREED_PATTERNS = [
  /\blong[\s-]?hair/i,
  /\bdomestic\s+longhair\b/i,
  /\bmaine\s+coon\b/i,
  /\bpersian\b/i,
  /\bragdoll\b/i,
  /\bnorwegian\s+forest\b/i,
  /\bsiberian\b/i,
  /\bbirman\b/i,
  /\bturkish\s+angora\b/i,
  /\bturkish\s+van\b/i,
  /\bscottish\s+fold\s+long\b/i,
  /\bmedium[\s-]?long\s+hair\b/i,
];

export function detectFlags(
  text: string,
  breed?: string | null,
  coatLength?: string | null
): Pick<
  CatRecord,
  | "requires_buddy"
  | "is_bonded_pair"
  | "is_fiv_positive"
  | "is_special_needs"
  | "has_aggression_flags"
  | "is_long_hair"
> {
  const combined = `${text} ${breed ?? ""} ${coatLength ?? ""}`.trim();

  const requires_buddy =
    BUDDY_PATTERNS.some((p) => p.test(combined)) ||
    /\*MUST BE ADOPTED/i.test(combined);

  const is_bonded_pair =
    requires_buddy &&
    (/\bbonded\b/i.test(combined) ||
      /\bmust\s+be\s+adopted\s+with\b/i.test(combined) ||
      /\*MUST BE ADOPTED WITH\b/i.test(combined));

  const is_fiv_positive = FIV_PATTERNS.some((p) => p.test(combined));
  const is_special_needs = SPECIAL_NEEDS_PATTERNS.some((p) => p.test(combined));
  const has_aggression_flags = AGGRESSION_PATTERNS.some((p) =>
    p.test(combined)
  );

  const is_long_hair =
    LONG_HAIR_BREED_PATTERNS.some((p) => p.test(combined)) ||
    /^long$/i.test(coatLength?.trim() ?? "") ||
    coatLength?.toLowerCase() === "long";

  return {
    requires_buddy,
    is_bonded_pair,
    is_fiv_positive,
    is_special_needs,
    has_aggression_flags,
    is_long_hair,
  };
}

export function applyFlagsToCat(
  cat: Omit<
    CatRecord,
    | "requires_buddy"
    | "is_bonded_pair"
    | "is_fiv_positive"
    | "is_special_needs"
    | "has_aggression_flags"
    | "is_long_hair"
  > &
    Partial<
      Pick<
        CatRecord,
        | "requires_buddy"
        | "is_bonded_pair"
        | "is_fiv_positive"
        | "is_special_needs"
        | "has_aggression_flags"
        | "is_long_hair"
      >
    >
): CatRecord {
  const detected = detectFlags(
    `${cat.name} ${cat.description_text ?? ""}`,
    cat.breed,
    cat.coat_length
  );

  return {
    ...cat,
    requires_buddy: cat.requires_buddy ?? detected.requires_buddy,
    is_bonded_pair: cat.is_bonded_pair ?? detected.is_bonded_pair,
    is_fiv_positive: cat.is_fiv_positive ?? detected.is_fiv_positive,
    is_special_needs: cat.is_special_needs ?? detected.is_special_needs,
    has_aggression_flags:
      cat.has_aggression_flags ?? detected.has_aggression_flags,
    is_long_hair: cat.is_long_hair ?? detected.is_long_hair,
    is_on_hold: cat.is_on_hold ?? false,
    is_adoption_pending: cat.is_adoption_pending ?? false,
  };
}
