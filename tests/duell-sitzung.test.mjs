import test from 'node:test';
import assert from 'node:assert/strict';
import {createDuelSessionHook} from '../src/duell/sitzung.mjs';
import {createDuelPlayers,prepareDuelRoundPlayers,scoreDuelRound} from '../src/duell/spielregeln.mjs';
import {recordDuelAnswer,allDuelPlayersAnswered,nextDuelRoundIndex} from '../src/duell/rundensteuerung.mjs';
import {startDuelRoundTimer} from '../src/duell/timer.mjs';

/**
 * Eingefrorener Duell-Hook aus PR #24 vor der Auslagerung.
 * Damit wird die komplette Reihenfolge von Hooks, Setter-Aufrufen,
 * Timer-Cleanup, Event-Sperren und Wertung gegen den Ursprung geprüft.
 */
const LEGACY_HOOK = "let[n,r]=(0,_.useState)(!1),[i,a]=(0,_.useState)(2),[o,s]=(0,_.useState)(15),[c,l]=(0,_.useState)(15),[u,d]=(0,_.useState)(`all`),[f,p]=(0,_.useState)([`Spieler 1`,`Spieler 2`,`Spieler 3`,`Spieler 4`]),[m,h]=(0,_.useState)([]),[g,v]=(0,_.useState)(0),[y,b]=(0,_.useState)([]),[x,ee]=(0,_.useState)(!1),[te,ne]=(0,_.useState)(``),[S,re]=(0,_.useState)(100),[C,w]=(0,_.useState)(!1),T=(0,_.useRef)(null),E=(0,_.useRef)([]),D=(0,_.useRef)(!1),ie=e=>{E.current=e,b(e)};(0,_.useEffect)(()=>{(!e||!n)&&T.current&&clearInterval(T.current)},[e,n]),(0,_.useEffect)(()=>()=>{T.current&&clearInterval(T.current)},[]);let ae=()=>{let e=$t(o,u),t=createDuelPlayers(i,f);h(e),v(0),ie(t),D.current=!1,ee(!1),w(!1),r(!0),oe(e[0],t)},oe=(e,t)=>{T.current&&clearInterval(T.current),D.current=!1,ee(!1),ne(``),re(100);let n=prepareDuelRoundPlayers(t,e.options);ie(n);T.current=startDuelRoundTimer({seconds:c,now:()=>performance.now(),schedule:(tick,ms)=>window.setInterval(tick,ms),cancel:id=>clearInterval(id),onProgress:percent=>re(percent),onExpired:()=>se(E.current,`Zeit abgelaufen!`,e)})},O=(e,t)=>{if(D.current)return;let n=E.current[e];if(n.answer!==null)return;let i=recordDuelAnswer(E.current,e,t,()=>performance.now());ie(i),allDuelPlayersAnswered(i)&&(T.current&&clearInterval(T.current),se(i,`Alle haben geantwortet!`,m[g]))},se=(e,t,n)=>{if(D.current)return;D.current=!0,ee(!0),ne(t),T.current&&clearInterval(T.current);let a=scoreDuelRound(e,n.correct);ie(a.players),qt(a.anyCorrect)},ce=()=>{let e=nextDuelRoundIndex(g,m.length);if(e===null){w(!0);return}v(e),oe(m[e],E.current)};";
const fields = "n,r,i,a,o,s,c,l,u,d,f,p,m,h,g,v,y,b,x,ee,te,ne,S,re,C,w,T,E,D,ie,ae,oe,O,se,ce";

function oldHook(React,questions,feedback){
  const compiled=Function('_','$t','qt','createDuelPlayers','prepareDuelRoundPlayers',
    'scoreDuelRound','recordDuelAnswer','allDuelPlayersAnswered','nextDuelRoundIndex',
    'startDuelRoundTimer','return function(e){'+LEGACY_HOOK+';return {'+fields+'};};');
  return compiled(React,questions,feedback,createDuelPlayers,prepareDuelRoundPlayers,
    scoreDuelRound,recordDuelAnswer,allDuelPlayersAnswered,nextDuelRoundIndex,startDuelRoundTimer);
}

function seeded(seed){
  let x=seed>>>0;
  return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};
}

