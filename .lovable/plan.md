## Problem

Die mobile Bottom-Navigation ist im Code vorhanden, wird aber im Handy-Preview nicht angezeigt.

## Ursache

`<PullToRefresh>` umschließt den gesamten Portal-Inhalt inklusive der Bottom-Nav. Die innere Hülle in `PullToRefresh.tsx` (Zeile 120–130) trägt dauerhaft ein `transform: translateY(...)` Style.

Ein CSS-`transform` auf einem Vorfahren erzeugt einen neuen Containing Block für `position: fixed`. Dadurch verhält sich `fixed bottom-0` der Nav nicht mehr wie viewport-fixiert, sondern wird relativ zum transformierten Wrapper positioniert – sie sitzt am Ende des gesamten Inhaltes und ist außerhalb des Sichtbereichs.

## Lösung

Bottom-Nav aus dem `<PullToRefresh>`-Wrapper herausziehen, sodass kein transformierter Vorfahre mehr existiert.

In `src/pages/CleaningPortal.tsx`:
- JSX-Struktur ändern zu einem React-Fragment, das `<PullToRefresh>` und die `<nav>` als Geschwister rendert
- Damit `fixed bottom-0 z-50` wieder am Viewport haftet

Keine weiteren Änderungen am Design oder an den Menüpunkten – nur Positionierung wird korrigiert.
