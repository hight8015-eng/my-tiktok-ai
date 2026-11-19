// engine.js (v2): renderer, flat toon materials, ink-line post pass (normal/depth edges), DOF + colour grade, helpers. 1080x1920 portrait.
import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export { THREE, RoundedBoxGeometry };
export const W = 1080, H = 1920;
export const glc = document.getElementById('gl');
export const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
export const INK = [0.012, 0.007, 0.016]; // linear (= sRGB #1c1420)
export const outline = new OutlineEffect(renderer, { defaultThickness: 0.011, defaultColor: INK, defaultAlpha: 1, defaultKeepAlive: true });
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, 3000);
scene.add(camera);

// ---------- math helpers ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const eIO = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const eOut = t => 1 - Math.pow(1 - clamp(t), 3);
export const eIn = t => Math.pow(clamp(t), 3);
export const eSine = t => .5 - .5 * Math.cos(Math.PI * clamp(t));
export const D2R = Math.PI / 180;
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const P = new Uint8Array(512); { const r = rng(7); const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0; [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) P[i] = p[i & 255]; }
export function noise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); const a = (P[i & 255] / 255) * 2 - 1, b = (P[(i + 1) & 255] / 255) * 2 - 1; return a + (b - a) * u; }
export function noise3(x, y, z) { // cheap value noise 3D
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const h = (a, b, c) => P[(P[(P[a & 255] + b) & 255] + c) & 255] / 255 * 2 - 1;
  const l = (a, b, t) => a + (b - a) * t;
  return l(l(l(h(xi, yi, zi), h(xi + 1, yi, zi), u), l(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u), v), l(l(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u), l(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u), v), w);
}

// ---------- toon materials ----------
function gradTex(levels) { const d = new Uint8Array(levels.length * 4); levels.forEach((v, i) => { d.set([v, v, v, 255], i * 4); }); const t = new THREE.DataTexture(d, levels.length, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; }
export const GRAD = gradTex([178, 232, 255]);
export const GRAD_FLAT = gradTex([222, 255]), GRAD_2 = gradTex([196, 255]);
const MC = new Map();
export function toon(color, o = {}) {
  const key = JSON.stringify([color, { ...o, grad: o.grad ? o.grad.uuid : 0 }]);
  if (MC.has(key) && !o.unique) return MC.get(key);
  const m = new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap: o.grad || GRAD, ...(o.map ? { map: o.map } : {}), ...(o.emissive ? { emissive: new THREE.Color(o.emissive), emissiveIntensity: o.ei ?? 1 } : {}), transparent: !!o.transparent, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide, vertexColors: !!o.vc, depthWrite: o.depthWrite ?? true });
  m.userData.outlineParameters = { thickness: o.ol || 0.011, color: INK, alpha: 1, visible: !!o.ol, keepAlive: true }; // hull outline only where asked (characters); props get screen-space ink
  if (o.noInk) m.userData.noInk = true;
  if (!o.unique) MC.set(key, m);
  return m;
}
export function basic(color, o = {}) {
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: !!o.transparent, opacity: o.opacity ?? 1, map: o.map || null, side: o.side ?? THREE.FrontSide, depthWrite: o.depthWrite ?? true, fog: o.fog ?? true, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, alphaTest: o.alphaTest ?? 0 });
  m.userData.outlineParameters = { visible: !!o.ol, thickness: o.ol || 0.011, color: INK, alpha: 1, keepAlive: true };
  if (o.noInk) m.userData.noInk = true;
  return m;
}
export function noOutline(m) { m.userData.outlineParameters = { visible: false, keepAlive: true }; return m; }

// ---------- canvas textures ----------
export function canvasTex(w, h, draw, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...o.repeat); }
  t.userData.canvas = c; t.userData.ctx = x; return t;
}

