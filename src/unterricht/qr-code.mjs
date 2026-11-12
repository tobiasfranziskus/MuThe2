/**
 * QR-Code für Unterrichtslinks vollständig im Browser erzeugen.
 * Keine externen Endpunkte, kein Zugriff auf Lernprofile.
 *
 * Bibliothek: Kazuhiko Arase, qrcode-generator (MIT).
 * Siehe vendor/LICENSE.qrcode-generator.txt.
 */
import {qrcode} from './vendor/qrcode.mjs';

const QUIET_ZONE = 4;

/**
 * Erzeugt nur die für ein React-/SVG-Element notwendigen Geometriedaten.
 * Die vier Module breite weiße Ruhezone gehört zur Zeichenfläche.
 */
export function createLessonQrSvgData(link) {
  if (typeof link !== 'string' || link.length > 2500) {
    throw new RangeError('Ungültiger oder zu langer Unterrichtslink');
  }
  let parsed;
  try {
    parsed = new URL(link);
  } catch {
    throw new TypeError('Unterrichtslink muss eine vollständige URL sein');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new TypeError('Nur HTTP(S)-Unterrichtslinks können als QR-Code erscheinen');
  }

  const qr = qrcode(0,'M');
  // Byte-Mode: URLSearchParams-Kodierung ist ASCII und verliert keine Umlaute.
  qr.addData(parsed.toString(), 'Byte');
  qr.make();

  const modules = qr.getModuleCount();
  const size = modules + 2 * QUIET_ZONE;
  const paths = [];

  // Benachbarte dunkle Module zu Zeilenabschnitten zusammenfassen.
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules;) {
      if (!qr.isDark(row,col)) {
        col++;
        continue;
      }
      const start = col;
      while (col < modules && qr.isDark(row,col)) col++;
      const run = col - start;
      const x = start + QUIET_ZONE, y = row + QUIET_ZONE;
      paths.push('M'+x+' '+y+'h'+run+'v1h-'+run+'z');
    }
  }
  return {moduleCount:modules,size,viewBox:'0 0 '+size+' '+size,path:paths.join('')};
}
