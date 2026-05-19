## Ziel

Das Tages-Termine-Popup (Mobile Sheet im Kalender) wird kompakter, touch-freundlicher und visuell attraktiver — im Stil einer modernen iOS-Action-Sheet-Card.

## Designvorschlag

```text
┌─────────────────────────────────┐
│        ━━━━ (Grab-Handle)        │  ← Drag-Indicator
│                                  │
│  Freitag                    [✕]  │
│  29. Mai                         │  ← großer Datums-Header
│                                  │
│  ┌────────────────────────────┐ │
│  │ 🧹  Reinigung              │ │
│  │     Wald Chalet            │ │
│  │     • Geplant         →    │ │  ← Karte mit Icon-Bubble
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │ 🧺  Wäsche Lieferung       │ │
│  │     Wald Chalet            │ │
│  │     • Geliefert            │ │
│  └────────────────────────────┘ │
│                                  │
│      Schliessen (Text-Link)      │
└─────────────────────────────────┘
```

### Konkrete Änderungen

**Container (Sheet)**
- `max-h-[70vh]` (statt 80vh) — kompakter
- `rounded-t-3xl` (stärker gerundet, iOS-like)
- `px-4 pt-3 pb-6` mit safe-area
- Drag-Handle oben: `mx-auto w-10 h-1.5 rounded-full bg-muted-foreground/30 mb-3`

**Header**
- Wochentag groß (`text-xl font-semibold`), Datum klein darunter (`text-sm text-muted-foreground`)
- Schliessen-Icon oben rechts (`w-9 h-9 rounded-full bg-muted/50`) — ersetzt den Standard-Sheet-X
- Kein Border unten — Luft

**Event-Karten**
- `rounded-2xl bg-card border border-border/60 p-3 active:scale-[0.98] transition-transform`
- Links: runde Icon-Bubble (`w-10 h-10 rounded-full`) in der Haus-Farbe (semi-transparent, z.B. `bg-sky-500/15`), darin Lucide-Icon je Typ (Sparkles für Reinigung, Shirt für Wäsche, LogIn/LogOut für Check-in/out, Bed für Belegt)
- Mitte: Titel ohne Präfix ("Wald Chalet" statt "Reinigung: Wald Chalet"), Typ-Label klein darunter ("Reinigung • 10:00" / "Wäsche Lieferung")
- Status als kleiner Inline-Dot + Text statt großem Badge: `• Geplant` in muted-Farbe; Farb-Dot je Status (grün=erledigt, gelb=in Arbeit, blau=geplant)
- Chevron rechts nur für anklickbare Einträge (Reinigung)
- Spacing zwischen Karten: `space-y-2`

**Footer-Button**
- „Schliessen" als unauffälliger Ghost-Button (`variant="ghost" w-full h-11 text-muted-foreground`) statt voller Outline — weniger Gewicht, da X-Button oben schon vorhanden

**Touch-Targets**
- Jede Karte mind. 64px hoch
- Tap-Feedback: `active:scale-[0.98]` + `active:bg-accent/50`

### Status-Mapping (deutsch)

| Status | Anzeige | Dot-Farbe |
|---|---|---|
| scheduled | Geplant | blue-500 |
| in_progress | In Arbeit | amber-500 |
| completed / delivered | Erledigt | emerald-500 |
| cancelled | Abgebrochen | rose-500 |

## Betroffene Dateien

- `src/pages/Calendar.tsx` — nur das Mobile Tages-Detail-Sheet (Zeilen ~806-855)

## Nicht enthalten

- Kein Redesign des Reinigungsauftrag-Detail-Sheets (kann separat folgen)
- Keine Datenstruktur- oder Logikänderungen
- Desktop unverändert
