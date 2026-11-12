/**
 * Kleine DOM-Helfer für die Abgabe- und Lehrerseite (ohne React, ohne innerHTML
 * für Nutzerdaten).
 */
import {createLessonQrSvgData} from '../unterricht/qr-code.mjs';

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function leere(node, ...children) {
  node.replaceChildren(...children.filter(Boolean));
  return node;
}

/** QR-Code als SVG-Element; null, wenn der Link zu lang ist. */
export function qrSvg(link, label, size = 280) {
  let qr;
  try {
    qr = createLessonQrSvgData(link);
  } catch {
    return null;
  }
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', qr.viewBox);
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
  svg.setAttribute('class', 'qr');
  const rect = document.createElementNS(ns, 'rect');
  for (const [k, v] of Object.entries({x: 0, y: 0, width: qr.size, height: qr.size, fill: '#fff'})) rect.setAttribute(k, v);
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', qr.path);
  path.setAttribute('fill', '#000');
  svg.append(rect, path);
  return svg;
}

export function speicher() {
  try {
    const s = globalThis.localStorage;
    const probe = '__musiktheorie_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export async function kopiere(text, feld) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (feld) {
      feld.focus();
      feld.select();
      try { return document.execCommand('copy'); } catch { return false; }
    }
    return false;
  }
}

export function herunterladen(dateiname, inhalt, typ) {
  const blob = new Blob([inhalt], {type: typ});
  const url = URL.createObjectURL(blob);
  const a = el('a', {href: url, download: dateiname});
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function prozent(q) {
  return q === null || q === undefined ? '–' : Math.round(q * 100) + ' %';
}

/** Balken mit Prozentzahl, auch in Schwarz-Weiß lesbar. */
export function quoteBalken(q) {
  const value = q === null || q === undefined ? 0 : Math.round(q * 100);
  const level = q === null || q === undefined ? 'leer' : value >= 80 ? 'gut' : value >= 50 ? 'mittel' : 'schwach';
  return el('span', {class: 'balken ' + level, title: prozent(q)}, [
    el('span', {class: 'balken-fuellung', style: 'width:' + value + '%'}),
    el('span', {class: 'balken-text', text: prozent(q)}),
  ]);
}
