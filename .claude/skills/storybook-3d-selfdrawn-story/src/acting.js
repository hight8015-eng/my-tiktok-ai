// acting.js (v6.8): faces + body language that fit the situation. Pure functions of time (segment-safe).
//   import { perform, gaze, exShift, POSES } from './acting.js';
//   put(C, SET, { p, ry, ...perform(lt, [[0, 'armsCrossed'], [1.4, 'thinking'], [2.6, 'realize', { ex: 'realize' }]]), talk })
// Principles (Ed Hooks 'Acting for Animators'; Ekman FACS; Disney 12 principles; Preston Blair expression sheets):
// - THOUGHT -> FEELING -> ACTION: the eyes change first, then the face, then the head, then the body (the body is the
//   last to know). A reaction never starts with the hands.
// - one clear emotion per beat; the pose must read as a SILHOUETTE (arms away from the body when the gesture matters).
// - asymmetry: no twins (one hand busy, the other resting; head tilted; weight on one leg).
// - expression changes hide under a blink; eyes move in quick saccades and HOLD (never drift like syrup).
// - FRONT CAMERA: gestures spread SIDEWAYS (x) and up; an arm pointing straight at the lens loses its silhouette. The 2D
//   body sprite cannot bend, so lean/crouch read mainly in 3/4 and side views; in front views sell the pose with arms,
//   head tilt and the face.
// - status: high status = still, upright, chin level, few gestures; low status = fidgets, head down, self-touch.
// - open body (arms out, chest open) = confident / honest / welcoming; closed (arms crossed, self-hug, hands at the
//   face) = defensive / scared / hiding something.
import { exOf } from './chars.js';
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
const backOut = (u, s = 1.3) => { u = cl(u); const c3 = s + 1; return 1 + c3 * (u - 1) ** 3 + s * (u - 1) ** 2; };
const hsh = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lerpA = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

/* POSES: torso-space hands hL/hR (x = side, y = up, z = forward), elbow poles pL/pR, torso lean (+ = forward), side
   (tilt), twist, head [x nod (+ = down), y turn, z tilt], hipY (crouch < 0), default face ex and gaze.
   Shoulders sit at about (+-.2, .98); hands hang at y ~.26; the face is at about y 1.35, z .2. */
