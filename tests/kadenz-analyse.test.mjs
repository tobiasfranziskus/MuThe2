import assert from 'node:assert/strict';
import test from 'node:test';
import {createCadenceAnalysisTaskGenerators} from '../src/aufgaben/kadenz-analyse.mjs';
import {MAJOR_FUNCTIONS} from '../src/aufgaben/harmoniefunktionen.mjs';

function seeded(seed) {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

const choose = items => items[Math.floor(Math.random() * items.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = values => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
const fixture = () => createCadenceAnalysisTaskGenerators({choose,shuffle,randomInt});

test('Kadenzen, Stimmführung und Analyse erzeugen jeweils gültige MC-Aufgaben', () => {
  const saved = Math.random;
  let checked = 0;
  try {
    Math.random = seeded(44318);
    const generators = fixture();
    for (let k = 0; k < 350; k++) {
      for (const name of ['cadence','voiceLeading','harmonicAnalysis']) {
        const task = generators[name]();
        checked++;
        assert.equal(task.mode,'mc',name);
        assert.ok(task.q && task.explanation,name);
        assert.equal(task.options.length,4,name);
        assert.equal(new Set(task.options).size,4,name);
        assert.ok(task.correct >= 0 && task.correct < 4,name);
      }
    }
  } finally {
    Math.random = saved;
  }
  assert.equal(checked,1050);
});

test('Dur-/Moll-Kadenzfragen liefern passende Formelsymbole', () => {
  const saved = Math.random;
  let major = 0, minor = 0;
  try {
    Math.random = seeded(67281);
    const generators = fixture();
    for (let k = 0; k < 250; k++) {
      const task = generators.cadence();
      const answer = task.options[task.correct];
      if (task.q.includes('t – s – D – t')) {
        minor++;
        assert.match(task.q, /-Moll/);
      } else {
        major++;
        assert.ok(task.q.includes('T – S – D – T'));
        assert.match(task.q, /-Dur/);
      }
      assert.equal(answer.split(' – ').length,4);
      assert.ok(task.explanation.includes(answer));
    }
  } finally {
    Math.random = saved;
  }
  assert.ok(major > 0 && minor > 0);
});

test('Stimmführung benutzt zwei vierstimmige Akkorde im Klaviersystem', () => {
  const saved = Math.random;
  const variants = new Set();
  try {
    Math.random = seeded(15329);
    const generators = fixture();
    for (let i = 0; i < 240; i++) {
      const task = generators.voiceLeading();
      const answer = task.options[task.correct];
      variants.add(answer);
      assert.match(task.q,/Stimmführungsfehler/);
      assert.equal(task.staff.clef,'treble');
      assert.equal(task.staff.chords.length,2);
      assert.equal(task.staff.highlight,null);
      for (const chord of task.staff.chords) {
        assert.equal(chord.treble.length,2);
        assert.equal(chord.bass.length,2);
      }
    }
  } finally {
    Math.random = saved;
  }
  assert.ok(variants.has('Parallele Quinten'));
  assert.ok(variants.has('Parallele Oktaven'));
  assert.ok(variants.has('Kein Stimmführungsfehler'));
});

test('Harmonische Analyse verwendet den gemeinsamen Funktionskatalog', () => {
  assert.deepEqual(MAJOR_FUNCTIONS.map(f => f.sym),['T','S','D','Tp','Sp','Dp']);
  const saved = Math.random;
  let count = 0;
  const highlighted = new Set();
  try {
    Math.random = seeded(23901);
    const generators = fixture();
    for (let i = 0; i < 350; i++) {
      const task = generators.harmonicAnalysis();
      count++;
      assert.match(task.q,/Harmonische Analyse/);
      assert.equal(task.staff.chords.length,4);
      assert.ok(task.staff.highlight >= 0 && task.staff.highlight < 4);
      highlighted.add(task.staff.highlight);
      for (const chord of task.staff.chords) {
        assert.equal(chord.treble.length,3);
        assert.equal(chord.bass.length,1);
      }
      assert.ok(task.explanation.includes(task.options[task.correct]));
    }
  } finally {
    Math.random = saved;
  }
  assert.equal(count,350);
  assert.equal(highlighted.size,4);
});

test('Stimmführung: jedes Beispiel enthält genau die behauptete Parallele (sonst keine)', () => {
  const halbtoene = {c:0, d:2, e:4, f:5, g:7, a:9, h:11};
  const hoehe = n => 12 * n.octave + halbtoene[n.name];
  const gefunden = new Map();
  const saved = Math.random;
  try {
    Math.random = seeded(77001);
    const generators = fixture();
    for (let i = 0; i < 120; i++) {
      const task = generators.voiceLeading();
      const [a, b] = task.staff.chords.map(c => [...c.bass, ...c.treble]);
      gefunden.set(JSON.stringify([a, b]), {antwort: task.options[task.correct], a, b});
    }
  } finally {
    Math.random = saved;
  }
  assert.equal(gefunden.size, 3);
  for (const {antwort, a, b} of gefunden.values()) {
    const x = a.map(hoehe), y = b.map(hoehe);
    for (const toene of [x, y]) assert.deepEqual(toene, [...toene].sort((p, q) => p - q), 'keine Stimmkreuzung');
    const fehler = new Set();
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        const vorher = (x[j] - x[i]) % 12, nachher = (y[j] - y[i]) % 12;
        // beide Stimmen bewegen sich in eine reine Quinte/Oktave, die vorher schon bestand
        // (Parallele oder Antiparallele)
        if (x[i] !== y[i] && x[j] !== y[j] && vorher === nachher && (nachher === 0 || nachher === 7)) {
          fehler.add(nachher === 0 ? 'Parallele Oktaven' : 'Parallele Quinten');
        }
      }
    }
    assert.deepEqual([...fehler], antwort === 'Kein Stimmführungsfehler' ? [] : [antwort]);
    for (let i = 0; i < 3; i++) assert.ok(Math.abs(y[i + 1] - x[i + 1]) <= 7, 'keine großen Sprünge in den Oberstimmen');
  }
});
