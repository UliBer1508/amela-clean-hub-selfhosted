import { useMemo } from 'react';
import { format, startOfWeek, addDays, isToday, isSameMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  getHouseColors,
  getDayInfo,
  getCellStyle,
  toDateKey,
  type RasterBuchung,
} from '@/lib/belegung';

/**
 * Belegungsraster — Zeile = Haus, Spalte = Tag.
 *
 * Zweck im Portal: Der Dienstleister sieht nicht nur WANN er kommen soll,
 * sondern WARUM. Ein diagonal geteiltes Feld heißt Gästewechsel (abreisen und
 * anreisen am selben Tag) — dann ist der Termin nicht verschiebbar. Steht nach
 * der Abreise ein weißes Feld, ist Luft.
 *
 * Aufteilung eigene / fremde Aufgabe (überarbeitet 21.08.2026):
 * - `meineAufgaben` bekommen ein Symbol OBEN RECHTS, Rand durchgezogen
 * - `infoAufgaben` bekommen ein Symbol UNTEN RECHTS, Rand gestrichelt
 * Beide stehen an IHREM EIGENEN Tag: der Wäschekorb am Liefertag, der Besen
 * am Reinigungstag.
 *
 * Vorher war die fremde Aufgabe ein schmaler grauer Streifen, der bevorzugt
 * am Tag der EIGENEN Aufgabe gezeichnet wurde (über die gemeinsame
 * booking_id). Da Wäsche und Reinigung an verschiedenen Tagen stattfinden,
 * erschien derselbe Termin zweimal — einmal am falschen Tag — und der
 * Streifen sagte nicht, wofür er stand.
 *
 * Zwei Kreise à 20 px passen übereinander in die 44 px Zellenhöhe. Auf dem
 * Handy entfällt bei eigener Aufgabe der Gastname; er steht in der
 * Aufgabenliste und im Tooltip.
 *
 * Die Komponente ist portalneutral: sie kennt weder Provider noch Rolle.
 * Wer welche Aufgaben sieht, entscheidet die aufrufende Seite.
 */

export interface RasterHaus {
  id: string;
  name: string;
}

/**
 * Beschriftungen. Vorgabe ist Deutsch — die Reinigungsportale (Amela, Boris)
 * uebergeben nichts. Das Teuni-Portal ist dreisprachig (de/en/nl) und reicht
 * uebersetzte Texte durch. So bleibt DIESE DATEI in allen Portalen identisch.
 */
export interface RasterTexte {
  nichtsZuTun: string;
  belegt: string;
  anreise: string;
  abreise: string;
  wechseltag: string;
  frei: string;
  erledigt: string;
  offen: string;
  fehltTerminSteht: string;
  beideHaeuser: string;
  vorhanden: string;
  fehlt: string;
  pruefen: string;
}

export const RASTER_TEXTE_DE: RasterTexte = {
  nichtsZuTun: 'Diese Woche nichts zu tun.',
  belegt: 'belegt',
  anreise: 'Anreise',
  abreise: 'Abreise',
  wechseltag: 'Wechseltag',
  frei: 'frei',
  erledigt: 'erledigt',
  offen: 'offen',
  fehltTerminSteht: 'fehlt, Termin steht an',
  beideHaeuser: 'beide Häuser am selben Tag',
  vorhanden: 'da',
  fehlt: 'fehlt',
  pruefen: 'prüfen',
};

export interface RasterAufgabe {
  id: string;
  house_id: string;
  /** yyyy-MM-dd — der Tag, an dem die Aufgabe ansteht */
  datum: string;
  uhrzeit?: string | null;
  status?: string | null;
  /** Verknüpfung zur Buchung; über sie wird Reinigung mit Wäsche gepaart */
  booking_id?: string | null;
  /** Zeile in der Aufgabenliste, z. B. "Wald Chalet reinigen" */
  titel: string;
  /** Zweite Zeile, z. B. "Wechsel: Henning ab, Hofmann an" */
  hinweis?: string;
}