const REST_L = [-.3, .26, .07], REST_R = [.3, .26, .07], PL = [-.3, -.45, -.85], PR = [.3, -.45, -.85];
const P_ = (o) => ({ hL: REST_L, hR: REST_R, pL: PL, pR: PR, lean: 0, side: 0, twist: 0, head: [0, 0, 0], hipY: 0, ex: 'neutral', ...o });
export const POSES = {
  // --- neutral / status
  neutral: P_({}),
  relaxed: P_({ side: 4, head: [0, 0, -5], hR: [.3, .3, .04], ex: 'calm' }),                                  // weight on one leg
  confident: P_({ lean: -5, head: [-6, 0, 0], hL: [-.34, .5, -.05], hR: [.34, .5, -.05], pL: [-1, 0, -.3], pR: [1, 0, -.3], ex: 'confident' }), // hands on hips, chin up
  handsOnHips: P_({ lean: -3, hL: [-.34, .5, -.05], hR: [.34, .5, -.05], pL: [-1, 0, -.3], pR: [1, 0, -.3], ex: 'stoic' }),
  armsCrossed: P_({ lean: -3, head: [-3, 0, 3], hL: [.12, .66, .2], hR: [-.12, .62, .22], pL: [-.8, -.2, .3], pR: [.8, -.2, .3], ex: 'annoyed' }), // closed / defensive / unimpressed
  handsBehind: P_({ lean: -4, head: [-2, 0, 0], hL: [-.08, .4, -.18], hR: [.08, .42, -.18], pL: [-1, -.3, -.4], pR: [1, -.3, -.4], ex: 'stoic' }), // authority, calm control
  proud: P_({ lean: -8, head: [-12, 0, 0], hL: [-.34, .5, -.05], hR: [.3, .7, .16], pL: [-1, 0, -.3], pR: [.6, -.4, -.3], ex: 'smug' }), // hand on chest, chin high
  // --- thinking / mind
  thinking: P_({ head: [-6, 10, 8], side: -3, hR: [.06, 1.12, .3], pR: [.6, -.6, .1], hL: [.02, .66, .22], pL: [-.8, -.3, .2], ex: 'thinking', look: [.6, -.8] }), // hand on chin, eyes up-side
  chinRub: P_({ head: [4, -6, 0], hR: [.04, 1.06, .32], pR: [.6, -.6, .1], ex: 'suspicious', look: [-.6, 0] }),
  headScratch: P_({ head: [6, 0, 12], side: 4, hR: [.2, 1.62, .02], pR: [1, .2, -.2], ex: 'confused' }),   // confused / awkward
  realize: P_({ lean: -6, head: [-8, 0, 0], hR: [.26, 1.25, .34], pR: [.6, -.6, .2], ex: 'realize' }),      // finger up: 'wait...'
  facepalm: P_({ lean: 10, head: [18, 0, -6], hR: [.04, 1.3, .3], pR: [.7, -.5, .3], hL: [-.32, .3, .05], ex: 'annoyed' }),
  // --- talk / social
  explain: P_({ head: [0, 0, 4], hR: [.54, .7, .24], hL: [-.5, .62, .22], pR: [.8, -.6, -.2], pL: [-.8, -.6, -.2], ex: 'neutral' }), // palms out at waist height
  shrug: P_({ head: [4, 0, 12], hL: [-.5, .7, .18], hR: [.5, .7, .18], pL: [-.6, -.8, -.2], pR: [.6, -.8, -.2], hipY: .01, ex: 'confused' }),
  point: P_({ lean: 4, twist: -8, head: [0, -6, 0], hR: [.62, 1.08, .46], pR: [1, -.3, 0], ex: 'determined' }),
  accuse: P_({ lean: 12, twist: -10, head: [8, -6, 0], hR: [.58, 1.0, .5], pR: [1, -.3, 0], hL: [-.34, .3, .02], ex: 'glare' }),
  stopHand: P_({ lean: -6, head: [-4, 0, 0], hR: [.46, 1.02, .42], pR: [1, -.6, 0], ex: 'frown' }),           // palm out: 'stop / no'
  offer: P_({ lean: 6, head: [4, 0, 6], hR: [.5, .66, .4], pR: [.6, -.8, 0], ex: 'smilePolite' }),         // palm up, giving
  beckon: P_({ lean: -2, head: [0, 0, 6], hR: [.46, .9, .34], pR: [.6, -.8, 0], ex: 'sly' }),
  wave: P_({ head: [0, 0, 6], hR: [.62, 1.55, .08], pR: [1, -.3, -.2], ex: 'smileReal' }),
  whisper: P_({ lean: 14, side: 6, head: [6, 10, 10], hR: [.08, 1.28, .36], pR: [.7, -.5, .3], ex: 'sly', look: [.8, 0] }),
  leanIn: P_({ lean: 14, head: [-4, 0, 0], hL: [-.36, .52, .2], hR: [.36, .52, .2], ex: 'focused' }),        // interest / intimidation
  leanBack: P_({ lean: -12, head: [-6, 0, 6], hL: [.1, .64, .22], hR: [-.1, .62, .24], pL: [-.8, -.2, .3], pR: [.8, -.2, .3], ex: 'skeptical' }),
  // --- happy / positive
  laugh: P_({ lean: -10, head: [-14, 0, 6], hL: [-.08, .6, .24], hR: [.34, .5, .05], ex: 'laugh' }),
  cheer: P_({ lean: -6, head: [-14, 0, 0], hL: [-.66, 1.58, .08], hR: [.66, 1.58, .08], pL: [-1, 0, -.2], pR: [1, 0, -.2], ex: 'happy' }),
  fistPump: P_({ lean: 6, head: [4, 0, 0], hipY: -.03, hR: [.44, .86, .22], pR: [.8, -.8, -.2], ex: 'grinTeeth' }),
  thumbsUp: P_({ head: [0, 0, 8], hR: [.5, .92, .3], pR: [.9, -.6, -.1], ex: 'wink' }),
  relief: P_({ lean: 8, head: [10, 0, 0], hL: [-.06, .76, .24], hR: [.06, .74, .24], ex: 'relieved' }),      // hand on chest, exhale
  // --- fear / shock
  recoil: P_({ lean: -16, head: [-10, 0, 0], hipY: -.02, hL: [-.44, .98, .28], hR: [.44, .96, .28], pL: [-.6, -.6, 0], pR: [.6, -.6, 0], ex: 'shocked' }),
  gasp: P_({ lean: -6, head: [-6, 0, 0], hR: [.04, 1.2, .32], pR: [.7, -.5, .3], ex: 'surprised' }),         // hand over mouth
  defend: P_({ lean: -10, head: [12, 0, 0], hipY: -.04, hL: [-.04, 1.25, .36], hR: [.08, 1.18, .4], pL: [-1, -.3, 0], pR: [1, -.3, 0], ex: 'scared' }),
  cower: P_({ lean: 26, head: [20, 0, 0], hipY: -.14, hL: [-.1, 1.45, .24], hR: [.1, 1.45, .24], pL: [-1, 0, 0], pR: [1, 0, 0], ex: 'terror' }),
  frozen: P_({ head: [-2, 0, 0], hL: [-.34, .3, .1], hR: [.34, .3, .1], ex: 'dread', still: true }),          // fear: the body stops
  handsUp: P_({ lean: -4, head: [-4, 0, 0], hL: [-.62, 1.4, .08], hR: [.62, 1.4, .08], pL: [-1, -.2, -.2], pR: [1, -.2, -.2], ex: 'scared' }), // surrender
  anxious: P_({ side: -2, head: [8, 0, -4], hL: [-.02, .5, .26], hR: [.04, .52, .26], pL: [-.8, -.4, 0], pR: [.8, -.4, 0], ex: 'anxious', look: [-.4, .3] }), // wringing hands
  selfHug: P_({ lean: 8, head: [10, 0, 0], hipY: -.02, hL: [.2, .78, .16], hR: [-.2, .8, .16], pL: [-.8, -.4, .3], pR: [.8, -.4, .3], ex: 'hurt' }),
  // --- sad / defeat
  slump: P_({ lean: 18, head: [24, 0, 0], hipY: -.03, hL: [-.22, .2, .2], hR: [.22, .2, .2], ex: 'sad', look: [0, .8] }),
  heartbreak: P_({ lean: 10, head: [14, 0, 6], hR: [.04, .82, .24], pR: [.8, -.4, .2], hL: [-.26, .28, .1], ex: 'despair' }), // hand on heart
  ashamed: P_({ lean: 6, head: [22, -24, 0], hL: [-.04, .4, .2], hR: [.04, .42, .2], ex: 'ashamed', look: [-.6, .7] }),       // looks away and down
  exhausted: P_({ lean: 38, head: [-10, 0, 0], hipY: -.12, hL: [-.2, -.05, .4], hR: [.2, -.05, .4], pL: [-1, 0, 0], pR: [1, 0, 0], ex: 'exhausted' }), // hands on knees
  // --- anger / threat
  fists: P_({ lean: 6, head: [8, 0, 0], hipY: -.02, hL: [-.38, .34, .08], hR: [.38, .34, .08], pL: [-1, -.3, -.3], pR: [1, -.3, -.3], ex: 'rage' }), // shaking fists at the sides
  menace: P_({ lean: 10, head: [14, 0, 0], hL: [-.32, .3, .06], hR: [.3, .32, .06], ex: 'menace', look: [0, -.6] }), // head down, eyes up
  guard: P_({ twist: 20, hipY: -.07, lean: 8, head: [6, -16, 0], hL: [-.06, 1.06, .42], hR: [.14, .94, .3], pL: [-1, -.4, 0], pR: [1, -.4, 0], ex: 'determinedHard' }), // fighting guard
  grabCollar: P_({ lean: 16, head: [6, 0, 0], hL: [-.3, 1.02, .52], hR: [.32, 1.02, .52], pL: [-1, -.4, 0], pR: [1, -.4, 0], ex: 'rage' }),
  coldStare: P_({ lean: 0, head: [4, 0, 0], ex: 'coldFury', still: true }),                                  // stillness = power
  // --- sneaky
  sneak: P_({ lean: 16, hipY: -.1, head: [-6, 0, 0], hL: [-.18, .82, .34], hR: [.18, .84, .34], pL: [-1, -.4, 0], pR: [1, -.4, 0], ex: 'sneaky' }),
  peek: P_({ side: 14, lean: 6, head: [0, 0, 12], hR: [.3, .9, .3], ex: 'suspicious', look: [.8, 0] }),
};
// mirror a pose (left <-> right) for staging: the gesturing hand should be the one nearer the camera / away from the partner
export function mirror(P) { const f = (a) => a && [-a[0], a[1], a[2]]; return { ...P, hL: f(P.hR), hR: f(P.hL), pL: f(P.pR), pR: f(P.pL), side: -(P.side || 0), twist: -(P.twist || 0), head: [P.head[0], -P.head[1], -P.head[2]], look: P.look && [-P.look[0], P.look[1]] }; }

