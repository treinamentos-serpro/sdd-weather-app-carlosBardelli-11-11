function parseIsoDate(date: string): Date | null {
  const dateValue = new Date(`${date}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(dateValue.getTime()) ||
    dateValue.toISOString().slice(0, 10) !== date
  ) {
    return null;
  }

  return dateValue;
}

export function formatDayLabel(date: string, index: number): string {
  const dateValue = parseIsoDate(date);
  if (dateValue === null) return 'Data indisponível';
  if (index === 0) return 'Hoje';
  if (index === 1) return 'Amanhã';

  const weekday = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'short',
  })
    .format(dateValue)
    .replace(/\.$/, '');

  return weekday.charAt(0).toLocaleUpperCase('pt-BR') + weekday.slice(1);
}

export function getShortDate(date: string): string {
  const dateValue = parseIsoDate(date);
  if (dateValue === null) return 'Data indisponível';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(dateValue);
}
