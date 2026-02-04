
## Plan: Stornierte Buchungen im Kalender ausblenden

### Problem
Im Gantt-Chart werden **alle Buchungen** angezeigt, unabhängig vom Status. Die Datenbank zeigt, dass folgende stornierte Buchungen fälschlicherweise angezeigt werden:
- **Nicolas Krieg** (7.-14. Feb) - Status: `cancelled`
- **Ruud van Deuren** (14.-22. Feb) - Status: `cancelled`

### Ursache
In `src/pages/Calendar.tsx` gibt es zwei Stellen, die Buchungen verarbeiten, ohne den Status zu prüfen:

1. **`bookingsByHouse`** (Zeile 261): Gruppiert alle Buchungen für das Gantt-Chart ohne Filterung
2. **`monthEvents`** (Zeile 126): Erstellt Events für Monat/Wochen-Ansicht ohne Filterung

### Lösung

#### Änderung 1: Gantt-Chart Filterung (Zeile 261)

**Vorher:**
```tsx
allBookings.forEach(booking => {
  const houseId = booking.house_id;
  // ... ohne Filterung
});
```

**Nachher:**
```tsx
allBookings.forEach(booking => {
  // Stornierte Buchungen nicht anzeigen
  if (booking.status === 'cancelled') return;
  
  const houseId = booking.house_id;
  // ...
});
```

#### Änderung 2: Monats/Wochen-Events Filterung (Zeile 126)

**Vorher:**
```tsx
allBookings.forEach(booking => {
  const checkinDate = new Date(booking.check_in);
  // ... ohne Filterung
});
```

**Nachher:**
```tsx
allBookings.forEach(booking => {
  // Stornierte Buchungen nicht anzeigen
  if (booking.status === 'cancelled') return;
  
  const checkinDate = new Date(booking.check_in);
  // ...
});
```

### Ergebnis
- Stornierte Buchungen werden in **allen Kalenderansichten** (Gantt, Monat, Woche) ausgeblendet
- Nur bestätigte, eingecheckte oder abgeschlossene Buchungen werden angezeigt
- Die stornierten Buchungen "Nicolas Krieg" und "Ruud van Deuren" verschwinden aus dem Gantt-Chart

### Technische Details
- Geänderte Datei: `src/pages/Calendar.tsx`
- Betroffene Zeilen: 126 und 261
- Filterkriterium: `booking.status !== 'cancelled'`
