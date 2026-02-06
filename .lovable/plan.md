
## Plan: "Auch eingecheckt" Checkbox standardmäßig aktiviert

### Problem
Aktuell ist die Checkbox "⚠️ Auch eingecheckt" standardmäßig **deaktiviert** (`false`). Der Benutzer möchte, dass diese Checkbox beim Laden des Portals bereits **aktiviert** ist.

### Lösung
Der initiale State in `src/pages/CleaningPortal.tsx` wird von `false` zu `true` geändert.

### Änderung

**Datei:** `src/pages/CleaningPortal.tsx` (Zeile 96)

**Vorher:**
```tsx
const [showCheckedIn, setShowCheckedIn] = useState(false);
```

**Nachher:**
```tsx
const [showCheckedIn, setShowCheckedIn] = useState(true);
```

### Ergebnis
Beim Öffnen des Reinigungsportals wird die "⚠️ Auch eingecheckt" Checkbox sofort aktiviert und es werden eingecheckte Buchungen bereits angezeigt, ohne dass die Putzfrau manuell die Checkbox klicken muss.
