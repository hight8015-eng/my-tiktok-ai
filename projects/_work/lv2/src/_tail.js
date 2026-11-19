// =====================================================================
export function initShots(timing) { TM.env = timing.env; for (let i = 0; i < SHOTS.length; i++) SHOTS[i].t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : timing.end; }
export function runShot(sh, t) { reset(t); sh.fn(t - sh.t0, t); }
export const WHITEK = WHITE;
export const COVER = { id: 'COVER', t0: 0, fn: (lt, t, o = {}) => {
  reset(10); past(); POST.sat = 1; warLight(); FIELD.visible = true; FA.rock.visible = true; Wd.cityAt(true, 10); Wd.armyAt(1, 10, .35);
  const cm = o.cam || [.6, 1.9, 3.6], g = o.tgt || [0, 2.3, 0]; camF(cm, g, cm, g, 0, o.fov || 46); // camera first: the aura is placed relative to it
  put(K(), FIELD, { p: [0, 1.16, .2], ry: 0, ex: 'sly', eyeC: '#ff2030', ...flick(.6) }); aura(K(), 1, 10);
} };
export const BENCH = { id: 'BENCH', t0: 0, fn: (lt, t, o = {}) => {
  reset(0); hallLight(); Wd.hallAt(0); const ids = ['kael', 'elena', 'lucien', 'arcus', 'kael2', 'k1'];
  ids.forEach((id, i) => put(CHARS[id], HALL, { p: [(i - 2.5) * .9, 0, -6], ry: o.ry ?? 0, ex: ['sly', 'happy', 'smug', 'evil', 'shocked', 'frown'][i] }));
  const bc = o.cam || [0, 1.3, -.8], bt = o.tgt || [0, 1.0, -6]; camH(bc, bt, bc, bt, 0, o.fov || 40);
} };
