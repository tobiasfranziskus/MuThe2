import test from 'node:test';
import assert from 'node:assert/strict';
import {createNoteNameTaskGenerators} from '../src/aufgaben/notennamen.mjs';
import {parseGermanNoteInput,formatGermanNote} from '../src/music/notennamen.mjs';

function seeded(seed){
  let state=seed>>>0;
  return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
function generators() {
  const choose = entries => entries[Math.floor(Math.random()*entries.length)];
  const randomInt = (a,b)=>a+Math.floor(Math.random()*(b-a+1));
  const shuffle = values => {
    const result=[...values];
    for(let index=result.length-1;index>0;index--){
      const other=randomInt(0,index);
      [result[index],result[other]]=[result[other],result[index]];
    }
    return result;
  };
  return createNoteNameTaskGenerators({
    chooseClef:clef=>clef==='mixed'?choose(['treble','bass','alto']):clef,
    choose,shuffle,randomInt,
    clefLabel:clef=>clef,
    staffExplanation:note=>formatGermanNote(note.name,note.octave,note.accidental),
    enharmonicExplanation:()=> 'Erklärung',
  });
}
function isNaturalAnswer(value) {
  return parseGermanNoteInput(value).some(note=>(note.accidental||null)===null);
}

test('Anfänger: 1800 Aufgaben ohne Vorzeichen in drei Notenschlüsseln',()=>{
  const original=Math.random;
  let total=0;
  try {
    const tasks=generators();
    for(const clef of ['treble','bass','alto','mixed']){
      Math.random=seeded(99177+clef.length);
      for(let round=0;round<150;round++){
        const mc=tasks.multipleChoice(clef,true);
        total++;
        assert.equal(mc.staff.notes[0].accidental,null);
        assert.equal(mc.options.length,4);
        assert.equal(new Set(mc.options).size,4);
        assert.ok(mc.options.every(isNaturalAnswer),'alle Antworten müssen Stammnoten sein');
        assert.equal(mc.options[mc.correct],
          formatGermanNote(mc.staff.notes[0].name,mc.staff.notes[0].octave,null));
        const placement=tasks.placement(clef,true);
        total++;
        assert.equal(placement.expected[0].accidental,null);
        assert.equal(placement.acceptEnharmonic,false);
        const text=tasks.textEntry(clef,true);
        total++;
        assert.equal(text.staff.notes[0].accidental,null);
        assert.equal(text.checkFn(text.correctDisplay),true);
        assert.ok(isNaturalAnswer(text.correctDisplay));
      }
    }
  } finally {Math.random=original;}
  assert.equal(total,1800);
});

test('Standardvariante erzeugt nach wie vor Vorzeichen und lässt Enharmonik zu',()=>{
  const original=Math.random;
  try {
    const tasks=generators();
    Math.random=seeded(928182);
    let withAccidental=0;
    for(let i=0;i<600;i++){
      const task=tasks.multipleChoice('treble');
      if(task.staff.notes[0].accidental!==null)withAccidental++;
    }
    assert.ok(withAccidental>80,'Standardvarianten behalten ♯ und ♭');
    const enharmonic=tasks.enharmonic();
    assert.equal(enharmonic.mode,'mc');
    assert.match(enharmonic.q,/enharmonische Verwechslung/);
  } finally{Math.random=original;}
});

test('Anfänger-Texteingabe akzeptiert Stammton, nicht aber zusätzliche Vorzeichen',()=>{
  const original=Math.random;
  try{
    const tasks=generators();
    Math.random=seeded(8823);
    for(let i=0;i<100;i++){
      const t=tasks.textEntry('treble',true);
      assert.equal(t.checkFn(t.correctDisplay),true);
      const actual=t.staff.notes[0];
      const raised=formatGermanNote(actual.name,actual.octave,'#');
      const lowered=formatGermanNote(actual.name,actual.octave,'b');
      assert.equal(t.checkFn(raised),false);
      assert.equal(t.checkFn(lowered),false);
    }
  }finally{Math.random=original;}
});

test('Nur die Anfänger-Aufgaben ändern sich: Standard-Parameter bleibt äquivalent',()=>{
  const original=Math.random;
  try{
    const tasks=generators();
    for(const clef of ['mixed','treble','bass','alto']){
      for(const gen of ['multipleChoice','placement','textEntry']){
        for(let seed=1;seed<=180;seed++){
          Math.random=seeded(seed*1967+clef.length);
          const a=tasks[gen](clef),nextA=Math.random();
          Math.random=seeded(seed*1967+clef.length);
          const b=tasks[gen](clef,false),nextB=Math.random();
          assert.deepEqual(
            gen==='textEntry'?{...a,checkFn:null}:{...a},
            gen==='textEntry'?{...b,checkFn:null}:{...b});
          assert.equal(nextA,nextB);
        }
      }
    }
  }finally{Math.random=original;}
});
