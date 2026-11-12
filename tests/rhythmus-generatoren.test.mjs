import assert from 'node:assert/strict';
import test from 'node:test';
import { createRhythmTaskGenerators } from '../src/aufgaben/rhythmus.mjs';

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
const choose = values => values[Math.floor(Math.random() * values.length)];
const randomInt = (lower, upper) => Math.floor(Math.random() * (upper - lower + 1)) + lower;
const shuffle = values => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
const selectClef = level => level === 'mixed' || level === 'alto'
  ? (Math.random() < .5 ? 'treble' : 'bass') : level;
const fixture = () => createRhythmTaskGenerators({
  choose, randomInt, shuffle, selectClef,
});

test('Fünf Rhythmustypen erzeugen in allen Schlüsseln gültige MC-Aufgaben', () => {
  const original = Math.random;
  const generators = fixture();
  let checked = 0;
  try {
    for (const clef of ['mixed', 'treble', 'bass', 'alto']) {
      Math.random = seeded(19145 + clef.length);
      for (let k = 0; k < 100; k++) {
        for (const name of ['missingNoteValue', 'missingRestValue', 'identifyRest', 'barLine', 'triplet']) {
          const question = generators[name](clef);
          checked++;
          assert.equal(question.mode, 'mc', name);
          assert.ok(question.q?.length > 10, name);
          assert.ok(question.explanation?.length > 5, name);
          assert.equal(question.options.length, 4, name);
          assert.ok(question.correct >= 0 && question.correct < 4, name);
          assert.equal(new Set(question.options).size, 4, name);
        }
      }
    }
  } finally {
    Math.random = original;
  }
  assert.equal(checked, 2000);
});

test('Notenwerte und Pausenwerte nutzen dieselbe Zählzeit-Aufgabe', () => {
  const original = Math.random;
  const generators = fixture();
  try {
    Math.random = seeded(20450);
    for (let n = 0; n < 120; n++) {
      const note = generators.missingNoteValue('treble');
      const rest = generators.missingRestValue('bass');
      assert.match(note.q, /Notenwert/);
      assert.match(rest.q, /Pause|Pausenzeichen/);
      assert.ok(Array.isArray(note.staff.timeSig));
      assert.ok(Array.isArray(rest.staff.timeSig));
      assert.equal(rest.staff.clef, 'bass');
    }
  } finally {
    Math.random = original;
  }
});

test('Pausen erkennen: gewünschter Pausentyp bleibt korrekt', () => {
  const original = Math.random;
  const generators = fixture();
  try {
    Math.random = seeded(54117);
    for (const [type, expected] of [
      ['whole', 'ganze Pause'], ['half', 'halbe Pause'],
      ['quarter', 'Viertelpause'], ['eighth', 'Achtelpause'],
      ['sixteenth', 'Sechzehntelpause'],
    ]) {
      const question = generators.identifyRest('treble', type);
      assert.equal(question.staff.notes[0].value, 'r' + type);
      assert.equal(question.options[question.correct], expected);
    }
  } finally {
    Math.random = original;
  }
});

test('Taktstrichaufgabe behält nummerierte Noten und Taktangabe', () => {
  const original = Math.random;
  const generators = fixture();
  try {
    Math.random = seeded(77865);
    for (let i = 0; i < 100; i++) {
      const question = generators.barLine('bass');
      assert.equal(question.staff.numbered, true);
      assert.equal(question.staff.clef, 'bass');
      assert.ok(question.staff.notes.length >= 5);
      assert.match(question.options[question.correct], /^nach Note \d+$/);
    }
  } finally {
    Math.random = original;
  }
});

test('Triolenaufgaben prüfen Zählzeiten oder Achteltriolen pro Takt', () => {
  const original = Math.random;
  const generators = fixture();
  try {
    Math.random = seeded(99358);
    const kinds = new Set();
    for (let i = 0; i < 180; i++) {
      const question = generators.triplet('treble');
      assert.equal(question.mode, 'mc');
      if (question.staff?.notes?.length) {
        kinds.add('notiert');
        assert.ok(question.staff.notes.some(note => note.trip));
      } else {
        kinds.add('Taktberechnung');
        assert.match(question.q, /Achteltriolen/);
      }
    }
    assert.ok(kinds.has('notiert') && kinds.has('Taktberechnung'));
  } finally {
    Math.random = original;
  }
});
