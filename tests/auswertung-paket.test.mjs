import test from 'node:test';
import assert from 'node:assert/strict';
import {
  erstellePaket, pruefePaket, kodierePaket, dekodiereCode, bereinigeKuerzel,
  pruefsumme, kanonisch, abgabeLink, codeAusHash, findeAbgaben, paketId,
  CODE_PREFIX, CODE_PREFIX_KOMPRIMIERT,
} from '../src/auswertung/paket.mjs';

const JETZT = Date.UTC(2026, 10, 12, 9, 30);
const snapshot = {
  stats: {noten: {correct: 18, total: 22}, intervalle: {correct: 4, total: 9}, leer: {correct: 0, total: 0}, '<x>': {correct: 1, total: 1}},
  errors: {'noten:0': {correct: 10, wrong: 2}, 'noten:1': {correct: 1, wrong: 5}, 'kaputt': {correct: 1, wrong: 1}},
  xp: 340,
};

test('Paket enthält nur bereinigte Zähler, Kürzel und Prüfsumme', () => {
  const p = erstellePaket({kuerzel: '  Lena <script>  M. ', gruppe: '7b', snapshot, jetzt: JETZT});
  assert.equal(p.k, 'Lena script M.');
  assert.equal(p.g, '7b');
  assert.equal(p.t, Math.floor(JETZT / 1000));
  assert.deepEqual(p.s, {noten: [18, 22], intervalle: [4, 9]});
  assert.deepEqual(p.f, {'noten:0': [10, 2], 'noten:1': [1, 5]});
  assert.equal(p.x, 340);
  assert.equal(p.d, undefined);
  assert.match(p.z, /^[0-9a-f]{8}$/);
  assert.equal(pruefePaket(p).ok, true);
});

test('Richtig kann nie größer als gesamt sein, negative Werte werden 0', () => {
  const p = erstellePaket({kuerzel: 'Tim', snapshot: {stats: {noten: {correct: 50, total: 10}}, errors: {'noten:2': {correct: -4, wrong: 3}}, xp: -1}, jetzt: JETZT});
  assert.deepEqual(p.s.noten, [10, 10]);
  assert.deepEqual(p.f['noten:2'], [0, 3]);
  assert.equal(p.x, 0);
});

test('Kürzel ist Pflicht', () => {
  assert.throws(() => erstellePaket({kuerzel: '  <> ', snapshot, jetzt: JETZT}), /Kürzel/);
  assert.equal(bereinigeKuerzel('Jürgen Ö.-K_1'), 'Jürgen Ö.-K_1');
  assert.equal(bereinigeKuerzel('a'.repeat(40)).length, 20);
});

test('Duellbilanz wird übernommen und begrenzt', () => {
  const p = erstellePaket({kuerzel: 'Mia', snapshot, jetzt: JETZT,
    duell: {name: 'Mia', runden: 12, beantwortet: 20, richtig: 15, duelle: 2, siege: 1, punkte: 1450}});
  assert.deepEqual(p.d, {n: 'Mia', r: 12, a: 12, c: 12, s: 2, w: 1, p: 1450});
  assert.equal(pruefePaket(p).ok, true);
});

test('Prüfsumme erkennt jede Veränderung', () => {
  const p = erstellePaket({kuerzel: 'Ben', snapshot, jetzt: JETZT});
  assert.equal(pruefePaket({...p, x: p.x + 1}).ok, false);
  assert.equal(pruefePaket({...p, s: {...p.s, noten: [22, 22]}}).ok, false);
  assert.equal(pruefePaket({...p, z: '00000000'}).ok, false);
  assert.equal(kanonisch({b: 1, a: [1, {d: 2, c: 3}]}), '{"a":[1,{"c":3,"d":2}],"b":1}');
  assert.equal(pruefsumme(''), '811c9dc5');
});

test('Gefälschte Struktur mit passender Prüfsumme wird trotzdem abgelehnt', () => {
  const base = erstellePaket({kuerzel: 'Ben', snapshot, jetzt: JETZT});
  const fake = {...base, s: {noten: [30, 20]}};
  delete fake.z;
  fake.z = pruefsumme(kanonisch(fake));
  assert.equal(pruefePaket(fake).ok, false);
  const fake2 = {...base, k: '<b>'};
  delete fake2.z;
  fake2.z = pruefsumme(kanonisch(fake2));
  assert.equal(pruefePaket(fake2).ok, false);
});

test('Kodierung hin und zurück, komprimiert und unkomprimiert', async () => {
  const p = erstellePaket({kuerzel: 'Zoë', gruppe: 'LK 12', snapshot, jetzt: JETZT});
  const plain = await kodierePaket(p, {komprimieren: false});
  assert.ok(plain.startsWith(CODE_PREFIX));
  assert.match(plain, /^MT1\.[A-Za-z0-9_-]+$/);
  assert.deepEqual((await dekodiereCode(plain)).paket, p);
  const packed = await kodierePaket(p);
  assert.ok(packed.startsWith(CODE_PREFIX_KOMPRIMIERT) || packed.startsWith(CODE_PREFIX));
  assert.deepEqual((await dekodiereCode(packed)).paket, p);
});

test('Beschädigte Codes werden verständlich abgelehnt', async () => {
  const p = erstellePaket({kuerzel: 'Ben', snapshot, jetzt: JETZT});
  const code = await kodierePaket(p, {komprimieren: false});
  assert.equal((await dekodiereCode(code.slice(0, -6))).ok, false);
  assert.equal((await dekodiereCode('hallo')).ok, false);
  assert.equal((await dekodiereCode('MT1.###')).ok, false);
  assert.equal((await dekodiereCode('MT1z.AAAA')).ok, false);
  assert.equal((await dekodiereCode('MT1.' + 'A'.repeat(7000))).ok, false);
});

test('Abgabelink trägt den Code nur im Fragment', async () => {
  const p = erstellePaket({kuerzel: 'Ben', snapshot, jetzt: JETZT});
  const code = await kodierePaket(p);
  const link = abgabeLink('https://tobiasfranziskus.github.io/Musik-Theorie/lehrer.html?x=1', code);
  const url = new URL(link);
  assert.equal(url.search, '');
  assert.equal(codeAusHash(url.hash), code);
  assert.equal(codeAusHash('#anderes'), null);
});

test('Import findet Codes in Fließtext und Pakete in JSON', async () => {
  const a = erstellePaket({kuerzel: 'A', snapshot, jetzt: JETZT});
  const b = erstellePaket({kuerzel: 'B', snapshot, jetzt: JETZT});
  const codeA = await kodierePaket(a), codeB = await kodierePaket(b, {komprimieren: false});
  const text = 'Hier: ' + codeA + '\nund https://x.de/lehrer.html#abgabe=' + codeB + ' ' + codeA;
  assert.deepEqual(findeAbgaben(text).codes, [codeA, codeB]);
  assert.equal(findeAbgaben(JSON.stringify([a, b, {v: 9}])).objekte.length, 2);
  assert.notEqual(paketId(a), paketId(b));
});