/* exShift(lt, at, a, b, dur): change expression a -> b around `at`. Numbers (brows, lids, mouth width) tween over dur in
   5 steps; the eye/mouth SHAPE swaps halfway, hidden under a 2-frame blink when the eye shape differs. */
export function exShift(lt, at, a, b, dur = .22) { const u = (lt - at) / dur; if (u <= 0) return { ex: a }; if (u >= 1) return { ex: b };
  const q = Math.round(u * 5) / 5; const A = exOf(a), B = exOf(b); const blink = A.eyes !== B.eyes && Math.abs(u - .5) < .3;
  return { ex: q <= 0 ? a : q >= 1 ? b : `${a}>${b}@${q}`, ...(blink ? { blink: true } : {}) }; }

/* gaze(lt, mode, seed): eye direction [x, y] (-1..1, y + = down) moving in SACCADES: a fast 2-frame jump, then a hold.
   modes: idle (small darts near the partner), think (up and to the side, long holds), avoid (looks away down, glances
   back briefly = guilt / lying), shifty (fast left-right = nervous / scheming), down (shame, sadness), stare (no darts =
   threat, shock, love), search (wide sweeps = looking for something), up (hope, prayer, remembering). */
export function gaze(lt, mode = 'idle', seed = 0, base = [0, 0]) {
  const cfg = { idle: [.9, 1.6, .25, .15, [0, 0]], think: [1.4, 2.4, .25, .15, [.6, -.75]], avoid: [.9, 1.8, .3, .2, [-.7, .55]], shifty: [.25, .5, .9, .1, [0, .05]],
    down: [1.6, 2.6, .2, .1, [0, .8]], stare: [9, 9, 0, 0, [0, 0]], search: [.5, .9, .95, .35, [0, 0]], up: [1.5, 2.5, .2, .1, [0, -.85]] }[mode] || [1, 2, .2, .1, [0, 0]];
  const [hMin, hMax, ax, ay, c] = cfg; let t0 = 0, i = 0, prev = null, cur = null;
  for (; i < 400; i++) { const h = hMin + (hMax - hMin) * hsh(seed * 13 + i); const tgt = [c[0] + base[0] + ax * (hsh(seed * 7 + i * 3.1) * 2 - 1), c[1] + base[1] + ay * (hsh(seed * 5 + i * 1.7) * 2 - 1)];
    if (mode === 'avoid' && i % 3 === 2) { tgt[0] = base[0]; tgt[1] = base[1]; } // the brief glance back
    prev = cur || tgt; cur = tgt; if (lt < t0 + h) break; t0 += h; }
  const k = sm((lt - t0) / .07); return lerpA(prev, cur, k).map((v) => cl(v, -1, 1)); }

