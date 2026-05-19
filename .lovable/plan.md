## Ziel

Mobile Kalender-Ansicht aufräumen: Tag-Tap öffnet ein **Bottom-Sheet/Dialog** mit den Terminen statt einer Sidebar, die ausserhalb des Sichtbereichs liegt. Touch-Targets durchgängig auf 44px, Header verschlankt.

## Änderungen in `src/pages/Calendar.tsx`

### 1. Tag-Detail als Popup (Sheet) auf Mobile
- Neuer State `dayDetailOpen` (boolean) — beim Klick auf einen Kalendertag auf Mobile zusätzlich zu `setSelectedDate(day)` setzen
- Inhalt der bestehenden "Termine für …" Card in ein **shadcn `Sheet`** (bottom side) auslegen — nur sichtbar auf `sm:hidden`
- Auf Desktop (`hidden sm:block`) bleibt die Sidebar-Card erhalten (kein Scroll-Problem dort)
- Sheet enthält: Datum-Header, Event-Liste (gleiches Markup wie heute), grosser "Schliessen"-Button (44px)
- Tap auf Event-Eintrag im Sheet → optional Markierung; kein Navigations-Sprung nötig

### 2. Touch-Targets in Header/Navigation (Mobile)
- "Heute / ← / →" Buttons: explizit `min-h-[44px] min-w-[44px]`, etwas mehr horizontal Padding, `active:scale-95`
- View-Switcher (Monat/Woche/Gantt): drei Pills mit `min-h-[44px]`, volle Breite des Containers (3-Spalten-Grid) statt zentriertem Wrap
- Card-Header in der Kalender-Card (`previousPeriod`/`nextPeriod` Pfeile): von `size="sm"` Ghost-Buttons auf 44x44 `icon`-Buttons

### 3. Tageszellen vergrössern
- Monatsansicht: Mindesthöhe pro Zelle auf Mobile von `min-h-[100px]` → `min-h-[88px]` (kompakter, aber Tap noch komfortabel), `p-2` → `p-1.5`
- Pro Zelle aktuell max. 2 Events. Auf Mobile auf **3 Events** erhöhen, da Popup eh die Detail-Ansicht hat — `+X weitere` wie gehabt
- Event-Pills: `min-h-[20px]`, `text-[10px]` auf Mobile, `text-xs` ab `sm:`
- Selektion deutlicher: aktiver Tag mit `ring-2 ring-primary` statt `bg-primary text-primary-foreground` (sonst werden Event-Pills unlesbar)

### 4. Wochenansicht
- `min-h-[120px]` bleibt; Tap öffnet auf Mobile gleiches Sheet

### 5. Gantt
- Keine Änderung am Inhalt; nur die Header-Pfeile auf 44x44

### 6. Aufräumen
- Doppelter Kalender-Titel auf Mobile (h1 oben + h2 in Card-Header) → auf Mobile den h2 entfernen, Pfeile bleiben in der Card
- Sidebar bleibt nur Desktop (`hidden lg:block`), so dass Mobile keinen Leerraum darunter sieht

## Betroffene Dateien

- `src/pages/Calendar.tsx`

Keine neuen Abhängigkeiten — `Sheet` ist bereits im shadcn-Set (`@/components/ui/sheet`).

## Verifikation

- Build/Typecheck
- Mobile Viewport (390×844): Tap auf Tag öffnet Sheet, Schliessen klappt, alle Buttons ≥44px
- Desktop (≥1024): Sidebar verhält sich wie zuvor
