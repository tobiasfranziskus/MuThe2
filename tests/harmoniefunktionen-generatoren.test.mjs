import assert from 'node:assert/strict';
import test from 'node:test';
import { MAJOR_FUNCTIONS, createHarmonyTaskGenerators } from '../src/aufgaben/harmoniefunktionen.mjs';

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
const choose = items => items[Math.floor(Math.random() * items.length)];
const randomInt = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const shuffle = source => {
  const result = [...source];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
const selectClef = level => level === 'mixed' || level === 'alto'
  ? (Math.random() < .5 ? 'treble' : 'bass') : level;
const capitalize = text => text.charAt(0).toUpperCase() + text.slice(1);
const simpleRootName = (name, accidental) => accidental
  ? accidental === '#' ? name + 'is'
    : accidental === 'b' ? ({e:'es',a:'as',h:'b'}[name] || name + 'es') : name
  : name;
const fixture = () => createHarmonyTaskGenerators({
  choose, shuffle, randomInt, selectClef, simpleRootName, capitalize,
});

test('gemeinsamer Dur-Funktionskatalog bleibt für die Analyse verfügbar', () => {
  assert.equal(MAJOR_FUNCTIONS.length, 6);
  assert.deepEqual(MAJOR_FUNCTIONS.map(f => f.sym), ['T','S','D','Tp','Sp','Dp']);
  assert.deepEqual(MAJOR_FUNCTIONS.map(f => f.off), [0,3,4,5,1,2]);
  assert.equal(MAJOR_FUNCTIONS.find(f => f.sym === 'D').semi, 7);
});

test('alle vier Harmonie-Generatoren erzeugen gültige Aufgaben', () => {
  const original = Math.random;
  const generators = fixture();
  let count = 0;
  try {
    for (const clef of ['mixed', 'treble', 'bass', 'alto']) {
      Math.random = seeded(18271 + clef.length);
      for (let i = 0; i < 125; i++) {
        for (const name of [
          'buildFunctionChord', 'identifyFunction',
          'buildExtendedChord', 'identifyExtendedChord',
        ]) {
          const task = generators[name](clef);
          count++;
          assert.ok(task.q && task.explanation, name);
          if (task.mode === 'mc') {
            assert.equal(task.options.length, 4, name);
            assert.ok(task.correct >= 0 && task.correct < 4, name);
            assert.equal(new Set(task.options).size, 4, name);
          } else {
            assert.equal(task.mode, 'staff', name);
            assert.ok(Array.isArray(task.expected));
            assert.equal(task.totalSlots, name === 'buildExtendedChord' ? 4 : 3, name);
            assert.ok(task.expected.every(note => note.name && Number.isInteger(note.octave)));
            assert.equal(task.acceptEnharmonic, false);
          }
        }
      }
    }
  } finally {
    Math.random = original;
  }
  assert.equal(count, 2000);
});

test('Funktionsaufgaben decken Dur und Moll sowie verschiedene Umkehrungen ab', () => {
  const original = Math.random;
  const generators = fixture();
  let dur = 0, moll = 0, inverted = 0;
  try {
    Math.random = seeded(89217);
    for (let i = 0; i < 350; i++) {
      const task = generators.identifyFunction('treble');
      if (task.q.includes('-Dur')) dur++;
      if (task.q.includes('-Moll')) moll++;
      if (task.explanation.includes('Umkehrung')) inverted++;
      assert.equal(task.staff.stacked, true);
      assert.equal(task.staff.notes.length, 3);
    }
  } finally {
    Math.random = original;
  }
  assert.ok(dur > 0 && moll > 0 && inverted > 0);
});

test('Vierklänge bewahren die feste Grundtonvorgabe und den Vierklang-Namen', () => {
  const original = Math.random;
  const tasks = fixture();
  try {
    Math.random = seeded(77983);
    for (let i=0;i<160;i++) {
      const build=tasks.buildExtendedChord('bass');
      const identify=tasks.identifyExtendedChord('treble');
      assert.equal(build.fixedNotes.length, 1);
      assert.equal(build.expected.length, 3);
      assert.equal(build.clef, 'bass');
      assert.equal(identify.staff.notes.length, 4);
      assert.equal(identify.staff.stacked, true);
      assert.equal(identify.options.length, 4);
      assert.ok(identify.explanation.length > 15);
    }
  } finally {
    Math.random = original;
  }
});
