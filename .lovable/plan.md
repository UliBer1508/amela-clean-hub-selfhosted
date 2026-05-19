## Ziel

Wenn du im Editor "Publish → Update" klickst, soll Amelas installierte PWA die neue Version innerhalb von ~1 Minute automatisch laden — ohne dass sie selbst aktualisieren muss.

## Status Quo

- `vite-plugin-pwa` ist bereits installiert, `registerType: 'autoUpdate'`, `skipWaiting: true`.
- `src/main.tsx` ruft `updateSW(true)` automatisch bei `onNeedRefresh` → die App lädt sich still neu, *sobald* der Service Worker eine neue Version entdeckt.
- **Problem**: Der SW prüft per Default nur beim App-Start. Eine offen liegende App bekommt das Update u. U. erst nach 24 h oder gar nicht.

## Umsetzung

`src/main.tsx`: `registerSW` um Update-Polling erweitern.

```text
onRegisteredSW(_url, registration) {
  setInterval(() => registration.update(), 60_000);   // alle 60s
  on visibilitychange + focus → registration.update();
}
```

- `onNeedRefresh` bleibt bei `updateSW(true)` → still + sofort.
- Fehler werden geschluckt (z. B. offline).

## Resultat

- Tab offen → spätestens nach 60 s neue Version.
- Tab im Hintergrund → beim nächsten Tab-Wechsel sofort Check.
- Iframe-/Preview-Schutz nicht nötig (PWA ist nur in der published Domain aktiv, in der Editor-Preview gibt's keinen SW).

## Betroffene Dateien

- `src/main.tsx`

## Nicht enthalten

- Keine Web Push Notifications für Tasks.
- Kein "Update verfügbar"-Banner (Update läuft still im Hintergrund).
- Manifest/Vite-Config bleiben unverändert.
