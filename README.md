# Musiktheorie – Interaktiv & Musikduell

Interaktive Musiktheorie-Übungen in 13 Themenbereichen und ein Tischduell für zwei bis vier Personen. Die Anwendung ist für die statische Veröffentlichung über GitHub Pages ausgelegt und benötigt zur Ausführung keinen Server und kein Build-System.

## Neue Übungsvarianten

Im Kapitel **Notennamen** startet die Schaltfläche **„🌱 Anfänger · ohne Vorzeichen“** eine eigene Lernrunde mit reinen Stammtönen. Multiple-Choice-Antworten, Notensetzen und freie Texteingabe verwenden ausschließlich Töne ohne ♯ oder ♭. Enharmonische Verwechslungsfragen bleiben in dieser Anfängerrunde aus; die normale Übungsvariante bleibt unverändert. „Dieses Thema wiederholen“ erhält den Anfängermodus.

Im Musikduell gibt es unter **Thema → Eigene Themenauswahl** jetzt die Möglichkeit, die gewünschten Übungsgebiete unabhängig voneinander zu aktivieren. Über **Alle wählen** und **Keine wählen** lässt sich die Auswahl schnell zurücksetzen; mindestens ein Thema muss aktiv sein. Die bisherige Einstellung „Alle Themen gemischt“ und jedes einzelne Thema bleiben unverändert verfügbar.

In der **Musikduell-Arena** erscheinen bei „Notennamen“ und „Alle Themen“ Schaltflächen für **Violinschlüssel** und **Bassschlüssel**. Beide lassen sich unabhängig auswählen; mindestens einer bleibt aktiv. Ein Altschlüssel wird im Duell nicht angeboten. Die Auswahl gilt ausschließlich für Aufgaben des Themenbereichs Notennamen und ändert die Schlüssel der übrigen Aufgaben nicht.

## Konfigurierbare Übungsrunden (Unterrichtsmodus)

Neben **Üben** und **Anfänger** bietet jedes Thema **⚙️ Einstellen**: 5–30 Aufgaben, Multiple Choice/Notensetzen/Texteingabe, Notenschlüssel sowie bei Notennamen drei Niveaus. Die Einstellung **Fehler gezielt üben** erhöht die Wahrscheinlichkeit der Aufgabentypen, bei denen bisher viele Fehler auftraten; niemals wird eine falsche Antwort einfach als richtig markiert.

Die Website führt ein **lokales Fehlerprotokoll** und zeigt eine kompakte Übersicht der häufigsten Schwierigkeiten. Persönliche Konten oder ein Server sind dafür nicht erforderlich. Bei gemeinschaftlich genutzten iPads sind die Daten vorerst noch an den Browser gebunden.

Ein **Unterrichtslink** enthält nur den Themen- und Übungsplan als URL-Parameter, keine Schülerdaten. Auf einem anderen iPad wird damit die Übung direkt gestartet. Unter **„QR-Code für Schüler-iPads anzeigen“** lässt sich derselbe Link als QR-Code darstellen und mit der iPad-Kamera öffnen. Der QR-Code wird **vollständig lokal im Browser** erzeugt; es gibt keine Anfrage an einen fremden QR-Dienst.

### Technische Umsetzung der QR-Freigabe

- `src/unterricht/qr-code.mjs`: kodiert einen HTTP(S)-Unterrichtslink in die druck- und scanbare SVG-Geometrie mit vier Modulen Weißrand.
- `src/unterricht/vendor/qrcode.mjs`: gebündelter QR-Encoder von Kazuhiko Arase (MIT), inklusive vollständigem Lizenztext unter `src/unterricht/vendor/LICENSE.qrcode-generator.txt`. Keine Laufzeitabhängigkeit zu einem CDN oder einem Dienst.
- `tests/unterricht-qr.test.mjs`: Tests für URL-Sicherheit, Kodierung, Ruhezonen, Finder-Muster und die einklappbare QR-Anzeige.

### Druckbare Unterrichtsaufträge

Im selben Bereich lässt sich die gewählte Übung über **„Auftragskarte mit QR-Code drucken“** als A4-Karte mit Thema, Aufgabenart, Notenschlüssel, Aufgabenanzahl, QR-Code, Link sowie Namens- und Datumsfeld ausgeben. Die Druckansicht erscheint nur beim Drucken; die normale Seite bleibt unverändert. Auf dem iPad öffnet der Knopf den vom Browser angebotenen Druckdialog. Die PDF-Speicherung erfolgt gegebenenfalls über die Druckoptionen des Geräts, nicht über einen Server.

