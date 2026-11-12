import test from 'node:test';
import assert from 'node:assert/strict';
import {
  duelTimeProgress, recordDuelAnswer,
  allDuelPlayersAnswered, nextDuelRoundIndex,
} from '../src/duell/rundensteuerung.mjs';

function players(count = 3) {
  return Array.from({length:count},(_,id)=>({
    id,score:id*100,streak:id,answer:null,time:null,perm:[2,0,3,1],gain:0,
  }));
}

test('Rundenzeit: Start, Halbzeit, Ablauf und Überziehung', () => {
  const deadline=15000,duration=12000;
  assert.deepEqual(duelTimeProgress(3000,deadline,duration),{percent:100,expired:false});
  assert.deepEqual(duelTimeProgress(9000,deadline,duration),{percent:50,expired:false});
  assert.deepEqual(duelTimeProgress(15000,deadline,duration),{percent:0,expired:true});
  assert.deepEqual(duelTimeProgress(15001,deadline,duration),{percent:0,expired:true});
});

test('Rundenzeit: Zeit vor dem Start und Ablaufgrenze bleiben unverändert', () => {
  const early=duelTimeProgress(0,12000,12000);
  assert.equal(early.percent,100);
  assert.equal(early.expired,false);
  const future=duelTimeProgress(-100,12000,12000);
  assert.ok(future.percent>100,'bisher keine obere Begrenzung beim Anzeigeprozentsatz');
  const zero=duelTimeProgress(12000,12000,12000);
  assert.equal(zero.expired,true);
});

test('Antwortindex wird aus der individuellen Permutation aufgelöst', () => {
  const initial=players();
  const old=structuredClone(initial);
  let calls=0;
  const updated=recordDuelAnswer(initial,1,2,()=>{calls++;return 7890});
  assert.equal(calls,1);
  assert.notEqual(updated,initial);
  assert.notEqual(updated[1],initial[1]);
  assert.equal(updated[1].answer,3);
  assert.equal(updated[1].time,7890);
  assert.equal(updated[1].score,100);
  assert.equal(updated[1].streak,1);
  assert.deepEqual(updated[0],initial[0]);
  assert.deepEqual(initial,old,'die ursprüngliche Spielerliste bleibt erhalten');
});

test('Verteilung der Antworten auf drei Spieler beendet die Runde erst mit der letzten Antwort', () => {
  const original=players();
  const first=recordDuelAnswer(original,0,1,()=>100);
  assert.equal(allDuelPlayersAnswered(first),false);
  const second=recordDuelAnswer(first,2,3,()=>140);
  assert.equal(allDuelPlayersAnswered(second),false);
  const third=recordDuelAnswer(second,1,0,()=>160);
  assert.equal(allDuelPlayersAnswered(third),true);
  assert.deepEqual(third.map(p=>p.answer),[0,2,1]);
  assert.deepEqual(third.map(p=>p.time),[100,160,140]);
});

test('Undefinierte Antwort gilt weiterhin als beantwortet (historische Regel)', () => {
  const p=players(2);
  p[0].answer=undefined;
  assert.equal(allDuelPlayersAnswered(p),false);
  p[1].answer=0;
  assert.equal(allDuelPlayersAnswered(p),true);
  assert.equal(allDuelPlayersAnswered([]),true,'every() ist bei leerem Array true');
});

test('Antwortaufnahme ruft den Zeitgeber genau einmal auf, und zwar nach der Wahl', () => {
  const list=players(1);
  const order=[];
  const player=list[0];
  const perm=new Proxy(player.perm,{get(target,key){if(key==='0')order.push('option');return Reflect.get(target,key)}});
  const next=recordDuelAnswer([{...player,perm}],0,0,()=>{order.push('time');return 0});
  assert.deepEqual(order,['option','time']);
  assert.equal(next[0].answer,2);
  assert.equal(next[0].time,0);
});

test('Fragenwechsel: nächste Frage, letzte Frage und leerer Aufgabenpool', () => {
  assert.equal(nextDuelRoundIndex(0,10),1);
  assert.equal(nextDuelRoundIndex(8,10),9);
  assert.equal(nextDuelRoundIndex(9,10),null);
  assert.equal(nextDuelRoundIndex(0,1),null);
  assert.equal(nextDuelRoundIndex(0,0),null);
});

test('Rundenendzustand bleibt unabhängig von Punktewert und Antwortzeit', () => {
  const p=players(2);
  p[0]={...p[0],answer:0,time:0,score:100000};
  p[1]={...p[1],answer:1,time:9999,score:0};
  assert.equal(allDuelPlayersAnswered(p),true);
});
