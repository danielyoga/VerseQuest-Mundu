/**
 * Teks antarmuka Bahasa Indonesia sopan (formal-netral).
 */

export const id = {
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

  greeting: (period: "pagi" | "siang" | "sore" | "malam", name: string) => {
    const s =
      period === "pagi"
        ? "Selamat pagi"
        : period === "siang"
          ? "Selamat siang"
          : period === "sore"
            ? "Selamat sore"
            : "Selamat malam";
    return `${s}, ${name}!`;
  },

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
} as const;

export function greetingPeriod(
  h: number
): "pagi" | "siang" | "sore" | "malam" {
  if (h >= 4 && h < 11) return "pagi";
  if (h >= 11 && h < 15) return "siang";
  if (h >= 15 && h < 18) return "sore";
  return "malam";
}

export function streakMessageId(
  streak: number,
  name: string,
  versePendingToday: boolean
): string {
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
