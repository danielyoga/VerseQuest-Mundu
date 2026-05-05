/* global React, GBook, GCross, GHands, GHeart, GCheck, GFlame, GSparkle, GBack, GChevronR, GHome, GUsers, GPray, GCheckCircle, GPlus, GPhone, GWhatsApp, GMoon, GBoltSmall, GClock, GLogout */

const { useState, useEffect, useMemo } = React;

// ─── Mock data ───────────────────────────────────────────────────────────
const ME = { name: 'Yoga', initials: 'YG', ranting: 'LABU', phone: '+62 812-xxx-xxx', isCoordinator: false };

const SCHEDULE = {
  book: 'Mazmur',
  reading: 'Mazmur 23 · Tuhan, gembalaku yang baik',
  passage: [
    { c: 23, v: 1, t: 'TUHAN adalah gembalaku, takkan kekurangan aku.' },
    { c: 23, v: 2, t: 'Ia membaringkan aku di padang yang berumput hijau, Ia membimbing aku ke air yang tenang;' },
    { c: 23, v: 3, t: 'Ia menyegarkan jiwaku. Ia menuntun aku di jalan yang benar oleh karena nama-Nya.' },
    { c: 23, v: 4, t: 'Sekalipun aku berjalan dalam lembah kekelaman, aku tidak takut bahaya, sebab Engkau besertaku; gada-Mu dan tongkat-Mu, itulah yang menghibur aku.' },
    { c: 23, v: 5, t: 'Engkau menyediakan hidangan bagiku, di hadapan lawanku; Engkau mengurapi kepalaku dengan minyak; pialaku penuh melimpah.' },
    { c: 23, v: 6, t: 'Kebajikan dan kemurahan belaka akan mengikuti aku, seumur hidupku; dan aku akan diam dalam rumah TUHAN sepanjang masa.' },
  ],
};

const PRAYERS_INITIAL = [
  { id: 1, name: 'Yoga', ranting: 'LABU', text: 'Mohon doa untuk ujian skripsi minggu depan, semoga diberi ketenangan dan hikmat.', minsAgo: 12, likes: 4, own: true, answered: false },
  { id: 2, name: 'Hana', ranting: 'AKAR', text: 'Doakan adikku yang sedang sakit, semoga lekas pulih dan keluarga dikuatkan.', minsAgo: 47, likes: 11, own: false, answered: false },
  { id: 3, name: 'Bima', ranting: 'BATANG', text: 'Berdoa untuk pekerjaan baru — semoga Tuhan menuntun langkah dan memberi keputusan yang tepat.', minsAgo: 180, likes: 7, own: false, answered: false },
  { id: 4, name: 'Sari', ranting: 'DAUN', text: 'Doakan kelompok kecil kami minggu ini, semoga ada damai di antara kami.', minsAgo: 1440, likes: 18, own: false, answered: false },
];

const MEMBERS_ALL = [
  { name: 'Andre P.', phone: '+62812...', submitted: true },
  { name: 'Citra D.', phone: '+62813...', submitted: false },
  { name: 'Daniel Y.', phone: '+62811...', submitted: true },
  { name: 'Erika S.', phone: '+62815...', submitted: false },
  { name: 'Fano K.', phone: '+62814...', submitted: false },
  { name: 'Gita M.', phone: '+62812...', submitted: true },
  { name: 'Hana L.', phone: '+62816...', submitted: false },
  { name: 'Ivan B.', phone: '+62812...', submitted: true },
  { name: 'Joel R.', phone: '+62812...', submitted: false },
  { name: 'Kevin H.', phone: '+62812...', submitted: false },
  { name: 'Lia P.', phone: '+62812...', submitted: false },
  { name: 'Mira D.', phone: '+62812...', submitted: false },
];

const COMMUNITY_VERSES = [
  { book: 'Mazmur', c: 23, v: 1, text: 'TUHAN adalah gembalaku, takkan kekurangan aku.', date: '5 Mei 2026' },
  { book: 'Filipi', c: 4, v: 13, text: 'Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku.', date: '4 Mei 2026' },
  { book: 'Yesaya', c: 41, v: 10, text: 'Janganlah takut, sebab Aku menyertai engkau, janganlah bimbang, sebab Aku ini Allahmu;', date: '3 Mei 2026' },
  { book: 'Roma', c: 8, v: 28, text: 'Allah turut bekerja dalam segala sesuatu untuk mendatangkan kebaikan bagi mereka yang mengasihi Dia.', date: '2 Mei 2026' },
];

function relTime(mins) {
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  if (mins < 1440) return `${Math.floor(mins / 60)} jam lalu`;
  if (mins < 2880) return 'Kemarin';
  return `${Math.floor(mins / 1440)} hari lalu`;
}

function bookName(b) { return b; }

Object.assign(window, { ME, SCHEDULE, PRAYERS_INITIAL, MEMBERS_ALL, COMMUNITY_VERSES, relTime, bookName });
