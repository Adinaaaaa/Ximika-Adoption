import type { CatRecord } from "@cat-matcher/shared";
import { scrapeAdoptapetListingFetch } from "./adoptapet-fetch";

const POSTAL = process.env.SCRAPE_POSTAL_CODE ?? "M5S2M6";

/** Rehome cats appear on Adopt-a-Pet as private-owner listings near you. */
export async function scrapeRehome(): Promise<CatRecord[]> {
  return scrapeAdoptapetListingFetch(
    `https://www.adoptapet.com/cat-adoption/on/toronto`,
    "rehome",
    { province: "ON", city: "Toronto" },
    { maxPets: 80, rehomeOnly: true }
  );
}
