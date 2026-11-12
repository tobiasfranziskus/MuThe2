/**
 * Lehrer-Auswertung: gesammelte Abgaben verwalten und auswerten.
 * Reine Funktionen, kein DOM. Speicherung nur im Browser der Lehrkraft.
 *
 * Kennzahl wie bei mathebattle: Im Mittelpunkt steht die Anzahl richtig
 * gelöster Aufgaben, nicht die Zahl der Versuche.
 */
import {pruefePaket, paketId} from './paket.mjs';
import {themaTitel, aufgabentypTitel, themenReihenfolge} from './themen.mjs';

export const LEHRER_KEY = 'musiktheorie_lehrer_abgaben_v1';
export const MAX_ABGABEN = 3000;

export function leererStand() {
  return {v: 1, abgaben: []};
}

export function ladeStand(storage) {
  try {
    const data = JSON.parse(storage.getItem(LEHRER_KEY) || 'null');
    if (data && data.v === 1 && Array.isArray(data.abgaben)) {
      return {v: 1, abgaben: data.abgaben.filter(p => pruefePaket(p).ok)};
    }
  } catch { /* leer weiter */ }
  return leererStand();
}

export function speichereStand(storage, stand) {
  try {
    storage.setItem(LEHRER_KEY, JSON.stringify(stand));
    return true;
  } catch {
    return false;
  }
}

/** Fügt geprüfte Pakete hinzu; exakte Doppelabgaben werden übersprungen. */
export function fuegeHinzu(stand, pakete) {
  const known = new Set(stand.abgaben.map(paketId));
  const abgaben = [...stand.abgaben];
  let neu = 0, doppelt = 0, ungueltig = 0;
  for (const paket of pakete) {
    if (!pruefePaket(paket).ok) { ungueltig++; continue; }
    const id = paketId(paket);
    if (known.has(id)) { doppelt++; continue; }
    known.add(id);
    abgaben.push(paket);
    neu++;
  }
  abgaben.sort((a, b) => a.t - b.t);
  return {stand: {v: 1, abgaben: abgaben.slice(-MAX_ABGABEN)}, neu, doppelt, ungueltig};
}

export function personKey(paket) {
  return (paket.g || '') + '|' + paket.k.toLowerCase();
}

export function entfernePerson(stand, key) {
  return {v: 1, abgaben: stand.abgaben.filter(p => personKey(p) !== key)};
}

export function gruppen(stand) {
  return [...new Set(stand.abgaben.map(p => p.g || ''))].sort((a, b) => a.localeCompare(b, 'de'));
}

function summe(obj) {
  let richtig = 0, gesamt = 0;
  for (const [c, t] of Object.values(obj || {})) { richtig += c; gesamt += t; }
  return {richtig, gesamt};
}

function schwaechen(f) {
  // Gleiche Bezeichnungen innerhalb eines Themas zusammenfassen.
  const map = new Map();
  for (const [key, [c, w]] of Object.entries(f || {})) {
    const info = aufgabentypTitel(key);
    const id = info.topic + '|' + info.label;
    const before = map.get(id) || {...info, richtig: 0, falsch: 0};
    before.richtig += c;
    before.falsch += w;
    map.set(id, before);
  }
  return [...map.values()]
    .filter(x => x.falsch > 0 && x.falsch >= x.richtig)
    .sort((a, b) => (b.falsch - b.richtig) - (a.falsch - a.richtig));
}

/**
 * Eine Zeile je Person (letzte Abgabe), optional nach Gruppe gefiltert.
 * „Zuwachs“ = zusätzlich richtig gelöste Aufgaben seit der vorherigen Abgabe.
 */
export function zeilen(stand, gruppe = null) {
  const verlauf = new Map();
  for (const paket of stand.abgaben) {
    if (gruppe !== null && (paket.g || '') !== gruppe) continue;
    const key = personKey(paket);
    if (!verlauf.has(key)) verlauf.set(key, []);
    verlauf.get(key).push(paket);
  }
  return [...verlauf.entries()].map(([key, liste]) => {
    liste.sort((a, b) => a.t - b.t);
    const letzte = liste[liste.length - 1];
    const vorher = liste.length > 1 ? liste[liste.length - 2] : null;
    const {richtig, gesamt} = summe(letzte.s);
    const zuwachs = vorher ? richtig - summe(vorher.s).richtig : null;
    const d = letzte.d || null;
    return {
      key,
      kuerzel: letzte.k,
      gruppe: letzte.g || '',
      zeit: letzte.t,
      abgaben: liste.length,
      richtig,
      gesamt,
      quote: gesamt ? richtig / gesamt : null,
      zuwachs,
      xp: letzte.x,
      duellName: d?.n || '',
      duellRunden: d?.r || 0,
      duellRichtig: d?.c || 0,
      duellQuote: d && d.r ? d.c / d.r : null,
      duellSiege: d?.w || 0,
      duelle: d?.s || 0,
      schwaechen: schwaechen(letzte.f).slice(0, 3),
      themen: letzte.s,
    };
  });
}

