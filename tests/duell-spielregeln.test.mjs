import test from 'node:test';
import assert from 'node:assert/strict';
import {createDuelPlayers, prepareDuelRoundPlayers, scoreDuelRound} from '../src/duell/spielregeln.mjs';

function seeded(seed) {
  let state=seed>>>0, calls=0;
  const random=()=>{calls++;state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  return {random, calls:()=>calls};
}

test('zwei bis vier Spieler erhalten unabhängige Konten und Standardnamen', () => {
  const names=[' Alice ',' ','Carla','David'];
  for (const count of [2,3,4]) {
    const players=createDuelPlayers(count,names);
    assert.equal(players.length,count);
    assert.deepEqual(players.map(p=>p.name),['Alice','Spieler 2','Carla','David'].slice(0,count));
    for(let id=0;id<count;id++){
      assert.deepEqual(players[id],{
        id,name:players[id].name,score:0,streak:0,answer:null,time:null,perm:[],gain:0,
      });
    }
  }
  assert.deepEqual(names,[' Alice ',' ','Carla','David']);
});

test('Antworten werden pro Person mit unveränderter Fisher-Yates-Folge gemischt', () => {
  const original=createDuelPlayers(4,['A','B','C','D']);
  const before=structuredClone(original);
  const seededRandom=seeded(42);
  const options=['a','b','c','d'];
  const shuffled=prepareDuelRoundPlayers(original,options,seededRandom.random);
  assert.equal(seededRandom.calls(),4*(options.length-1));
  assert.deepEqual(original,before,'die ursprünglichen Spielerdaten werden nicht verändert');
  assert.deepEqual(options,['a','b','c','d']);
  for(const p of shuffled) {
    assert.deepEqual([...p.perm].sort((a,b)=>a-b),[0,1,2,3]);
    assert.equal(p.answer,null);
    assert.equal(p.time,null);
    assert.equal(p.gain,0);
  }
  assert.equal(new Set(shuffled.map(p=>p.perm.join(','))).size>1,true,'individuelle Antwortreihenfolgen');
});

test('Neue Runde erhält Punktestand und Serie, löscht aber alte Antworten', () => {
  const current=[{...createDuelPlayers(1,['A'])[0],score:720,streak:3,answer:2,time:500,gain:200,perm:[2,1,0]}];
  const next=prepareDuelRoundPlayers(current,['a','b','c'],()=>0.5);
  assert.equal(next[0].score,720);
  assert.equal(next[0].streak,3);
  assert.equal(next[0].answer,null);
  assert.equal(next[0].time,null);
  assert.equal(next[0].gain,0);
  assert.deepEqual(current[0].perm,[2,1,0]);
});

test('Punkte: 100 richtig, 100 Serienbonus ab drei, 50 für Schnellsten', () => {
  const players=[
    {...createDuelPlayers(1,['A'])[0],answer:2,time:110,streak:0,score:200},
    {...createDuelPlayers(1,['B'])[0],answer:2,time:140,streak:2,score:300},
    {...createDuelPlayers(1,['C'])[0],answer:1,time:70,streak:5,score:500},
  ];
  const snapshot=structuredClone(players);
  const result=scoreDuelRound(players,2);
  assert.equal(result.anyCorrect,true);
  assert.deepEqual(result.players.map(p=>[p.score,p.gain,p.streak]),[
    [350,150,1],[500,200,3],[500,0,0],
  ]);
  assert.deepEqual(players,snapshot,'Punkteauswertung verändert Spieler-Originaldaten nicht');
});

test('Bei Zeitgleichheit gewinnt der zuerst geführte richtige Spieler den Bonus', () => {
  const players=createDuelPlayers(3,['A','B','C']).map((p,i)=>({...p,answer:1,time:i===2?10:100}));
  const {players:scored}=scoreDuelRound(players,1);
  assert.deepEqual(scored.map(p=>p.gain),[100,100,150]);
  const tied=players.map(p=>({...p,time:100}));
  assert.deepEqual(scoreDuelRound(tied,1).players.map(p=>p.gain),[150,100,100]);
});

test('Unbeantwortete Runden und richtige Antworten ohne Zeitstempel', () => {
  const empty=createDuelPlayers(2,['A','B']);
  const noAnswer=scoreDuelRound(empty,0);
  assert.equal(noAnswer.anyCorrect,false);
  assert.deepEqual(noAnswer.players.map(p=>p.gain),[0,0]);
  const noTime=empty.map(p=>({...p,answer:0}));
  const scored=scoreDuelRound(noTime,0);
  assert.equal(scored.anyCorrect,true);
  assert.deepEqual(scored.players.map(p=>p.gain),[100,100]);
});

test('Verteilung der Punkte bleibt bei wiederholten Runden korrekt', () => {
  let players=createDuelPlayers(2,['A','B']);
  for(let round=1;round<=4;round++){
    players=players.map((p,id)=>({...p,answer:id===0?1:0,time:id*20+10}));
    const result=scoreDuelRound(players,1);
    players=result.players;
    const expected=(round>=3?200:100)+50;
    assert.equal(players[0].gain,expected);
    assert.equal(players[1].gain,0);
    assert.equal(players[0].streak,round);
    assert.equal(players[1].streak,0);
  }
  assert.equal(players[0].score,150+150+250+250);
});
