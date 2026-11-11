function dateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function formatDayLabel(
  date: string,
  timeZone: string | null = null,
  now: Date = new Date(),
): string {
  const dateValue = new Date(`${date}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(dateValue.getTime()) ||
    dateValue.toISOString().slice(0, 10) !== date
  ) {
    return 'Data indisponível';
  }

  let today: string;
  try {
    today = dateKeyInTimeZone(now, timeZone ?? 'UTC');
  } catch {
    today = dateKeyInTimeZone(now, 'UTC');
  }

  if (date === today) return 'Hoje';

  const tomorrowDate = new Date(`${today}T12:00:00Z`);
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  if (date === tomorrowDate.toISOString().slice(0, 10)) return 'Amanhã';

  const weekday = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'short',
  })
    .format(dateValue)
    .replace(/\.$/, '');

  return weekday.charAt(0).toLocaleUpperCase('pt-BR') + weekday.slice(1);
}
