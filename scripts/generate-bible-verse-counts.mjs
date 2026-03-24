/**
 * One-off: downloads KJV.csv, writes data/bible-verse-counts.json
 * Run: node scripts/generate-bible-verse-counts.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const CSV_URL =
  "https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/csv/KJV.csv";

const CSV_TO_CANONICAL = {
  "I Samuel": "1 Samuel",
  "II Samuel": "2 Samuel",
  "I Kings": "1 Kings",
  "II Kings": "2 Kings",
  "I Chronicles": "1 Chronicles",
  "II Chronicles": "2 Chronicles",
  "I Corinthians": "1 Corinthians",
  "II Corinthians": "2 Corinthians",
  "I Thessalonians": "1 Thessalonians",
  "II Thessalonians": "2 Thessalonians",
  "I Timothy": "1 Timothy",
  "II Timothy": "2 Timothy",
  "I Peter": "1 Peter",
  "II Peter": "2 Peter",
  "I John": "1 John",
  "II John": "2 John",
  "III John": "3 John",
  "Revelation of John": "Revelation",
};

function canonicalBook(csvName) {
  return CSV_TO_CANONICAL[csvName] ?? csvName;
}

async function main() {
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Failed to fetch CSV: ${res.status}`);
  const text = await res.text();
  const lines = text.split(/\r?\n/).slice(1);

  /** @type {Map<string, number>} key = book|chapter -> max verse */
  const maxVerse = new Map();

  for (const line of lines) {
    if (!line) continue;
    const m = line.match(/^([^,]+),(\d+),(\d+),/);
    if (!m) continue;
    const book = m[1];
    const ch = Number(m[2]);
    const v = Number(m[3]);
    const k = `${book}|${ch}`;
    maxVerse.set(k, Math.max(maxVerse.get(k) ?? 0, v));
  }

  /** @type {Record<string, number[]>} */
  const out = {};

  for (const [k, maxV] of maxVerse) {
    const [csvBook, chStr] = k.split("|");
    const ch = Number(chStr);
    const book = canonicalBook(csvBook);
    if (!out[book]) out[book] = [];
    const arr = out[book];
    while (arr.length < ch) arr.push(0);
    arr[ch - 1] = maxV;
  }

  const outPath = path.join(root, "data", "bible-verse-counts.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 0) + "\n", "utf8");
  console.log("Wrote", outPath, Object.keys(out).length, "books");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
