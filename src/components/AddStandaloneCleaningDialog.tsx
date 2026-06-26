import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useNotify } from '@/hooks/useNotify';

interface AddStandaloneCleaningDialogProps {
  houses: Array<{ id: string; name: string; address: string }>;
  staff: Array<{ id: string; name: string; is_active: boolean }>;
  onSuccess: () => void;
}

const AddStandaloneCleaningDialog: React.FC<AddStandaloneCleaningDialogProps> = ({
  houses,
  staff,
  onSuccess,
}) => {
  const { notify } = useNotify();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [selectedHouseId, setSelectedHouseId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!selectedHouseId || !selectedDate) {
      notify({
        title: 'Fehler',
        description: 'Bitte wählen Sie ein Haus und ein Datum aus.',
        variant: 'destructive',
        eventType: 'info',
      });
      return;
    }

    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('service_tasks')
        .insert({
          house_id: selectedHouseId,
          service_type: 'cleaning',
          scheduled_date: dateStr,
          scheduled_time: selectedTime,
          assigned_staff_id: selectedStaffId || null,
          notes: notes || null,
          status: 'scheduled',
          booking_id: null, // Explizit NULL für standalone
        });

      if (error) throw error;

      notify({
        title: 'Reinigung hinzugefügt',
        description: 'Die Standalone-Reinigung wurde erfolgreich erstellt.',
        eventType: 'new_task',
      });

      // Reset form
      setSelectedHouseId('');
      setSelectedDate(undefined);
      setSelectedTime('10:00');
      setSelectedStaffId('');
      setNotes('');
      setOpen(false);
      
      onSuccess();
    } catch (error) {
      console.error('Error creating standalone cleaning:', error);
      notify({
        title: 'Fehler',
        description: 'Die Reinigung konnte nicht erstellt werden.',
        variant: 'destructive',
        eventType: 'info',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Reinigung hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Standalone Reinigung hinzufügen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* House Selection */}
          <div className="space-y-2">
            <Label>Unterkunft *</Label>
            <Select value={selectedHouseId} onValueChange={setSelectedHouseId}>
              <SelectTrigger>
                <SelectValue placeholder="Unterkunft wählen" />
              </SelectTrigger>
              <SelectContent>
                {houses.map((house) => (
                  <SelectItem key={house.id} value={house.id}>
                    {house.name} - {house.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Datum *</Label>
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
                  {selectedDate ? format(selectedDate, "PPP") : "Datum wählen"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Uhrzeit</Label>
            <Input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            />
          </div>

          {/* Staff Selection */}
          <div className="space-y-2">
            <Label>Putzkraft (Optional)</Label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger>
                <SelectValue placeholder="Putzkraft wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nicht zugewiesen</SelectItem>
                {staff.filter(s => s.is_active).map((staffMember) => (
                  <SelectItem key={staffMember.id} value={staffMember.id}>
                    {staffMember.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notizen (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Informationen..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !selectedHouseId || !selectedDate}
            className="w-full"
          >
            {loading ? 'Wird erstellt...' : 'Reinigung erstellen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddStandaloneCleaningDialog;