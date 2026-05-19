## Ziel

Wenn man auf dem Handy im Kalender (Tages-Sheet) auf einen Reinigungsauftrag tippt, soll ein eigenes, mobil-optimiertes Popup mit allen Details des Reinigungsauftrags erscheinen — statt nur einer statischen Zeile.

## Umsetzung

In `src/pages/Calendar.tsx`:

1. **Neues State**: `selectedCleaningTaskId` + `cleaningDetailOpen`.
2. **Tap-Handler**: Im Mobile Tages-Sheet (Zeile ~805) wird jede Zeile vom Typ `cleaning` klickbar. Tap → öffnet das neue Reinigungsauftrag-Sheet (das Tages-Sheet bleibt im Hintergrund geschlossen).
3. **Neues Bottom-Sheet** `Reinigungsauftrag-Detail` (`side="bottom"`, `sm:hidden`, `rounded-t-2xl`, `max-h-[85vh]`, scrollbar, `pb-[env(safe-area-inset-bottom)]`):
   - Header: Haus-Farbpunkt + Hausname + Datum
   - Status-Badge (geplant / in Arbeit / erledigt)
   - Geplante Uhrzeit
   - Adresse des Hauses
   - Zugewiesene Putzkraft (falls vorhanden)
   - Notizen (falls vorhanden)
   - Action-Buttons (min. 44px Touch-Target):
     - „Im Reinigungsportal öffnen" → navigiert zu `/cleaning-portal` (bzw. Detail-Route falls vorhanden)
     - „Schliessen"
4. **Daten**: Reinigungsdaten kommen schon aus `serviceTasks` im Kalender-State; per `id` direkt nachschlagen — kein zusätzlicher Supabase-Call nötig.
5. **Desktop unverändert**.

## Betroffene Dateien

- `src/pages/Calendar.tsx` (State, Tap-Handler im Tages-Sheet, neues Detail-Sheet)

## Nicht enthalten

- Keine Änderungen an der Datenbank, am CleaningPortal oder an Buchungs-Events.
- Keine Edit-Funktion im Popup (nur Anzeige + Sprungbrett ins Portal).
