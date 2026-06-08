import React from 'react';
import { Shirt } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import type { LinenOrder } from '@/types/booking';

interface LaundryStatusRowProps {
  orders?: LinenOrder[] | null;
}

type DisplayState = {
  variant: 'delivered' | 'incoming' | 'ordered' | 'none';
  text: string;
};

const formatDate = (iso: string | null) => {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'dd.MM.', { locale: de });
  } catch {
    return '';
  }
};

const getDisplayState = (orders?: LinenOrder[] | null): DisplayState => {
  const active = (orders || []).filter(o => o.status !== 'cancelled');
  if (active.length === 0) {
    return { variant: 'none', text: 'Keine Wäsche bestellt' };
  }

  const delivered = active.find(o => o.status === 'delivered');
  if (delivered) {
    const d = formatDate(delivered.delivery_date);
    return { variant: 'delivered', text: d ? `Geliefert · ${d}` : 'Geliefert' };
  }

  const upcoming = active
    .filter(o => o.delivery_date)
    .sort((a, b) => (a.delivery_date! < b.delivery_date! ? -1 : 1))[0];
  if (upcoming) {
    const d = formatDate(upcoming.delivery_date);
    const t = upcoming.delivery_time ? ` ${upcoming.delivery_time.slice(0, 5)}` : '';
    return { variant: 'incoming', text: `Lieferung ${d}${t}` };
  }

  const totalItems = active.reduce((sum, o) => sum + (o.total_items || 0), 0);
  return {
    variant: 'ordered',
    text: totalItems > 0 ? `Bestellt · ${totalItems} Stk.` : 'Bestellt',
  };
};

const variantStyles: Record<DisplayState['variant'], { dot: string; text: string; icon: string }> = {
  delivered: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', icon: 'text-emerald-600' },
  incoming: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', icon: 'text-amber-600' },
  ordered: { dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', icon: 'text-blue-600' },
  none: { dot: 'bg-muted-foreground/40', text: 'text-muted-foreground', icon: 'text-muted-foreground' },
};

const LaundryStatusRow: React.FC<LaundryStatusRowProps> = ({ orders }) => {
  const state = getDisplayState(orders);
  const styles = variantStyles[state.variant];

  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/30 p-2 border-2">
      <Shirt className={`w-4 h-4 shrink-0 ${styles.icon}`} />
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold shrink-0">
        Wäsche
      </span>
      <div className="flex items-center gap-1.5 ml-auto min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />
        <span className={`text-sm font-medium truncate ${styles.text}`}>{state.text}</span>
      </div>
    </div>
  );
};

export default LaundryStatusRow;
