import * as cheerio from "cheerio";
import type { CatRecord, CatSource } from "@cat-matcher/shared";
import { applyFlagsToCat } from "@cat-matcher/shared";
import { sleep } from "./db";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html" },
  });
  if (!res.ok) throw new Error(`Fetch ${url}: ${res.status}`);
  return res.text();
}

/** Parse Adopt-a-Pet searchtools portable pet list (used by Toronto Cat Rescue). */
export function parsePortablePetList(
  html: string,
  source: CatSource,
  defaults: {
    shelter_name: string;
    city?: string;
    province?: string;
    distance_km?: number;
  }
): CatRecord[] {
  const $ = cheerio.load(html);
  const cats: CatRecord[] = [];
  const base = "https://www.adoptapet.com";

  $("tr").each((_, row) => {
    const $row = $(row);
    const link = $row.find('a[href*="/pet/"]').first().attr("href");
    if (!link) return;

    const name = $row.find("td.name").text().trim() || $row.find("a[href*='/pet/']").first().text().trim();
    if (!name) return;

    const url = link.startsWith("http") ? link : `${base}${link}`;
    const external_id = url.match(/(\d+)/)?.[1] ?? url;
    const breed = $row.find("td.breed").text().trim() || null;
    const cells = $row.find("td").toArray().map((td) => $(td).text().trim());
    const age = cells.find((c) => /young|adult|senior|kitten|month|year/i.test(c)) ?? null;
    const sex = cells.find((c) => /^(male|female)$/i.test(c)) ?? null;
    const photo_url = $row.find("img").first().attr("src") ?? null;

    cats.push(
      applyFlagsToCat({
        source,
        external_id,
        name,
        sex,
        age,
        breed,
        url,
        photo_url,
        description_text: `${name}. ${breed ?? ""}. ${age ?? ""}. ${sex ?? ""}`.trim(),
        shelter_name: defaults.shelter_name,
        city: defaults.city ?? "Toronto",
        province: defaults.province ?? "ON",
        distance_km: defaults.distance_km ?? 0,
        requires_buddy: false,
        is_bonded_pair: false,
        is_on_hold: false,
        is_adoption_pending: false,
      })
    );
  });

  const seen = new Set<string>();
  return cats.filter((c) => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });
}

export async function collectAdoptapetLinks(listingUrl: string): Promise<string[]> {
  const html = await fetchHtml(listingUrl);
  const matches = html.match(/https:\/\/www\.adoptapet\.com\/pet\/\d+[^"'\\s]*/g) ?? [];
  const relative = html.match(/\/pet\/\d+[^"'\\s]*/g) ?? [];
  const links = new Set<string>();
  matches.forEach((l) => links.add(l.split("?")[0]));
  relative.forEach((l) => links.add(`https://www.adoptapet.com${l.split("?")[0]}`));
  return [...links];
}

export async function scrapeAdoptapetProfileFetch(
  url: string,
  source: CatSource,
  defaults: {
    shelter_name?: string;
    city?: string;
    province?: string;
    distance_km?: number;
  } = {}
): Promise<CatRecord | null> {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const name = $("h1").first().text().trim();
  if (!name) return null;

  const bodyText = $("body").text();
  const description =
    $("[class*='description'], [data-test='pet-description']").first().text().trim() ||
    bodyText.slice(0, 4000);
  const photo_url =
    $("img[src*='adoptapet'], img[src*='cloudfront'], img[src*='pet-uploads']")
      .first()
      .attr("src") ?? null;

  const external_id = url.match(/(\d+)/)?.[1] ?? url;
  const isRehome =
    /rehome by adopt|private owner|rehoming/i.test(bodyText) &&
    !/shelter|rescue group/i.test(bodyText.slice(0, 500));

  return applyFlagsToCat({
    source,
    external_id,
    name,
    sex: bodyText.match(/\b(Male|Female)\b/i)?.[1] ?? null,
    age:
      bodyText.match(/\b(\d+\s+years?\s+\d+\s+months?|\d+\s+years?|\d+\s+months?|Senior|Adult|Young|Kitten)\b/i)?.[0] ??
      null,
    breed: bodyText.match(/Breed[:\s]+([^\n]+)/i)?.[1]?.trim() ?? null,
    url,
    photo_url,
    description_text: description,
    shelter_name:
      defaults.shelter_name ??
      (isRehome ? "Rehome (private owner)" : $("a[href*='shelter']").first().text().trim() || null),
    city: defaults.city ?? null,
    province: defaults.province ?? "ON",
    distance_km: defaults.distance_km ?? null,
    requires_buddy: /\bbonded\b|must be adopted with/i.test(bodyText),
    is_bonded_pair: false,
    is_on_hold: false,
    is_adoption_pending: false,
  });
}

export async function scrapeAdoptapetListingFetch(
  listingUrl: string,
  source: CatSource,
  defaults: {
    shelter_name?: string;
    city?: string;
    province?: string;
    distance_km?: number;
  } = {},
  options: { maxPets?: number; rehomeOnly?: boolean } = {}
): Promise<CatRecord[]> {
  const links = await collectAdoptapetLinks(listingUrl);
  const cats: CatRecord[] = [];
  const max = options.maxPets ?? 60;

  for (const link of links.slice(0, max)) {
    try {
      const cat = await scrapeAdoptapetProfileFetch(link, source, defaults);
      if (!cat) continue;
      if (options.rehomeOnly) {
        const isRehome = /rehome|private owner/i.test(
          `${cat.description_text} ${cat.shelter_name}`
        );
        if (!isRehome) continue;
      }
      cats.push(cat);
      await sleep(400);
    } catch (e) {
      console.warn(`${source} skip ${link}:`, e);
    }
  }

  return cats;
}
