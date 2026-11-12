import assert from 'node:assert/strict';
import test from 'node:test';
import { gradeWrittenNotes } from '../src/music/bewertung.mjs';

const C = {name:'c',octave:4,accidental:null};
const E = {name:'e',octave:4,accidental:null};
const G = {name:'g',octave:4,accidental:null};

test('geordnete Noteneingabe: die Position zählt', () => {
  assert.deepEqual(gradeWrittenNotes([C,E,G],[C,E,G]),{
    results:[true,true,true], allCorrect:true,
  });
  assert.deepEqual(gradeWrittenNotes([G,E,C],[C,E,G]),{
    results:[false,true,false], allCorrect:false,
  });
});

test('gestapelte Akkorde: Reihenfolge beliebig, keine doppelte Gutschrift', () => {
  assert.deepEqual(gradeWrittenNotes([G,E,C],[C,E,G],true),{
    results:[true,true,true],allCorrect:true,
  });
  assert.deepEqual(gradeWrittenNotes([C,C,G],[C,E,G],true),{
    results:[true,false,true],allCorrect:false,
  });
  assert.deepEqual(gradeWrittenNotes([C,C],[C,C],true),{
    results:[true,true],allCorrect:true,
  });
});

test('enharmonisch gleichwertige Noten gelten nur bei Freigabe als korrekt', () => {
  const cis = {name:'c',octave:4,accidental:'#'};
  const des = {name:'d',octave:4,accidental:'b'};
  assert.deepEqual(gradeWrittenNotes([des],[cis]),{results:[false],allCorrect:false});
  assert.deepEqual(gradeWrittenNotes([des],[cis],false,true),{results:[true],allCorrect:true});
});

test('Aufgabe mit abweichender Anzahl wird nicht als vollständig richtig bewertet', () => {
  assert.deepEqual(gradeWrittenNotes([C],[C,E]),{results:[true],allCorrect:false});
  assert.deepEqual(gradeWrittenNotes([C,E],[C]),{results:[true,false],allCorrect:false});
  assert.deepEqual(gradeWrittenNotes([],[]),{results:[],allCorrect:true});
  assert.deepEqual(gradeWrittenNotes([],[C]),{results:[],allCorrect:false});
});

test('Auflösungszeichen wird wie kein Vorzeichen behandelt', () => {
  const cNatural={name:'c',octave:4,accidental:'n'};
  assert.deepEqual(gradeWrittenNotes([cNatural],[C]),{results:[true],allCorrect:true});
});

test('Bewertung verändert weder eingegebene noch erwartete Noten', () => {
  const entered=structuredClone([G,E,C]);
  const expected=structuredClone([C,E,G]);
  const a=structuredClone(entered),b=structuredClone(expected);
  gradeWrittenNotes(entered,expected,true);
  assert.deepEqual(entered,a);
  assert.deepEqual(expected,b);
});
