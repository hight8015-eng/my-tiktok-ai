// camplan.js (v8.0, M2 2026-11-23): the camera grammar of film.json as pure functions of time (deterministic for split renders).
// Ideas and numbers from mromidev/claude-animated-shorts templates/bridge/story.ts (MIT): smootherstep glides, a creeping push-in on
// every hold with a soft "punch" on stressed words, dolly vs zoom pushes, impact kicks that flip sign every frame and die in 7 frames,
// and depth of field by shot size. The code here is our own. Nothing in the engine calls this file: an episode opts in with
//   import { camPlan, wordTime } from './camplan.js';  const c = camPlan(SHOT.cam, lt, t, timing);  look(V(...c.pos), V(...c.look), c.fov, c.roll)
// Units: metres, degrees, seconds; px values are at 720x1280 like tools/cam_gates.py. FPS 30.
const FPS = 30;
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
/** reference ease: symmetric smootherstep, attack = release */
export const glide = (u) => { const x = cl(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mixV = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const full = (k) => ({ fov: 40, roll: 0, ...k });

/** time of a word anchor ["word", nth (1-based), frame offset] in timing.json caption chunks ([t0, t1, text]); numbers pass through */
export function wordTime(at, timing) {
  if (typeof at === 'number') return at;
  const [w, nth = 1, off = 0] = at; let seen = 0;
  for (const c of (timing && timing.caps) || []) { if (String(c[2]).replace(/\*/g, '').includes(w) && ++seen === nth) return c[0] + off / FPS; }
  throw new Error(`camplan: word "${w}" #${nth} not found in timing.caps`);
}

/** keys: [{ at: t | anchor, pos, look, fov?, roll?, glide?: frames (default 24), cut?: true }] -> camera at time t (shot-local keys use lt) */
export function camKeys(keys, t, timing) {
  let cur = full(keys[0]);
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i], t0 = wordTime(k.at, timing); if (t < t0) break;
    const nxt = full(k); if (k.cut) { cur = nxt; continue; }
    const g = glide((t - t0) * FPS / (k.glide ?? 24));
    cur = { pos: mixV(cur.pos, nxt.pos, g), look: mixV(cur.look, nxt.look, g), fov: cur.fov + (nxt.fov - cur.fov) * g, roll: cur.roll + (nxt.roll - cur.roll) * g };
  }
  return cur;
}

/** push-in factor since t0 (1 = no push, <1 = closer): `rate` % of the subject size per frame, a punch raises it for n frames with 8-frame soft edges */
export function pushK(t, t0, rate = .25, punch = null) {
  const f = Math.max(0, (t - t0) * FPS); let s = rate / 100 * f;
  if (punch) { const pf = Math.max(0, (t - punch.t) * FPS), n = punch.n ?? 35, extra = (punch.rate - rate) / 100;
    for (let i = 0; i < Math.min(pf, n); i++) s += extra * Math.max(0, Math.min(1, (i + .5) / 8, (n - i - .5) / 8)); }
  return Math.exp(-s);
}
/** dolly: the camera slides toward the look point (k < 1) */
export const dolly = (pos, look, k) => look.map((v, i) => v + (pos[i] - v) * k);
/** zoom push for a camera that cannot move (next to a wall): tan(fov/2) shrinks by k */
export const zoomFov = (fov, k) => (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k);

/** impact kicks [[t, gain], ...]: the image offset flips sign every frame and decays to 0 in 7 frames (no hand-held float) */
export function kickAt(t, kicks = []) {
  let a = 0;
  for (const [t0, g] of kicks) { const n = Math.floor((t - t0) * FPS + 1e-6); if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5; }
  return a;
}
/** move the look point sideways by `3 px at 720 x a` at the look distance, plus a small roll */
export function applyKick(c, a) {
  if (!a) return c;
  const d = c.look.map((v, i) => v - c.pos[i]), L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + .6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * .23 };
}

/** depth of field by shot size: blur-disc radius in px at 1080 wide for things at infinity (0 = all sharp) */
export const DOF_BY_SIZE = { ECU: 16, CU: 14, MCU: 12, MS: 11, MLS: 7, LS: 0, WS: 0, EWS: 0, INSERT: 14 };

/** the whole camera of one shot from its film.json "cam" block.
 *  cam = { keys:[...], push: %/frame on holds (default .25), punch: { at, rate, n }, mode: 'dolly' | 'zoom', kick: [[at, gain]], size, dof }
 *  lt = time since the shot started (keys and push use it), t = episode time (word anchors, kicks), timing = timing.json */
export function camPlan(cam, lt, t, timing) {
  const toLocal = (at, t0) => wordTime(at, timing) - t0, t0 = t - lt;
  const keys = cam.keys.map(k => ({ ...k, at: toLocal(k.at ?? 0, t0) }));
  // holds creep in (push), glides do not; a glide starts from the pushed picture of the hold before it, so nothing jumps
  const rate = cam.push ?? .25, pu = cam.punch ? { t: toLocal(cam.punch.at, t0), rate: cam.punch.rate ?? .6, n: cam.punch.n } : null;
  const pushed = (s, from, to) => { if (!(rate > 0) || to <= from) return s; const k = pushK(to, from, rate, pu);
    return cam.mode === 'zoom' ? { ...s, fov: zoomFov(s.fov, k) } : { ...s, pos: dolly(s.pos, s.look, k) }; };
  let cur = full(keys[0]), holdFrom = keys[0].at, c = null;
  for (let i = 1; i < keys.length && !c; i++) {
    const k = keys[i]; if (lt < k.at) break;
    const held = pushed(cur, holdFrom, k.at), nxt = full(k);
    if (k.cut) { cur = nxt; holdFrom = k.at; continue; }
    const gd = (k.glide ?? 24) / FPS;
    if (lt < k.at + gd) { const g = glide((lt - k.at) / gd); c = { pos: mixV(held.pos, nxt.pos, g), look: mixV(held.look, nxt.look, g), fov: held.fov + (nxt.fov - held.fov) * g, roll: held.roll + (nxt.roll - held.roll) * g }; }
    else { cur = nxt; holdFrom = k.at + gd; }
  }
  if (!c) c = pushed(cur, holdFrom, lt);
  // a kick is [t_or_anchor, gain] or a flat word anchor with the gain last: ["ปัก", 1, 0, 1.0]
  const kicks = (cam.kick || []).map(k => typeof k[0] === 'string' ? [wordTime(k.slice(0, 3), timing), k[3] ?? 1] : [wordTime(k[0], timing), k[1] ?? 1]);
  c = applyKick(c, kickAt(t, kicks));
  return { ...c, dof: cam.dof?.cInf ?? DOF_BY_SIZE[cam.size] ?? 0, focus: cam.dof?.focus };
}
