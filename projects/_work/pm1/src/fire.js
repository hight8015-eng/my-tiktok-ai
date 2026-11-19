// fire.js (v6.1): a real-looking cartoon flame instead of stacked cones.
// Recipe (stylized-fire tutorials: Effekseer toon flame, Duck in Town, RiME-style Shader Graph) + the user's study clips
// (FiryTwig fire principles): a camera-facing quad; rising coordinate; domain-warped fbm noise scrolling UP (fire rises);
// distortion grows with height (the tip whips, the base is calm); a travelling sine x = sin(y - t) for the sway; the
// noise carves tongues out of a teardrop mask; colour in soft-edged bands white -> yellow -> orange -> red; hotter parts
// rise faster (two noise layers at different speeds); never pulses in a loop (continuous noise, no repeating cycle).
// Embers: a few sparks rise, drift on their own sine, shrink and fade (no two in sync). All a pure function of time t.
import { THREE, canvasTex } from './engine.js';
const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const FS = `uniform float uT, uK, uSeed, uLean, uOp; uniform vec3 uC0, uC1, uC2, uC3; varying vec2 vUv;
  float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
  void main(){
    vec2 p = vec2(vUv.x - .5, vUv.y); float h = p.y, t = uT + uSeed * 13.7;
    float n1 = fbm(vec2(p.x * 3.2 + uSeed, h * 2.2 - t * 1.6));             // slow outer layer
    float n2 = fbm(vec2(p.x * 6.5 - uSeed, h * 4.5 - t * 2.9));             // fast hot layer
    float sway = sin(h * 6.5 - t * 5.3 + uSeed) * .055 * h + sin(h * 11. - t * 8.7) * .02 * h;
    p.x += (n1 - .5) * .42 * h + sway - uLean * h * h * .35;                 // distortion grows with height
    float w = mix(.44, .03, pow(clamp(h / max(uK, .05), 0., 1.), 1.25)) * (1. + .18 * sin(h * 9. - t * 4.3));   /* fuller body, breathing width */       // teardrop: wide round base, thin tip
    float body = 1. - abs(p.x) / w; body *= smoothstep(0., .14, h);           // rounded bottom
    float heat = body - (n2 - .45) * .95 * h - h * .2 / max(uK, .05);   /* more tongues split off */         // tongues break away near the top
    float a = smoothstep(.08, .14, heat);
    vec3 c = mix(uC3, uC2, smoothstep(.16, .22, heat)); c = mix(c, uC1, smoothstep(.34, .40, heat)); c = mix(c, uC0, smoothstep(.56, .62, heat));
    if (a < .01) discard; gl_FragColor = vec4(c * (1.1 + .25 * n2), a * uOp); }`;
const DOT = canvasTex(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
const PAL = { fire: ['#fffbe8', '#ffd84a', '#ff8a1c', '#d8301a'], blue: ['#f0fbff', '#9ae0ff', '#3a8cff', '#2a3ad8'], green: ['#f4ffe8', '#b8ff6a', '#3ad84a', '#1a8a3a'], purple: ['#fff0ff', '#ff9aff', '#b04aff', '#5a1ad8'], red: ['#fff0f0', '#ff9a9a', '#ff2a3a', '#8a0a1a'] };
/* makeFire(parent, { w, h, seed, pal, embers }) -> object with .at(t, k, camera, lean). w/h in metres; k 0..1 grows the flame. */
export function makeFire(par, o = {}) { const g = new THREE.Group(); par.add(g); const w = o.w ?? .3, h = o.h ?? .6, pal = PAL[o.pal || 'fire'];
  const m = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uK: { value: 1 }, uSeed: { value: o.seed ?? 1 }, uLean: { value: 0 }, uOp: { value: 1 }, uC0: { value: new THREE.Color(pal[0]) }, uC1: { value: new THREE.Color(pal[1]) }, uC2: { value: new THREE.Color(pal[2]) }, uC3: { value: new THREE.Color(pal[3]) } },
    vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  m.userData.noInk = true; m.userData.outlineParameters = { visible: false, keepAlive: true };
  const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0); const q = new THREE.Mesh(geo, m); q.userData.noInk = true; q.castShadow = q.receiveShadow = false; q.renderOrder = 6; g.add(q);
  const NE = o.embers ?? 7, ep = new Float32Array(NE * 3), eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ep, 3)); const ec = new Float32Array(NE * 3); eg.setAttribute('color', new THREE.BufferAttribute(ec, 3)); const c1 = new THREE.Color(pal[1]), c2 = new THREE.Color(pal[2]);
  const em = new THREE.PointsMaterial({ size: (o.ember ?? .045), map: DOT, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  em.userData.noInk = true; const E = new THREE.Points(eg, em); E.frustumCulled = false; E.userData.noInk = true; g.add(E);
  const ES = Array.from({ length: NE }, (_, i) => { const r = Math.sin((i + 1) * 91.7 + (o.seed ?? 1) * 7.1) * 43758.5; const f = (x) => x - Math.floor(x); return [f(r), f(r * 1.7), f(r * 2.3), .6 + .8 * f(r * 3.1)]; });
  ALL.push(q);
  return { g, mesh: q, at(t, k = 1, cam = null, lean = 0) { g.visible = k > .01; if (!g.visible) return; m.uniforms.uT.value = t; m.uniforms.uK.value = Math.max(.05, k); m.uniforms.uLean.value = lean;
      q.scale.set(.6 + .4 * k, k, 1);
      for (let i = 0; i < NE; i++) { const [a, b, c, life] = ES[i], u = ((t * (.55 + .5 * b) + a * life) % life) / life;   // each ember on its own clock
        ep[i * 3] = (c - .5) * w * .6 + Math.sin(t * (2 + 2 * b) + i) * .06 * u; ep[i * 3 + 1] = h * k * (.25 + 1.3 * u); ep[i * 3 + 2] = (b - .5) * .1; const fade = Math.sin(Math.PI * Math.min(1, u * 1.2)) * (1 - u); const cc = c1.clone().lerp(c2, u); ec[i * 3] = cc.r * fade; ec[i * 3 + 1] = cc.g * fade; ec[i * 3 + 2] = cc.b * fade; }   /* hot yellow when born, cooler orange, fading out */
      eg.attributes.position.needsUpdate = true; eg.attributes.color.needsUpdate = true; em.opacity = Math.min(1, k * 1.5) * .9; em.size = (o.ember ?? .045) * (1 - .3 * Math.sin(t * 3)); } };
}

const ALL = [], WP = new THREE.Vector3();
/* call once per frame AFTER the camera is placed: every flame stays upright and turns to the camera */
export function faceFires(cam) { for (const q of ALL) { q.getWorldPosition(WP); q.lookAt(cam.position.x, WP.y, cam.position.z); } }
