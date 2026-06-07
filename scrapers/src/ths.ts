import * as cheerio from "cheerio";
import type { CatRecord } from "@cat-matcher/shared";
import { applyFlagsToCat } from "@cat-matcher/shared";

const LIST_URL = "https://www.torontohumanesociety.com/cats/";
const BASE_URL = "https://www.torontohumanesociety.com";

export async function scrapeThs(): Promise<CatRecord[]> {
  const res = await fetch(LIST_URL, {
    headers: { "User-Agent": "CatAdoptionMatcher/1.0 (personal use)" },
  });

  if (!res.ok) {
    throw new Error(`THS fetch failed: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const cats: CatRecord[] = [];

  $(".card_sect").each((_, card) => {
    const $card = $(card);
    const name = $card.find("h2").first().text().trim();
    if (!name) return;

    const detailText = $card.find(".detail").text();
    const hasOnHoldBanner = $card
      .find("h3.first-txt")
      .text()
      .toLowerCase()
      .includes("on hold");

    const holdMatch = detailText.match(/On Hold\s*:\s*(Yes|No)/i);
    const isOnHold =
      hasOnHoldBanner || holdMatch?.[1]?.toLowerCase() === "yes";

    const profilePath = $card.find("a[href*='pets-details']").attr("href");
    const url = profilePath
      ? profilePath.startsWith("http")
        ? profilePath
        : `${BASE_URL}${profilePath}`
      : `${LIST_URL}#${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    const external_id =
      profilePath?.match(/ID=(\d+)/)?.[1] ??
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const photo_url =
      $card.find("img.card-img-top").attr("src") ??
      $card.find("img").first().attr("src") ??
      null;

    cats.push(
      applyFlagsToCat({
        source: "ths",
        external_id,
        name,
        sex: detailText.match(/Gender\s*:\s*(\w+)/i)?.[1] ?? null,
        age: detailText.match(/Age\s*:\s*([^\n]+)/i)?.[1]?.trim() ?? null,
        breed:
          detailText.match(/Breed\s*:\s*([^\n]+)/i)?.[1]?.trim() ?? null,
        url,
        photo_url,
        description_text: detailText.trim(),
        shelter_name: "Toronto Humane Society",
        city: "Toronto",
        province: "ON",
        postal_code: "M5A0B6",
        distance_km: 0,
        is_on_hold: isOnHold,
        requires_buddy: false,
        is_bonded_pair: false,
        is_adoption_pending: false,
      })
    );
  });

  return cats;
}