## Getrennte Notenbeispiele im Musikduell

Bei Aufgaben mit Notengrafik erhält jede Tischseite jetzt **ein eigenes, gleich hohes Notenfeld** in der Bildschirmmitte. Die Felder sind sichtbar voneinander abgegrenzt und verhindern, dass sich größere oder gedrehte SVG-Notenbeispiele übermalen. Die Noten für die gegenüberliegende Tischseite bleiben um 180° gedreht. Aufgaben ohne Notengrafik behalten ihr bisheriges Layout; Spielerzuordnung, Noteninhalt, Punkte und Timer sind unverändert.

Die Änderung nutzt feste Grid-Reihen mit begrenzter SVG-Darstellung statt zwei frei überlaufender Notenansichten. Der Offline-Cache wird mit Revision `2026-11-03-v3` erneuert. Die neuen Tests kontrollieren die Trennung, Orientierung und bisherigen Referenzgrafiken. Eine manuelle Ansicht auf einem echten iPad im Querformat ist weiterhin sinnvoll.

## Lernprofile und zeitfreies Duell

Auf gemeinsam genutzten Geräten sind die Lernstände nun pro lokalem Profil getrennt. Das bisherige **Standardprofil** behält die vorhandenen XP-, Punkte- und Statistikdaten. Für Gruppen oder Lernende lassen sich weitere Profile anlegen und wieder löschen. Im **Gastmodus** bleiben weder Fortschritte noch Fehler im lokalen Speicher zurück. Es wird kein Konto und kein Server benötigt; ein Profil existiert ausschließlich in diesem Browser.

Im Musikduell gibt es zusätzlich **5 Fragen** als kurze Runde und die Zeitwahl **„Ohne Zeitlimit (Übungsduell)“**. Dabei läuft kein Browser-Intervall; wie bisher wird die Runde abgeschlossen, sobald alle geantwortet haben. Die gewohnten Zeit- und Punkteregeln bleiben für reguläre Duelle erhalten.

## Lehrer-Auswertung ohne Server (nach dem Vorbild von mathebattle.de)

Lehrkräfte sehen die Übungsleistung der Klasse, ohne dass ein Server, ein Konto oder eine Anmeldung nötig ist. Die Daten wandern nur dann zur Lehrkraft, wenn Schülerinnen und Schüler sie aktiv abgeben.

**Ablauf im Unterricht**

1. Die Lehrkraft öffnet **`lehrer.html`** (z. B. `https://tobiasfranziskus.github.io/Musik-Theorie/lehrer.html`) und zeigt unter „QR-Code für Schüler“ den Link zur Abgabeseite, optional mit vorausgefüllter Gruppe (`ergebnis.html?gruppe=7b`).
2. Auf dem Schüler-iPad wählt man auf **`ergebnis.html`** das Lernprofil, trägt ein **Kürzel** ein (kein Klarname nötig) und wählt optional den eigenen Namen aus dem Musikduell. „Ergebnis erstellen“ zeigt einen QR-Code, einen Textcode (`MT1…`) und eine Datei zum Speichern oder Teilen (z. B. per AirDrop).
3. Die Lehrkraft scannt den QR-Code mit der Kamera ihres Geräts. Die Lehrerseite öffnet sich und übernimmt die Abgabe automatisch. Alternativ lassen sich beliebig viele Codes einfügen oder Dateien einlesen.

**Auswertung**

- Wie bei mathebattle steht die **Anzahl richtig gelöster Aufgaben** im Mittelpunkt, ergänzt durch die Zahl der bearbeiteten Aufgaben, die Trefferquote und den **Zuwachs seit der letzten Abgabe** derselben Person.
- **Schwerpunkte je Person:** Aufgabentypen, bei denen mindestens so viele Fehler wie richtige Antworten vorliegen. Diese Daten entstehen in Übungen über „⚙️ Einstellen“ bzw. über Unterrichtslinks.
- **Klasse nach Themen und nach Aufgabentypen** mit Quote und der Zahl der Personen, die dort einen Schwerpunkt haben.
- **Duellbilanz:** Das unbeaufsichtigte Musikduell protokolliert lokal je Spielername Runden, richtige Antworten, Duelle, Siege und Punkte. Bei der Abgabe wählt die Person ihren Duellnamen selbst aus.
- Filter nach Gruppe, sortierbare Spalten, **CSV-Export** (Semikolon, Excel/Numbers), Druck/PDF und eine JSON-Sicherung, die sich wieder importieren lässt.

