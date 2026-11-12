import assert from 'node:assert/strict';
import test from 'node:test';
import { formatGermanNote, parseGermanNoteInput } from '../src/music/notennamen.mjs';

test('Notennamen werden in deutscher Oktavschreibweise ausgegeben', () => {
  assert.equal(formatGermanNote('c', 2, null), 'C');
  assert.equal(formatGermanNote('c', 1, null), 'C̲');
  assert.equal(formatGermanNote('c', 0, null), 'C̲̲');
  assert.equal(formatGermanNote('f', 3, null), 'f');
  assert.equal(formatGermanNote('f', 4, null), 'f¹');
  assert.equal(formatGermanNote('f', 5, null), 'f²');
  assert.equal(formatGermanNote('f', 6, null), 'f³');
  assert.equal(formatGermanNote('h', 4, 'b'), 'b¹');
  assert.equal(formatGermanNote('c', 4, '#'), 'cis¹');
  assert.equal(formatGermanNote('c', 4, '##'), 'cisis¹');
  assert.equal(formatGermanNote('e', 4, 'bb'), 'eses¹');
});

test('f1, f¹ und f4 meinen auch f¹', () => {
  const f1 = { name: 'f', octave: 4, accidental: null };
  assert.deepEqual(parseGermanNoteInput('f1'), [
    { name: 'f', octave: 1, accidental: null },
    f1,
  ]);
  assert.deepEqual(parseGermanNoteInput('f¹'), [f1]);
  assert.deepEqual(parseGermanNoteInput('f4'), [f1]);
  assert.deepEqual(parseGermanNoteInput(' f 1 '), [
    { name: 'f', octave: 1, accidental: null },
    f1,
  ]);
});

test('B/H und Vorzeichen werden nach deutscher Konvention gelesen', () => {
  assert.deepEqual(parseGermanNoteInput('b'), [{ name: 'h', octave: 3, accidental: 'b' }]);
  assert.deepEqual(parseGermanNoteInput('B'), [{ name: 'h', octave: 2, accidental: 'b' }]);
  assert.deepEqual(parseGermanNoteInput('H'), [{ name: 'h', octave: 2, accidental: null }]);
  assert.deepEqual(parseGermanNoteInput('cis¹'), [{ name: 'c', octave: 4, accidental: '#' }]);
  assert.deepEqual(parseGermanNoteInput('F̲'), [{ name: 'f', octave: 1, accidental: null }]);
  assert.deepEqual(parseGermanNoteInput('es'), [{ name: 'e', octave: 3, accidental: 'b' }]);
  assert.deepEqual(parseGermanNoteInput('ceses'), [{ name: 'c', octave: 3, accidental: 'bb' }]);
});

test('Ungültige und leere Eingaben bleiben ungültig', () => {
  for (const value of ['', ' ', 'z1', 'x¹', 'b#', null]) {
    assert.deepEqual(parseGermanNoteInput(value), []);
  }
});
