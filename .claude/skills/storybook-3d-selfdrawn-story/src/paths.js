// paths.js (v8.2, M4 2026-11-24): motion of thrown / dropped things from physics, not hand-keyed curves (idea: mromidev
// claude-blender-skills 01_swing_sim.py: real gravity, real speed; written new, plain arrays, no three.js, pure functions of time).
//   const P = throwPath({ from: [0, 1.5, -11.6], to: [.1, 1.5, -5.94], speed: 14, t0: 40.24 });
//   const s = P.at(t)  -> { pos, vel, speed, spin, flying, stuck }   P.hit = { t, pos, speed }  (sound / kick / dust on P.hit.t)
// throwPath : a ballistic arc from `from` that reaches `to` after |to - from| / speed seconds under gravity (a knife, a stone, a bag)
// dropPath  : something let go at `from` falls to the floor y = floor and bounces with `bounce` (paper, a hat, a coin)
const G = 9.81;
const sub = (a, b) => a.map((v, i) => v - b[i]), len = (a) => Math.hypot(...a);
export function throwPath({ from, to, speed = 12, t0 = 0, gravity = G, spin = 18, stick = true }) {
  const d = sub(to, from), T = Math.max(.05, len(d) / speed);
  const v0 = [d[0] / T, d[1] / T + .5 * gravity * T, d[2] / T];                     // lands exactly on `to` at t0 + T
  const posAt = (u) => [from[0] + v0[0] * u, from[1] + v0[1] * u - .5 * gravity * u * u, from[2] + v0[2] * u];
  const velAt = (u) => [v0[0], v0[1] - gravity * u, v0[2]];
  const hit = { t: t0 + T, pos: [...to], speed: len(velAt(T)) };
  return { T, hit,
    at(t) {
      const u = t - t0;
      if (u <= 0) return { pos: [...from], vel: [0, 0, 0], speed: 0, spin: 0, flying: false, stuck: false };
      if (u >= T) return { pos: [...to], vel: [0, 0, 0], speed: 0, spin: stick ? 0 : spin * T, flying: false, stuck: stick, since: u - T };
      const v = velAt(u); return { pos: posAt(u), vel: v, speed: len(v), spin: spin * u, flying: true, stuck: false };
    } };
}
export function dropPath({ from, floor = 0, t0 = 0, gravity = G, bounce = .25, drift = [0, 0, 0], flutter = 0 }) {
  // flutter > 0 (paper): air drag slows the fall and adds a side-to-side swing
  const g = gravity / (1 + flutter * 6), h = from[1] - floor, T1 = Math.sqrt(2 * Math.max(h, 0) / g), v1 = g * T1;
  const T2 = 2 * v1 * bounce / g;                                                // one bounce, then rest
  const hit = { t: t0 + T1, pos: [from[0] + drift[0] * T1, floor, from[2] + drift[2] * T1], speed: v1 };
  return { T: T1 + T2, hit,
    at(t) {
      const u = Math.max(0, t - t0), sw = flutter ? Math.sin(u * 5) * .12 * flutter * Math.min(1, u * 2) * (u < T1 ? 1 : 0) : 0;
      let y; if (u < T1) y = from[1] - .5 * g * u * u; else if (u < T1 + T2) { const w = u - T1; y = floor + v1 * bounce * w - .5 * g * w * w; } else y = floor;
      const k = Math.min(u, T1 + T2);
      return { pos: [from[0] + drift[0] * k + sw, Math.max(floor, y), from[2] + drift[2] * k], speed: u < T1 ? g * u : 0, flying: u < T1 + T2, landed: u >= T1 };
    } };
}
