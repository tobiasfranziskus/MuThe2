/**
 * Harmonische Funktionen (Dur/Moll) und erweiterte Vierklänge.
 * Die alten Generator-Funktionskörper sind als erste sichere Auslagerung
 * unverändert. Ihre Zufallsfunktionen und UI-unabhängige Hilfen werden
 * explizit eingebunden. Harmonische Analyse nutzt denselben Dur-Katalog.
 */
import { diatonicIndex } from '../music/tonhoehen.mjs';
import { transposeDiatonic } from '../music/intervalle.mjs';
import { buildTriad, invertChord, chordDescription } from '../music/akkorde.mjs';
import { formatGermanNote } from '../music/notennamen.mjs';

/** Gemeinsamer Funktionskatalog für Aufgaben und harmonische Analyse. */
export const MAJOR_FUNCTIONS = [
  {
    "sym": "T",
    "label": "Tonika",
    "off": 0,
    "semi": 0,
    "dur": true
  },
  {
    "sym": "S",
    "label": "Subdominante",
    "off": 3,
    "semi": 5,
    "dur": true
  },
  {
    "sym": "D",
    "label": "Dominante",
    "off": 4,
    "semi": 7,
    "dur": true
  },
  {
    "sym": "Tp",
    "label": "Tonikaparallele",
    "off": 5,
    "semi": 9,
    "dur": false
  },
  {
    "sym": "Sp",
    "label": "Subdominantparallele",
    "off": 1,
    "semi": 2,
    "dur": false
  },
  {
    "sym": "Dp",
    "label": "Dominantparallele",
    "off": 2,
    "semi": 4,
    "dur": false
  }
];

