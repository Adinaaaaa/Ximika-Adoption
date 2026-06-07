export type CatSource =
  | "petfinder"
  | "adoptapet"
  | "annex"
  | "ths"
  | "tcr"
  | "rehome"
  | "petplace"
  | "rescuegroups";

export interface CatRecord {
  id?: string;
  source: CatSource;
  external_id: string;
  name: string;
  sex?: string | null;
  age?: string | null;
  breed?: string | null;
  url: string;
  photo_url?: string | null;
  description_text?: string | null;
  shelter_name?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  lat?: number | null;
  lon?: number | null;
  distance_km?: number | null;
  energy_level?: string | null;
  vocal_level?: string | null;
  activity_level?: string | null;
  people_reaction?: string | null;
  indoor_outdoor?: string | null;
  coat_length?: string | null;
  requires_buddy: boolean;
  is_bonded_pair: boolean;
  is_on_hold: boolean;
  is_adoption_pending: boolean;
  is_fiv_positive: boolean;
  is_special_needs: boolean;
  has_aggression_flags: boolean;
  is_long_hair: boolean;
  is_active?: boolean;
  first_seen_at?: string;
  last_seen_at?: string;
}

export interface UserPreferences {
  postal_code: string;
  max_distance_km: number;
  solo_cat_only: boolean;
  exclude_fiv_positive: boolean;
  exclude_special_needs: boolean;
  exclude_aggression_history: boolean;
  exclude_long_hair: boolean;
  min_age_years: number;
  prefer_quiet: boolean;
  prefer_well_socialized: boolean;
  prefer_affectionate: boolean;
  prefer_single_person_ok: boolean;
  prefer_low_energy: boolean;
  small_home: boolean;
  exclude_on_hold: boolean;
}

export interface MatchResult {
  cat: CatRecord;
  score: number;
  reasons: string[];
  is_partial_match: boolean;
  excluded_reason?: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  postal_code: "M5S2M6",
  max_distance_km: 130,
  solo_cat_only: true,
  exclude_fiv_positive: true,
  exclude_special_needs: true,
  exclude_aggression_history: true,
  exclude_long_hair: true,
  min_age_years: 6,
  prefer_quiet: true,
  prefer_well_socialized: true,
  prefer_affectionate: true,
  prefer_single_person_ok: true,
  prefer_low_energy: true,
  small_home: true,
  exclude_on_hold: true,
};

/** Shelters within Toronto — treat unknown distance as local. */
export const LOCAL_SHELTERS = new Set([
  "toronto humane society",
  "annex cat rescue",
  "toronto cat rescue",
]);
