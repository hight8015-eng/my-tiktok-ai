import { walkAlong, sitMove } from './act.mjs';
const AW = (t) => Math.max(-3.0, 9.5 - Math.max(0, t - 15.0) * 1.45);
let r = []; for (let t = 22.8; t < 25; t += .1) { const W = walkAlong(t, u => [0, AW(u)], { stride: .21, LK: 1.36, s: .8, t0: 14.45 }); r.push(`${t.toFixed(1)}:${W.lean.toFixed(1)}/${W.walk.stride.toFixed(2)}`); } console.log('stop lean/stride', r.join(' '));
const f = (d) => { let r = []; for (let lt = 0; lt <= 1.3; lt += .1) { const R = sitMove(lt, 0, 1.1, d); r.push(`${(R.sitK).toFixed(2)}|${R.lean.toFixed(0)}`); } return r.join(' '); };
console.log('down sitK|lean', f('down')); console.log('up   sitK|lean', f('up'));
