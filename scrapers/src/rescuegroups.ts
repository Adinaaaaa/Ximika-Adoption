import type { CatRecord } from "@cat-matcher/shared";
import { applyFlagsToCat } from "@cat-matcher/shared";

const API_BASE = "https://api.rescuegroups.org/v5/public";
const POSTAL = process.env.SCRAPE_POSTAL_CODE ?? "M5S2M6";
const DISTANCE_MILES = 80; // ~130 km

interface RgAnimal {
  type: string;
  id: string;
  attributes: Record<string, unknown>;
}

interface RgResponse {
  data?: RgAnimal[];
  meta?: { pagination?: { total?: number; currentPage?: number; lastPage?: number } };
}

export async function scrapeRescueGroups(): Promise<CatRecord[]> {
  const apiKey = process.env.RESCUEGROUPS_API_KEY;
  if (!apiKey) {
    console.warn("RESCUEGROUPS_API_KEY not set — skipping RescueGroups");
    return [];
  }

  const cats: CatRecord[] = [];
  let page = 1;
  let lastPage = 1;

  while (page <= lastPage && page <= 20) {
    const body = {
      filters: [
        { fieldName: "species.singular", operation: "equals", criteria: "Cat" },
        {
          fieldName: "locations.distance",
          operation: "radius",
          criteria: `${POSTAL}:${DISTANCE_MILES}`,
        },
      ],
      fields: {
        animals: [
          "name",
          "ageString",
          "sex",
          "breedString",
          "descriptionText",
          "url",
          "pictureThumbnailUrl",
          "energyLevel",
          "vocalLevel",
          "activityLevel",
          "newPeopleReaction",
          "indoorOutdoor",
          "coatLength",
          "isSpecialNeeds",
          "isAdoptionPending",
          "distance",
        ],
        orgs: ["name", "city", "state", "postalcode"],
      },
      limit: 100,
      page,
    };

    const res = await fetch(`${API_BASE}/animals/search/available`, {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Authorization: apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`RescueGroups API ${res.status}: ${await res.text()}`);
    }

    const json = (await res.json()) as RgResponse;
    lastPage = json.meta?.pagination?.lastPage ?? 1;

    for (const item of json.data ?? []) {
      const a = item.attributes;
      const org = (a as { org?: { data?: { attributes?: Record<string, string> } } }).org?.data
        ?.attributes;

      const distanceMiles = a.distance as number | undefined;
      const distanceKm = distanceMiles != null ? distanceMiles * 1.60934 : null;

      cats.push(
        applyFlagsToCat({
          source: "rescuegroups",
          external_id: item.id,
          name: (a.name as string) ?? "Unknown",
          sex: (a.sex as string) ?? null,
          age: (a.ageString as string) ?? null,
          breed: (a.breedString as string) ?? null,
          url: (a.url as string) ?? `https://rescuegroups.org/pet/${item.id}`,
          photo_url: (a.pictureThumbnailUrl as string) ?? null,
          description_text: (a.descriptionText as string) ?? null,
          shelter_name: org?.name ?? null,
          city: org?.city ?? null,
          province: org?.state ?? "ON",
          postal_code: org?.postalcode ?? null,
          distance_km: distanceKm,
          energy_level: (a.energyLevel as string) ?? null,
          vocal_level: (a.vocalLevel as string) ?? null,
          activity_level: (a.activityLevel as string) ?? null,
          people_reaction: (a.newPeopleReaction as string) ?? null,
          indoor_outdoor: (a.indoorOutdoor as string) ?? null,
          coat_length: (a.coatLength as string) ?? null,
          requires_buddy: false,
          is_bonded_pair: false,
          is_on_hold: false,
          is_adoption_pending: (a.isAdoptionPending as boolean) ?? false,
          is_fiv_positive: false,
          is_special_needs: (a.isSpecialNeeds as boolean) ?? false,
          has_aggression_flags: false,
          is_long_hair: (a.coatLength as string)?.toLowerCase() === "long",
        })
      );
    }

    page++;
  }

  return cats;
}