**Datenschutz und Grenzen**

- Alles bleibt im Browser: Schülerdaten auf dem Schüler-iPad, gesammelte Abgaben im Browser der Lehrkraft. Der Abgabecode steht im URL-Fragment (`#abgabe=…`), das Browser nicht an den Server senden. Der Service Worker speichert weder Gruppenparameter noch Abgabecodes.
- Ein Paket enthält nur Kürzel, Gruppe, Zeitpunkt, Zähler je Thema und Aufgabentyp, XP und optional die Duellbilanz.
- Die Prüfsumme erkennt Kopier- und Übertragungsfehler, **nicht absichtliche Manipulation**. Ohne Server ist kein fälschungssicheres Verfahren möglich. Die Werte dienen der Übungsrückmeldung und Förderplanung, nicht der Notengebung.
- Auf iPads haben Safari und eine zum Home-Bildschirm hinzugefügte Web-App getrennte Speicher. Die Lehrkraft sollte immer denselben Weg nutzen und regelmäßig „Sicherung speichern“.
- Der Duellname wird nicht überprüft: Wer in einem unbeaufsichtigten Duell gespielt hat, lässt sich nicht nachweisen.

**Technik**

- `src/auswertung/paket.mjs`: Paketschema v1, Bereinigung, FNV-1a-Prüfsumme, Kodierung (`MT1.` bzw. mit `deflate-raw` komprimiert `MT1z.`), Import aus Text und JSON.
- `src/auswertung/duell-protokoll.mjs`: lokale Duellbilanz. `src/duell/sitzung.mjs` ruft sie nach jeder gewerteten Runde und am Duellende fehlertolerant auf. Zustand, Timer und Wertung bleiben unverändert.
- `src/auswertung/klasse.mjs`: Doppelabgaben, letzte Abgabe je Person, Zuwachs, Themen- und Aufgabentypübersicht, CSV mit Schutz vor Formel-Injektion.
- `src/auswertung/themen.mjs`: Themen- und Aufgabentypbezeichnungen in der Reihenfolge der Generatoren aus `src/app.js`.
- `ergebnis.html`/`lehrer.html` mit `src/auswertung/ergebnis-seite.mjs`, `lehrer-seite.mjs`, `dom.mjs` und `auswertung.css`: eigenständige Seiten ohne React und ohne Änderung an `src/app.js`. Sie sind offline verfügbar (Cache-Revision `2026-11-12-v1`).
- Tests: `tests/auswertung-paket.test.mjs`, `tests/duell-protokoll.test.mjs`, `tests/lehrer-klasse.test.mjs` sowie Offline-Tests für beide Seiten.

## Dateien

