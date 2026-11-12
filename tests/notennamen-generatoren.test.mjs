import assert from 'node:assert/strict';
import test from 'node:test';
import { createNoteNameTaskGenerators } from '../src/aufgaben/notennamen.mjs';
import { parseGermanNoteInput, formatGermanNote } from '../src/music/notennamen.mjs';

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function fixture() {
  const choose = items => items[Math.floor(Math.random() * items.length)];
  const randomInt = (lower, upper) => Math.floor(Math.random() * (upper - lower + 1)) + lower;
  const shuffle = items => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = randomInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  return createNoteNameTaskGenerators({
    chooseClef: level => level === 'mixed' ? choose(['treble', 'bass', 'alto']) : level,
    choose, shuffle, randomInt,
    staffExplanation: (note, clef) => formatGermanNote(note.name, note.octave, note.accidental) + ' / ' + clef,
    enharmonicExplanation: () => 'enharmonisch',
    clefLabel: clef => ({treble:'Violinschlüssel',bass:'Bassschlüssel',alto:'Altschlüssel'})[clef],
  });
}

test('vier Generatoren erstellen weiterhin vollständige Aufgaben in allen Schlüsseln', () => {
  const originalRandom = Math.random;
  const generators = fixture();
  let checked = 0;
  try {
    for (const clef of ['mixed', 'treble', 'bass', 'alto']) {
      Math.random = seeded(1207 + clef.length);
      for (let n = 0; n < 100; n++) {
        for (const generator of ['multipleChoice', 'enharmonic', 'placement', 'textEntry']) {
          const task = generators[generator](clef);
          checked++;
          assert.ok(task.q && task.explanation);
          if (task.mode === 'mc') {
            assert.equal(task.options.length, 4);
            assert.ok(task.correct >= 0 && task.correct < 4);
            assert.equal(new Set(task.options).size, 4);
          } else if (task.mode === 'staff') {
            assert.equal(task.expected.length, 1);
            assert.equal(task.totalSlots, 1);
            assert.equal(task.acceptEnharmonic, false);
          } else {
            assert.equal(task.mode, 'text');
            assert.equal(typeof task.checkFn, 'function');
            assert.equal(task.checkFn(task.correctDisplay), true);
            assert.equal(task.checkFn('keine Note'), false);
          }
        }
      }
    }
  } finally {
    Math.random = originalRandom;
  }
  assert.equal(checked, 1600);
});

test('f1, f¹ und f4 gelten für f¹, ohne die Tonhöhe zu verwechseln', () => {
  const originalRandom = Math.random;
  try {
    Math.random = seeded(917205);
    const generators = fixture();
    let foundF4 = 0;
    for (let i = 0; i < 3000; i++) {
      const task = generators.textEntry('alto');
      const note = task.staff.notes[0];
      if (note.name === 'f' && note.octave === 4 && note.accidental === null) {
        foundF4++;
        for (const spelling of ['f1', 'f¹', 'f4']) {
          assert.equal(task.checkFn(spelling), true, spelling);
        }
      }
    }
    assert.ok(foundF4 > 8, 'mindestens acht f¹-Aufgaben im Altschlüssel erzeugt');
  } finally {
    Math.random = originalRandom;
  }
  assert.ok(parseGermanNoteInput('f1').some(note => note.octave === 4));
});

test('Notensetz-Aufgabe offenbart die Lösung weiterhin nur im Arbeitsauftrag', () => {
  const originalRandom = Math.random;
  try {
    Math.random = seeded(112);
    const task = fixture().placement('treble');
    assert.match(task.q, /^Setze die Note .+ ins Notensystem!$/);
    assert.equal(task.mode, 'staff');
    assert.deepEqual(task.fixedNotes, []);
  } finally {
    Math.random = originalRandom;
  }
});
