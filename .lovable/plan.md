## Ziel

Wenn im Cleaning Portal auf die Glocke „Benachrichtigung" geklickt wird, soll statt des bisherigen Reminder-Settings-Popovers ein einfaches Dialog-Popup mit folgender Nachricht erscheinen:

> Hallo Amela, es steht eine Buchung für **„{hausname}"** für den **{Datum checkin}** an. Bitte Reinigung nicht vergessen. Vielen Dank.

## Umsetzung

1. **Neue Komponente** `src/components/CleaningReminderDialog.tsx`
   - Basiert auf shadcn `Dialog` (`@/components/ui/dialog`).
   - Props: `open`, `onOpenChange`, `bookings: { houseName: string; checkinDate: Date }[]`.
   - Inhalt:
     - Titel: „Reinigungs-Erinnerung"
     - Pro anstehender Buchung ein Absatz mit dem genannten Text. Datum als `dd.MM.yyyy` (date-fns, `de` locale — bereits im Projekt verwendet).
     - Falls keine Buchung ansteht: „Aktuell keine anstehenden Buchungen."
     - Schließen-Button („OK").

2. **`src/pages/CleaningPortal.tsx` anpassen**
   - Import: neue Komponente statt (bzw. zusätzlich zu) `ReminderSettingsPopover` für die Glocke.
   - `handleNotificationClick` bleibt; öffnet jetzt den neuen Dialog.
   - Aus `filteredEntries` (oder dem ungefilterten `useBookings`-Ergebnis) die anstehenden Buchungen ableiten: alle Einträge mit `check_in >= heute`, sortiert nach `check_in` aufsteigend, max. 5. Mapping: `houseName = entry.houses?.name`, `checkinDate = entry.check_in`.
   - `<ReminderSettingsPopover .../>` an der Bell wird durch `<CleaningReminderDialog open={showReminderPopup} onOpenChange={setShowReminderPopup} bookings={...} />` ersetzt. Der bestehende `ReminderSettingsPopover` bleibt nur, falls er an anderer Stelle angesteuert wird (aktuell laut Suche nicht).

3. **Keine weiteren Änderungen** an Filterlogik, Realtime-Toast, Badge-Counter, Sound oder Settings.

## Technische Details

- Datei: `src/components/CleaningReminderDialog.tsx` (neu, ~40 Zeilen).
- Datei: `src/pages/CleaningPortal.tsx` — 1 Import-Zeile geändert, 1 JSX-Zeile (Popover → Dialog), kleine `useMemo` für `upcomingBookings`.
- Verwendete Tokens: `bg-background`, `text-foreground`, `text-muted-foreground` — keine Custom-Farben.

## Out of scope

- Kein E-Mail-/Push-Versand.
- Keine Änderungen am Settings-Popover oder an `Calendar.tsx`.
- Keine neuen DB-Felder.
