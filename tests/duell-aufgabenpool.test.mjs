import test from 'node:test';
import assert from 'node:assert/strict';
import {createDuelQuestionPool} from '../src/duell/aufgabenpool.mjs';

function seed(seedValue) {
  let state=seedValue>>>0;
  return () => {
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    return state/4294967296;
  };
}
function fixture(seedValue=1234) {
  const random=seed(seedValue);
  const shuffle=items => {
    const copy=[...items];
    for(let i=copy.length-1;i>0;i--) {
      const j=Math.floor(random()*(i+1));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy;
  };
  let generated=0,hearingCalls=0;
  const sections=[
    {id:'notennamen',gens:[function noteName() {
      generated++;
      return {mode:'mc',q:'Ton '+Math.floor(random()*50),
        staff:{notes:[{name:'c',octave:4}]},
        options:['c','d','e','f'],correct:0,explanation:'Ton c'};
    }]},
    {id:'intervalle',gens:[function interval() {
      generated++;
      return {mode:'mc',q:'Intervall '+Math.floor(random()*30),
        staff:{chords:[{treble:[],bass:[]}]},
        options:['Terz','Quinte','Quarte'],correct:1,explanation:'Quinte'};
    }]},
    {id:'gehoer',gens:[function audio() {
      hearingCalls++;
      throw Error('Hörübungen dürfen nicht aufgerufen werden');
    }]},
  ];
  const fallbackQuestions=[['Ersatz A',['a','b','c'],1,'Ersatz'],['Ersatz B',['a','b','c'],2,'Ersatz']];
  return {
    input:{sections,shuffle,adaptQuestion:(_,q)=>q.mode==='mc'?q:null,
      questionKey:q=>q.q,renderGrandStaff:()=>'<piano/>',
      renderStaff:()=>'<staff/>',fallbackQuestions},
    calls:()=>({generated,hearingCalls}),random,
  };
}

test('Aufgaben werden für alle Kategorien durchmischt und mit SVG vorbereitet', () => {
  const f=fixture(701);
  const questions=createDuelQuestionPool(f.input)(14,'all');
  assert.equal(questions.length,14);
  assert.equal(new Set(questions.map(q=>q.prompt)).size,14,'keine Doppelaufgaben');
  assert.ok(questions.some(q=>q.svgHtml==='<staff/>'));
  assert.ok(questions.some(q=>q.svgHtml==='<piano/>'));
  for(const q of questions){
    assert.equal(typeof q.prompt,'string');
    assert.ok(q.options.length>=3);
    assert.ok(q.correct>=0&&q.correct<q.options.length);
  }
  assert.equal(f.calls().hearingCalls,0,'Gehöraufgaben bleiben ausgeschlossen');
});

test('Filter lässt nur Generatoren des gewählten Bereichs zu', () => {
  const f=fixture(4098);
  const questions=createDuelQuestionPool(f.input)(6,'notennamen');
  assert.equal(questions.length,6);
  assert.ok(questions.every(q=>q.svgHtml==='<staff/>'));
  assert.ok(questions.every(q=>q.prompt.startsWith('Ton ')));
  assert.equal(f.calls().hearingCalls,0);
});

test('Wenn kein Bereich passt, werden die bisher vorgesehenen Fallback-Fragen genutzt', () => {
  const f=fixture(281);
  const questions=createDuelQuestionPool(f.input)(8,'unbekannt');
  assert.equal(questions.length,2);
  assert.deepEqual(new Set(questions.map(q=>q.prompt)),new Set(['Ersatz A','Ersatz B']));
  assert.ok(questions.every(q=>q.svgHtml===''));
  assert.deepEqual(f.calls(),{generated:2,hearingCalls:0},
    'auch die ursprüngliche Eignungsprüfung läuft über alle Generatoren');
});

test('Leere Generatorliste und null angeforderte Aufgaben bleiben erlaubt', () => {
  const f=fixture(15);
  f.input.sections=[];
  const pool=createDuelQuestionPool(f.input);
  assert.deepEqual(pool(0,'all'),[]);
  assert.equal(pool(12,'all').length,2);
});

test('Fehlerhafte Generatoren und SVG-Ausgaben werden abgefangen', () => {
  let count=0;
  const basic=fixture(872).input;
  basic.sections=[
    {id:'broken',gens:[function bad() {throw Error('unlesbarer Generator');}]},
    {id:'valid',gens:[function good() {
      count++;
      return {mode:'mc',q:'Aufgabe '+count,options:['A','B'],correct:0,
        staff:{notes:[{name:'c',octave:4}]}};
    }]},
  ];
  basic.renderStaff=()=>{throw Error('SVG nicht erzeugbar')};
  const pool=createDuelQuestionPool(basic);
  const questions=pool(3,'all');
  assert.ok(questions.length<=2);
  assert.ok(questions.every(q=>q.svgHtml===''));
});

test('Identische Seeds ergeben exakt dieselbe Aufgabenfolge und denselben Zufallsverbrauch', () => {
  const a=fixture(912),b=fixture(912);
  const first=createDuelQuestionPool(a.input)(10,'all');
  const second=createDuelQuestionPool(b.input)(10,'all');
  assert.deepEqual(first,second);
  assert.deepEqual(a.calls(),b.calls());
  assert.equal(a.random(),b.random());
});

test('Mehrere ausgewählte Themen erzeugen nur Aufgaben aus diesen Bereichen', () => {
  const fixtureData=fixture(411);
  const pool=createDuelQuestionPool(fixtureData.input);
  const questions=pool(12,['intervalle','notennamen']);
  assert.equal(questions.length,12);
  assert.ok(questions.some(q=>q.prompt.startsWith('Ton ')));
  assert.ok(questions.some(q=>q.prompt.startsWith('Intervall ')));
  assert.ok(questions.every(q=>q.prompt.startsWith('Ton ')||q.prompt.startsWith('Intervall ')));
  assert.equal(fixtureData.calls().hearingCalls,0);
});
test('Individuell gewähltes Einzelthema bleibt auf dieses beschränkt', () => {
  const fixtureData=fixture(415);
  const questions=createDuelQuestionPool(fixtureData.input)(9,['intervalle']);
  assert.equal(questions.length,9);
  assert.ok(questions.every(q=>q.prompt.startsWith('Intervall ')));
});
test('Bei leerer oder unbekannter Themenauswahl keine fremden Ersatzfragen', () => {
  const fixtureData=fixture(416);
  const pool=createDuelQuestionPool(fixtureData.input);
  assert.deepEqual(pool(12,[]),[]);
  assert.deepEqual(pool(12,['gehoer','existiert-nicht']),[]);
});
test('Die Mehrfachauswahl bleibt bei identischen Seeds deterministisch', () => {
  const a=fixture(417),b=fixture(417);
  const selected=['notennamen','intervalle'];
  assert.deepEqual(createDuelQuestionPool(a.input)(12,selected),
    createDuelQuestionPool(b.input)(12,selected));
  assert.deepEqual(a.calls(),b.calls());
});
