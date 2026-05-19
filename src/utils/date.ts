import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns';

export const formatGermanDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString: string, timeString?: string): string => {
  const dateStr = formatGermanDate(dateString);

  if (timeString) {
    return `${dateStr} - ${timeString.slice(0, 5)} Uhr`;
  }
  return dateStr;
};

export const isWithinTimeRange = (date: string, filter: string): boolean => {
  if (filter === 'all') return true;

  const taskDate = new Date(date);
  taskDate.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (filter) {
    case 'today':
      return taskDate.getTime() === now.getTime();
    case 'week':
    case 'thisWeek': {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      return taskDate >= start && taskDate <= end;
    }
    case 'nextWeek': {
      const nextWeek = addWeeks(now, 1);
      const start = startOfWeek(nextWeek, { weekStartsOn: 1 });
      const end = endOfWeek(nextWeek, { weekStartsOn: 1 });
      return taskDate >= start && taskDate <= end;
    }
    case 'month': {
      const end = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      return taskDate >= now && taskDate <= end;
    }
    case '3months': {
      const end = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      return taskDate >= now && taskDate <= end;
    }
    case '6months': {
      const end = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
      return taskDate >= now && taskDate <= end;
    }
    case '12months': {
      const end = new Date(now.getFullYear(), now.getMonth() + 12, now.getDate());
      return taskDate >= now && taskDate <= end;
    }
    default:
      return true;
  }
};
