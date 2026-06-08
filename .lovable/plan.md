# Konzept: Wäsche-Status in der Buchungskarte

## Ziel
Amela soll auf einen Blick sehen, ob für die Buchung Wäsche bestellt wurde und ob/wann sie geliefert wurde — direkt in der Buchungskarte (`AmelaBookingInfoCard`), unterhalb des Check-in/Check-out-Blocks.

## Datenquelle
Tabelle `linen_orders` (existiert bereits):
- `booking_id` → Verknüpfung zur Buchung
- `status` (z. B. `pending`, `ordered`, `in_progress`, `delivered`, `cancelled`)
- `delivery_date`, `delivery_time`
- `total_items`

Wir laden pro Buchung die zugehörige Wäschebestellung (falls vorhanden) und leiten daraus einen von 4 Anzeige-Zuständen ab:

| Zustand | Bedingung | Farbe | Text |
|---|---|---|---|
| Geliefert | `status = 'delivered'` | Grün | „Wäsche geliefert • 18.06." |
| Unterwegs | `delivery_date` gesetzt, Status ≠ delivered/cancelled | Amber | „Wäsche kommt am 18.06." |
| Bestellt | Bestellung vorhanden, kein Lieferdatum | Blau | „Wäsche bestellt (12 Stk.)" |
| Keine | Keine `linen_orders` Zeile | Grau | „Keine Wäsche bestellt" |

## Visuelles Konzept

Ein kompakter Status-Streifen unterhalb der Check-in/out Grid-Zellen, im gleichen Stil wie die bestehenden Mini-Karten (`bg-muted/30`, `border-2`, abgerundet), aber volle Breite:

```text
┌──────────────────────────────────────────────────────┐
│ 🧺  WÄSCHE         ● Geliefert am 18.06.            │
└──────────────────────────────────────────────────────┘
```

- Icon links: `Shirt` (lucide) im Wäsche-Violett (passend zu Calendar-Farbschema `bg-violet-600`)
- Label „WÄSCHE" klein, uppercase, muted — gleiche Typografie wie „CHECK-IN"
- Status-Dot + Statustext rechts in Farbe des Zustands
- Bei „Keine Wäsche bestellt": dezent grau, ohne Dot

### Beispiele der 4 Varianten

```text
🧺 WÄSCHE   ● Geliefert · 18.06.        ← grün
🧺 WÄSCHE   ● Lieferung 18.06. 09:00    ← amber
🧺 WÄSCHE   ● Bestellt · 12 Stk.        ← blau
🧺 WÄSCHE   ○ Keine Wäsche bestellt      ← grau
```

## Umsetzung (technisch)

1. **`useBookings.ts`** — `bookings`-Query um Subselect erweitern:
   ```ts
   linen_orders!linen_orders_booking_id_fkey (
     id, status, delivery_date, delivery_time, total_items
   )
   ```
2. **`src/types/booking.ts`** — `LinenOrder` Interface + `linen_orders?: LinenOrder[]` an `Booking`.
3. **Neue Komponente `src/components/amela/LaundryStatusRow.tsx`** — bekommt `linen_orders[]`, rendert den Status-Streifen mit Helper `getLaundryDisplayState(orders)`.
4. **`AmelaBookingInfoCard.tsx`** — direkt nach dem Check-in/out Grid `<LaundryStatusRow orders={booking.linen_orders} />` einbinden.

## Out of Scope
- Keine Bearbeitung des Wäschestatus aus der Karte (nur Anzeige).
- Keine Änderung an Calendar / Boris-Portal.
- Keine Änderung an `StandaloneCleaningCard` (Standalone-Reinigungen haben keine Buchung → kein linen_order).
