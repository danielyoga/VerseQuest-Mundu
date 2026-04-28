export function getMoodEmoji(strikeCount: number, lossStreak: number): string {
  if (lossStreak >= 2) {
    if (lossStreak === 2) return '😔'
    if (lossStreak === 3) return '😞'
    if (lossStreak === 4) return '😢'
    if (lossStreak === 5) return '😣'
    if (lossStreak === 6) return '😰'
    return '😭'
  }
  if (strikeCount >= 7) return '😇'
  if (strikeCount === 6) return '🥰'
  if (strikeCount === 5) return '😍'
  if (strikeCount === 4) return '😁'
  if (strikeCount === 3) return '😃'
  if (strikeCount === 2) return '☺️'
  if (strikeCount === 1) return '😊'
  return '😊'
}

export function getMoodMessage(strikeCount: number, lossStreak: number): string {
  if (lossStreak >= 7) return 'Ayo bangkit! Komunitas merindukanmu.'
  if (lossStreak >= 4) return 'Jangan menyerah — mulai lagi hari ini.'
  if (lossStreak >= 2) return 'Kamu sempat terhenti, tapi bisa mulai lagi!'
  if (strikeCount >= 7) return 'LEGENDA! Komunitas terinspirasi olehmu.'
  if (strikeCount >= 5) return `Luar biasa! ${strikeCount} hari berturut-turut.`
  if (strikeCount >= 1) return 'Terus semangat — kamu sedang membangun kebiasaan!'
  return 'Mulai perjalananmu hari ini!'
}

export function computeLossStreakFromLastSubmit(
  lastSubmissionDate: string | null,
  today: string,
): number {
  if (!lastSubmissionDate) return 0
  const last = new Date(lastSubmissionDate)
  const now = new Date(today)
  const diffDays = Math.floor((now.getTime() - last.getTime()) / 86400000)
  return diffDays > 0 ? diffDays : 0
}
