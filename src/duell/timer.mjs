/**
 * Realer Browser-Intervalltimer für das Musikduell.
 * Zeitquelle und Intervall-/Abbruchfunktionen werden injiziert:
 * dadurch bleiben Laufzeitsemantik und Tests von React und DOM unabhängig.
 */
import {duelTimeProgress} from './rundensteuerung.mjs';

/**
 * Startet die 100-ms-Rundenuhr und gibt die originale Intervall-ID zurück.
 * onProgress läuft vor der Prüfung auf Zeitablauf, genau wie bisher.
 */
export function startDuelRoundTimer({seconds,now,schedule,cancel,onProgress,onExpired}) {
  const durationMs = seconds * 1e3;
  const deadline = now() + durationMs;
  const id = schedule(() => {
    const progress = duelTimeProgress(now(),deadline,durationMs);
    onProgress(progress.percent);
    if (progress.expired) {
      cancel(id);
      onExpired();
    }
  },100);
  return id;
}