interface BelegungsrasterProps {
  haeuser: RasterHaus[];
  buchungen: RasterBuchung[];
  meineAufgaben: RasterAufgabe[];
  infoAufgaben?: RasterAufgabe[];
  /** Erster Tag; es wird auf den Wochenanfang (Montag) gerundet */
  startDatum: Date;
  /** Wie viele Wochen untereinander gezeigt werden */
  wochen?: number;
  /**
   * Aufgabenliste unter jeder Woche anzeigen.
   * `false` in der Monatsansicht: dort geht es um den Überblick, und fünf bis
   * sechs Wochenblöcke MIT Auftragszeilen wären auf dem Handy nur noch Scrollen.
   */
  zeigeAufgabenliste?: boolean;
  /**
   * Wenn gesetzt, werden Tage ausserhalb DIESES Monats blass dargestellt.
   * Das Raster zeigt immer volle Wochen (Mo–So), im Monatsmodus ragen also
   * Nachbartage herein — ohne Abblendung verliert man die Monatsgrenze.
   */
  monatFokus?: Date;
  /** Symbol der eigenen Aufgabe */
  meinSymbol?: string;
  /** Symbol der fremden Aufgabe — steht an IHREM Tag, nicht am eigenen. */
  infoSymbol?: string;
  /** Beschriftung in der Legende, z. B. "Reinigung" / "Wäsche" */
  meinName?: string;
  infoName?: string;
  texte?: RasterTexte;
  onAufgabeClick?: (aufgabeId: string) => void;
}

/** Status, die als erledigt gelten — bei Reinigung und Wäsche gleichermaßen. */
const ERLEDIGT = new Set(['completed', 'delivered', 'erledigt', 'geliefert']);
const istErledigt = (status?: string | null) =>
  ERLEDIGT.has(String(status || '').toLowerCase());

