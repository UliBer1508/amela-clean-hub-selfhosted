## Restliche Bugfixes umsetzen

Status quo: Punkte 4, 11, 12 sind bereits im Code vorhanden, Punkt 8 ist teilweise da. Folgende Punkte werden jetzt umgesetzt — **ohne UI-/Style-Änderungen, ohne Schema-Änderungen**.

### 1. `src/utils/date.ts` — Filter zeigt Zukunft statt Vergangenheit
- Tagesgrenzen normalisieren (`setHours(0,0,0,0)`).
- `today`: exakter Tagesvergleich.
- `week / month / 3months / 6months`: Bereich `now → now + N`.
- `12months` bleibt erhalten, ebenfalls in die Zukunft.

### 2. `src/hooks/usePortalMessages.ts` — Konstante statt Hardcode
- Lokales `const AMELA_PROVIDER_ID = '...'` entfernen.
- `import { AMELA_PROVIDER_ID } from '@/constants/app';`

### 3. `src/hooks/useBookings.ts` — Debounce + parallele Queries
- `useRef` für Timeout, `debouncedFetch` mit 500 ms.
- Beide Realtime-Handler (`bookings`, `service_tasks`) rufen `debouncedFetch()` statt `fetchBookings()`.
- Cleanup räumt Timeout zusätzlich zu den Channels auf.
- `cleaningData` und `allData` parallel via `Promise.all`. Standalone-Query bleibt sequentiell danach (klein, abhängig vom selben Try-Block).
- `forceRefresh` / `updateTask*` rufen weiterhin direkt `fetchBookings()` (kein Debounce, damit der User sofortiges Feedback bekommt).

### 4. `src/App.tsx` — QueryClient vervollständigen
- Ergänzen: `gcTime: 5 * 60 * 1000`, `retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000)`, `refetchOnWindowFocus: false`, `mutations: { retry: 1 }`.
- `staleTime`, `retry`, `TooltipProvider` bleiben wie sie sind.

### 5. `src/components/ConfigurableBookingCard.tsx` — Termin-Dialog kontrolliert
- Neuer State `isDateDialogOpen`.
- `handleEditDateTime` setzt ihn auf `true`.
- `handleDateTimeUpdateInternal` setzt ihn nach Speichern auf `false` und nullt `editingTask`.
- `<Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>` ums bestehende Markup, `DialogTrigger` bleibt erhalten (kein optisches Delta).

### 6. `src/components/BookingCardSettings.tsx` — Race in `updateConfig` beheben
- Bestehenden „check existence → insert/update"-Pfad ersetzen durch ein einzelnes `upsert({ config, updated_at }, { onConflict: 'id' })`.
- Bei Erfolg lokalen State setzen, bei Fehler loggen — Rückgabewerte/Signatur unverändert.

### 7. `src/pages/CleaningPortal.tsx` — Fehler-Karte mit Retry + Skeletons
- **Fehler-Zustand**: bisheriger roter Text wird zu einer Card mit Icon ⚠️, Titel „Verbindungsfehler", Fehlertext und Button „🔄 Erneut versuchen" → ruft `forceRefresh()`. Verwendet ausschließlich vorhandene shadcn-Tokens (`Card`, `Button`).
- **Loading-Zustand**: Vollbild-Spinner für `bookingsLoading` entfernen. Header/Filter/Navigation bleiben sichtbar; in der Karten-Liste werden 3 Skeleton-Karten angezeigt, solange `bookingsLoading` true ist. Initial-Spinner bleibt nur für `housesLoading || staffLoading || configLoading`.

### Was nicht angefasst wird
- Visuelle Gestaltung, Farben, Layout, Typografie.
- Datenbank, Auth, RLS.
- Bereits erledigte Punkte 4, 11, 12.

### Verifikation nach Umsetzung
- Console- und Runtime-Logs auf Fehler prüfen.
- Preview kurz öffnen: Filter „nächste Woche" zeigt zukünftige Aufgaben, Termin-Dialog schließt nach Speichern, Fehler-/Skeleton-State sichtbar wenn Daten laden/fehlschlagen.
