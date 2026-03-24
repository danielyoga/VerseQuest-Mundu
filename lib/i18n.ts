export type Locale = "en" | "id";

/** Persisted separately from app data — changing this key would only affect language preference. */
export const LOCALE_STORAGE_KEY = "versequest_locale";

export const messages = {
  en: {
    loading: "Loading…",

    loginTitle: "VerseQuest",
    loginSubtitle: "Please sign in with the mobile number you were registered with.",
    loginPhoneLabel: "Mobile number",
    loginCountryHint: "Use digits after +62 (e.g. 813… or 0813…).",
    loginContinue: "Continue",
    loginErrorGeneric: "Could not sign in. Please try again.",

    errPhoneInvalid: "Please enter a valid mobile number.",
    errPhoneNotInvited:
      "This number is not on the invite list. Please contact your administrator if you need access.",
    errSubmitSignIn: "Please sign in first.",
    errSubmitAlreadyToday: "You have already submitted a verse today.",
    errSubmitGeneric: "Could not submit.",

    statusAppName: "VerseQuest",

    subtitleDone: "Today’s quest is complete. See you tomorrow!",
    subtitlePending: "Your daily verse is waiting to be submitted.",

    streakLabel: "🔥 Day streak",
    streakUnit: "days in a row",

    progressToday: "Today’s progress",
    progressTasks: (done: number, total: number) => `${done} / ${total} tasks`,

    questToday: "Today’s quest",
    taskTitle: "Submit your daily verse",
    taskDescPending: "Choose a verse that speaks to you today",
    taskDescDone: "Completed today — well done!",
    badgePending: "Pending",
    badgeDone: "Done",

    ctaSubmit: "Submit today’s verse",
    ctaDone: "✓ Verse submitted today",

    modalVerseTitle: "📖 Submit today’s verse",
    modalVerseSubtitle: "Choose a verse that moved you today",
    modalClose: "Close",
    labelBook: "📖 Bible book",
    bookPlaceholder: "Choose a book…",
    ot: "Old Testament",
    nt: "New Testament",
    labelChapter: "📑 Chapter",
    labelVerse: "📃 Verse",
    dash: "—",
    labelVerseText: "✍️ Type or paste the verse",
    versePlaceholder:
      "e.g. For I know the plans I have for you, declares the Lord…",
    paste: "📋 Paste from clipboard",
    submitVerse: "Submit verse",

    successTitle: "Verse submitted!",
    successBody: (name: string) =>
      `Wonderful, ${name}! You kept your streak going. Keep reading and growing.`,
    successXp: "+10 XP today",
    successCta: "Keep it up!",

    weekLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const,

    profileTitle: "Profile",

    langShortEn: "EN",
    langShortId: "ID",
    langAria: "Language",

    scheduleHeading: "📅 Today’s reading",
    scheduleNoPlan: "No reading plan for this date in the schedule file.",
    scheduleLoadingPassage: "Loading text…",
    schedulePassageError: "Could not load Bible text. Try again later.",
    scheduleTranslationNote: "Indonesian · Terjemahan Baru (TB) — SABDA / alkitab.mobi",
    scheduleChapterHeading: (n: number) => `Chapter ${n}`,
    scheduleCopyVerse: "Copy",
    scheduleVerseCopied: "Copied!",
    scheduleVerseCopyAria: "Copy this verse to clipboard",
    modalVerseSubtitleScheduled: "Choose a verse from today’s scheduled passage.",
  },
  id: {
    loading: "Memuat…",

    loginTitle: "VerseQuest",
    loginSubtitle:
      "Silakan masuk dengan nomor telepon seluler yang telah terdaftar sebelumnya.",
    loginPhoneLabel: "Nomor telepon seluler",
    loginCountryHint: "Gunakan angka setelah +62 (misalnya 813… atau 0813…).",
    loginContinue: "Lanjutkan",
    loginErrorGeneric: "Tidak dapat masuk. Silakan coba lagi.",

    errPhoneInvalid: "Mohon masukkan nomor telepon yang valid.",
    errPhoneNotInvited:
      "Nomor ini belum terdaftar. Silakan hubungi pengurus jika Anda memerlukan akses.",
    errSubmitSignIn: "Silakan masuk terlebih dahulu.",
    errSubmitAlreadyToday: "Anda sudah mengirim ayat hari ini.",
    errSubmitGeneric: "Tidak dapat mengirim.",

    statusAppName: "VerseQuest",

    subtitleDone: "Alhamdulillah, misi hari ini telah selesai. Sampai jumpa besok!",
    subtitlePending: "Ayat harian Anda menanti untuk dikirim.",

    streakLabel: "🔥 Rangkaian hari",
    streakUnit: "hari berturut-turut",

    progressToday: "Progres hari ini",
    progressTasks: (done: number, total: number) => `${done} / ${total} tugas`,

    questToday: "Misi hari ini",
    taskTitle: "Kirim ayat harian Anda",
    taskDescPending: "Pilih ayat yang menyentuh hati Anda hari ini",
    taskDescDone: "Selesai hari ini — syukur, pekerjaan yang baik!",
    badgePending: "Menunggu",
    badgeDone: "Selesai",

    ctaSubmit: "Kirim ayat hari ini",
    ctaDone: "✓ Ayat hari ini telah dikirim",

    modalVerseTitle: "📖 Kirim ayat hari ini",
    modalVerseSubtitle: "Pilih ayat yang menginspirasi Anda hari ini",
    modalClose: "Tutup",
    labelBook: "📖 Kitab Alkitab",
    bookPlaceholder: "Pilih kitab…",
    ot: "Perjanjian Lama",
    nt: "Perjanjian Baru",
    labelChapter: "📑 Pasal",
    labelVerse: "📃 Ayat",
    dash: "—",
    labelVerseText: "✍️ Ketik atau tempel teks ayat",
    versePlaceholder:
      "misalnya: Sebab Aku ini mengetahui rancangan-rancangan apa yang ada pada-Ku mengenai kamu…",
    paste: "📋 Tempel dari papan klip",
    submitVerse: "Kirim ayat",

    successTitle: "Ayat berhasil dikirim!",
    successBody: (name: string) =>
      `Alhamdulillah, ${name}! Rangkaian hari Anda terjaga. Terus membaca, terus bertumbuh.`,
    successXp: "+10 XP hari ini",
    successCta: "Semangat terus!",

    weekLabels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const,

    profileTitle: "Profil",

    langShortEn: "EN",
    langShortId: "ID",
    langAria: "Bahasa",

    scheduleHeading: "📅 Bacaan hari ini",
    scheduleNoPlan: "Belum ada jadwal bacaan untuk tanggal ini di berkas jadwal.",
    scheduleLoadingPassage: "Memuat teks…",
    schedulePassageError: "Teks Alkitab tidak dapat dimuat. Coba lagi nanti.",
    scheduleTranslationNote: "Bahasa Indonesia · Terjemahan Baru (TB) — SABDA / alkitab.mobi",
    scheduleChapterHeading: (n: number) => `Pasal ${n}`,
    scheduleCopyVerse: "Salin",
    scheduleVerseCopied: "Disalin!",
    scheduleVerseCopyAria: "Salin ayat ini ke papan klip",
    modalVerseSubtitleScheduled: "Pilih ayat dari bagian yang dijadwalkan hari ini.",
  },
} as const;

