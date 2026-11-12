import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {playableTaskAudio,playTaskAudio} from '../src/music/beispiel-audio.mjs';

const pitch={name:'c',octave:4},second={name:'e',octave:4};
const calls=[];
const player={playNotes:(...args)=>calls.push(['notes',...args]),
  playRhythm:notes=>calls.push(['rhythm',notes]),
  playChords:chords=>calls.push(['chords',chords])};
test('Stumme Aufgaben ohne Noten bzw. mit Pausen zeigen keinen Hörknopf',()=>{
  assert.equal(playableTaskAudio({staff:{notes:[]}}),null);
  assert.equal(playableTaskAudio({staff:{notes:[{...pitch,value:'rquarter'}]}}),null);
  assert.equal(playTaskAudio({staff:{notes:[]}},player),false);
});
test('Notierte Tonfolge und Rhythmus werden korrekt abgespielt',()=>{
  calls.length=0;
  const notes=[pitch,second];
  assert.equal(playTaskAudio({staff:{notes}},player),true);
  assert.deepEqual(calls.pop(),['notes',notes,true]);
  const rhythm=[{...pitch,value:'quarter'},{...second,value:'rquarter'}];
  assert.equal(playTaskAudio({staff:{notes:rhythm}},player),true);
  assert.deepEqual(calls.pop(),['rhythm',rhythm]);
});
test('Gehörbildung unterscheidet Melodie und Akkord',()=>{
  calls.length=0;const expected=[pitch,second];
  playTaskAudio({expected,audioMode:'melodic'},player);
  assert.deepEqual(calls.pop(),['notes',expected,true]);
  playTaskAudio({expected,audioMode:'chord'},player);
  assert.deepEqual(calls.pop(),['notes',expected,false]);
});
test('Klaviersystem: Kadenzen werden gespielt',()=>{
  calls.length=0;
  const chords=[{treble:[pitch],bass:[second]}];
  playTaskAudio({staff:{chords}},player);
  assert.deepEqual(calls.pop(),['chords',chords]);
});
test('Echter Anwendungscode verwendet die Audioentscheidung und reaktiviert iOS-Audio',()=>{
  const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
  assert.match(app,/playableTaskAudio\(N\)/);
  assert.match(app,/playTaskAudio\(N,\{playNotes:Ut,playRhythm:Gt,playChords:Kt\}\)/);
  assert.match(app,/Bt\.state!==`running`/);
});
