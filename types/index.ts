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
  /** Ranting prefix (e.g. "A", "B"). Only present when ranting mode is active. */
  ranting?: string;
}

export interface StoredState {
  /** Bump only when migrating stored shape; deploys must not clear this key. */
  schemaVersion?: number;
  profile: StoredProfile;
  streak_count: number;
  last_submitted_at: string | null;
  xp_total: number;
  submission_dates: string[];
}

/** Current persisted app data format — keep stable across deployments. */
export const CURRENT_SCHEMA_VERSION = 1;
