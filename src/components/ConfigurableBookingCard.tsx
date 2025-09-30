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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

import type { BookingCardConfig } from './BookingCardSettings';

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

  const handleEditDateTime = (task: any) => {
    setEditingTask(task);
    setSelectedDate(new Date(task.scheduled_date));
    setSelectedTime(task.scheduled_time || '');
  };

  const handleDateTimeUpdateInternal = () => {
    if (editingTask && selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      onDateTimeUpdate(editingTask.id, dateStr, selectedTime);
      setEditingTask(null);
    }
  };

  return (
    <Card className="overflow-hidden hover-scale">
      <CardContent className="p-0">
        {/* House Information Header */}
        {(config.showHouseName || config.showHouseAddress) && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 border-b border-border">
            {config.showHouseName && (
              <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-2">
                   <span className="font-semibold text-foreground">
                     🏠 Unterkunft: {booking.houses?.name}
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
                 <span className="text-sm text-muted-foreground">
                   📍 Adresse: {booking.houses?.address}
                 </span>
               </div>
            )}
          </div>
        )}

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guest Information */}
          <div className="space-y-3">
            {config.showGuestName && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">👤 Gast: {booking.guest_name}</span>
              </div>
            )}
            
            {config.showGuestCount && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">👥 Gäste: {booking.number_of_guests} Personen</span>
              </div>
            )}

            {config.showGuestEmail && booking.guest_email && (
              <div className="flex items-center space-x-2">
                <span className="text-sm">📧 E-Mail: {booking.guest_email}</span>
              </div>
            )}

            {config.showGuestPhone && booking.guest_phone && (
              <div className="flex items-center space-x-2">
                <span className="text-sm">📞 Telefon: {booking.guest_phone}</span>
              </div>
            )}

            {config.showNationality && booking.nationality && (
              <div className="flex items-center space-x-2">
                <span className="text-sm">🌍 Nationalität: {booking.nationality}</span>
              </div>
            )}

            {config.showCheckInDate && (
              <div className="flex items-center space-x-2">
                <span className="text-sm">📅 Check-in: {formatDateTime(booking.check_in)}</span>
              </div>
            )}

            {config.showCheckOutDate && (
              <div className="flex items-center space-x-2">
                <span className="text-sm">📅 Check-out: {formatDateTime(booking.check_out)}</span>
              </div>
            )}

            {config.showBookingAmount && booking.booking_amount && (
               <div className="flex items-center space-x-2">
                 <span className="text-sm">
                   💰 Betrag: {booking.booking_amount}
                   {config.showCurrency && ` ${booking.currency || 'EUR'}`}
                 </span>
               </div>
            )}

            {config.showBookingStatus && (
              <div className="flex items-center space-x-2">
                <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                  {booking.status === 'confirmed' ? 'Bestätigt' : booking.status}
                </Badge>
              </div>
            )}

            {config.showPlatform && booking.platform && (
              <div className="flex items-center space-x-2">
                <span className="text-sm">Plattform: {booking.platform}</span>
              </div>
            )}

            {/* Booking Notes */}
            {config.showBookingNotes && (
              <div className="mt-3 p-2 bg-muted/30 rounded border-l-4 border-blue-500">
                <div className="flex items-start space-x-2">
                  <div className="text-blue-600 mt-0.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-muted-foreground">Buchungsnotizen:</p>
                      {config.showEditableNotes && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingBookingNotes(!editingBookingNotes)}
                          className="h-6 px-2 text-xs"
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
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              onBookingNotesUpdate?.(booking.id, bookingNotesValue);
                              setEditingBookingNotes(false);
                            }}
                            className="h-7 px-3 text-xs"
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
                            className="h-7 px-3 text-xs"
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground whitespace-pre-wrap">
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
                    <p className="text-xs font-medium text-muted-foreground mb-1">Aufgaben Notizen:</p>
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
            <div className="space-y-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-100 dark:border-blue-900/50">
              <h4 className="font-medium text-foreground">🧹 Reinigungsaufträge</h4>
              {booking.service_tasks?.map((task: any) => (
                <div key={task.id} className="bg-background/80 rounded-lg p-3 space-y-2 border border-blue-200/30 dark:border-blue-800/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">🧽 Reinigung</span>
                    {config.showTaskStatus && (
                       <Badge variant={
                         task.status === 'completed' ? 'default' : 
                         task.status === 'cancelled' ? 'destructive' : 
                         task.status === 'delayed' ? 'destructive' :
                         task.status === 'in_progress' ? 'outline' :
                         'secondary'
                       } className={
                         task.status === 'delayed' ? 'border-orange-500 text-orange-700 bg-orange-50 dark:border-orange-600 dark:text-orange-300 dark:bg-orange-950/30' :
                         task.status === 'in_progress' ? 'border-yellow-500 text-yellow-700 bg-yellow-50 dark:border-yellow-600 dark:text-yellow-300 dark:bg-yellow-950/30' :
                         ''
                       }>
                         {STATUS_FILTERS[task.status as keyof typeof STATUS_FILTERS]}
                       </Badge>
                    )}
                  </div>

                  {config.showTaskDateTime && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span>🕐 {formatDateTime(task.scheduled_date, task.scheduled_time)}</span>
                    </div>
                  )}

                  {config.showTaskAssignment && config.showTaskActions && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-muted-foreground">👨‍💼 Zugewiesen an:</span>
                      <Select
                        value={task.assigned_staff_id || 'unassigned'}
                        onValueChange={(value: string) => 
                          onStaffUpdate(task.id, value === 'unassigned' ? null : value)
                        }
                      >
                        <SelectTrigger className="w-auto">
                          <SelectValue>
                            {task.assigned_staff_id 
                              ? staff.find(s => s.id === task.assigned_staff_id)?.name || 'Nicht zugewiesen'
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

                  <div className="flex flex-wrap gap-2 pt-2">
                    {config.showTaskStatus && config.showTaskActions && (
                      <Select
                        value={task.status}
                        onValueChange={(value: string) => onStatusUpdate(task.id, value)}
                      >
                        <SelectTrigger className="w-auto">
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
                    )}

                    {config.showTaskDateTime && config.showTaskActions && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDateTime(task)}
                          >
                            📅 Termin ändern
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reinigungstermin ändern</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Datum</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !selectedDate && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "dd.MM.yyyy") : "Datum wählen"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div>
                              <Label htmlFor="time">Uhrzeit</Label>
                              <Input
                                id="time"
                                type="time"
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                              />
                            </div>
                            <Button 
                              onClick={handleDateTimeUpdateInternal}
                              disabled={!selectedDate}
                              className="w-full hover-scale"
                            >
                              Termin aktualisieren
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigurableBookingCard;