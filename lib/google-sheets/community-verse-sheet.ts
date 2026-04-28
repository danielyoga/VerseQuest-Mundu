import {
  escapeSheetTitleForRange,
  getSheetsClient,
  getSpreadsheetId,
} from "./client";

export function getCommunityVerseTabTitle(): string {
  return process.env.VERSEQUEST_COMMUNITY_VERSE_TAB ?? "Today_Community_Verse";
}

function getTodayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function appendCommunityVerse(params: {
  book: string;
  chapter: number;
  verse: number;
  verse_text: string;
}): Promise<void> {
  const { book, chapter, verse, verse_text } = params;
  const sheets = await getSheetsClient();
  const tab = escapeSheetTitleForRange(getCommunityVerseTabTitle());
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${tab}!A:E`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[getTodayString(), book, chapter, verse, verse_text]],
    },
  });
}

export type CommunityVerseItem = {
  submitted_at: string;
  book: string;
  chapter: string;
  verse: string;
  verse_text: string;
};

export async function readCommunityVersesDeduped(): Promise<CommunityVerseItem[]> {
  const sheets = await getSheetsClient();
  const tab = escapeSheetTitleForRange(getCommunityVerseTabTitle());
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${tab}!A:E`,
  });

  const rows = (res.data.values ?? []) as string[][];
  const today = getTodayString();
  const dataRows = rows
    .slice(1)
    .filter((r) => r.length >= 5 && String(r[0] ?? "").startsWith(today));

  const seen = new Set<string>();
  const unique = [...dataRows].reverse().filter((row) => {
    const key = `${row[1]}_${row[2]}_${row[3]}_${row[0]}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, 50).map((row) => ({
    submitted_at: row[0] ?? "",
    book: row[1] ?? "",
    chapter: row[2] ?? "",
    verse: row[3] ?? "",
    verse_text: row[4] ?? "",
  }));
}
