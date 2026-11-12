/**
 * Reine Duellregeln: Teilnehmer, Antwortmischung und Punkteauswertung.
 * React, Timer, DOM und duellseitiges Layout bleiben in der Oberfläche.
 */
export function createDuelPlayers(count, names) {
  const players = [];
  for (let index = 0; index < count; index++) {
    players.push({
      id: index,
      name: names[index].trim() || 'Spieler ' + (index + 1),
      score: 0, streak: 0, answer: null, time: null, perm: [], gain: 0,
    });
  }
  return players;
}

/** Jede Person erhält eine unabhängig gemischte Optionenauswahl. */
export function prepareDuelRoundPlayers(players, options, random = Math.random) {
  return players.map(player => {
    const perm = options.map((option, index) => index);
    for (let index = perm.length - 1; index > 0; index--) {
      const swap = Math.floor(random() * (index + 1));
      [perm[index], perm[swap]] = [perm[swap], perm[index]];
    }
    return {...player, answer: null, time: null, gain: 0, perm};
  });
}

/** Richtige Antwort +100, ab drittem Treffer in Folge +100, schnellste Person +50. */
export function scoreDuelRound(players, correctIndex) {
  let fastestIndex = null;
  let earliestTime = Infinity;
  const scored = players.map((player, index) => {
    const correct = player.answer === correctIndex;
    const streak = correct ? player.streak + 1 : 0;
    let gain = 0;
    if (correct) {
      gain = 100 + (streak >= 3 ? 100 : 0);
      if (player.time !== null && player.time < earliestTime) {
        earliestTime = player.time;
        fastestIndex = index;
      }
    }
    return {...player, streak, gain, score: player.score + gain};
  });
  if (fastestIndex !== null) {
    scored[fastestIndex].gain += 50;
    scored[fastestIndex].score += 50;
  }
  return {players: scored, anyCorrect: scored.some(player => player.answer === correctIndex)};
}
