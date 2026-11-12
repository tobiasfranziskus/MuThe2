import test from 'node:test';
import assert from 'node:assert/strict';
import {diatonicIndex} from '../src/music/tonhoehen.mjs';
import {createNotationRenderers} from '../src/ui/notensystem.mjs';

// Ursprüngliche SVG-Ausgaben aus dem unveränderten src/app.js vor der
// Modulauslagerung. Jede Prüfsumme deckt die vollständige Ausgabe ab,
// einschließlich Koordinaten, Vorzeichen, Schlüssel, Beschriftung und Farben.
const fixtures = [
  {
    "label": "Violinschlüssel: Grundlinie und einfache Noten",
    "kind": "renderStaff",
    "args": [
      {
        "clef": "treble",
        "notes": [
          {
            "name": "c",
            "octave": 4
          },
          {
            "name": "e",
            "octave": 4
          },
          {
            "name": "g",
            "octave": 4
          }
        ]
      }
    ],
    "expected": "cf434b81"
  },
  {
    "label": "Bassschlüssel: Hilfslinien und Doppelvorzeichen",
    "kind": "renderStaff",
    "args": [
      {
        "clef": "bass",
        "notes": [
          {
            "name": "h",
            "octave": 2,
            "accidental": "b"
          },
          {
            "name": "f",
            "octave": 3,
            "accidental": "##"
          },
          {
            "name": "d",
            "octave": 4,
            "accidental": "bb"
          },
          {
            "name": "c",
            "octave": 6
          }
        ]
      }
    ],
    "expected": "e1c2f8ed"
  },
  {
    "label": "Altschlüssel: sieben Kreuze und 6/8-Takt",
    "kind": "renderStaff",
    "args": [
      {
        "clef": "alto",
        "keySig": {
          "type": "sharp",
          "count": 7
        },
        "timeSig": [
          6,
          8
        ],
        "notes": [
          {
            "name": "c",
            "octave": 4
          },
          {
            "name": "f",
            "octave": 4,
            "accidental": "#"
          }
        ]
      }
    ],
    "expected": "7bcda366"
  },
  {
    "label": "Generalvorzeichen: sechs Bs",
    "kind": "renderStaff",
    "args": [
      {
        "clef": "treble",
        "keySig": {
          "type": "flat",
          "count": 6
        },
        "notes": []
      }
    ],
    "expected": "ed146404"
  },
  {
    "label": "Taktangabe und Pausen, inklusive Punktierung",
    "kind": "renderStaff",
    "args": [
      {
        "clef": "bass",
        "timeSig": [
          4,
          4
        ],
        "notes": [
          {
            "name": "c",
            "octave": 3,
            "value": "rwhole"
          },
          {
            "name": "d",
            "octave": 3,
            "value": "rquarter"
          },
          {
            "name": "e",
            "octave": 3,
            "value": "dotq"
          },
          {
            "name": "f",
            "octave": 3,
            "value": "rdoth"
          }
        ]
      }
    ],
    "expected": "dbec5ced"
  },
  {
    "label": "alla breve",
    "kind": "renderStaff",
    "args": [
      {
        "clef": "treble",
        "timeSym": "alla",
        "notes": [
          {
            "name": "c",
            "octave": 4
          }
        ]
      }
    ],
    "expected": "e390cfbc"
  },
  {
    "label": "Nummerierte Noten mit Achteltriolen",
    "kind": "renderStaff",
    "args": [
      {
        "clef": "treble",
        "numbered": true,
        "notes": [
          {
            "name": "c",
            "octave": 4,
            "value": "eighth",
            "trip": true
          },
          {
            "name": "d",
            "octave": 4,
            "value": "eighth",
            "trip": true
          },
          {
            "name": "e",
            "octave": 4,
            "value": "eighth",
            "trip": true
          },
          {
            "name": "g",
            "octave": 4,
            "value": "quarter"
          }
        ]
      }
    ],
    "expected": "54f228fb"
  },
  {
    "label": "Gestapelter Dreiklang",
    "kind": "renderStaff",
    "args": [
      {
        "clef": "alto",
        "stacked": true,
        "notes": [
          {
            "name": "c",
            "octave": 4
          },
          {
            "name": "e",
            "octave": 4,
            "accidental": "b"
          },
          {
            "name": "g",
            "octave": 4,
            "accidental": "#"
          }
        ]
      }
    ],
    "expected": "fc1ba863"
  },
  {
    "label": "Leeres Klaviersystem",
    "kind": "renderGrandStaff",
    "args": [
      {
        "chords": []
      }
    ],
    "expected": "b7acff10"
  },
  {
    "label": "Klaviersystem: vierstimmig und markierte Funktion",
    "kind": "renderGrandStaff",
    "args": [
      {
        "chords": [
          {
            "treble": [
              {
                "name": "g",
                "octave": 4
              },
              {
                "name": "c",
                "octave": 5
              }
            ],
            "bass": [
              {
                "name": "c",
                "octave": 3
              },
              {
                "name": "e",
                "octave": 3
              }
            ]
          },
          {
            "treble": [
              {
                "name": "f",
                "octave": 4,
                "accidental": "#"
              },
              {
                "name": "h",
                "octave": 4
              }
            ],
            "bass": [
              {
                "name": "g",
                "octave": 2
              },
              {
                "name": "d",
                "octave": 3
              }
            ]
          }
        ],
        "highlight": 1
      }
    ],
    "expected": "a2b5c04f"
  },
  {
    "label": "Noteneingabe, noch nicht bewertet",
    "kind": "renderEditableStaff",
    "args": [
      {
        "clef": "treble",
        "totalSlots": 3,
        "slotW": 52,
        "fixedNotes": [
          {
            "name": "c",
            "octave": 4
          }
        ]
      },
      [
        {
          "name": "e",
          "octave": 4
        }
      ],
      [],
      false
    ],
    "expected": "a5ac0a8c"
  },
  {
    "label": "Noteneingabe im Bassschlüssel mit Feedback",
    "kind": "renderEditableStaff",
    "args": [
      {
        "clef": "bass",
        "totalSlots": 3,
        "slotW": 52,
        "fixedNotes": [
          {
            "name": "c",
            "octave": 3
          }
        ]
      },
      [
        {
          "name": "e",
          "octave": 3
        },
        {
          "name": "g",
          "octave": 3
        }
      ],
      [
        true,
        false
      ],
      true
    ],
    "expected": "3022d787"
  },
  {
    "label": "Noteneingabe gestapelter Akkord, Feedback",
    "kind": "renderEditableStaff",
    "args": [
      {
        "clef": "alto",
        "stacked": true,
        "totalSlots": 3,
        "fixedNotes": []
      },
      [
        {
          "name": "c",
          "octave": 4
        },
        {
          "name": "e",
          "octave": 4,
          "accidental": "b"
        },
        {
          "name": "g",
          "octave": 4
        }
      ],
      [
        true,
        true,
        false
      ],
      true
    ],
    "expected": "7cc288b8"
  },
  {
    "label": "Noteneingabe gestapelter Akkord, unbearbeitet",
    "kind": "renderEditableStaff",
    "args": [
      {
        "clef": "treble",
        "stacked": true,
        "totalSlots": 3,
        "fixedNotes": [
          {
            "name": "c",
            "octave": 4
          }
        ]
      },
      [
        {
          "name": "e",
          "octave": 4
        },
        {
          "name": "g",
          "octave": 4
        }
      ],
      [],
      false
    ],
    "expected": "45c2d4cc"
  }
];

function fnv1a(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

const renderers = createNotationRenderers({
  diatonicIndex,
  clefOffset: clef => clef === 'treble' ? 2 : clef === 'alto' ? -4 : -10,
});

for (const fixture of fixtures) {
  test(fixture.label, () => {
    const before = structuredClone(fixture.args);
    const output = renderers[fixture.kind](...fixture.args);
    assert.equal(typeof output, 'string');
    assert.equal(fnv1a(output), fixture.expected);
    assert.deepEqual(fixture.args, before, 'SVG-Erzeugung darf Eingaben nicht verändern');
  });
}

test('alle drei SVG-Renderer bleiben unabhängig von React und DOM', () => {
  assert.equal(typeof renderers.renderStaff, 'function');
  assert.equal(typeof renderers.renderGrandStaff, 'function');
  assert.equal(typeof renderers.renderEditableStaff, 'function');
  const score = renderers.renderStaff({clef:'treble',notes:[{name:'c',octave:4}]});
  assert.match(score, /aria-label="Notensystem"/);
  assert.ok(score.startsWith('<svg ') && score.endsWith('</svg>'));
});
