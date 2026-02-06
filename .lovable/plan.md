

## Plan: Checkbox "Auch eingecheckte Gäste" rechts neben der Suche

### Layout-Änderung

Die Checkbox wird **rechts neben dem Suchfeld** in derselben Zeile platziert:

```
+------------------------------------------------------------------------+
| 🔍 Suche                                                               |
+------------------------------------------------------------------------+
| [🔍 Nach Gast, Haus oder Adresse suchen...     ]   [✓] Auch eingecheckt |
+------------------------------------------------------------------------+
| 🔧 Filter                                                              |
+------------------------------------------------------------------------+
```

### Änderungen

**Datei:** `src/pages/CleaningPortal.tsx`

#### 1. Imports hinzufügen (am Anfang der Datei)
```tsx
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
```

#### 2. State hinzufügen (bei den anderen States, ca. Zeile 91)
```tsx
const [showCheckedIn, setShowCheckedIn] = useState(false);
```

#### 3. Layout ändern (Zeile 599-607)

**Vorher:**
```tsx
<div className="relative">
  <Input
    placeholder="Nach Gast, Haus oder Adresse suchen..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="pl-10 min-h-[44px]"
  />
  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
</div>
```

**Nachher:**
```tsx
<div className="flex flex-col sm:flex-row gap-3 sm:items-center">
  <div className="relative flex-1">
    <Input
      placeholder="Nach Gast, Haus oder Adresse suchen..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-10 min-h-[44px]"
    />
    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
  </div>
  
  <div className="flex items-center space-x-2 shrink-0">
    <Checkbox 
      id="showCheckedIn"
      checked={showCheckedIn}
      onCheckedChange={(checked) => setShowCheckedIn(checked === true)}
    />
    <Label htmlFor="showCheckedIn" className="text-xs md:text-sm cursor-pointer whitespace-nowrap">
      ⚠️ Auch eingecheckt
    </Label>
  </div>
</div>
```

#### 4. Filterlogik erweitern

**Datei:** `src/hooks/useBookings.ts` - `filteredEntries` Funktion erweitern um `includeCheckedIn` Parameter

#### 5. Filter-Aufruf aktualisieren

**Datei:** `src/pages/CleaningPortal.tsx` - `showCheckedIn` an `filteredEntries` übergeben

### Responsives Verhalten
- **Desktop (sm+):** Suchfeld und Checkbox nebeneinander in einer Zeile
- **Mobil:** Suchfeld oben, Checkbox darunter (gestapelt)

### Ergebnis
Die Putzfrau sieht die Checkbox direkt neben dem Suchfeld und kann mit einem Klick auch Buchungen anzeigen, bei denen der Gast bereits eingecheckt ist.