export function createHarmonyTaskGenerators({
  choose, shuffle, randomInt, selectClef, simpleRootName, capitalize,
}) {
  const T=choose,D=shuffle,E=randomInt,A=selectClef,O=simpleRootName,ie=capitalize;
  const S=diatonicIndex,k=transposeDiatonic,fe=buildTriad,pe=invertChord;
  const ce=chordDescription,w=formatGermanNote;

var Ye=MAJOR_FUNCTIONS,Xe=[[`c`,null,`C`],[`g`,null,`G`],[`d`,null,`D`],[`a`,null,`A`],[`e`,null,`E`],[`f`,null,`F`],[`h`,`b`,`B`],[`e`,`b`,`Es`],[`a`,`b`,`As`]],Ze=[{sym:`t`,label:`Tonika`,off:0,semi:0,dur:!1},{sym:`s`,label:`Subdominante`,off:3,semi:5,dur:!1},{sym:`D`,label:`Dominante`,off:4,semi:7,dur:!0},{sym:`tP`,label:`Tonikaparallele`,off:2,semi:3,dur:!0},{sym:`sP`,label:`Subdominantparallele`,off:5,semi:8,dur:!0}],Qe=[[`a`,null,`a`],[`e`,null,`e`],[`h`,null,`h`],[`d`,null,`d`],[`g`,null,`g`],[`c`,null,`c`],[`f`,null,`f`]];function $e(e=`mixed`){let t=Math.random()<.4,[n,r,i]=T(t?Qe:Xe),a=T(t?Ze:Ye),o=A(e),s=k(n,r,4,a.off,a.semi),c=s.octave,l=o===`treble`?8:-1,u=o===`treble`?-2:-14;for(;S(s.name,c)>l;)c--;for(;S(s.name,c)<u;)c++;let d=fe(s.name,s.accidental,c,a.dur?4:3,7),f=ce(s.name,s.accidental,a.dur?`dur`:`moll`),p=d.map(e=>w(e.name,e.octave,e.accidental)),m=`${i}-${t?`Moll`:`Dur`}`;return{mode:`staff`,stacked:!0,q:`Schreibe in ${m} den Akkord ${a.sym} (${a.label}) als Dreiklang! Tippe alle drei Töne.`,clef:o,fixedNotes:[],totalSlots:3,slotW:50,expected:d,acceptEnharmonic:!1,explanation:`${a.sym} in ${m} = ${f} = ${p.join(` – `)}${t&&a.sym===`D`?` (Dur-Dominante mit Leitton!)`:``}`}}function et(e=`mixed`){let t=Math.random()<.4,[n,r,i]=T(t?Qe:Xe),a=t?Ze:Ye,o=T(a),s=A(e),c=E(0,2),l=k(n,r,4,o.off,o.semi),u=l.octave,d=s===`treble`?-1:-13,f=s===`treble`?3:-7;for(;S(l.name,u)>f;)u--;for(;S(l.name,u)<d;)u++;let p=pe(fe(l.name,l.accidental,u,o.dur?4:3,7),c),m=[`Grundstellung`,`1. Umkehrung (Sextakkord)`,`2. Umkehrung (Quartsextakkord)`],h=e=>`${e.label} (${e.sym})`,g=h(o),_=D([g,...D(a.filter(e=>e.sym!==o.sym).map(h)).slice(0,3)]),v=`${i}-${t?`Moll`:`Dur`}`,y=ce(l.name,l.accidental,o.dur?`dur`:`moll`),b=p.map(e=>w(e.name,e.octave,e.accidental));return{mode:`mc`,q:`Welche Funktion hat dieser Akkord in ${v}? Achtung: Er kann umgekehrt sein!`,staff:{clef:s,notes:p,stacked:!0},options:_,correct:_.indexOf(g),explanation:`Notiert: ${b.join(` – `)} (${m[c]}). Grundstellung: ${y} → in ${v} die Funktion ${o.sym} (${o.label}).`}}var tt=[{id:`dom`,sym:`7`,steps:[2,4,6],semis:[4,7,10],upper:`Terz, Quinte und Septime`,name:`Dominantseptakkord`,hint:`Dur-Dreiklang + kleine Septime`},{id:`maj7`,sym:`maj7`,steps:[2,4,6],semis:[4,7,11],upper:`Terz, Quinte und Septime`,name:`Dur-Septakkord`,hint:`Dur-Dreiklang + große Septime`},{id:`moll7`,sym:`m7`,steps:[2,4,6],semis:[3,7,10],upper:`Terz, Quinte und Septime`,name:`moll-Septakkord`,hint:`Moll-Dreiklang + kleine Septime`},{id:`sixte`,sym:`6`,steps:[2,4,5],semis:[4,7,9],upper:`Terz, Quinte und Sexte`,name:`Sixte ajoutée`,hint:`Dur-Dreiklang + große Sexte`}],nt=[[`c`,null],[`f`,null],[`d`,null],[`g`,null],[`a`,null],[`h`,`b`],[`e`,`b`],[`f`,`#`]];function rt(e,t,n){let r=O(e,t);return n.id===`moll7`?r+n.sym:ie(r)+n.sym}function it(e,t,n,r){let i=[k(e,t,n,0,0)];return r.steps.forEach((a,o)=>i.push(k(e,t,n,a,r.semis[o]))),i}function at(e=`mixed`){let[t,n]=T(nt),r=T(tt),i=A(e),a=it(t,n,i===`bass`?t===`a`||t===`h`?2:3:4,r),o=rt(t,n,r),s=a.map(e=>w(e.name,e.octave,e.accidental));return{mode:`staff`,q:`Bilde einen ${r.name} über „${O(t,n)}“ (${r.hint})! Tippe ${r.upper}.`,clef:i,fixedNotes:[a[0]],totalSlots:4,slotW:46,expected:[a[1],a[2],a[3]],acceptEnharmonic:!1,explanation:`${o} = ${s.join(` – `)} (${r.name}: ${r.hint})`}}function ot(e=`mixed`){let[t,n]=T(nt),r=A(e),i=r===`bass`?2:t===`a`||t===`h`?3:4,a=T(tt),o=it(t,n,i,a),s=`${rt(t,n,a)} – ${a.name}`,c=D([s,...tt.filter(e=>e!==a).map(e=>`${rt(t,n,e)} – ${e.name}`)]),l=o.map(e=>w(e.name,e.octave,e.accidental));return{mode:`mc`,q:`Welcher Vierklang ist notiert? (Grundstellung, gestapelt)`,staff:{clef:r,notes:o,stacked:!0},options:c,correct:c.indexOf(s),explanation:`${s} = ${l.join(` – `)} (${a.hint})`}}
  return {
    buildFunctionChord:$e,
    identifyFunction:et,
    buildExtendedChord:at,
    identifyExtendedChord:ot,
  };
}