// ---------- mesh helpers ----------
export function mesh(geo, mat, o = {}) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = o.cast ?? true; m.receiveShadow = o.recv ?? true;
  if (o.p) m.position.set(...o.p); if (o.r) m.rotation.set(...o.r.map(v => v * D2R)); if (o.s) (typeof o.s === 'number' ? m.scale.setScalar(o.s) : m.scale.set(...o.s));
  if (o.parent) o.parent.add(m); return m;
}
export const rbox = (w, h, d) => new THREE.BoxGeometry(w, h, d); // v2: crisp boxes so the ink pass draws their edges
export function group(o = {}) { const g = new THREE.Group(); if (o.p) g.position.set(...o.p); if (o.r) g.rotation.set(...o.r.map(v => v * D2R)); if (o.parent) o.parent.add(g); return g; }
export function cylBetween(a, b, r, mat, parent, seg = 6) { // thin cylinder from a to b
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
  const m = mesh(new THREE.CylinderGeometry(r, r, len, seg), mat, { cast: false }); m.position.copy(A).add(B).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); if (parent) parent.add(m); return m;
}
export const fontsReady = Promise.all([
  new FontFace('Prompt', 'url(fonts/Prompt-Bold.ttf)', { weight: '700' }).load(),
  new FontFace('Prompt', 'url(fonts/Prompt-SemiBold.ttf)', { weight: '600' }).load(),
  new FontFace('Itim', 'url(fonts/Itim-Regular.ttf)').load(),
  new FontFace('Mali', 'url(fonts/Mali-Bold.ttf)', { weight: '700' }).load(),
]).then(fs => fs.forEach(f => document.fonts.add(f)));

// ---------- v2 post pipeline: color RT -> ink lines (normal + depth edges) -> DOF + grade -> canvas ----------
export const POST = { mblur: [0, 0], focus: 4, dof: 0, inkFade: [80, 500], sat: 1.22, con: 1.05, lift: 1.06, vig: .22, leak: .5, leakPh: 0, thick: 4.6, thin: 1.8 };
const crt = new THREE.WebGLRenderTarget(W, H, { samples: 4 }); crt.texture.colorSpace = THREE.SRGBColorSpace;
const nrt = new THREE.WebGLRenderTarget(W, H, { depthTexture: new THREE.DepthTexture(W, H) });
const irt = new THREE.WebGLRenderTarget(W, H); irt.texture.colorSpace = THREE.SRGBColorSpace;
const nmat = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quadScene = new THREE.Scene();
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); quad.frustumCulled = false; quadScene.add(quad);
const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
const COMMON = `uniform sampler2D tDep; uniform float near, far; float LD(vec2 uv){ float d = texture2D(tDep, uv).x; return (near * far) / (far - d * (far - near)); }`;
const inkMat = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false,
  uniforms: { tCol: { value: crt.texture }, tNrm: { value: nrt.texture }, tDep: { value: nrt.depthTexture }, near: { value: .05 }, far: { value: 3000 }, px: { value: new THREE.Vector2(1 / W, 1 / H) }, inkC: { value: new THREE.Color().setRGB(...INK) }, thick: { value: 3 }, thin: { value: 1.5 }, fade: { value: new THREE.Vector2(60, 400) } },
  vertexShader: VS, fragmentShader: COMMON + `
  uniform sampler2D tCol, tNrm; uniform vec2 px, fade; uniform vec3 inkC; uniform float thick, thin; varying vec2 vUv;
  void main(){
    vec3 c = texture2D(tCol, vUv).rgb; vec4 n4 = texture2D(tNrm, vUv); vec3 n0 = n4.xyz * 2. - 1.; float z0 = LD(vUv); float e = 0.; float zn = z0;
    for (int i = 0; i < 8; i++) { float a = float(i) * 0.785398; vec2 o = vec2(cos(a), sin(a)) * thin * px; vec4 m = texture2D(tNrm, vUv + o); float z = LD(vUv + o);
      if (m.a > .5 && n4.a > .5) { e = max(e, smoothstep(.22, .45, 1. - dot(n0, m.xyz * 2. - 1.))); }
      float dz = (z0 - z) / z; if (m.a > .5) { float k = smoothstep(.05, .1, dz); if (k > e) { e = k; zn = min(zn, z); } } }
    for (int i = 0; i < 12; i++) { float a = float(i) * 0.523599; float r = (i % 2 == 0) ? 1. : .62; vec2 o = vec2(cos(a), sin(a)) * thick * r * px; float z = LD(vUv + o); float al = texture2D(tNrm, vUv + o).a;
      if (al > .5) { float k = smoothstep(.1, .22, (z0 - z) / z); if (k > e) { e = k; zn = min(zn, z); } } }
    e *= 1. - smoothstep(fade.x, fade.y, zn);
    gl_FragColor = vec4(mix(c, inkC, e * .94), 1.);
  }` });
