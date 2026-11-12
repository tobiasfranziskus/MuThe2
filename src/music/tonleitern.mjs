/** Tonleiter-Daten und Berechnungen ohne UI-/DOM-Abhängigkeit.
 * Reihenfolge und Tonhöhen bleiben gegenüber dem bisherigen Bundle unverändert.
 */
import { transposeDiatonic } from './intervalle.mjs';

export const MAJOR_KEYS = [
  [
    "c",
    null,
    "C"
  ],
  [
    "g",
    null,
    "G"
  ],
  [
    "d",
    null,
    "D"
  ],
  [
    "a",
    null,
    "A"
  ],
  [
    "e",
    null,
    "E"
  ],
  [
    "f",
    null,
    "F"
  ],
  [
    "h",
    "b",
    "B"
  ],
  [
    "e",
    "b",
    "Es"
  ],
  [
    "h",
    null,
    "H"
  ],
  [
    "a",
    "b",
    "As"
  ]
];

export const MINOR_KEYS = [
  [
    "a",
    null,
    "a"
  ],
  [
    "e",
    null,
    "e"
  ],
  [
    "d",
    null,
    "d"
  ],
  [
    "g",
    null,
    "g"
  ],
  [
    "c",
    null,
    "c"
  ],
  [
    "h",
    null,
    "h"
  ],
  [
    "f",
    null,
    "f"
  ],
  [
    "c",
    "#",
    "cis"
  ],
  [
    "h",
    "b",
    "b"
  ],
  [
    "g",
    "#",
    "gis"
  ]
];

export const MAJOR_STEPS = [
  0,
  2,
  4,
  5,
  7,
  9,
  11,
  12
];

export const NATURAL_MINOR_STEPS = [
  0,
  2,
  3,
  5,
  7,
  8,
  10,
  12
];

export const HARMONIC_MINOR_STEPS = [
  0,
  2,
  3,
  5,
  7,
  8,
  11,
  12
];

export const MELODIC_MINOR_STEPS = [
  0,
  2,
  3,
  5,
  7,
  9,
  11,
  12
];

export const CHROMATIC_SCALES = {
  "c4": [
    "c4",
    "cis4",
    "d4",
    "dis4",
    "e4",
    "f4",
    "fis4",
    "g4",
    "gis4",
    "a4",
    "ais4",
    "h4",
    "c5"
  ],
  "f4": [
    "f4",
    "fis4",
    "g4",
    "gis4",
    "a4",
    "ais4",
    "h4",
    "c5",
    "cis5",
    "d5",
    "dis5",
    "e5",
    "f5"
  ],
  "a4": [
    "a4",
    "ais4",
    "h4",
    "c5",
    "cis5",
    "d5",
    "dis5",
    "e5",
    "f5",
    "fis5",
    "g5",
    "gis5",
    "a5"
  ]
};

export const WHOLE_TONE_SCALES = {
  "c4": [
    "c4",
    "d4",
    "e4",
    "fis4",
    "gis4",
    "ais4",
    "c5"
  ],
  "f4": [
    "f4",
    "g4",
    "a4",
    "h4",
    "cis5",
    "dis5",
    "f5"
  ],
  "a4": [
    "a4",
    "h4",
    "cis5",
    "dis5",
    "f5",
    "g5",
    "a5"
  ]
};

/** Diatonisch korrekt geschriebene Tonleiter aus Halbtonabständen. */
export function scaleFromSemitones(name, accidental, octave, offsets) {
  return offsets.map((semitones, steps) => transposeDiatonic(name, accidental, octave, steps, semitones));
}

/** Kompakte SPN-Notennamen für die chromatischen und Ganzton-Vorlagen. */
export function parseCompactPitch(text) {
  const match = text.match(/^([a-h])(is|es|s)?(\d)$/);
  if (!match) return null;
  const [, name, suffix, index] = match;
  const octave = parseInt(index, 10);
  return name === 'b' && !suffix
    ? { name: 'h', octave, accidental: 'b' }
    : { name, octave, accidental: suffix ? (suffix === 'is' ? '#' : 'b') : null };
}
