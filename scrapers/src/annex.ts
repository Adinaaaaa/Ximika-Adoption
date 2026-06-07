import * as cheerio from "cheerio";
import type { CatRecord } from "@cat-matcher/shared";
import { applyFlagsToCat } from "@cat-matcher/shared";

const LIST_URL = "https://annexcatrescue.ca/adopt/adoptable-cats/";

export async function scrapeAnnex(): Promise<CatRecord[]> {
  const res = await fetch(LIST_URL, {
    headers: { "User-Agent": "CatAdoptionMatcher/1.0 (personal use)" },
  });

  if (!res.ok) {
    throw new Error(`Annex fetch failed: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const bodyText = $("body").text();
  const cats: CatRecord[] = [];

  const blocks = bodyText.split(/(?=\d{7,10})/);

  for (const block of blocks) {
    const idMatch = block.match(/^(\d{7,10})/);
    if (!idMatch) continue;

    const external_id = idMatch[1];
    const afterId = block.slice(external_id.length);

    const sexMatch = afterId.match(/(Male|Female)[/\s]*(Neutered|Spayed)?/i);
    const breedMatch = afterId.match(
      /Domestic\s+(Longhair|Shorthair|Medium\s*Hair)[^A-Z*]*/i
    );
    const ageMatch = afterId.match(
      /(\d+\s+years?\s+\d+\s+months?|\d+\s+years?|\d+\s+months?)/i
    );

    let name =
      afterId.match(/Foster Home\s*([A-Za-z*][^0-9]{2,80}?)(?=\d{7,10}|$)/i)?.[1]?.trim() ??
      afterId.match(/\*MUST BE ADOPTED[^*]*\*|[A-Z][a-z]+(?:\s+[A-Z][a-z*]+)*/)?.[0]?.trim() ??
      `Cat ${external_id}`;

    name = name.replace(/\s+/g, " ").trim();

    const requiresBuddy =
      /must be adopted with|buddy cat|as a buddy/i.test(name) ||
      /must be adopted with|buddy cat|as a buddy/i.test(afterId);

    cats.push(
      applyFlagsToCat({
        source: "annex",
        external_id,
        name,
        sex: sexMatch?.[0] ?? null,
        age: ageMatch?.[0] ?? null,
        breed: breedMatch?.[0]?.trim() ?? null,
        url: `${LIST_URL}#${external_id}`,
        description_text: afterId.trim().slice(0, 2000),
        shelter_name: "Annex Cat Rescue",
        city: "Toronto",
        province: "ON",
        distance_km: 0,
        requires_buddy: requiresBuddy,
        is_bonded_pair: requiresBuddy && /must be adopted with/i.test(afterId),
        is_on_hold: false,
        is_adoption_pending: false,
      })
    );
  }

  const seen = new Set<string>();
  return cats.filter((c) => {
    if (seen.has(c.external_id)) return false;
    seen.add(c.external_id);
    return true;
  });
}
