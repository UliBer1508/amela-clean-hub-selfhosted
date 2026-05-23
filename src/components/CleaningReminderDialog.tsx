import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export interface ReminderBooking {
  houseName: string;
  checkinDate: string | Date;
}

interface CleaningReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookings: ReminderBooking[];
}

export const CleaningReminderDialog = ({ open, onOpenChange, bookings }: CleaningReminderDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reinigungs-Erinnerung</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 text-sm text-foreground">
          {bookings.length === 0 ? (
            <p className="text-muted-foreground">Aktuell keine anstehenden Buchungen.</p>
          ) : (
            bookings.map((b, i) => (
              <p key={i} className="leading-relaxed">
                Hallo Amela, es steht eine Buchung für{' '}
                <span className="font-semibold">„{b.houseName}"</span> für den{' '}
                <span className="font-semibold">
                  {format(new Date(b.checkinDate), 'dd.MM.yyyy', { locale: de })}
                </span>{' '}
                an. Bitte Reinigung nicht vergessen. Vielen Dank.
              </p>
            ))
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CleaningReminderDialog;