export type MessageKey = keyof typeof messages.en;

export function greetingLine(locale: Locale, name: string, h: number): string {
  if (locale === "en") {
    if (h < 12) return `Good morning, ${name}!`;
    if (h < 18) return `Good afternoon, ${name}!`;
    return `Good evening, ${name}!`;
  }
  let s: string;
  if (h >= 4 && h < 11) s = "Selamat pagi";
  else if (h >= 11 && h < 15) s = "Selamat siang";
  else if (h >= 15 && h < 18) s = "Selamat sore";
  else s = "Selamat malam";
  return `${s}, ${name}!`;
}

export function streakMessage(
  locale: Locale,
  streak: number,
  name: string,
  versePendingToday: boolean
): string {
  if (locale === "en") {
    if (streak === 0) {
      return `Don’t give up, ${name}. Start fresh today — submit your verse and rebuild your streak.`;
    }
    if (streak <= 5) {
      return versePendingToday
        ? "Keep going — you’re building a great habit! Today’s verse is still pending."
        : `Keep going — you’re building a great habit. Great work today, ${name}.`;
    }
    if (streak <= 14) {
      return `You’re on fire! ${streak} days in a row. Keep it up!`;
    }
    return `Amazing! ${streak} days! You’re an inspiration to those around you.`;
  }
  if (streak === 0) {
    return `Jangan menyerah, ${name}. Mulai lagi hari ini — kirim ayat Anda dan bangun kembali rangkaian hari Anda.`;
  }
  if (streak <= 5) {
    return versePendingToday
      ? "Terus semangat — Anda sedang membiasakan diri membaca Firman! Ayat hari ini belum dikirim."
      : `Terus semangat — kebiasaan baik sedang terbentuk. Syukur atas langkah Anda hari ini, ${name}.`;
  }
  if (streak <= 14) {
    return `Luar biasa! ${streak} hari berturut-turut. Pertahankan semangat Anda!`;
  }
  return `Luar biasa! ${streak} hari! Semoga menjadi berkat bagi sekitar Anda.`;
}

export function formatHeaderDate(locale: Locale, d: Date): string {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
