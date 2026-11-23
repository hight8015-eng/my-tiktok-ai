// text3d.js (v7.1): a BIG kinetic word standing IN the set, behind the characters (user ref: 'text behind the person').
//   bigWord(SET, 'PUPPET', [x, y, z], { ry, h, col, k, t, font })  -> call every frame inside the shot; k = 0..1 reveal.
// Use it for the 1-2 s hook and the cliffhanger only. The word scales up from 92% and fades in over k; letters rise one by
// one (stagger) like the presets in the refs. Depth-tested, so whoever stands in front of it covers it.
import { THREE } from './engine.js';
const CACHE = new Map(), LIVE = [];
function tex(text, font, col) { const key = text + font + col; if (CACHE.has(key)) return CACHE.get(key);
  const c = document.createElement('canvas'), x = c.getContext('2d'); x.font = font; const w = Math.ceil(x.measureText(text).width) + 80; c.width = w; c.height = 340;
  const g = c.getContext('2d'); g.font = font; g.textBaseline = 'middle'; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 24; g.fillText(text, 40, 175);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const r = { t, w, h: 340, letters: [...text] }; CACHE.set(key, r); return r; }
export function bigWordsReset() { LIVE.forEach(m => { m.visible = false; }); }
export function bigWord(par, text, p, o = {}) { const k = Math.max(0, Math.min(1, o.k ?? 1)); if (k <= 0) return;
  const font = o.font || '900 260px Prompt', T = tex(text, font, o.col || '#ffffff'); let m = par.userData['bw_' + text];
  if (!m) { m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: T.t, transparent: true, depthWrite: false, toneMapped: false }));
    m.renderOrder = -1; par.add(m); par.userData['bw_' + text] = m; LIVE.push(m); }
  const h = o.h ?? 2.2, e = 1 - Math.pow(1 - k, 3), s = .92 + .08 * e; m.visible = true; m.position.set(...p); m.position.y += (1 - e) * -.25;
  m.rotation.set(0, (o.ry || 0) * Math.PI / 180, 0); m.scale.set(h * T.w / T.h * s, h * s, 1); m.material.opacity = e * (o.op ?? .9); }
