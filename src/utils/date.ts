import { format } from 'date-fns';

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
  const now = new Date();
  
  switch (filter) {
    case 'today':
      return taskDate.toDateString() === now.toDateString();
    case 'week': {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return taskDate >= weekAgo && taskDate <= now;
    }
    case 'month': {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      return taskDate >= monthAgo && taskDate <= now;
    }
    case '3months': {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      return taskDate >= threeMonthsAgo && taskDate <= now;
    }
    case '6months': {
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      return taskDate >= sixMonthsAgo && taskDate <= now;
    }
    case '12months': {
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
      return taskDate >= twelveMonthsAgo && taskDate <= now;
    }
    default:
      return true;
  }
};