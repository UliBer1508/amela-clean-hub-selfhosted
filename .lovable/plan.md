## Problem

Die Buttons sind technisch unabhängige States (`houseFilter` und `timeFilter`), sollten sich also kombinieren lassen. In der Praxis erscheint die Trefferliste beim Kombinieren (z. B. *Wald Chalet* + *Diese Woche*) jedoch oft leer, weil die Prädikate **pro Buchung** statt **pro Reinigungs-Task** ausgewertet werden:

```ts
// useBookings.ts (heute)
matchesStatus = booking.service_tasks?.some(t => t.status === statusFilter)
matchesTime   = booking.service_tasks?.some(t => isWithinTimeRange(t.scheduled_date, timeFilter))
```

Eine Buchung erfüllt also Status *und* Zeit, **auch wenn es zwei verschiedene Tasks sind**. Umgekehrt verschwinden Buchungen, deren *einzige passende* Tasks Status/Zeit nicht gleichzeitig erfüllen. Resultat: kombinierte Filter wirken kaputt.

## Ziel

Je 1 Haus + 1 Zeitraum (+ Status + Mitarbeiter + Provider) sind **vollständig kombinierbar**, und die Trefferliste zeigt genau die Buchungen/Standalone-Reinigungen, die mindestens einen Task haben, der **alle aktiven Filter gleichzeitig** erfüllt.

## Änderungen

### 1. `src/hooks/useBookings.ts` – Prädikat pro Task statt pro Buchung

Im `filteredEntries`-Callback für den `booking`-Zweig:

```ts
const tasks = booking.service_tasks || [];
const taskMatches = (t: ServiceTask) =>
  (statusFilter === 'all' || t.status === statusFilter || (isCheckedIn && includeCheckedIn)) &&
  (timeFilter   === 'all' || isWithinTimeRange(t.scheduled_date, timeFilter)) &&
  (!staffFilter || staffFilter === 'all' || t.assigned_staff_id === staffFilter) &&
  (providerFilter === 'all'
    || (providerFilter === 'unassigned' ? !t.provider_id : t.provider_id === providerFilter));

const hasMatchingTask = tasks.some(taskMatches);

// Haus/Suche bleiben pro Buchung
return matchesSearch && matchesHouse && hasMatchingTask;
```

Standalone-Reinigungen ändern sich nicht (1 Task = 1 Entry, bisherige Logik bleibt).

Eingecheckt-Sonderfall: wenn `includeCheckedIn` & `isCheckedIn`, wird `statusFilter` im Task-Match ignoriert (wie heute).

### 2. `src/pages/CleaningPortal.tsx` – Visuelles Feedback unverändert

- Beide Button-Reihen bleiben Toggle-Buttons (je 1 aktiver Button pro Reihe).
- Aktiver Zustand bleibt `border-primary bg-primary text-primary-foreground` – beide Reihen können gleichzeitig aktiv sein.
- „Filter zurücksetzen" und Trefferanzeige bleiben.

### 3. Sanity-Check

Nach dem Fix mit Beispieldatensatz prüfen:

- *Wald Chalet* allein → alle Wald-Einträge
- *Diese Woche* allein → alle Einträge dieser Woche
- *Wald Chalet* + *Diese Woche* → genau die Wald-Einträge mit Task in dieser Woche

## Out of Scope

- Keine Mehrfachauswahl pro Reihe
- Keine UI-Refactors der Buttons
- Keine Änderung an Status-/Mitarbeiter-/Provider-Filter-UI
- Keine Backend-Änderungen

## Betroffene Dateien

- `src/hooks/useBookings.ts` (Prädikat-Refactor im Booking-Zweig)
