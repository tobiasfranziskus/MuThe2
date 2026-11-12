/** Dur-, Moll-, chromatische und Ganztonleiter-Aufgaben.
 * Erhält die bisherigen Fragen, Vorgaben, Vorzeichen und Zufallsfolgen.
 * Ohne React oder DOM; zufällige Auswahl und Schlüsselwahl als Abhängigkeiten.
 */
import {
  MAJOR_KEYS, MINOR_KEYS, MAJOR_STEPS, NATURAL_MINOR_STEPS,
  HARMONIC_MINOR_STEPS, MELODIC_MINOR_STEPS,
  CHROMATIC_SCALES, WHOLE_TONE_SCALES,
  scaleFromSemitones, parseCompactPitch,
} from '../music/tonleitern.mjs';
import { formatGermanNote } from '../music/notennamen.mjs';

export function createScaleTaskGenerators({choose,selectClef}) {
  const display = note => formatGermanNote(note.name,note.octave,note.accidental);

  function majorScale(level = 'mixed') {
    const [name,accidental,label] = choose(MAJOR_KEYS);
    const clef = selectClef(level);
    const notes = scaleFromSemitones(name,accidental,clef === 'bass' ? 2 : 4,MAJOR_STEPS);
    return {
      mode:'staff',
      q:'Schreibe die ' + label + '-Dur-Tonleiter aufwärts (8 Töne, mit Vorzeichen)!',
      clef,fixedNotes:[],totalSlots:8,slotW:46,expected:notes,acceptEnharmonic:false,
      explanation:label + '-Dur: ' + notes.map(display).join(' – '),
    };
  }

  function minorScale(level = 'mixed') {
    const [name,accidental,label] = choose(MINOR_KEYS);
    const clef = selectClef(level);
    const octave = clef === 'bass' ? 2 : 4;
    const variant = choose(['natürlich','harmonisch','melodisch']);
    const pattern = variant === 'harmonisch' ? HARMONIC_MINOR_STEPS
      : variant === 'melodisch' ? MELODIC_MINOR_STEPS : NATURAL_MINOR_STEPS;
    const notes = scaleFromSemitones(name,accidental,octave,pattern);
    const suffix = variant === 'harmonisch' ? ' – die 7. Stufe ist zum Leitton erhöht.'
      : variant === 'melodisch' ? ' – aufwärts sind die 6. und 7. Stufe erhöht.' : '';
    return {
      mode:'staff',
      q:'Schreibe die ' + label + '-Moll-Tonleiter aufwärts (' + variant + ', 8 Töne)!',
      clef,fixedNotes:[],totalSlots:8,slotW:46,expected:notes,acceptEnharmonic:false,
      explanation:label + '-Moll (' + variant + '): ' + notes.map(display).join(' – ') + suffix,
    };
  }

  function chromaticScale(level = 'mixed') {
    const preset = choose(Object.keys(CHROMATIC_SCALES));
    const clef = selectClef(level);
    const notes = CHROMATIC_SCALES[preset]
      .map(parseCompactPitch).filter(note => note !== null)
      .map(note => ({...note,octave:clef === 'bass' ? note.octave - 2 : note.octave}));
    return {
      mode:'staff',
      q:'Schreibe die chromatische Tonleiter ab ' + display(notes[0]) +
        ' aufwärts (13 Töne, jeder Schritt ein Halbton)!',
      clef,fixedNotes:[],totalSlots:13,slotW:38,expected:notes,acceptEnharmonic:false,
      explanation:'Chromatische Tonleiter ab ' + display(notes[0]) +
        ': ' + notes.map(display).join(' – '),
    };
  }

  function wholeToneScale(level = 'mixed') {
    const preset = choose(Object.keys(WHOLE_TONE_SCALES));
    const clef = selectClef(level);
    const notes = WHOLE_TONE_SCALES[preset]
      .map(parseCompactPitch).filter(note => note !== null)
      .map(note => ({...note,octave:clef === 'bass' ? note.octave - 2 : note.octave}));
    return {
      mode:'staff',
      q:'Schreibe die Ganztonleiter ab ' + display(notes[0]) +
        ' aufwärts (7 Töne, jeder Schritt ein Ganzton)!',
      clef,fixedNotes:[],totalSlots:7,expected:notes,acceptEnharmonic:true,
      explanation:'Ganztonleiter ab ' + display(notes[0]) + ': ' +
        notes.map(display).join(' – ') + ' – alle Schritte sind Ganztonschritte.',
    };
  }
  return {majorScale,minorScale,chromaticScale,wholeToneScale};
}
