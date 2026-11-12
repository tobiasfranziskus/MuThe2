import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');

function sectionBetween(start,end){
  const a=css.indexOf(start);
  assert.ok(a>=0, 'CSS-Feld muss definiert sein: '+start);
  const b=css.indexOf(end,a);
  assert.ok(b>a,'CSS-Ende fehlt: '+end);
  return css.slice(a,b);
}

test('Duellmittelteil reserviert zwei gleich große, unabhängige Notenfelder',()=>{
  const rules=sectionBetween('.duel-center-panel-with-score {',
    '.duel-center-panel-with-score .duel-center-question {');
  assert.match(rules,/display:\s*grid/);
  assert.match(rules,/height:\s*min\(52vh,\s*480px\)/);
  assert.match(rules,/overflow:\s*hidden/);
  assert.match(rules,/grid-template-rows:\s*auto\s+minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\)\s+auto\s+auto\s+auto/);
  assert.match(rules,/row-gap:\s*4px/);
});

test('Beide Notenfelder verhindern Übermalen des Nachbarfeldes',()=>{
  const rules=sectionBetween('.duel-center-panel-with-score .duel-score-slot {',
    '.duel-center-panel-with-score .duel-score-slot[data-duel-side="top"] {');
  assert.match(rules,/min-height:\s*0/);
  assert.match(rules,/overflow:\s*hidden/);
  assert.match(rules,/isolation:\s*isolate/);
  assert.match(rules,/contain:\s*paint/);
  const upper=sectionBetween('.duel-center-panel-with-score .duel-score-slot[data-duel-side="top"] {',
    '.duel-center-panel-with-score .duel-score-slot[data-duel-side="bottom"] {');
  assert.match(upper,/border-bottom:\s*2px/);
  const lower=sectionBetween('.duel-center-panel-with-score .duel-score-slot[data-duel-side="bottom"] {',
    '.duel-center-panel-with-score .duel-score-svg {');
  assert.match(lower,/border-top:\s*2px/);
});

test('Notengrafiken bleiben innerhalb der verfügbaren Höhe und Breite',()=>{
  const outer=sectionBetween('.duel-center-panel-with-score .duel-score-svg {',
    '.duel-center-panel-with-score .duel-score-svg > svg {');
  assert.match(outer,/height:\s*100%/);
  assert.match(outer,/max-width:\s*100%/);
  assert.match(outer,/max-height:\s*100%/);
  assert.match(outer,/overflow:\s*hidden/);
  const inner=sectionBetween('.duel-center-panel-with-score .duel-score-svg > svg {',
    '@media (max-height: 560px)');
  assert.match(inner,/height:\s*100%/);
  assert.match(inner,/max-width:\s*100%/);
  assert.match(inner,/max-height:\s*100%/);
});

test('Duell-Mittelteil aktiviert Grid nur bei SVG-Aufgaben, nicht bei Textfragen',()=>{
  assert.ok(app.includes('duel-center-panel-with-score'));
  assert.ok(app.includes('le.svgHtml?'));
  assert.ok(app.includes('le.svgHtml?duelNotationForSide(le.svgHtml,!0):null'));
  assert.ok(app.includes('le.svgHtml?duelNotationForSide(le.svgHtml,!1):null'));
  assert.equal((app.match(/duel-center-question w-full/g)||[]).length,2);
});

test('Tischseiten, Spielergruppen und Orientierung bleiben unverändert',()=>{
  assert.ok(app.includes('ue=i===2||i===3?[y[0]]:[y[0],y[1]]'));
  assert.ok(app.includes('k=i===2?[y[1]]:i===3?[y[1],y[2]]:[y[2],y[3]]'));
  assert.ok(app.includes('min-h-0 rotate-180'));
  assert.ok(app.includes('children:ue.map(e=>de(e,le))'));
  assert.ok(app.includes('children:k.map(e=>de(e,le))'));
});
