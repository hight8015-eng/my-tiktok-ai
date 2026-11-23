// moves.js (v8.2, M4 2026-11-24): ACTION MOVES with studio timing, as pure functions of time (segment-safe, like acting.js).
// Every move runs the same 8 phases (structure from RicksClips templates/pieces/motion_core.mjs, written new for our rig):
//   NOTICE (the eyes go first) -> READ (the head follows) -> COUNTER (anticipation: the opposite way) -> HOLD (a beat) ->
//   STRIKE (a fast snap into the action) -> IMPACT (a dip / squash on the contact frame) -> SETTLE (a damped ring) -> STILL
// Use:  import { MOVES, moveAt, contactAt, actionFromText } from './moves.js';
//       put(C, SET, { p, ry, ...perform(lt, beats), ...moveAt('dodge', lt, 1.2, { dir: -1 }) })
//   The move's fields replace the pose fields it names (hands, lean, head ...) from its start to its end; spread it LAST.
//   contactAt('dodge', 1.2) = the shot-local time of the contact frame (sound effects, a prop's hit, camera kick).
// Pose fields are the ones POSES/perform use: hL/hR hands [side, up, forward] in torso space, pL/pR elbow poles, lean (+ forward),
// side (tilt), twist, head [nod (+ down), turn, tilt], hipY (crouch < 0), squash, look [x, y], ex.
import { POSES, mirror } from './acting.js';
const FPS = 30;
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
const snapE = (x) => { x = cl(x); return 1 - (1 - x) ** 2; };                      // fast out of the gate, eases into the contact (max ~55 % in frame 1)
const ring = (u, f = 11, d = 5) => (u <= 0 ? 0 : Math.exp(-d * u) * Math.sin(f * u)); // damped oscillation (settle)
const NUM = ['lean', 'side', 'twist', 'hipY', 'squash'], VEC = ['hL', 'hR', 'pL', 'pR', 'head', 'look'];
const N0 = { ...POSES.neutral, look: [0, 0], squash: 0 };
function mix(A, B, k) {
  const R = {};
  for (const f of NUM) R[f] = (A[f] ?? 0) + ((B[f] ?? 0) - (A[f] ?? 0)) * k;
  for (const f of VEC) { const a = A[f] ?? N0[f], b = B[f] ?? N0[f]; R[f] = a.map((v, i) => v + (b[i] - v) * k); }
  return R;
}
const add = (P, d, k) => { const R = { ...P }; for (const f of NUM) if (d[f] != null) R[f] = (R[f] ?? 0) + d[f] * k;
  for (const f of VEC) if (d[f]) R[f] = R[f].map((v, i) => v + d[f][i] * k); return R; };
const P = (o) => ({ ...N0, ...o });

/* A move = frames per phase + the key poses. base = the pose it starts from (default neutral), counter = the anticipation pose,
   strike = the contact pose, final = where it rests (default = strike). dip = what the impact adds at the contact frame, ringA =
   what the settle swings by. ex: faces per phase (notice, strike, final). look = where the eyes go on NOTICE. */
