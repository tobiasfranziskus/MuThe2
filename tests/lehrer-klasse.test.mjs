import test from 'node:test';
import assert from 'node:assert/strict';
import {erstellePaket} from '../src/auswertung/paket.mjs';
import {
  leererStand, fuegeHinzu, zeilen, sortiere, themenUebersicht, aufgabentypUebersicht,
  alsCsv, entfernePerson, gruppen, ladeStand, speichereStand, LEHRER_KEY,
} from '../src/auswertung/klasse.mjs';
import {aufgabentypTitel, THEMEN} from '../src/auswertung/themen.mjs';

const T0 = Date.UTC(2026, 10, 10, 8, 0);
const tag = 86400000;
function paket(k, g, stats, errors = {}, t = T0, duell = null) {
  return erstellePaket({kuerzel: k, gruppe: g, snapshot: {stats, errors, xp: 10}, jetzt: t, duell});
}

test('Doppelte Abgaben werden erkannt, ungültige verworfen', () => {
  const a = paket('Mia', '7b', {noten: {correct: 5, total: 8}});
  let r = fuegeHinzu(leererStand(), [a, a, {...a, x: 99}]);
  assert.deepEqual([r.neu, r.doppelt, r.ungueltig], [1, 1, 1]);
  r = fuegeHinzu(r.stand, [a]);
  assert.equal(r.doppelt, 1);
  assert.equal(r.stand.abgaben.length, 1);
});

test('Zeile je Person mit letzter Abgabe und Zuwachs', () => {
  const s = fuegeHinzu(leererStand(), [
    paket('Mia', '7b', {noten: {correct: 5, total: 8}}, {}, T0),
    paket('mia', '7b', {noten: {correct: 12, total: 15}, intervalle: {correct: 3, total: 4}}, {}, T0 + tag),
    paket('Leo', '7b', {noten: {correct: 20, total: 40}}, {}, T0),
    paket('Mia', '8a', {noten: {correct: 1, total: 1}}, {}, T0),
  ]).stand;
  const rows = zeilen(s, '7b');
  assert.equal(rows.length, 2);
  const mia = rows.find(r => r.kuerzel === 'mia');
  assert.deepEqual([mia.richtig, mia.gesamt, mia.zuwachs, mia.abgaben], [15, 19, 10, 2]);
  assert.equal(rows.find(r => r.kuerzel === 'Leo').zuwachs, null);
  assert.deepEqual(sortiere(rows, 'richtig').map(r => r.kuerzel), ['Leo', 'mia']);
  assert.deepEqual(sortiere(rows, 'quote').map(r => r.kuerzel), ['mia', 'Leo']);
  assert.deepEqual(gruppen(s), ['7b', '8a']);
  assert.equal(zeilen(s).length, 3);
  assert.equal(zeilen(entfernePerson(s, '7b|mia'), '7b').length, 1);
});

test('Schwerpunkte und Aufgabentyp-Übersicht', () => {
  const s = fuegeHinzu(leererStand(), [
    paket('A', '', {noten: {correct: 3, total: 10}}, {'noten:0': {correct: 9, wrong: 1}, 'noten:1': {correct: 1, wrong: 6}}),
    paket('B', '', {noten: {correct: 8, total: 10}}, {'noten:1': {correct: 2, wrong: 2}, 'werte:2': {correct: 0, wrong: 1}, 'werte:5': {correct: 0, wrong: 2}}),
  ]).stand;
  const rows = zeilen(s);
  const a = rows.find(r => r.kuerzel === 'A');
  assert.deepEqual(a.schwaechen.map(x => x.label), ['Enharmonische Verwechslung']);
  const b = rows.find(r => r.kuerzel === 'B');
  // werte:2 und werte:5 sind beide „Pause erkennen“ und werden zusammengefasst.
  assert.deepEqual(b.schwaechen.map(x => [x.label, x.falsch]), [['Pause erkennen', 3], ['Enharmonische Verwechslung', 2]]);
  const typen = aufgabentypUebersicht(s);
  const enh = typen.find(x => x.label === 'Enharmonische Verwechslung');
  assert.deepEqual([enh.richtig, enh.falsch, enh.personen, enh.schwach], [3, 8, 2, 2]);
  assert.equal(typen.find(x => x.label === 'Pause erkennen').personen, 1);
  const themen = themenUebersicht(rows);
  assert.deepEqual(themen.map(x => [x.id, x.richtig, x.gesamt]), [['noten', 11, 20]]);
});

test('Duellbilanz erscheint in der Zeile', () => {
  const s = fuegeHinzu(leererStand(), [paket('Mia', '', {}, {}, T0,
    {name: 'Mia', runden: 20, beantwortet: 18, richtig: 15, duelle: 2, siege: 1, punkte: 2000})]).stand;
  const [row] = zeilen(s);
  assert.deepEqual([row.duellRunden, row.duellRichtig, row.duellQuote, row.duellSiege], [20, 15, 0.75, 1]);
});

test('CSV: Semikolon, BOM, Formelschutz, Anführungszeichen', () => {
  const s = fuegeHinzu(leererStand(), [paket('Mia', '7b', {noten: {correct: 1, total: 2}}, {'noten:1': {correct: 0, wrong: 3}})]).stand;
  const rows = zeilen(s);
  rows[0].kuerzel = '=HYPERLINK("x")';
  const csv = alsCsv(rows);
  assert.ok(csv.startsWith('﻿Kürzel;Gruppe;'));
  assert.match(csv, /"'=HYPERLINK\(""x""\)";7b;/);
  assert.match(csv, /;1;2;50;/);
  assert.match(csv, /Notennamen: Enharmonische Verwechslung/);
});

test('Speichern und Laden filtert manipulierte Einträge', () => {
  const map = new Map();
  const storage = {getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v)};
  const a = paket('Mia', '', {noten: {correct: 1, total: 2}});
  assert.equal(speichereStand(storage, {v: 1, abgaben: [a, {...a, x: 5}]}), true);
  assert.equal(ladeStand(storage).abgaben.length, 1);
  map.set(LEHRER_KEY, 'kaputt');
  assert.deepEqual(ladeStand(storage), leererStand());
});

test('Aufgabentyp-Bezeichnungen decken alle Generatoren ab', () => {
  const counts = {noten: 4, halbgans: 1, intervalle: 2, dreiklaenge: 5, tonleitern: 4, funktionen: 2, akkorde: 2, quinten: 1, vorzeichen: 1, kadenz: 2, analyse: 1, gehoer: 2};
  for (const [id, n] of Object.entries(counts)) {
    assert.equal(THEMEN.find(t => t.id === id).types.length, n, id);
  }
  assert.equal(THEMEN.length, 13);
  assert.equal(aufgabentypTitel('noten:1').label, 'Enharmonische Verwechslung');
  assert.equal(aufgabentypTitel('neu:3').label, 'Aufgabentyp 4');
});
