## Ziel

Die beiden Status-Badges „PWA Modus" und „Online" oben in der published Version ausblenden.

## Umsetzung

**`src/components/PWAStatusBar.tsx`**
- Komponente so anpassen, dass sie nichts mehr rendert, wenn der User online ist (auch im PWA-Modus): `shouldShow = !isOnline`.
- Im Offline-Fall bleibt nur die rote „Offline"-Badge sichtbar (sinnvoller Warnhinweis).
- Das „PWA Modus"-Badge wird komplett entfernt.
- „Aktualisiere..."-Badge bleibt (nur sichtbar wenn `updateAvailable`), zusammen mit dem Offline-Hinweis.

## Out of scope

- Keine Änderung an `usePWA`, `PWAUpdateNotification`, Calendar/CleaningPortal-Imports.
