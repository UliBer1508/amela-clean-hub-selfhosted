# Gruppierte Darstellung: 1 Buchung → mehrere Reinigungsaufträge

## Problem
Aktuell wird die Buchungskarte für jeden Reinigungsauftrag wiederholt. Bei 2 Reinigungen für Helena Kunz erscheint die identische Buchungskarte zweimal.

## Lösung
Buchungskarte nur **einmal** anzeigen, darunter beide Reinigungskarten gruppiert. Visuelle Verbindung über einen umschließenden „Gruppen-Container" mit linker Akzentleiste, sodass klar ist: alle Reinigungen darunter gehören zur selben Buchung.

## Layout (mobile, 390px)

```text
┌──────────────────────────────────────┐
│ ▎ ┌─ Buchungskarte (Helena Kunz) ─┐ │
│ ▎ │ Wald Chalet · 3 Pers          │ │
│ ▎ │ Check-in 30.05 · Check-out 06 │ │
│ ▎ └───────────────────────────────┘ │
│ ▎                                    │
│ ▎ ↳ 2 Reinigungen                    │
│ ▎ ┌─ Reinigung 1/2 ───────────────┐ │
│ ▎ │ 30.05.2026 · geplant          │ │
│ ▎ └───────────────────────────────┘ │
│ ▎ ┌─ Reinigung 2/2 ───────────────┐ │
│ ▎ │ 06.06.2026 · geplant          │ │
│ ▎ └───────────────────────────────┘ │
└──────────────────────────────────────┘
```

- Linke Akzentleiste (`border-l-2 border-primary/40`) klammert Buchung + alle Reinigungen visuell zusammen.
- Kleiner Zähler-Hinweis zwischen Buchung und Reinigungen: „2 Reinigungsaufträge" mit `Sparkles`-Icon.
- Jede Reinigungskarte zeigt zusätzlich eine kleine Positionsmarkierung (`1/2`, `2/2`) im Header, damit sofort klar ist, welcher Auftrag gemeint ist.
- Bei nur **1 Reinigung**: Zähler-Hinweis und Positionsmarkierung entfallen, Look bleibt wie bisher (Buchungskarte + 1 Reinigungskarte).
- Standalone-Reinigungen (ohne Buchung): unverändert ohne Gruppen-Container.

## Änderungen

**`src/components/amela/AmelaEntryRow.tsx`**
- Buchungskarte nur einmal rendern, danach `tasks.map()` über alle Reinigungen.
- Alles in einen Container mit `border-l-2 border-primary/40 pl-3 space-y-2`.
- Zwischen Buchung und Reinigungs-Liste eine kleine Zeile: `↳ {tasks.length} Reinigungsaufträge`, nur wenn `tasks.length > 1`.

**`src/components/amela/AmelaCleaningCard.tsx`**
- Optionaler Prop `positionLabel?: string` (z. B. `"1/2"`).
- Wenn gesetzt: kleines Badge `Auftrag 1/2` neben „Reinigungsauftrag"-Titel.

## Nicht geändert
- `AmelaBookingInfoCard`, Daten-Flow, Hooks, Filter, DB, Status-Logik.

## Verifikation
- Helena Kunz mit 2 Reinigungen: 1 Buchungskarte oben, 2 Reinigungskarten gestapelt, Positionsbadges `1/2` und `2/2`.
- Buchung mit 1 Reinigung: keine Positionsbadges, kein Zähler-Hinweis.
- Standalone-Reinigung: unverändert.
- Mobile 390px: kein horizontales Scrollen, alle Touch-Targets ≥ 44px.
