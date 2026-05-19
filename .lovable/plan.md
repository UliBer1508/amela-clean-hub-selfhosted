# Umstellung Amela-Portal auf klickbare Karten

Ziel: Wie im Wäscheportal soll jede Buchung mit Reinigung als zwei eigenständige, flache Karten angezeigt werden – keine Verschachtelung mehr. Visuell orientiert am gezeigten Wäscheportal-Stil (saubere weiße Karten, klare Hierarchie, Tap-/Klick-bar).

## Neues Layout pro Eintrag

Pro Reinigungs-Task werden zwei nebeneinander/untereinander stehende Karten gerendert:

```text
┌──────────────────────────────┐  ┌──────────────────────────────┐
│ BUCHUNG                      │  │ REINIGUNG                    │
│ 🏠 Hausname · Adresse        │  │ 📅 Reinigungsdatum/-zeit ✎   │
│ 👤 Gastname                  │  │ Status: [Geplant ▾]          │
│ 👥 X Personen                │  │ 💰 Bezahlt / Unbezahlt       │
│ 📅 Check-in · 📅 Check-out   │  │ 👨‍💼 Zugewiesen an [..]       │
│                              │  │ ❗ Bevor du gehst (Button)    │
└──────────────────────────────┘  └──────────────────────────────┘
```

- Auf Mobile (390px) stapeln die Karten untereinander, auf ≥md nebeneinander (Grid 2 Spalten).
- Mehrfache Reinigungen einer Buchung erzeugen je Reinigung ein eigenes Karten-Paar (statt verschachtelt).
- Standalone-Reinigungen (ohne Buchung) bleiben als einzelne Reinigungskarte (ohne Buchungskarte) sichtbar.

## Inhalt der Karten

Buchungskarte (read-only Info):
- Haus (Name + Adresse)
- Gastname
- Anzahl Gäste
- Check-in Datum
- Check-out Datum
- Hinweis-Badge „⚠️ Eingecheckt" falls `status === 'checked_in'`

Reinigungskarte (interaktiv):
- Reinigungstermin (Datum + Zeit) – Klick öffnet vorhandenen Datum/Zeit-Dialog
- Status-Select (Geplant / In Bearbeitung / Abgeschlossen / Verzögert / Storniert)
- Zahlungsstatus-Badge (paid / pending / unpaid) – nur Anzeige
- Zugewiesene Putzkraft (Select)
- Optional: Notizen (kompakt, einklappbar via „Bearbeiten")
- Button „❗ Bevor du gehst!" – öffnet `BeforeYouGoChecklist`

## Technische Umsetzung

Neue Komponenten in `src/components/amela/`:
1. `AmelaBookingInfoCard.tsx` – reine Anzeige der Buchungsdaten (props: `booking`).
2. `AmelaCleaningCard.tsx` – interaktive Reinigungskarte (props: `task`, `booking?`, `staff`, Handler `onStatusUpdate`, `onStaffUpdate`, `onDateTimeUpdate`, `onNotesUpdate`). Enthält Datum-Dialog (controlled), Status-Select, Zahlungs-Badge, Checklist-Button.
3. `AmelaEntryRow.tsx` – Wrapper, rendert pro Eintrag das Karten-Paar im responsiven Grid (`grid grid-cols-1 md:grid-cols-2 gap-3`). Bei Standalone nur die Reinigungskarte (col-span-2 oder zentriert).

Änderungen in `src/pages/CleaningPortal.tsx`:
- Import von `ConfigurableBookingCard` / `StandaloneCleaningCard` entfernen, stattdessen `AmelaEntryRow` verwenden.
- Iteration über `currentFilteredEntries`: für `type === 'booking'` pro `service_tasks[]` eine Row rendern (Buchung wiederholt sich bei mehreren Reinigungen, das ist gewollt für die flache Darstellung). Für `type === 'standalone'` eine Row mit nur Reinigungskarte.
- Bestehende Handler (`handleStatusUpdate`, `handleStaffUpdate`, `handleDateTimeUpdateFromCard`, `handleTaskNotesUpdate`, `handleStandaloneNotesUpdate`) werden 1:1 weitergereicht – keine Änderung an Hooks/DB.
- `BookingCardSettings` / `useBookingCardConfig` bleibt erhalten, die wichtigsten Toggles (showHouseAddress, showGuestCount, showTaskDateTime, showTaskNotes, showEditableNotes) werden in den neuen Komponenten respektiert. Nicht mehr genutzte Toggles bleiben unverändert in der Config (kein DB-Schema-Eingriff).

Alte Komponenten `ConfigurableBookingCard.tsx` und `StandaloneCleaningCard.tsx` werden vorerst **nicht gelöscht**, nur nicht mehr importiert – falls Rollback nötig.

## Styling

- Karten: `Card` aus shadcn, `rounded-lg border bg-card shadow-sm`, kein dicker farbiger Border-Left mehr (sauberer, wie Screenshot).
- Buchungskarte: dezente Header-Zeile (Icon `Home`, Hausname), Body als Liste mit Icons.
- Reinigungskarte: Header mit Icon `Sparkles`/🧹 + „Reinigungsauftrag", Body strukturiert, primärer „Bevor du gehst"-Button am Fuß.
- Hover/Tap: `hover:shadow-md transition-shadow cursor-default` für Karten, `cursor-pointer` nur auf klickbaren Bereichen (Termin, Status, Button).
- Tokens: alle Farben über `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary` etc. – keine direkten Tailwind-Farben.
- Touch-Targets ≥ 44px (bestehende Vorgabe).

## Nicht enthalten / nicht geändert

- Keine Änderung an `useBookings`, DB-Schema, Realtime, Filter-Logik, Notifications, Auth.
- Boris-Portal bleibt unangetastet.
- Wäscheportal wird nicht angefasst – nur als visuelles Vorbild genutzt.

## Verifikation

- Mobile (390px): Karten stapeln, keine horizontalen Scrollbars, alle Touch-Targets ≥ 44px.
- Buchung mit 2 Reinigungen → 2 Karten-Paare sichtbar.
- Standalone-Reinigung → nur Reinigungskarte.
- Status ändern, Termin ändern, Putzkraft ändern, Checklist öffnen funktioniert wie zuvor.
- Filter „Abgeschlossen" zeigt neueste Reinigung zuerst (bereits gefixt).
