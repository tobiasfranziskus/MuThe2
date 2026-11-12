/**
 * Lokales Duellprotokoll für unbeaufsichtigte Musikduelle.
 *
 * Gespeichert wird je eingetragenem Spielernamen nur eine Bilanz
 * (Runden, beantwortet, richtig, Duelle, Siege, Punkte). Es gibt keine
 * Verknüpfung mit Lernprofilen; die Schülerin bzw. der Schüler wählt
 * bei der Abgabe selbst, welcher Name der eigene war.
 *
 * Alle Funktionen sind fehlertolerant: Ohne Speicher (z. B. privater
 * Modus, Tests) bleibt das Duell unverändert spielbar.
 */
export const DUELL_PROTOKOLL_KEY = 'musiktheorie_duell_protokoll_v1';
export const MAX_NAMEN = 60;

function nameKey(name) {
  return String(name ?? '').normalize('NFC').trim().toLowerCase().slice(0, 30);
}

export function ladeDuellProtokoll(storage) {
  try {
    const data = JSON.parse(storage?.getItem(DUELL_PROTOKOLL_KEY) || 'null');
    if (data && data.v === 1 && data.spieler && typeof data.spieler === 'object') return data;
  } catch { /* leer weiter */ }
  return {v: 1, spieler: {}};
}

function speichere(storage, protokoll) {
  const entries = Object.entries(protokoll.spieler);
  if (entries.length > MAX_NAMEN) {
    entries.sort((a, b) => (b[1].zuletzt || 0) - (a[1].zuletzt || 0));
    protokoll = {...protokoll, spieler: Object.fromEntries(entries.slice(0, MAX_NAMEN))};
  }
  try {
    storage.setItem(DUELL_PROTOKOLL_KEY, JSON.stringify(protokoll));
    return true;
  } catch {
    return false;
  }
}

function eintrag(protokoll, name) {
  const key = nameKey(name);
  if (!key) return null;
  const vorher = protokoll.spieler[key];
  const neu = vorher ? {...vorher} :
    {name: String(name).trim().slice(0, 30), runden: 0, beantwortet: 0, richtig: 0, duelle: 0, siege: 0, punkte: 0, zuletzt: 0};
  protokoll.spieler[key] = neu;
  return neu;
}

/** Nach der Wertung einer Runde: Antwortstatus jeder Person zählen. */
export function protokolliereRunde(storage, players, correctIndex, jetzt = Date.now()) {
  if (!storage || !Array.isArray(players)) return false;
  const protokoll = ladeDuellProtokoll(storage);
  for (const player of players) {
    const e = eintrag(protokoll, player?.name);
    if (!e) continue;
    e.runden++;
    if (player.answer !== null && player.answer !== undefined) e.beantwortet++;
    if (player.answer === correctIndex) e.richtig++;
    e.zuletzt = jetzt;
  }
  return speichere(storage, protokoll);
}

/** Nach der letzten Runde: Duell, Endpunktzahl und Sieg zählen. */
export function protokolliereDuellende(storage, players, jetzt = Date.now()) {
  if (!storage || !Array.isArray(players) || !players.length) return false;
  const protokoll = ladeDuellProtokoll(storage);
  const best = Math.max(...players.map(p => Number(p?.score) || 0));
  for (const player of players) {
    const e = eintrag(protokoll, player?.name);
    if (!e) continue;
    const score = Number(player.score) || 0;
    e.duelle++;
    e.punkte += Math.max(0, score);
    if (players.length > 1 && best > 0 && score === best) e.siege++;
    e.zuletzt = jetzt;
  }
  return speichere(storage, protokoll);
}

/** Einträge für die Abgabeseite, zuletzt gespielte zuerst. */
export function duellEintraege(protokoll) {
  return Object.values(protokoll?.spieler || {})
    .filter(e => e && e.name)
    .sort((a, b) => (b.zuletzt || 0) - (a.zuletzt || 0));
}

export function loescheDuellProtokoll(storage) {
  try {
    storage.removeItem(DUELL_PROTOKOLL_KEY);
    return true;
  } catch {
    return false;
  }
}

// ---------- Anbindung an das laufende Duell ----------

function browserSpeicher() {
  try {
    return typeof globalThis.localStorage === 'object' ? globalThis.localStorage : null;
  } catch {
    return null;
  }
}

const beendet = new WeakSet();

/** Für die Duell-Sitzung: wirft nie und verändert keinen Spielzustand. */
export function duellRundeErfassen(players, correctIndex) {
  try { protokolliereRunde(browserSpeicher(), players, correctIndex); } catch { /* Duell läuft weiter */ }
}

/** Für die Duell-Sitzung: dieselbe Spielerliste wird nur einmal gewertet. */
export function duellEndeErfassen(players) {
  try {
    if (!players || typeof players !== 'object' || beendet.has(players)) return;
    beendet.add(players);
    protokolliereDuellende(browserSpeicher(), players);
  } catch { /* Duell läuft weiter */ }
}
