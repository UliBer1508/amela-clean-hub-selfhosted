# Farbgruppierung: Buchung + zugehörige Reinigungen

## Ziel
Jede Buchung bekommt eine **eigene, eindeutige Randfarbe** auf der linken Kartenseite. Alle Reinigungsaufträge, die zu dieser Buchung gehören, erhalten dieselbe Farbe. So ist auf einen Blick erkennbar, welche Reinigung zu welcher Buchung gehört (siehe Image Hausverwaltung).

## Lösungsansatz

### 1. Farb-Palette
Neue Hilfsdatei `src/lib/bookingColors.ts`:

```ts
const PALETTE = [
  { border: '#10b981', bg: '#ecfdf5' }, // emerald
  { border: '#f59e0b', bg: '#fffbeb' }, // amber
  { border: '#8b5cf6', bg: '#f5f3ff' }, // violet
  { border: '#ec4899', bg: '#fdf2f8' }, // pink
  { border: '#06b6d4', bg: '#ecfeff' }, // cyan
  { border: '#f97316', bg: '#fff7ed' }, // orange
  { border: '#84cc16', bg: '#f7fee7' }, // lime
  { border: '#3b82f6', bg: '#eff6ff' }, // blue
];

export function getBookingColor(bookingId: string) {
  // deterministischer Hash → stabile Farbe pro Buchung
  let h = 0;
  for (const c of bookingId) h = (h * 31 + c.charCodeAt(0)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}
```

→ Stabile Zuordnung: gleiche Buchung bekommt bei jedem Reload dieselbe Farbe. Reinigungen ohne Buchung (standalone) bekommen eine neutrale graue Farbe.

### 2. Komponenten-Änderungen

**`AmelaBookingInfoCard.tsx`**
- Neuer optionaler Prop `accentColor?: string`.
- `border-l-emerald-500` (hartkodiert) entfernen → ersetzen durch inline `style={{ borderLeftColor: accentColor }}` + `border-l-4`.
- Cremegelber Hintergrund bleibt unverändert.

**`AmelaCleaningCard.tsx`**
- Neuer optionaler Prop `accentColor?: string`.
- `border-l-sky-400` (hartkodiert) entfernen → ersetzen durch inline `style={{ borderLeftColor: accentColor }}` + `border-l-4`.
- Hellblauer Hintergrund bleibt unverändert.

**`AmelaEntryRow.tsx`**
- Bei `entry.type === 'booking'`: `getBookingColor(booking.id)` einmal aufrufen, Farbe an beide Karten weiterreichen.
- Die linke Gruppen-Akzentleiste (`border-l-2 border-primary/40 pl-3`) wird **entfernt** — die Zugehörigkeit ergibt sich jetzt allein über die gemeinsame Randfarbe der Karten. Das spart horizontalen Platz auf Mobile.
- Bei `entry.type === 'standalone'`: neutrale graue Akzentfarbe (`#94a3b8`).

### 3. Optisches Ergebnis
- Helena Kunz Buchung + ihre 2 Reinigungen: alle drei Karten mit **z. B. grünem** linken Rand.
- Luca Buchung + ihre Reinigungen: alle mit **z. B. orangem** Rand.
- Sofort visuelle Gruppierung ohne Container/Klammer.

## Nicht geändert
- Datenfluss, Hooks, Filter, DB, Status-Logik.
- Hintergrundfarben der Karten (gelb / hellblau).
- Layout/Stacking der Karten.

## Verifikation (Mobile 390px)
- Helena Kunz mit 2 Reinigungen: alle 3 Karten haben identische Randfarbe.
- Andere Buchungen daneben: deutlich unterscheidbare Randfarben.
- Reload: Farben bleiben stabil pro Buchung.
- Standalone-Reinigung: neutraler grauer Rand.
