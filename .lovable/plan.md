## Ziel

Konsistente Icons + 100% touchfähiges Mobile-Layout + vollwertige PWA über das gesamte Cleaning Portal.

## Aktuelle Probleme

**1. Icon-Chaos** – Emojis und Lucide-Icons gemischt:
- Status-Labels nutzen Emojis (📅 Geplant, ⏳ In Bearbeitung, ✅ Abgeschlossen, ❌ Storniert, 💸 Unbezahlt, ❗ Checkliste)
- Navigation nutzt Emojis (🏠 Reinigungen, 📅 Kalender, 🔔 Benachrichtigungen)
- Personen-Infos nutzen Emojis (👤 Gast, 👥 Gäste, 🏠 Haus)
- Andere Stellen nutzen Lucide-Icons (`<Home>`, `<Bell>`, `<User>`, `<Users>`, `<Calendar>`)
- Emojis rendern OS-abhängig unterschiedlich (Android/iOS/Desktop), brechen Design-Konsistenz

**2. Touch-Targets** – uneinheitlich:
- AmelaCleaningCard: meist sauber `min-h-[44px]`, aber `h-8` bei Note-Edit-Buttons (32px, zu klein)
- ConfigurableBookingCard / StandaloneCleaningCard: nicht durchgängig 44px geprüft
- Bottom-Nav Buttons müssen geprüft werden

**3. PWA-Setup** – fast vollständig, aber Lücken:
- `manifest.webmanifest` wird via VitePWA generiert, aber `icon-180x180.png` und `icon-152x152.png` fehlen im `public/` Ordner (in `includeAssets` referenziert)
- `display: standalone`, `theme_color`, `background_color`, `shortcuts` im Manifest prüfen
- Apple-Splash nur für eine Auflösung (1125x2436 = iPhone X)
- Install-Prompt + Offline-Fallback (`Offline.tsx` existiert) validieren

## Lösung

### A. Einheitliches Icon-System (Lucide statt Emoji)

Mapping einführen und überall ersetzen:
| Emoji | Lucide-Icon |
|-------|-------------|
| 🏠 | `Home` |
| 📅 | `Calendar` / `CalendarDays` |
| 🔔 | `Bell` |
| ⏳ | `Clock` / `Hourglass` |
| ✅ | `CheckCircle2` |
| ❌ | `XCircle` |
| 💸 | `CircleDollarSign` / `Wallet` |
| ❗ | `AlertCircle` / `ClipboardCheck` |
| 👤 | `User` |
| 👥 | `Users` |
| 🧺 | `WashingMachine` |

Status-Labels werden zu `{ icon: LucideIcon, label: string }` Objekten, gerendert mit `<Icon className="w-4 h-4 mr-1.5" />`.

Betroffene Dateien:
- `src/pages/CleaningPortal.tsx` (Konstanten + Bottom-Nav)
- `src/pages/Calendar.tsx`
- `src/components/amela/AmelaCleaningCard.tsx`
- `src/components/ConfigurableBookingCard.tsx`
- `src/components/StandaloneCleaningCard.tsx`

### B. Touch-Audit (min. 44×44 px überall)

- Alle `h-8`, `h-9` Buttons → `min-h-[44px]`
- Alle Select-Trigger → `min-h-[44px]`
- Bottom-Nav Items → bereits groß, prüfen
- Card-Tap-Areas → `active:scale-95` für haptisches Feedback ergänzen wo fehlt
- Sicherstellen: kein horizontal-scroll, alle Interaktionen mit Daumen erreichbar

### C. PWA-Vervollständigung

1. Fehlende Icons generieren: `icon-152x152.png`, `icon-180x180.png` (für iOS)
2. `manifest`-Block in `vite.config.ts` prüfen/ergänzen:
   - `name`, `short_name`, `description`
   - `display: "standalone"`, `orientation: "portrait"`
   - `theme_color: "#1e3a8a"`, `background_color`
   - `start_url: "/"`, `scope: "/"`
   - `icons[]` inkl. `maskable` Variante
   - `shortcuts[]` für Reinigungen + Kalender
3. `index.html`: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`
4. Install-Button (`PWAInstallButton`) auch im Bottom-Nav prominenter zeigen
5. Offline-Route testen, Service Worker Update-Flow prüfen

## Vorgehen (in dieser Reihenfolge)

1. **A** umsetzen (Icon-System) – größter visueller Gewinn, betrifft alle Karten
2. **B** umsetzen (Touch-Audit) – schneller Cleanup-Pass
3. **C** umsetzen (PWA) – Icons generieren, Manifest finalisieren, testen

## Ergebnis

- Einheitliches, professionelles Icon-Set über alle Geräte (kein Emoji-Rendering-Unterschied mehr)
- Garantiert daumenfreundlich auf jedem Smartphone (min. 44px überall)
- Installierbar als echte PWA mit korrekten Icons, Splash & Theme-Farbe
