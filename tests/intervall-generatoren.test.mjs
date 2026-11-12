import assert from 'node:assert/strict';
import test from 'node:test';
import { createIntervalTaskGenerators } from '../src/aufgaben/intervalle.mjs';

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const choose = items => items[Math.floor(Math.random() * items.length)];
const randomInt = (low, high) => Math.floor(Math.random() * (high - low + 1)) + low;
const shuffle = items => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const n = randomInt(0, i);
    [copy[i], copy[n]] = [copy[n], copy[i]];
  }
  return copy;
};
const sharp = ['c','d','f','g','a'];
const flat = ['d','e','g','a','h'];
const selectRoot = probability => {
  const n = Math.random();
  return n < probability / 2
    ? [choose(sharp), '#']
    : n < probability ? [choose(flat), 'b']
    : [choose(['c','d','e','f','g','a','h']), null];
};
const selectClef = level => level === 'mixed' || level === 'alto'
  ? (Math.random() < .5 ? 'treble' : 'bass') : level;

test('alle vier Intervallarten liefern gültige Aufgaben in allen Schlüsseln', () => {
  const oldRandom = Math.random;
  const tasks = createIntervalTaskGenerators({choose,shuffle,selectRoot,selectClef});
  let checked = 0;
  try {
    for (const clef of ['mixed','treble','bass','alto']) {
      Math.random = seeded(50291 + clef.length);
      for (let i = 0; i < 120; i++) {
        for (const type of ['halfWholeStep','buildInterval','recognizeInterval','listeningInterval']) {
          const q = tasks[type](clef);
          assert.ok(q.q && q.explanation);
          if (q.mode === 'mc') {
            assert.ok(q.correct >= 0 && q.correct < q.options.length, q.q);
            assert.equal(q.options.length, 4);
            assert.ok(new Set(q.options).size >= 3);
          } else {
            assert.equal(q.mode, 'staff');
            assert.equal(q.totalSlots, 2);
            assert.equal(q.expected.length, 1);
            assert.equal(q.fixedNotes.length, 1);
            assert.notEqual(q.expected[0].accidental, '##');
            assert.notEqual(q.expected[0].accidental, 'bb');
          }
          if (type === 'listeningInterval') {
            assert.equal(q.hearing, true);
            assert.equal(q.audioMode, 'melodic');
            assert.equal(q.expected.length, 2);
          }
          checked++;
        }
      }
    }
  } finally {
    Math.random = oldRandom;
  }
  assert.equal(checked, 1920);
});

test('Halbtonschritte akzeptieren Enharmonik, notierte Intervalle nicht', () => {
  const oldRandom = Math.random;
  const tasks = createIntervalTaskGenerators({choose,shuffle,selectRoot,selectClef});
  try {
    Math.random = seeded(1988);
    for (let n = 0; n < 150; n++) {
      const half = tasks.halfWholeStep('treble');
      const interval = tasks.buildInterval('bass');
      assert.equal(half.acceptEnharmonic,true);
      assert.equal(interval.acceptEnharmonic,false);
      assert.equal(half.clef,'treble');
      assert.equal(interval.clef,'bass');
    }
  } finally {
    Math.random = oldRandom;
  }
});

test('Höraufgabe bietet auf- und absteigende Intervalle an', () => {
  const oldRandom = Math.random;
  const tasks = createIntervalTaskGenerators({choose,shuffle,selectRoot,selectClef});
  try {
    Math.random = seeded(12345);
    let up = 0, down = 0;
    for (let i=0;i<200;i++) {
      const q=tasks.listeningInterval();
      if (q.explanation.includes('(aufwärts)')) up++;
      if (q.explanation.includes('(abwärts)')) down++;
      assert.match(q.q,/Welches Intervall hörst du/);
    }
    assert.ok(up>0 && down>0);
  } finally {
    Math.random = oldRandom;
  }
});