export const MOVES = {
  // the ep4 knife: "I tilted my head just a little" - the eyes see it, a tiny lean INTO it, then the head and shoulders snap away
  dodge: { f: { notice: 3, read: 4, counter: 3, hold: 1, strike: 4, impact: 2, settle: 12 },
    counter: P({ lean: 3, side: 3, head: [-3, 0, 4] }), strike: P({ lean: -6, side: -12, twist: -8, head: [4, -10, -22], hipY: -.03, hL: [-.34, .3, .05], hR: [.3, .32, .1] }),
    final: P({ lean: -3, side: -7, twist: -4, head: [2, -6, -14], hipY: -.015 }), dip: { hipY: -.02, squash: -.03 }, ringA: { head: [0, 0, -6], side: -3 },
    ex: { notice: 'suspicious', strike: 'focused', final: 'stoic' }, look: [.5, 0] },
  // punch / slap: wind up far back on the toes, a 1-beat hold, a 3-frame strike, the body dips on the hit, the arm stays
  strike: { f: { notice: 3, read: 3, counter: 7, hold: 2, strike: 3, impact: 4, settle: 12 },
    counter: P({ lean: -8, twist: -22, side: 4, hR: [.42, .78, -.22], pR: [.6, -.2, -.6], hL: [-.2, .55, .18], head: [-4, 8, 0], hipY: .02 }),
    strike: P({ lean: 12, twist: 20, side: -4, hR: [.06, .98, .62], pR: [.4, -.3, .2], hL: [-.3, .4, .0], head: [4, -6, 0], hipY: -.03 }),
    final: P({ lean: 7, twist: 12, hR: [.1, .9, .55], pR: [.4, -.3, .2], hL: [-.3, .35, .02], head: [2, -4, 0], hipY: -.02 }),
    dip: { hipY: -.04, squash: -.05, lean: 4 }, ringA: { hR: [0, .05, 0], lean: 3 }, ex: { notice: 'focused', strike: 'angry', final: 'determined' }, look: [.3, 0] },
  // hand something over: a small pull back to load it, the arm reaches out, the wrist stops, the body follows a beat later
  handover: { f: { notice: 2, read: 4, counter: 4, hold: 1, strike: 8, impact: 2, settle: 10 },
    counter: P({ lean: -3, hR: [.28, .4, .02], head: [2, 0, 0] }), strike: P({ lean: 8, hR: [.12, .62, .55], pR: [.35, -.35, -.2], head: [6, 0, 0] }),
    final: P({ lean: 6, hR: [.12, .6, .52], pR: [.35, -.35, -.2], head: [5, 0, 0] }), dip: { lean: 2 }, ringA: { hR: [0, .03, 0] },
    ex: { notice: 'calm', strike: 'calm', final: 'calm' }, look: [.1, .3] },
  // whip round toward a sound: eyes first, the head snaps, the chest and hips arrive later and overshoot
  snapTurn: { f: { notice: 2, read: 2, counter: 2, hold: 0, strike: 5, impact: 1, settle: 12 },
    counter: P({ head: [3, -6, 0], twist: -4 }), strike: P({ head: [-4, 48, 0], twist: 26, side: 3 }), final: P({ head: [-2, 40, 0], twist: 22, side: 2 }),
    dip: { hipY: -.015 }, ringA: { head: [0, 8, 0], twist: 5 }, ex: { notice: 'suspicious', strike: 'shocked', final: 'suspicious' }, look: [.9, 0] },
  // flinch (startle): no wind-up, shoulders jump up, hands come in, head pulls back, then it slowly lets go
  flinch: { f: { notice: 1, read: 0, counter: 0, hold: 0, strike: 2, impact: 2, settle: 16 },
    strike: P({ lean: -9, hL: [-.14, .66, .2], hR: [.14, .66, .2], pL: [-.5, -.3, -.3], pR: [.5, -.3, -.3], head: [-10, 0, 0], hipY: -.04, squash: .05 }),
    final: P({ lean: -4, hL: [-.22, .5, .14], hR: [.22, .48, .14], head: [-4, 0, 0], hipY: -.02 }), dip: { squash: -.04 }, ringA: { head: [5, 0, 0], lean: 3 },
    ex: { notice: 'shocked', strike: 'scared', final: 'nervous' }, look: [0, -.2] },
  // knees give, arms fly out for balance, the body drops into a crouch and bounces once
  fall: { f: { notice: 2, read: 2, counter: 6, hold: 1, strike: 8, impact: 4, settle: 12 },
    counter: P({ lean: -14, hL: [-.6, .7, .1], hR: [.6, .72, .1], head: [-8, 0, 6] }), strike: P({ lean: 24, side: 8, hipY: -.34, hL: [-.4, .2, .35], hR: [.42, .18, .35], head: [12, 0, -6] }),
    final: P({ lean: 18, side: 6, hipY: -.32, hL: [-.38, .2, .32], hR: [.4, .18, .32], head: [10, 0, -4] }), dip: { hipY: -.05, squash: -.06 }, ringA: { hipY: .02, lean: 4 },
    ex: { notice: 'shocked', strike: 'pain', final: 'exhausted' }, look: [0, .6] },
};
const ORDER = ['notice', 'read', 'counter', 'hold', 'strike', 'impact', 'settle'];
const marks = (m) => { let a = 0; const M = {}; for (const k of ORDER) { M[k] = a; a += (m.f[k] || 0); } M.end = a; return M; };
/** shot-local time of the contact frame (end of STRIKE) */
export const contactAt = (name, t0) => t0 + marks(MOVES[name]).impact / FPS;
/** total length of the move in seconds */
export const moveLen = (name) => marks(MOVES[name]).end / FPS;

