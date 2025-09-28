import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

export interface BookingCardConfig {
  showHouseName: boolean;
  showHouseAddress: boolean;
  showGuestName: boolean;
  showGuestCount: boolean;
  showGuestEmail: boolean;
  showGuestPhone: boolean;
  showCheckInDate: boolean;
  showCheckOutDate: boolean;
  showBookingNotes: boolean;
  showBookingAmount: boolean;
  showBookingStatus: boolean;
  showNationality: boolean;
  showPlatform: boolean;
  showCleaningTasks: boolean;
  showTaskStatus: boolean;
  showTaskAssignment: boolean;
  showTaskDateTime: boolean;
  showTaskNotes: boolean;
  showCurrency: boolean;
  showBookingId: boolean;
  showTaskActions: boolean;
  showEditableNotes: boolean;
}

const DEFAULT_CONFIG: BookingCardConfig = {
  showHouseName: true,
  showHouseAddress: true,
  showGuestName: true,
  showGuestCount: true,
  showGuestEmail: false,
  showGuestPhone: false,
  showCheckInDate: true,
  showCheckOutDate: true,
  showBookingNotes: true,
  showBookingAmount: false,
  showBookingStatus: false,
  showNationality: false,
  showPlatform: false,
  showCleaningTasks: true,
  showTaskStatus: true,
  showTaskAssignment: true,
  showTaskDateTime: true,
  showTaskNotes: true,
  showCurrency: false,
  showBookingId: false,
  showTaskActions: true,
  showEditableNotes: true,
};

const FIELD_LABELS = {
  showHouseName: 'Unterkunft Name',
  showHouseAddress: 'Unterkunft Adresse',
  showGuestName: 'Gast Name',
  showGuestCount: 'Gästeanzahl',
  showGuestEmail: 'Gast E-Mail',
  showGuestPhone: 'Gast Telefon',
  showCheckInDate: 'Check-in Datum',
  showCheckOutDate: 'Check-out Datum',
  showBookingNotes: 'Buchungsnotizen',
  showBookingAmount: 'Buchungsbetrag',
  showBookingStatus: 'Buchungsstatus',
  showNationality: 'Nationalität',
  showPlatform: 'Buchungsplattform',
  showCleaningTasks: 'Reinigungsaufträge',
  showTaskStatus: 'Aufgaben Status',
  showTaskAssignment: 'Aufgaben Zuweisung',
  showTaskDateTime: 'Aufgaben Datum/Zeit',
  showTaskNotes: 'Aufgaben Notizen',
  showCurrency: 'Währung anzeigen',
  showBookingId: 'Buchungs-ID anzeigen',
  showTaskActions: 'Aufgaben-Aktionen',
  showEditableNotes: 'Notizen editierbar',
};

const FIELD_CATEGORIES = {
  'Unterkunft': ['showHouseName', 'showHouseAddress'],
  'Gast Information': ['showGuestName', 'showGuestCount', 'showGuestEmail', 'showGuestPhone', 'showNationality'],
  'Buchung': ['showCheckInDate', 'showCheckOutDate', 'showBookingNotes', 'showBookingAmount', 'showBookingStatus', 'showPlatform', 'showCurrency', 'showBookingId'],
  'Reinigungsaufträge': ['showCleaningTasks', 'showTaskStatus', 'showTaskAssignment', 'showTaskDateTime', 'showTaskNotes', 'showTaskActions'],
  'Benutzerinteraktion': ['showEditableNotes'],
};

interface BookingCardSettingsProps {
  config: BookingCardConfig;
  onConfigChange: (config: BookingCardConfig) => void;
}

const BookingCardSettings: React.FC<BookingCardSettingsProps> = ({
  config,
  onConfigChange,
}) => {
  const [localConfig, setLocalConfig] = useState<BookingCardConfig>(config);
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (field: keyof BookingCardConfig) => {
    const newConfig = { ...localConfig, [field]: !localConfig[field] };
    setLocalConfig(newConfig);
  };

  const handleSave = () => {
    onConfigChange(localConfig);
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_CONFIG);
  };

  const handleSelectAll = () => {
    const allTrue = Object.keys(DEFAULT_CONFIG).reduce((acc, key) => {
      acc[key as keyof BookingCardConfig] = true;
      return acc;
    }, {} as BookingCardConfig);
    setLocalConfig(allTrue);
  };

  const handleSelectNone = () => {
    const allFalse = Object.keys(DEFAULT_CONFIG).reduce((acc, key) => {
      acc[key as keyof BookingCardConfig] = false;
      return acc;
    }, {} as BookingCardConfig);
    setLocalConfig(allFalse);
  };

  const visibleFieldsCount = Object.values(localConfig).filter(Boolean).length;
  const totalFieldsCount = Object.keys(localConfig).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="hover-scale">
          <Settings className="w-4 h-4 mr-2" />
          Kartenansicht ({visibleFieldsCount}/{totalFieldsCount})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Buchungskarten konfigurieren
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Wählen Sie die Informationen aus, die in den Buchungskarten angezeigt werden sollen.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                <Eye className="w-4 h-4 mr-1" />
                Alle
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSelectNone}>
                <EyeOff className="w-4 h-4 mr-1" />
                Keine
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Standard
              </Button>
            </div>
          </div>

          {Object.entries(FIELD_CATEGORIES).map(([category, fields]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {fields.map((field) => (
                  <div key={field} className="flex items-center justify-between">
                    <Label 
                      htmlFor={field}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {FIELD_LABELS[field as keyof typeof FIELD_LABELS]}
                    </Label>
                    <Switch
                      id={field}
                      checked={localConfig[field as keyof BookingCardConfig]}
                      onCheckedChange={() => handleToggle(field as keyof BookingCardConfig)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <Separator />

          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-muted-foreground">
              {visibleFieldsCount} von {totalFieldsCount} Feldern werden angezeigt
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} className="hover-scale">
                Einstellungen speichern
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook for managing booking card configuration
export const useBookingCardConfig = () => {
  const [config, setConfig] = useState<BookingCardConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    const savedConfig = localStorage.getItem('bookingCardConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig({ ...DEFAULT_CONFIG, ...parsedConfig });
      } catch (error) {
        console.error('Error parsing booking card config:', error);
      }
    }
  }, []);

  const updateConfig = (newConfig: BookingCardConfig) => {
    setConfig(newConfig);
    localStorage.setItem('bookingCardConfig', JSON.stringify(newConfig));
  };

  return { config, updateConfig };
};

export default BookingCardSettings;