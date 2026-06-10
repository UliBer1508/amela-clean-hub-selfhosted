import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, ChevronDown, CheckCircle2, XCircle, AlertTriangle, PlayCircle, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/date';
import CleaningActionTiles from '@/components/CleaningActionTiles';
import type { ServiceTask, StandaloneCleaningTask } from '@/types/booking';
import type { CleaningStaff } from '@/types/staff';

type CardTask = (ServiceTask | StandaloneCleaningTask) & { id: string };

interface AmelaCleaningCardProps {
  task: CardTask;
  staff: CleaningStaff[];
  onStatusUpdate: (taskId: string, status: string) => void;
  onStaffUpdate: (taskId: string, staffId: string | null) => void;
  onDateTimeUpdate: (taskId: string, date: string, time: string) => void;
  onNotesUpdate?: (taskId: string, notes: string) => void;
  positionLabel?: string;
  accentColor?: string;
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Geplant',
  in_progress: 'In Bearbeitung',
  completed: 'Abgeschlossen',
  delayed: 'Verzögert',
  cancelled: 'Storniert',
};

const AmelaCleaningCard: React.FC<AmelaCleaningCardProps> = ({
  task,
  onStatusUpdate,
  onDateTimeUpdate,
  onNotesUpdate,
  positionLabel,
  accentColor,
}) => {
  const [expanded, setExpanded] = useState(task.status !== 'completed');

  const paymentStatus = task.payment_status as string | undefined;
  const paymentBadge =
    paymentStatus === 'paid'
      ? { variant: 'default' as const, label: 'Bezahlt', Icon: CheckCircle2, className: '' }
      : paymentStatus === 'pending'
      ? { variant: 'secondary' as const, label: 'Ausstehend', Icon: Clock, className: '' }
      : paymentStatus === 'unpaid'
      ? { variant: 'outline' as const, label: 'Unbezahlt', Icon: XCircle, className: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' }
      : null;

  return (
    <Card
      className="bg-surface-tint border-l-4 hover:shadow-md transition-shadow"
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
                {STATUS_LABELS[task.status] ?? task.status}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {paymentBadge && (
              <Badge variant={paymentBadge.variant} className={cn('text-[10px] gap-1', paymentBadge.className)}>
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
          <CleaningActionTiles
            taskId={task.id}
            scheduledDate={task.scheduled_date}
            scheduledTime={task.scheduled_time}
            status={task.status}
            notes={task.notes}
            onStatusUpdate={onStatusUpdate}
            onDateTimeUpdate={onDateTimeUpdate}
            onNotesUpdate={onNotesUpdate}
            formatDateTime={formatDateTime}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default AmelaCleaningCard;
