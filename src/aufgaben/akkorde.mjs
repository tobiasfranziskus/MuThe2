/**
 * Sechs Generatoren für Dreiklänge und Akkordumkehrungen.
 * Der bestehende Aufgabentext, Zufallsverbrauch und Antwortcheck bleiben erhalten.
 * Die historischen Funktionskörper werden zunächst unverändert übernommen und
 * später einzeln lesbar gemacht, sobald die Generatorregressionen abgesichert sind.
 */
import {buildTriad, invertChord, hasSimpleAccidentals, chordSymbol, chordDescription} from '../music/akkorde.mjs';
import {formatGermanNote} from '../music/notennamen.mjs';

export function createChordTaskGenerators({
  selectRoot, selectClef, choose, shuffle, randomInt, capitalize, simpleRootName,
}) {
  const Ce = selectRoot;
  const A = selectClef;
  const T = choose;
  const D = shuffle;
  const E = randomInt;
  const ie = capitalize;
  const O = simpleRootName;
  const fe = buildTriad;
  const pe = invertChord;
  const ge = hasSimpleAccidentals;
  const se = chordSymbol;
  const ce = chordDescription;
  const w = formatGermanNote;

function je(e=`mixed`){let[t,n]=Ce(.45),r=T([`dur`,`moll`,`vermindert`,`übermäßig`]),i=A(e),a=i===`bass`?t===`a`||t===`h`?2:3:4,o={dur:[4,7],moll:[3,7],vermindert:[3,6],übermäßig:[4,8]}[r],s=fe(t,n,a,o[0],o[1]);if(!ge(s))return je(e);let c=ce(t,n,r),l=s.map(e=>w(e.name,e.octave,e.accidental));return{mode:`staff`,stacked:!0,q:`Bilde einen ${r===`dur`?`Dur-`:r===`moll`?`Moll-`:r===`vermindert`?`verminderten `:`übermäßigen `}Dreiklang über ${ie(O(t,n))} in Grundstellung! Tippe Terz und Quinte über dem Grundton.`,clef:i,fixedNotes:[{name:t,octave:a,accidental:n}],totalSlots:3,expected:[s[1],s[2]],acceptEnharmonic:!1,explanation:`${c} = ${l.join(` – `)}`}}function Me(e=`mixed`){let t=[[`dur`,`Dur`,4,7],[`moll`,`Moll`,3,7],[`vermindert`,`vermindert`,3,6],[`übermäßig`,`übermäßig`,4,8]],[n,r]=Ce(.45),i=A(e),a=i===`bass`?2:n===`a`||n===`h`?3:4,o=T(t),s=fe(n,r,a,o[2],o[3]);if(!ge(s))return Me(e);let c=ce(n,r,o[0]),l=[];t.filter(e=>e!==o).forEach(e=>{l.push(ce(n,r,e[0]))}),Array.from({length:8},()=>Ce(.5)).filter(e=>e[0]!==n||e[1]!==r).forEach(e=>{let n=T(t);l.push(ce(e[0],e[1],n[0]))});let u=[],d=0;for(;u.length<3&&d++<50;){let e=T(l);!u.includes(e)&&e!==c&&u.push(e)}let f=D([c,...u]),p=s.map(e=>w(e.name,e.octave,e.accidental));return{mode:`mc`,q:`Welcher Dreiklang ist notiert? (Grundstellung, gestapelt)`,staff:{clef:i,notes:s,stacked:!0},options:f,correct:f.indexOf(c),explanation:`${c} = ${p.join(` – `)} (Grundstellung: Grundton, Terz, Quinte von unten nach oben)`}}function Ne(e=`mixed`){let t=[[`dur`,`Dur`,4,7],[`moll`,`Moll`,3,7],[`vermindert`,`vermindert`,3,6],[`übermäßig`,`übermäßig`,4,8]],[n,r]=Ce(.45),i=A(e),a=i===`bass`?2:n===`a`||n===`h`?3:4,o=T(t),s=fe(n,r,a,o[2],o[3]);if(!ge(s))return Ne(e);let c=E(1,2),l=pe(s,c),u=c===1?`1. Umkehrung (Sextakkord)`:`2. Umkehrung (Quartsextakkord)`,d=D([u,...[`Grundstellung`,`1. Umkehrung (Sextakkord)`,`2. Umkehrung (Quartsextakkord)`,`3. Umkehrung (nicht möglich)`].filter(e=>e!==u)]),f=se(n,r,o[0]),p=s.map(e=>w(e.name,e.octave,e.accidental)),m=l.map(e=>w(e.name,e.octave,e.accidental));return{mode:`mc`,q:`Welche Umkehrung des ${f}-Akkords ist notiert?`,staff:{clef:i,notes:l,stacked:!0},options:d,correct:d.indexOf(u),explanation:`Notiert: ${m.join(` – `)} → ${u}. Der Akkord ${f} = ${p.join(` – `)}. (1. Umkehrung: Terz im Bass. 2. Umkehrung: Quinte im Bass.)`}}function Pe(e=`mixed`){let[t,n]=Ce(.45),r=T([`dur`,`moll`]),i=A(e),a=fe(t,n,i===`bass`?t===`a`||t===`h`?2:3:4,r===`dur`?4:3,7);if(!ge(a))return Pe(e);let o=E(1,2),s=pe(a,o),c=se(t,n,r),l=ce(t,n,r),u=s.map(e=>w(e.name,e.octave,e.accidental)),d=o===1?`1. Umkehrung (Sextakkord)`:`2. Umkehrung (Quartsextakkord)`,f=o===1?`Generalbassziffer 6`:`Generalbassziffer 6/4`;return{mode:`staff`,stacked:!0,q:`Bilde einen ${c}-Dreiklang als ${d}! Tippe alle drei Töne von unten nach oben.`,clef:i,fixedNotes:[],totalSlots:3,slotW:50,expected:s,acceptEnharmonic:!1,explanation:`${l} als ${d} = ${u.join(` – `)} (${f})`}}function Fe(e=`mixed`){let t=[[`dur`,`Dur`,4,7],[`moll`,`Moll`,3,7],[`vermindert`,`vermindert`,3,6],[`übermäßig`,`übermäßig`,4,8]],[n,r]=Ce(.45),i=A(e),a=i===`bass`?2:n===`a`||n===`h`?3:4,o=T(t),s=fe(n,r,a,o[2],o[3]);if(!ge(s))return Fe(e);let c=ie(O(n,r)),l=se(n,r,o[0]),u=ce(n,r,o[0]),d=s.map(e=>w(e.name,e.octave,e.accidental)),f=e=>e.trim().toLowerCase().replace(/[\s\-\u2013_.,]/g,``);return{mode:`text`,q:`Welcher Dreiklang ist notiert? Schreibe das Akkordkürzel (z.B. G, Gm, Gü, Gv) oder den vollständigen Namen.`,staff:{clef:i,notes:s,stacked:!0},hint:`G = G-Dur · Gm = g-Moll · Gü = g-übermäßig · Gv = g-vermindert. Der Grundton im Kürzel ist immer groß.`,checkFn:e=>{let t=(o[0]===`dur`?c:c.toLowerCase())+`-`+o[1];return[l,t,u].some(t=>f(e)===f(t))},explanation:`${u} = ${d.join(` – `)}`,correctDisplay:l}}function Ie(){let e=[[`dur`,`Dur`,4,7],[`moll`,`Moll`,3,7],[`vermindert`,`vermindert`,3,6],[`übermäßig`,`übermäßig`,4,8]],t=T([`c`,`d`,`e`,`f`,`g`,`a`,`h`]),n=t===`a`||t===`h`?3:4,r=T(e),i=fe(t,null,n,r[2],r[3]),a=E(0,2),o=a===0?i:pe(i,a),s=a===1?` als 1. Umkehrung (Sextakkord)`:a===2?` als 2. Umkehrung (Quartsextakkord)`:` in Grundstellung`,c=D(e.map(e=>e[1])),l=r[1];return{mode:`mc`,hearing:!0,audioMode:`chord`,q:`🎧 Welche Dreiklangsqualität hörst du? (alle Töne gleichzeitig – manchmal in einer Umkehrung)`,options:c,correct:c.indexOf(l),explanation:`${ce(t,null,r[0])}${s} = ${o.map(e=>w(e.name,e.octave,e.accidental)).join(` – `)}.`,expected:o}}
  return {
    buildTriadTask: je,
    identifyTriad: Me,
    identifyInversion: Ne,
    buildInversion: Pe,
    writtenTriadName: Fe,
    listeningTriad: Ie,
  };
}
