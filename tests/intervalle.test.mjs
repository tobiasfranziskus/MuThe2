import assert from 'node:assert/strict';
import test from 'node:test';
import { INTERVALS, transposeDiatonic } from '../src/music/intervalle.mjs';
import { chromaticPitch, diatonicIndex } from '../src/music/tonhoehen.mjs';

test('Intervall-Katalog bewahrt 13 Namen und die zwei Tritonus-Schreibweisen', () => {
  assert.equal(INTERVALS.length, 13);
  assert.equal(INTERVALS[0].name, 'Kleine Sekunde');
  assert.equal(INTERVALS.at(-1).name, 'Reine Oktave');
  const tritones = INTERVALS.filter(item => item.semis === 6);
  assert.deepEqual(tritones.map(i => i.steps), [3, 4]);
  assert.deepEqual(tritones.map(i => i.name), [
    'Übermäßige Quarte (Tritonus)', 'Verminderte Quinte (Tritonus)',
  ]);
});

test('Intervalle ab c¹ stimmen in Halbton- und diatonischer Distanz überein', () => {
  for (const interval of INTERVALS) {
    const destination = transposeDiatonic('c', null, 4, interval.steps, interval.semis);
    assert.equal(
      diatonicIndex(destination.name, destination.octave) - diatonicIndex('c', 4),
      interval.steps,
      interval.name,
    );
    assert.equal(
      chromaticPitch(destination.name, destination.octave, destination.accidental) - chromaticPitch('c', 4),
      interval.semis,
      interval.name,
    );
  }
});

test('Intervallnamen sind enharmonisch unterscheidbar', () => {
  assert.deepEqual(transposeDiatonic('c', null, 4, 3, 6), {
    name: 'f', octave: 4, accidental: '#',
  });
  assert.deepEqual(transposeDiatonic('c', null, 4, 4, 6), {
    name: 'g', octave: 4, accidental: 'b',
  });
});

test('Oktavübergänge und Abwärtstransposition bleiben erhalten', () => {
  assert.deepEqual(transposeDiatonic('h', null, 4, 1, 1), {
    name: 'c', octave: 5, accidental: null,
  });
  assert.deepEqual(transposeDiatonic('c', null, 4, -1, -1), {
    name: 'h', octave: 3, accidental: null,
  });
  assert.deepEqual(transposeDiatonic('c', null, 4, 7, 12), {
    name: 'c', octave: 5, accidental: null,
  });
  assert.deepEqual(transposeDiatonic('g', null, 4, -4, -7), {
    name: 'c', octave: 4, accidental: null,
  });
});
