import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, User, Users, CalendarDays } from 'lucide-react';
import { getGuestName } from '@/lib/guestHelpers';
import { formatDateTime } from '@/utils/date';

interface AmelaBookingInfoCardProps {
  booking: any;
}

const AmelaBookingInfoCard: React.FC<AmelaBookingInfoCardProps> = ({ booking }) => {
  const isCheckedIn = booking.status === 'checked_in';

  return (
    <Card className="bg-card hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">
                {booking.houses?.name || 'Unterkunft'}
              </p>
              <p className="text-xs text-muted-foreground">Buchung</p>
            </div>
          </div>
          {isCheckedIn && (
            <Badge variant="destructive" className="text-[10px] shrink-0">⚠️ Eingecheckt</Badge>
          )}
        </div>

        <div className="space-y-2 text-sm">
          {booking.houses?.address && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="break-words">{booking.houses.address}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-foreground">
            <User className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="truncate">{getGuestName(booking) || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <Users className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>{booking.number_of_guests ?? 0} Personen</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Check-in</span>
                <span className="text-sm">{formatDateTime(booking.check_in)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-rose-600 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Check-out</span>
                <span className="text-sm">{formatDateTime(booking.check_out)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AmelaBookingInfoCard;
