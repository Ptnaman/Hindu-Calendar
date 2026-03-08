export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export type CalendarDay = {
  date: Date;
  key: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isWeekend: boolean;
};

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addDays(date: Date, amount: number) {
  return startOfDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount));
}

export function addMonths(date: Date, amount: number) {
  return startOfMonth(new Date(date.getFullYear(), date.getMonth() + amount, 1));
}

export function getDaysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function buildDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function differenceInCalendarDays(left: Date, right: Date) {
  const leftStart = startOfDay(left).getTime();
  const rightStart = startOfDay(right).getTime();
  const dayInMs = 24 * 60 * 60 * 1000;

  return Math.round((leftStart - rightStart) / dayInMs);
}

export function formatMonthTitle(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatWeekdayDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function describeRelativeDay(target: Date, fromDate: Date) {
  const difference = differenceInCalendarDays(target, fromDate);

  if (difference === 0) {
    return 'Today';
  }

  if (difference === 1) {
    return 'Tomorrow';
  }

  if (difference === -1) {
    return 'Yesterday';
  }

  const absoluteDays = Math.abs(difference);
  return difference > 0 ? `${absoluteDays} days later` : `${absoluteDays} days ago`;
}

function getMondayFirstIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

export function getMonthMatrix(visibleMonth: Date) {
  const monthStart = startOfMonth(visibleMonth);
  const leadingDays = getMondayFirstIndex(monthStart);
  const gridStart = addDays(monthStart, -leadingDays);
  const weeks: CalendarDay[][] = [];

  for (let week = 0; week < 6; week += 1) {
    const row: CalendarDay[] = [];

    for (let day = 0; day < 7; day += 1) {
      const currentDate = addDays(gridStart, week * 7 + day);
      row.push({
        date: currentDate,
        key: buildDateKey(currentDate),
        dayNumber: currentDate.getDate(),
        inCurrentMonth: currentDate.getMonth() === visibleMonth.getMonth(),
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
      });
    }

    weeks.push(row);
  }

  return weeks;
}
