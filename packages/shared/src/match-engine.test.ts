import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  matchCats,
  passesHardFilters,
  DEFAULT_PREFERENCES,
} from "../src/index";
import type { CatRecord } from "../src/types";

const baseCat: CatRecord = {
  source: "ths",
  external_id: "test-1",
  name: "Whiskers",
  url: "https://example.com/whiskers",
  description_text:
    "A quiet, affectionate lap cat. Well-socialized and friendly. Good for a single person home.",
  shelter_name: "Toronto Humane Society",
  distance_km: 0,
  vocal_level: "Quiet",
  energy_level: "Low",
  people_reaction: "Friendly",
  requires_buddy: false,
  is_bonded_pair: false,
  is_on_hold: false,
  is_adoption_pending: false,
  is_fiv_positive: false,
  is_special_needs: false,
  has_aggression_flags: false,
  is_long_hair: false,
  is_active: true,
};

describe("match engine", () => {
  it("matches ideal cat", () => {
    const results = matchCats([baseCat], DEFAULT_PREFERENCES);
    assert.equal(results.length, 1);
    assert.ok(results[0].score > 50);
  });

  it("excludes long hair", () => {
    const longHair = {
      ...baseCat,
      url: "https://example.com/longhair",
      breed: "Domestic Longhair/Mix",
      is_long_hair: true,
    };
    assert.equal(passesHardFilters(longHair, DEFAULT_PREFERENCES).pass, false);
  });

  it("excludes bonded pairs", () => {
    const bonded = {
      ...baseCat,
      url: "https://example.com/bonded",
      name: "Barney *MUST BE ADOPTED WITH FRED*",
      requires_buddy: true,
      is_bonded_pair: true,
    };
    assert.equal(passesHardFilters(bonded, DEFAULT_PREFERENCES).pass, false);
  });

  it("excludes FIV+", () => {
    const fiv = {
      ...baseCat,
      url: "https://example.com/fiv",
      is_fiv_positive: true,
    };
    assert.equal(passesHardFilters(fiv, DEFAULT_PREFERENCES).pass, false);
  });

  it("allows cats under 6 years", () => {
    const young = {
      ...baseCat,
      url: "https://example.com/young",
      age: "2 Years 2 Months",
    };
    assert.equal(passesHardFilters(young, DEFAULT_PREFERENCES).pass, true);
  });

  it("excludes cats 6 years and older", () => {
    const mature = {
      ...baseCat,
      url: "https://example.com/mature",
      age: "8 Years 9 Months",
    };
    assert.equal(passesHardFilters(mature, DEFAULT_PREFERENCES).pass, false);
  });
});
