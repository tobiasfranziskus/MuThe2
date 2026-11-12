import test from 'node:test';
import assert from 'node:assert/strict';
import {renderDuelNotation,renderDuelPlayer} from '../src/duell/ansicht.mjs';

const jsx={jsx:(type,props,key)=>({type,props,key}),jsxs:(type,props,key)=>({type,props,key})};
const colors=['#32b0a2','#f4a23e','#ca78bf','#8aa2f4'];
const normalize=element=>JSON.stringify(element,(k,v)=>k==='onPointerDown'?undefined:typeof v==='function'?'[click]':v);
function fnv1a(value) {
  let h=2166136261;
  for(let i=0;i<value.length;i++) h=Math.imul(h^value.charCodeAt(i),16777619);
  return(h>>>0).toString(16).padStart(8,'0');
}
// Prüfsummen stammen aus den originalen JSX-Funktionen auf PR #22,
// noch bevor die beiden Duellkomponenten ausgelagert wurden.
const notationFixtures=[
  ['Tischseite unten mit Noten','<svg><text>f¹</text></svg>',false,'cff30316'],
  ['Tischseite oben mit gedrehten Noten','<svg><text>f¹</text></svg>',true,'dc93ed37'],
  ['Leere Notengrafik','',false,'f26e77d1'],
  ['Notengrafik anderer Größe','<svg width="440"><path d="M0 3"/></svg>',true,'53a34ac7'],
];
for(const [label,svg,upper,expected] of notationFixtures) {
  test(label,()=>{
    const view=renderDuelNotation(jsx,svg,upper);
    // Unveränderte innere Notengrafik (inklusive 180°-Ausrichtung):
    // Die alten Referenzprüfsummen gelten weiter für den bisherigen JSX-
    // Inhalt, nur die äußere Begrenzung ist absichtlich neu.
    const legacyView={...view,props:{
      className:'w-full flex items-center justify-center overflow-x-auto min-h-0',
      style:{maxHeight:'10vh'},
      children:view.props.children,
    }};
    assert.equal(fnv1a(normalize(legacyView)),expected);
    assert.equal(view.props.children.props.style.rotate,upper?'180deg':'0deg');
    assert.equal(view.props.children.props.dangerouslySetInnerHTML.__html,svg);
    assert.match(view.props.children.props.className,/duel-score-svg/);
    assert.match(view.props.className,/duel-score-slot/);
    assert.equal(view.props.role,'group');
    assert.equal(view.props['data-duel-side'],upper?'top':'bottom');
    assert.match(view.props['aria-label'],upper?/obere Tischseite/:/untere Tischseite/);
  });
}

const playerFixtures=[
  ['vor Antwort',false,0,null,1,0,0,0,'51b651bb'],
  ['gespeichert',false,1,2,1,1,0,100,'b1702c4f'],
  ['richtiger Treffer',true,2,1,1,2,100,200,'c9e9dffc'],
  ['falsch',true,3,2,1,0,0,200,'ace35b50'],
  ['keine Antwort',true,0,null,1,0,0,100,'e14d2f8a'],
  ['Serienbonus',true,1,3,3,4,250,1000,'6d82bf72'],
];
const player=(id,answer,streak,gain,score)=>({
  id,name:'Spieler '+(id+1),score,streak,answer,time:null,perm:[2,1,3,0],gain,
});
for(const [label,done,id,answer,correct,streak,gain,score,expected] of playerFixtures){
  test('Spielerkarte: '+label,()=>{
    const p=player(id,answer,streak,gain,score);
    const q={options:['C','D','E','F'],correct};
    const before=structuredClone({p,q});
    const element=renderDuelPlayer(jsx,colors,done,()=>{},p,q);
    assert.equal(fnv1a(normalize(element)),expected);
    assert.deepEqual({p,q},before,'Darstellung verändert keine Duellzustände');
    assert.equal(element.props.style.borderColor,colors[id]);
    assert.equal(element.props.children[2].props.children.length,4);
  });
}

test('Alle Antwort-Buttons reichen ID und sichtbar gewählten Slot unverändert weiter',()=>{
  const calls=[];
  const p=player(2,null,0,0,20);
  const element=renderDuelPlayer(jsx,colors,false,(id,slot)=>calls.push([id,slot]),p,{options:['A','B','C','D'],correct:3});
  const buttons=element.props.children[2].props.children;
  for(let slot=0;slot<4;slot++){
    assert.equal(buttons[slot].props.disabled,false);
    buttons[slot].props.onClick();
  }
  assert.deepEqual(calls,[[2,0],[2,1],[2,2],[2,3]]);
  assert.deepEqual(buttons.map(b=>b.props.children),['C','B','D','A']);
});

test('Bereits beantwortete oder ausgewertete Spielerkarten sperren Buttons',()=>{
  for(const [done,answer] of [[false,1],[true,null],[true,2]]) {
    const element=renderDuelPlayer(jsx,colors,done,()=>{},player(0,answer,3,200,400),{options:['A','B','C','D'],correct:1});
    const buttons=element.props.children[2].props.children;
    assert.ok(buttons.every(button=>button.props.disabled===true));
  }
});

test('JSX-Funktionen sind ohne DOM, Hooks und Browserinitialisierung nutzbar',()=>{
  assert.equal(typeof renderDuelNotation,'function');
  assert.equal(typeof renderDuelPlayer,'function');
  const rendered=renderDuelNotation(jsx,'<svg></svg>',true);
  assert.equal(rendered.type,'div');
});

test('Zwei gleichzeitige iPad-Touches lösen unabhängig Spielerantworten aus',()=>{
  const calls=[],events=[],q={options:['A','B','C','D'],correct:0};
  const first=renderDuelPlayer(jsx,colors,false,(id,slot)=>calls.push([id,slot]),player(0,null,0,0,0),q);
  const second=renderDuelPlayer(jsx,colors,false,(id,slot)=>calls.push([id,slot]),player(1,null,0,0,0),q);
  const a=first.props.children[2].props.children[0], b=second.props.children[2].props.children[1];
  a.props.onPointerDown({pointerType:'touch',preventDefault:()=>events.push('one')});
  b.props.onPointerDown({pointerType:'touch',preventDefault:()=>events.push('two')});
  assert.deepEqual(calls,[[0,0],[1,1]]);
  assert.deepEqual(events,['one','two']);
  a.props.onPointerDown({pointerType:'mouse',preventDefault:()=>events.push('mouse')});
  assert.equal(calls.length,2);
  a.props.onClick();
  assert.deepEqual(calls,[[0,0],[1,1],[0,0]]);
});