/* perform(lt, beats, o): body-language timeline. beats = [[t, 'poseName', { ex, look, dur, lead, mirror }], ...]
   Each change: a small anticipation (opposite dip), then the parts arrive in order with overshoot + settle:
   lead 'eyes' (a REACTION: eyes -> head -> torso -> hands; default) or lead 'body' (a deliberate ACTION: hips/torso ->
   hands -> head). Between changes the body keeps a moving hold (breath + weight shift) unless the pose is 'still'.
   Returns pose fields to spread into put()/pose(); add talk/p/ry yourself. */
export function perform(lt, beats, o = {}) {
  const get = (b) => { let P = typeof b[1] === 'string' ? POSES[b[1]] || POSES.neutral : P_(b[1]); if (b[2]?.mirror || o.mirror) P = mirror(P); return { ...P, ...(b[2] || {}) }; };
  let i = 0; while (i + 1 < beats.length && lt >= beats[i + 1][0]) i++;
  const B = get(beats[i]), A = i > 0 ? get(beats[i - 1]) : B, t0 = beats[i][0], dur = beats[i][2]?.dur ?? o.dur ?? .5, u = i > 0 ? (lt - t0) / dur : 1;
  const lead = beats[i][2]?.lead ?? o.lead ?? 'eyes';
  const lag = lead === 'eyes' ? { look: 0, head: .08, torso: .16, hands: .24 } : { torso: 0, hands: .1, head: .2, look: .05 };
  const k = (part) => backOut((u - lag[part]) / (1 - lag[part] * .6), A === B ? 0 : 1.15);
  const ant = i > 0 ? Math.sin(Math.PI * cl(u / .18)) * (1 - cl(u / .18) * .2) * (u < .18 ? 1 : 0) : 0;   // anticipation dip
  const kt = k('torso'), kh = k('hands'), kH = k('head'), kl = sm((u - lag.look) / .12);
  const R = { hL: lerpA(A.hL, B.hL, kh), hR: lerpA(A.hR, B.hR, kh), pL: lerpA(A.pL, B.pL, sm(u)), pR: lerpA(A.pR, B.pR, sm(u)),
    lean: A.lean + (B.lean - A.lean) * kt - Math.sign(B.lean - A.lean || 1) * 3 * ant, side: A.side + (B.side - A.side) * kt, twist: A.twist + (B.twist - A.twist) * kt,
    hipY: A.hipY + (B.hipY - A.hipY) * kt - .015 * ant, head: lerpA(A.head, B.head, kH) };
  // expression: changes with the eyes (first), hidden under a blink
  const ex = exShift(lt, t0 + (lead === 'eyes' ? 0 : .12), A.ex, B.ex); Object.assign(R, ex);
  const lA = A.look || [0, 0], lB = B.look || [0, 0]; R.look = lerpA(lA, lB, kl);
  if (B.gaze) { const g = gaze(lt, B.gaze, o.seed || 0, R.look); R.look = g; }
  if (!B.still && !o.still && u >= 1) { const s = o.seed || 0; R.side += 1.4 * Math.sin(lt * .9 + s); R.twist += 1.6 * Math.sin(lt * .45 + s * 2); R.head = [R.head[0] + 1.2 * Math.sin(lt * 1.3 + s), R.head[1] + 2.4 * Math.sin(lt * .9 + s - .6), R.head[2]]; }
  if (B.still) R.still = true;
  if (B.ex === 'rage' || B.shake) { const tr = .006 * sm(u); R.hL = R.hL.map((v, j) => v + tr * Math.sin(lt * 61 + j)); R.hR = R.hR.map((v, j) => v + tr * Math.sin(lt * 57 + j * 2)); } // trembling fists
  return R;
}

