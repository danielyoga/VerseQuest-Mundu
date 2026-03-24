export interface VerseSubmission {
  book: string;
  chapter: number;
  verse: number;
  verse_text: string;
  submitted_at: string;
}

export interface StoredProfile {
  name: string;
  /** Normalized local format e.g. 081234567890 */
  phone: string;
}

export interface StoredState {
  profile: StoredProfile;
  streak_count: number;
  last_submitted_at: string | null;
  xp_total: number;
  submission_dates: string[];
}
