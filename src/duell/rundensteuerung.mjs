/**
 * Zustandslose Rundensteuerung für das Musikduell.
 *
 * React verwaltet weiterhin den echten Browser-Timer, den Antwortstatus,
 * akustisches Feedback und das Tisch-Layout. Hier liegen nur die reinen
 * Entscheidungen und die aktualisierte Spielerantwort.
 */

/** Prozentual verbleibende Rundenzeit, ohne Änderung am echten Zeitablauf. */
export function duelTimeProgress(now, deadline, durationMs) {
  const rawPercent = 100 * (deadline - now) / durationMs;
  return {percent: Math.max(0, rawPercent), expired: rawPercent <= 0};
}

/**
 * Speichert eine einzelne Antwort in einer neuen Spielerliste.
 * Den Schutz vor doppelten Antworten übernimmt weiterhin der UI-Handler.
 * Die Uhr wird erst nach dem Kopieren der Spielerliste aufgerufen,
 * wie zuvor im Duell.
 */
export function recordDuelAnswer(players, playerIndex, optionIndex, now) {
  const player = players[playerIndex];
  const answer = player.perm[optionIndex];
  const next = [...players];
  next[playerIndex] = {...player, answer, time: now()};
  return next;
}

/** Sind sämtliche Personen fertig? Eine nicht gegebene Antwort ist null. */
export function allDuelPlayersAnswered(players) {
  return players.every(player => player.answer !== null);
}

/** Gibt die nächste Runde oder null für die Schlusswertung zurück. */
export function nextDuelRoundIndex(currentIndex, roundCount) {
  return currentIndex + 1 >= roundCount ? null : currentIndex + 1;
}
