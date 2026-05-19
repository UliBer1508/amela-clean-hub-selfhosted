## Übersicht

14-Punkte-Refactor. Vor Umsetzung **drei wichtige Korrekturen / Rückfragen** zum Originalvorschlag — danach saubere Umsetzung in 3 Wellen.

---

## ⚠️ Wichtige Korrekturen zum Vorschlag

### Punkt 1 (.env) — Risiko überschätzt
Die `.env` enthält ausschließlich `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY` und `VITE_SUPABASE_URL`. Das sind **öffentliche** Werte (publishable/anon key, durch RLS geschützt) und landen ohnehin im JS-Bundle. **Es leakt nichts.** Trotzdem: `.env` zu `.gitignore` hinzufügen — Best Practice.

### Punkt 2 (Provider-ID) — Sicherheitstheater
Ein UUID ist kein Geheimnis. `VITE_`-Vars sind im Client lesbar — kein Sicherheitsgewinn. **Aber** als Config-Variable trotzdem sinnvoll (Wechsel zwischen Umgebungen). Wird mit Fallback umgesetzt:
```ts
export const AMELA_PROVIDER_ID =
  import.meta.env.VITE_AMELA_PROVIDER_ID ?? '9de6e071-7e89-4d66-9433-a5f01acaa493';
```

### Punkt 3 (useEffect für notesValue) — **Würde Bug einbauen**
Das aktuelle Verhalten ist korrekt: `notesValue` wird beim Klick auf "Bearbeiten" frisch aus `task.notes` gesetzt (Zeile 207). Ein blinder `useEffect([task.notes])` würde jede Benutzereingabe **während des Tippens** überschreiben, sobald Realtime ein Update liefert. **Sichere Variante**:
```tsx
useEffect(() => {
  if (!editingNotes) setNotesValue(task.notes || '');
}, [task.notes, editingNotes]);
```
Nur synchen, wenn nicht editiert wird.

### Punkt 8 (Unbezahlt-Badge) — **Konflikt mit Nutzerwunsch**
Du hast vor wenigen Schritten explizit gesagt: _"die hintergrundfarbe möchte ich leicht grün haben"_. Punkt 8 würde das rückgängig machen. **Vorschlag: Punkt 8 überspringen** (grün bleibt). Falls doch rot gewünscht, bitte kurz bestätigen.

---

## 🔴 Welle 1 – Kritisch

1. `.gitignore`: `.env` (und `.env.local`, `.env.*.local`) ergänzen
2. `AMELA_PROVIDER_ID` mit Env-Fallback (siehe oben). Verwendungen unverändert.
3. `useEffect` für `notesValue` in `AmelaCleaningCard` — mit Schutz gegen Overwrite während Editieren

## 🟡 Welle 2 – Cleanup & Dedup

4. `CleaningPortal`: `handleTaskNotesUpdate` + `handleStandaloneNotesUpdate` → ein `handleNotesUpdate`
5. `CleaningPortal`: `handleStatusUpdate`/`handleStaffUpdate`/`handleDateTimeUpdateFromCard` nutzen `useBookings`-Mutations (`updateTaskStatus`, `updateTaskStaff`, `updateTaskDateTime`)
6. `CleaningPortal`: Toten Code entfernen (`editingTask`, `handleEditDateTime`, `handleDateTimeUpdate`, `selectedDate`, `selectedTime` für Date-Editing)
7. Unused Imports entfernen:
   - `CleaningPortal`: `AddStandaloneCleaningDialog`, `ArrowLeft`, `UserPlus`, `RefreshCw`, `ChevronDown`, `ChevronUp`, `Filter`, `CalendarRange`, `CalendarDays`, `formatDateTime`, `Checkbox`, `Label`, `Input`, `format`, `de`
   - `Calendar.tsx`: `previousMonth` und `nextMonth` (durch `previousPeriod`/`nextPeriod` ersetzt)
8. **ÜBERSPRUNGEN** — Badge bleibt grün (Nutzerwunsch). Bitte bestätigen falls anders gewünscht.

## 🔵 Welle 3 – Verbesserungen

9. `AmelaCleaningCard`: `task: any` → `ServiceTask`, `staff: any[]` → `CleaningStaff[]`, `as any`-Casts entfernen
10. `TaskEditingState`: Lokale Definition in `CleaningPortal` entfernen, aus `@/types/booking` importieren
11. `useBookings` aufsplitten:
    - `useBookings` — nur cleaning-bezogene Daten (kein `allBookings`)
    - `useAllBookings` — neuer Hook, vollständige Buchungen für Kalender
    - `Calendar.tsx` auf neuen Hook umstellen
12. `CleaningPortal`: Realtime-UPDATE-Listener entfernen (Hook erledigt das); nur INSERT-Listener für Benachrichtigungs-Badge/Toast behalten
13. `Calendar.tsx`: `showNotificationSettings` State + View-Block ersatzlos entfernen (kein Trigger vorhanden)
14. `Calendar.tsx`: `calendarTitle` als einmal berechnete Konstante, in allen drei Render-Stellen verwenden

---

## Betroffene Dateien

- `.gitignore`
- `src/constants/app.ts`
- `src/components/amela/AmelaCleaningCard.tsx`
- `src/pages/CleaningPortal.tsx`
- `src/pages/Calendar.tsx`
- `src/hooks/useBookings.ts` (+ neuer `src/hooks/useAllBookings.ts`)

## Verifikation

- Build/Typecheck nach jeder Welle
- Schneller manueller UI-Check (Karten rendern, Notizen editieren, Filter, Kalender)

---

**Soll ich so vorgehen — inklusive Übergehen von Punkt 8 (Badge bleibt grün)?**
