/**
 * Lehrerseite (lehrer.html): Abgaben per QR-Link, Code oder Datei sammeln
 * und auswerten. Alle Daten bleiben im Browser dieses Geräts.
 */
import {dekodiereCode, codeAusHash, findeAbgaben, pruefePaket, bereinigeKuerzel} from './paket.mjs';
import {
  ladeStand, speichereStand, fuegeHinzu, zeilen, sortiere, themenUebersicht,
  aufgabentypUebersicht, alsCsv, entfernePerson, gruppen, datum, leererStand, LEHRER_KEY,
} from './klasse.mjs';
import {el, leere, qrSvg, speicher, herunterladen, quoteBalken} from './dom.mjs';

const SPALTEN = [
  {key: 'kuerzel', label: 'Kürzel'},
  {key: 'gruppe', label: 'Gruppe'},
  {key: 'richtig', label: 'Richtig gelöst', zahl: true},
  {key: 'gesamt', label: 'Bearbeitet', zahl: true},
  {key: 'quote', label: 'Quote'},
  {key: 'zuwachs', label: 'Zuwachs', zahl: true},
  {key: 'duellRichtig', label: 'Duell richtig', zahl: true},
  {key: 'duellSiege', label: 'Siege', zahl: true},
  {key: null, label: 'Schwerpunkte'},
  {key: 'zeit', label: 'Letzte Abgabe'},
];

/** Liest Codes und Pakete aus Text und liefert geprüfte Pakete plus Fehlerliste. */
export async function paketeAusText(text) {
  const {codes, objekte} = findeAbgaben(text);
  const pakete = [], fehler = [];
  for (const code of codes) {
    const result = await dekodiereCode(code);
    if (result.ok) pakete.push(result.paket);
    else fehler.push(result.fehler);
  }
  for (const objekt of objekte) {
    const result = pruefePaket(objekt);
    if (result.ok) pakete.push(result.paket);
    else fehler.push(result.fehler);
  }
  return {pakete, fehler};
}

