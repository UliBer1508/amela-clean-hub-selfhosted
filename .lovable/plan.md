

## Plan: Buchungsstatus deutlich in der Karte anzeigen

### Aktueller Zustand
Der Buchungsstatus wird in Zeile 174-180 als kleines Badge angezeigt:
- `confirmed` → "Bestätigt"
- Andere Status werden direkt als Text angezeigt

Das ist zu unauffällig, besonders für `checked_in`.

### Lösung

#### 1. Auffälliges Warnbanner für eingecheckte Gäste

Nach dem Haus-Header (Zeile 118) wird ein **prominentes Warnbanner** eingefügt:

```
+------------------------------------------------------------+
| 🏠 Ferienwohnung Alm                          ID: a1b2c3d4 |
+------------------------------------------------------------+
| ⚠️ GAST IST EINGECHECKT - Aktuell vor Ort!                 |  ← NEU
+------------------------------------------------------------+
| 👤 Gast: Oliver Grandt                                     |
```

**Code (nach Zeile 118):**
```tsx
{/* Warnung für eingecheckte Gäste */}
{booking.status === 'checked_in' && (
  <div className="bg-orange-100 dark:bg-orange-900/40 border-b border-orange-200 dark:border-orange-800 p-2 md:p-3">
    <div className="flex items-center space-x-2 text-orange-800 dark:text-orange-200">
      <span className="text-lg">⚠️</span>
      <span className="font-semibold text-xs md:text-sm">GAST IST EINGECHECKT - Aktuell vor Ort!</span>
    </div>
  </div>
)}
```

#### 2. Verbesserte Status-Badge-Anzeige

Die bestehende Badge-Anzeige (Zeilen 174-180) wird erweitert mit:
- Bessere Farbcodierung
- Emojis für bessere Erkennbarkeit
- Pulsierender Effekt für eingecheckte Gäste

**Vorher:**
```tsx
{config.showBookingStatus && (
  <div className="flex items-center space-x-2">
    <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
      {booking.status === 'confirmed' ? 'Bestätigt' : booking.status}
    </Badge>
  </div>
)}
```

**Nachher:**
```tsx
{config.showBookingStatus && (
  <div className="flex items-center space-x-2">
    <Badge 
      variant={booking.status === 'checked_in' ? 'destructive' : 
               booking.status === 'confirmed' ? 'default' : 'secondary'}
      className={booking.status === 'checked_in' ? 'animate-pulse' : ''}
    >
      {booking.status === 'confirmed' && '✅ Bestätigt'}
      {booking.status === 'checked_in' && '⚠️ Eingecheckt'}
      {booking.status === 'checked_out' && '✔️ Ausgecheckt'}
      {booking.status === 'cancelled' && '❌ Storniert'}
      {!['confirmed', 'checked_in', 'checked_out', 'cancelled'].includes(booking.status) && booking.status}
    </Badge>
  </div>
)}
```

### Änderungen

| Datei | Änderung |
|-------|----------|
| `src/components/ConfigurableBookingCard.tsx` | Warnbanner + verbesserte Badge |

### Visuelles Ergebnis

**Für eingecheckte Buchungen:**
```
+------------------------------------------------------------+
| 🏠 Ferienwohnung Sonnberg                     ID: 12345678 |
+------------------------------------------------------------+
| ⚠️ GAST IST EINGECHECKT - Aktuell vor Ort!                 |
+------------------------------------------------------------+
| 👤 Gast: Oliver Grandt                                     |
| 👥 Gäste: 4 Personen                                       |
| 📅 Check-in: 04.02.2026                                    |
| [⚠️ Eingecheckt] ← pulsierend                              |
+------------------------------------------------------------+
```

**Für bestätigte Buchungen:**
```
+------------------------------------------------------------+
| 🏠 Ferienwohnung Alm                          ID: 87654321 |
+------------------------------------------------------------+
| 👤 Gast: Maria Müller                                      |
| 👥 Gäste: 2 Personen                                       |
| [✅ Bestätigt]                                             |
+------------------------------------------------------------+
```

### Ergebnis
Die Putzfrau erkennt sofort:
1. **Orange Warnbanner** oben in der Karte = Gast ist vor Ort
2. **Pulsierendes rotes Badge** = Status "Eingecheckt"
3. Andere Status sind mit Emoji und Farbe klar unterscheidbar

