import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Settings, Bell, Mail, Volume2, Smartphone, Save } from 'lucide-react';

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
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_name', 'Amela')
        .single();

      if (error) throw error;
      setPreferences(data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: "Fehler",
        description: "Einstellungen konnten nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({
          toast_notifications: preferences.toast_notifications,
          email_notifications: preferences.email_notifications,
          push_notifications: preferences.push_notifications,
          sound_notifications: preferences.sound_notifications,
          notify_new_tasks: preferences.notify_new_tasks,
          notify_task_changes: preferences.notify_task_changes,
          notify_status_updates: preferences.notify_status_updates,
          notify_urgent_tasks: preferences.notify_urgent_tasks,
          email_address: preferences.email_address,
        })
        .eq('id', preferences.id);

      if (error) throw error;

      toast({
        title: "Gespeichert",
        description: "Benachrichtigungseinstellungen wurden aktualisiert",
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Fehler",
        description: "Einstellungen konnten nicht gespeichert werden",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Keine Einstellungen gefunden</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Benachrichtigungseinstellungen für {preferences.user_name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Benachrichtigungsarten */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Benachrichtigungsarten</span>
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Popup-Benachrichtigungen</Label>
                <p className="text-xs text-muted-foreground">
                  Sofortige Popups im Browser für neue Updates
                </p>
              </div>
              <Switch
                checked={preferences.toast_notifications}
                onCheckedChange={(checked) => updatePreference('toast_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>E-Mail-Benachrichtigungen</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  E-Mails für wichtige Änderungen
                </p>
              </div>
              <Switch
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center space-x-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Push-Benachrichtigungen</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Browser-Push-Nachrichten auch wenn die Seite nicht geöffnet ist
                </p>
              </div>
              <Switch
                checked={preferences.push_notifications}
                onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center space-x-2">
                  <Volume2 className="w-4 h-4" />
                  <span>Sound-Benachrichtigungen</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Töne bei neuen Benachrichtigungen abspielen
                </p>
              </div>
              <Switch
                checked={preferences.sound_notifications}
                onCheckedChange={(checked) => updatePreference('sound_notifications', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Was benachrichtigen */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Wann benachrichtigen</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Neue Reinigungsaufträge</Label>
                <p className="text-xs text-muted-foreground">
                  Bei neuen Buchungen mit Reinigungsaufträgen
                </p>
              </div>
              <Switch
                checked={preferences.notify_new_tasks}
                onCheckedChange={(checked) => updatePreference('notify_new_tasks', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Auftragsänderungen</Label>
                <p className="text-xs text-muted-foreground">
                  Bei Änderungen an Datum, Zeit oder Details
                </p>
              </div>
              <Switch
                checked={preferences.notify_task_changes}
                onCheckedChange={(checked) => updatePreference('notify_task_changes', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Status-Updates</Label>
                <p className="text-xs text-muted-foreground">
                  Bei Änderungen des Reinigungsstatus
                </p>
              </div>
              <Switch
                checked={preferences.notify_status_updates}
                onCheckedChange={(checked) => updatePreference('notify_status_updates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Dringende Aufträge</Label>
                <p className="text-xs text-muted-foreground">
                  Spezielle Benachrichtigungen für dringende Reinigungen
                </p>
              </div>
              <Switch
                checked={preferences.notify_urgent_tasks}
                onCheckedChange={(checked) => updatePreference('notify_urgent_tasks', checked)}
              />
            </div>
          </div>
        </div>

        {/* E-Mail-Adresse */}
        {preferences.email_notifications && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="amela@reinigungsservice.at"
                value={preferences.email_address || ''}
                onChange={(e) => updatePreference('email_address', e.target.value)}
              />
            </div>
          </>
        )}

        <Separator />

        {/* Speichern Button */}
        <div className="flex justify-end">
          <Button 
            onClick={updatePreferences} 
            disabled={saving}
            className="flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Speichern...' : 'Einstellungen speichern'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;