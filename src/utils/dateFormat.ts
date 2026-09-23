export function formatDateDE(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

export function parseDateDE(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

export function getWeekdayDE(dateStr: string): string {
  const d = parseDateDE(dateStr);
  if (!d) return '';
  const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  return weekdays[d.getDay()] || '';
}

export function generateDateSeries(startDateISO: string, count: number, intervalDays: number, skipWeekends: boolean = false): string[] {
  if (!startDateISO) return [];
  const results: string[] = [];
  let current = new Date(startDateISO + 'T09:00:00');
  if (isNaN(current.getTime())) return [];

  let added = 0;
  let safety = 0;
  while (added < count && safety < 300) {
    safety++;
    const dayOfWeek = current.getDay(); // 0 = Sun, 6 = Sat
    if (skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      current.setDate(current.getDate() + 1);
      continue;
    }
    results.push(formatDateDE(current));
    added++;
    current.setDate(current.getDate() + intervalDays);
  }
  return results;
}
