import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { 
  Home, 
  MapPin, 
  User, 
  Users, 
  Calendar, 
  Clock, 
  Mail, 
  Phone, 
  CreditCard,
  Globe,
  Calendar as CalendarIcon
} from 'lucide-react';
import { cn, getColorFromString } from '@/lib/utils';
import { getGuestName, getGuestEmail, getGuestPhone, getGuestNationality } from '@/lib/guestHelpers';
import { format } from 'date-fns';

import type { BookingCardConfig } from './BookingCardSettings';
import BeforeYouGoChecklist from './BeforeYouGoChecklist';
import CleaningActionTiles from './CleaningActionTiles';

const STATUS_FILTERS = {
  all: 'Alle Status',
  scheduled: '📅 Geplant',
  in_progress: '⏳ In Bearbeitung',
  completed: '✅ Abgeschlossen', 
  delayed: '⚠️ Verzögert',
  cancelled: '❌ Storniert'
};

interface ConfigurableBookingCardProps {
  booking: any;
  config: BookingCardConfig;
  staff: any[];
  onStatusUpdate: (taskId: string, status: string) => void;
  onStaffUpdate: (taskId: string, staffId: string | null) => void;
  onDateTimeUpdate: (taskId: string, date: string, time: string) => void;
  onBookingNotesUpdate?: (bookingId: string, notes: string) => void;
  onTaskNotesUpdate?: (taskId: string, notes: string) => void;
  formatDateTime: (date: string, time?: string) => string;
}

