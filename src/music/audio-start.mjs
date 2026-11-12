/**
 * Zuverlässiger Audiostart für iPad/iPhone-Safari und andere Browser.
 *
 * Probleme, die hier behoben werden:
 * - Der AudioContext startet auf iOS/iPadOS gesperrt und muss durch eine
 *   Nutzergeste freigeschaltet werden. Das passiert jetzt beim allerersten
 *   Tippen irgendwo auf der Seite (nicht erst beim Anhören).
 * - Safari schaltet Web Audio bei aktivem Ton-Aus-Schalter stumm. Wo
 *   `navigator.audioSession` existiert (Safari ab 16.4), wird die
 *   Audiositzung auf „playback“ gesetzt, dann bleibt der Ton hörbar.
 * - Kam nach dem Anhören kein laufender Kontext zustande oder ist die
 *   Stummschaltung nicht umgehbar, erscheint ein kurzer Hinweis statt
 *   stiller Funktionslosigkeit.
 * Alles ist fehlertolerant und ohne Einfluss auf die Tonerzeugung selbst.
 */

let kontext = null;
let sitzungGesetzt = false;
let hinweisGezeigt = false;
let freischaltungAktiv = false;

function konstruktor(global = globalThis) {
  return global.AudioContext || global.webkitAudioContext || null;
}

/** Wiedergabe-Audiositzung (umgeht den Ton-Aus-Schalter), soweit unterstützt. */
export function setzeAudioSitzung(global = globalThis) {
  try {
    const sitzung = global.navigator?.audioSession;
    if (sitzung && sitzung.type !== 'playback') sitzung.type = 'playback';
    sitzungGesetzt = !!sitzung;
  } catch {
    sitzungGesetzt = false;
  }
  return sitzungGesetzt;
}

/** Spielt einen stillen Mini-Puffer; das gilt für Safari als echte Wiedergabe. */
function stillerImpuls(ctx) {
  try {
    const puffer = ctx.createBuffer(1, 1, 22050);
    const quelle = ctx.createBufferSource();
    quelle.buffer = puffer;
    quelle.connect(ctx.destination);
    quelle.start(0);
  } catch { /* kein Problem */ }
}

function fortsetzen(ctx) {
  if (ctx.state === 'running') return;
  try {
    const versprechen = ctx.resume();
    if (versprechen && typeof versprechen.then === 'function') {
      versprechen.then(() => stillerImpuls(ctx), () => {});
    }
  } catch { /* nächster Versuch beim nächsten Tippen */ }
}

/**
 * Liefert den gemeinsamen AudioContext (oder null). Darf aus einem
 * Klick-Handler aufgerufen werden; versucht laufend, ihn zu starten.
 */
export function holeAudioKontext(global = globalThis) {
  const Ctor = konstruktor(global);
  if (!Ctor) return null;
  try {
    setzeAudioSitzung(global);
    if (!kontext || kontext.state === 'closed') kontext = new Ctor();
    fortsetzen(kontext);
    return kontext;
  } catch (fehler) {
    console.warn('Audiowiedergabe nicht verfügbar', fehler);
    return null;
  }
}

function istApple(global = globalThis) {
  const nav = global.navigator || {};
  const text = String(nav.userAgent || '') + ' ' + String(nav.platform || '');
  return /iPad|iPhone|iPod/.test(text) || (/Mac/.test(text) && Number(nav.maxTouchPoints) > 1);
}

/** Einmaliger, unaufdringlicher Hinweis; verschwindet von selbst. */
export function zeigeTonHinweis(doc = globalThis.document) {
  if (hinweisGezeigt || !doc?.body) return false;
  hinweisGezeigt = true;
  const box = doc.createElement('div');
  box.setAttribute('role', 'status');
  box.textContent = 'Hörst du nichts? Prüfe die Lautstärke und ob der Ton nicht stummgeschaltet ist.';
  box.style.cssText = 'position:fixed;left:50%;bottom:max(24px,env(safe-area-inset-bottom));' +
    'transform:translateX(-50%);z-index:9999;max-width:min(92vw,520px);padding:12px 18px;' +
    'border-radius:16px;background:rgba(30,41,59,.92);color:#f8fafc;font:600 15px/1.35 -apple-system,system-ui,sans-serif;' +
    'box-shadow:0 8px 30px rgba(0,0,0,.35);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);text-align:center;';
  doc.body.append(box);
  setTimeout(() => box.remove(), 6500);
  box.addEventListener('pointerdown', () => box.remove());
  return true;
}

/**
 * Nach einem Anhören aufrufen: Läuft der Kontext nicht, oder lässt sich die
 * Stummschaltung auf Apple-Geräten nicht umgehen, wird einmal ein Hinweis gezeigt.
 */
export function pruefeNachWiedergabe(global = globalThis, wartezeit = 700) {
  setTimeout(() => {
    try {
      const laeuft = kontext && kontext.state === 'running';
      if (!laeuft || (istApple(global) && !sitzungGesetzt)) zeigeTonHinweis(global.document);
    } catch { /* Hinweis ist nur eine Hilfe */ }
  }, wartezeit);
}

/** Beim ersten Tippen/Tastendruck Kontext anlegen und freischalten. */
export function installiereFreischaltung(global = globalThis) {
  if (freischaltungAktiv || !global.document || !konstruktor(global)) return false;
  freischaltungAktiv = true;
  const ereignisse = ['pointerdown', 'touchend', 'click', 'keydown'];
  const entfernen = () => ereignisse.forEach(name => global.document.removeEventListener(name, geste, true));
  function geste() {
    const ctx = holeAudioKontext(global);
    if (ctx && ctx.state === 'running') entfernen();
  }
  ereignisse.forEach(name => global.document.addEventListener(name, geste, {capture: true, passive: true}));
  return true;
}

/** Nur für Tests. */
export function setzeAudioStartZurueck() {
  kontext = null;
  sitzungGesetzt = false;
  hinweisGezeigt = false;
  freischaltungAktiv = false;
}

if (typeof window !== 'undefined') installiereFreischaltung(window);
