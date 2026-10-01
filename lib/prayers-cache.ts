import { unstable_cache } from "next/cache";
import { readPrayerRows } from "@/lib/google-sheets/prayers-sheet";

export const PRAYERS_CACHE_TAG = "prayers";

/** Whole Prayers tab, cached ~5 min for member reads; the admin save expires the tag. */
export const getCachedPrayerRows = unstable_cache(readPrayerRows, ["prayers"], {
  tags: [PRAYERS_CACHE_TAG],
  revalidate: 300,
});
