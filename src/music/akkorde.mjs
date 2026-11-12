/** Dreiklänge, Umkehrungen und Akkordnamen ohne UI-/DOM-Abhängigkeiten. */
import { transposeDiatonic } from './intervalle.mjs';

export function buildTriad(name, accidental, octave, thirdSemitones, fifthSemitones) {
  return [
    transposeDiatonic(name, accidental, octave, 0, 0),
    transposeDiatonic(name, accidental, octave, 2, thirdSemitones),
    transposeDiatonic(name, accidental, octave, 4, fifthSemitones),
  ];
}

/** Die Noten werden geklont; ursprüngliche Eingaben bleiben unverändert. */
export function invertChord(notes, rotations) {
  const result = notes.map(note => ({ ...note }));
  for (let i = 0; i < rotations; i++) {
    const first = result.shift();
    first.octave += 1;
    result.push(first);
  }
  return result;
}

export function hasSimpleAccidentals(notes) {
  return notes.every(note => note.accidental !== '##' && note.accidental !== 'bb');
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function rootName(name, accidental) {
  return accidental
    ? accidental === '#' ? name + 'is'
      : accidental === 'b'
        ? name === 'e' ? 'es' : name === 'a' ? 'as' : name === 'h' ? 'b' : name + 'es'
        : name
    : name;
}

export function chordSymbol(name, accidental, quality) {
  const suffix = { dur:'', moll:'m', vermindert:'v', 'übermäßig':'ü' }[quality.toLowerCase()] || '';
  return capitalize(rootName(name, accidental)) + suffix;
}

export function chordDescription(name, accidental, quality) {
  const namedQuality = { dur:'Dur', moll:'Moll', vermindert:'vermindert', 'übermäßig':'übermäßig' }[quality.toLowerCase()] || quality;
  const root = rootName(name, accidental);
  return chordSymbol(name, accidental, quality) + ' (' +
    (namedQuality === 'Dur' ? capitalize(root) : root) + '-' + namedQuality + ')';
}
