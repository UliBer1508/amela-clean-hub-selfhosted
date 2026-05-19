## Problem

Nach dem Ausblenden des Mobile-Headers bleibt oben ~48px Leerraum. Ursache: Der Wrapper `<div className="pt-12 md:pt-0">` reserviert auf Mobile fix 48px für die `PWAStatusBar`. Diese Statusleiste ist jedoch nur sichtbar wenn:
- die App als PWA installiert ist, **oder**
- das Gerät offline ist.

Im Normalfall (Browser, online) ist der Platz also leer – genau das, was du siehst.

Zusätzlich erzeugt `<main class="py-3">` nochmals 12px Padding oben.

## Lösung

**1. `pt-12` dynamisch machen** – nur reservieren, wenn die `PWAStatusBar` tatsächlich angezeigt wird.

- `usePWA()` Hook nutzen, um `isInstalled` und `isOnline` abzufragen
- Wrapper-Klasse: `${shouldShow ? 'pt-12' : 'pt-0'} md:pt-0`

**2. Top-Padding des Main-Bereichs auf Mobile reduzieren**

- `py-3` → `pt-1 pb-3` (oder `pt-2`) auf Mobile, Desktop bleibt `md:py-8`

## Betroffene Dateien

- `src/pages/CleaningPortal.tsx` (Zeile 463 + Zeile 530)
- `src/pages/Calendar.tsx` (Zeile 348 + Main-Padding analog)

## Ergebnis

- Im Browser/online: Inhalte rücken ~56px nach oben, kein Leerraum mehr.
- Als installierte PWA oder offline: Statusleiste bleibt wie gewohnt sichtbar, kein Überlappen.
- Desktop bleibt unverändert.
