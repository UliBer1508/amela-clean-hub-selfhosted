## Ziel

Klick auf das Glocken-Icon „Hinweise" (Header + Mobile-Bottom-Nav) öffnet ein kleines Popup mit nur den Erinnerungs-Einstellungen. Der Erinnerungs-Banner selbst wird ebenfalls als Popup/Dialog angezeigt statt inline über der Auftragsliste.

## Änderungen

### 1. Neues kleines Erinnerungs-Popup
Neue Datei `src/components/amela/ReminderSettingsPopover.tsx`:
- Kompakter Dialog (shadcn `Dialog`) mit Titel „Erinnerung"
- Switch „Erinnerung aktiv" (an/aus)
- Tage-Auswahl mit `−` / Zahl / `+` (44px Touch-Targets, 0–14)
- Liest/schreibt über bestehenden `useReminderSettings`-Hook

### 2. CleaningPortal.tsx
- Neuer State `showReminderPopup`
- `handleNotificationClick` öffnet jetzt `showReminderPopup` statt des großen `NotificationSettings`-Panels
- Inline-Rendering von `<NotificationSettings />` (Zeile 527–533) wird entfernt
- `<ReminderSettingsPopover open={showReminderPopup} onOpenChange={…} />` einbinden

### 3. Erinnerungs-Banner als Popup
- `CleaningReminderBanner` (aktuell inline oberhalb der Karten) wird zu einem automatisch geöffneten Dialog umgebaut:
  - Wenn `enabled` und `daysUntil <= daysBefore`: Dialog erscheint einmal pro Tag (Dismiss in `sessionStorage` merken, damit er nicht bei jedem Render aufploppt)
  - Inhalt: Icon, „Nächste Reinigung", Datum/Zeit, Objekt, Schließen-Button (≥44px)
- Inline-Banner-Stelle in CleaningPortal entfernt, Komponente weiterhin gemountet (rendert nur den Dialog)

### Unverändert
- Vollständige `NotificationSettings`-Seite bleibt im Code (kann später anderswo verlinkt werden), wird aber nicht mehr über die Glocke geöffnet
- Header- und Bottom-Nav-Layout bleiben gleich, nur der Klick-Handler ändert sein Ziel

## Touch / Mobile
Alle Buttons im Popup ≥44×44px, Dialog mit `max-w-sm`, vollflächig auf Mobile mit ausreichend Padding.