const ConfigurableBookingCard: React.FC<ConfigurableBookingCardProps> = ({
  booking,
  config,
  staff,
  onStatusUpdate,
  onStaffUpdate,
  onDateTimeUpdate,
  onBookingNotesUpdate,
  onTaskNotesUpdate,
  formatDateTime,
}) => {
  const [selectedDate, setSelectedDate] = React.useState<Date>();
  const [selectedTime, setSelectedTime] = React.useState('');
  const [editingTask, setEditingTask] = React.useState<any>(null);
  const [editingBookingNotes, setEditingBookingNotes] = useState(false);
  const [editingTaskNotes, setEditingTaskNotes] = useState<string | null>(null);
  const [bookingNotesValue, setBookingNotesValue] = useState(booking.notes || '');
  const [taskNotesValue, setTaskNotesValue] = useState<{[key: string]: string}>({});
  const [showChecklist, setShowChecklist] = useState(false);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);

  const handleEditDateTime = (task: any) => {
    setEditingTask(task);
    setSelectedDate(new Date(task.scheduled_date));
    setSelectedTime(task.scheduled_time || '');
    setIsDateDialogOpen(true);
  };

  const handleDateTimeUpdateInternal = () => {
    if (editingTask && selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      onDateTimeUpdate(editingTask.id, dateStr, selectedTime);
      setEditingTask(null);
      setIsDateDialogOpen(false);
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden hover-scale border-l-8",
      getColorFromString(booking.id)
    )}>
      <CardContent className="p-0">
        {/* House Information Header */}
        {(config.showHouseName || config.showHouseAddress) && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-3 md:p-4 border-b border-border">
            {config.showHouseName && (
              <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                   <span className="font-semibold text-foreground text-sm md:text-base">
                     🏠 {booking.houses?.name}
                   </span>
                 </div>
                {config.showBookingId && (
                  <span className="text-xs text-muted-foreground font-mono">
                    ID: {booking.id.slice(-8)}
                  </span>
                )}
              </div>
            )}
            {config.showHouseAddress && (
               <div className="flex items-center space-x-2 mt-1">
                 <span className="text-xs md:text-sm text-muted-foreground">
                   📍 Adresse: {booking.houses?.address}
                 </span>
               </div>
            )}
          </div>
        )}

        {/* Warnung für eingecheckte Gäste */}
        {booking.status === 'checked_in' && (
          <div className="bg-orange-100 dark:bg-orange-900/40 border-b border-orange-200 dark:border-orange-800 p-2 md:p-3">
            <div className="flex items-center space-x-2 text-orange-800 dark:text-orange-200">
              <span className="text-lg">⚠️</span>
              <span className="font-semibold text-xs md:text-sm">GAST IST EINGECHECKT - Aktuell vor Ort!</span>
            </div>
          </div>
        )}

        <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 md:p-4 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
          {/* Guest Information */}
          <div className="space-y-2 md:space-y-3">
            {config.showGuestName && (
              <div className="flex items-center space-x-2">
                <span className="text-xs md:text-sm font-medium">👤 Gast: {getGuestName(booking)}</span>
              </div>
            )}
            
            {config.showGuestCount && (
              <div className="flex items-center space-x-2">
                <span className="text-xs md:text-sm font-medium">👥 Gäste: {booking.number_of_guests} Personen</span>
              </div>
            )}

            {config.showGuestEmail && getGuestEmail(booking) && (
              <div className="flex items-center space-x-2">
                <span className="text-xs md:text-sm">📧 E-Mail: {getGuestEmail(booking)}</span>
              </div>
            )}

            {config.showGuestPhone && getGuestPhone(booking) && (
              <div className="flex items-center space-x-2">
                <span className="text-xs md:text-sm">📞 Telefon: {getGuestPhone(booking)}</span>
              </div>
            )}

            {config.showNationality && getGuestNationality(booking) && (
              <div className="flex items-center space-x-2">
                <span className="text-xs md:text-sm">🌍 Nationalität: {getGuestNationality(booking)}</span>
              </div>
            )}

            {config.showCheckInDate && (
              <div className="flex items-center space-x-2">
                <span className="text-xs md:text-sm">📅 Check-in: {formatDateTime(booking.check_in)}</span>
              </div>
            )}

            {config.showCheckOutDate && (
              <div className="flex items-center space-x-2">
                <span className="text-xs md:text-sm">📅 Check-out: {formatDateTime(booking.check_out)}</span>
              </div>
            )}

            {config.showBookingAmount && booking.booking_amount && (
               <div className="flex items-center space-x-2">
                 <span className="text-xs md:text-sm">
                   💰 Betrag: {booking.booking_amount}
                   {config.showCurrency && ` ${booking.currency || 'EUR'}`}
                 </span>
               </div>
            )}

            {config.showBookingStatus && (
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={booking.status === 'checked_in' ? 'destructive' : 
                           booking.status === 'confirmed' ? 'default' : 'secondary'}
                  className={booking.status === 'checked_in' ? 'animate-pulse' : ''}
                >
                  {booking.status === 'confirmed' && '✅ Bestätigt'}
                  {booking.status === 'checked_in' && '⚠️ Eingecheckt'}
                  {booking.status === 'checked_out' && '✔️ Ausgecheckt'}
                  {booking.status === 'cancelled' && '❌ Storniert'}
                  {!['confirmed', 'checked_in', 'checked_out', 'cancelled'].includes(booking.status) && booking.status}
                </Badge>
              </div>
            )}

            {config.showPlatform && booking.platform && (
              <div className="flex items-center space-x-2">
                <span className="text-xs md:text-sm">Plattform: {booking.platform}</span>
              </div>
            )}

            {/* Booking Notes */}
            {config.showBookingNotes && (
              <div className="mt-2 md:mt-3 p-2 bg-muted/30 rounded border-l-4 border-blue-500">
                <div className="flex items-start space-x-2">
                  <div className="text-blue-600 mt-0.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-muted-foreground text-sm font-bold">Buchungsnotizen:</p>
                      {config.showEditableNotes && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingBookingNotes(!editingBookingNotes)}
                          className="h-8 px-2 text-xs min-h-[32px]"
                        >
                          {editingBookingNotes ? 'Abbrechen' : 'Bearbeiten'}
                        </Button>
                      )}
                    </div>
                    {editingBookingNotes ? (
                      <div className="space-y-2">
                        <Textarea
                          value={bookingNotesValue}
                          onChange={(e) => setBookingNotesValue(e.target.value)}
                          placeholder="Buchungsnotizen hinzufügen..."
                          rows={3}
                          className="text-xs md:text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              onBookingNotesUpdate?.(booking.id, bookingNotesValue);
                              setEditingBookingNotes(false);
                            }}
                            className="h-8 px-3 text-xs min-h-[32px]"
                          >
                            Speichern
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setBookingNotesValue(booking.notes || '');
                              setEditingBookingNotes(false);
                            }}
                            className="h-8 px-3 text-xs min-h-[32px]"
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs md:text-sm text-foreground whitespace-pre-wrap">
                        {booking.notes || 'Keine Notizen vorhanden'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Task Notes */}
            {config.showTaskNotes && (
              <div className="mt-3 p-2 bg-muted/30 rounded border-l-4 border-blue-500">
                <div className="flex items-start space-x-2">
                  <div className="text-blue-600 mt-0.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-muted-foreground text-sm font-bold mb-1">Aufgaben Notizen:</p>
                    {booking.service_tasks?.map((task: any) => (
                      <div key={task.id} className="mb-2 last:mb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Reinigung {task.id.slice(-4)}:</span>
                          {config.showEditableNotes && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (editingTaskNotes === task.id) {
                                  setEditingTaskNotes(null);
                                  setTaskNotesValue(prev => ({ ...prev, [task.id]: undefined }));
                                } else {
                                  setEditingTaskNotes(task.id);
                                  setTaskNotesValue(prev => ({ ...prev, [task.id]: task.notes || '' }));
                                }
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              {editingTaskNotes === task.id ? 'Abbrechen' : 'Bearbeiten'}
                            </Button>
                          )}
                        </div>
                        {editingTaskNotes === task.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={taskNotesValue[task.id] || ''}
                              onChange={(e) => setTaskNotesValue(prev => ({ ...prev, [task.id]: e.target.value }))}
                              placeholder="Aufgaben-Notizen hinzufügen..."
                              rows={3}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  onTaskNotesUpdate?.(task.id, taskNotesValue[task.id] || '');
                                  setEditingTaskNotes(null);
                                }}
                                className="h-7 px-3 text-xs"
                              >
                                Speichern
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTaskNotesValue(prev => ({ ...prev, [task.id]: task.notes || '' }));
                                  setEditingTaskNotes(null);
                                }}
                                className="h-7 px-3 text-xs"
                              >
                                Abbrechen
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {task.notes || 'Keine Notizen vorhanden'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cleaning Tasks */}
          {config.showCleaningTasks && (
            <div className="space-y-2 md:space-y-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 md:p-4 border border-blue-100 dark:border-blue-900/50">
              <h4 className="font-medium text-foreground text-sm md:text-base">🧹 Reinigungsauftrag</h4>
              {booking.service_tasks?.map((task: any) => (
                <div key={task.id} className="bg-background/80 rounded-lg p-2 md:p-3 space-y-3 border border-blue-200/30 dark:border-blue-800/30">
                  {config.showTaskAssignment && (
                    <div className="flex items-center space-x-2 text-xs md:text-sm">
                      <span className="text-muted-foreground">👨‍💼 Zugewiesen an:</span>
                      <Select
                        value={task.assigned_staff_id || 'unassigned'}
                        onValueChange={(value: string) =>
                          onStaffUpdate(task.id, value === 'unassigned' ? null : value)
                        }
                      >
                        <SelectTrigger className="w-auto min-h-[44px]">
                          <SelectValue>
                            {task.assigned_staff_id
                              ? staff.find((s) => s.id === task.assigned_staff_id)?.name || 'Nicht zugewiesen'
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
                    taskId={task.id}
                    scheduledDate={task.scheduled_date}
                    scheduledTime={task.scheduled_time}
                    status={task.status}
                    notes={task.notes}
                    showDateTime={config.showTaskDateTime}
                    showStatus={config.showTaskStatus}
                    showNotes={true}
                    onStatusUpdate={onStatusUpdate}
                    onDateTimeUpdate={onDateTimeUpdate}
                    onNotesUpdate={onTaskNotesUpdate}
                    formatDateTime={formatDateTime}
                  />

                  {task.payment_status && (
                    <div>
                      <Badge
                        variant={task.payment_status === 'paid' ? 'default' : 'secondary'}
                        className={
                          task.payment_status === 'paid'
                            ? 'border-green-500 text-green-700 bg-green-50 dark:border-green-600 dark:text-green-300 dark:bg-green-950/30'
                            : task.payment_status === 'pending'
                            ? 'border-orange-500 text-orange-700 bg-orange-50 dark:border-orange-600 dark:text-orange-300 dark:bg-orange-950/30'
                            : 'border-red-500 text-red-700 bg-red-50 dark:border-red-600 dark:text-red-300 dark:bg-red-950/30'
                        }
                      >
                        {task.payment_status === 'paid'
                          ? '💰 Bezahlt'
                          : task.payment_status === 'pending'
                          ? '⏳ Ausstehend'
                          : '💸 Unbezahlt'}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <BeforeYouGoChecklist open={showChecklist} onOpenChange={setShowChecklist} />
      </CardContent>
    </Card>
  );
};

export default ConfigurableBookingCard;