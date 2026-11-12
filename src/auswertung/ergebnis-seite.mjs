/**
 * Schülerseite „Ergebnis abgeben“ (ergebnis.html).
 * Liest den lokalen Lernstand eines Profils, erstellt daraus ein Paket und
 * zeigt es als QR-Code, Code und Datei. Es wird nichts an einen Server gesendet.
 */
import {loadProfiles, loadProfileSnapshot, PROFILE_DEFAULT} from '../unterricht/profile.mjs';
import {erstellePaket, kodierePaket, abgabeLink, bereinigeKuerzel} from './paket.mjs';
import {ladeDuellProtokoll, duellEintraege, loescheDuellProtokoll} from './duell-protokoll.mjs';
import {themaTitel, themenReihenfolge} from './themen.mjs';
import {el, leere, qrSvg, speicher, kopiere, herunterladen, prozent, quoteBalken} from './dom.mjs';

const KUERZEL_KEY = 'musiktheorie_abgabe_kuerzel_v1';

function gemerkteKuerzel(storage) {
  try {
    const data = JSON.parse(storage?.getItem(KUERZEL_KEY) || '{}');
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

export function starteErgebnisSeite(root) {
  const storage = speicher();
  const params = new URLSearchParams(location.search);
  const gruppeAusLink = bereinigeKuerzel(params.get('gruppe') || '', 12);

  if (!storage) {
    leere(root, el('div', {class: 'meldung fehler',
      text: 'Dieser Browser erlaubt keinen lokalen Speicher (z. B. privater Modus). Es sind keine Ergebnisse vorhanden.'}));
    return;
  }

  const profile = [{id: PROFILE_DEFAULT, name: 'Standardprofil'}, ...loadProfiles(storage)];
  const profilWahl = el('select', {id: 'profil', 'aria-label': 'Lernprofil'},
    profile.map(p => el('option', {value: p.id, text: p.name})));
  const duelle = duellEintraege(ladeDuellProtokoll(storage));
  const duellWahl = el('select', {id: 'duell', 'aria-label': 'Mein Name im Musikduell'}, [
    el('option', {value: '', text: '– kein Duell übernehmen –'}),
    ...duelle.map((d, i) => el('option', {value: String(i), text: d.name + ' · ' + d.richtig + '/' + d.runden + ' richtig'})),
  ]);
  const kuerzel = el('input', {id: 'kuerzel', maxlength: 20, autocomplete: 'off', placeholder: 'z. B. LeMü oder Tisch 4',
    'aria-describedby': 'kuerzel-hinweis'});
  const gruppe = el('input', {id: 'gruppe', maxlength: 12, autocomplete: 'off', placeholder: 'z. B. 7b', value: gruppeAusLink});
  const uebersicht = el('div');
  const ausgabe = el('div', {'aria-live': 'polite'});

  const merke = () => {
    const map = gemerkteKuerzel(storage);
    map[profilWahl.value] = bereinigeKuerzel(kuerzel.value);
    try { storage.setItem(KUERZEL_KEY, JSON.stringify(map)); } catch { /* egal */ }
  };

  function zeigeUebersicht() {
    const snap = loadProfileSnapshot(storage, profilWahl.value);
    kuerzel.value = gemerkteKuerzel(storage)[profilWahl.value] || kuerzel.value;
    const themen = Object.entries(snap.stats || {})
      .filter(([, v]) => v && Number(v.total) > 0)
      .sort((a, b) => themenReihenfolge(a[0]) - themenReihenfolge(b[0]));
    const richtig = themen.reduce((s, [, v]) => s + (Number(v.correct) || 0), 0);
    const gesamt = themen.reduce((s, [, v]) => s + (Number(v.total) || 0), 0);
    const typen = Object.keys(snap.errors || {}).length;
    leere(uebersicht,
      el('div', {class: 'kennzahlen'}, [
        el('div', {class: 'kennzahl'}, [el('strong', {text: String(richtig)}), 'richtig gelöst']),
        el('div', {class: 'kennzahl'}, [el('strong', {text: String(gesamt)}), 'Aufgaben bearbeitet']),
        el('div', {class: 'kennzahl'}, [el('strong', {text: prozent(gesamt ? richtig / gesamt : null)}), 'Trefferquote']),
        el('div', {class: 'kennzahl'}, [el('strong', {text: String(snap.xp)}), 'XP']),
      ]),
      themen.length ? el('div', {class: 'tabelle-wrap'}, el('table', {}, [
        el('thead', {}, el('tr', {}, [el('th', {text: 'Thema'}), el('th', {class: 'zahl', text: 'Richtig'}), el('th', {class: 'zahl', text: 'Bearbeitet'}), el('th', {text: 'Quote'})])),
        el('tbody', {}, themen.map(([id, v]) => el('tr', {}, [
          el('td', {text: themaTitel(id)}),
          el('td', {class: 'zahl', text: String(v.correct || 0)}),
          el('td', {class: 'zahl', text: String(v.total || 0)}),
          el('td', {}, quoteBalken(v.total ? v.correct / v.total : null)),
        ]))),
      ])) : el('p', {class: 'hinweis', text: 'In diesem Profil sind noch keine Übungen gespeichert.'}),
      typen ? null : el('p', {class: 'hinweis',
        text: 'Tipp: Übungen über „⚙️ Einstellen“ erfassen zusätzlich die einzelnen Aufgabentypen. Dann sieht deine Lehrkraft genauer, was du schon kannst.'}),
    );
    leere(ausgabe);
  }

  async function erstelle() {
    leere(ausgabe);
    let paket;
    try {
      const auswahl = duellWahl.value === '' ? null : duelle[Number(duellWahl.value)];
      paket = erstellePaket({kuerzel: kuerzel.value, gruppe: gruppe.value,
        snapshot: loadProfileSnapshot(storage, profilWahl.value), duell: auswahl});
    } catch (error) {
      ausgabe.append(el('div', {class: 'meldung fehler', role: 'alert', text: error.message}));
      kuerzel.focus();
      return;
    }
    merke();
    const code = await kodierePaket(paket);
    const link = abgabeLink(new URL('./lehrer.html', location.href).href, code);
    const codeFeld = el('textarea', {readonly: true, 'aria-label': 'Ergebniscode', rows: 3}, code);
    const status = el('span', {class: 'hinweis', 'aria-live': 'polite'});
    const qr = qrSvg(link, 'QR-Code mit deinem Ergebnis', 300);
    const datum = new Date().toISOString().slice(0, 10);
    const knoepfe = [
      el('button', {type: 'button', onclick: async () => {
        status.textContent = (await kopiere(code, codeFeld)) ? 'Code kopiert.' : 'Bitte den Code markieren und kopieren.';
      }}, 'Code kopieren'),
      el('button', {type: 'button', class: 'zweit', onclick: () => herunterladen(
        'ergebnis-' + paket.k.replace(/[^\p{L}\p{N}_-]+/gu, '_') + '-' + datum + '.json',
        JSON.stringify([paket], null, 1), 'application/json')}, 'Als Datei speichern'),
    ];
    if (typeof navigator.share === 'function') {
      knoepfe.push(el('button', {type: 'button', class: 'zweit', onclick: () =>
        navigator.share({title: 'Musiktheorie-Ergebnis ' + paket.k, url: link}).catch(() => {})}, 'Teilen (z. B. AirDrop)'));
    }
    ausgabe.append(el('section', {class: 'karte'}, [
      el('h2', {text: 'Dein Ergebnis ist bereit'}),
      el('p', {text: 'Zeige den QR-Code deiner Lehrkraft. Sie scannt ihn mit der Kamera. Alternativ kannst du den Code kopieren oder die Datei abgeben.'}),
      el('div', {class: 'qr-box'}, [
        qr || el('p', {class: 'meldung fehler', text: 'Der Code ist zu lang für einen QR-Code. Bitte als Datei oder Code abgeben.'}),
        el('div', {}, [
          el('p', {}, [el('strong', {text: paket.k}), paket.g ? ' · ' + paket.g : '', ' · ' + new Date(paket.t * 1000).toLocaleString('de-DE')]),
          paket.d ? el('p', {class: 'hinweis', text: 'Mit Duellbilanz von „' + paket.d.n + '“.'}) : null,
        ]),
      ]),
      codeFeld,
      el('div', {class: 'knoepfe'}, knoepfe),
      status,
    ]));
    ausgabe.scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  profilWahl.addEventListener('change', zeigeUebersicht);

  leere(root,
    el('section', {class: 'karte'}, [
      el('h2', {text: '1. Wessen Lernstand?'}),
      el('div', {class: 'zeile'}, [
        el('label', {class: 'feld', for: 'profil'}, ['Lernprofil auf diesem iPad', profilWahl]),
      ]),
      uebersicht,
    ]),
    el('section', {class: 'karte'}, [
      el('h2', {text: '2. Angaben für die Lehrkraft'}),
      el('div', {class: 'zeile'}, [
        el('label', {class: 'feld', for: 'kuerzel'}, ['Kürzel (Pflicht)', kuerzel]),
        el('label', {class: 'feld', for: 'gruppe'}, ['Klasse/Gruppe', gruppe]),
        el('label', {class: 'feld', for: 'duell'}, ['Mein Name im Musikduell', duellWahl]),
      ]),
      el('p', {id: 'kuerzel-hinweis', class: 'hinweis',
        text: 'Verwende das Kürzel, das deine Lehrkraft vorgibt – keinen vollständigen Namen. Arbeitet ihr zu zweit, tragt beide Kürzel ein (z. B. „LeMü+AnKo“).'}),
      duelle.length ? null : el('p', {class: 'hinweis', text: 'Auf diesem iPad wurde noch kein Musikduell protokolliert.'}),
      el('div', {class: 'knoepfe'}, [el('button', {type: 'button', onclick: erstelle}, 'Ergebnis erstellen')]),
    ]),
    ausgabe,
    el('details', {class: 'karte nicht-drucken'}, [
      el('summary', {text: 'Datenschutz und Duellprotokoll'}),
      el('p', {class: 'hinweis', text: 'Dein Lernstand bleibt auf diesem iPad. Erst wenn du einen QR-Code, Code oder eine Datei weitergibst, erhält deine Lehrkraft die Zahlen: Kürzel, Gruppe, richtig/bearbeitet je Thema und Aufgabentyp, XP und optional die Duellbilanz.'}),
      el('p', {class: 'hinweis', text: 'Das Musikduell merkt sich auf diesem iPad je Spielername Runden, richtige Antworten, Duelle, Siege und Punkte.'}),
      el('button', {type: 'button', class: 'gefahr', onclick: () => {
        if (globalThis.confirm && !confirm('Duellprotokoll auf diesem iPad für alle Namen löschen?')) return;
        loescheDuellProtokoll(storage);
        location.reload();
      }}, 'Duellprotokoll auf diesem iPad löschen'),
    ]),
  );
  zeigeUebersicht();
}
