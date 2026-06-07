import type { CatRecord, MatchResult, UserPreferences } from "./types";
import { LOCAL_SHELTERS } from "./types";
import { isOverMaxAge, parseAgeYears } from "./age";

const QUIET_KEYWORDS = [
  "quiet",
  "calm",
  "soft-spoken",
  "not vocal",
  "low vocal",
];
const VOCAL_KEYWORDS = ["vocal", "chatty", "talkative", "meows a lot", "loud"];
const SOCIAL_KEYWORDS = [
  "well-socialized",
  "well socialized",
  "friendly",
  "social",
  "good with people",
  "loves people",
  "people-oriented",
];
const AFFECTION_KEYWORDS = [
  "affectionate",
  "cuddly",
  "cuddle",
  "lap cat",
  "loves attention",
  "snuggly",
  "snuggle",
  "purrs",
  "loves to be pet",
];
const SINGLE_PERSON_KEYWORDS = [
  "single person",
  "one person",
  "independent",
  "low-maintenance",
  "low maintenance",
  "content alone",
  "fine on their own",
];
const HIGH_ENERGY_KEYWORDS = [
  "high energy",
  "very playful",
  "kitten energy",
  "needs lots of play",
  "active",
  "hyper",
];

function textIncludes(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function effectiveDistanceKm(cat: CatRecord): number {
  if (cat.distance_km != null) return cat.distance_km;
  const shelter = cat.shelter_name?.toLowerCase() ?? "";
  if (LOCAL_SHELTERS.has(shelter)) return 0;
  if (cat.source === "annex" || cat.source === "ths") return 0;
  return 999;
}

export function passesHardFilters(
  cat: CatRecord,
  prefs: UserPreferences
): { pass: boolean; reason?: string } {
  if (cat.is_active === false) {
    return { pass: false, reason: "No longer available" };
  }

  if (prefs.exclude_on_hold && cat.is_on_hold) {
    return { pass: false, reason: "Currently on hold" };
  }

  if (prefs.solo_cat_only && (cat.requires_buddy || cat.is_bonded_pair)) {
    return { pass: false, reason: "Requires a buddy or bonded pair" };
  }

  if (prefs.exclude_fiv_positive && cat.is_fiv_positive) {
    return { pass: false, reason: "FIV+" };
  }

  if (prefs.exclude_special_needs && cat.is_special_needs) {
    return { pass: false, reason: "Special care needed" };
  }

  if (prefs.exclude_aggression_history && cat.has_aggression_flags) {
    return { pass: false, reason: "Aggression history noted" };
  }

  if (prefs.exclude_long_hair && cat.is_long_hair) {
    return { pass: false, reason: "Long-haired cat" };
  }

  if (prefs.max_age_years > 0) {
    const tooOld = isOverMaxAge(cat.age, prefs.max_age_years);
    if (tooOld === true) {
      return {
        pass: false,
        reason: `${prefs.max_age_years} years or older`,
      };
    }
  }

  const dist = effectiveDistanceKm(cat);
  if (dist > prefs.max_distance_km) {
    return { pass: false, reason: `Too far (${Math.round(dist)} km)` };
  }

  return { pass: true };
}

export function scoreCat(
  cat: CatRecord,
  prefs: UserPreferences
): { score: number; reasons: string[]; is_partial_match: boolean } {
  let score = 0;
  const reasons: string[] = [];
  const desc = (cat.description_text ?? "").toLowerCase();
  const hasDescription = desc.trim().length > 20;

  if (prefs.prefer_quiet) {
    if (cat.vocal_level?.toLowerCase() === "quiet") {
      score += 25;
      reasons.push("Quiet (structured trait)");
    } else if (textIncludes(desc, QUIET_KEYWORDS)) {
      score += 20;
      reasons.push("Quiet temperament mentioned");
    }
    if (textIncludes(desc, VOCAL_KEYWORDS)) {
      score -= 15;
    }
  }

  if (prefs.prefer_well_socialized) {
    if (cat.people_reaction?.toLowerCase() === "friendly") {
      score += 25;
      reasons.push("Friendly with people");
    } else if (textIncludes(desc, SOCIAL_KEYWORDS)) {
      score += 20;
      reasons.push("Well-socialized");
    }
  }

  if (prefs.prefer_affectionate) {
    if (textIncludes(desc, AFFECTION_KEYWORDS)) {
      score += 25;
      reasons.push("Affectionate / cuddly");
    }
  }

  if (prefs.prefer_single_person_ok) {
    if (textIncludes(desc, SINGLE_PERSON_KEYWORDS)) {
      score += 15;
      reasons.push("Good for single-person home");
    }
  }

  if (prefs.prefer_low_energy) {
    if (cat.energy_level?.toLowerCase() === "low") {
      score += 20;
      reasons.push("Low energy");
    }
    const activity = cat.activity_level?.toLowerCase() ?? "";
    if (activity.includes("not active") || activity.includes("slightly active")) {
      score += 15;
      reasons.push("Low activity level");
    }
    if (textIncludes(desc, HIGH_ENERGY_KEYWORDS)) {
      score -= 15;
    }
  }

  if (prefs.small_home) {
    if (cat.indoor_outdoor?.toLowerCase().includes("indoor only")) {
      score += 10;
      reasons.push("Indoor only");
    }
  }

  if (prefs.max_age_years > 0) {
    const years = parseAgeYears(cat.age);
    if (years !== null && years < prefs.max_age_years) {
      score += 10;
      reasons.push("Under max age");
    }
    if (years !== null && years >= prefs.max_age_years) {
      score -= 20;
    }
  }

  if (!hasDescription && !cat.vocal_level && !cat.energy_level) {
    score -= 20;
    return { score, reasons, is_partial_match: true };
  }

  if (
    prefs.max_age_years > 0 &&
    isOverMaxAge(cat.age, prefs.max_age_years) === null
  ) {
    score -= 15;
    return {
      score,
      reasons: [...reasons, "Age unknown — verify on profile"],
      is_partial_match: true,
    };
  }

  if (reasons.length === 0 && hasDescription) {
    reasons.push("Meets all hard filters");
  }

  return { score, reasons, is_partial_match: false };
}

export function matchCats(
  cats: CatRecord[],
  prefs: UserPreferences
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const cat of cats) {
    const filter = passesHardFilters(cat, prefs);
    if (!filter.pass) continue;

    const { score, reasons, is_partial_match } = scoreCat(cat, prefs);
    results.push({ cat, score, reasons, is_partial_match });
  }

  return results.sort((a, b) => {
    if (a.is_partial_match !== b.is_partial_match) {
      return a.is_partial_match ? 1 : -1;
    }
    return b.score - a.score;
  });
}

export function explainExclusion(
  cat: CatRecord,
  prefs: UserPreferences
): string | null {
  return passesHardFilters(cat, prefs).reason ?? null;
}
