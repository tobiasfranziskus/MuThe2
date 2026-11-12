/** Vier Intervall-Aufgabengeneratoren ohne DOM/React.
 * Zufalls- und Schlüsselwahl werden aus der bestehenden Anwendung übergeben.
 */
import { INTERVALS, transposeDiatonic } from '../music/intervalle.mjs';
import { formatGermanNote } from '../music/notennamen.mjs';

export function createIntervalTaskGenerators({choose,shuffle,selectRoot,selectClef}) {
  function halfWholeStep(level = 'mixed') {
    const [name,accidental] = selectRoot(.45);
    const clef = selectClef(level);
    const octave = clef === 'treble' ? 4 : choose([2,3]);
    const half = Math.random() < .5;
    const target = transposeDiatonic(name,accidental,octave,1,half ? 1 : 2);
    if (target.accidental === '##' || target.accidental === 'bb') return halfWholeStep(level);
    const start = formatGermanNote(name,octave,accidental);
    const finish = formatGermanNote(target.name,target.octave,target.accidental);
    return {
      mode:'staff', q:'Gehe von ' + start + ' einen ' +
        (half ? 'Halbtonschritt' : 'Ganztonschritt') + ' nach oben. Tippe die Zielnote ins System!',
      clef, fixedNotes:[{name,octave,accidental}], totalSlots:2, expected:[target],
      acceptEnharmonic:true,
      explanation:start + ' + ' + (half ? 'HTS' : 'GTS') + ' = ' + finish + '.',
    };
  }

  function buildInterval(level = 'mixed') {
    const interval = choose(INTERVALS);
    const [name,accidental] = selectRoot(.4);
    const clef = selectClef(level);
    const octave = clef === 'treble' ? 4 : choose([2,3]);
    const target = transposeDiatonic(name,accidental,octave,interval.steps,interval.semis);
    if (target.accidental === '##' || target.accidental === 'bb') return buildInterval(level);
    const start = formatGermanNote(name,octave,accidental);
    const finish = formatGermanNote(target.name,target.octave,target.accidental);
    return {
      mode:'staff',
      q:'Bilde vom ' + start + ' aus eine ' + interval.name + ' aufwärts. Tippe die zweite Note ins System!',
      clef, fixedNotes:[{name,octave,accidental}], totalSlots:2, expected:[target],
      acceptEnharmonic:false,
      explanation:start + ' → ' + finish + ' = ' + interval.name +
        ' (' + interval.steps + ' Tonstufe(n), ' + interval.semis + ' Halbtöne)',
    };
  }

  function recognizeInterval(level = 'mixed') {
    const interval = choose(INTERVALS);
    const [name,accidental] = selectRoot(.4);
    const clef = selectClef(level);
    const octave = clef === 'bass' ? 2 : 4;
    const target = transposeDiatonic(name,accidental,octave,interval.steps,interval.semis);
    if (target.accidental === '##' || target.accidental === 'bb') return recognizeInterval(level);
    const wrong = shuffle(INTERVALS.filter(item => item.name !== interval.name).map(item => item.name)).slice(0,3);
    const options = shuffle([interval.name,...wrong]);
    return {
      mode:'mc', q:'Welches Intervall ist notiert? (untere → obere Note)',
      staff:{clef,notes:[{name,octave,accidental},target]},
      options, correct:options.indexOf(interval.name),
      explanation:formatGermanNote(name,octave,accidental) + ' → ' +
        formatGermanNote(target.name,target.octave,target.accidental) + ': ' +
        interval.steps + ' Tonstufe(n) und ' + interval.semis + ' Halbtöne → ' + interval.name + '.',
    };
  }

  function listeningInterval() {
    const distinct = [...new Map(INTERVALS.map(item =>
      [item.semis,item.semis === 6 ? {...item,name:'Tritonus'} : item])).values()];
    const interval = choose(distinct);
    const name = choose(['c','d','e','f','g','a','h']);
    const ascending = Math.random() < .5;
    const target = ascending
      ? transposeDiatonic(name,null,4,interval.steps,interval.semis)
      : transposeDiatonic(name,null,4,-interval.steps,-interval.semis);
    const wrong = shuffle(distinct.filter(item => item.name !== interval.name).map(item => item.name)).slice(0,3);
    const options = shuffle([interval.name,...wrong]);
    const base = {name,octave:4,accidental:null};
    const first = formatGermanNote(base.name,base.octave,base.accidental);
    const second = formatGermanNote(target.name,target.octave,target.accidental);
    return {
      mode:'mc',
      q:'🎧 Welches Intervall hörst du? (Die Töne erklingen nacheinander, aufwärts oder abwärts.)',
      hearing:true, audioMode:'melodic',
      options,correct:options.indexOf(interval.name),
      explanation:first + ' → ' + second +
        (ascending ? ' (aufwärts) = ' : ' (abwärts) = ') + interval.name + '.',
      expected:[base,target],
    };
  }
  return {halfWholeStep,buildInterval,recognizeInterval,listeningInterval};
}
