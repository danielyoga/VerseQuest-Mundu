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
    taskVerseHowTo:
      "Tap a verse in Today’s reading below, then tap Submit on the verse you chose.",
    taskVerseNoReading:
      "Today’s reading text isn’t available yet. Refresh the page or try again later.",
    taskDescDone: "Completed today — well done!",
    taskGratitudeTitle: "Three things you’re grateful for",
    taskGratitudeDescPending: "Write three gratitudes for today.",
    taskGratitudeDescDone: "Saved for today.",
    gratitudeModalTitle: "🙏 Today’s gratitude",
    gratitudeModalSubtitle: "Name three things you’re thankful for right now.",
    gratitudeModalHint: "All three count toward completing this quest",
    gratitudeField1: "1",
    gratitudeField2: "2",
    gratitudeField3: "3",
    gratitudePlaceholder: "A person, moment, gift, or small joy…",
    gratitudeSubmit: "Save gratitudes",
    gratitudeCta: "Write three gratitudes",
    gratitudeCtaDone: "✓ Saved — tap to update",

    task2Title: "Have I lived out God’s Word today?",
    task2DescPending: "Use the checklist.",
    task2DescDone: "Today’s reflection saved.",
    task2DescYesterday: "No reflection today yet u{2014} showing yesterday’s.",
    firmanModalTitleDefault: "🙏 Live out God’s Word",
    firmanModalSubtitleDefault: "Check each item that is true for you today.",
    firmanModalCheckAllHint: "Check what is true for you today — save anytime",
    firmanSubmitPoll: "Save reflection",
    firmanPollCta: "Open reflection checklist",
    firmanPollCtaDone: "✓ Reflection saved — tap to update",
    firmanPollConfigMissing:
      "There is no polling yet for today.",
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

    navBarAria: "Main navigation",
    navHome: "Home",
    navHomeAria: "Home — daily quest",
    navCommunity: "Community",
    navCommunityAria: "Verses shared today",
    navCommunityBadgeHint: "unique passages",
    communityTitle: "Verses today",
    communitySubtitle:
      "Passages others chose that also appear in today’s reading. Verse text comes from your schedule.",
    /** Shown when nothing matches today’s Bible schedule or no community data. */
    communityEmptyExact: "no verse shared currently",
    communityLoading: "Loading…",

    langShortEn: "EN",
    langShortId: "ID",
    langAria: "Language",

    settingsAria: "Settings",
    settingsTitle: "Settings",
    settingsLanguageSection: "Language",
    settingsDisplayOrderSection: "Home screen order",
    settingsDisplayOrderHint:
      "Choose whether daily quests or today’s Bible reading appears first.",
    displayOrderMissionsFirst: "Missions first",
    displayOrderReadingFirst: "Bible reading first",
    settingsDone: "Done",

    scheduleHeading: "📅 Today’s reading",
    scheduleNoPlan: "No reading plan for this date in the schedule.",
    scheduleVersesPending:
      "This date is on the schedule, but verse text has not been filled in the sheet yet (run the populate script).",
    scheduleLoadingPassage: "Loading text…",
    schedulePassageError: "Could not load Bible text. Try again later.",
    scheduleTranslationNote: "Bahasa Indonesia · Terjemahan Baru (TB)",
    scheduleChapterHeading: (n: number) => `Chapter ${n}`,
    scheduleCopyVerse: "Copy",
    scheduleVerseCopied: "Copied!",
    scheduleVerseCopyAria: "Copy this verse to clipboard",
    scheduleVerseSubmitAria: "Submit this verse for today",
    modalVerseSubtitleScheduled: "Choose a verse from today’s scheduled passage.",

    loginRantingLabel: "Ranting",

    devotionNavTitle: "Daily Devotion",
    devotionLoadingText: "Loading devotion",
    devotionUnavailable: "Today's devotion is not available yet. Check back later.",
    devotionReflectionTitle: "Today's Reflection",
    devotionMarkRead: "Mark as Read",
    devotionBackAria: "Go back",

    devotionTaskTitle: "Read Today's Devotion",
    devotionTaskDoneDesc: "Read today",
    devotionTaskAvailableDesc: "Today's devotion is available",
    devotionTaskUnavailableDesc: "Devotion not available yet",
    devotionTaskBadgeDone: "Done",
    devotionTaskBadgeUnread: "Unread",
    devotionTaskBadgeNone: "Not Yet",
    devotionTaskReadCta: "Read Now",

    adminDevotionTitle: "Edit Devotion & Reflection",
    adminDevotionSection: "Daily Devotion",
    adminDevotionTitleLabel: "Devotion Title",
    adminDevotionTitlePlaceholder: "Today's devotion title...",
    adminDevotionPlaceholder: "Write today's devotion...",
    adminDevotionMinLength: "Minimum 50 characters",
    adminReflectionSection: "Reflection Points",
    adminReflectionPlaceholder: (n: number) => `Reflection ${n}`,
    adminReflectionDeleteAria: "Delete",
    adminReflectionAdd: "+ Add Reflection",
    adminSaving: "Saving",
    adminSaved: "Saved!",
    adminSaveFailed: "Failed to save.",
    adminSaveError: "Could not connect.",
    adminSaveButton: "Save",
    adminUpdateButton: "Update",
    adminBackAria: "Go back",

    navPrayer: "Doa",
    navPrayerAria: "Prayer Wall",
    prayerWallTitle: "🙏 Prayer Wall",
    prayerWallLoading: "Loading prayers…",
    prayerWallEmpty: "No prayer requests yet. Be the first to share!",
    prayerWallModalTitle: "🙏 Tambah Permintaan Doa",
    prayerWallLabel: "Permintaan Doa",
    prayerWallPlaceholder: "Tulis permintaan doa kamu di sini…",
    prayerWallCharCount: (n: number) => `${n} / 500`,
    prayerWallShowName: "Tampilkan nama saya",
    prayerWallShowNameHint: "Nama kamu akan terlihat oleh semua anggota komunitas",
    prayerWallAnonHint: "Doa kamu akan tampil sebagai Anonim",
    prayerWallSubmit: "Kirim Doa",
    prayerWallSubmitting: "Mengirim…",
    prayerWallAmin: "🙏 Amin",
    prayerWallAminActive: "🙏 Amin!",
    prayerWallMarkAnswered: "✓ Doa Terjawab",
    prayerWallMarkAnswering: "Menyimpan…",
    prayerWallBadgeOwn: "Doamu",
    prayerWallBadgeAnswered: "✓ Terjawab",
    prayerWallErrEmpty: "Permintaan doa tidak boleh kosong",
    prayerWallErrTooShort: "Minimal 10 karakter",
    prayerWallErrTooLong: "Maksimal 500 karakter",
    prayerWallErrGeneric: "Terjadi kesalahan",
    prayerWallErrNetwork: "Tidak dapat terhubung. Periksa koneksi internet.",
    prayerWallSubtitle: "Share your prayer request. All members can pray for each other.",
    prayerWallAddAria: "Add prayer",
    prayerWallJustNow: "Just now",
    prayerWallMinutesAgo: (n: number) => `${n} min ago`,
    prayerWallHoursAgo: (n: number) => `${n} hr ago`,
    prayerWallYesterday: "Yesterday",
    prayerWallDaysAgo: (n: number) => `${n} days ago`,
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

    subtitleDone:
      "Syukur kepada Tuhan, misi hari ini telah selesai. Sampai jumpa besok!",
    subtitlePending: "Ayat harian Anda menanti untuk dikirim.",

    streakLabel: "🔥 Rangkaian hari",
    streakUnit: "hari berturut-turut",

    progressToday: "Progres hari ini",
    progressTasks: (done: number, total: number) => `${done} / ${total} tugas`,

    questToday: "Misi hari ini",
    taskTitle: "Kirim ayat harian Anda",
    taskDescPending: "Pilih ayat yang menyentuh hati Anda hari ini",
    taskVerseHowTo:
      "Ketuk ayat di Bacaan hari ini di bawah, lalu ketuk Kirim pada ayat yang Anda pilih.",
    taskVerseNoReading:
      "Teks bacaan hari ini belum tersedia. Muat ulang halaman atau coba lagi nanti.",
    taskDescDone: "Selesai hari ini — syukur, pekerjaan yang baik!",
    taskGratitudeTitle: "Tiga hal yang disyukuri hari ini",
    taskGratitudeDescPending: "Tuliskan tiga hal syukur untuk hari ini.",
    taskGratitudeDescDone: "Tersimpan untuk hari ini.",
    gratitudeModalTitle: "🙏 Syukur hari ini",
    gratitudeModalSubtitle: "Sebutkan tiga hal yang Anda syukuri saat ini.",
    gratitudeModalHint: "Ketiga hal ini diperlukan untuk menyelesaikan misi",
    gratitudeField1: "1",
    gratitudeField2: "2",
    gratitudeField3: "3",
    gratitudePlaceholder: "Orang, momen, berkat, atau sukacita kecil…",
    gratitudeSubmit: "Simpan Ucapan Syukur",
    gratitudeCta: "Tulis",
    gratitudeCtaDone: "✓ Tersimpan — ketuk untuk ubah",

    task2Title: "Apakah saya sudah melakukan Firman hari ini?",
    task2DescPending: "Gunakan checklist.",
    task2DescDone: "Renungan hari ini tersimpan.",
    task2DescYesterday: "Belum ada refleksi hari ini \u2014 menampilkan kemarin.",
    firmanModalTitleDefault: "🙏 Melakukan Firman",
    firmanModalSubtitleDefault: "Centang setiap pernyataan yang benar untuk Anda hari ini.",
    firmanModalCheckAllHint: "Centang yang sesuai hari ini — simpan kapan saja",
    firmanSubmitPoll: "Simpan renungan",
    firmanPollCta: "Buka daftar renungan",
    firmanPollCtaDone: "✓ Renungan tersimpan — ketuk untuk ubah",
    firmanPollConfigMissing:
      "Belum ada polling untuk hari ini",
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
      `Puji Tuhan, ${name}! Rangkaian hari Anda terjaga. Terus membaca, terus bertumbuh.`,
    successXp: "+10 XP hari ini",
    successCta: "Semangat terus!",

    weekLabels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const,

    profileTitle: "Profil",

    navBarAria: "Navigasi utama",
    navHome: "Beranda",
    navHomeAria: "Beranda — misi harian",
    navCommunity: "Komunitas",
    navCommunityAria: "Ayat yang dibagikan hari ini",
    navCommunityBadgeHint: "ayat unik",
    communityTitle: "Ayat hari ini",
    communitySubtitle:
      "Ayat yang dipilih orang lain dan masuk dalam bacaan hari ini. Teks ayat dari jadwal Anda.",
    communityEmptyExact: "Belum ada ayat yang dibagikan saat ini.",
    communityLoading: "Memuat…",

    langShortEn: "EN",
    langShortId: "ID",
    langAria: "Bahasa",

    settingsAria: "Pengaturan",
    settingsTitle: "Pengaturan",
    settingsLanguageSection: "Bahasa",
    settingsDisplayOrderSection: "Urutan layar utama",
    settingsDisplayOrderHint:
      "Pilih apakah misi harian atau bacaan Alkitab hari ini ditampilkan lebih dulu.",
    displayOrderMissionsFirst: "Misi dulu",
    displayOrderReadingFirst: "Bacaan Alkitab dulu",
    settingsDone: "Selesai",

    scheduleHeading: "📅 Bacaan hari ini",
    scheduleNoPlan: "Belum ada jadwal bacaan untuk tanggal ini.",
    scheduleVersesPending:
      "Tanggal ini ada di jadwal, tetapi teks ayat di sheet masih kosong (jalankan skrip pengisian).",
    scheduleLoadingPassage: "Memuat teks…",
    schedulePassageError: "Teks Alkitab tidak dapat dimuat. Coba lagi nanti.",
    scheduleTranslationNote: "Bahasa Indonesia · Terjemahan Baru (TB)",
    scheduleChapterHeading: (n: number) => `Pasal ${n}`,
    scheduleCopyVerse: "Salin",
    scheduleVerseCopied: "Disalin!",
    scheduleVerseCopyAria: "Salin ayat ini ke papan klip",
    scheduleVerseSubmitAria: "Kirim ayat ini untuk hari ini",
    modalVerseSubtitleScheduled: "Pilih ayat dari bagian yang dijadwalkan hari ini.",

    loginRantingLabel: "Ranting",

    devotionNavTitle: "Renungan Harian",
    devotionLoadingText: "Memuat renungan",
    devotionUnavailable: "Renungan hari ini belum tersedia. Cek lagi nanti.",
    devotionReflectionTitle: "Refleksi Hari Ini",
    devotionMarkRead: "Tandai Sudah Dibaca",
    devotionBackAria: "Kembali",

    devotionTaskTitle: "Baca Renungan Hari Ini",
    devotionTaskDoneDesc: "Sudah dibaca hari ini",
    devotionTaskAvailableDesc: "Renungan hari ini sudah tersedia",
    devotionTaskUnavailableDesc: "Renungan belum tersedia",
    devotionTaskBadgeDone: "Selesai",
    devotionTaskBadgeUnread: "Belum Dibaca",
    devotionTaskBadgeNone: "Belum Ada",
    devotionTaskReadCta: "Baca Sekarang",

    adminDevotionTitle: "Edit Renungan & Refleksi",
    adminDevotionSection: "Renungan Harian",
    adminDevotionTitleLabel: "Judul Renungan",
    adminDevotionTitlePlaceholder: "Judul renungan hari ini...",
    adminDevotionPlaceholder: "Tulis renungan hari ini...",
    adminDevotionMinLength: "Minimal 50 karakter",
    adminReflectionSection: "Poin Refleksi",
    adminReflectionPlaceholder: (n: number) => `Refleksi ${n}`,
    adminReflectionDeleteAria: "Hapus",
    adminReflectionAdd: "+ Tambah Refleksi",
    adminSaving: "Menyimpan",
    adminSaved: "Tersimpan!",
    adminSaveFailed: "Gagal menyimpan.",
    adminSaveError: "Tidak dapat terhubung.",
    adminSaveButton: "Simpan",
    adminUpdateButton: "Perbarui",
    adminBackAria: "Kembali",

    navPrayer: "Doa",
    navPrayerAria: "Tembok Doa",
    prayerWallTitle: "🙏 Tembok Doa",
    prayerWallLoading: "Memuat doa…",
    prayerWallEmpty: "Belum ada permintaan doa. Jadilah yang pertama berbagi!",
    prayerWallModalTitle: "🙏 Tambah Permintaan Doa",
    prayerWallLabel: "Permintaan Doa",
    prayerWallPlaceholder: "Tulis permintaan doa kamu di sini…",
    prayerWallCharCount: (n: number) => `${n} / 500`,
    prayerWallShowName: "Tampilkan nama saya",
    prayerWallShowNameHint: "Nama kamu akan terlihat oleh semua anggota komunitas",
    prayerWallAnonHint: "Doa kamu akan tampil sebagai Anonim",
    prayerWallSubmit: "Kirim Doa",
    prayerWallSubmitting: "Mengirim…",
    prayerWallAmin: "🙏 Amin",
    prayerWallAminActive: "🙏 Amin!",
    prayerWallMarkAnswered: "✓ Doa Terjawab",
    prayerWallMarkAnswering: "Menyimpan…",
    prayerWallBadgeOwn: "Doamu",
    prayerWallBadgeAnswered: "✓ Terjawab",
    prayerWallErrEmpty: "Permintaan doa tidak boleh kosong",
    prayerWallErrTooShort: "Minimal 10 karakter",
    prayerWallErrTooLong: "Maksimal 500 karakter",
    prayerWallErrGeneric: "Terjadi kesalahan",
    prayerWallErrNetwork: "Tidak dapat terhubung. Periksa koneksi internet.",
    prayerWallSubtitle: "Bagikan permintaan doa kamu. Semua anggota dapat saling mendoakan.",
    prayerWallAddAria: "Tambah doa",
    prayerWallJustNow: "Baru saja",
    prayerWallMinutesAgo: (n: number) => `${n} menit lalu`,
    prayerWallHoursAgo: (n: number) => `${n} jam lalu`,
    prayerWallYesterday: "Kemarin",
    prayerWallDaysAgo: (n: number) => `${n} hari lalu`,
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
