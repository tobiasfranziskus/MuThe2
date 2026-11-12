import test from 'node:test';
import assert from 'node:assert/strict';
import { createChordTaskGenerators } from '../src/aufgaben/akkorde.mjs';

function seeded(n) {
  let x = n >>> 0;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
}
const choose = a => a[Math.floor(Math.random() * a.length)];
const randomInt = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const shuffle = arr => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const n = randomInt(0, i);
    [copy[i], copy[n]] = [copy[n], copy[i]];
  }
  return copy;
};
const selectRoot = p => {
  const n = Math.random();
  return n < p / 2 ? [choose(['c','d','f','g','a']), '#']
    : n < p ? [choose(['d','e','g','a','h']), 'b']
    : [choose(['c','d','e','f','g','a','h']), null];
};
const selectClef = level => level === 'mixed' || level === 'alto'
  ? (Math.random() < .5 ? 'treble' : 'bass') : level;
const capitalize = text => text.charAt(0).toUpperCase() + text.slice(1);
const simpleRootName = (name, accidental) => {
  if (accidental === '#') return name + 'is';
  if (accidental === 'b') return {e:'es',a:'as',h:'b'}[name] || name + 'es';
  return name;
};
const fixture = () => createChordTaskGenerators({
  selectRoot, selectClef, choose, shuffle, randomInt, capitalize, simpleRootName,
});

test('alle sechs Akkord-Aufgabengeneratoren liefern bewertbare Aufgaben', () => {
  const previous = Math.random;
  const generators = fixture();
  let count = 0;
  try {
    for (const clef of ['mixed','treble','bass','alto']) {
      Math.random = seeded(9331 + clef.length);
      for (let i = 0; i < 90; i++) {
        for (const generator of [
          'buildTriadTask','identifyTriad','identifyInversion',
          'buildInversion','writtenTriadName','listeningTriad',
        ]) {
          const q = generators[generator](clef);
          count++;
          assert.ok(q.q && q.explanation, generator);
          if (q.mode === 'mc') {
            assert.ok(Array.isArray(q.options) && q.options.length >= 3);
            assert.ok(q.correct >= 0 && q.correct < q.options.length, generator);
          } else if (q.mode === 'staff') {
            assert.equal(q.stacked,true);
            assert.equal(q.totalSlots,3);
            assert.ok(q.expected.length === 2 || q.expected.length === 3);
          } else {
            assert.equal(q.mode,'text');
            assert.equal(q.checkFn(q.correctDisplay),true);
            assert.equal(q.checkFn('Dies ist kein Akkord'),false);
          }
          if (generator === 'listeningTriad') {
            assert.equal(q.hearing,true);
            assert.equal(q.audioMode,'chord');
            assert.equal(q.expected.length,3);
          }
        }
      }
    }
  } finally {
    Math.random = previous;
  }
  assert.equal(count,2160);
});

test('Akkordumkehrungen und Grundstellung behalten Notennamen und Hörmodus', () => {
  const previous = Math.random;
  try {
    Math.random = seeded(77937);
    const g=fixture();
    const seen = new Set();
    for (let i=0;i<280;i++) {
      const q=g.identifyInversion('treble');
      assert.equal(q.mode,'mc');
      assert.equal(q.staff.stacked,true);
      seen.add(q.options[q.correct]);
    }
    assert.ok(seen.has('1. Umkehrung (Sextakkord)'));
    assert.ok(seen.has('2. Umkehrung (Quartsextakkord)'));
    for (let i=0;i<60;i++) {
      const q=g.buildInversion('bass');
      assert.equal(q.clef,'bass');
      assert.equal(q.acceptEnharmonic,false);
    }
  } finally {
    Math.random = previous;
  }
});

test('Akkordnamen akzeptieren Kürzel und Langnamen gleichermaßen', () => {
  const previous=Math.random;
  try {
    Math.random=seeded(3784);
    const g=fixture();
    for(let i=0;i<200;i++) {
      const task=g.writtenTriadName('treble');
      assert.equal(task.checkFn(task.correctDisplay),true);
      assert.equal(task.checkFn(task.explanation.split(' = ')[0]),true);
      assert.equal(task.checkFn('kein echter Akkord'),false);
    }
  } finally {
    Math.random=previous;
  }
});
