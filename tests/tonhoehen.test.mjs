import assert from 'node:assert/strict';
import test from 'node:test';
import {
  diatonicIndex,
  noteFromDiatonicIndex,
  chromaticPitch,
} from '../src/music/tonhoehen.mjs';

test('diatonische Positionen: C4 ist Nullpunkt, Hilfslinien bleiben korrekt', () => {
  assert.equal(diatonicIndex('c', 4), 0);
  assert.equal(diatonicIndex('e', 4), 2);
  assert.equal(diatonicIndex('h', 3), -1);
  assert.equal(diatonicIndex('f', 5), 10);
  for (const name of ['c','d','e','f','g','a','h']) {
    for (let octave = -3; octave <= 9; octave++) {
      const recovered = noteFromDiatonicIndex(diatonicIndex(name, octave));
      assert.deepEqual(recovered, { name, octave });
    }
  }
});

test('negative und hohe diatonische Indizes werden korrekt umgerechnet', () => {
  for (let index = -250; index <= 250; index++) {
    const note = noteFromDiatonicIndex(index);
    assert.equal(diatonicIndex(note.name, note.octave), index);
  }
});

test('chromatische Werte und Vorzeichen bewahren die bisherige Skala', () => {
  assert.equal(chromaticPitch('c', 4), 48);
  assert.equal(chromaticPitch('a', 4), 57);
  assert.equal(chromaticPitch('h', 4), 59);
  assert.equal(chromaticPitch('c', 5), 60);
  assert.equal(chromaticPitch('c', 4, '#'), 49);
  assert.equal(chromaticPitch('d', 4, 'b'), 49);
  assert.equal(chromaticPitch('f', 4, '##'), 55);
  assert.equal(chromaticPitch('g', 4, 'bb'), 53);
  assert.equal(chromaticPitch('f', 4, 'n'), chromaticPitch('f', 4));
  for (const name of ['c','d','e','f','g','a','h']) {
    for (let octave = 0; octave <= 8; octave++) {
      for (const accidental of [null, '#', 'b', '##', 'bb']) {
        assert.equal(chromaticPitch(name, octave + 1, accidental) - chromaticPitch(name, octave, accidental), 12);
      }
    }
  }
});
