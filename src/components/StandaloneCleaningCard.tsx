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
      const dateStr = selectedDate.toISOString().split('T')[0];
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
          <div className="bg-background/80 rounded-lg p-3 md:p-4 space-y-2 md:space-y-3 border border-purple-200/30 dark:border-purple-800/30">
            <h4 className="font-medium text-foreground text-sm md:text-base">🧹 Reinigungsauftrag</h4>

            {/* Date and Time */}
            {config.showTaskDateTime && (
              <div className="flex items-center space-x-2 text-xs md:text-sm">
                <span>🕐 {formatDateTime(cleaning.scheduled_date, cleaning.scheduled_time)}</span>
              </div>
            )}

            {/* Staff Assignment */}
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
                        ? staff.find(s => s.id === cleaning.assigned_staff_id)?.name || 'Nicht zugewiesen'
                        : 'Nicht zugewiesen'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                    {staff.filter(s => s.is_active).map((staffMember) => (
                      <SelectItem key={staffMember.id} value={staffMember.id}>
                        {staffMember.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status */}
            {config.showTaskStatus && (
              <div className="flex items-center space-x-2">
                <span className="text-xs md:text-sm text-muted-foreground">Status:</span>
                <Select
                  value={cleaning.status}
                  onValueChange={(value: string) => onStatusUpdate(cleaning.id, value)}
                >
                  <SelectTrigger className="w-auto min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled" className="text-blue-700 dark:text-blue-300">📅 Geplant</SelectItem>
                    <SelectItem value="in_progress" className="text-yellow-700 dark:text-yellow-300">⏳ In Bearbeitung</SelectItem>
                    <SelectItem value="completed" className="text-green-700 dark:text-green-300">✅ Abgeschlossen</SelectItem>
                    <SelectItem value="delayed" className="text-orange-700 dark:text-orange-300">⚠️ Verzögert</SelectItem>
                    <SelectItem value="cancelled" className="text-red-700 dark:text-red-300">❌ Storniert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Payment Status */}
            {cleaning.payment_status && (
              <div className="flex items-center space-x-2 text-xs md:text-sm">
                <span className="text-muted-foreground">💰 Zahlung:</span>
                <Badge variant={
                  cleaning.payment_status === 'paid' ? 'default' : 
                  cleaning.payment_status === 'pending' ? 'secondary' : 
                  'destructive'
                }>
                  {cleaning.payment_status === 'paid' ? '✅ Bezahlt' : 
                   cleaning.payment_status === 'pending' ? '⏳ Ausstehend' : 
                   '❌ Unbezahlt'}
                </Badge>
              </div>
            )}

            {/* Notes */}
            {config.showTaskNotes && (
              <div className="mt-2 md:mt-3 p-2 bg-muted/30 rounded border-l-4 border-purple-500">
                <div className="flex items-start space-x-2">
                  <div className="text-purple-600 mt-0.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-muted-foreground text-sm font-bold">Notizen:</p>
                      {config.showEditableNotes && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingNotes(!editingNotes)}
                          className="h-8 px-2 text-xs min-h-[32px]"
                        >
                          {editingNotes ? 'Abbrechen' : 'Bearbeiten'}
                        </Button>
                      )}
                    </div>
                    {editingNotes ? (
                      <div className="space-y-2">
                        <Textarea
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          placeholder="Notizen hinzufügen..."
                          rows={3}
                          className="text-xs md:text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              onNotesUpdate?.(cleaning.id, notesValue);
                              setEditingNotes(false);
                            }}
                            className="h-8 px-3 text-xs min-h-[32px]"
                          >
                            Speichern
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNotesValue(cleaning.notes || '');
                              setEditingNotes(false);
                            }}
                            className="h-8 px-3 text-xs min-h-[32px]"
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs md:text-sm text-foreground whitespace-pre-wrap">
                        {cleaning.notes || 'Keine Notizen vorhanden'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* "Bevor du gehst!" Button */}
        <div className="p-3 md:p-4 border-t border-border">
          <Button 
            variant="outline"
            onClick={() => setShowChecklist(true)}
            className="w-full bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border-emerald-200 text-emerald-700 dark:from-emerald-950/30 dark:to-green-950/30 dark:border-emerald-800 dark:text-emerald-300 dark:hover:from-emerald-950/50 dark:hover:to-green-950/50"
          >
            ❗ Checkliste
          </Button>
        </div>

        <BeforeYouGoChecklist open={showChecklist} onOpenChange={setShowChecklist} />
      </CardContent>
    </Card>
  );
};

export default StandaloneCleaningCard;