## Ziel

Die Bedienelemente der Reinigungskarte (`ConfigurableBookingCard.tsx` und `StandaloneCleaningCard.tsx`) werden vom vertikalen Stack auf ein **2-Spalten-Tile-Grid** umgestellt — analog zum hochgeladenen Screenshot. Alle Tiles sind groß, touchfreundlich (min. 56–64 px hoch), klickbar und öffnen bei Bedarf ein zentriertes Dialog-Popup zum Bearbeiten.

## Layout-Konzept

```text
┌──────────────────────┬──────────────────────┐
│ 🕐 REINIGUNGSTERMIN  │ 📊 STATUS            │
│ 19.06.2026 · 09:00   │ 🟡 Geplant           │
├──────────────────────┼──────────────────────┤
│ 📝 NOTIZEN           │ ✅ CHECKLISTE        │
│ Keine / 2 Zeilen…    │ Öffnen               │
└──────────────────────┴──────────────────────┘
```

- Grid: `grid grid-cols-2 gap-2 md:gap-3`
- Jede Tile = Card mit Icon + Label (uppercase, klein) oben, Wert (fett) darunter
- Tile-Klasse: `min-h-[64px] rounded-2xl p-3 bg-card border shadow-sm active:scale-[0.98] transition`, ganze Tile als Button klickbar
- Aktive/Highlight-Tile (z. B. Status) bekommt farbigen Ring passend zum Status (`ring-2 ring-yellow-400` etc.)

## Interaktionsmuster

Alle Tiles bleiben Read-View. Bearbeiten erfolgt in zentrierten Dialog-Popups (konsistent mit bestehender Mobile-Regel):

| Tile             | Klick öffnet                                                                 |
| ---------------- | ---------------------------------------------------------------------------- |
| Reinigungstermin | Dialog mit `Calendar` + Zeit-Input + Speichern/Abbrechen                     |
| Status           | Dialog mit Status-Optionen als große Buttons (je min. 48 px)                 |
| Notizen          | Dialog mit `Textarea` + Speichern/Abbrechen                                  |
| Checkliste       | Bestehender `BeforeYouGoChecklist` Dialog                                    |

Dialog-Container einheitlich: `w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-y-auto rounded-3xl p-5 border-0 shadow-2xl` (Mobile-Regel aus Memory).

Inline-`Select` für Status und Inline-Bearbeiten-Buttons für Notizen werden entfernt — Logik (`onStatusUpdate`, `onDateTimeUpdate`, `onNotesUpdate`) bleibt 1:1.

## Out of Scope

- **„Zugewiesen an" bleibt unverändert** (kein Tile, weiterhin wie aktuell als Inline-Select)
- Keine Änderungen am Header (Haus-Info, Gast-Info, Buchungsstatus)
- Keine Änderungen an Filter-/Listen-Logik, Hooks oder Backend
- Keine neuen Felder, nur visuelle Neuanordnung + Popup-Bearbeitung der vier Tiles

## Touch- & Accessibility-Regeln

- Jede Tile ≥ 44×44 px (Memory-Regel), Ziel 56–64 px Höhe
- `aria-label` pro Tile (z. B. „Status ändern, aktuell Geplant")
- `active:scale-[0.98]` für Tap-Feedback

## Betroffene Dateien

- `src/components/ConfigurableBookingCard.tsx` — Reinigungs-Block durch Tile-Grid ersetzen, Bearbeitungs-Dialoge ergänzen
- `src/components/StandaloneCleaningCard.tsx` — gleicher Aufbau für Standalone-Reinigungen

## Design-Tokens

- Tile-Hintergrund `bg-card`, Text `text-foreground`, Label `text-muted-foreground uppercase tracking-wide text-[11px]`
- Status-Farben über bestehende Status-Tokens als `ring` und Punkt-Icon
- Keine Hardcoded-Hex-Werte, alles über bestehende Tailwind/HSL-Tokens
