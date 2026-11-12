/**
 * SVG-Eingabe: Maus-/Touch-Koordinaten in Noten umrechnen.
 * Transformationsmatrizen (auch die Drehung beim Tischduell) werden verwendet;
 * beim Import wird weder auf DOM noch auf React zugegriffen.
 */
import { noteFromDiatonicIndex } from '../music/tonhoehen.mjs';

/** Reine SVG-Positionsberechnung; null außerhalb des Eingabefeldes. */
export function noteFromStaffPoint(x, y, width, clef = 'treble', accidental = null) {
  if (x < 74 || x > width - 14 || y < 5 || y > 155) return null;
  const offset = clef === 'treble' ? 2 : clef === 'alto' ? -4 : -10;
  let step = Math.round((90 - y) / 5);
  step = Math.max(-13, Math.min(17, step));
  const note = noteFromDiatonicIndex(step + offset);
  return {name: note.name, octave: note.octave, accidental: accidental === 'n' ? null : accidental};
}

/** SVG-Event zu Note. getScreenCTM berücksichtigt Skalierung und Drehung. */
export function noteFromSvgEvent(event, clef = 'treble', accidental = null) {
  const svg = event.currentTarget;
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const position = point.matrixTransform(matrix.inverse());
  return noteFromStaffPoint(position.x, position.y, svg.viewBox.baseVal.width, clef, accidental);
}
