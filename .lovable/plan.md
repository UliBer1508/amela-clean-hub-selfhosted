## Ziel

In der Kalender-Card oben links (wo aktuell auf Mobile leerer Raum neben den Pfeil/Heute-Buttons ist) wird eine kompakte Legende der Hausfarben angezeigt.

## Umsetzung

In `src/pages/Calendar.tsx` (Card-Header, Zeilen ~520-533):

1. **Layout-Anpassung**: Aktueller Header ist `flex items-center justify-between` mit `ml-auto` auf der Nav. Linke Seite bekommt einen horizontal scrollbaren Chip-Container statt nur dem versteckten `h2`.

2. **Legende-Komponente** (inline): Horizontale Liste aller Häuser aus `houses`:
   - `flex gap-1.5 overflow-x-auto scrollbar-none flex-1 min-w-0 mr-2`
   - Pro Haus ein Chip:
     ```
     <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/40 shrink-0">
       <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: hex}} />
       <span className="text-[11px] font-medium">{abbr}</span>
     </div>
     ```
   - Verwendet bestehende Helfer `getHouseColor(house.id)` und `getHouseAbbreviation(house.name)`.
   - Tooltip via `title={house.name}` für vollen Namen.

3. **Desktop**: Der vorhandene `h2`-Titel bleibt nur ganz oben in einer eigenen Zeile darüber, damit Legende + Nav nebeneinander passen. Konkret:
   - `<h2>` aus der Flex-Zeile rausziehen und darüber als eigene Zeile (`hidden sm:block mb-2`) rendern.
   - Flex-Zeile darunter: `[Legende-Chips, scrollbar] [Nav-Buttons]`.

4. **Touch-Größen**: Chips sind nur Anzeige (kein Klick), 28px Höhe ist ausreichend.

## Betroffene Dateien

- `src/pages/Calendar.tsx`

## Nicht enthalten

- Kein Klick-/Filter-Verhalten auf den Chips (reine Legende)
- Keine Änderungen an `useHouses` oder Farb-Helpern
- Gantt-Zeilen-Beschriftung bleibt unverändert (haben dort schon Farb-Dot + Name)
