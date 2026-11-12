/**
 * Themen und Aufgabentypen für die Lehrer-Auswertung.
 *
 * Die Reihenfolge der Aufgabentypen entspricht den `gens`-Registrierungen
 * in src/app.js. Bei „Noten- und Pausenwerte“ nutzt der Unterrichtsmodus
 * eine eigene, gewichtete Generatorliste mit acht Einträgen; deren Indizes
 * werden hier auf dieselben Bezeichnungen abgebildet.
 */
export const THEMEN = [
  {id:'noten', title:'Notennamen', types:['Notennamen erkennen','Enharmonische Verwechslung','Noten setzen','Notennamen schreiben']},
  {id:'werte', title:'Noten- und Pausenwerte', types:['Notenwert ergänzen','Pausenwert ergänzen','Pause erkennen','Taktstrich setzen','Triolen','Pause erkennen','Notenwert ergänzen','Pause erkennen']},
  {id:'halbgans', title:'Halb- und Ganztonschritte', types:['Halb-/Ganztonschritt']},
  {id:'intervalle', title:'Intervalle', types:['Intervall bilden','Intervall bestimmen']},
  {id:'dreiklaenge', title:'Dreiklänge', types:['Dreiklang bilden','Dreiklang bestimmen','Umkehrung bestimmen','Umkehrung bilden','Dreiklang benennen (Freitext)']},
  {id:'tonleitern', title:'Tonleitern', types:['Durtonleiter','Molltonleiter','Chromatische Tonleiter','Ganztonleiter']},
  {id:'funktionen', title:'Haupt- & Nebendreiklänge', types:['Funktionsakkord bilden','Funktion bestimmen']},
  {id:'akkorde', title:'Weitere Akkorde', types:['Vierklang bilden','Vierklang bestimmen']},
  {id:'quinten', title:'Quintenzirkel', types:['Quintenzirkel']},
  {id:'vorzeichen', title:'Vorzeichen lesen', types:['Tonart aus Vorzeichen']},
  {id:'kadenz', title:'Kadenz', types:['Kadenz','Stimmführungsfehler']},
  {id:'analyse', title:'Harmonische Analyse', types:['Harmonische Analyse']},
  {id:'gehoer', title:'Gehörbildung', types:['Intervall hören','Dreiklang hören']},
];

const BY_ID = new Map(THEMEN.map(t => [t.id, t]));

export function themaTitel(id) {
  return BY_ID.get(id)?.title || String(id);
}

/** Bezeichnung zu einem Fehlerprotokoll-Schlüssel wie „noten:2“. */
export function aufgabentypTitel(key) {
  const text = String(key);
  const cut = text.lastIndexOf(':');
  const topic = cut < 0 ? text : text.slice(0, cut);
  const index = cut < 0 ? NaN : Number(text.slice(cut + 1));
  const label = Number.isInteger(index) ? BY_ID.get(topic)?.types[index] : null;
  return {topic, topicTitle: themaTitel(topic), label: label || 'Aufgabentyp ' + (Number.isInteger(index) ? index + 1 : '?')};
}

export function themenReihenfolge(id) {
  const index = THEMEN.findIndex(t => t.id === id);
  return index < 0 ? THEMEN.length : index;
}