const finMat = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false,
  uniforms: { tCol: { value: irt.texture }, tDep: { value: nrt.depthTexture }, near: { value: .05 }, far: { value: 3000 }, px: { value: new THREE.Vector2(1 / W, 1 / H) }, focus: { value: 4 }, dof: { value: 0 }, sat: { value: 1.2 }, con: { value: 1.05 }, lift: { value: 1.06 }, vig: { value: .2 }, leak: { value: .5 }, leakPh: { value: 0 }, mblur: { value: new THREE.Vector2() } },
  vertexShader: VS, fragmentShader: COMMON + `
  uniform sampler2D tCol; uniform vec2 px, mblur; uniform float focus, dof, sat, con, lift, vig, leak, leakPh; varying vec2 vUv;
  vec3 toS(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
  void main(){
    vec3 c = texture2D(tCol, vUv).rgb;
    if (length(mblur) > 1.) { vec3 acc = vec3(0.); for (int i = 0; i < 14; i++) { float f = float(i) / 13. - .5; acc += texture2D(tCol, vUv + mblur * f * px).rgb; } c = acc / 14.; }
    else if (dof > 0.) { float z = LD(vUv); float coc = clamp((z - focus) / max(z, .001) * 1.6, 0., 1.) * dof * 9.;
      if (coc > .6) { vec3 acc = c; float w = 1.; for (int i = 0; i < 16; i++) { float a = float(i) * 2.39996; float r = sqrt((float(i) + .5) / 16.); vec2 uv = vUv + vec2(cos(a), sin(a)) * r * coc * px;
          float zt = LD(uv); float wt = zt > focus * .9 ? 1. : .15; acc += texture2D(tCol, uv).rgb * wt; w += wt; } c = acc / w; } }
    vec3 s = toS(clamp(c, 0., 1.));
    s *= lift; float l = dot(s, vec3(.299, .587, .114)); s = mix(vec3(l), s, sat); s = (s - .5) * con + .5;
    vec2 q = vUv - .5; float v = 1. - vig * smoothstep(.25, .85, length(q * vec2(1., 1.3)));
    s *= v;
    vec2 L1 = vec2(1.05 + .05 * sin(leakPh), 1.02), L2 = vec2(-.08, -.04 + .04 * cos(leakPh * .7));
    s += leak * (vec3(.55, .16, .75) * pow(max(0., 1. - length((vUv - L1) * vec2(1.4, 1.)) / .62), 2.) * .45 + vec3(.95, .5, .2) * pow(max(0., 1. - length((vUv - L2) * vec2(1.4, 1.)) / .55), 2.) * .25) * (1. - s * .5);
    gl_FragColor = vec4(clamp(s, 0., 1.), 1.);
  }` });
const _hid = [], _sw = [];
export function render() {
  const P = POST; camera.updateMatrixWorld();
  // 1) color (characters get the hull outline from OutlineEffect)
  renderer.setRenderTarget(crt); outline.render(scene, camera);
  // 2) normals + depth for the ink pass, without sky/sea/particles/sprites
  _hid.length = 0; scene.traverseVisible(o => { if (o.isPoints || o.isSprite || o.userData.noInk || (o.material && o.material.userData && o.material.userData.noInk)) _hid.push(o); });
  _hid.forEach(o => { o.visible = false; }); renderer.setClearColor(0x000000, 0);
  // v3: per-mesh swap (sprite planes write an alpha-cut flag .4 so the ink pass ignores their silhouettes)
  _sw.length = 0; scene.traverseVisible(o => { if (o.isMesh) { _sw.push(o, o.material); o.material = o.userData.sprN || nmat; } });
  renderer.setRenderTarget(nrt); renderer.clear(); renderer.render(scene, camera);
  for (let i = 0; i < _sw.length; i += 2) _sw[i].material = _sw[i + 1]; _hid.forEach(o => { o.visible = true; });
  // 3) ink
  for (const m of [inkMat, finMat]) { m.uniforms.near.value = camera.near; m.uniforms.far.value = camera.far; }
  inkMat.uniforms.thick.value = P.thick; inkMat.uniforms.thin.value = P.thin; inkMat.uniforms.fade.value.set(...P.inkFade);
  quad.material = inkMat; renderer.setRenderTarget(irt); renderer.render(quadScene, quadCam);
  // 4) DOF + grade to canvas
  const u = finMat.uniforms; u.focus.value = P.focus; u.dof.value = P.dof; u.sat.value = P.sat; u.con.value = P.con; u.lift.value = P.lift; u.vig.value = P.vig; u.leak.value = P.leak; u.leakPh.value = P.leakPh; u.mblur.value.set(P.mblur[0], P.mblur[1]);
  quad.material = finMat; renderer.setRenderTarget(null); renderer.render(quadScene, quadCam);
}
