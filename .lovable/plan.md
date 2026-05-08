## Sortierung beim Filter „Abgeschlossen" umkehren

### Befund
In `src/hooks/useBookings.ts` werden `combinedEntries` **immer aufsteigend** nach `scheduled_date` sortiert (Zeile ~154). Die Funktion `filteredEntries` filtert nur, sortiert aber nicht — die Reihenfolge bleibt also „älteste zuerst".

Beim Statusfilter `completed` will der Nutzer aber die **zuletzt abgeschlossene Reinigung ganz oben** sehen.

### Änderung
Datei: `src/hooks/useBookings.ts`, Funktion `filteredEntries`.

Nach dem `.filter(...)` ein zusätzliches `.sort(...)` anhängen, das die Richtung vom aktuellen `statusFilter` abhängig macht:

- `statusFilter === 'completed'` → **absteigend** (neuestes Datum zuerst). Dabei bevorzugt nach `completed_at` (Booking-Task: `service_tasks[0].completed_at`, Standalone: `completed_at` falls vorhanden) sortieren, Fallback `scheduled_date`.
- alle anderen Filter → **aufsteigend** wie bisher (älteste/nächste zuerst).

Für Buchungen mit mehreren Tasks wird der jeweils relevanteste Task gewählt: bei `completed` der zuletzt abgeschlossene Task, sonst der früheste geplante.

### Was sich nicht ändert
- Die initiale Sortierung in `fetchBookings` bleibt unverändert (aufsteigend) — nur die Listen­ausgabe in der UI dreht sich beim `completed`-Filter um.
- Keine UI-Änderung, keine Style-Änderung.
- Andere Filter (`scheduled`, `in_progress`, `delayed`, `cancelled`, `all`) bleiben in aufsteigender Reihenfolge.

### Verifikation
- Filter auf „Abgeschlossen" stellen → oberste Karte ist das jüngste Datum.
- Filter auf „Geplant" stellen → oberste Karte ist das nächste anstehende Datum.
