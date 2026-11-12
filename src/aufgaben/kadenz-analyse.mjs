/**
 * Kadenz, Stimmführung und harmonische Analyse (drei Aufgabengeneratoren).
 *
 * Die bisherigen Aufgabenkörper sind unverändert, damit Texte, Notation,
 * Antworten und RNG-Verbrauch gegenüber dem bisherigen Spiel gleich bleiben.
 * Der Funktionskatalog wird gemeinsam mit harmoniefunktionen.mjs verwendet.
 */
import { MAJOR_FUNCTIONS } from './harmoniefunktionen.mjs';
import { transposeDiatonic } from '../music/intervalle.mjs';
import { buildTriad } from '../music/akkorde.mjs';

export function createCadenceAnalysisTaskGenerators({ choose, shuffle, randomInt }) {
  const T = choose, D = shuffle, E = randomInt;
  const Ye = MAJOR_FUNCTIONS, k = transposeDiatonic, fe = buildTriad;

function St(){let e=[{key:`C-Dur`,chords:[`C`,`F`,`G`,`C`],formula:`T – S – D – T`},{key:`G-Dur`,chords:[`G`,`C`,`D`,`G`],formula:`T – S – D – T`},{key:`D-Dur`,chords:[`D`,`G`,`A`,`D`],formula:`T – S – D – T`},{key:`F-Dur`,chords:[`F`,`B`,`C`,`F`],formula:`T – S – D – T`},{key:`a-Moll`,chords:[`a`,`d`,`E`,`a`],formula:`t – s – D – t`},{key:`d-Moll`,chords:[`d`,`g`,`A`,`d`],formula:`t – s – D – t`},{key:`e-Moll`,chords:[`e`,`a`,`H`,`e`],formula:`t – s – D – t`}],t=T(e),n=t.chords.join(` – `),r=D([n,...D(e.filter(e=>e.key!==t.key).map(e=>e.chords.join(` – `))).slice(0,3)]);return{mode:`mc`,q:`Wie lautet die Kadenz (${t.formula}) in ${t.key}?`,options:r,correct:r.indexOf(n),explanation:`Kadenz in ${t.key}: ${n} (Funktionen: ${t.formula}).`}}function Ct(){let e={q:`Parallele Quinten`,o:`Parallele Oktaven`,hq:`Versteckte Quinten`,ho:`Versteckte Oktaven`,lt:`Der Leitton wird nicht aufgelöst`,n:`Kein Stimmführungsfehler`},t=T([{prog:`T→D`,err:`o`,A:[{name:`c`,octave:3},{name:`e`,octave:3},{name:`g`,octave:4},{name:`c`,octave:5}],B:[{name:`g`,octave:3},{name:`h`,octave:3},{name:`d`,octave:4},{name:`g`,octave:5}]},{prog:`T→D`,err:`q`,A:[{name:`c`,octave:3},{name:`g`,octave:3},{name:`c`,octave:4},{name:`e`,octave:4}],B:[{name:`g`,octave:2},{name:`d`,octave:3},{name:`h`,octave:4},{name:`d`,octave:5}]},{prog:`D→T`,err:`n`,A:[{name:`g`,octave:2},{name:`d`,octave:3},{name:`d`,octave:4},{name:`h`,octave:4}],B:[{name:`c`,octave:3},{name:`e`,octave:3},{name:`g`,octave:4},{name:`c`,octave:5}]}]),n=e[t.err],r=D([n,...D(Object.keys(e).filter(e=>e!==t.err).map(t=>e[t])).slice(0,3)]);return{mode:`mc`,q:`Vergleiche die beiden Akkorde (C-Dur, ${t.prog}): Welcher Stimmführungsfehler liegt vor?`,staff:{clef:`treble`,chords:[{treble:[t.A[2],t.A[3]],bass:[t.A[0],t.A[1]]},{treble:[t.B[2],t.B[3]],bass:[t.B[0],t.B[1]]}],highlight:null},options:r,correct:r.indexOf(n),explanation:t.err===`n`?`Korrekt: Gegenläufige Stimmen, keine verbotenen Parallelen.`:`${n} liegt hier zwischen den Stimmen vor.`}}function wt(){let e=[{name:`C`,ton:[`c`,null]},{name:`G`,ton:[`g`,null]},{name:`F`,ton:[`f`,null]},{name:`D`,ton:[`d`,null]},{name:`B`,ton:[`h`,`b`]}],t=[[`T`,`S`,`D`,`T`],[`T`,`Sp`,`D`,`T`],[`T`,`Tp`,`S`,`D`],[`T`,`D`,`T`,`S`],[`T`,`S`,`Tp`,`D`]],n={T:`Tonika (T)`,S:`Subdominante (S)`,D:`Dominante (D)`,Tp:`Tonikaparallele (Tp)`,Sp:`Subdominantparallele (Sp)`,Dp:`Dominantparallele (Dp)`},r=T(e),i=T(t),a=E(0,i.length-1),o=i.map(e=>{let t=Ye.find(t=>t.sym===e),n=k(r.ton[0],r.ton[1],4,t.off,t.semi);return{treble:fe(n.name,n.accidental,n.octave,t.dur?4:3,7),bass:[{...n,octave:n.octave-1}],sym:e}}),s=o[a],c=n[s.sym],l=D([c,...D(Object.keys(n).filter(e=>e!==s.sym).map(e=>n[e])).slice(0,3)]);return{mode:`mc`,q:`Harmonische Analyse in ${r.name}-Dur: Welche Funktion hat der eingekreiste Akkord?`,staff:{clef:`treble`,chords:o.map(e=>({treble:e.treble,bass:e.bass})),highlight:a},options:l,correct:l.indexOf(c),explanation:`Der eingekreiste Akkord hat die Funktion ${c}.`}}
  return {
    cadence: St,
    voiceLeading: Ct,
    harmonicAnalysis: wt,
  };
}
