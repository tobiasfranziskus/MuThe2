/**
 * Aufgabengeneratoren des Themenbereichs "Notennamen".
 * Die vier bisherigen Varianten behalten Fragen, Antwortformate und die
 * Reihenfolge ihrer Zufallsentscheidungen bei. Keine React-/DOM-Abhängigkeit.
 * Der optionale Anfängermodus erzeugt nur Stammtöne ohne Vorzeichen.
 * Zufallsfunktionen und beschreibende Hilfen werden aus dem bestehenden
 * Aufgabensystem injiziert, damit die übrigen Themen unverändert bleiben.
 */
import { formatGermanNote, parseGermanNoteInput } from '../music/notennamen.mjs';
import { noteFromDiatonicIndex } from '../music/tonhoehen.mjs';

const PITCH_NAMES = ['c', 'd', 'e', 'f', 'g', 'a', 'h'];
const TREBLE_OPTIONS = [
  {name:'c',octave:4,accidental:null}, {name:'c',octave:4,accidental:'#'},
  {name:'d',octave:4,accidental:null}, {name:'e',octave:4,accidental:'b'},
  {name:'f',octave:4,accidental:'#'}, {name:'g',octave:4,accidental:null},
  {name:'a',octave:4,accidental:'b'}, {name:'h',octave:4,accidental:null},
  {name:'c',octave:5,accidental:null},
];
const BASS_OPTIONS = TREBLE_OPTIONS.map(note => ({...note, octave:note.octave - 1}));
const ENHARMONIC_PAIRS = [
  ['cis','des'], ['dis','es'], ['fis','ges'], ['gis','as'],
  ['ais','b'], ['eis','f'], ['his','c'],
];

export function createNoteNameTaskGenerators({
  chooseClef, choose, shuffle, randomInt,
  staffExplanation, enharmonicExplanation, clefLabel,
}) {
  /** Multiple-Choice-Aufgabe: gezeigte Note benennen. */
  function multipleChoice(level = 'mixed', beginner = false) {
    const clef = chooseClef(level);
    let name = choose(PITCH_NAMES);
    let octave = clef === 'treble' ? name === 'c' || name === 'd' ? 5 : 4
      : ['c','d','e','f'].includes(name) ? 3 : 2;
    if (clef === 'alto') {
      const other = noteFromDiatonicIndex(randomInt(-5, 6));
      name = other.name;
      octave = other.octave;
    }
    const random = Math.random();
    const accidental = beginner ? null : random < .15 ? '#' : random < .3 ? 'b' : null;
    const answer = formatGermanNote(name, octave, accidental);
    const answers = new Set([answer]);
    for (let attempts = 0; attempts < 40 && answers.size < 4; attempts++) {
      const candidateName = choose(PITCH_NAMES);
      const candidateAccidental = beginner ? null : choose(['#', 'b', null]);
      const candidate = formatGermanNote(candidateName, octave, candidateAccidental);
      if (candidate !== answer) answers.add(candidate);
    }
    const options = shuffle(Array.from(answers).slice(0, 4));
    return {
      mode: 'mc', q: 'Wie heißt dieser Ton im ' + clefLabel(clef) + '?',
      staff: {clef, notes:[{name,octave,accidental}]},
      options, correct:options.indexOf(answer),
      explanation:accidental
        ? answer + ' – enharmonisch verwechselt: ' + enharmonicExplanation(name,octave,accidental)
        : answer + ' ist ein Basiston ohne Vorzeichen.',
    };
  }

  /** Enharmonische Verwechslung wählen. */
  function enharmonic() {
    const pair = choose(ENHARMONIC_PAIRS);
    const swapped = Math.random() < .5;
    const question = swapped ? pair[1] : pair[0];
    const answer = swapped ? pair[0] : pair[1];
    const candidates = ENHARMONIC_PAIRS.flat().filter(note => note !== answer && note !== question);
    const wrong = [];
    while (wrong.length < 3) {
      const candidate = choose(candidates);
      if (!wrong.includes(candidate)) wrong.push(candidate);
    }
    const options = shuffle([answer,...wrong]);
    return {
      mode:'mc', q:'Welcher Ton ist die enharmonische Verwechslung von „' + question + '“?',
      options, correct:options.indexOf(answer),
      explanation:question + ' = ' + answer + ' (klingen identisch)',
    };
  }

  /** Note an die richtige Position im Notensystem setzen. */
  function placement(level = 'mixed', beginner = false) {
    const clef = chooseClef(level);
    const note = clef === 'alto'
      ? {...noteFromDiatonicIndex(randomInt(-4,4)), accidental:beginner ? null : choose([null,'#','b'])}
      : choose((clef === 'treble' ? TREBLE_OPTIONS : BASS_OPTIONS)
        .filter(note => !beginner || note.accidental === null));
    return {
      mode:'staff',
      q:'Setze die Note ' + formatGermanNote(note.name,note.octave,note.accidental) + ' ins Notensystem!',
      clef, fixedNotes:[], totalSlots:1, expected:[note], acceptEnharmonic:false,
      explanation:staffExplanation(note,clef),
    };
  }

  /** Notennamen als freien Text eingeben (inklusive f1, f¹, f4). */
  function textEntry(level = 'mixed', beginner = false) {
    const clef = chooseClef(level);
    let name = choose(PITCH_NAMES);
    let octave = clef === 'treble' ? name === 'c' || name === 'd' ? 5 : 4
      : ['c','d','e','f'].includes(name) ? 3 : 2;
    if (clef === 'alto') {
      const other = noteFromDiatonicIndex(randomInt(-5,6));
      name = other.name;
      octave = other.octave;
    }
    const random = Math.random();
    const accidental = beginner ? null : random < .2 ? '#' : random < .4 ? 'b' : null;
    const note = {name,octave,accidental};
    const answer = formatGermanNote(name,octave,accidental);
    return {
      mode:'text',
      q:'Wie heißt dieser Ton im ' + clefLabel(clef) +
        (beginner
          ? '? Schreibe den Stammton ohne Vorzeichen (z.B. "c", "C", "c¹").'
          : '? Schreibe den Notennamen in deutscher Schreibweise (z.B. "c", "C", "c¹", "es").'),
      staff:{clef,notes:[note]},
      hint:'Kleinbuchstabe = kleine Oktave (c) · Großbuchstabe = große Oktave (C) · Hochzahl = höhere Oktave (c¹, c²). SPN (c3, c4) wird auch akzeptiert.',
      placeholder:beginner ? 'z.B. c¹' : 'z.B. es',
      checkFn:input => {
        const candidates = parseGermanNoteInput(input);
        return candidates.length
          ? candidates.some(candidate => candidate.name === name && candidate.octave === octave &&
              (candidate.accidental || null) === (accidental || null))
          : false;
      },
      explanation:'Der Ton heißt ' + answer + '.',
      correctDisplay:answer,
    };
  }

  return {multipleChoice,enharmonic,placement,textEntry};
}
