import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
test('Duell bietet weiterhin Alle und Einzelthema und zusätzlich Eigene Auswahl',()=>{
  assert.match(app,/value:`all`,className:`bg-slate-900 text-white`,children:`Alle Themen gemischt/);
  assert.match(app,/value:`custom`,className:`bg-slate-900 text-white`/);
  assert.match(app,/Et\.filter\(e=>e\.id!==`gehoer`\)\.map\(e=>\(0,I\.jsxs\)\(`option`/);
});
test('Checkliste erlaubt mehrere Themen, Alle/Keine und verhindert leeren Duellstart',()=>{
  assert.match(app,/Themen einzeln ein- oder ausschalten/);
  assert.match(app,/checked:duelTopicSelection\.includes\(e\.id\)/);
  assert.match(app,/onChange:t=>setDuelTopicSelection/);
  assert.match(app,/children:`Alle wählen`/);
  assert.match(app,/children:`Keine wählen`/);
  assert.match(app,/disabled:u===`custom`&&duelTopicSelection\.length===0/);
});
test('Notenschlüssel bleiben bei eigenem Themenmix mit Notennamen wählbar',()=>{
  assert.match(app,/u===`custom`&&duelTopicSelection\.includes\(`noten`\)/);
});