function execute(useOld,seed){
  const previous={
    random:Math.random,
    performance:Object.getOwnPropertyDescriptor(globalThis,'performance'),
    window:Object.getOwnPropertyDescriptor(globalThis,'window'),
    clearInterval:Object.getOwnPropertyDescriptor(globalThis,'clearInterval'),
  };
  const slots=[],effects=[],events=[],active=new Map();
  let hookIndex=0,clock=1000+seed,serial=0;
  const React={
    useState(initial){
      const index=hookIndex++;
      if(index>=slots.length)slots.push({kind:'state',value:initial});
      assert.equal(slots[index].kind,'state');
      return [slots[index].value,value=>{
        const updated=typeof value==='function'?value(slots[index].value):value;
        slots[index].value=updated;
        events.push(['set',index,updated]);
      }];
    },
    useRef(initial){
      const index=hookIndex++;
      if(index>=slots.length)slots.push({kind:'ref',current:initial});
      assert.equal(slots[index].kind,'ref');
      return slots[index];
    },
    useEffect(callback,deps){
      const index=hookIndex++;
      effects.push({index,callback,deps});
    },
  };
  const questions=()=>[
    {mode:'mc',prompt:'Tonleiter',options:['C','D','E','F'],correct:0},
    {mode:'mc',prompt:'Akkord',options:['G','A','B','C'],correct:1},
  ];
  const feedback=value=>events.push(['audio',value]);
  const timer={
    setInterval(callback,delay){
      const id=++serial;
      active.set(id,callback);
      events.push(['schedule',id,delay]);
      return id;
    },
    clearInterval(id){
      active.delete(id);
      events.push(['clear',id]);
    },
  };
  Object.defineProperty(globalThis,'performance',{configurable:true,value:{now:()=>clock}});
  Object.defineProperty(globalThis,'window',{configurable:true,value:timer});
  Object.defineProperty(globalThis,'clearInterval',{configurable:true,value:timer.clearInterval});
  Math.random=seeded(seed);
  const render=useOld?oldHook(React,questions,feedback)
    :createDuelSessionHook({React,generateQuestions:questions,playFeedback:feedback});
  const state=()=>{
    const json=JSON.parse(JSON.stringify(slots,(key,value)=>typeof value==='function'?'[function]':value));
    return {slots:json,events:structuredClone(events),active:[...active.keys()]};
  };
  const checkpoints=[];
  try{
    function rerender(open){
      hookIndex=0;
      effects.length=0;
      const session=render(open);
      assert.equal(hookIndex,18,'13 useState, 3 useRef und 2 useEffect in gleicher Reihenfolge');
      return session;
    }
    let session=rerender(true);
    checkpoints.push(state());
    session.ae();
    checkpoints.push(state());
    session=rerender(true);
    session.O(0,0);
    checkpoints.push(state());
    session.O(0,1); // gesperrt: Zweitantwort
    checkpoints.push(state());
    session.O(1,0); // letzte Antwort beendet Runde
    checkpoints.push(state());
    session.se(session.E.current,'Erneut abschließen',session.m[0]); // gesperrt: Zweitwertung
    checkpoints.push(state());
    session=rerender(true);
    session.ce(); // nächste Runde startet
    checkpoints.push(state());
    session=rerender(true);
    clock+=20000;
    const callback=active.get(session.T.current);
    assert.equal(typeof callback,'function');
    callback(); // Timerablauf wertet genau einmal aus
    checkpoints.push(state());
    session=rerender(true);
    session.ce(); // Ergebnis anzeigen
    checkpoints.push(state());
    session=rerender(false);
    for(const eff of effects)eff.callback(); // Schließen bereinigt Timer
    checkpoints.push(state());
    return {checkpoints,final:state()};
  }finally{
    Math.random=previous.random;
    for(const name of ['performance','window','clearInterval']){
      const original=previous[name];
      if(original)Object.defineProperty(globalThis,name,original);
      else delete globalThis[name];
    }
  }
}

test('Historische Event- und Hookreihenfolge bleibt in 150 Duellabläufen exakt gleich',()=>{
  for(let seed=1;seed<=150;seed++){
    const old=execute(true,seed);
    const updated=execute(false,seed);
    assert.deepEqual(updated,old,'Szenario '+seed);
  }
});

test('Gesperrte Doppelantwort und Mehrfachwertung bleiben folgenlos',()=>{
  const {checkpoints}=execute(false,42);
  assert.deepEqual(checkpoints[2],checkpoints[3],'zweite Antwort darf nichts ändern');
  assert.deepEqual(checkpoints[4],checkpoints[5],'zweite Auswertung darf nichts ändern');
});

test('Zwei bis vier Spieler und das ursprünglich verwendete Fragenlimit bleiben erhalten',()=>{
  const {checkpoints}=execute(false,27);
  const start=checkpoints[1];
  const playerState=start.slots.find(slot=>slot.kind==='ref'&&Array.isArray(slot.current)&&slot.current.length===2);
  assert.ok(playerState,'Spieler-Referenz initialisiert');
  assert.equal(playerState.current.length,2);
  const original=execute(true,27);
  assert.deepEqual(start,original.checkpoints[1]);
});

test('Timer wird nach Ablauf und Dialogschließung abgebrochen',()=>{
  const {checkpoints}=execute(false,84);
  assert.equal(checkpoints[7].active.length,0,'Zeitablauf löscht das Intervall');
  assert.ok(checkpoints[7].events.some(item=>item[0]==='audio'),'Ergebnis wird einmal signalisiert');
  assert.equal(checkpoints[9].active.length,0,'beim Schließen bleibt kein Timer aktiv');
});
