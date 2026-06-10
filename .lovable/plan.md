## Bugfix: "Unbezahlt"-Badge Farbe

In `src/components/amela/AmelaCleaningCard.tsx`, Zeile 49, ist der `unpaid`-Zweig mit grünen Klassen versehen — das ist irreführend, da Grün "bezahlt" suggeriert.

### Änderung

Nur den `className`-String im `unpaid`-Zweig austauschen:

- **Vorher:** `bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800`
- **Nachher:** `bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800`

`paid` (default/grün) und `pending` (secondary/neutral) bleiben unverändert. Keine weitere Logik betroffen.
