## Ziel

Kalender-Tage erhalten als Standard-Hintergrund das gleiche Blau wie die Reinigungskarte (`bg-sky-50 dark:bg-sky-950/30`). Belegte Tage (Tag mit Check-in, Check-out oder Belegung) bekommen ein etwas dunkleres Blau (`bg-sky-100 dark:bg-sky-900/40`).

Gilt für **alle Ansichten**: Monat, Woche und Gantt.

## Umsetzung

In `src/pages/Calendar.tsx`:

1. **Helper** `isDayOccupied(day)`: prüft, ob `monthEvents` für diesen Tag mind. ein Event vom Typ `checkin`, `checkout` oder `occupied` enthält.

2. **Monat-/Wochen-Grid** (Zeilen ~636-650):
   - Default-Background tauschen: `bg-sky-50 dark:bg-sky-950/30`
   - Wenn belegt: `bg-sky-100 dark:bg-sky-900/40`
   - Nicht-aktueller-Monat (`!isCurrentMonth`) bleibt `bg-muted/50 text-muted-foreground` (überschreibt Blau für visuelle Klarheit)
   - Today-Highlight (`bg-primary/10`) entfernen — wird durch das Sky-Blau ersetzt; stattdessen Today nur noch über `ring-2 ring-primary` markieren (analog zur Selected-Markierung)
   - Selected-Ring bleibt unverändert

3. **Gantt-Ansicht** (Tages-Zellen pro Haus-Zeile):
   - Default-Background `bg-sky-50 dark:bg-sky-950/30`
   - Wenn belegt: `bg-sky-100 dark:bg-sky-900/40`
   - Heutiger Tag-Spalte: Ring statt Hintergrund
   - Belegungs-Balken (die farbigen Buchungs-Bars) bleiben unverändert obendrauf

## Betroffene Dateien

- `src/pages/Calendar.tsx`

## Nicht enthalten

- Reinigungskarte selbst bleibt unverändert
- Keine Änderungen an Buchungs-Bars, Events oder Texten
- Keine Tailwind-Config-Änderungen (sky-Klassen sind bereits verfügbar)