export function sortiere(rows, spalte = 'richtig', absteigend = true) {
  const factor = absteigend ? -1 : 1;
  return [...rows].sort((a, b) => {
    const x = a[spalte], y = b[spalte];
    if (x === y) return a.kuerzel.localeCompare(b.kuerzel, 'de');
    if (x === null || x === undefined) return 1;
    if (y === null || y === undefined) return -1;
    if (typeof x === 'string') return factor * x.localeCompare(y, 'de');
    return factor * (x - y);
  });
}

/** Klassenübersicht je Thema (letzte Abgabe jeder Person). */
export function themenUebersicht(rows) {
  const map = new Map();
  for (const row of rows) {
    for (const [id, [c, t]] of Object.entries(row.themen || {})) {
      const before = map.get(id) || {id, titel: themaTitel(id), richtig: 0, gesamt: 0, personen: 0};
      before.richtig += c;
      before.gesamt += t;
      before.personen++;
      map.set(id, before);
    }
  }
  return [...map.values()]
    .map(x => ({...x, quote: x.gesamt ? x.richtig / x.gesamt : null}))
    .sort((a, b) => themenReihenfolge(a.id) - themenReihenfolge(b.id));
}

/** Klassenübersicht je Aufgabentyp aus den Fehlerprotokollen. */
export function aufgabentypUebersicht(stand, gruppe = null) {
  const letzte = new Map();
  for (const paket of stand.abgaben) {
    if (gruppe !== null && (paket.g || '') !== gruppe) continue;
    const key = personKey(paket);
    if (!letzte.has(key) || letzte.get(key).t <= paket.t) letzte.set(key, paket);
  }
  const map = new Map();
  for (const paket of letzte.values()) {
    const proPerson = new Set();
    for (const [key, [c, w]] of Object.entries(paket.f || {})) {
      const info = aufgabentypTitel(key);
      const id = info.topic + '|' + info.label;
      const before = map.get(id) || {...info, richtig: 0, falsch: 0, personen: 0, schwach: 0};
      before.richtig += c;
      before.falsch += w;
      if (!proPerson.has(id)) { before.personen++; proPerson.add(id); }
      map.set(id, before);
    }
    for (const s of schwaechen(paket.f)) {
      const entry = map.get(s.topic + '|' + s.label);
      if (entry) entry.schwach++;
    }
  }
  return [...map.values()]
    .map(x => ({...x, quote: x.richtig + x.falsch ? x.richtig / (x.richtig + x.falsch) : null}))
    .sort((a, b) => themenReihenfolge(a.topic) - themenReihenfolge(b.topic) || a.label.localeCompare(b.label, 'de'));
}

// ---------- CSV ----------

function zelle(value) {
  let text = value === null || value === undefined ? '' : String(value);
  // Schutz vor Formel-Injektion in Tabellenkalkulationen.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return /[";\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function prozent(q) {
  return q === null || q === undefined ? '' : String(Math.round(q * 100)).replace('.', ',');
}

export function datum(sekunden) {
  const d = new Date(sekunden * 1000);
  const two = n => String(n).padStart(2, '0');
  return two(d.getDate()) + '.' + two(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + two(d.getHours()) + ':' + two(d.getMinutes());
}

/** Semikolon-CSV mit BOM, öffnet sich in deutschem Excel/Numbers korrekt. */
export function alsCsv(rows) {
  const kopf = ['Kürzel', 'Gruppe', 'Letzte Abgabe', 'Abgaben', 'Richtig gelöst', 'Versuche', 'Quote %',
    'Zuwachs richtig', 'XP', 'Duellname', 'Duellrunden', 'Duell richtig', 'Duellquote %', 'Duelle', 'Siege', 'Schwerpunkte'];
  const lines = [kopf.map(zelle).join(';')];
  for (const r of rows) {
    lines.push([
      r.kuerzel, r.gruppe, datum(r.zeit), r.abgaben, r.richtig, r.gesamt, prozent(r.quote),
      r.zuwachs ?? '', r.xp, r.duellName, r.duellRunden, r.duellRichtig, prozent(r.duellQuote), r.duelle, r.duellSiege,
      r.schwaechen.map(s => s.topicTitle + ': ' + s.label).join(' / '),
    ].map(zelle).join(';'));
  }
  return '﻿' + lines.join('\r\n') + '\r\n';
}
