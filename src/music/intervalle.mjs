/**
 * Intervalle und diatonisch korrekt geschriebene Transpositionen.
 * Enthält keine Darstellung, React- oder DOM-Abhängigkeiten.
 */
import { diatonicIndex, noteFromDiatonicIndex, chromaticPitch } from './tonhoehen.mjs';

export const INTERVALS = [
  {steps:1,semis:1,name:'Kleine Sekunde'},
  {steps:1,semis:2,name:'Große Sekunde'},
  {steps:2,semis:3,name:'Kleine Terz'},
  {steps:2,semis:4,name:'Große Terz'},
  {steps:3,semis:5,name:'Reine Quarte'},
  {steps:3,semis:6,name:'Übermäßige Quarte (Tritonus)'},
  {steps:4,semis:6,name:'Verminderte Quinte (Tritonus)'},
  {steps:4,semis:7,name:'Reine Quinte'},
  {steps:5,semis:8,name:'Kleine Sexte'},
  {steps:5,semis:9,name:'Große Sexte'},
  {steps:6,semis:10,name:'Kleine Septime'},
  {steps:6,semis:11,name:'Große Septime'},
  {steps:7,semis:12,name:'Reine Oktave'},
];

/**
 * Bewahrt die bisherige Semiton/Intervall-Schreibweise einschließlich
 * Abwärtsbewegungen und des Null-Fallbacks für seltene Vorzeichen.
 */
export function transposeDiatonic(name, accidental, octave, steps, semitones) {
  const startPitch = chromaticPitch(name, 0, accidental);
  const targetIndex = diatonicIndex(name, 4) + steps;
  const target = noteFromDiatonicIndex(targetIndex);
  const targetBase = chromaticPitch(target.name, 0, null);
  const diff = (((((startPitch + semitones) % 12 + 12) % 12 - targetBase) % 12) + 12) % 12;
  const targetAccidental = diff === 0 ? null
    : diff === 1 ? '#'
    : diff === 11 ? 'b'
    : diff === 2 ? '##'
    : diff === 10 ? 'bb'
    : null;
  return {name:target.name,octave:octave + target.octave - 4,accidental:targetAccidental};
}
