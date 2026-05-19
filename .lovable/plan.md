## Ziel

Das Tages-Detail-Sheet auf Mobile durch ein zentriertes Dialog-Popup ersetzen — wie ein iOS-Alert: schwebt in der Bildschirmmitte, Abstand zu allen Seiten, dunkler Hintergrund-Overlay, alle 4 Ecken rund.

## Änderung

Datei: `src/pages/Calendar.tsx`, Zeilen 847–968.

- `<Sheet side="bottom">` durch `<Dialog>` aus `@/components/ui/dialog` ersetzen.
- `DialogContent` Klassen für Mobile-Popup:
  - `max-w-[calc(100vw-2rem)]` (16 px Abstand links/rechts)
  - `max-h-[80vh] overflow-y-auto`
  - `rounded-3xl p-5`
  - `sm:hidden` Wrapper bleibt — Desktop nutzt weiter die bestehende Inline-Anzeige.
- Grab-Handle (Zeile 854) entfällt — bei zentriertem Dialog unnötig.
- Schliessen-Button (X oben rechts) bleibt mit gleichem Styling.
- Header (Wochentag + Datum) und Eventliste bleiben inhaltlich identisch.
- Footer-Schliessen-Button (Zeilen 962–966) bleibt.
- `DialogPortal` / `DialogOverlay` von shadcn liefert automatisch den dunklen Hintergrund.

## Nicht betroffen

- Desktop-Logik
- Cleaning-Detail-Sheet (Zeilen 990+) bleibt Bottom-Sheet
- Daten / Funktionen unverändert