const Belegungsraster = ({
  haeuser,
  buchungen,
  meineAufgaben,
  infoAufgaben = [],
  startDatum,
  wochen = 4,
  zeigeAufgabenliste = true,
  monatFokus,
  meinSymbol = '🧹',
  infoSymbol = '🧺',
  meinName = 'Reinigung',
  infoName = 'Wäsche',
  texte = RASTER_TEXTE_DE,
  onAufgabeClick,
}: BelegungsrasterProps) => {
  const wochenStarts = useMemo(() => {
    const erste = startOfWeek(startDatum, { weekStartsOn: 1 });
    return Array.from({ length: wochen }, (_, i) => addDays(erste, i * 7));
  }, [startDatum, wochen]);

  /** Schlüssel `house_id|datum` → Aufgabe. Ein Tag, ein Haus, eine Aufgabe. */
  const meineNachTag = useMemo(() => {
    const m = new Map<string, RasterAufgabe>();
    meineAufgaben.forEach(a => m.set(`${a.house_id}|${a.datum}`, a));
    return m;
  }, [meineAufgaben]);

  /** Fremde Aufgabe zur selben Buchung — beantwortet "ist die Wäsche da?". */
  const infoNachBuchung = useMemo(() => {
    const m = new Map<string, RasterAufgabe>();
    infoAufgaben.forEach(a => {
      if (a.booking_id) m.set(a.booking_id, a);
    });
    return m;
  }, [infoAufgaben]);

  const infoNachTag = useMemo(() => {
    const m = new Map<string, RasterAufgabe>();
    infoAufgaben.forEach(a => m.set(`${a.house_id}|${a.datum}`, a));
    return m;
  }, [infoAufgaben]);

  /**
   * Warnung: eigene Aufgabe steht noch aus UND die zugehörige fremde Aufgabe
   * ist nicht erledigt. Genau die Lage, wegen der Max heute Erinnerungen
   * schickt — hier ist sie dauerhaft sichtbar statt nur in einer Nachricht.
   */
  const istGefaehrdet = (a: RasterAufgabe): boolean => {
    if (istErledigt(a.status)) return false;
    if (!a.booking_id) return false;
    const gegenstueck = infoNachBuchung.get(a.booking_id);
    return !!gegenstueck && !istErledigt(gegenstueck.status);
  };

  /** Beide Häuser am selben Tag — offener Punkt aus Session 2026-07-27. */
  const kollisionsTage = useMemo(() => {
    const proTag = new Map<string, Set<string>>();
    meineAufgaben.forEach(a => {
      if (!proTag.has(a.datum)) proTag.set(a.datum, new Set());
      proTag.get(a.datum)!.add(a.house_id);
    });
    const out = new Set<string>();
    proTag.forEach((haeuserAmTag, datum) => {
      if (haeuserAmTag.size > 1) out.add(datum);
    });
    return out;
  }, [meineAufgaben]);

  const renderWoche = (wochenStart: Date) => {
    const tage = Array.from({ length: 7 }, (_, i) => addDays(wochenStart, i));
    const tagesKeys = tage.map(toDateKey);

    const aufgabenDerWoche = meineAufgaben
      .filter(a => tagesKeys.includes(a.datum))
      .sort((a, b) => (a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0));

    return (
      <div key={wochenStart.toISOString()} className="mb-5 last:mb-0">
        {!monatFokus && (
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            {format(wochenStart, 'd. MMM', { locale: de })} – {format(addDays(wochenStart, 6), 'd. MMM yyyy', { locale: de })}
          </div>
        )}

        {/* Tageskopf */}
        <div className="grid gap-1 mb-1 grid-cols-[repeat(7,minmax(0,1fr))] sm:grid-cols-[96px_repeat(7,minmax(0,1fr))]">
          <div className="hidden sm:block" />
          {tage.map(tag => (
            <div
              key={tag.toISOString()}
              className={cn(
                'text-center leading-tight',
                monatFokus && !isSameMonth(tag, monatFokus) && 'opacity-40'
              )}
            >
              <div className={cn('text-xs font-semibold', isToday(tag) ? 'text-primary' : 'text-foreground')}>
                {format(tag, 'EEEEEE', { locale: de })}
              </div>
              <div className={cn('text-xs tabular-nums', isToday(tag) ? 'text-primary' : 'text-muted-foreground')}>
                {format(tag, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Eine Zeile je Haus */}
        {haeuser.map(haus => {
          const hc = getHouseColors(haus.name);
          return (
            <div key={haus.id} className="mb-1">
              {/* Handy: Hausname über der Zeile, damit die sieben Tage die
                  volle Breite behalten (CODING-GUIDE B4, kein Querscrollen). */}
              <div className="sm:hidden flex items-center gap-1.5 mb-0.5 text-xs font-semibold">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                  style={{ background: hc.base }}
                />
                <span className="truncate">{haus.name.replace(' Chalet', '')}</span>
              </div>

              <div className="grid gap-1 items-center grid-cols-[repeat(7,minmax(0,1fr))] sm:grid-cols-[96px_repeat(7,minmax(0,1fr))]">
                <div className="hidden sm:flex text-right pr-2 text-sm font-semibold truncate items-center justify-end gap-1.5">
                  <span className="truncate">{haus.name.replace(' Chalet', '')}</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                    style={{ background: hc.base }}
                  />
                </div>

                {tage.map(tag => {
                  const key = toDateKey(tag);
                  const info = getDayInfo(buchungen, haus.id, tag);
                  const stil = getCellStyle(info.status, hc.base, hc.border);
                  const meine = meineNachTag.get(`${haus.id}|${key}`);
                  // Die fremde Aufgabe steht an IHREM Tag.
                  //
                  // Bis 21.08.2026 wurde stattdessen ein grauer Streifen
                  // gezeichnet, und zwar bevorzugt am Tag der EIGENEN Aufgabe
                  // (`fremdeZurAufgabe` über die gemeinsame booking_id). Da
                  // Wäsche und Reinigung an verschiedenen Tagen stattfinden,
                  // erschien derselbe Termin zweimal — einmal am falschen Tag,
                  // beide Male ohne erkennbare Bedeutung.
                  const fremdeAmTag = infoNachTag.get(`${haus.id}|${key}`);
                  const gefaehrdet = meine ? istGefaehrdet(meine) : false;

                  const beschriftung =
                    info.status === 'occupied' ? info.occupying.gastName
                    : info.status === 'changeover' ? info.arriving.gastName
                    : info.status === 'checkin' ? info.arriving.gastName
                    : undefined;

                  const titel =
                    info.status === 'changeover'
                      ? `${texte.wechseltag} — ${info.departing.gastName ?? ''} / ${info.arriving.gastName ?? ''}`
                      : info.status === 'checkin' ? `${texte.anreise} ${info.arriving.gastName ?? ''}`
                      : info.status === 'checkout' ? `${texte.abreise} ${info.departing.gastName ?? ''}`
                      : info.status === 'occupied' ? `${texte.belegt} — ${info.occupying.gastName ?? ''}`
                      : texte.frei;

                  return (
                    <div
                      key={key}
                      title={meine ? `${meine.titel} — ${titel}` : titel}
                      onClick={meine && onAufgabeClick ? () => onAufgabeClick(meine.id) : undefined}
                      className={cn(
                        'relative h-11 rounded overflow-hidden',
                        monatFokus && !isSameMonth(tag, monatFokus) && 'opacity-40',
                        info.status === 'free' && 'border border-border',
                        meine && 'cursor-pointer active:scale-[0.97] transition-transform',
                        meine && !gefaehrdet && 'ring-2 ring-inset ring-primary',
                        gefaehrdet && 'ring-2 ring-inset ring-destructive'
                      )}
                      style={stil}
                    >
                      {/* Gastname.
                          Auf dem Handy ist eine Zelle rund 57 px breit. Symbol UND
                          Name passen dort nicht nebeneinander: das Symbol braucht
                          24 px, der Rest reicht fuer zwei Buchstaben ("Ch..."). In
                          Zellen MIT eigener Aufgabe entfaellt der Name deshalb auf
                          schmalen Schirmen — Diagonale plus Symbol sagt bereits
                          "Wechseltag, hier arbeite ich". Der Name steht in der
                          Aufgabenliste, im Tooltip und im Detailfenster.
                          Ab `sm` (640 px) ist Platz fuer beides. */}
                      {beschriftung && (
                        <span
                          className={cn(
                            'absolute inset-0 items-center pl-1',
                            meine ? 'hidden sm:flex sm:pr-7'
                              : fremdeAmTag ? 'flex pr-7'
                              : 'flex pr-1'
                          )}
                        >
                          <span
                            className="w-full text-[10px] font-semibold text-center truncate"
                            style={{ color: hc.text }}
                          >
                            {beschriftung.split(' ')[0]}
                          </span>
                        </span>
                      )}

                      {meine && (
                        <span
                          className={cn(
                            'absolute top-0.5 right-0.5 w-5 h-5 rounded-full border-2 bg-card',
                            'flex items-center justify-center text-[12px] leading-none shadow-sm z-10',
                            istErledigt(meine.status) ? 'border-green-600' : gefaehrdet ? 'border-destructive' : 'border-primary'
                          )}
                        >
                          {meinSymbol}
                        </span>
                      )}

                      {/* Fremde Aufgabe: gestrichelter Rand, damit ohne Legende
                          erkennbar ist, dass es nicht die eigene ist. Unten
                          rechts, das eigene Symbol sitzt oben rechts — zwei
                          Kreise à 20 px passen in die 44 px Zellenhöhe. */}
                      {fremdeAmTag && (
                        <span
                          title={fremdeAmTag.titel}
                          className={cn(
                            'absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full border-2 border-dashed bg-card',
                            'flex items-center justify-center text-[12px] leading-none shadow-sm z-10',
                            istErledigt(fremdeAmTag.status) ? 'border-green-600' : 'border-muted-foreground/60'
                          )}
                        >
                          {infoSymbol}
                        </span>
                      )}

                      {kollisionsTage.has(key) && meine && (
                        <span className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 z-10" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Aufgaben im Klartext — was im 44-px-Feld keinen Platz hat */}
        {zeigeAufgabenliste && (
        <div className="mt-2 space-y-1.5">
          {aufgabenDerWoche.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
              {texte.nichtsZuTun}
            </div>
          ) : (
            aufgabenDerWoche.map(a => {
              const haus = haeuser.find(h => h.id === a.house_id);
              const hc = getHouseColors(haus?.name || '');
              const gegenstueck = a.booking_id ? infoNachBuchung.get(a.booking_id) : undefined;
              const gefaehrdet = istGefaehrdet(a);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={onAufgabeClick ? () => onAufgabeClick(a.id) : undefined}
                  style={{ borderLeftColor: hc.base, borderLeftWidth: 4 }}
                  className="w-full flex items-start gap-2.5 px-3 py-2 bg-card border border-border/60 rounded-r-lg text-left active:scale-[0.99] transition-transform min-h-[44px]"
                >
                  <span className="text-xs font-bold tabular-nums w-14 shrink-0 pt-0.5">
                    {format(new Date(a.datum + 'T00:00:00'), 'EEE d.', { locale: de })}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">
                      {a.titel}
                      {a.uhrzeit ? ` · ${a.uhrzeit.slice(0, 5)}` : ''}
                    </span>
                    {a.hinweis && (
                      <span className="block text-xs text-muted-foreground">{a.hinweis}</span>
                    )}
                  </span>
                  {gegenstueck && (
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5',
                        istErledigt(gegenstueck.status)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-destructive/10 text-destructive'
                      )}
                    >
                      {istErledigt(gegenstueck.status) ? `${infoName} ${texte.vorhanden}` : `${infoName} ${texte.fehlt}`}
                    </span>
                  )}
                  {!gegenstueck && gefaehrdet && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 bg-destructive/10 text-destructive">
                      {texte.pruefen}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {wochenStarts.map(renderWoche)}

      {/* Legende — ohne sie ist das Diagonalmuster nicht selbsterklärend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 p-3 border border-border rounded-lg bg-card text-xs mt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-3.5 rounded-sm border" style={{ background: '#fbbf24', borderColor: '#d97706' }} />
          {texte.belegt}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-6 h-3.5 rounded-sm border"
            style={{
              background: 'linear-gradient(135deg,#fbbf24 0%,#fbbf24 42%,#9ca3af 42%,#9ca3af 58%,#fbbf24 58%,#fbbf24 100%)',
              borderColor: '#d97706',
            }}
          />
          {texte.wechseltag}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-6 h-3.5 rounded-sm border"
            style={{
              background: 'linear-gradient(135deg,#ffffff 0%,#ffffff 42%,#9ca3af 42%,#9ca3af 58%,#fbbf24 58%,#fbbf24 100%)',
              borderColor: '#d97706',
            }}
          />
          {texte.anreise}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-6 h-3.5 rounded-sm border"
            style={{
              background: 'linear-gradient(135deg,#fbbf24 0%,#fbbf24 42%,#9ca3af 42%,#9ca3af 58%,#ffffff 58%,#ffffff 100%)',
              borderColor: '#d97706',
            }}
          />
          {texte.abreise}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-6 h-3.5 rounded-sm border border-border bg-card" />
          {texte.frei}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full border-2 border-primary bg-card flex items-center justify-center text-[12px] leading-none">
            {meinSymbol}
          </span>
          {meinName}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full border-2 border-green-600 bg-card flex items-center justify-center text-[12px] leading-none">
            {meinSymbol}
          </span>
          {meinName} {texte.erledigt}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full border-2 border-dashed border-muted-foreground/60 bg-card flex items-center justify-center text-[12px] leading-none">
            {infoSymbol}
          </span>
          {infoName}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full border-2 border-dashed border-green-600 bg-card flex items-center justify-center text-[12px] leading-none">
            {infoSymbol}
          </span>
          {infoName} {texte.erledigt}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-sm ring-2 ring-inset ring-destructive bg-card" />
          {infoName} {texte.fehltTerminSteht}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          {texte.beideHaeuser}
        </span>
      </div>
    </div>
  );
};

export default Belegungsraster;
