import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePracticePlan,practiceLink,readPracticeLink,generatePracticeRound,
  updateLearningErrors,learningSummary,kindOfTask,taskErrorKey,
} from '../src/unterricht/lernplan.mjs';
import {createPracticeWidgets} from '../src/unterricht/oberflaeche.mjs';

function seeded(seed) {
  let state=seed>>>0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
}
const question=(id,mode='mc')=>({
  mode,q:'Test '+id,options:mode==='mc'?['c','d','e','f']:undefined,
  correct:0,expected:mode==='staff'?[{name:'c',octave:4}]:undefined,
});
const section={id:'noten',gens:[
  function chooseNote(){return question('Note '+Math.random(),'mc')},
  function Te(){return question('Enharmonik '+Math.random(),'mc')},
  function placeNote(){return question('Setze '+Math.random(),'staff')},
  function typeNote(){return question('Schreibe '+Math.random(),'text')},
]};

test('Pläne werden validiert und enthalten sinnvolle Standardwerte',()=>{
  assert.deepEqual(normalizePracticePlan(),{count:10,mode:'all',difficulty:'standard',clef:'mixed',focusErrors:false});
  assert.deepEqual(normalizePracticePlan({count:400,mode:'invalid',difficulty:'invalid',clef:'invalid',focusErrors:true},'treble'),
    {count:30,mode:'all',difficulty:'standard',clef:'treble',focusErrors:true});
  assert.equal(normalizePracticePlan({count:-8}).count,5);
  assert.equal(normalizePracticePlan({count:'15'}).count,15);
  assert.equal(normalizePracticePlan({count:null}).count,10);
});

test('Unterrichtslinks sind rundreisefest und enthalten keine Daten zu Lernenden',()=>{
  const input={count:15,mode:'staff',difficulty:'beginner',clef:'bass',focusErrors:false};
  const url=practiceLink('https://example.org/Musik-Theorie/?other=private#history','noten',input);
  const parsed=new URL(url);
  assert.equal(parsed.pathname,'/Musik-Theorie/');
  assert.equal(parsed.searchParams.get('other'),null);
  assert.equal(parsed.hash,'');
  assert.deepEqual(readPracticeLink(parsed.search),{topic:'noten',plan:input});
  assert.equal(readPracticeLink('?thema=../../etc'),null);
  assert.equal(readPracticeLink('?thema='),null);
  assert.equal(readPracticeLink(''),null);
  assert.equal(readPracticeLink('?thema=noten&anzahl=999&art=invalid').plan.count,30);
});

test('Runden können auf Multiple Choice, Notensetzen und Texteingabe begrenzt werden',()=>{
  for(const mode of ['mc','staff','text']){
    const tasks=generatePracticeRound({section,plan:{count:15,mode},taskSignature:t=>t.q,random:seeded(1337)});
    assert.equal(tasks.length,15);
    assert.ok(tasks.every(t=>t.mode===mode));
    assert.ok(tasks.every(t=>t._practice.topic==='noten' && Number.isInteger(t._practice.generatorIndex)));
  }
});

test('Anfänger überspringen die enharmonischen Fragen',()=>{
  const tasks=generatePracticeRound({section,plan:{count:25,difficulty:'beginner'},taskSignature:t=>t.q,random:seeded(111)});
  assert.equal(tasks.length,25);
  assert.ok(tasks.every(t=>t._practice.generatorIndex!==1));
});

test('Gezieltes Fehlertraining erhöht den Anteil des problematischen Aufgabentyps',()=>{
  const errors={'noten:2':{correct:1,wrong:12}};
  const ordinary=generatePracticeRound({section,plan:{count:30},errors,taskSignature:t=>t.q,random:seeded(711)});
  const focus=generatePracticeRound({section,plan:{count:30,focusErrors:true},errors,taskSignature:t=>t.q,random:seeded(711)});
  const count=tasks=>tasks.filter(t=>t._practice.generatorIndex===2).length;
  assert.ok(count(focus)>count(ordinary)+5, 'Fehlergenerator sollte klar bevorzugt werden');
  assert.ok(count(focus)>=14);
});

test('Fehlerhistorie bleibt korrekt und Eingangsdaten werden nicht verändert',()=>{
  const errors={};
  const task={mode:'mc',_practice:{topic:'noten',generatorIndex:0,kind:'mc'}};
  const first=updateLearningErrors(errors,task,false);
  const second=updateLearningErrors(first,task,false);
  const third=updateLearningErrors(second,task,true);
  assert.deepEqual(third,{'noten:0':{correct:1,wrong:2}});
  assert.deepEqual(errors,{});
  assert.equal(learningSummary(third,'noten')[0].weak,true);
  assert.equal(taskErrorKey('noten',0),'noten:0');
  assert.equal(updateLearningErrors(third,question('untracked'),true),third);
  assert.equal(kindOfTask({mode:'bogus'}),null);
});

test('Schwierigkeitsgrad hat außerhalb der Notennamen keine Enharmonik-Nebenwirkungen',()=>{
  let count=0;
  const other={id:'intervalle',gens:[()=>question(++count,'mc')]};
  const tasks=generatePracticeRound({section:other,plan:{count:10,difficulty:'beginner'},taskSignature:t=>t.q,random:seeded(19)});
  assert.equal(tasks.length,10);
});

test('Die Konfiguration ist als zustandsfreie JSX-Ansicht testbar',()=>{
  const I={jsx:(type,props,key)=>({type,props,key}),jsxs:(type,props,key)=>({type,props,key})};
  const {PracticeSetup,LearningProgress}=createPracticeWidgets(I);
  assert.equal(PracticeSetup({section:null}),null);
  const ui=PracticeSetup({
    section:{id:'noten',title:'Notennamen'},plan:{count:10,mode:'mc',difficulty:'beginner',clef:'bass'},
    onChange:()=>{},onStart:()=>{},onClose:()=>{},errors:{},
    shareUrl:'https://example.org/?thema=noten',onCopy:()=>{},copied:false,error:'',
  });
  assert.equal(ui.type,'section');
  assert.equal(ui.props.id,'practice-setup');
  const summary=LearningProgress({errors:{'noten:0':{correct:2,wrong:4}},sections:[{id:'noten',title:'Notennamen'}]});
  assert.equal(summary.type,'section');
});
