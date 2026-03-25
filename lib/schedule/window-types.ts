/** Shared types for `/api/schedule-window` and client cache (no server-only imports). */

export type ScheduleVerseRow = {
  chapter: number;
  verse: number;
  text: string;
};

export type ScheduleWindowDay =
  | {
      year: number;
      month: number;
      date: number;
      ok: true;
      book: string;
      reading: string;
      verses: ScheduleVerseRow[];
    }
  | {
      year: number;
      month: number;
      date: number;
      ok: false;
      reason: "no_row" | "verses_empty" | "verses_invalid";
      book?: string;
      reading?: string;
    };

export type ScheduleWindowResponse = {
  from: string;
  days: ScheduleWindowDay[];
};