export function starteLehrerSeite(root) {
  const storage = speicher();
  let stand = storage ? ladeStand(storage) : leererStand();
  let filter = null;
  let sortierung = {spalte: 'richtig', ab: true};

  const meldung = el('div', {'aria-live': 'polite'});
  const eingabe = el('textarea', {id: 'import-text', placeholder: 'Codes (MT1…) oder Abgabelinks hier einfügen – beliebig viele, auch untereinander.'});
  const datei = el('input', {id: 'import-datei', type: 'file', multiple: true, accept: '.json,.txt,application/json,text/plain'});
  const gruppenFilter = el('select', {id: 'gruppen-filter', 'aria-label': 'Gruppe filtern'});
  const ansicht = el('div');
  const schuelerGruppe = el('input', {id: 'schueler-gruppe', maxlength: 12, placeholder: 'z. B. 7b'});
  const schuelerQr = el('div', {class: 'qr-box'});

  function melde(text, istFehler = false) {
    leere(meldung, text ? el('div', {class: 'meldung' + (istFehler ? ' fehler' : ''), role: istFehler ? 'alert' : 'status', text}) : null);
  }

  function sichere() {
    if (!storage) return false;
    const ok = speichereStand(storage, stand);
    if (!ok) melde('Speichern fehlgeschlagen – der Browserspeicher ist voll oder gesperrt. CSV exportieren und ältere Daten löschen.', true);
    return ok;
  }

  // Mehrere Tabs (jeder gescannte QR-Code öffnet einen) teilen sich den Speicher:
  // vor jeder Änderung den aktuellen Stand neu lesen, damit nichts verloren geht.
  function aktualisiere() {
    if (storage) stand = ladeStand(storage);
  }

  function uebernehme(pakete, fehler = []) {
    aktualisiere();
    const r = fuegeHinzu(stand, pakete);
    stand = r.stand;
    sichere();
    const teile = [r.neu + ' neu'];
    if (r.doppelt) teile.push(r.doppelt + ' bereits vorhanden');
    const ungueltig = r.ungueltig + fehler.length;
    if (ungueltig) teile.push(ungueltig + ' ungültig' + (fehler.length ? ' (' + [...new Set(fehler)].join(' ') + ')' : ''));
    melde('Import: ' + teile.join(', ') + '.', r.neu === 0 && ungueltig > 0);
    zeichne();
  }

  async function importiereText(text) {
    const {pakete, fehler} = await paketeAusText(text);
    if (!pakete.length && !fehler.length) {
      melde('Keine Ergebniscodes gefunden.', true);
      return;
    }
    uebernehme(pakete, fehler);
  }

  function zeichneSchuelerQr() {
    const url = new URL('./ergebnis.html', location.href);
    url.search = '';
    url.hash = '';
    const g = bereinigeKuerzel(schuelerGruppe.value, 12);
    if (g) url.searchParams.set('gruppe', g);
    const link = url.toString();
    leere(schuelerQr, qrSvg(link, 'QR-Code zur Abgabeseite', 200),
      el('p', {class: 'hinweis'}, ['Schüler-iPads öffnen damit die Abgabeseite', g ? ' (Gruppe ' + g + ' vorausgefüllt)' : '', ':', el('br'), el('a', {href: link, text: link})]));
  }

  function sortKopf(spalte) {
    if (!spalte.key) return el('th', {text: spalte.label});
    const aktiv = sortierung.spalte === spalte.key;
    return el('th', {class: spalte.zahl ? 'zahl' : null, 'aria-sort': aktiv ? (sortierung.ab ? 'descending' : 'ascending') : 'none'},
      el('button', {type: 'button', class: 'sort', onclick: () => {
        sortierung = {spalte: spalte.key, ab: aktiv ? !sortierung.ab : !['kuerzel', 'gruppe'].includes(spalte.key)};
        zeichne();
      }}, spalte.label + (aktiv ? (sortierung.ab ? ' ▼' : ' ▲') : '')));
  }

  function zeichne() {
    const liste = gruppen(stand);
    if (filter !== null && !liste.includes(filter)) filter = null;
    leere(gruppenFilter,
      el('option', {value: '__alle__', text: 'Alle Gruppen'}),
      ...liste.map(g => el('option', {value: g, text: g || '(ohne Gruppe)'})));
    gruppenFilter.value = filter === null ? '__alle__' : filter;

    const rows = sortiere(zeilen(stand, filter), sortierung.spalte, sortierung.ab);
    if (!rows.length) {
      leere(ansicht, el('section', {class: 'karte'}, [el('h2', {text: 'Noch keine Abgaben'}),
        el('p', {class: 'hinweis', text: 'Scanne den QR-Code einer Schülerin oder eines Schülers mit der Kamera dieses Geräts oder füge Codes oben ein.'})]));
      return;
    }
    const themen = themenUebersicht(rows);
    const typen = aufgabentypUebersicht(stand, filter);
    const summeRichtig = rows.reduce((s, r) => s + r.richtig, 0);

    leere(ansicht,
      el('section', {class: 'karte'}, [
        el('h2', {text: 'Übersicht' + (filter !== null ? ' · ' + (filter || 'ohne Gruppe') : '')}),
        el('div', {class: 'kennzahlen'}, [
          el('div', {class: 'kennzahl'}, [el('strong', {text: String(rows.length)}), 'Personen/Teams']),
          el('div', {class: 'kennzahl'}, [el('strong', {text: String(summeRichtig)}), 'Aufgaben richtig gelöst']),
          el('div', {class: 'kennzahl'}, [el('strong', {text: String(Math.round(summeRichtig / rows.length))}), 'richtig je Person (Mittel)']),
        ]),
        el('div', {class: 'tabelle-wrap'}, el('table', {}, [
          el('thead', {}, el('tr', {}, [...SPALTEN.map(sortKopf), el('th', {class: 'nicht-drucken', text: ''})])),
          el('tbody', {}, rows.map(r => el('tr', {}, [
            el('td', {}, el('strong', {text: r.kuerzel})),
            el('td', {text: r.gruppe || '–'}),
            el('td', {class: 'zahl', text: String(r.richtig)}),
            el('td', {class: 'zahl', text: String(r.gesamt)}),
            el('td', {}, quoteBalken(r.quote)),
            el('td', {class: 'zahl' + (r.zuwachs > 0 ? ' positiv' : ''), text: r.zuwachs === null ? '–' : (r.zuwachs > 0 ? '+' : '') + r.zuwachs}),
            el('td', {class: 'zahl', text: r.duellRunden ? r.duellRichtig + '/' + r.duellRunden : '–'}),
            el('td', {class: 'zahl', text: r.duelle ? r.duellSiege + '/' + r.duelle : '–'}),
            el('td', {class: 'schwer', text: r.schwaechen.map(s => s.topicTitle + ': ' + s.label).join('; ') || '–'}),
            el('td', {text: datum(r.zeit) + (r.abgaben > 1 ? ' (' + r.abgaben + '×)' : '')}),
            el('td', {class: 'nicht-drucken'}, el('button', {type: 'button', class: 'gefahr klein', 'aria-label': 'Abgaben von ' + r.kuerzel + ' löschen',
              onclick: () => {
                if (globalThis.confirm && !confirm('Alle Abgaben von „' + r.kuerzel + '“ löschen?')) return;
                aktualisiere();
                stand = entfernePerson(stand, r.key);
                sichere();
                zeichne();
              }}, '×')),
          ]))),
        ])),
        el('p', {class: 'hinweis', text: '„Richtig gelöst“ zählt alle richtig beantworteten Übungsaufgaben im Profil. „Zuwachs“ vergleicht mit der vorherigen Abgabe derselben Person. Duellwerte: richtige Antworten/Runden und Siege/Duelle.'}),
      ]),
      el('section', {class: 'karte'}, [
        el('h2', {text: 'Klasse nach Themen'}),
        el('div', {class: 'tabelle-wrap'}, el('table', {}, [
          el('thead', {}, el('tr', {}, [el('th', {text: 'Thema'}), el('th', {class: 'zahl', text: 'Personen'}), el('th', {class: 'zahl', text: 'Richtig/Bearbeitet'}), el('th', {text: 'Quote'})])),
          el('tbody', {}, themen.map(t => el('tr', {}, [
            el('td', {text: t.titel}), el('td', {class: 'zahl', text: String(t.personen)}),
            el('td', {class: 'zahl', text: t.richtig + '/' + t.gesamt}), el('td', {}, quoteBalken(t.quote)),
          ]))),
        ])),
      ]),
      typen.length ? el('section', {class: 'karte'}, [
        el('h2', {text: 'Klasse nach Aufgabentypen'}),
        el('p', {class: 'hinweis', text: 'Nur aus Übungen über „⚙️ Einstellen“ bzw. Unterrichtslinks. „Schwerpunkt“ = Anzahl Personen mit mindestens so vielen Fehlern wie richtigen Antworten.'}),
        el('div', {class: 'tabelle-wrap'}, el('table', {}, [
          el('thead', {}, el('tr', {}, [el('th', {text: 'Thema'}), el('th', {text: 'Aufgabentyp'}), el('th', {class: 'zahl', text: 'Personen'}),
            el('th', {class: 'zahl', text: 'Schwerpunkt bei'}), el('th', {class: 'zahl', text: 'Richtig/Falsch'}), el('th', {text: 'Quote'})])),
          el('tbody', {}, typen.map(t => el('tr', {}, [
            el('td', {text: t.topicTitle}), el('td', {text: t.label}), el('td', {class: 'zahl', text: String(t.personen)}),
            el('td', {class: 'zahl' + (t.schwach ? ' schwer' : ''), text: String(t.schwach)}),
            el('td', {class: 'zahl', text: t.richtig + '/' + t.falsch}), el('td', {}, quoteBalken(t.quote)),
          ]))),
        ])),
      ]) : null,
    );
  }

  datei.addEventListener('change', async () => {
    const texte = await Promise.all([...datei.files].slice(0, 200).map(f => f.size > 2e6 ? '' : f.text().catch(() => '')));
    datei.value = '';
    await importiereText(texte.join('\n'));
  });
  gruppenFilter.addEventListener('change', () => {
    filter = gruppenFilter.value === '__alle__' ? null : gruppenFilter.value;
    zeichne();
  });
  schuelerGruppe.addEventListener('input', zeichneSchuelerQr);
  addEventListener('storage', event => {
    if (event.key === LEHRER_KEY || event.key === null) { aktualisiere(); zeichne(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { aktualisiere(); zeichne(); }
  });

  leere(root,
    storage ? null : el('div', {class: 'meldung fehler', text: 'Kein lokaler Speicher verfügbar (privater Modus?). Importierte Daten gehen beim Schließen verloren.'}),
    el('section', {class: 'karte nicht-drucken'}, [
      el('h2', {text: 'Abgaben einsammeln'}),
      el('p', {class: 'hinweis', text: 'Schnellster Weg: QR-Code vom Schüler-iPad mit der Kamera dieses Geräts scannen – die Abgabe wird beim Öffnen automatisch übernommen. Mehrere Codes oder Dateien lassen sich hier gesammelt einlesen.'}),
      eingabe,
      el('div', {class: 'knoepfe'}, [
        el('button', {type: 'button', onclick: async () => { await importiereText(eingabe.value); eingabe.value = ''; }}, 'Codes importieren'),
        el('label', {class: 'knopf', for: 'import-datei', tabindex: 0}, 'Dateien wählen'),
      ]),
      el('div', {style: 'position:absolute;left:-9999px'}, datei),
      meldung,
    ]),
    el('section', {class: 'karte nicht-drucken'}, [
      el('div', {class: 'zeile'}, [
        el('label', {class: 'feld', for: 'gruppen-filter'}, ['Anzeigen', gruppenFilter]),
      ]),
      el('div', {class: 'knoepfe'}, [
        el('button', {type: 'button', class: 'zweit', onclick: () => {
          aktualisiere();
          const rows = sortiere(zeilen(stand, filter), sortierung.spalte, sortierung.ab);
          const name = 'musiktheorie-auswertung' + (filter ? '-' + filter.replace(/[^\p{L}\p{N}_-]+/gu, '_') : '') + '-' + new Date().toISOString().slice(0, 10) + '.csv';
          herunterladen(name, alsCsv(rows), 'text/csv;charset=utf-8');
        }}, 'CSV exportieren'),
        el('button', {type: 'button', class: 'zweit', onclick: () => print()}, 'Drucken / PDF'),
        el('button', {type: 'button', class: 'zweit', onclick: () => herunterladen(
          'musiktheorie-abgaben-sicherung-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(stand.abgaben), 'application/json')}, 'Sicherung speichern'),
        el('button', {type: 'button', class: 'gefahr', onclick: () => {
          if (globalThis.confirm && !confirm('Wirklich alle gesammelten Abgaben auf diesem Gerät löschen?')) return;
          stand = leererStand();
          sichere();
          melde('Alle Abgaben gelöscht.');
          zeichne();
        }}, 'Alle löschen'),
      ]),
    ]),
    ansicht,
    el('details', {class: 'karte nicht-drucken'}, [
      el('summary', {text: 'QR-Code für Schüler: Abgabeseite öffnen'}),
      el('div', {class: 'zeile'}, [el('label', {class: 'feld', for: 'schueler-gruppe'}, ['Gruppe vorausfüllen (optional)', schuelerGruppe])]),
      schuelerQr,
    ]),
    el('details', {class: 'karte nicht-drucken'}, [
      el('summary', {text: 'Hinweise zu Datenschutz und Aussagekraft'}),
      el('p', {class: 'hinweis', text: 'Es gibt keinen Server: Abgaben liegen nur im Browser dieses Geräts. Auf iPads haben Safari und eine zum Home-Bildschirm hinzugefügte Web-App getrennte Speicher – immer denselben Weg benutzen. Regelmäßig „Sicherung speichern“; die Datei lässt sich hier wieder importieren.'}),
      el('p', {class: 'hinweis', text: 'Schüler wählen nur ein Kürzel. Die Prüfsumme erkennt Kopier- und Übertragungsfehler, schützt aber nicht vor absichtlicher Manipulation. Die Werte eignen sich für Übungsrückmeldung und Förderplanung, nicht als Grundlage für Noten.'}),
      el('p', {class: 'hinweis', text: 'Duellwerte stammen aus unbeaufsichtigten Duellen: Der Name wird bei der Abgabe von der Person selbst ausgewählt.'}),
    ]),
  );
  zeichneSchuelerQr();
  zeichne();

  // Abgabe aus gescanntem QR-Code (#abgabe=…) übernehmen und Fragment entfernen.
  const ausLink = codeAusHash(location.hash);
  if (ausLink) {
    history.replaceState(null, '', location.pathname + location.search);
    importiereText(ausLink);
  }
}