/* SITUATION -> acting cheat sheet (pick the beat, not just the emotion word). */
export const SITUATIONS = {
  'receives bad news': ['frozen', 'realize', 'slump'], 'caught lying': ['gasp', 'ashamed'], 'threatens someone': ['leanIn', 'menace'],
  'confronted, stays cool': ['handsBehind', 'coldStare'], 'confronted, scared': ['recoil', 'defend'], 'figures it out': ['thinking', 'realize', 'point'],
  'wins': ['fistPump', 'cheer'], 'mocks': ['armsCrossed', 'laugh'], 'begs': ['offer', 'heartbreak'], 'waits nervously': ['anxious'],
  'plans a scheme': ['chinRub', 'whisper'], 'gives up': ['exhausted', 'slump'], 'explains': ['explain'], 'refuses': ['stopHand', 'armsCrossed'],
};

// v7.5 walkAlong: walk phase from the DISTANCE actually travelled (not from time), so feet never skate when the
// character speeds up, slows down or stops. path(t) -> [x, z] world position of the character at shot time t
// (the same function the shot uses for p). s = character scale (spec.s), stride as in walk(), LK = leg factor (chars.js LK).
// One walk cycle (2 steps) covers 4 * stride * LK * s of ground. Stops cleanly: no distance, no stepping.
//   const path = (t) => [lerp(-2, 1, ease(t / 3)), 0]; put(C, SET, { p: [...], ...walkAlong(lt, path, { s: .6 }) })
// v7.5 sitMove: a real sit-down / stand-up (study: animator's survival kit + live-action ref).
//  DOWN: glance/anticipation rise -> hips go BACK and down while the torso leans forward (~28 deg, counterweight)
//        -> last 20% drops faster (gravity) -> contact squash -> torso settles back past upright, then rests.
//  UP:   feet planted, torso leans forward until the nose is over the toes (weight over the feet) -> hands push on the
//        thighs -> hips rise (ease-out) while the torso straightens LAST -> small overshoot on top.
//  Use with p ON THE FLOOR in front of the seat (the hips land .47*s behind p); seat = seat height in world units.
//  put(C, SET, { p: [x, 0, z], ry, ...sitMove(lt, 1.2, 1.1, 'down', { seat: .45 }) })
export function sitMove(lt, at, dur = 1.1, dir = 'down', o = {}) {
  const u = cl((lt - at) / dur), seat = o.seat ?? .45, R = { seat };
  if (dir === 'down') {
    const d = cl((u - .12) / .68), dk = d < .75 ? sm(d / .75) * .7 : .7 + .3 * Math.pow((d - .75) / .25, 1.6);    // descend, faster at the end
    R.sitK = u < .12 ? 0 : dk; R.hipY = u < .12 ? .015 * Math.sin(Math.PI * u / .12) : 0;                         // anticipation: a small rise
    const lean = 28 * Math.sin(Math.PI * Math.min(1, d * 1.05)) * (d < 1 ? 1 : 0), st = cl((u - .8) / .2);
    R.lean = d < 1 ? lean : -5 * Math.sin(Math.PI * st) * (1 - st * .4);                                            // settle back past upright
    R.squash = u >= .8 ? .12 * Math.exp(-st * 6) * Math.cos(st * 9) : 0;
    if (o.hands !== false && d > .2 && d < 1) { const hk = Math.sin(Math.PI * cl((d - .2) / .8)); R.hL = [-.24, .3 + .05 * hk, .1 + .18 * hk]; R.hR = [.24, .3 + .05 * hk, .1 + .18 * hk]; }
  } else {
    const a = cl(u / .35), r = cl((u - .3) / .55), st = cl((u - .85) / .15);
    R.sitK = 1 - (1 - Math.pow(1 - r, 2.2)); R.lean = 32 * sm(a) * (1 - sm(cl((r - .25) / .75))) - 3 * Math.sin(Math.PI * st);  // torso straightens last
    R.hipY = .02 * Math.sin(Math.PI * st);                                                                          // overshoot on top
    if (o.hands !== false && u > .15 && r < .7) { const hk = Math.sin(Math.PI * cl((u - .15) / .55)); R.hL = [-.2, .28, .22 * hk + .08]; R.hR = [.2, .28, .22 * hk + .08]; } // push on the thighs
  }
  return R;
}

