/**
 * Reine Tonhöhenberechnung ohne Darstellung, DOM oder React.
 *
 * Die internen Oktavwerte und absoluten Halbtonwerte entsprechen exakt
 * dem bisherigen Anwendungscode (c4 = 48; nicht MIDI-c4 = 60).
 * Darstellungs- und Eingabelogik steht in notennamen.mjs.
 */
const DIATONIC = Object.freeze({ c: 0, d: 1, e: 2, f: 3, g: 4, a: 5, h: 6 });
const NAMES = Object.freeze(['c', 'd', 'e', 'f', 'g', 'a', 'h']);
const CHROMATIC = Object.freeze({ c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, h: 11 });

/** 0 entspricht c4, 1 entspricht d4, -1 entspricht h3. */
export function diatonicIndex(name, octave) {
  return (octave - 4) * 7 + (DIATONIC[name] || 0);
}

/** Kehrt den diatonischen Index in Notenname und Oktave um. */
export function noteFromDiatonicIndex(index) {
  return {
    name: NAMES[(index % 7 + 7) % 7],
    octave: Math.floor(index / 7) + 4,
  };
}

/** Absoluter chromatischer Halbtonwert, einschließlich Vorzeichen. */
export function chromaticPitch(name, octave, accidental = null) {
  let value = octave * 12 + (CHROMATIC[name] || 0);
  if (accidental === '#') value++;
  else if (accidental === 'b') value--;
  else if (accidental === '##') value += 2;
  else if (accidental === 'bb') value -= 2;
  return value;
}
