/**
 * Deutsche Notennamen, Vorzeichen und Oktavschreibweisen.
 *
 * Fachlogik ohne React/DOM-Abhängigkeiten. Die Eingabeauswertung bewahrt
 * die bisherigen Schreibweisen einschließlich der mehrdeutigen Angabe "f1":
 * deutsches f¹ (Oktave 4) und Scientific Pitch f1 (Oktave 1).
 */

const sharpNames = {
  c: 'cis', d: 'dis', e: 'eis', f: 'fis', g: 'gis', a: 'ais', h: 'his',
};
const flatNames = {
  c: 'ces', d: 'des', e: 'es', f: 'fes', g: 'ges', a: 'as', h: 'b',
};
const doubleFlatNames = {
  c: 'ceses', d: 'deses', e: 'eses', f: 'feses',
  g: 'geses', a: 'asas', h: 'heses',
};

export function formatGermanNote(name, octave, accidental = null) {
  let display = name;

  if (accidental === '#') display = sharpNames[name] || name;
  else if (accidental === 'b') display = flatNames[name] || name;
  else if (accidental === '##') display = (sharpNames[name] || name) + 'is';
  else if (accidental === 'bb') display = doubleFlatNames[name] || name;

  if (octave <= 2) {
    const upper = display.charAt(0).toUpperCase() + display.slice(1);
    if (octave === 2) return upper;
    return octave === 1 ? upper + '\u0332' : upper + '\u0332\u0332';
  }

  if (octave === 3) return display;
  if (octave === 4) return display + '¹';
  if (octave === 5) return display + '²';
  if (octave === 6) return display + '³';
  return display;
}

function parseAccidental(name, suffix) {
  // Im deutschen System bezeichnet B ein erniedrigtes H.
  if (name === 'b') {
    if (suffix === 'eses') return { name: 'h', accidental: 'bb' };
    if (suffix && suffix !== 'es' && suffix !== 's') {
      return { name: null, accidental: null };
    }
    return { name: 'h', accidental: 'b' };
  }

  let accidental = null;
  if (suffix === 'is' || suffix === '#' || suffix === 'isis' || suffix === '##') {
    accidental = suffix === 'isis' || suffix === '##' ? '##' : '#';
  } else if (['es', 's', 'b', 'eses', 'bb'].includes(suffix)) {
    accidental = suffix === 'eses' || suffix === 'bb' ? 'bb' : 'b';
  }
  return { name, accidental };
}

/**
 * Liefert alle zu einer Eingabe passenden Noten.
 * Die Ziffern 1–3 sind absichtlich doppeldeutig: deutsche Hochzahl-
 * Kurzschreibweise und internationale Oktavnummer (SPN).
 */
export function parseGermanNoteInput(input) {
  const result = [];
  if (!input) return result;

  const normalized = input.trim().replace(/\s+/g, '').replace(/\u266f/g, '#').replace(/\u266d/g, 'b');
  const underlineCount = (normalized.match(/[\u0332_]/g) || []).length;
  const text = normalized.replace(/[\u0332_]/g, '');
  const notePattern = '(isis|eses|is|es|s|##|bb|#|b)?';

  let match = text.toLowerCase().match(new RegExp('^([a-h])' + notePattern + '(\\d)$'));
  if (match) {
    const note = parseAccidental(match[1], match[2] || '');
    if (note.name) {
      const octave = parseInt(match[3], 10);
      result.push({ name: note.name, octave, accidental: note.accidental });
      if (octave >= 1 && octave <= 3) {
        result.push({ name: note.name, octave: octave + 3, accidental: note.accidental });
      }
    }
  }

  match = text.match(new RegExp('^([a-hA-H])' + notePattern + '([\\u00b9\\u00b2\\u00b3])$'));
  if (match) {
    const note = parseAccidental(match[1].toLowerCase(), (match[2] || '').toLowerCase());
    if (note.name) {
      result.push({
        name: note.name,
        octave: { '¹': 4, '²': 5, '³': 6 }[match[3]],
        accidental: note.accidental,
      });
    }
  }

  match = text.match(new RegExp('^([a-hA-H])' + notePattern + '$'));
  if (match) {
    const upperCase = match[1] === match[1].toUpperCase();
    const note = parseAccidental(match[1].toLowerCase(), (match[2] || '').toLowerCase());
    if (note.name) {
      const octave = underlineCount === 0 ? (upperCase ? 2 : 3) : Number(underlineCount === 1);
      result.push({ name: note.name, octave, accidental: note.accidental });
    }
  }

  return result;
}
