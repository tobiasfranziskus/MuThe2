import test from 'node:test';
import assert from 'node:assert/strict';
import {noteFromStaffPoint, noteFromSvgEvent} from '../src/ui/noteneingabe.mjs';
import {noteFromDiatonicIndex} from '../src/music/tonhoehen.mjs';

const CLEFS = {treble:2, alto:-4, bass:-10};
const makeNote = (index, accidental=null) => ({
  ...noteFromDiatonicIndex(index),
  accidental,
});

// Testattrappe für die Browser-SVG-Matrix. Arbeitet mit einer frei
// definierbaren affinen Transformation; keine Browservoraussetzung.
function svgEvent(x,y,width,{a=1,b=0,c=0,d=1,e=0,f=0,available=true}={}) {
  const clientX=a*x+c*y+e, clientY=b*x+d*y+f;
  let inverseCalls=0,pointCalls=0;
  return {
    clientX,clientY,
    currentTarget:{
      getScreenCTM() {
        if (!available) return null;
        return {inverse() {
          inverseCalls++;
          const determinant=a*d-b*c;
          return {a:d/determinant,b:-b/determinant,c:-c/determinant,
            d:a/determinant,e:(c*f-d*e)/determinant,f:(b*e-a*f)/determinant};
        }};
      },
      createSVGPoint() {
        pointCalls++;
        return {
          x:0,y:0,
          matrixTransform(m) {
            return {x:m.a*this.x+m.c*this.y+m.e,y:m.b*this.x+m.d*this.y+m.f};
          },
        };
      },
      viewBox:{baseVal:{width}},
    },
    counters:()=>({inverseCalls,pointCalls}),
  };
}

test('Mitte des Notensystems wird für drei Schlüssel richtig berechnet', () => {
  for(const [clef,offset] of Object.entries(CLEFS)) {
    assert.deepEqual(noteFromStaffPoint(100,90,200,clef),makeNote(offset));
    assert.deepEqual(noteFromStaffPoint(100,80,200,clef),makeNote(offset+2));
    assert.deepEqual(noteFromStaffPoint(100,100,200,clef),makeNote(offset-2));
  }
});

test('Gleiche Eingabe bei Hoch- und Tiefstellungen, Grenzen sind inklusive', () => {
  for (const [clef,offset] of Object.entries(CLEFS)) {
    assert.deepEqual(noteFromStaffPoint(74,5,200,clef),makeNote(offset+17));
    assert.deepEqual(noteFromStaffPoint(186,155,200,clef),makeNote(offset-13));
    for (const [x,y] of [[73.999,90],[186.001,90],[100,4.999],[100,155.001]]) {
      assert.equal(noteFromStaffPoint(x,y,200,clef),null);
    }
  }
});

test('Rundung der Notenlinien, Hilfslinien und Begrenzung bleiben erhalten', () => {
  const s=noteFromStaffPoint(100,87.5,200,'treble');
  assert.deepEqual(s,makeNote(3)); // Math.round(0.5) = 1
  assert.deepEqual(noteFromStaffPoint(100,88,200,'treble'),makeNote(2));
  assert.deepEqual(noteFromStaffPoint(100,5,200,'treble'),makeNote(19));
});

test('Auflösungszeichen wird als fehlendes Vorzeichen gespeichert', () => {
  assert.deepEqual(noteFromStaffPoint(80,90,200,'treble','n'),makeNote(2,null));
  for(const sign of [null,'#','b','##','bb']) {
    assert.deepEqual(noteFromStaffPoint(80,90,200,'bass',sign),makeNote(-10,sign));
  }
});

test('Browsertransform: unverändert, skaliert, gedreht, gespiegelt', () => {
  const transforms=[
    {a:1,b:0,c:0,d:1,e:0,f:0},
    {a:2,b:0,c:0,d:2,e:40,f:25},
    {a:-1,b:0,c:0,d:-1,e:360,f:160}, // Tischduell 180°
    {a:0,b:2,c:-2,d:0,e:500,f:75}, // 90°
    {a:-1.5,b:0,c:0,d:1.2,e:375,f:20},
  ];
  for(const transform of transforms) {
    const e=svgEvent(110,90,240,transform);
    assert.deepEqual(noteFromSvgEvent(e,'treble','#'),makeNote(2,'#'));
    assert.deepEqual(e.counters(),{inverseCalls:1,pointCalls:1});
  }
});

test('Ungültige Klicks und fehlende SVG-Transformationsmatrix erzeugen keine Note', () => {
  const missing=svgEvent(120,90,240,{available:false});
  assert.equal(noteFromSvgEvent(missing,'bass',null),null);
  assert.deepEqual(missing.counters(),{inverseCalls:0,pointCalls:0});
  for(const coordinates of [[73,90],[227,90],[120,4],[120,156]]) {
    assert.equal(noteFromSvgEvent(svgEvent(...coordinates,240),'alto','b'),null);
  }
});

test('Genau 18 Schritte vom höchsten zum tiefsten erlaubten Notenbereich', () => {
  // Die historische Begrenzung ist [-13, 17], also 31 diatonische Stufen.
  const positions = new Set();
  for(let y=5;y<=155;y+=5){
    const n=noteFromStaffPoint(120,y,240,'treble');
    positions.add(n.name+':'+n.octave);
  }
  assert.equal(positions.size,31);
});