- `index.html`: schlanker Einstiegspunkt mit Metadaten und Lizenzhinweis.
- `src/app.js`: bestehender React-/Anwendungscode aus dem ursprünglichen Bundle; die Notennamenlogik ruft bereits ein unabhängiges Modul auf.
- `src/styles.css`: unveränderter gebündelter CSS-Code.
- `src/music/notennamen.mjs`: eigenständige, DOM-freie Funktionen für deutsche Notennamen, Vorzeichen und Oktav-Eingaben.
- `src/music/tonhoehen.mjs`: diatonische Indexpositionen und chromatische Tonhöhen als unabhängige Rechenfunktionen.
- `src/music/intervalle.mjs`: der 13-teilige Intervallkatalog und diatonisch korrekt geschriebene Auf-/Abwärtstranspositionen.
- `src/music/tonleitern.mjs`: Dur-/Moll-Tonleitervorlagen und Tonleiterberechnung, inklusive Chromatik und Ganztonleitern.
- `src/music/akkorde.mjs`: Dreiklänge, Umkehrungen, Vorzeichenprüfung und Akkordbezeichnungen.
- `src/music/bewertung.mjs`: eigenständige Bewertung von Noteneingaben (Reihenfolge, enharmonische Gleichheit und Duplikate).
- `src/aufgaben/notennamen.mjs`: vier unabhängige Aufgabengeneratoren für Notennamen (Multiple Choice, Enharmonik, Notensetzen, Texteingabe).
- `src/aufgaben/intervalle.mjs`: vier Generatoren für Halb-/Ganztonschritte, Intervallbildung, Erkennung und Intervallhören.
- `src/aufgaben/tonleitern.mjs`: vier Generatoren für Dur-, Moll-, chromatische und Ganztonleitern.
- `src/aufgaben/akkorde.mjs`: sechs Generatoren für Dreiklänge, Umkehrungen, freie Akkordnamen und Akkordhören.
- `src/aufgaben/rhythmus.mjs`: fünf Generatoren für Notenwerte, Pausen, Taktstrich und Triolen.
- `src/aufgaben/quintenzirkel-vorzeichen.mjs`: Paralleltonarten, Quintenzirkel und Generalvorzeichen erkennen.
- `src/aufgaben/harmoniefunktionen.mjs`: T/S/D, Parallelfunktionen, Funktionen erkennen, Sept- und Sixte-ajoutée-Akkorde; gemeinsamer Dur-Funktionskatalog für die harmonische Analyse.
- `src/aufgaben/kadenz-analyse.mjs`: Kadenzen, Stimmführungsfehler und Harmonische Analyse mit gemeinsam importiertem Dur-Funktionskatalog.
- `src/ui/notensystem.mjs`: zustandslose SVG-Erzeugung für einfache Notensysteme, Klaviersystem und interaktive Noteneingabe, einschließlich der unveränderten Schlüssel-/Notenformen.
- `src/ui/noteneingabe.mjs`: Touch- und Mausklicks über die SVG-Transformationsmatrix in die korrekte Notenposition umrechnen – unabhängig von React.
- `src/duell/spielregeln.mjs`: Spielerinitialisierung, Antwortmischung je Spieler und Punktevergabe (Serien- und Schnelligkeitsbonus) ohne React oder DOM.
- `src/duell/rundensteuerung.mjs`: Rundenzeitberechnung, Antwortaufnahme, vollständige Antwortprüfung und nächster Fragenindex, ohne Browser-Timer und React.
- `src/duell/aufgabenpool.mjs`: Fragenpool mit Themenfilter, Aufgaben-Konvertierung, Duplikatschutz, Notensystem-SVG und Ersatzfragen unabhängig von React.
- `src/duell/timer.mjs`: echte Rundenuhr mit 100-ms-Browser-Intervall, Zeitfortschritt, selbständigem Zeitablauf-Abbruch und in Tests austauschbarer Uhr.
- `src/duell/ansicht.mjs`: zustandslose JSX-Teilansichten für beide gegenüberliegenden Notensysteme und die individuellen Spieler-Antwortfelder.
- `src/duell/sitzung.mjs`: React-Hook mit sämtlichen bisherigen Duell-Zuständen, Event-Sperren, Spieleraktionen und Timer-Cleanup (ohne eigene Darstellung).
- `tests/aufgaben.test.cjs`: Regressionstests für Aufgaben, Duell und Dateistruktur unter Verwendung des echten Notennamen-Moduls.
- `tests/notennamen.test.mjs`: direkte Unit-Tests für Notennamen und Eingaben.
- `tests/tonhoehen.test.mjs`: direkte Unit-Tests für diatonische und chromatische Tonhöhen.
- `tests/intervalle.test.mjs`: Intervallnamen, enharmonische Schreibweisen und Abwärtstransposition.
- `tests/tonleitern.test.mjs`: Tonleiter-Vorlagen, Halbtonabstände und Vorzeichen.
- `tests/akkorde.test.mjs`: Dur/Moll/verminderte/übermäßige Dreiklänge, Umkehrungen und Akkordnamen.
- `tests/bewertung.test.mjs`: Regressionstests für die Bewertung geordneter und gestapelter Noten.
- `tests/notennamen-generatoren.test.mjs`: direkte Tests aller vier Notennamen-Generatoren einschließlich `f1`.
- `tests/intervall-generatoren.test.mjs`: Intervall-Aufgabengeneratoren und Hörintervalle.
- `tests/tonleiter-generatoren.test.mjs`: Vier Tonleiter-Aufgabentypen, Mollvarianten und Oktavlagen.
- `tests/akkord-generatoren.test.mjs`: sechs Akkordgeneratoren, Umkehrungen und freie Akkordnamen.
- `tests/rhythmus-generatoren.test.mjs`: alle fünf Rhythmusaufgabentypen samt Taktangaben und Triolen.
- `tests/quintenzirkel-vorzeichen.test.mjs`: Quintenzirkel, Generalvorzeichen, Paralleltonarten und Schlüsselwahl.
- `tests/harmoniefunktionen-generatoren.test.mjs`: Haupt-/Nebenfunktionen, Dreiklänge, Umkehrungen und Vierklänge.
- `tests/kadenz-analyse.test.mjs`: Kadenzen, Stimmführung, Stimmenverteilung im Klaviersystem und harmonische Analyse.
- `tests/notensystem-renderer.test.mjs`: 14 Referenzdarstellungen mit vollständigen SVG-Prüfsummen, darunter drei Schlüssel, Vorzeichen, Triolen, Noteneingabe und Klaviersystem.
- `tests/noteneingabe-touch.test.mjs`: SVG-Touchkoordinaten, drei Schlüssel, Eingabegrenzen, Vorzeichen, Skalierung und 180°-Drehung.
- `tests/duell-spielregeln.test.mjs`: zwei bis vier Spieler, individuelle Antwortreihenfolge, Serienbonus, Schnellstenbonus und neue Runden.
- `tests/duell-rundensteuerung.test.mjs`: Rundenende durch Zeitablauf oder letzte Antwort, zeitgestempelte Spielerantworten und Fragenwechsel.
- `tests/duell-aufgabenpool.test.mjs`: Themenfilter, Duplikate, Hörübungen ausschließen, Rendering und Fallback-Logik.
- `tests/duell-timer.test.mjs`: Intervallstart, Fortschrittswerte, Ablauf-Reihenfolge und ID-Rückgabe für mehrere Rundenuhren.
- `tests/duell-ansicht.test.mjs`: feste Referenzprüfsummen der beiden Tischrichtungen und sechs Spielerzustände, Antwort-Buttons, Sperren und Farben.
- `tests/duell-sitzung.test.mjs`: Regression der Hook-Reihenfolge, Doppelantwort-Sperre, Zeitablauf, Rundenende und Dialog-Cleanup gegen eingefrorenen Althook.
- `tests/browser-smoke.cjs`: Chrome-Smoke-Test, der die ausgelagerten Assets über einen lokalen HTTP-Server lädt und den tatsächlichen Start der Oberfläche prüft.
- `.github/workflows/aufgaben-regression.yml`: automatische Prüfungen für Pull Requests und `main`.

