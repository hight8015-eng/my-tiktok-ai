// motion.js (v6.7): body-mechanics building blocks. Each returns pose fields to spread into put()/pose():
//   put(C, SET, { p, ...base, ...turn(lt, .4, .6, 0, 120), ...take(lt, 1.2) })
// Rules they follow (12 principles + body-mechanics practice):
// - nothing starts or stops all at once: the root (hips/torso) leads, lighter parts drag and settle later (overlap);
// - successive breaking of joints on a turn: EYES first, then HEAD, then CHEST, then HIPS/feet, each a little later
//   and each overshooting slightly before settling;
// - anticipation before every action (the opposite way first), follow-through + settle after;
// - moving holds: a character who stops keeps breathing and drifting (pose() already breathes; use hold());
// - weight: heavier = slower start, smaller overshoot, longer settle.
// All are pure functions of time (deterministic for segmented renders).
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
const backOut = (u, s = 1.4) => { u = cl(u); const c3 = s + 1; return 1 + c3 * (u - 1) ** 3 + s * (u - 1) ** 2; };
const settle = (x, f = 11, d = 5) => x <= 0 ? 0 : Math.exp(-d * x) * Math.sin(f * x);
const lerp = (a, b, k) => a + (b - a) * k;

/* turn from yaw a0 to a1 (deg) starting at t0, total dur: eyes .00, head .06, chest .12, hips .2 of dur later.
   Returns { ry (body), head: [x, y, z] } (head yaw relative to the body), look (eye dart). */
export function turn(lt, t0, dur, a0, a1, o = {}) { const d = a1 - a0, k = (lag) => backOut((lt - t0 - lag * dur) / (dur * .8), o.snap ?? 1.2);
  const body = lerp(a0, a1, k(.2)), head = lerp(a0, a1, k(.06)), chest = lerp(a0, a1, k(.12)); const eye = cl((lt - t0) / (dur * .15), 0, 1) * (1 - sm((lt - t0 - dur * .5) / (dur * .4)));
  return { ry: body, head: [o.dip ?? -4 * Math.sin(Math.PI * cl((lt - t0) / dur)), cl(head - body, -50, 50), 0], twist: cl(chest - body, -30, 30), look: [Math.sign(d) * .6 * eye, 0] }; }

/* surprise TAKE (cartoon double-take reduced for a story channel): a small anticipation down (squash, head dips),
   then up into a stretched pose that overshoots, then settles. k = strength 0..1. */
export function take(lt, t0, k = 1) { const u = lt - t0; if (u < -.15) return {};
  const ant = u < 0 ? sm((u + .15) / .15) : 1 - sm(u / .08), up = u < 0 ? 0 : backOut(u / .22, 2.2), wob = settle(u - .22, 12, 6);
  return { squash: k * (-.08 * ant + .07 * up * (1 - sm((u - .25) / .4)) + .03 * wob), lean: k * (6 * ant - 8 * up * (1 - sm((u - .3) / .5))), head: [k * (10 * ant - 14 * up * (1 - sm((u - .3) / .5)) + 4 * wob), 0, 0] }; }

/* hit reaction from direction dir (-1 = hit from the left, 1 = from the right): the head snaps first, the chest
   follows 2 frames later, the hips last; a stagger step; recovery with a damped wobble. */
export function hitReact(lt, t0, dir = 1, k = 1) { const u = lt - t0; if (u < 0) return {};
  const head = settle(u, 9, 4.5), chest = settle(u - .06, 8, 4), hips = settle(u - .12, 6, 3.5);
  return { head: [k * -18 * head, k * dir * -14 * head, k * dir * 10 * head], side: k * dir * 12 * chest, lean: k * -10 * chest, p_off: [k * dir * -.12 * cl(hips * 2, -1, 1), 0, 0], squash: k * -.04 * Math.max(0, chest) }; }

/* stand up from a seat: lean forward first (the weight goes over the feet), push, rise, small overshoot. */
/* LEG = the rig's standing hip height (import { LEG } from './chars.js'): sitting puts the hips at .04, so the rise
   interpolates the standing hip offset from (.04 - LEG) to 0 - continuous, no pop at the switch. */
export function standUp(lt, t0, LEG, dur = .9) { const u = (lt - t0) / dur; if (u <= 0) return { sit: true, lean: 0 };
  const lean = 22 * Math.sin(Math.PI * cl(u / .7)), rise = backOut((u - .25) / .75, .8);
  return u < .25 ? { sit: true, lean } : { hipY: lerp(.04 - LEG, 0, rise), lean }; }

/* moving hold: someone who stops never freezes: a slow weight shift side to side, the head settles a beat later. */
export function hold(lt, seed = 0, k = 1) { const s = Math.sin(lt * .9 + seed), s2 = Math.sin(lt * .9 + seed - .6);
  return { side: k * 1.6 * s, twist: k * 2 * Math.sin(lt * .45 + seed * 2), head: [k * 1.5 * Math.sin(lt * 1.3 + seed), k * 3 * s2, -k * 1.2 * s2] }; }

/* talking beats: a small head nod lands ON stressed syllables (env > .6 rising edges) and decays; gestures
   happen a hair BEFORE the word (anticipation), never after. env = the shot's voice envelope at t. */
export function beat(env, envPrev, lt, k = 1) { const rise = Math.max(0, env - envPrev) * 6; return { head: [k * -6 * cl(rise), 0, 0] }; }

/* camera shake by TRAUMA (Eiserloh, GDC 2016 'Juicing your cameras'): each hit adds trauma (0..1) that decays
   linearly; shake = trauma^2 x smooth noise, capped. hits = [[time, amount], ...]. Returns 0..1 for SH.a. */
export function trauma(t, hits, decay = 1.6) { let tr = 0; for (const [h, a] of hits) if (t >= h) tr = Math.max(tr, a - (t - h) * decay); return Math.max(0, Math.min(1, tr)) ** 2; }
