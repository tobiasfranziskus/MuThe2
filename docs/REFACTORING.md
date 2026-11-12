# Refactoring-Plan

## Ziel

Die Musiktheorie-Anwendung soll verständlich, modular und zuverlässig testbar werden. **Keine sichtbaren, spielerischen oder musiktheoretischen Verhaltensänderungen** während eines reinen Refactorings. Die `index.html` bleibt als Einstiegspunkt von GitHub Pages erhalten.

## Stufe 1 – Auslieferung entkoppeln (PR #2)

- [x] Gebündelten JS-Inhalt unverändert nach `src/app.js` verschieben.
- [x] CSS unverändert nach `src/styles.css` verschieben.
- [x] Beide Assets mit relativen URLs aus der `index.html` laden; korrekt unter GitHub Pages mit Repository-Unterpfad.
- [x] Bestehende Aufgabentests auf die neue Dateistruktur umstellen.
- [x] Syntaxprüfung, CI und Dokumentation ergänzen.
- [x] Chrome-Smoke-Test mit echten JS- und CSS-Dateien durchführen.
- [x] Browserabnahme auf iPad/Safari, besonders Notensystem, Touch und Duell – laut Nutzerfreigabe am 03.11.2026 als erledigt bestätigt (nicht von CI automatisiert geprüft).

**Wichtig:** Die beiden großen Dateien enthalten bislang generierten/minifizierten Code. Ihre Auslagerung allein macht die interne Logik noch nicht lesbarer. Ein kosmetisches „Beautifying“ reicht für echte Modularität nicht aus.

## Stufe 2 – Fachlogik aus dem Bundle lösen

