// Pure date helpers for the Gantt grid. Everything works in whole days
// (local time, midnight-aligned) so pixel math stays simple and predictable.

export function startOfDay(date: Date | string) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date | string, days: number) {
  const d = startOfDay(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function diffInDays(a: Date | string, b: Date | string) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / MS_PER_DAY);
}

export function isSameDay(a: Date | string, b: Date | string) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isOverdue(task: { endDate: string | Date; status: string }) {
  return task.status !== "DONE" && startOfDay(task.endDate) < startOfDay(new Date());
}

const MONTH_LABEL = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" });
const DAY_LABEL = new Intl.DateTimeFormat("es-CL", { day: "2-digit" });
const WEEKDAY_LABEL = new Intl.DateTimeFormat("es-CL", { weekday: "short" });

/** Builds the list of days between start and end (inclusive) for the header/grid. */
export function buildTimelineDays(start: Date, end: Date) {
  const days: Date[] = [];
  let cursor = startOfDay(start);
  const last = startOfDay(end);
  while (cursor <= last) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

/** Groups consecutive days by month for the top header row, with each group's column span. */
export function groupDaysByMonth(days: Date[]) {
  const groups: { label: string; span: number }[] = [];
  for (const day of days) {
    const label = capitalize(MONTH_LABEL.format(day));
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.span += 1;
    } else {
      groups.push({ label, span: 1 });
    }
  }
  return groups;
}

export function dayLabel(date: Date) {
  return DAY_LABEL.format(date);
}

export function weekdayLabel(date: Date) {
  return capitalize(WEEKDAY_LABEL.format(date)).replace(".", "");
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
