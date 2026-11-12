import test from 'node:test';
import assert from 'node:assert/strict';
import {
  holeAudioKontext, setzeAudioSitzung, installiereFreischaltung, pruefeNachWiedergabe,
  zeigeTonHinweis, setzeAudioStartZurueck,
} from '../src/music/audio-start.mjs';

function fakeGlobal({state = 'suspended', audioSession = {type: 'auto'}, ctor = true} = {}) {
  const log = {created: 0, resumed: 0, buffers: 0};
  class Ctx {
    constructor() { log.created++; this.state = state; this.destination = {}; }
    resume() { log.resumed++; this.state = 'running'; return Promise.resolve(); }
    createBuffer() { log.buffers++; return {}; }
    createBufferSource() { return {connect() {}, start() {}}; }
  }
  const listeners = new Map();
  const global = {
    navigator: {userAgent: 'iPad', maxTouchPoints: 5, audioSession},
    document: {
      addEventListener: (n, f) => listeners.set(n, f),
      removeEventListener: n => listeners.delete(n),
      body: {append() {}},
      createElement: () => ({style: {}, setAttribute() {}, addEventListener() {}, remove() {}}),
    },
  };
  if (ctor) global.AudioContext = Ctx;
  return {global, log, listeners};
}

test('Kontext wird einmal angelegt, fortgesetzt und stets wiederverwendet', async () => {
  setzeAudioStartZurueck();
  const {global, log} = fakeGlobal();
  const a = holeAudioKontext(global);
  const b = holeAudioKontext(global);
  assert.equal(a, b);
  assert.equal(log.created, 1);
  assert.equal(log.resumed, 1);
  await new Promise(r => setTimeout(r, 5));
  assert.equal(log.buffers, 1, 'stiller Impuls nach erfolgreichem Fortsetzen');
});

test('Audiositzung wird auf playback gestellt, wenn unterstützt', () => {
  setzeAudioStartZurueck();
  const session = {type: 'auto'};
  assert.equal(setzeAudioSitzung({navigator: {audioSession: session}}), true);
  assert.equal(session.type, 'playback');
  assert.equal(setzeAudioSitzung({navigator: {}}), false);
  assert.equal(setzeAudioSitzung({navigator: {get audioSession() { throw new Error('x'); }}}), false);
});

test('Ohne Web-Audio liefert der Zugriff null statt Fehler', () => {
  setzeAudioStartZurueck();
  assert.equal(holeAudioKontext({navigator: {}}), null);
  assert.equal(installiereFreischaltung({navigator: {}, document: {}}), false);
});

test('Freischaltung beim ersten Tippen entfernt sich danach selbst', () => {
  setzeAudioStartZurueck();
  const {global, log, listeners} = fakeGlobal();
  assert.equal(installiereFreischaltung(global), true);
  assert.equal(installiereFreischaltung(global), false);
  assert.ok(listeners.has('pointerdown') && listeners.has('touchend'));
  listeners.get('pointerdown')();
  assert.equal(log.created, 1);
  assert.equal(listeners.size, 0, 'Listener entfernt, sobald der Kontext läuft');
});

test('Hinweis erscheint höchstens einmal', () => {
  setzeAudioStartZurueck();
  const {global} = fakeGlobal();
  assert.equal(zeigeTonHinweis(global.document), true);
  assert.equal(zeigeTonHinweis(global.document), false);
  assert.equal(zeigeTonHinweis({}), false);
});

test('Nach dem Anhören ohne laufenden Kontext wird der Hinweis angestoßen', async () => {
  setzeAudioStartZurueck();
  const {global} = fakeGlobal({audioSession: null});
  holeAudioKontext(global);
  assert.doesNotThrow(() => pruefeNachWiedergabe(global, 1));
  await new Promise(r => setTimeout(r, 20));
  assert.equal(zeigeTonHinweis(global.document), false, 'wurde bereits gezeigt (iPad ohne audioSession)');
});