/** the move's pose fields at shot-local time lt for a move starting at t0. o.dir = -1 mirrors it (the other side);
    o.base = pose fields it starts from (default: neutral); o.k = strength (0..1). Returns {} before t0. */
export function moveAt(name, lt, t0, o = {}) {
  const m = MOVES[name]; if (!m || lt < t0) return {};
  const M = marks(m), f = (lt - t0) * FPS, k = o.k ?? 1;
  let base = P(o.base || {}), counter = m.counter ? { ...base, ...m.counter } : base, strike = m.strike, fin = m.final || m.strike;
  if (o.dir === -1) { counter = mirror(counter); strike = mirror(strike); fin = mirror(fin); }
  let R, ph;
  if (f < M.read) { ph = 'notice'; R = base; }
  else if (f < M.counter) { ph = 'read'; R = mix(base, counter, .25 * sm((f - M.read) / Math.max(1, m.f.read))); }
  else if (f < M.hold) { ph = 'counter'; R = mix(base, counter, .25 + .75 * sm((f - M.counter) / Math.max(1, m.f.counter))); }
  else if (f < M.strike) { ph = 'hold'; R = counter; }
  else if (f < M.impact) { ph = 'strike'; R = mix(counter, strike, snapE((f - M.strike) / Math.max(1, m.f.strike))); }
  else if (f >= M.end) { ph = 'still'; R = mix(fin, fin, 1); }                     // dead still on the final pose
  else {
    const u = (f - M.impact) / FPS;                                                // seconds since the contact frame
    R = mix(strike, fin, sm(u / ((m.f.impact + m.f.settle) / FPS)));
    const dipK = Math.exp(-u / .06) * (u < (m.f.impact || 1) / FPS * 2 ? 1 : 0); R = add(R, m.dip || {}, dipK);
    R = add(R, o.dir === -1 ? mirror({ ...N0, ...m.ringA }) : (m.ringA || {}), ring(u, 11, 5) * (m.ringA ? 1 : 0));
    // the settle lands exactly on the final pose at the end (no pop into STILL)
    const fadeK = 1 - sm((f - M.settle) / Math.max(1, m.f.settle));
    if (f >= M.settle) { const Rf = mix(fin, fin, 1); R = mix(Rf, R, fadeK); }
    ph = f < M.settle ? 'impact' : 'settle';
  }
  if (k !== 1) R = mix(P(o.base || {}), R, k);
  const look = m.look || [0, 0], lk = o.dir === -1 ? [-look[0], look[1]] : look;
  R.look = ph === 'notice' ? lk.map((v) => v * sm((f + 1) / Math.max(1, m.f.notice))) : f < M.end ? lk : lk.map((v) => v * .4);
  const ex = m.ex || {}; R.ex = ph === 'notice' || ph === 'read' || ph === 'counter' || ph === 'hold' ? (ex.notice || 'neutral') : ph === 'strike' || ph === 'impact' ? (ex.strike || ex.notice) : (ex.final || ex.strike);
  if (ph === 'still') R.still = true;
  R.phase = ph; return R;
}

/** words in a Thai script line -> the moves they call for (a first guess for film.json acts; the storyboard step edits it) */
const WORDS = [[/หลบ|เอียงคอ|เอียงหัว|เบี่ยง/, 'dodge'], [/ชก|ต่อย|ตบ|ทุบ|ฟาด|ตี|เตะ/, 'strike'], [/ยื่น|ส่ง(?:ให้|มอบ)|วาง.*ลง/, 'handover'],
  [/หันขวับ|หันกลับ|หันไป|หันมา/, 'snapTurn'], [/สะดุ้ง|ผงะ|ตกใจ/, 'flinch'], [/ล้ม|ทรุด|เข่าอ่อน|ร่วง/, 'fall']];
export function actionFromText(line) { const out = []; for (const [re, mv] of WORDS) { const m = String(line).match(re); if (m) out.push({ move: mv, word: m[0], at: m.index }); } return out.sort((a, b) => a.at - b.at); }
