import test from 'node:test';
import assert from 'node:assert/strict';
import {createDuelSessionHook} from '../src/duell/sitzung.mjs';

function simulatedReact() {
  const slots=[];let cursor=0;
  const React={
    useState(initial){
      const id=cursor++;
      if(!slots[id])slots[id]={type:'state',value:initial};
      const slot=slots[id];
      return [slot.value,next=>{slot.value=typeof next==='function'?next(slot.value):next;}];
    },
    useRef(initial){
      const id=cursor++;
      if(!slots[id])slots[id]={type:'ref',value:{current:initial}};
      return slots[id].value;
    },
    useEffect(){cursor++},
  };
  return {React,render(fn){cursor=0;return fn();},slots};
}
const questions=[
  {prompt:'Frage 1',options:['c','d','e','f'],correct:0},
  {prompt:'Frage 2',options:['a','b','c','d'],correct:0},
];
test('Duell ohne Zeitlimit erzeugt keinen Browser-Timer und wird durch letzte Antwort beendet',()=>{
  const runtime=simulatedReact(),feedback=[];
  const use=createDuelSessionHook({React:runtime.React,generateQuestions:()=>questions,
    playFeedback:correct=>feedback.push(correct)});
  const render=()=>runtime.render(()=>use(true,['treble','bass']));
  let s=render();
  s.l(0); // keine Uhr
  s=render();
  assert.equal(s.c,0);
  s.ae();
  s=render();
  assert.equal(s.T.current,null,'kein Timer gestartet');
  assert.equal(s.E.current.length,2);
  s.O(0,0);
  s=render();
  assert.equal(s.x,false,'erste Antwort beendet nicht die ganze Runde');
  s.O(1,0);
  s=render();
  assert.equal(s.x,true,'zweite Antwort schließt die Runde ab');
  assert.equal(feedback.length,1);
  s.se(s.E.current,'erneut',questions[0]);
  assert.equal(feedback.length,1,'doppelte Bewertung verhindert');
  s.ce();
  s=render();
  assert.equal(s.g,1);
  assert.equal(s.T.current,null,'auch zweite Runde ist zeitfrei');
});

test('Stoppuhr-Regeln für reguläre Duelle bleiben separat abgedeckt',()=>{
  const runtime=simulatedReact();
  const use=createDuelSessionHook({React:runtime.React,generateQuestions:()=>questions,playFeedback:()=>{}});
  const s=runtime.render(()=>use(true,['treble','bass']));
  assert.equal(s.c,15,'Standardauswahl und tatsächlich laufende Uhr stimmen überein');
});

test('Mehrfinger-Antworten werden auch ohne Zwischenrender beide registriert',()=>{
  const runtime=simulatedReact();
  const use=createDuelSessionHook({React:runtime.React,generateQuestions:()=>questions,playFeedback:()=>{}});
  const render=()=>runtime.render(()=>use(true,['treble']));
  let s=render();s.l(0);s=render();s.ae();s=render();
  s.O(0,1);s.O(1,0);
  s=render();
  assert.equal(s.E.current[0].answer,s.E.current[0].perm[1]);
  assert.equal(s.E.current[1].answer,s.E.current[1].perm[0]);
  assert.equal(s.x,true);
  assert.equal(s.T.current,null);
});

test('Eigene Duell-Themenauswahl wird an den Fragenpool übergeben',()=>{
  const runtime=simulatedReact(),calls=[];
  const use=createDuelSessionHook({React:runtime.React,
    generateQuestions:(count,topics,clefs)=>{calls.push({count,topics,clefs});return questions;},
    playFeedback:()=>{}});
  const render=()=>runtime.render(()=>use(true,['treble'],['noten','intervalle']));
  let session=render();
  session.d('custom');
  session.l(0); // Ohne Browser-Timer testbar
  session=render();
  session.ae();
  assert.deepEqual(calls,[{count:15,topics:['noten','intervalle'],clefs:['treble']}]);
  assert.equal(render().n,true);
});
test('Duell mit leerer individueller Auswahl startet nicht',()=>{
  const runtime=simulatedReact(),calls=[];
  const use=createDuelSessionHook({React:runtime.React,
    generateQuestions:()=>{calls.push('attempt');return [];},playFeedback:()=>{}});
  const render=()=>runtime.render(()=>use(true,['treble'],[]));
  let session=render();session.d('custom');session=render();session.ae();
  assert.deepEqual(calls,['attempt']);
  assert.equal(render().n,false);
});