export function walkAlong(t, path, o = {}) {
  const st = (o.stride ?? .22), LK = o.LK ?? 1, s = o.s ?? .6, t0 = o.t0 ?? 0, vF = o.vFull ?? .6, N = Math.max(8, Math.ceil((t - t0) * 60));
  const kAt = (v) => Math.max(.25, Math.min(1, v / vF));                     // stride shrinks as he slows to a stop
  let ph = 0, k = 1, vs = vF, [px, pz] = path(t0); const dt = (t - t0) / N;
  for (let i = 1; i <= N; i++) { const [x, z] = path(t0 + dt * i), dd = Math.hypot(x - px, z - pz); vs += dt > 0 ? (dd / dt - vs) * Math.min(1, dt / .15) : 0; k = kAt(vs);   // v7.5 stride follows a smoothed speed (no stride pop on a sudden stop)
    ph += Math.PI * dd / (2 * st * k * LK * s); px = x; pz = z; }               // phase advances by ground covered / step length
  if (globalThis.STEPLOG && !o.nolog && t - t0 > 1 / 30) {                                  // v7.5 footstep log (render.js steps): a heel strike = ph crosses k*PI
    const prev = walkAlong(t - 1 / 30, path, { ...o, nolog: true }).walk.ph; if (Math.floor(ph / Math.PI) > Math.floor(prev / Math.PI))
      globalThis.STEPLOG.push({ t: globalThis.FRAME_T ?? t, id: o.id || '', foot: Math.floor(ph / Math.PI) % 2 ? 'L' : 'R', x: path(t)[0], z: path(t)[1], k: +k.toFixed(2) }); }
  // v7.5 inertia: the upper body follows the speed through an under-damped spring -> leans into the walk, overshoots
  // forward when he stops, then rocks back to upright. Feet close (stride -> 0) over .3 s after he stops.
  let x = 0, xv = 0, ts = 0; const W0 = 9, Z = .45, h = 1 / 60, ta = Math.max(t0, t - 1.2); let [qx, qz] = path(ta);
  for (let tt = ta + h; tt <= t + 1e-6; tt += h) { const [nx, nz] = path(tt), v = Math.hypot(nx - qx, nz - qz) / h; qx = nx; qz = nz;
    xv += (W0 * W0 * (v - x) - 2 * Z * W0 * xv) * h; x += xv * h; ts = v < .05 ? ts + h : 0; }
  const vN = Math.hypot(...[0, 1].map(i => path(t)[i] - path(t - h)[i])) / h, lean = Math.max(-8, Math.min(10, 4 * Math.min(1, vN / vF) + (x - vN) * 7));
  return { walk: { ph, stride: st * k * Math.max(0, 1 - ts / .3) }, lean: (o.lean ?? 0) + lean };
}

