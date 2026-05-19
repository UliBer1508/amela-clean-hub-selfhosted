## Ziel

Die Vor/Zurück-Pfeile neben "Heute" im Kalender sollen auf dem Handy klar als tippbare Buttons erkennbar sein.

## Änderung

`src/pages/Calendar.tsx`, Zeilen 543 + 549:

- Variante `ghost` → `outline` (sichtbarer Rand wie der "Heute"-Button).
- Form `rounded-full` für klare Touch-Affordanz.
- Größe bleibt `h-11 w-11` (Apple-konformes 44 px Touchtarget).
- Icon vergrößern: `h-5 w-5` → `h-6 w-6` (besser sichtbar).
- Aktive Rückmeldung: `active:scale-95` bleibt, zusätzlich `shadow-sm`.

Resultat: drei optisch gleichwertige, klar abgegrenzte Pill-Buttons `‹  Heute  ›`.

## Nicht betroffen

- Desktop-Variante (Zeilen 477–485) bleibt unverändert.
- Funktion (`previousPeriod` / `nextPeriod`) unverändert.
