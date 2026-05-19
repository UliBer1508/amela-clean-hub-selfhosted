## Ziel

Die aktuelle "Such & Filter"-Leiste oben auf der Reinigungsübersicht wird durch klickbare Filterkarten ersetzt.

## Neues Layout

**Zeile 1 – Häuser** (horizontal scrollbar auf Mobile, Grid auf Desktop):
- Eine Karte pro touristisches Haus (`houses` Array, bereits gefiltert auf `is_touristic`)
- Zusätzlich eine "Alle Häuser"-Karte ganz links
- Aktive Karte visuell hervorgehoben (z.B. Primary-Border + dunklerer Hintergrund)

**Zeile 2 – Zeitraum**:
- Karte "Diese Woche"
- Karte "Nächste Woche"
- (Zusätzlich "Alle" Karte zum Zurücksetzen)

Klick auf eine Karte setzt den jeweiligen Filter (`houseFilter` bzw. `timeFilter`). Erneuter Klick auf die aktive Karte setzt zurück auf "all".

## Was entfällt

- Aufklappbarer "🔍 Such & Filter"-Bereich mit Toggle
- Such-Input (Gast/Haus/Adresse)
- Status-Dropdown, Putzkraft-Dropdown, Haus-Dropdown, Zeitraum-Dropdown
- "Auch eingecheckt"-Checkbox
- Counter + "Filter zurücksetzen"-Button

Da Status, Putzkraft, Suche und Checked-In bisher ebenfalls über diese Leiste gesteuert wurden, müssen wir entscheiden was damit passiert.

## Technische Details

- `CleaningPortal.tsx` Zeilen 575–704 werden durch zwei `<div>` mit Karten-Grids ersetzt
- Neue `TimeFilter`-Variante `'nextWeek'` ergänzen in `CleaningPortal.tsx`, `useBookings.ts` und `utils/date.ts` (`isWithinTimeRange`)
- Karten als neue Komponente `AmelaFilterCard.tsx` (mit Icon, Label, optional Count)
- Optional: Anzahl der Aufträge je Haus/Woche auf der Karte anzeigen

## Offene Frage

Was soll mit den restlichen Filtern (Status, Putzkraft, Suche, "Auch eingecheckt"-Checkbox) passieren?
- A) Komplett entfernen – nur Haus + Woche bleiben als Filter
- B) In ein kleines Dropdown / Sheet "Weitere Filter" verschieben
- C) Status-Standard bleibt auf 'scheduled', der Rest entfällt
