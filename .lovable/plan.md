## Datum/Uhrzeit unter "Reinigungsauftrag" entfernen

In `src/components/amela/AmelaCleaningCard.tsx` (Header der Karte, ca. Z. 82–86) wird unter dem Titel "Reinigungsauftrag" eine Zeile mit `formatDateTime(...)` und Status-Label angezeigt. Datum/Uhrzeit sind redundant, weil die "Reinigungstermin"-Kachel darunter dieselbe Information zeigt.

### Änderung

- Die komplette Zeile `<p className="text-xs text-muted-foreground truncate">{formatDateTime(...)} · {STATUS_LABELS...}</p>` entfernen.
- Status wird bereits durch den neuen farbigen Status-Badge rechts angezeigt — keine Doppelung nötig.
- Keine weitere Logik, kein Import, kein anderes Element betroffen.
