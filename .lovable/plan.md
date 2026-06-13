## Problem
Bei gelieferten Wäschebestellungen wird aktuell `delivery_date` (geplantes Lieferdatum, z.B. 19.6.) angezeigt. Es soll stattdessen das tatsächliche Datum der Statusänderung auf "geliefert" + der Name der Person, die den Status geändert hat, angezeigt werden.

## Lösung
Die DB-Spalten `status_changed_at` und `status_changed_by` existieren bereits auf `linen_orders` und werden für Status-Audit verwendet (analog zu `service_tasks`). Sie müssen nur ins Frontend gezogen werden.

### Änderungen

**1. `src/types/booking.ts` — LinenOrder erweitern**
```ts
status_changed_at?: string | null;
status_changed_by?: string | null;
```

**2. `src/hooks/useBookings.ts` — Felder im Query mitselektieren**
Im `linen_orders!linen_orders_booking_id_fkey` Block ergänzen:
```
status_changed_at,
status_changed_by,
```

**3. `src/components/amela/LaundryStatusRow.tsx` — Anzeige anpassen**
Beim Variant `delivered`:
- Datum aus `status_changed_at` (Fallback: `delivery_date`) im Format `dd.MM.`
- Zusatzzeile/Suffix mit `status_changed_by` (Fallback: "System")

Beispiel-Anzeige: `Geliefert · 20.06. · Teuni`

Formatierung des Zeitstempels mit `format(parseISO(status_changed_at), 'dd.MM.', { locale: de })`.

### Sicherstellen, dass der Status-Wechsel überhaupt gesetzt wird
Stichprobe im Code, ob beim Setzen von `linen_orders.status = 'delivered'` (Teuni-Portal / Boris / Edge Function) auch `status_changed_at = now()` und `status_changed_by = <Name>` geschrieben werden. Falls nicht, dort ergänzen, damit künftige Änderungen korrekt protokolliert werden. (Bestehende, bereits gelieferte Bestellungen ohne `status_changed_at` fallen automatisch auf `delivery_date` zurück.)

### Keine DB-Migration nötig
Spalten existieren bereits.
