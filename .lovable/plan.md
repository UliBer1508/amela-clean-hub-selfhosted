## Ziel

Im Cleaning-Portal unter den Filter-Kacheln „Diese Woche" / „Nächste Woche" zwei weitere Kacheln ergänzen: **„Diesen Monat"** und **„Nächsten Monat"** (Kalendermonat, nicht rollierend).

## Umsetzung

**`src/types/booking.ts`**
- `TimeFilter` um `'thisMonth' | 'nextMonth'` erweitern (bestehende Keys bleiben unverändert).

**`src/utils/date.ts`** (`isWithinTimeRange`)
- Neuer Case `thisMonth`: `taskDate` liegt im aktuellen Kalendermonat (`start = 1. des Monats`, `end = letzter Tag des Monats`).
- Neuer Case `nextMonth`: `taskDate` liegt im darauffolgenden Kalendermonat (`startOfMonth(addMonths(now,1))` … `endOfMonth(...)`).
- Nutzung von `startOfMonth`, `endOfMonth`, `addMonths` aus `date-fns`.

**`src/pages/CleaningPortal.tsx`** (Zeitraum-Filter-Grid ~Zeile 370)
- Array um zwei Einträge erweitern:
  ```ts
  { key: 'thisMonth', label: 'Diesen Monat' },
  { key: 'nextMonth', label: 'Nächsten Monat' },
  ```
- Grid bleibt `grid-cols-2` → ergibt sauber 2×2 Layout (passt zum Screenshot-Stil).

## Out of scope

- Bestehende `month` / `3months` / `6months` / `12months` Keys und `TIME_FILTERS`-Labels bleiben unverändert.
- Keine Änderungen am Haus-Filter, an Reset-Logik (`timeFilter !== 'all'` deckt die neuen Werte automatisch ab).
