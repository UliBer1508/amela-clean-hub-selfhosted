import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CleaningStaffFormData, CleaningStaff } from '@/types/staff';
import { validateEmail } from '@/utils/validation';
import { UserPlus, Save, X } from 'lucide-react';

interface StaffFormProps {
  staff?: CleaningStaff;
  onSubmit: (data: CleaningStaffFormData) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  loading?: boolean;
}

const WEEKDAYS = [
  { value: 'monday', label: 'Montag' },
  { value: 'tuesday', label: 'Dienstag' },
  { value: 'wednesday', label: 'Mittwoch' },
  { value: 'thursday', label: 'Donnerstag' },
  { value: 'friday', label: 'Freitag' },
  { value: 'saturday', label: 'Samstag' },
  { value: 'sunday', label: 'Sonntag' }
];

const StaffForm: React.FC<StaffFormProps> = ({ staff, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState<CleaningStaffFormData>({
    name: staff?.name || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    address: staff?.address || '',
    hourly_rate: staff?.hourly_rate || undefined,
    availability_days: staff?.availability_days || [],
    notes: staff?.notes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.error || 'Ungültige E-Mail';
      }
    }

    if (formData.hourly_rate && formData.hourly_rate < 0) {
      newErrors.hourly_rate = 'Stundenlohn muss positiv sein';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const result = await onSubmit(formData);
    
    if (!result.success && result.error) {
      setErrors({ submit: result.error });
    }
  };

  const handleAvailabilityChange = (day: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      availability_days: checked 
        ? [...prev.availability_days, day]
        : prev.availability_days.filter(d => d !== day)
    }));
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="w-5 h-5" />
          <span>{staff ? 'Putzkraft bearbeiten' : 'Neue Putzkraft hinzufügen'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {errors.submit}
            </div>
          )}

          {/* Grunddaten */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Stundenlohn (€)</Label>
              <Input
                id="hourly_rate"
                type="number"
                min="0"
                step="0.50"
                value={formData.hourly_rate || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  hourly_rate: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
                className={errors.hourly_rate ? "border-destructive" : ""}
              />
              {errors.hourly_rate && <p className="text-destructive text-sm">{errors.hourly_rate}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          {/* Verfügbarkeit */}
          <div className="space-y-3">
            <Label>Verfügbare Tage</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {WEEKDAYS.map(day => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={day.value}
                    checked={formData.availability_days.includes(day.value)}
                    onCheckedChange={(checked) => 
                      handleAvailabilityChange(day.value, checked as boolean)
                    }
                  />
                  <Label htmlFor={day.value} className="text-sm font-normal">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Zusätzliche Informationen, Besonderheiten, etc."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 hover-scale"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Wird gespeichert...' : (staff ? 'Änderungen speichern' : 'Putzkraft hinzufügen')}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Abbrechen
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default StaffForm;