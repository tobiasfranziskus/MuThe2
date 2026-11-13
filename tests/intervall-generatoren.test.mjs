import assert from 'node:assert/strict';
import test from 'node:test';
import { createIntervalTaskGenerators, enharmonicSpelling } from '../src/aufgaben/intervalle.mjs';
import { chromaticPitch } from '../src/music/tonhoehen.mjs';

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
            assert.equal(q.audioMode, 'both');
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

test('Höraufgabe: Intervalle nur aufwärts, erst nacheinander, dann gemeinsam', () => {
  const oldRandom = Math.random;
  const tasks = createIntervalTaskGenerators({choose,shuffle,selectRoot,selectClef});
  try {
    Math.random = seeded(12345);
    for (let i=0;i<200;i++) {
      const q=tasks.listeningInterval();
      assert.match(q.q,/Welches Intervall hörst du/);
      assert.ok(!q.explanation.includes('abwärts'));
      assert.ok(q.explanation.includes('(aufwärts)'));
      const [low,high]=q.expected;
      assert.ok(chromaticPitch(high.name,high.octave,high.accidental)>chromaticPitch(low.name,low.octave,low.accidental));
    }
  } finally {
    Math.random = oldRandom;
  }
});

test('Ganztonschritt: Alternativschreibweise (eis/f) wird genannt', () => {
  const alt=enharmonicSpelling({name:'e',octave:4,accidental:'#'});
  assert.deepEqual(alt,{name:'f',octave:4,accidental:null});
  const tasks = createIntervalTaskGenerators({choose,shuffle,selectRoot,selectClef});
  let found=false;
  for (let i=0;i<20000&&!found;i++) {
    const q=tasks.halfWholeStep();
    if (q.expected[0].name==='e'&&q.expected[0].accidental==='#') {
      found=true;
      assert.match(q.alternativeSolution,/^f/);
      assert.match(q.explanation,/eis.*enharmonisch gleich: f/);
    }
  }
  assert.ok(found);
});