## Verbesserte Notendarstellung auf dem iPad

Auf Touchgeräten werden interaktive Notensysteme um den Faktor 1,5 und statische Notenbilder in Multiple-Choice- und Texteingabe-Aufgaben um den Faktor 1,35 vergrößert. Lange Systeme bleiben in ihrer Originalbreite und lassen sich **seitlich scrollen**, statt stark verkleinert zu werden. Auf Desktopgeräten bleibt die bisherige Größe erhalten.

Die Vorzeichentasten und Kontrollknöpfe der Noteneingabe haben auf Touchgeräten eine Trefferfläche von mindestens **44 × 44 Pixeln**. Die Vorzeichen sind zusätzlich mit gesprochenen Bezeichnungen und ihrem Auswahlzustand versehen. Der Hinweis über dem Notensystem erklärt das seitliche Verschieben.

Die eigentlichen SVG-Noten, musikalischen Koordinaten und die Bewertung wurden nicht verändert. Die bestehende Transformationsmatrix berücksichtigt auch Vergrößerung, Scrollposition und 180°-Drehung; zusätzliche deterministische Regressionen sichern diese Fälle ab. Der Offline-Cache wird mit Revision `2026-11-03-v3` erneuert. **Eine reale iPad-/Safari-Touchabnahme steht weiterhin aus.**

## iPad: Offline-Nutzung und Home-Bildschirm

Die App besitzt einen **Service Worker** (`sw.js`) und ein Web-App-Manifest. Beim ersten vollständigen Online-Besuch werden der Einstiegspunkt, Stylesheets, sämtliche derzeit benötigten JavaScript-Module und die QR-Freigabe in einem separaten Offline-Cache gespeichert. **Danach** lassen sich Übungen, Duell und bereits gespeicherte lokale Lernprofile ohne Internetverbindung aufrufen. Auch Unterrichtslinks mit URL-Parametern können offline geöffnet werden, sofern die App zuvor auf diesem iPad vollständig zwischengespeichert wurde.

**Für das iPad:** Die Website einmal mit Internet in Safari öffnen, den ersten Ladevorgang abschließen, danach über **Teilen → Zum Home-Bildschirm** ablegen. Für einen verlässlichen ersten Offline-Test die Seite nach der Installation einmal neu laden und anschließend im Flugmodus öffnen. Die Offline-Kopie ist geräte- und browserspezifisch; Safari kann gespeicherte Daten bei Platzmangel oder längerem Nichtgebrauch entfernen. Noch nie aufgerufene externe Seiten und neu herunterzuladende Updates benötigen weiterhin Internet.

