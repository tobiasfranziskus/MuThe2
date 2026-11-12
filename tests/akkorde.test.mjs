import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildTriad, invertChord, hasSimpleAccidentals,
  chordSymbol, chordDescription,
} from '../src/music/akkorde.mjs';

test('Dur-, Moll-, verminderte und übermäßige Dreiklänge bleiben erhalten', () => {
  const cases = [
    [[4,7], [{name:'c',octave:4,accidental:null},{name:'e',octave:4,accidental:null},{name:'g',octave:4,accidental:null}]],
    [[3,7], [{name:'c',octave:4,accidental:null},{name:'e',octave:4,accidental:'b'},{name:'g',octave:4,accidental:null}]],
    [[3,6], [{name:'c',octave:4,accidental:null},{name:'e',octave:4,accidental:'b'},{name:'g',octave:4,accidental:'b'}]],
    [[4,8], [{name:'c',octave:4,accidental:null},{name:'e',octave:4,accidental:null},{name:'g',octave:4,accidental:'#'}]],
  ];
  for (const [intervals, notes] of cases) {
    assert.deepEqual(buildTriad('c',null,4,...intervals), notes);
  }
});

test('Umkehrungen erfolgen durch Oktavieren der tiefsten Note ohne Mutation', () => {
  const original = buildTriad('c',null,4,4,7);
  const before = structuredClone(original);
  assert.deepEqual(invertChord(original,1),[
    {name:'e',octave:4,accidental:null},
    {name:'g',octave:4,accidental:null},
    {name:'c',octave:5,accidental:null},
  ]);
  assert.deepEqual(invertChord(original,2),[
    {name:'g',octave:4,accidental:null},
    {name:'c',octave:5,accidental:null},
    {name:'e',octave:5,accidental:null},
  ]);
  assert.deepEqual(original,before);
});

test('Doppelvorzeichenfilter und Namen in deutscher Schreibweise', () => {
  assert.equal(hasSimpleAccidentals(buildTriad('c',null,4,4,7)),true);
  assert.equal(hasSimpleAccidentals([{name:'e',octave:4,accidental:'##'}]),false);
  assert.equal(hasSimpleAccidentals([{name:'e',octave:4,accidental:'bb'}]),false);
  assert.equal(chordSymbol('g',null,'moll'),'Gm');
  assert.equal(chordDescription('g',null,'moll'),'Gm (g-Moll)');
  assert.equal(chordDescription('g',null,'dur'),'G (G-Dur)');
  assert.equal(chordSymbol('h','b','dur'),'B');
  assert.equal(chordDescription('e','b','dur'),'Es (Es-Dur)');
});
