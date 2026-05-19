import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Clock, CalendarIcon, Pencil, ClipboardCheck, ChevronDown, CheckCircle2, XCircle, AlertTriangle, PlayCircle, StickyNote } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/date';
import BeforeYouGoChecklist from '@/components/BeforeYouGoChecklist';

interface AmelaCleaningCardProps {
  task: any;
  staff: any[];
  onStatusUpdate: (taskId: string, status: string) => void;
  onStaffUpdate: (taskId: string, staffId: string | null) => void;
  onDateTimeUpdate: (taskId: string, date: string, time: string) => void;
  onNotesUpdate?: (taskId: string, notes: string) => void;
  positionLabel?: string;
  accentColor?: string;
}

const STATUS_OPTIONS: Array<{ value: string; label: string; Icon: typeof CheckCircle2 }> = [
  { value: 'scheduled', label: 'Geplant', Icon: CalendarIcon },
  { value: 'in_progress', label: 'In Bearbeitung', Icon: PlayCircle },
  { value: 'completed', label: 'Abgeschlossen', Icon: CheckCircle2 },
  { value: 'delayed', label: 'Verzögert', Icon: AlertTriangle },
  { value: 'cancelled', label: 'Storniert', Icon: XCircle },
];

const AmelaCleaningCard: React.FC<AmelaCleaningCardProps> = ({
  task,
  staff,
  onStatusUpdate,
  onStaffUpdate,
  onDateTimeUpdate,
  onNotesUpdate,
  positionLabel,
  accentColor,
}) => {
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [showChecklist, setShowChecklist] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(task.notes || '');
  const [expanded, setExpanded] = useState(task.status !== 'completed');

  const openDateDialog = () => {
    setSelectedDate(task.scheduled_date ? new Date(task.scheduled_date) : new Date());
    setSelectedTime(task.scheduled_time || '');
    setIsDateDialogOpen(true);
  };

  const saveDateTime = () => {
    if (!selectedDate) return;
    const dateStr = selectedDate.toISOString().split('T')[0];
    onDateTimeUpdate(task.id, dateStr, selectedTime);
    setIsDateDialogOpen(false);
  };

  const paymentStatus = task.payment_status as string | undefined;
  const paymentBadge =
    paymentStatus === 'paid'
      ? { variant: 'default' as const, label: 'Bezahlt', Icon: CheckCircle2, className: '' }
      : paymentStatus === 'pending'
      ? { variant: 'secondary' as const, label: 'Ausstehend', Icon: Clock, className: '' }
      : paymentStatus === 'unpaid'
      ? { variant: 'outline' as const, label: 'Unbezahlt', Icon: XCircle, className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800' }
      : null;

  return (
    <Card
      className="bg-sky-50 dark:bg-sky-950/30 border-l-4 hover:shadow-md transition-shadow"
      style={accentColor ? { borderLeftColor: accentColor } : undefined}
    >
      <CardContent className="p-3 space-y-2.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between gap-2 text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-sky-500/15 text-sky-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground text-sm">Reinigungsauftrag</p>
                {positionLabel && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{positionLabel}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {formatDateTime(task.scheduled_date, task.scheduled_time)}
                {' · '}
                {STATUS_OPTIONS.find((o) => o.value === task.status)?.label ?? task.status}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {paymentBadge && (
              <Badge variant={paymentBadge.variant} className={cn("text-[10px] gap-1", paymentBadge.className)}>
                <paymentBadge.Icon className="w-3 h-3" />
                {paymentBadge.label}
              </Badge>
            )}
            <ChevronDown
              className={cn(
                'w-5 h-5 text-muted-foreground transition-transform',
                expanded && 'rotate-180'
              )}
            />
          </div>
        </button>

        {expanded && (
          <>


        {/* Termin – klickbar */}
        <button
          type="button"
          onClick={openDateDialog}
          className="w-full flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors p-3 min-h-[44px] text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="uppercase tracking-wide text-muted-foreground font-bold text-xs">Reinigungstermin</span>
              <span className="text-sm font-medium truncate">
                {formatDateTime(task.scheduled_date, task.scheduled_time)}
              </span>
            </div>
          </div>
        </button>


        {/* Status */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-bold text-muted-foreground w-20 shrink-0">Status</Label>
          <Select value={task.status} onValueChange={(v) => onStatusUpdate(task.id, v)}>
            <SelectTrigger className="min-h-[44px] flex-1 bg-sky-100 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="inline-flex items-center gap-2">
                    <opt.Icon className="w-4 h-4" />
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>




        {/* Notizen (kompakt) – ganze Karte klickbar */}
        {onNotesUpdate && (
          <div className="rounded-lg border border-border bg-muted/20 p-2">
            {editingNotes ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm font-bold">📝 Notizen</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingNotes(false)}
                    className="h-7 px-2 text-xs"
                  >
                    Abbrechen
                  </Button>
                </div>
                <Textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  rows={3}
                  placeholder="Notizen hinzufügen..."
                  className="text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    onNotesUpdate(task.id, notesValue);
                    setEditingNotes(false);
                  }}
                >
                  Speichern
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setNotesValue(task.notes || '');
                  setEditingNotes(true);
                }}
                className="w-full text-left min-h-[44px] rounded-md hover:bg-muted/40 transition-colors p-1"
              >
                <span className="text-muted-foreground text-sm font-bold">📝 Notizen</span>
                <p className="text-sm text-foreground whitespace-pre-wrap mt-1">
                  {task.notes || <span className="text-muted-foreground">Keine Notizen – tippen zum Hinzufügen</span>}
                </p>
              </button>
            )}
          </div>
        )}


        {/* Checklist Button */}
        <Button
          variant="outline"
          onClick={() => setShowChecklist(true)}
          className="w-full min-h-[44px] bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300"
        >
          <ClipboardCheck className="w-4 h-4 mr-2" />
          Checkliste
        </Button>
          </>
        )}

        <BeforeYouGoChecklist open={showChecklist} onOpenChange={setShowChecklist} />



        {/* Datum/Zeit Dialog */}
        <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reinigungstermin ändern</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Datum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal min-h-[44px]',
                        !selectedDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'dd.MM.yyyy') : 'Datum auswählen'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Uhrzeit</Label>
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDateDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={saveDateTime}>Speichern</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AmelaCleaningCard;
