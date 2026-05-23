## Ziel

Das bestehende automatische Erinnerungs-Popup (`CleaningReminderBanner`, getriggert durch die Tage-vorher-Einstellung) soll:
1. den **Check-in-Termin der Buchung** als Bezugsdatum verwenden (nicht das Reinigungs-`scheduled_date`),
2. genau den vom Nutzer gelieferten Text anzeigen:
   > Hallo Amela, es steht eine Buchung für **„{hausname}"** für den **{Datum checkin}** an. Bitte Reinigung nicht vergessen. Vielen Dank.

## Umsetzung

**`src/components/amela/CleaningReminderBanner.tsx`**

1. `NextCleaning`-Type umbenennen/anpassen zu `{ checkInDate: string; houseName?: string }`.
2. `getNextCleaning`:
   - Für `entry.type === 'booking'`: nur Buchungen mit `data.check_in` und mindestens einer offenen Reinigung (`status !== completed/cancelled`) berücksichtigen. Kandidat = `{ checkInDate: data.check_in, houseName: data.houses?.name }`.
   - Standalone-Cleanings ignorieren (haben keinen Check-in).
   - Sortierung & "≥ heute"-Filter unverändert, jetzt auf `checkInDate`.
3. `daysUntil` = Differenz zu `checkInDate`. `shouldShow` bleibt wie gehabt: `daysUntil <= settings.daysBefore`.
4. Dialog-Inhalt ersetzen:
   - Titel: „Reinigungs-Erinnerung"
   - Body (`DialogDescription`):
     ```
     Hallo Amela, es steht eine Buchung für „{houseName}" für den {dd.MM.yyyy} an.
     Bitte Reinigung nicht vergessen. Vielen Dank.
     ```
   - Footer-Button „Verstanden" bleibt.
5. Dismiss-Key bleibt analog (`${todayKey}:${checkInDate}`).

## Out of scope

- Glocke + `ReminderSettingsPopover` bleiben unverändert (Settings).
- Keine Änderungen an `useReminderSettings`, `useBookings`, Filtern.
- Kein Fallback-Text für Standalone-Cleanings (keine Check-ins relevant).
