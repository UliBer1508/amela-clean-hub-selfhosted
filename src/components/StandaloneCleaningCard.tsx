import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { StandaloneCleaningTask } from '@/types/booking';
import type { BookingCardConfig } from './BookingCardSettings';
import BeforeYouGoChecklist from './BeforeYouGoChecklist';
import CleaningActionTiles from './CleaningActionTiles';

const STATUS_FILTERS = {
  scheduled: '📅 Geplant',
  in_progress: '⏳ In Bearbeitung',
  completed: '✅ Abgeschlossen', 
  delayed: '⚠️ Verzögert',
  cancelled: '❌ Storniert'
};

interface StandaloneCleaningCardProps {
  cleaning: StandaloneCleaningTask;
  config: BookingCardConfig;
  staff: any[];
  onStatusUpdate: (taskId: string, status: string) => void;
  onStaffUpdate: (taskId: string, staffId: string | null) => void;
  onDateTimeUpdate: (taskId: string, date: string, time: string) => void;
  onNotesUpdate?: (taskId: string, notes: string) => void;
  formatDateTime: (date: string, time?: string) => string;
}

const StandaloneCleaningCard: React.FC<StandaloneCleaningCardProps> = ({
  cleaning,
  config,
  staff,
  onStatusUpdate,
  onStaffUpdate,
  onDateTimeUpdate,
  onNotesUpdate,
  formatDateTime,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(cleaning.notes || '');
  const [isEditingDateTime, setIsEditingDateTime] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const handleEditDateTime = () => {
    setSelectedDate(new Date(cleaning.scheduled_date));
    setSelectedTime(cleaning.scheduled_time || '');
    setIsEditingDateTime(true);
  };

  const handleDateTimeUpdateInternal = () => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      onDateTimeUpdate(cleaning.id, dateStr, selectedTime);
      setIsEditingDateTime(false);
    }
  };

  return (
    <Card className="overflow-hidden hover-scale border-l-8 border-l-purple-500">
      <CardContent className="p-0">
        {/* House Information Header with Standalone Badge */}
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 p-3 md:p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 text-xs">
                🔧 Standalone
              </Badge>
              {config.showHouseName && (
                <span className="font-semibold text-foreground text-sm md:text-base">
                  🏠 {cleaning.houses?.name}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              ID: {cleaning.id.slice(-8)}
            </span>
          </div>
          {config.showHouseAddress && cleaning.houses?.address && (
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs md:text-sm text-muted-foreground">
                📍 Adresse: {cleaning.houses.address}
              </span>
            </div>
          )}
        </div>

        {/* Cleaning Task Details */}
        <div className="bg-purple-50 dark:bg-purple-950/20 p-3 md:p-4">
          <div className="bg-background/80 rounded-lg p-3 md:p-4 space-y-3 border border-purple-200/30 dark:border-purple-800/30">
            <h4 className="font-medium text-foreground text-sm md:text-base">🧹 Reinigungsauftrag</h4>

            {/* Staff Assignment (unverändert) */}
            {config.showTaskAssignment && (
              <div className="flex items-center space-x-2 text-xs md:text-sm">
                <span className="text-muted-foreground">👨‍💼 Zugewiesen an:</span>
                <Select
                  value={cleaning.assigned_staff_id || 'unassigned'}
                  onValueChange={(value: string) =>
                    onStaffUpdate(cleaning.id, value === 'unassigned' ? null : value)
                  }
                >
                  <SelectTrigger className="w-auto min-h-[44px]">
                    <SelectValue>
                      {cleaning.assigned_staff_id
                        ? staff.find((s) => s.id === cleaning.assigned_staff_id)?.name || 'Nicht zugewiesen'
                        : 'Nicht zugewiesen'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                    {staff.filter((s) => s.is_active).map((staffMember) => (
                      <SelectItem key={staffMember.id} value={staffMember.id}>
                        {staffMember.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <CleaningActionTiles
              taskId={cleaning.id}
              scheduledDate={cleaning.scheduled_date}
              scheduledTime={cleaning.scheduled_time}
              status={cleaning.status}
              notes={cleaning.notes}
              showDateTime={config.showTaskDateTime}
              showStatus={config.showTaskStatus}
              showNotes={true}
              onStatusUpdate={onStatusUpdate}
              onDateTimeUpdate={onDateTimeUpdate}
              onNotesUpdate={onNotesUpdate}
              formatDateTime={formatDateTime}
            />

            {/* Payment Status */}
            {cleaning.payment_status && (
              <div className="flex items-center space-x-2 text-xs md:text-sm">
                <span className="text-muted-foreground">💰 Zahlung:</span>
                <Badge
                  variant={
                    cleaning.payment_status === 'paid'
                      ? 'default'
                      : cleaning.payment_status === 'pending'
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {cleaning.payment_status === 'paid'
                    ? '✅ Bezahlt'
                    : cleaning.payment_status === 'pending'
                    ? '⏳ Ausstehend'
                    : '❌ Unbezahlt'}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StandaloneCleaningCard;