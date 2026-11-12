import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ladeDuellProtokoll, protokolliereRunde, protokolliereDuellende, duellEintraege,
  loescheDuellProtokoll, duellRundeErfassen, duellEndeErfassen, DUELL_PROTOKOLL_KEY, MAX_NAMEN,
} from '../src/auswertung/duell-protokoll.mjs';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k),
    map,
  };
}

test('Runden zählen beantwortet und richtig je Name', () => {
  const s = memoryStorage();
  const players = [{name: 'Mia', answer: 2, score: 0}, {name: 'Leo', answer: 1, score: 0}, {name: 'Ali', answer: null, score: 0}];
  protokolliereRunde(s, players, 2, 1000);
  protokolliereRunde(s, players.map(p => ({...p, answer: 1})), 1, 2000);
  const e = Object.fromEntries(duellEintraege(ladeDuellProtokoll(s)).map(x => [x.name, x]));
  assert.deepEqual([e.Mia.runden, e.Mia.beantwortet, e.Mia.richtig], [2, 2, 2]);
  assert.deepEqual([e.Leo.runden, e.Leo.beantwortet, e.Leo.richtig], [2, 2, 1]);
  assert.deepEqual([e.Ali.runden, e.Ali.beantwortet, e.Ali.richtig], [2, 1, 1]);
});

test('Duellende zählt Punkte und Siege, Gleichstand für beide', () => {
  const s = memoryStorage();
  protokolliereDuellende(s, [{name: 'Mia', score: 800}, {name: 'Leo', score: 800}, {name: 'Ali', score: 100}]);
  protokolliereDuellende(s, [{name: 'mia ', score: 0}, {name: 'Leo', score: 0}]);
  const e = Object.fromEntries(duellEintraege(ladeDuellProtokoll(s)).map(x => [x.name, x]));
  assert.deepEqual([e.Mia.duelle, e.Mia.siege, e.Mia.punkte], [2, 1, 800]);
  assert.deepEqual([e.Leo.duelle, e.Leo.siege], [2, 1]);
  assert.equal(e.Ali.siege, 0);
});

test('Namensliste bleibt begrenzt, neueste bleiben erhalten', () => {
  const s = memoryStorage();
  for (let i = 0; i < MAX_NAMEN + 5; i++) protokolliereRunde(s, [{name: 'P' + i, answer: 0}], 0, i);
  const names = duellEintraege(ladeDuellProtokoll(s)).map(x => x.name);
  assert.equal(names.length, MAX_NAMEN);
  assert.equal(names[0], 'P' + (MAX_NAMEN + 4));
  assert.ok(!names.includes('P0'));
});

test('Defekter Speicher und fehlender Speicher stören nicht', () => {
  const s = memoryStorage();
  s.setItem(DUELL_PROTOKOLL_KEY, '{kaputt');
  assert.deepEqual(ladeDuellProtokoll(s), {v: 1, spieler: {}});
  assert.equal(protokolliereRunde(null, [], 0), false);
  const voll = {getItem: () => null, setItem: () => { throw new Error('Quota'); }};
  assert.equal(protokolliereRunde(voll, [{name: 'X', answer: 0}], 0), false);
  assert.doesNotThrow(() => duellRundeErfassen([{name: 'X', answer: 0}], 0));
  assert.doesNotThrow(() => duellEndeErfassen(null));
  assert.equal(loescheDuellProtokoll(s), true);
  assert.equal(s.getItem(DUELL_PROTOKOLL_KEY), null);
});

test('Duellende derselben Spielerliste wird nur einmal gezählt', () => {
  const s = memoryStorage();
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {value: s, configurable: true});
  try {
    const players = [{name: 'Mia', score: 300}, {name: 'Leo', score: 100}];
    duellEndeErfassen(players);
    duellEndeErfassen(players);
    const e = duellEintraege(ladeDuellProtokoll(s)).find(x => x.name === 'Mia');
    assert.equal(e.duelle, 1);
    assert.equal(e.siege, 1);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  }
});
