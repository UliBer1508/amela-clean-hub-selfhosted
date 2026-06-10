## Status-Badge im Karten-Header entfernen

Der farbige "Geplant"-Badge rechts neben dem Titel "Reinigungsauftrag" zeigt dieselbe Information wie die "STATUS"-Kachel darunter. Doppelung entfernen.

### Änderung in `src/components/amela/AmelaCleaningCard.tsx`

- Den `<Badge>` mit `STATUS_BADGE_CLASS[task.status]` (im Header rechts) entfernen.
- `STATUS_BADGE_CLASS` und ggf. `STATUS_LABELS` bleiben, werden aber im Header nicht mehr verwendet.
- Der "Unbezahlt"-Payment-Badge und der Chevron bleiben unverändert.
- Keine Logik geändert.
