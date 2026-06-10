import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, User, Users, CalendarDays, AlertTriangle } from 'lucide-react';
import { getGuestName } from '@/lib/guestHelpers';
import { formatDateTime } from '@/utils/date';
import LaundryStatusRow from './LaundryStatusRow';

interface AmelaBookingInfoCardProps {
  booking: any;
  accentColor?: string;
}

const AmelaBookingInfoCard: React.FC<AmelaBookingInfoCardProps> = ({ booking, accentColor }) => {
  const isCheckedIn = booking.status === 'checked_in';

  return (
    <Card
      className="bg-[#fdf6d8] dark:bg-amber-950/30 border-l-4 active:scale-[0.99] transition-transform select-none"
      style={accentColor ? { borderLeftColor: accentColor } : undefined}
    >
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Home className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">
                {booking.houses?.name || 'Unterkunft'}
              </p>
              <p className="text-muted-foreground text-xs font-bold">Buchung</p>
            </div>
          </div>
          {isCheckedIn && (
            <Badge variant="destructive" className="text-[10px] shrink-0">⚠️ Eingecheckt</Badge>
          )}
        </div>


        <div className="flex items-center gap-1.5 text-sm text-foreground">
          <User className="w-4 h-4 text-muted-foreground shrink-0 font-bold" />
          <span className="truncate min-w-0 text-sm font-bold">{getGuestName(booking) || '—'}</span>
          <span className="text-muted-foreground shrink-0">·</span>
          <Users className="w-4 h-4 text-muted-foreground shrink-0 font-bold" />
          <span className="shrink-0 text-sm font-bold">{booking.number_of_guests ?? 0}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-md bg-muted/30 p-2 border-2">
            <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground leading-tight font-bold">Check-in</span>
              <span className="text-sm font-medium whitespace-nowrap">{formatDateTime(booking.check_in)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-muted/30 p-2 border-2">
            <CalendarDays className="w-4 h-4 text-rose-600 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground leading-tight font-bold">Check-out</span>
              <span className="text-sm font-medium whitespace-nowrap">{formatDateTime(booking.check_out)}</span>
            </div>
          </div>
        </div>

        <LaundryStatusRow orders={booking.linen_orders} />
      </CardContent>
    </Card>
  );
};

export default AmelaBookingInfoCard;
