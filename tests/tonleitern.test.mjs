import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAJOR_KEYS, MINOR_KEYS, MAJOR_STEPS, NATURAL_MINOR_STEPS,
  HARMONIC_MINOR_STEPS, MELODIC_MINOR_STEPS,
  CHROMATIC_SCALES, WHOLE_TONE_SCALES,
  scaleFromSemitones, parseCompactPitch,
} from '../src/music/tonleitern.mjs';
import { diatonicIndex, chromaticPitch } from '../src/music/tonhoehen.mjs';

test('Tonleiter-Vorlagen bleiben vollständig und in der alten Reihenfolge', () => {
  assert.equal(MAJOR_KEYS.length, 10);
  assert.equal(MINOR_KEYS.length, 10);
  assert.deepEqual(MAJOR_KEYS[0], ['c', null, 'C']);
  assert.deepEqual(MINOR_KEYS[0], ['a', null, 'a']);
  assert.deepEqual(MAJOR_STEPS, [0,2,4,5,7,9,11,12]);
  assert.deepEqual(NATURAL_MINOR_STEPS, [0,2,3,5,7,8,10,12]);
  assert.deepEqual(HARMONIC_MINOR_STEPS, [0,2,3,5,7,8,11,12]);
  assert.deepEqual(MELODIC_MINOR_STEPS, [0,2,3,5,7,9,11,12]);
  assert.deepEqual(Object.keys(CHROMATIC_SCALES), ['c4','f4','a4']);
  assert.deepEqual(Object.keys(WHOLE_TONE_SCALES), ['c4','f4','a4']);
});

test('C-Dur, a-Moll und enharmonische Tonleitertöne sind konsistent', () => {
  const major = scaleFromSemitones('c', null, 4, MAJOR_STEPS);
  assert.deepEqual(major.map(x => x.name), ['c','d','e','f','g','a','h','c']);
  assert.deepEqual(major.map(x => x.octave), [4,4,4,4,4,4,4,5]);
  const natural = scaleFromSemitones('a', null, 4, NATURAL_MINOR_STEPS);
  assert.deepEqual(natural.map(x => x.name), ['a','h','c','d','e','f','g','a']);
  const harmonic = scaleFromSemitones('a', null, 4, HARMONIC_MINOR_STEPS);
  assert.deepEqual(harmonic[6], {name:'g',octave:5,accidental:'#'});
  const melodic = scaleFromSemitones('a', null, 4, MELODIC_MINOR_STEPS);
  assert.deepEqual(melodic[5], {name:'f',octave:5,accidental:'#'});
  assert.deepEqual(melodic[6], {name:'g',octave:5,accidental:'#'});
});

test('Jede Stufe behält Halbton- und diatonischen Abstand', () => {
  let verified = 0;
  for (const [name, accidental] of [...MAJOR_KEYS, ...MINOR_KEYS]) {
    for (const pattern of [MAJOR_STEPS,NATURAL_MINOR_STEPS,HARMONIC_MINOR_STEPS,MELODIC_MINOR_STEPS]) {
      const notes = scaleFromSemitones(name, accidental, 4, pattern);
      notes.forEach((note, i) => {
        assert.equal(diatonicIndex(note.name,note.octave)-diatonicIndex(name,4),i);
        // Vorzeichen außerhalb #-##/b-bb sind nach alter Logik nicht darstellbar:
        if (i===0 || ![null,'#','b','##','bb'].includes(note.accidental)) return;
        const delta=chromaticPitch(note.name,note.octave,note.accidental)-chromaticPitch(name,4,accidental);
        assert.equal(delta,pattern[i]);
        verified++;
      });
    }
  }
  assert.ok(verified>400);
});

test('Chromatische und Ganzton-Vorlagen bleiben lesbar', () => {
  assert.equal(CHROMATIC_SCALES.c4.length,13);
  assert.equal(WHOLE_TONE_SCALES.c4.length,7);
  assert.deepEqual(parseCompactPitch('cis4'),{name:'c',octave:4,accidental:'#'});
  assert.deepEqual(parseCompactPitch('b4'),{name:'h',octave:4,accidental:'b'});
  assert.deepEqual(parseCompactPitch('es5'),{name:'e',octave:5,accidental:'b'});
  assert.equal(parseCompactPitch('x4'),null);
  assert.equal(parseCompactPitch('c10'),null);
});