**Aktualisierung:** Bei bestehender Internetverbindung verwendet der Service Worker stets die Netzwerkfassung und erneuert die zwischengespeicherten Dateien. Ein neues Release wird bei erneutem Online-Aufruf geladen; eine bereits laufende Übung wird **nicht automatisch unterbrochen**. Bei Änderungen der Offline-Dateiliste die Revision `CACHE_NAME` in `sw.js` erhöhen und den Precache-Inhalt prüfen. Die Installation eines neuen Workers wird erst nach vollständig erfolgreichem Precache aktiviert; alte Musiktheorie-Caches werden dann bereinigt. Nach einem Versionswechsel einmal neu laden.

**Datenschutz:** Der Worker verarbeitet ausschließlich GET-Anfragen im eigenen GitHub-Pages-Unterverzeichnis; fremde Websites, Benutzeraktionen und persönliche API-Daten werden nicht zwischengespeichert. Lernprofile, Punkte und Fehlerstatistik bleiben weiterhin im lokalen Browser-Speicher und werden nicht hochgeladen.

**Prüfung:** `tests/offline-service-worker.test.cjs` kontrolliert Cache-Vollständigkeit, Installationsabbruch, Aktivierung, Scope, Aktualisierung und parameterisierte Offline-Links mit einer simulierten Service-Worker-Umgebung. Die bisherige Chrome-Startprüfung bleibt bestehen. Eine echte iPad-/Safari-Prüfung im Flugmodus ist zusätzlich empfehlenswert, wird aber nicht als bereits durchgeführt behauptet.

## Lokal starten

Die Dateien müssen über HTTP bereitgestellt werden, weil `index.html` ein JavaScript-Modul lädt.

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000/` im Browser öffnen.

## Tests

Voraussetzung: Node.js 22 oder neuer. Externe npm-Abhängigkeiten sind nicht erforderlich.

```bash
node --check src/app.js
node --check src/music/notennamen.mjs
node --check src/music/tonhoehen.mjs
node --check src/music/intervalle.mjs
node --check src/music/tonleitern.mjs
node --check src/music/akkorde.mjs
node --check src/music/bewertung.mjs
node --check src/aufgaben/notennamen.mjs
node --check src/aufgaben/intervalle.mjs
node --check src/aufgaben/tonleitern.mjs
node --check src/aufgaben/akkorde.mjs
node --check src/aufgaben/rhythmus.mjs
node --check src/aufgaben/quintenzirkel-vorzeichen.mjs
node --check src/aufgaben/harmoniefunktionen.mjs
node --check src/aufgaben/kadenz-analyse.mjs
node --check src/ui/notensystem.mjs
node --check src/ui/noteneingabe.mjs
node --check src/duell/spielregeln.mjs
node --check src/duell/rundensteuerung.mjs
node --check src/duell/aufgabenpool.mjs
node --check src/duell/timer.mjs
node --check src/duell/ansicht.mjs
node --check src/duell/sitzung.mjs
node --test tests/*.test.*
node tests/browser-smoke.cjs  # Chrome/Chromium auf dem System erforderlich
```

## Wartbarkeit

**Stufe 1 und die fachlichen Teilmodule von Stufe 2 sind in `main` integriert.** Auf den gestapelten, noch nicht integrierten Draft-PRs #8–#16 folgen die Bewertungslogik und alle 32 Aufgabengeneratoren. PR #17 trennt zusätzlich die SVG-Notensystem-Erzeugung aus dem verbleibenden React-Bundle. PR #18 isoliert die Positionsberechnung für Touch und Maus. PR #19 modularisiert die reinen Duellregeln für Spieler, Antwortoptionen und Punkte. PR #20 trennt zudem Rundenzeitberechnung, Antwortaufnahme und Fragenwechsel vom React-Bundle. Duellsteuerung, Eingabeverwaltung und Teile der Oberfläche in `src/app.js` sind weiterhin gebündelt/minifiziert. Siehe [Refactoring-Plan](docs/REFACTORING.md).

Änderungen an Fragen, Notation, Eingaben und Bewertung werden möglichst durch Tests abgesichert. Die öffentliche `main`-Version bleibt bis zur Freigabe eines PR unverändert.
