import assert from 'node:assert/strict';
import test from 'node:test';
import { createScaleTaskGenerators } from '../src/aufgaben/tonleitern.mjs';

function seeded(n) {
  let state = n >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const choose = values => values[Math.floor(Math.random() * values.length)];
const selectClef = level => (level === 'mixed' || level === 'alto')
  ? (Math.random() < .5 ? 'treble' : 'bass') : level;

test('Dur, Moll, chromatische und Ganztonleiter erzeugen vollständige Aufgaben', () => {
  const previous = Math.random;
  const generators = createScaleTaskGenerators({choose,selectClef});
  let count = 0;
  try {
    for (const clef of ['mixed','treble','bass','alto']) {
      Math.random = seeded(1567 + clef.length);
      for (let i=0;i<120;i++) {
        for (const [type,notes,enharmonic] of [
          ['majorScale',8,false],
          ['minorScale',8,false],
          ['chromaticScale',13,false],
          ['wholeToneScale',7,true],
        ]) {
          const task = generators[type](clef);
          assert.equal(task.mode,'staff');
          assert.equal(task.fixedNotes.length,0);
          assert.equal(task.totalSlots,notes);
          assert.equal(task.expected.length,notes);
          assert.equal(task.acceptEnharmonic,enharmonic);
          assert.ok(task.q.length>15 && task.explanation.length>15);
          for (const note of task.expected) {
            assert.ok(note.name && Number.isInteger(note.octave));
          }
          count++;
        }
      }
    }
  } finally {
    Math.random = previous;
  }
  assert.equal(count,1920);
});

test('Alle drei Mollvarianten mit individuellen Erklärungstexten', () => {
  const previous=Math.random;
  const generators=createScaleTaskGenerators({choose,selectClef});
  const variants=new Set();
  try {
    Math.random=seeded(21778);
    for(let i=0;i<200;i++) {
      const q=generators.minorScale('treble');
      if(q.q.includes('natürlich')) variants.add('natürlich');
      if(q.q.includes('harmonisch')) {
        variants.add('harmonisch');
        assert.ok(q.explanation.includes('7. Stufe'));
      }
      if(q.q.includes('melodisch')) {
        variants.add('melodisch');
        assert.ok(q.explanation.includes('6. und 7. Stufe'));
      }
    }
  } finally {
    Math.random=previous;
  }
  assert.deepEqual([...variants].sort(),['harmonisch','melodisch','natürlich']);
});

test('Bassschlüssel verschiebt Chromatik und Ganztonvorlagen um zwei Oktaven', () => {
  const previous=Math.random;
  const generators=createScaleTaskGenerators({choose,selectClef});
  try {
    for(const name of ['chromaticScale','wholeToneScale']) {
      Math.random=seeded(29817);
      const treble=generators[name]('treble');
      Math.random=seeded(29817);
      const bass=generators[name]('bass');
      assert.deepEqual(treble.expected.map(n=>n.name),bass.expected.map(n=>n.name));
      assert.deepEqual(treble.expected.map(n=>n.octave-2),bass.expected.map(n=>n.octave));
    }
  } finally {
    Math.random=previous;
  }
});
