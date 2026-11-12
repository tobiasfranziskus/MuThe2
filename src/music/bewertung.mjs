/**
 * Unabhängige Bewertung eingegebener Noten im Notensystem.
 * Unveränderte Regeln: geordnete Aufgaben, gestapelte Akkorde,
 * enharmonische Gleichheit und Verbrauch doppelter erwarteter Noten.
 */
import { chromaticPitch } from './tonhoehen.mjs';

/**
 * @param {Array<{name:string,octave:number,accidental?:string|null}>} entered
 * @param {Array<{name:string,octave:number,accidental?:string|null}>} expected
 * @param {boolean} unordered Freie Reihenfolge (gestapelte Akkorde)
 * @param {boolean} acceptEnharmonic Vergleich nach Halbtonwert
 * @returns {{results:boolean[],allCorrect:boolean}}
 */
export function gradeWrittenNotes(entered, expected, unordered = false, acceptEnharmonic = false) {
  const key = acceptEnharmonic
    ? note => String(chromaticPitch(note.name, note.octave, note.accidental))
    : note => [note.name, note.octave, note.accidental === 'n' ? '' : note.accidental || ''].join(':');
  const remaining = expected.map(key);
  const results = entered.map((note, index) => {
    if (!unordered) return index < expected.length && key(note) === key(expected[index]);
    const found = remaining.indexOf(key(note));
    if (found < 0) return false;
    remaining.splice(found, 1);
    return true;
  });
  return {results, allCorrect: entered.length === expected.length && results.every(Boolean)};
}
