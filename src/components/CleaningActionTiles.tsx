import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Clock, CircleDot, StickyNote, ClipboardCheck, CalendarIcon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import BeforeYouGoChecklist from './BeforeYouGoChecklist';

const STATUS_OPTIONS: Array<{
  value: 'scheduled' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  label: string;
  emoji: string;
  ring: string;
  dot: string;
}> = [
  { value: 'scheduled',   label: 'Geplant',         emoji: '📅', ring: 'ring-blue-400',   dot: 'bg-blue-500' },
  { value: 'in_progress', label: 'In Bearbeitung',  emoji: '⏳', ring: 'ring-yellow-400', dot: 'bg-yellow-500' },
  { value: 'completed',   label: 'Abgeschlossen',   emoji: '✅', ring: 'ring-green-400',  dot: 'bg-green-500' },
  { value: 'delayed',     label: 'Verzögert',       emoji: '⚠️', ring: 'ring-orange-400', dot: 'bg-orange-500' },
  { value: 'cancelled',   label: 'Storniert',       emoji: '❌', ring: 'ring-red-400',    dot: 'bg-red-500' },
];

interface CleaningActionTilesProps {
  taskId: string;
  scheduledDate: string;
  scheduledTime?: string | null;
  status: string;
  notes?: string | null;
  showDateTime?: boolean;
  showStatus?: boolean;
  showNotes?: boolean;
  onStatusUpdate: (taskId: string, status: string) => void;
  onDateTimeUpdate: (taskId: string, date: string, time: string) => void;
  onNotesUpdate?: (taskId: string, notes: string) => void;
  formatDateTime: (date: string, time?: string) => string;
}

interface TileProps {
  label: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  onClick?: () => void;
  ringClass?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

const Tile: React.FC<TileProps> = ({ label, icon, value, onClick, ringClass, ariaLabel, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel || label}
    className={cn(
      'flex flex-col items-start text-left gap-1 min-h-[72px] rounded-2xl p-3 bg-card shadow-sm',
      'transition active:scale-[0.98] hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'disabled:opacity-60 disabled:active:scale-100 disabled:cursor-not-allowed border-2',
      ringClass && `ring-2 ${ringClass}`
    )}
  >
    <div className="flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide text-[11px] font-bold">
      {icon}
      <span className="font-bold">{label}</span>
    </div>
    <div className="text-sm font-semibold text-foreground truncate w-full border-2">{value}</div>
  </button>
);

const CleaningActionTiles: React.FC<CleaningActionTilesProps> = ({
  taskId,
  scheduledDate,
  scheduledTime,
  status,
  notes,
  showDateTime = true,
  showStatus = true,
  showNotes = true,
  onStatusUpdate,
  onDateTimeUpdate,
  onNotesUpdate,
  formatDateTime,
}) => {
  const [dateOpen, setDateOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notesValue, setNotesValue] = useState<string>(notes || '');

  const statusMeta = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];

  const openDate = () => {
    setSelectedDate(scheduledDate ? new Date(scheduledDate) : new Date());
    setSelectedTime(scheduledTime || '');
    setDateOpen(true);
  };

  const openNotes = () => {
    setNotesValue(notes || '');
    setNotesOpen(true);
  };

  const handleDateSave = () => {
    if (selectedDate) {
      onDateTimeUpdate(taskId, selectedDate.toISOString().split('T')[0], selectedTime);
      setDateOpen(false);
    }
  };

  const notesPreview = (notes || '').trim();

  return (
    <>
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {showDateTime && (
          <Tile
            label="Reinigungstermin"
            icon={<Clock className="w-3.5 h-3.5" />}
            value={formatDateTime(scheduledDate, scheduledTime || undefined)}
            onClick={openDate}
            ariaLabel="Reinigungstermin ändern"
          />
        )}
        {showStatus && (
          <Tile
            label="Status"
            icon={<CircleDot className="w-3.5 h-3.5" />}
            value={
              <span className="flex items-center gap-1.5">
                <span className={cn('w-2.5 h-2.5 rounded-full', statusMeta.dot)} />
                {statusMeta.label}
              </span>
            }
            onClick={() => setStatusOpen(true)}
            ringClass={statusMeta.ring}
            ariaLabel={`Status ändern, aktuell ${statusMeta.label}`}
          />
        )}
        {showNotes && (
          <Tile
            label="Notizen"
            icon={<StickyNote className="w-3.5 h-3.5" />}
            value={
              <span className={cn(!notesPreview && 'text-muted-foreground font-normal')}>
                {notesPreview ? (notesPreview.length > 40 ? notesPreview.slice(0, 40) + '…' : notesPreview) : 'Keine'}
              </span>
            }
            onClick={openNotes}
            ariaLabel="Notizen bearbeiten"
          />
        )}
        <Tile
          label="Checkliste"
          icon={<ClipboardCheck className="w-3.5 h-3.5" />}
          value="Öffnen"
          onClick={() => setShowChecklist(true)}
          ariaLabel="Checkliste öffnen"
        />
      </div>

      {/* Termin-Dialog */}
      <Dialog open={dateOpen} onOpenChange={setDateOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[80vh] overflow-y-auto rounded-3xl p-5 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-left">Reinigungstermin ändern</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Datum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal min-h-[48px]',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'dd.MM.yyyy') : 'Datum wählen'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor={`time-${taskId}`}>Uhrzeit</Label>
              <Input
                id={`time-${taskId}`}
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="min-h-[48px]"
              />
            </div>
          </div>
          <DialogFooter className="mt-4 flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1 min-h-[48px]">Abbrechen</Button>
            </DialogClose>
            <Button onClick={handleDateSave} disabled={!selectedDate} className="flex-1 min-h-[48px]">
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status-Dialog */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[80vh] overflow-y-auto rounded-3xl p-5 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-left">Status ändern</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {STATUS_OPTIONS.map((opt) => {
              const active = opt.value === status;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onStatusUpdate(taskId, opt.value);
                    setStatusOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-4 min-h-[52px] rounded-xl border bg-card text-left',
                    'transition active:scale-[0.98] hover:bg-accent/40',
                    active && `ring-2 ${opt.ring}`
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={cn('w-3 h-3 rounded-full', opt.dot)} />
                    <span className="font-medium">{opt.emoji} {opt.label}</span>
                  </span>
                  {active && <Check className="w-4 h-4 text-foreground" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Notizen-Dialog */}
      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[80vh] overflow-y-auto rounded-3xl p-5 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-left">Notizen</DialogTitle>
          </DialogHeader>
          <Textarea
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            placeholder="Notizen hinzufügen..."
            rows={6}
            className="mt-2"
          />
          <DialogFooter className="mt-4 flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1 min-h-[48px]">Abbrechen</Button>
            </DialogClose>
            <Button
              onClick={() => {
                onNotesUpdate?.(taskId, notesValue);
                setNotesOpen(false);
              }}
              className="flex-1 min-h-[48px]"
            >
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BeforeYouGoChecklist open={showChecklist} onOpenChange={setShowChecklist} />
    </>
  );
};

export default CleaningActionTiles;
