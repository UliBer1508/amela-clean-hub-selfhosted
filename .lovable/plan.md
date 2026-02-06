

## Plan: Eingecheckte Buchungen unabhängig vom Task-Status anzeigen

### Problem
Die Checkbox "⚠️ Auch eingecheckt" funktioniert nicht wie erwartet, weil:
1. Der **Status-Filter** steht standardmäßig auf `scheduled` (Geplant)
2. Die Reinigungsaufgaben der eingecheckten Buchungen haben Status `completed`
3. Die aktuelle Filterlogik blockiert diese trotz aktivierter Checkbox

**Beispiel-Daten aus der Datenbank:**
| Gast | Buchung-Status | Task-Status | Provider |
|------|----------------|-------------|----------|
| Daniel Alberti | `checked_in` | `completed` | Amela |
| Oliver Grandt | `checked_in` | `completed` | Amela |

### Lösung

Die Filterlogik in `src/hooks/useBookings.ts` wird erweitert: Wenn `includeCheckedIn = true` und die Buchung `checked_in` ist, soll der **Status-Filter für die Task ignoriert** werden.

### Änderung

**Datei:** `src/hooks/useBookings.ts` (Zeilen 314-327)

**Vorher:**
```tsx
// Prüfe ob Buchung eingecheckt ist - nur anzeigen wenn Checkbox aktiv
const isCheckedIn = booking.status === 'checked_in';
if (isCheckedIn && !includeCheckedIn) {
  return false;
}

const matchesSearch = ...

const matchesStatus = statusFilter === 'all' || 
  booking.service_tasks?.some(task => task.status === statusFilter);
```

**Nachher:**
```tsx
// Prüfe ob Buchung eingecheckt ist - nur anzeigen wenn Checkbox aktiv
const isCheckedIn = booking.status === 'checked_in';
if (isCheckedIn && !includeCheckedIn) {
  return false;
}

const matchesSearch = ...

// Bei eingecheckten Buchungen (wenn Checkbox aktiv) den Status-Filter ignorieren
const matchesStatus = statusFilter === 'all' || 
  (isCheckedIn && includeCheckedIn) ||
  booking.service_tasks?.some(task => task.status === statusFilter);
```

### Logik-Erklärung

```
matchesStatus = true wenn:
  - statusFilter === 'all' (alle Status anzeigen)
  - ODER (isCheckedIn && includeCheckedIn) → Eingecheckte mit aktivierter Checkbox
  - ODER mindestens eine Task hat den gewählten Status
```

### Ergebnis

| Szenario | Checkbox | statusFilter | Ergebnis |
|----------|----------|--------------|----------|
| Oliver Grandt (checked_in, task: completed) | ❌ Aus | scheduled | ❌ Nicht angezeigt |
| Oliver Grandt (checked_in, task: completed) | ✅ An | scheduled | ✅ Angezeigt |
| Neue Buchung (confirmed, task: scheduled) | ❌ Aus | scheduled | ✅ Angezeigt |

Die Putzfrau kann mit der Checkbox auch eingecheckte Buchungen sehen, **unabhängig davon ob die Reinigung als geplant, abgeschlossen oder verzögert markiert ist**.

