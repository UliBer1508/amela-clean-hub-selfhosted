import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, Volume2, Smartphone, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateEmail } from '@/utils/validation';

interface NotificationPreferences {
  id: string;
  user_name: string;
  toast_notifications: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  sound_notifications: boolean;
  notify_new_tasks: boolean;
  notify_task_changes: boolean;
  notify_status_updates: boolean;
  notify_urgent_tasks: boolean;
  email_address: string | null;
}

const NotificationSettings = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async (userName = 'Amela') => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_name', userName)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        // Create default preferences if none exist
        const defaultPrefs = {
          user_name: userName,
          toast_notifications: true,
          email_notifications: false,
          push_notifications: true,
          sound_notifications: true,
          notify_new_tasks: true,
          notify_task_changes: true,
          notify_status_updates: true,
          notify_urgent_tasks: true,
          email_address: null
        };
        
        const { data: newData, error: createError } = await supabase
          .from('notification_preferences')
          .insert(defaultPrefs)
          .select()
          .single();
          
        if (createError) throw createError;
        setPreferences(newData);
      } else {
        setPreferences(data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast({
        title: "Fehler",
        description: `Benachrichtigungseinstellungen konnten nicht geladen werden: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updatedPrefs: Partial<NotificationPreferences>) => {
    if (!preferences) return;

    const newPreferences = { ...preferences, ...updatedPrefs };
    setPreferences(newPreferences);

    try {
      setSaving(true);
      const { error } = await supabase
        .from('notification_preferences')
        .update(updatedPrefs)
        .eq('id', preferences.id);

      if (error) throw error;

      toast({
        title: "Gespeichert",
        description: "Benachrichtigungseinstellungen wurden aktualisiert.",
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Fehler",
        description: "Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      });
      // Revert changes on error
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Lade Einstellungen...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Benachrichtigungseinstellungen konnten nicht geladen werden.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="w-5 h-5" />
          <span>Benachrichtigungseinstellungen für {preferences.user_name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Benachrichtigungsarten */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Benachrichtigungsarten</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-4 h-4 text-blue-600" />
                <div>
                  <Label className="font-medium">Popup-Benachrichtigungen</Label>
                  <p className="text-sm text-muted-foreground">
                    Sofortige Benachrichtigungen im Browser
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.toast_notifications}
                onCheckedChange={(checked) => 
                  updatePreferences({ toast_notifications: checked })
                }
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-green-600" />
                <div>
                  <Label className="font-medium">E-Mail-Benachrichtigungen</Label>
                  <p className="text-sm text-muted-foreground">
                    Benachrichtigungen per E-Mail erhalten
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => 
                  updatePreferences({ email_notifications: checked })
                }
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-4 h-4 text-purple-600" />
                <div>
                  <Label className="font-medium">Push-Benachrichtigungen</Label>
                  <p className="text-sm text-muted-foreground">
                    Browser-Push-Benachrichtigungen
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.push_notifications}
                onCheckedChange={(checked) => 
                  updatePreferences({ push_notifications: checked })
                }
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Volume2 className="w-4 h-4 text-orange-600" />
                <div>
                  <Label className="font-medium">Soundbenachrichtigungen</Label>
                  <p className="text-sm text-muted-foreground">
                    Ton bei neuen Benachrichtigungen
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.sound_notifications}
                onCheckedChange={(checked) => 
                  updatePreferences({ sound_notifications: checked })
                }
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Was soll benachrichtigt werden */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Benachrichtigen bei</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <Label className="font-medium">Neuer Reinigungsauftrag</Label>
                  <p className="text-sm text-muted-foreground">
                    Wenn ein neuer Auftrag erstellt wird
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.notify_new_tasks}
                onCheckedChange={(checked) => 
                  updatePreferences({ notify_new_tasks: checked })
                }
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <div>
                  <Label className="font-medium">Auftragsänderungen</Label>
                  <p className="text-sm text-muted-foreground">
                    Datum, Zeit oder Details wurden geändert
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.notify_task_changes}
                onCheckedChange={(checked) => 
                  updatePreferences({ notify_task_changes: checked })
                }
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <Label className="font-medium">Statusänderungen</Label>
                  <p className="text-sm text-muted-foreground">
                    Wenn ein Auftrag abgeschlossen oder storniert wird
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.notify_status_updates}
                onCheckedChange={(checked) => 
                  updatePreferences({ notify_status_updates: checked })
                }
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <div>
                  <Label className="font-medium">Dringende Aufträge</Label>
                  <p className="text-sm text-muted-foreground">
                    Aufträge die heute oder morgen stattfinden
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.notify_urgent_tasks}
                onCheckedChange={(checked) => 
                  updatePreferences({ notify_urgent_tasks: checked })
                }
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* E-Mail Einstellungen */}
        {preferences.email_notifications && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-medium">E-Mail Einstellungen</h3>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail Adresse</Label>
                <Input
                  id="email"
                  type="email"
                  value={preferences.email_address || ''}
                  onChange={(e) => 
                    updatePreferences({ email_address: e.target.value })
                  }
                  placeholder="ihre.email@beispiel.at"
                  disabled={saving}
                />
              </div>
            </div>
          </>
        )}

        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={() => fetchPreferences()}
            disabled={saving}
          >
            {saving ? 'Wird gespeichert...' : 'Einstellungen zurücksetzen'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;