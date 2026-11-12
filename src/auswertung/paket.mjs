/**
 * Ergebnispaket für die Abgabe an die Lehrkraft – ohne Server.
 *
 * Ein Paket enthält nur ein frei gewähltes Kürzel, eine optionale Gruppe,
 * Zählerstände (richtig/gesamt je Thema, richtig/falsch je Aufgabentyp),
 * XP und optional die Duellbilanz unter einem Spielernamen.
 * Keine Klarnamenpflicht, keine Geräte- oder Browserkennung.
 *
 * Die Prüfsumme erkennt Übertragungs- und Kopierfehler. Sie ist kein
 * Manipulationsschutz: Ein rein lokales Verfahren kann Ergebnisse nicht
 * fälschungssicher machen.
 */
export const PAKET_VERSION = 1;
export const CODE_PREFIX = 'MT1.';
export const CODE_PREFIX_KOMPRIMIERT = 'MT1z.';
export const MAX_CODE_LAENGE = 6000;

const ID_MUSTER = /^[a-z0-9_-]{2,35}$/i;
const SCHLUESSEL_MUSTER = /^[a-z0-9_-]{2,35}:\d{1,2}$/i;
const MAX_ZAEHLER = 1e6;

/** Kürzel: Buchstaben, Ziffern, Leerzeichen, Punkt, Binde- und Unterstrich. */
export function bereinigeKuerzel(value, max = 20) {
  return String(value ?? '')
    .normalize('NFC')
    .replace(/[^\p{L}\p{N} ._-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function zahl(value) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? Math.max(0, Math.min(MAX_ZAEHLER, n)) : 0;
}

/** Stabile JSON-Darstellung mit sortierten Schlüsseln (für die Prüfsumme). */
export function kanonisch(value) {
  if (Array.isArray(value)) return '[' + value.map(kanonisch).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort()
      .map(key => JSON.stringify(key) + ':' + kanonisch(value[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}

/** FNV-1a (32 Bit) über die UTF-8-Bytes, als 8-stellige Hexzahl. */
export function pruefsumme(text) {
  const bytes = new TextEncoder().encode(String(text));
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function ohnePruefsumme(paket) {
  const {z, ...rest} = paket;
  return rest;
}

function themenStatistik(stats) {
  const result = {};
  for (const [id, value] of Object.entries(stats || {})) {
    if (!ID_MUSTER.test(id) || !value || typeof value !== 'object') continue;
    const total = zahl(value.total);
    const correct = Math.min(total, zahl(value.correct));
    if (total > 0) result[id] = [correct, total];
  }
  return result;
}

function fehlerStatistik(errors) {
  const result = {};
  for (const [key, value] of Object.entries(errors || {})) {
    if (!SCHLUESSEL_MUSTER.test(key) || !value || typeof value !== 'object') continue;
    const correct = zahl(value.correct), wrong = zahl(value.wrong);
    if (correct + wrong > 0) result[key] = [correct, wrong];
  }
  return result;
}

function duellBilanz(eintrag) {
  if (!eintrag || typeof eintrag !== 'object') return null;
  const name = bereinigeKuerzel(eintrag.name, 30);
  if (!name) return null;
  const runden = zahl(eintrag.runden);
  return {
    n: name,
    r: runden,
    a: Math.min(runden, zahl(eintrag.beantwortet)),
    c: Math.min(runden, zahl(eintrag.richtig)),
    s: zahl(eintrag.duelle),
    w: zahl(eintrag.siege),
    p: zahl(eintrag.punkte),
  };
}

/**
 * Erstellt ein Paket aus einem Profil-Schnappschuss (loadProfileSnapshot)
 * und optional einem Eintrag aus dem Duellprotokoll.
 */
export function erstellePaket({kuerzel, gruppe = '', snapshot = {}, duell = null, jetzt = Date.now()}) {
  const k = bereinigeKuerzel(kuerzel);
  if (!k) throw new TypeError('Bitte ein Kürzel eingeben.');
  const paket = {
    v: PAKET_VERSION,
    k,
    t: Math.floor(Number(jetzt) / 1000),
    s: themenStatistik(snapshot.stats),
    f: fehlerStatistik(snapshot.errors),
    x: zahl(snapshot.xp),
  };
  const g = bereinigeKuerzel(gruppe, 12);
  if (g) paket.g = g;
  const d = duellBilanz(duell);
  if (d) paket.d = d;
  paket.z = pruefsumme(kanonisch(paket));
  return paket;
}

function fehler(text) {
  return {ok: false, fehler: text};
}

/** Prüft Struktur, Wertebereiche und Prüfsumme eines empfangenen Pakets. */
export function pruefePaket(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fehler('Kein Ergebnispaket.');
  if (raw.v !== PAKET_VERSION) return fehler('Unbekannte Paketversion.');
  if (typeof raw.z !== 'string' || pruefsumme(kanonisch(ohnePruefsumme(raw))) !== raw.z) {
    return fehler('Prüfsumme stimmt nicht – Code unvollständig oder verändert.');
  }
  const k = bereinigeKuerzel(raw.k);
  if (!k || k !== raw.k) return fehler('Ungültiges Kürzel.');
  if (raw.g !== undefined && bereinigeKuerzel(raw.g, 12) !== raw.g) return fehler('Ungültige Gruppe.');
  if (!Number.isInteger(raw.t) || raw.t < 1.6e9 || raw.t > 4.1e9) return fehler('Ungültiger Zeitstempel.');
  const pairs = (obj, muster, check) => obj && typeof obj === 'object' && !Array.isArray(obj) &&
    Object.entries(obj).every(([key, v]) => muster.test(key) && Array.isArray(v) && v.length === 2 &&
      v.every(n => Number.isInteger(n) && n >= 0 && n <= MAX_ZAEHLER) && check(v));
  if (!pairs(raw.s, ID_MUSTER, ([c, t]) => c <= t)) return fehler('Ungültige Themenstatistik.');
  if (!pairs(raw.f, SCHLUESSEL_MUSTER, () => true)) return fehler('Ungültige Aufgabentypstatistik.');
  if (!Number.isInteger(raw.x) || raw.x < 0 || raw.x > MAX_ZAEHLER) return fehler('Ungültige XP.');
  if (raw.d !== undefined) {
    const d = raw.d;
    const ok = d && typeof d === 'object' && bereinigeKuerzel(d.n, 30) === d.n && d.n &&
      ['r', 'a', 'c', 's', 'w', 'p'].every(key => Number.isInteger(d[key]) && d[key] >= 0 && d[key] <= MAX_ZAEHLER) &&
      d.a <= d.r && d.c <= d.r;
    if (!ok) return fehler('Ungültige Duellbilanz.');
  }
  return {ok: true, paket: raw};
}

/** Eindeutige Kennung einer Abgabe (Duplikaterkennung beim Import). */
export function paketId(paket) {
  return [paket.g || '', paket.k.toLowerCase(), paket.t, paket.z].join('|');
}

// ---------- Kodierung ----------

function bytesZuBase64url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlZuBytes(text) {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new TypeError('Ungültige Zeichen im Code.');
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64 + '='.repeat((4 - b64.length % 4) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function durchStream(bytes, stream) {
  const response = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await response.arrayBuffer());
}

function kompressionVerfuegbar() {
  try {
    return typeof CompressionStream === 'function' && typeof DecompressionStream === 'function' &&
      !!new CompressionStream('deflate-raw');
  } catch {
    return false;
  }
}

/** Paket → Textcode. Komprimiert (kürzerer QR-Code), wenn der Browser es kann. */
export async function kodierePaket(paket, {komprimieren = true} = {}) {
  const bytes = new TextEncoder().encode(JSON.stringify(paket));
  if (komprimieren && kompressionVerfuegbar()) {
    try {
      const packed = await durchStream(bytes, new CompressionStream('deflate-raw'));
      if (packed.length < bytes.length) return CODE_PREFIX_KOMPRIMIERT + bytesZuBase64url(packed);
    } catch { /* unkomprimiert weiter */ }
  }
  return CODE_PREFIX + bytesZuBase64url(bytes);
}

/** Textcode → geprüftes Paket. Liefert {ok, paket} oder {ok:false, fehler}. */
export async function dekodiereCode(code) {
  const text = String(code ?? '').trim();
  if (text.length > MAX_CODE_LAENGE) return fehler('Code ist zu lang.');
  let bytes;
  try {
    if (text.startsWith(CODE_PREFIX_KOMPRIMIERT)) {
      if (!kompressionVerfuegbar()) return fehler('Dieser Browser kann komprimierte Codes nicht lesen.');
      const packed = base64urlZuBytes(text.slice(CODE_PREFIX_KOMPRIMIERT.length));
      bytes = await durchStream(packed, new DecompressionStream('deflate-raw'));
      if (bytes.length > 20000) return fehler('Code ist zu lang.');
    } else if (text.startsWith(CODE_PREFIX)) {
      bytes = base64urlZuBytes(text.slice(CODE_PREFIX.length));
    } else {
      return fehler('Kein Ergebniscode (muss mit „MT1“ beginnen).');
    }
    return pruefePaket(JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes)));
  } catch {
    return fehler('Code ist beschädigt oder unvollständig.');
  }
}

/** Link auf die Lehrer-Seite, der den Code im Fragment trägt (nicht an den Server). */
export function abgabeLink(lehrerSeiteUrl, code) {
  const url = new URL(lehrerSeiteUrl);
  url.search = '';
  url.hash = 'abgabe=' + code;
  return url.toString();
}

/** Liest einen Code aus einem location.hash wie „#abgabe=MT1…“. */
export function codeAusHash(hash) {
  const match = /(?:^#|&)abgabe=([^&]+)/.exec(String(hash || ''));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

/**
 * Findet in beliebigem Text (eingefügte Codes, Links, JSON-Dateien) alle
 * Ergebniscodes bzw. Paketobjekte.
 */
export function findeAbgaben(text) {
  const source = String(text ?? '');
  const codes = [...source.matchAll(/MT1z?\.[A-Za-z0-9_-]+/g)].map(m => m[0]);
  const objekte = [];
  const trimmed = source.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const data = JSON.parse(trimmed);
      for (const item of Array.isArray(data) ? data : [data]) {
        if (item && typeof item === 'object' && item.v === PAKET_VERSION) objekte.push(item);
      }
    } catch { /* kein JSON */ }
  }
  return {codes: [...new Set(codes)], objekte};
}
