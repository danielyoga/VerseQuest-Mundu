// lib/fruitsOfSpirit.ts
// Order is configurable. Kelemahlembutan first (requested), then Galatia 5:22-23 order.

export type Fruit = {
  key: string;
  name: string;   // Indonesian name shown in UI
  en: string;     // English name (en locale)
  emoji: string;
  line: string;   // daily encouragement line shown on the Amen card
};

export const FRUITS: readonly Fruit[] = [
  { key: 'gentleness',   name: 'Kelemahlembutan', en: 'Gentleness',   emoji: '🕊️', line: 'Biarlah kata-katamu hari ini lembut seperti embun pagi.' },
  { key: 'love',         name: 'Kasih',           en: 'Love',         emoji: '❤️', line: 'Kamu dikasihi Tuhan. Bagikan kasih itu hari ini.' },
  { key: 'joy',          name: 'Sukacita',        en: 'Joy',          emoji: '☀️', line: 'Sukacita dari Tuhan adalah kekuatanmu hari ini.' },
  { key: 'peace',        name: 'Damai Sejahtera', en: 'Peace',        emoji: '🌿', line: 'Damai-Nya menjaga hati dan pikiranmu.' },
  { key: 'patience',     name: 'Kesabaran',       en: 'Patience',     emoji: '🌱', line: 'Langkah kecil pun berarti. Tuhan sabar menuntunmu.' },
  { key: 'kindness',     name: 'Kemurahan',       en: 'Kindness',     emoji: '🤲', line: 'Satu kebaikan kecil hari ini bisa jadi berkat besar.' },
  { key: 'goodness',     name: 'Kebaikan',        en: 'Goodness',     emoji: '🍇', line: 'Lakukan yang baik, sebab Tuhan baik kepadamu.' },
  { key: 'faithfulness', name: 'Kesetiaan',       en: 'Faithfulness', emoji: '🕯️', line: 'Kesetiaanmu berdoa hari ini sangat berharga.' },
  { key: 'self-control', name: 'Penguasaan Diri', en: 'Self-control', emoji: '⛰️', line: 'Tuhan memberimu kekuatan untuk menguasai diri.' },
] as const;

export const DAYS_PER_FRUIT = 7;
export const CYCLE_DAYS = DAYS_PER_FRUIT * FRUITS.length; // 63
export const FRUIT_VERSE_REF = 'Galatia 5:22-23';
