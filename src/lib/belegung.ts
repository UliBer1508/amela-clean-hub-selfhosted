import type { CSSProperties } from 'react';

/**
 * Belegungslogik für das Raster — EINE Quelle für alle Portale und die
 * Hausverwaltung.
 *
 * Herkunft: wörtlich aus `src/components/Calendar/HouseStackedCalendar.tsx`
 * der Hausverwaltung (getHouseColors aus `src/lib/utils.ts`, getDayInfo und
 * getCellStyle aus der Komponente). Bewusst als eigene Datei, damit
 * "Wechseltag", "Anreise" und die Hausfarben in allen vier Systemen dasselbe
 * bedeuten. Wer hier etwas ändert, ändert es überall — das ist der Zweck.
 *
 * NICHT ändern, ohne die Hausverwaltung mitzuziehen.
 */

export interface HouseColors {
  base: string;
  border: string;
  text: string;
}

/**
 * Hausfarbe über Namensbestandteile, nicht über den exakten Namen.
 * Grund (Session 2026-07-27, Abschnitt A): Eine Tabelle mit dem exakten
 * Hausnamen als Schlüssel traf "Venediger Chalet" nie und fiel monatelang
 * still auf Grau zurück. Kein Fehler, keine Warnung — nur eine falsche Farbe.
 */
export const getHouseColors = (houseName: string): HouseColors => {
  const name = (houseName || '').toLowerCase();
  if (name.includes('wald')) {
    return { base: '#22d3ee', border: '#0891b2', text: '#164e63' };
  }
  if (name.includes('venediger') || name.includes('siedlung')) {
    return { base: '#fbbf24', border: '#d97706', text: '#78350f' };
  }
  return { base: '#9ca3af', border: '#6b7280', text: '#111827' };
};

/**
 * Lokales Datum aus einem ISO-String, Zeitzone bewusst ignoriert.
 * `new Date('2026-08-16')` wird als UTC gelesen und kann in unserer Zeitzone
 * auf den 15. rutschen — dann steht die Anreise im Raster einen Tag zu früh.
 */
export const parseLocalDate = (isoString: string): Date => {
  const datePart = isoString.substring(0, 10);
  return new Date(datePart + 'T00:00:00');
};

/** yyyy-MM-dd ohne Zeitzonen-Umweg (toISOString wäre UTC). */
export const toDateKey = (date: Date): string => {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
};

export interface RasterBuchung {
  id: string;
  house_id: string;
  check_in: string;
  check_out: string;
  gastName?: string;
  status?: string;
}

export type DayInfo =
  | { status: 'free' }
  | { status: 'occupied'; occupying: RasterBuchung }
  | { status: 'checkin'; arriving: RasterBuchung }
  | { status: 'checkout'; departing: RasterBuchung }
  | { status: 'changeover'; arriving: RasterBuchung; departing: RasterBuchung };

/**
 * Was passiert an diesem Tag in diesem Haus?
 * Reihenfolge ist wichtig: Wechseltag wird VOR Anreise/Abreise geprüft,
 * sonst verschwindet die abreisende Buchung aus der Anzeige.
 */
export const getDayInfo = (
  buchungen: RasterBuchung[],
  houseId: string,
  date: Date
): DayInfo => {
  const key = toDateKey(date);
  const eigene = buchungen.filter(
    b => b.house_id === houseId && b.status !== 'cancelled'
  );
  const arriving = eigene.find(b => b.check_in.substring(0, 10) === key);
  const departing = eigene.find(b => b.check_out.substring(0, 10) === key);
  if (arriving && departing) return { status: 'changeover', arriving, departing };
  if (arriving) return { status: 'checkin', arriving };
  if (departing) return { status: 'checkout', departing };
  const occupying = eigene.find(b => {
    const ci = b.check_in.substring(0, 10);
    const co = b.check_out.substring(0, 10);
    return key > ci && key < co;
  });
  if (occupying) return { status: 'occupied', occupying };
  return { status: 'free' };
};

/**
 * Zellfarbe. Vollton = belegt, diagonal geteilt = An-/Abreise bzw. Wechseltag.
 * Muster von der Website (AvailabilityCalendar) übernommen, damit Gast, Uli
 * und Dienstleister dasselbe Bild sehen.
 */
export const getCellStyle = (
  status: DayInfo['status'],
  base: string,
  border: string
): CSSProperties => {
  const geteilt = (von: string, bis: string) =>
    `linear-gradient(135deg, ${von} 0%, ${von} 42%, #9ca3af 42%, #9ca3af 58%, ${bis} 58%, ${bis} 100%)`;

  switch (status) {
    case 'occupied':
      return { background: base, border: `1px solid ${border}` };
    case 'checkin':
      return { background: geteilt('#ffffff', base), border: `1px solid ${border}` };
    case 'checkout':
      return { background: geteilt(base, '#ffffff'), border: `1px solid ${border}` };
    case 'changeover':
      return { background: geteilt(base, base), border: `1px solid ${border}` };
    default:
      return {};
  }
};