// ================= v7.5 camera moves studied from Higgsfield presets (pure math; feed camX(pos, look, pos, look, 0, fov)) =================
// dollyZoom (vertigo): the subject keeps its size while the background stretches/compresses. Shock, realisation, dread.
//   dir 'in'  = dolly IN + fov WIDENS (background rushes away);  'out' = dolly OUT + fov narrows (background looms).
//   subj = [x,y,z] look point, from = [x,y,z] start camera position, fov0 -> fov1 (deg). Returns { pos, look, fov }.
export function dollyZoom(lt, at, dur, subj, from, fov0 = 40, fov1 = 70) {
  const u = sm((lt - at) / dur), fov = fov0 + (fov1 - fov0) * u, d0 = Math.hypot(from[0] - subj[0], from[1] - subj[1], from[2] - subj[2]);
  const d = d0 * Math.tan(fov0 * Math.PI / 360) / Math.tan(fov * Math.PI / 360), k = d / d0;
  return { pos: subj.map((s, i) => s + (from[i] - s) * k), look: subj, fov };
}
// arcCam (orbit / lazy susan / 180 reveal): circle the subject at radius r, height h, from angle a0 to a1 (deg, 0 = +z side).
// Ease in-out; ease = false for a constant-speed orbit (bullet-time style when the action is frozen / slowed).
export function arcCam(lt, at, dur, subj, r, h, a0, a1, ease = true) {
  const u = ease ? sm((lt - at) / dur) : cl((lt - at) / dur), a = (a0 + (a1 - a0) * u) * Math.PI / 180;
  return { pos: [subj[0] + Math.sin(a) * r, subj[1] + h, subj[2] + Math.cos(a) * r], look: subj };
}
// snorricam: the camera rides on the character (chest rig) facing him; the world sways behind. Panic, drunk, running scared.
//   C = the character (its world position + ry), dist in front, height. bob adds the step jolt (pass walk phase).
export function snorriCam(p, ry, dist = .9, h = 1.25, ph = 0) {
  const a = ry * Math.PI / 180, j = .02 * Math.abs(Math.sin(ph));
  return { pos: [p[0] + Math.sin(a) * dist, p[1] + h + j, p[2] + Math.cos(a) * dist], look: [p[0], p[1] + h * .95 + j, p[2]] };
}
// throughCam: fly THROUGH an opening (window, bars, door gap) from one space into the next: links two nearby places
// without a cut (rule 2). Quadratic path from A through the gap G to B, slow-fast-slow; look leads the path.
export function throughCam(lt, at, dur, A, G, B, lookB) {
  const u = sm((lt - at) / dur), q = (t) => [0, 1, 2].map(i => (1 - t) * (1 - t) * A[i] + 2 * (1 - t) * t * (2 * G[i] - (A[i] + B[i]) / 2) + t * t * B[i]);
  const p = q(u), n = q(Math.min(1, u + .08)); return { pos: p, look: u > .85 ? lookB : n.map((v, i) => v + (n[i] - p[i]) * 6) };
}
// otsPair (over-the-shoulder shot / reverse shot, 180-degree rule kept): A and B = [x,y,z] floor positions of the two speakers.
// Returns { a: cam over A's shoulder looking at B, b: the reverse over B's shoulder looking at A }. Both cameras stay on the SAME
// side of the A-B line (side = +1 / -1 picks which side), so eyelines match and nobody jumps across the screen.
// The near shoulder/head fills one edge, dark and out of focus (set DOF focus on the far face). h = eye height, back/off in metres.
export function otsPair(A, B, side = 1, h = 1.35, back = .7, off = .42, up = .12) {
  const dx = B[0] - A[0], dz = B[2] - A[2], L = Math.hypot(dx, dz) || 1, fx = dx / L, fz = dz / L, px = -fz * side, pz = fx * side;
  const cam = (P, f, look) => ({ pos: [P[0] - f[0] * back + px * off, P[1] + h + up, P[2] - f[1] * back + pz * off], look: [look[0], look[1] + h * .97, look[2]] });
  return { a: cam(A, [fx, fz], B), b: cam(B, [-fx, -fz], A) };
}

