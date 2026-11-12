import assert from 'node:assert/strict';
import test from 'node:test';
import {createKeySignatureTaskGenerators} from '../src/aufgaben/quintenzirkel-vorzeichen.mjs';

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
const choose = items => items[Math.floor(Math.random() * items.length)];
const randomInt = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const shuffle = values => {
  const items = [...values];
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
};
const selectClef = level => level === 'mixed' || level === 'alto'
  ? Math.random() < .5 ? 'treble' : 'bass'
  : level;
const fixture = () => createKeySignatureTaskGenerators({choose, shuffle, selectClef});

test('Quintenzirkelaufgaben prüfen Paralleltonarten oder die Vorzeichenanzahl', () => {
  const previous = Math.random;
  const tasks = fixture();
  const kinds = new Set();
  const keys = new Set();
  let count = 0;
  try {
    Math.random = seeded(1379);
    for (let i = 0; i < 500; i++) {
      const task = tasks.circleOfFifths();
      count++;
      assert.equal(task.mode, 'mc');
      assert.equal(task.options.length, 4);
      assert.equal(new Set(task.options).size, 4);
      assert.ok(task.correct >= 0 && task.correct < 4);
      assert.ok(task.explanation.length > 10);
      if (task.q.includes('parallele Molltonart')) kinds.add('parallel');
      if (task.q.includes('Wie viele Vorzeichen')) kinds.add('vorzeichen');
      const match = task.q.match(/von (.+)-Dur/);
      if (match) keys.add(match[1]);
    }
  } finally {
    Math.random = previous;
  }
  assert.equal(count, 500);
  assert.deepEqual([...kinds].sort(), ['parallel','vorzeichen']);
  assert.ok(keys.size >= 8, 'mehrere Tonarten werden erzeugt');
});

test('Generalvorzeichen werden auf alle drei Schlüsselvarianten verteilt', () => {
  const previous = Math.random;
  const tasks = fixture();
  const clefs = new Set();
  const signatures = new Set();
  let checked = 0;
  try {
    for (const requested of ['mixed','treble','bass','alto']) {
      Math.random = seeded(7142 + requested.length);
      for (let i = 0; i < 140; i++) {
        const task = tasks.readKeySignature(requested);
        checked++;
        assert.equal(task.mode, 'mc');
        assert.equal(task.options.length, 4);
        assert.equal(new Set(task.options).size, 4);
        assert.ok(task.correct >= 0 && task.correct < 4);
        assert.ok(task.staff.keySig.count >= 0 && task.staff.keySig.count <= 6);
        assert.ok(['sharp','flat'].includes(task.staff.keySig.type));
        assert.deepEqual(task.staff.notes, []);
        clefs.add(task.staff.clef);
        signatures.add(task.staff.keySig.type + ':' + task.staff.keySig.count);
      }
    }
  } finally {
    Math.random = previous;
  }
  assert.equal(checked, 560);
  assert.ok(clefs.has('treble') && clefs.has('bass'));
  assert.ok(signatures.has('flat:3') && signatures.has('sharp:3'));
  assert.ok(signatures.size >= 10);
});

test('Tonart und Paralleltonart sind in den Aufgabenantworten konsistent', () => {
  const previous = Math.random;
  const tasks = fixture();
  let major = 0, minor = 0;
  try {
    Math.random = seeded(82091);
    for (let i = 0; i < 300; i++) {
      const task = tasks.readKeySignature('treble');
      const correct = task.options[task.correct];
      if (task.q.includes('Durtonart')) {
        major++;
        assert.match(correct, /-Dur$/);
      } else {
        minor++;
        assert.match(correct, /-Moll$/);
      }
      assert.ok(task.explanation.includes('Paralleltonart'));
    }
  } finally {
    Math.random = previous;
  }
  assert.ok(major > 0 && minor > 0);
});
