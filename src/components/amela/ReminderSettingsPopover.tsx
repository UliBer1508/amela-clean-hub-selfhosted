import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CalendarClock, Minus, Plus } from 'lucide-react';
import { useReminderSettings } from '@/hooks/useReminderSettings';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReminderSettingsPopover: React.FC<Props> = ({ open, onOpenChange }) => {
  const { settings, update } = useReminderSettings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-amber-600" />
            Erinnerung
          </DialogTitle>
          <DialogDescription>
            Erinnerungs-Popup für die nächste Reinigung konfigurieren.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Label className="text-base font-medium">Erinnerung aktiv</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Popup vor der nächsten Reinigung einblenden
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => update({ enabled: checked })}
              className="flex-shrink-0"
            />
          </div>

          <div
            className={`flex items-center justify-between gap-3 ${
              !settings.enabled ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <div className="min-w-0 flex-1">
              <Label className="text-base font-medium">Tage vorher</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Popup erscheint, wenn die Reinigung in höchstens {settings.daysBefore}{' '}
                {settings.daysBefore === 1 ? 'Tag' : 'Tagen'} ansteht
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => update({ daysBefore: Math.max(0, settings.daysBefore - 1) })}
                className="w-11 h-11 rounded-md border border-border bg-card flex items-center justify-center active:scale-95 transition disabled:opacity-50"
                aria-label="Weniger Tage"
                disabled={settings.daysBefore <= 0}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center text-xl font-bold tabular-nums">
                {settings.daysBefore}
              </span>
              <button
                type="button"
                onClick={() => update({ daysBefore: Math.min(14, settings.daysBefore + 1) })}
                className="w-11 h-11 rounded-md border border-border bg-card flex items-center justify-center active:scale-95 transition disabled:opacity-50"
                aria-label="Mehr Tage"
                disabled={settings.daysBefore >= 14}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReminderSettingsPopover;
