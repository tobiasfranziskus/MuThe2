import test from 'node:test';
import assert from 'node:assert/strict';
import {createDuelQuestionPool} from '../src/duell/aufgabenpool.mjs';

function seeded(seed){
  let value=seed>>>0;
  return()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296};
}
function makePool(){
  const levels={noten:[],intervalle:[]};
  let serial=0;
  const sections=[
    {id:'noten',gens:[function noteName(level='mixed'){
      levels.noten.push(level);
      return {mode:'mc',q:'Notenfrage '+(++serial),staff:{clef:level,notes:[{name:'c',octave:4}]},
        options:['c','d','e','f'],correct:0,explanation:'Note'};
    }]},
    {id:'intervalle',gens:[function intervals(level='mixed'){
      levels.intervalle.push(level);
      return {mode:'mc',q:'Intervallfrage '+(++serial),staff:{clef:level,notes:[{name:'e',octave:4}]},
        options:['Terz','Quarte','Quinte','Oktave'],correct:0,explanation:'Intervall'};
    }]},
  ];
  const pool=createDuelQuestionPool({
    sections,shuffle:items=>[...items],
    adaptQuestion:(g,task)=>task,
    questionKey:task=>task.q,
    renderStaff:task=>'<svg data-clef="'+task.clef+'"></svg>',
    renderGrandStaff:()=>'<svg></svg>',
    fallbackQuestions:[],
  });
  return {pool,levels};
}

test('Notennamen im Duell lassen sich ausschließlich im Violinschlüssel spielen',()=>{
  const {pool,levels}=makePool();
  const rounds=pool(24,'noten',['treble']);
  assert.equal(rounds.length,24);
  assert.ok(rounds.every(q=>q.svgHtml.includes('data-clef="treble"')));
  assert.ok(levels.noten.every(level=>level==='treble'));
});

test('Notennamen im Duell lassen sich ausschließlich im Bassschlüssel spielen',()=>{
  const {pool,levels}=makePool();
  const rounds=pool(24,'noten',['bass']);
  assert.equal(rounds.length,24);
  assert.ok(rounds.every(q=>q.svgHtml.includes('data-clef="bass"')));
  assert.ok(levels.noten.every(level=>level==='bass'));
});

test('Gemischte Notennamenaufgaben verwenden nur Violin und Bass, nie Alt',()=>{
  const original=Math.random;
  try{
    Math.random=seeded(20261103);
    const {pool,levels}=makePool();
    const questions=pool(80,'noten',['treble','bass']);
    assert.equal(questions.length,80);
    assert.ok(levels.noten.includes('treble'));
    assert.ok(levels.noten.includes('bass'));
    assert.ok(levels.noten.every(level=>['treble','bass'].includes(level)));
    assert.ok(questions.every(question=>/data-clef="(treble|bass)"/.test(question.svgHtml)));
  }finally{Math.random=original;}
});

test('In gemischten Duellen gilt die Schlüsselwahl ausschließlich für Notennamen',()=>{
  const {pool,levels}=makePool();
  const result=pool(90,'all',['bass']);
  assert.equal(result.length,90);
  assert.ok(levels.noten.length>0 && levels.intervalle.length>0);
  assert.ok(levels.noten.every(level=>level==='bass'),'Notennamen verwenden Bass');
  assert.ok(levels.intervalle.every(level=>level==='mixed'),'Intervalle bleiben unverändert gemischt');
  assert.ok(result.some(q=>q.prompt.startsWith('Notenfrage')));
  assert.ok(result.some(q=>q.prompt.startsWith('Intervallfrage')));
});

test('Bei ausschließlich Intervallen ist die Notennamen-Auswahl wirkungslos',()=>{
  const {pool,levels}=makePool();
  const result=pool(18,'intervalle',['treble']);
  assert.equal(result.length,18);
  assert.ok(levels.intervalle.every(level=>level==='mixed'));
});

test('Unerlaubte Schlüssel werden auch über die Programmschnittstelle ausgeschlossen',()=>{
  for(const selection of [['alto'],[],['alto','bass']]){
    const {pool,levels}=makePool();
    pool(12,'noten',selection);
    assert.ok(levels.noten.length>0);
    assert.ok(levels.noten.every(clef=>clef!=='alto'));
    assert.ok(levels.noten.every(clef=>clef==='treble'||clef==='bass'));
  }
});

test('Ohne eine neue Schlüsselauswahl bleibt der historische gemischte Modus erhalten',()=>{
  const {pool,levels}=makePool();
  const result=pool(12,'noten');
  assert.equal(result.length,12);
  assert.ok(levels.noten.every(level=>level==='mixed'));
});
