## Änderung rückgängig machen

Glocke „Benachrichtigung" öffnet wieder den `ReminderSettingsPopover` (Tage-im-Voraus-Einstellung). Der neue Nachrichten-Dialog wird entfernt.

## Umsetzung

**`src/pages/CleaningPortal.tsx`**
- JSX an der Bell wieder auf `<ReminderSettingsPopover open={showReminderPopup} onOpenChange={setShowReminderPopup} />` zurücksetzen.
- `<CleaningReminderDialog>`-Render entfernen.
- Import `CleaningReminderDialog` entfernen.
- `useMemo`-Block `upcomingReminders` entfernen.
- `useMemo` aus dem React-Import entfernen, falls sonst nicht verwendet.

**`src/components/CleaningReminderDialog.tsx`**
- Datei löschen (nicht mehr verwendet).

Keine weiteren Änderungen.