- [x] Notenbezeichnung und Oktavlogik (inkl. `f1`/`f¹`/`f4`) nach `src/music/notennamen.mjs` auslagern, mit tatsächlicher Verwendung in `src/app.js`.
- [x] 720 Darstellungsfälle und 3.255 Eingabevarianten gegen die bisherigen Funktionen auf identische Ergebnisse prüfen; zusätzlich unabhängige Unit-Tests und Browser-Smoke-Test.
- [x] Tonhöhenkern (`src/music/tonhoehen.mjs`): diatonische Indizes, Oktavumrechnung, chromatische Halbtonwerte ausgelagert; Vergleich mit der bestehenden Implementierung über 2.581 Fälle ohne Abweichung.
- [ ] Weitere musiktheoretische Berechnungen isolieren.
- [x] Intervallkatalog und Transposition nach `src/music/intervalle.mjs` auslagern; **222.642 Referenzfälle ohne Abweichung**, abhängige Tonhöhenfunktion über ES-Import.
- [x] Tonleiter-Daten (Dur, natürlich/harmonisch/melodisch Moll, Chromatik und Ganztonleitern) und Erzeugungsfunktion nach `src/music/tonleitern.mjs` auslagern; 980 SPN-Eingaben und 1.050 Tonleitererzeugungen mit bisherigem Verhalten verglichen, 0 Unterschiede.
- [x] Akkordfunktionen (`src/music/akkorde.mjs`): Dreiklänge, Umkehrungen, Doppelvorzeichenfilter, Akkordkürzel und vollständige Bezeichnungen ausgelagert; **14.880 Funktionsvergleiche** mit bisherigem Verhalten ohne Abweichung.
- [x] Notenbewertung (`src/music/bewertung.mjs`) auslagern: geordnete Aufgaben, Akkord-Reihenfolge, Mehrfachnoten und enharmonische Gleichheit; 50.020 Referenzfälle ohne Abweichung (PR #8).
- [x] Vier Notennamen-Aufgabengeneratoren nach `src/aufgaben/notennamen.mjs` auslagern: Multiple Choice, Enharmonik, Notensetzen und Texteingabe. **3.200 deterministische Aufgabenvergleiche einschließlich Zufallsfolge ohne Abweichung** (PR #9).
- [x] Vier Intervall-Aufgabengeneratoren inkl. Halb-/Ganztonschritte und Hören nach `src/aufgaben/intervalle.mjs` auslagern; **5.600 deterministische Vergleiche ohne Abweichung** (PR #10).
- [x] Vier Tonleiter-Aufgabengeneratoren nach `src/aufgaben/tonleitern.mjs` auslagern: Dur, Moll, Chromatik und Ganztonleitern; **5.600 deterministische Vergleiche ohne Abweichung** (PR #11).
- [x] Sechs Dreiklang-Aufgabengeneratoren inkl. Umkehrungen, freier Eingabe und Hörakkorden nach `src/aufgaben/akkorde.mjs` auslagern. **8.400 deterministische Aufgabenvergleiche** und **9.800 Antwortprüfungen**, jeweils ohne Abweichung (PR #12).
- [x] Fünf Rhythmusgeneratoren nach `src/aufgaben/rhythmus.mjs` auslagern (Noten-/Pausenwerte, Pausen erkennen, Taktstrich, Triolen): **5.200 deterministische Aufgabenerzeugungen und Zufallsfortsetzungen ohne Abweichung** (PR #13).
- [x] Quintenzirkel und Generalvorzeichen (`src/aufgaben/quintenzirkel-vorzeichen.mjs`) als zwei Generatoren auslagern: **6.000 deterministische Vergleichsfälle und identische Zufallsfortsetzung**, keine Abweichungen (PR #14).
- [x] Vier Generatoren für Haupt-/Nebendreiklänge sowie erweiterte Vierklänge nach `src/aufgaben/harmoniefunktionen.mjs` auslagern; **7.200 deterministische Aufgaben- und RNG-Vergleiche ohne Abweichung**; den bisher auch von der Harmonischen Analyse verwendeten Dur-Funktionskatalog als `MAJOR_FUNCTIONS` teilen (PR #15).
- [x] Drei Generatoren für Kadenz, Stimmführungsfehler und harmonische Analyse nach `src/aufgaben/kadenz-analyse.mjs` auslagern; **6.600 deterministische Aufgaben- und RNG-Vergleiche ohne Abweichung**. `MAJOR_FUNCTIONS` aus `harmoniefunktionen.mjs` direkt importieren (PR #16).
- [x] Sämtliche **32 Aufgabengeneratoren** in fachliche ES-Module ausgelagert; `src/app.js` enthält nun nur noch deren Aufrufadapter und die Aufgabenregistrierung.

### Inventur der Aufgabengeneratoren (13 Themenbereiche)

Aus den `gens`-Registrierungen in `src/app.js`: **32 Generatorfunktionen**, davon **32 modularisiert** und **0 Generatoren mit Funktionskörpern im Bundle**. Die beiden Hörgeneratoren sind bereits in die Intervall- und Akkordmodule übernommen.

| Bereich | Generatoren | Zustand |
| --- | --- | --- |
| Notennamen | 4 | ausgelagert (#9) |
| Halb-/Ganztonschritte | 1 | ausgelagert (#10) |
| Intervalle | 2 | ausgelagert (#10) |
| Dreiklänge | 5 | ausgelagert (#12) |
| Tonleitern | 4 | ausgelagert (#11) |
| Gehörbildung | 2 | ausgelagert (#10, #12) |
| Noten-/Pausenwerte | 5 | ausgelagert (#13) |
| Haupt-/Nebendreiklänge | 2 | ausgelagert (#15) |
| Weitere Akkorde | 2 | ausgelagert (#15) |
| Quintenzirkel | 1 | ausgelagert (#14) |
| Vorzeichen lesen | 1 | ausgelagert (#14) |
| Kadenz | 2 | ausgelagert (#16) |
| Harmonische Analyse | 1 | ausgelagert (#16) |

**Empfohlene Reihenfolge:** Vollständige Regression und iPad-Abnahme der gestapelten PRs #8–#16, danach Integration nur nach Freigabe. Als nächsten technischen Block UI-Rendering, Musikduell, Notensystem und Eingabelogik inventarisieren und gezielt modularisieren; keine sichtbaren Änderungen ohne neue Abnahme. Vor jedem Auslagern Zufallsfolge, Notation, Antwortvalidierung und Browser-Start gegen den bestehenden Code prüfen.

**Hinweis zur Codequalität:** PR #12 verschiebt die sechs bisher kompakten Generatorfunktionskörper in ein eigenes Modul mit benannter Factory und unabhängigen Tests. Der eigentliche Funktionskörper wird noch in einem separaten, rein kosmetisch/refaktorierenden Schritt lesbar formatiert; keine Mischänderungen an der Aufgabenlogik.
- Generatoren und Prüffunktionen separat von der Darstellung abbilden.
- Neue Module zuerst durch Äquivalenztests gegen den vorhandenen Code absichern; dann einzeln an die Oberfläche anbinden.

## Stufe 3 – Oberfläche und Musikduell

### Inventur der bestehenden Darstellung

- `src/app.js` enthält weiterhin den gebündelten React-Code mit Aufgabenoberfläche, Einzeltraining und Tischduell (2–4 Spieler).
- Das SVG-Notensystem bestand aus 3 Ausgabewegen: `Lt` für Aufgaben mit einem Notensystem, `Rt` für das doppelte Klaviersystem und `zt` für die interaktive Noteneingabe. Gemeinsame interne Zeichenroutinen behandeln Schlüssel, Hilfslinien, Vorzeichen, Pausen und Triolen.
- Im Tischduell verwendet die obere Tischseite die CSS-Klasse `rotate-180`; die eigentliche Notengrafik wird mit `rotate: 180deg` erneut aufrecht ausgerichtet. Diese zwei Drehungen sind eine wichtige Abnahmebedingung.
- Der Duellzustand (Fragenpool, Spieler/Punkte, Zeitbegrenzung und Tast-/Touchaktionen) liegt bisher im React-Bundle. Er wird nicht gleichzeitig mit dem SVG-Renderer verändert.

### Umsetzung und nächste Schritte

- [x] SVG-Erzeugung für Notensystem, Klaviersystem und interaktive Eingabe nach `src/ui/notensystem.mjs` ausgelagert; **3.500 exakte SVG-Vergleiche (0 Abweichungen)** und **14 feste Referenzprüfsummen** mit drei Schlüsseln, Vorzeichen, Noten-/Pausenwerten, Triolen und Bewertungsfarben (PR #17).
- [x] Koordinatenzuordnung der Touch-/Mauseingabe aus React nach `src/ui/noteneingabe.mjs` auslagern: **7.680 deterministische Vergleiche ohne Verhaltensabweichung** (einschließlich SVG-Drehung/Skalierung und leerer Klicks), zusätzliche Grenzwert- und Affintransformations-Tests (PR #18).
- [ ] Den verbleibenden React-Eingabezustand (Vorzeichenwahl, Rückgängig, Löschen, Antwort abgeben) vom Rendering trennen; iPad-/Safari-Touchverhalten anschließend praktisch erneut prüfen.
- [x] Spielerinitialisierung, individuelle Antwortmischung und Punkteauswertung des Duells nach `src/duell/spielregeln.mjs` auslagern: **24.780 Originalvergleiche** für Spieler, Runden und Wertung einschließlich Zufallsfortsetzung ohne Abweichung (PR #19).
- [x] Rundenfortschritt, Antwortaufnahme, Erkennung der letzten Antwort und Wechsel zur nächsten Frage nach `src/duell/rundensteuerung.mjs` auslagern. **36.499 deterministische Referenzvergleiche** gegen den bisherigen Code ohne Abweichung (PR #20).
- [x] Duell-Aufgabenpool (`src/duell/aufgabenpool.mjs`) ohne Verhaltensänderung ausgelagert: Themenfilter, Eignungsprobe, Duplikatschutz, SVG-Renderer und Rückfallfragen. **1.250 deterministische Szenariovergleiche ohne Abweichung** (PR #21).
- [x] Echte 100-ms-Rundenuhr nach `src/duell/timer.mjs` ausgelagert (Start, Fortschrittsanzeige, automatischer Zeitabbruch, Intervall-ID): **1.800 simulierte Referenzvergleiche** gegen den bisherigen Browser-Timer ohne Abweichung (PR #22). Die React-Lifecycle-Bereinigung über `T.current` bleibt kompatibel und unverändert.
- [x] Die beiden Duell-Notengrafiken und Spieler-Antwortfelder als zustandslose JSX-Funktionen nach `src/duell/ansicht.mjs` ausgelagert. **2.400 Spieler- und 8 Noten-Ansichtsvergleiche ohne Abweichung**, 160 vergleichbare Button-Callbacks sowie zehn feste JSX-Referenzprüfsummen (PR #24).
- [x] React-Hook für die gesamte Duellsitzung (13 Zustandswerte, 3 Refs, 2 Effekte sowie Start/Antwort/Abschluss/Wechsel) nach `src/duell/sitzung.mjs` ausgelagert; bisherige Hook-Aufrufreihenfolge und Event-Sperren unverändert. **2.700 Zustand-/Ereignisvergleiche gegen den Althook ohne Abweichung**, zusätzlich feste mehrstufige Duellszenarien (PR #25).
- [ ] Nach Integration eine praktische iPad-/Safari-Abnahme der Duellbedienung, insbesondere Mehrfach-Touch, Zeitablauf, Gegenrichtung und Spielerwechsel durchführen.
- [ ] Duellansicht gestalterisch erst nach gesonderter Abnahme überarbeiten. PR #24 ändert nur den Speicherort der bisherigen Darstellung.
- [ ] Duelllayout mit gegenüberliegenden Ansichten gezielt per Browser-/iPad-Abnahme testen; alle sichtbaren Änderungen gesondert freigeben.
- [x] Frühere iPad-/Safari-Abnahme für Querformat, Touch-Eingabe und Duell durch den Nutzer als abgeschlossen gemeldet; erneute Prüfung nach späteren UI-Änderungen erforderlich.

## Stufe 4 – Aufräumen

- Erst nach erfolgreicher Migration ungenutzten Bundle-Code entfernen.
- Abhängigkeiten dokumentieren, Code formatieren, Wartbarkeit verbessern.
- Bei Bedarf Build-System einführen **nur im gesonderten PR**, zusammen mit einer zuverlässigen GitHub-Pages-Veröffentlichung.

## Freigaberegel

Jede Stufe einzeln als PR mit lauffähigen Tests. Keine automatische Übernahme in `main`.
