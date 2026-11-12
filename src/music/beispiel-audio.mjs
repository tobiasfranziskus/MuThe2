/**
 * Auswahl spielbarer Aufgabenbeispiele ohne DOM- oder Audio-Nebenwirkungen.
 */
const isPitch = note => !!note && typeof note.name === 'string' && Number.isFinite(note.octave);
const isSounding = note => isPitch(note) && !String(note.value || '').startsWith('r');

export function playableTaskAudio(task) {
  if (!task) return null;
  if (typeof task.playFn === 'function') return {kind:'custom', playFn:task.playFn};
  const chords = task.staff?.chords;
  if (Array.isArray(chords) && chords.some(chord =>
    [...(chord.treble || []),...(chord.bass || [])].some(isSounding))) {
    return {kind:'chords', chords};
  }
  const notes = task.staff?.notes;
  if (Array.isArray(notes) && notes.some(isSounding)) {
    return {kind:notes.some(note => !!note?.value)?'rhythm':'notes',
      notes, melodic:notes.length === 2};
  }
  if (Array.isArray(task.expected) && task.expected.length && task.expected.every(isSounding)) {
    return {kind:'notes', notes:task.expected, melodic:task.audioMode !== 'chord'};
  }
  return null;
}

export function playTaskAudio(task,{playNotes,playRhythm,playChords}) {
  const example = playableTaskAudio(task);
  if (!example) return false;
  switch (example.kind) {
    case 'custom': example.playFn(); break;
    case 'chords': playChords(example.chords); break;
    case 'rhythm': playRhythm(example.notes); break;
    case 'notes': playNotes(example.notes,example.melodic); break;
  }
  return true;
}
