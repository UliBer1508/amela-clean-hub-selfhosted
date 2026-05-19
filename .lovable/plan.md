## Umsetzung Variante 1

### `src/components/Footer.tsx`
- Default-Export bleibt `Footer` — wrapper bekommt `hidden sm:block`, damit Footer nur auf Desktop sichtbar ist.
- Zusätzlich `export const CopyrightLine` mit dem exakten Text `© 2025 Copy Right Steinbock Chalets`, klein (`text-[10px] text-muted-foreground text-center`), für Wiederverwendung.

### `src/pages/Calendar.tsx` & `src/pages/CleaningPortal.tsx`
- Import `CopyrightLine` zusätzlich zu `Footer`.
- In der Mobile-Bottom-Nav (`<nav className="sm:hidden fixed ...">`) eine Zeile mit `<CopyrightLine />` direkt **über** der `flex justify-around items-center h-16` Zeile einfügen (kleine Höhe ~16px, `border-b border-sky-200/50`).
- `<main>` Padding-Bottom auf Mobile von `pb-24` → `pb-28` erhöhen, damit kein Inhalt unter dem nun höheren Bottom-Bar verschwindet.

### Verifikation
- Mobile 390×844: kein loser Copyright-Block mehr mitten in der Seite; feine Copyright-Zeile am unteren Rand über den Nav-Buttons.
- Desktop ≥640px: Footer wie gehabt.
- Copyright-Text exakt wie in Memory-Regel.