// ================= v7.5 close-up acting beats (from the drama-short study: faces carry the scene in CU / ECU) =================
// sob(lt, k, o): crying that MOVES (refs: quivering open mouth, wet eyes, breath hitches), not a frozen sad face.
//  - lip quiver: the mouth flicks between shapes 6-8 times a second (o.talk wins if the character is speaking)
//  - sob hitches: irregular sharp inhales (chest jerks up, head tips back) every .7-1.3 s, then a shaky release
//  - head tremor: a small fast shake; tears rise with k. Spread into put(): { ...base, ...sob(lt, .8) }
export function sob(lt, k = 1, o = {}) {
  const s = o.seed || 0, h = (x) => { const v = Math.sin(x * 12.9898 + s * 78.233) * 43758.5453; return v - Math.floor(v); };
  let t0 = 0, i = 0; while (t0 + .7 + .6 * h(i) <= lt && i < 999) { t0 += .7 + .6 * h(i); i++; }
  const u = lt - t0, hitch = u < .12 ? Math.sin(Math.PI * u / .12) : 0, rel = u >= .12 && u < .5 ? Math.exp(-(u - .12) * 8) : 0;
  const q = Math.floor(lt * 14 + s) % 4, mouth = ['a', 'E', 'a', 'M'][q];
  return { ex: o.ex || 'despair', tears: Math.min(1, .35 + .65 * k), talk: o.talk ?? mouth, inhale: .9 * hitch * k,
    head: [-(6 * hitch - 2 * rel) * k + (o.head ? o.head[0] : 0), (o.head ? o.head[1] : 0) + 1.2 * k * Math.sin(lt * 31 + s), (o.head ? o.head[2] : 0) + 1.5 * k * Math.sin(lt * 23 + s * 2)],
    hipY: .012 * hitch * k, lean: (o.lean || 0) + 3 * k - 4 * hitch * k };
}
// listen(lt, mood, o): the REACTION shot of the one who is not talking (refs cut to the listener as often as the speaker).
//  mood 'hurt' | 'angry' | 'doubt' | 'shock': a held expression plus slow involuntary motion (brow knit, a swallow, a small
//  head shake or nod, eyes dropping) so a 1-2 s close-up is never a still frame.
export function listen(lt, mood = 'hurt', o = {}) {
  const s = o.seed || 0, M = { hurt: ['hurt', 'despair', -1], angry: ['annoyedHard', 'coldFury', 0], doubt: ['skeptical', 'suspicious', 1], shock: ['surprised', 'dread', 0] }[mood] || ['stoic', 'stoic', 0];
  const ex = exShift(lt, o.turnAt ?? .9, M[0], M[1]), shake = M[2] < 0 ? 0 : 1.6 * Math.sin(lt * 5.5 + s) * Math.exp(-((lt - 1.1) ** 2) * 6);
  const drop = M[2] < 0 ? [ .3, .5 * sm((lt - .6) / .5)] : [0, 0];                                            // hurt: the eyes fall
  return { ...ex, head: [(M[2] > 0 ? 2.5 * Math.sin(lt * 2.2 + s) : 1.5 * sm(lt / 1.2)), shake * 3, (M[2] > 0 ? 4 : 0)], look: drop, inhale: mood === 'shock' ? .8 * Math.exp(-((lt - .25) ** 2) * 30) : 0 };
}
