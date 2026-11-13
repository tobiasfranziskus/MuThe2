import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {noteFromSvgEvent,noteFromStaffPoint} from '../src/ui/noteneingabe.mjs';

const root=new URL('../',import.meta.url);
const app=readFileSync(new URL('src/app.js',root),'utf8');
const css=readFileSync(new URL('src/styles.css',root),'utf8');
const sw=readFileSync(new URL('sw.js',root),'utf8');

function touchEvent(x,y,width,scale,scrollLeft=0,turn=0) {
  // Gerendertes SVG, proportional vergrößert und horizontal gescrollt.
  // 180° wird als gegenläufige Transformation simuliert.
  const angle=turn*Math.PI/180;
  const cos=Math.cos(angle),sin=Math.sin(angle);
  const a=scale*cos,b=scale*sin,c=-scale*sin,d=scale*cos;
  const tx=70-scrollLeft,ty=25;
  const clientX=a*x+c*y+tx,clientY=b*x+d*y+ty;
  return {
    clientX,clientY,
    currentTarget:{
      viewBox:{baseVal:{width}},
      getScreenCTM(){return {inverse(){
        const det=a*d-b*c;
        return {a:d/det,b:-b/det,c:-c/det,d:a/det,
          e:(c*ty-d*tx)/det,f:(b*tx-a*ty)/det};
      }};},
      createSVGPoint(){return {x:0,y:0,matrixTransform(m){
        return {x:m.a*this.x+m.c*this.y+m.e,y:m.b*this.x+m.d*this.y+m.f};
      }};},
    },
  };
}

test('iPad-Modus skaliert SVG ausschließlich über CSS – die viewBox bleibt unverändert',()=>{
  assert.ok(app.includes('practice-staff-editor max-w-full h-auto select-none'));
  assert.ok(app.includes('viewBox:\`0 0 \${a} 160\`'));
  assert.ok(app.includes('"--staff-editor-width":\`\${a}px\`'));
  assert.match(css,/@media \(pointer:\s*coarse\)/);
  assert.match(css,/\.practice-staff-editor\s*\{[^}]*width:\s*calc\(var\(--staff-editor-width\)\s*\*\s*1\.5\)/s);
  assert.match(css,/\.practice-staff-editor\s*\{[^}]*height:\s*240px/s);
  assert.match(css,/\.practice-staff-editor\s*\{[^}]*max-width:\s*none/s);
  assert.match(app,/touchAction:\`pan-x pinch-zoom\`/);
});

test('Breite Notensysteme können horizontal scrollen, ohne die linke Seite abzuschneiden',()=>{
  assert.ok(app.includes('bg-white rounded-xl p-3 flex items-center overflow-x-auto shadow-inner cursor-crosshair'));
  assert.ok(!app.includes('justify-center overflow-x-auto shadow-inner cursor-crosshair'));
  assert.match(css,/\.practice-staff-editor\s*\{[^}]*flex-shrink:\s*0/s);
  assert.match(css,/\.practice-staff-editor\s*\{[^}]*margin-inline:\s*auto/s);
});

test('Auch statische SVG-Notengrafiken in Lese- und Texteingabe-Aufgaben bleiben größer',()=>{
  const matches=(app.match(/practice-score-readonly mx-auto/g)||[]).length;
  assert.equal(matches,2,'Multiple Choice und freie Texteingabe verwenden beide Scroll-Ansichten');
  assert.match(css,/\.practice-score-readonly\s*>\s*svg\s*\{[^}]*width:\s*calc\(var\(--score-width\)\s*\*\s*1\.35\)/s);
  assert.match(css,/\.practice-score-readonly\s*>\s*svg\s*\{[^}]*height:\s*auto/s);
});

test('Vorzeichen-Tasten und Kontrollknöpfe bieten mindestens 44px Trefferfläche',()=>{
  assert.ok(app.includes('practice-accidental-button w-9 h-9'));
  assert.ok(app.includes('practice-editor-action px-3 py-1.5'));
  assert.match(app,/"aria-label":e.name,"aria-pressed":pe===e.acc/);
  assert.match(css,/\.practice-accidental-button,\s*\.practice-editor-action\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px/s);
  assert.ok(app.includes('flex flex-wrap items-center gap-2'));
});

test('Skalierung, horizontales Scrollen und 180° ändern die Notenpositionen nicht',()=>{
  let comparisons=0;
  for(const clef of ['treble','bass','alto']){
    for(const scale of [1,1.35,1.5,2.25]){
      for(const scrollLeft of [0,140,450]){
        for(const turn of [0,180]){
          for(const [x,y] of [[80,10],[110,55],[195,90],[245,132],[265,150]]){
            const expected=noteFromStaffPoint(x,y,320,clef,'#');
            const actual=noteFromSvgEvent(touchEvent(x,y,320,scale,scrollLeft,turn),clef,'#');
            assert.deepEqual(actual,expected,
              'Schlüssel '+clef+', Vergrößerung '+scale+', Scroll '+scrollLeft+', Drehung '+turn);
            comparisons++;
          }
        }
      }
    }
  }
  assert.equal(comparisons,360);
});

test('Neuer Cache-Name ist für aktualisierte iPad-Stile vorgesehen',()=>{
  assert.ok(sw.includes("CACHE_NAME = CACHE_PREFIX + '2026-11-13-v5'"));
  assert.ok(sw.includes('"./src/styles.css"'));
  assert.ok(!sw.includes("CACHE_NAME = CACHE_PREFIX + '2026-11-03-v1'"));
});

test('Sichtbare Versionsangabe in der App entspricht der Cache-Revision',()=>{
  const sw=readFileSync(new URL('sw.js',root),'utf8');
  const app=readFileSync(new URL('src/app.js',root),'utf8');
  const rev=sw.match(/CACHE_PREFIX \+ '([^']+)'/)[1];
  assert.ok(app.includes('Version '+rev),'Versionsangabe im Fußbereich muss zur Cache-Revision passen');
});
