// world.js: sky, sea, light presets, the brig, deck props, rocks, cabin set, small sets.
import { THREE, scene, camera, toon, basic, noOutline, canvasTex, mesh, rbox, group, cylBetween, clamp, lerp, rng, noise3, noise1, D2R } from './engine.js';

// ======================= SKY =======================
const skyU = { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, glow: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, .2, -1) }, glowAmt: { value: 1 } };
const skyMat = new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `uniform vec3 top, mid, hor, glow, sunDir; uniform float glowAmt; varying vec3 vD;
  void main(){ float y = vD.y; vec3 c = mix(hor, mid, smoothstep(-0.02, 0.22, y)); c = mix(c, top, smoothstep(0.22, 0.85, y));
    float g = pow(max(dot(normalize(vD), normalize(sunDir)), 0.0), 6.0); c += glow * g * glowAmt;
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`
});
noOutline(skyMat);
export const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), skyMat); sky.userData.noInk = true; sky.renderOrder = -10; scene.add(sky);
// stars
const starGeo = new THREE.BufferGeometry(); { const r = rng(3), a = []; for (let i = 0; i < 900; i++) { const th = r() * Math.PI * 2, y = .05 + Math.pow(r(), .7) * .95, rr = Math.sqrt(1 - y * y); a.push(Math.cos(th) * rr * 1400, y * 1400, Math.sin(th) * rr * 1400); } starGeo.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); }
const starMat = new THREE.PointsMaterial({ color: 0xfff6e0, size: 2.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
export const stars = new THREE.Points(starGeo, starMat); scene.add(stars);
// moon (phase redrawn on demand)
const moonTex = canvasTex(256, 256, () => { });
let moonPhase = -1;
export function drawMoon(ph) { // ph 0..1 : 0.15 thin crescent .. 0.5 half .. 1 full
  if (Math.abs(ph - moonPhase) < 1e-3) return; moonPhase = ph; const x = moonTex.userData.ctx; x.clearRect(0, 0, 256, 256);
  x.save(); x.beginPath(); x.arc(128, 128, 110, 0, Math.PI * 2); x.clip(); x.fillStyle = '#4b5878'; x.globalAlpha = .35; x.fillRect(0, 0, 256, 256); x.globalAlpha = 1;
  // lit part: circle minus offset circle
  x.fillStyle = '#fff4d6'; x.beginPath(); x.arc(128, 128, 110, 0, Math.PI * 2); x.fill();
  if (ph < .999) { x.globalCompositeOperation = 'destination-out'; const off = (ph) * 2 * 220; x.beginPath(); x.arc(128 - 220 + off * 1.0 - (ph > .5 ? 0 : 0), 128, 112, 0, Math.PI * 2); x.fill(); x.globalCompositeOperation = 'source-over'; }
  x.fillStyle = 'rgba(200,190,170,.35)'; [[100, 90, 16], [150, 150, 22], [120, 170, 10], [165, 95, 9]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); });
  x.restore(); moonTex.needsUpdate = true;
}
drawMoon(1);
const moon = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), basic(0xffffff, { map: moonTex, transparent: true, fog: false, depthWrite: false, noInk: true })); scene.add(moon);
const glowTex = canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
export function glowSprite(color, size, o = {}) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color(color), transparent: true, opacity: o.opacity ?? .8, blending: THREE.AdditiveBlending, depthWrite: false, fog: o.fog ?? false })); s.scale.setScalar(size); return s; }
const moonGlow = glowSprite(0xbcd0ff, 260, { opacity: .5 }); scene.add(moonGlow);
export const skyState = { moonDir: new THREE.Vector3(-.4, .35, -1).normalize(), moonOn: false, sunDir: new THREE.Vector3(0, .1, -1) };
// clouds
const cloudMat = toon(0xffffff, { ol: 0, unique: true }); cloudMat.fog = false; cloudMat.userData.noInk = true;
export const clouds = group({ parent: scene });
{ const r = rng(11); for (let c = 0; c < 14; c++) { const cg = group({ parent: clouds }); const th = r() * Math.PI * 2, R = 700 + r() * 300; cg.position.set(Math.cos(th) * R, 60 + r() * 140, Math.sin(th) * R); cg.lookAt(0, cg.position.y, 0);
  const n = 4 + (r() * 4 | 0); for (let i = 0; i < n; i++) { const m = mesh(new THREE.SphereGeometry(1, 16, 10), cloudMat, { cast: false, recv: false }); const s = 18 + r() * 26; m.scale.set(s * 1.5, s * .7, s); m.position.set((i - n / 2) * 26 + r() * 10, r() * 10, r() * 10); cg.add(m); } } }

// ======================= SEA =======================
export const WAVE = { amp: 1, t: 0 };
export function waveH(x, z, t = WAVE.t) { const a = WAVE.amp; return a * (.22 * Math.sin(x * .21 + z * .05 + t * 1.1) + .14 * Math.sin(-x * .08 + z * .27 + t * 1.6) + .06 * Math.sin(x * .5 + z * .41 + t * 2.3)); }
const seaU = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uT: { value: 0 }, uAmp: { value: 1 }, deep: { value: new THREE.Color() }, shallow: { value: new THREE.Color() }, foam: { value: new THREE.Color(0xffffff) }, glint: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, .3, -1) }, glintAmt: { value: 1 } }]);
const seaMat = new THREE.ShaderMaterial({
  uniforms: seaU, fog: true,
  vertexShader: `#include <fog_pars_vertex>
  uniform float uT, uAmp; varying vec3 vN; varying vec3 vW;
  float wv(vec2 p){ return uAmp*(0.22*sin(p.x*0.21+p.y*0.05+uT*1.1)+0.14*sin(-p.x*0.08+p.y*0.27+uT*1.6)+0.06*sin(p.x*0.5+p.y*0.41+uT*2.3)); }
  void main(){ vec4 wp = modelMatrix*vec4(position,1.0); float h = wv(wp.xz); float e = 0.4; float hx = wv(wp.xz+vec2(e,0.0)); float hz = wv(wp.xz+vec2(0.0,e));
    wp.y += h; vN = normalize(vec3(-(hx-h)/e, 1.0, -(hz-h)/e)); vW = wp.xyz; vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
    #include <fog_vertex>
  }`,
  fragmentShader: `#include <fog_pars_fragment>
  uniform vec3 deep, shallow, foam, glint, sunDir; uniform float glintAmt, uAmp; varying vec3 vN; varying vec3 vW;
  void main(){ vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
    float fr = pow(1.0 - max(dot(n, v), 0.0), 4.0);
    float l = dot(n, normalize(sunDir));
    float band = l > 0.30 ? 1.0 : (l > 0.12 ? 0.55 : 0.15);
    vec3 c = mix(deep, shallow, band * 0.55 + fr * 0.6);
    vec3 r = reflect(-normalize(sunDir), n); float s = pow(max(dot(r, v), 0.0), 30.0);
    c = mix(c, glint, step(0.45, s) * glintAmt);
    float crest = smoothstep(0.36, 0.41, vW.y / max(uAmp, 0.01)); c = mix(c, foam, crest * 0.18);
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }`
});
noOutline(seaMat);
const seaGeo = new THREE.PlaneGeometry(700, 700, 280, 280); seaGeo.rotateX(-Math.PI / 2);
export const sea = new THREE.Mesh(seaGeo, seaMat); sea.receiveShadow = false; seaMat.userData.noInk = true; scene.add(sea);
const farGeo = new THREE.RingGeometry(340, 2600, 64, 1); farGeo.rotateX(-Math.PI / 2);
const seaFar = new THREE.Mesh(farGeo, seaMat); scene.add(seaFar);

// ======================= LIGHTS =======================
export const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1); scene.add(hemi);
export const sun = new THREE.DirectionalLight(0xffffff, 1); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 120 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
scene.add(sun); scene.add(sun.target);
export const pts = [0, 1, 2, 3].map(() => { const l = new THREE.PointLight(0xffb060, 0, 0, 2); scene.add(l); return l; });
scene.fog = new THREE.Fog(0x000000, 60, 900);
const C = (h) => new THREE.Color(h);
export const PRESETS = {
  dusk: { top: '#3b5aa8', mid: '#e48a7c', hor: '#ffc27a', glow: '#ffb35c', glowAmt: .55, sunDir: [-.55, .22, -1], sunC: '#ffc89a', sunI: 3.1, hemiS: '#b8c6ff', hemiG: '#a8705a', hemiI: 2.5, fog: '#f2a77e', fogN: 80, fogF: 700, deep: '#244a7c', shallow: '#5f86b8', glint: '#ffe0a0', glintAmt: 1, stars: 0, moon: 0, cloud: '#ffc7a8' },
  twilight: { top: '#2a3a86', mid: '#6a62b0', hor: '#d98c8c', glow: '#ff9a7a', glowAmt: .35, sunDir: [-.6, .05, -1], sunC: '#c7b8ff', sunI: 1.7, hemiS: '#9aa6ff', hemiG: '#5a4070', hemiI: 1.8, fog: '#9a84c0', fogN: 70, fogF: 650, deep: '#1b2c5c', shallow: '#4a5f9c', glint: '#ffc6a0', glintAmt: .7, stars: .35, moon: 1, cloud: '#8f7fb0' },
  night: { top: '#14246a', mid: '#2f47a8', hor: '#6178d0', glow: '#8da2ff', glowAmt: .25, sunDir: [-.4, .55, -1], sunC: '#bccbff', sunI: 1.55, hemiS: '#8ea0ff', hemiG: '#3c3060', hemiI: 1.75, fog: '#34489a', fogN: 40, fogF: 420, deep: '#16286a', shallow: '#3d5cb0', glint: '#cfe0ff', glintAmt: .8, stars: 1, moon: 1, cloud: '#4a5aa0' },
  nightFog: { top: '#3a4a8e', mid: '#5869b0', hor: '#8c9cd8', glow: '#7e92c8', glowAmt: .2, sunDir: [-.4, .55, -1], sunC: '#a9bcf0', sunI: 1.3, hemiS: '#a9b8ff', hemiG: '#4c4878', hemiI: 2.05, fog: '#7383c0', fogN: 6, fogF: 70, deep: '#22357a', shallow: '#4a64b0', glint: '#bfd0ff', glintAmt: .4, stars: .15, moon: .6, cloud: '#56669e' },
  sunrise: { top: '#5d78c8', mid: '#f0a3b4', hor: '#ffd29a', glow: '#ffe2a8', glowAmt: .7, sunDir: [.7, .12, -1], sunC: '#ffd2a8', sunI: 2.9, hemiS: '#c3c8ff', hemiG: '#a0706a', hemiI: 2.0, fog: '#f3c0b8', fogN: 60, fogF: 600, deep: '#3b5b96', shallow: '#86a6d8', glint: '#fff0c0', glintAmt: 1, stars: 0, moon: 0, cloud: '#ffd0d0' },
};
export const LS = { name: '' };
export function applyLight(name, ov = {}) {
  const p = { ...PRESETS[name], ...ov }; LS.name = name; LS.p = p;
  skyU.top.value.set(p.top); skyU.mid.value.set(p.mid); skyU.hor.value.set(p.hor); skyU.glow.value.set(p.glow); skyU.glowAmt.value = p.glowAmt;
  const sd = new THREE.Vector3(...p.sunDir).normalize(); skyU.sunDir.value.copy(sd); seaU.sunDir.value.copy(sd);
  sun.color.set(p.sunC); sun.intensity = p.sunI; hemi.color.set(p.hemiS); hemi.groundColor.set(p.hemiG); hemi.intensity = p.hemiI;
  scene.fog.color.set(p.fog); scene.fog.near = p.fogN; scene.fog.far = p.fogF;
  seaU.deep.value.set(p.deep); seaU.shallow.value.set(p.shallow); seaU.glint.value.set(p.glint); seaU.glintAmt.value = p.glintAmt;
  starMat.opacity = p.stars; skyState.moonOn = p.moon > 0; moon.material.opacity = p.moon; moonGlow.material.opacity = .45 * p.moon;
  cloudMat.color.set(p.cloud); skyState.sunDir.copy(sd);
  if (name === 'night' || name === 'nightFog' || name === 'twilight') skyState.moonDir.copy(sd);
  pts.forEach(l => { l.intensity = 0; });
}
export function setShadowFocus(x, y, z, size = 16) { // directional light follows a focus point
  const d = skyState.sunDir; sun.position.set(x + d.x * 50, y + Math.max(d.y, .35) * 50, z + d.z * 50); sun.target.position.set(x, y, z); sun.target.updateMatrixWorld();
  Object.assign(sun.shadow.camera, { left: -size, right: size, top: size, bottom: -size }); sun.shadow.camera.updateProjectionMatrix();
}
export function updateSky(t) { // call after camera placement
  sky.position.copy(camera.position); stars.position.copy(camera.position); clouds.position.set(camera.position.x, 0, camera.position.z);
  sea.position.set(Math.round(camera.position.x / 10) * 10, 0, Math.round(camera.position.z / 10) * 10); seaFar.position.copy(sea.position);
  const md = skyState.moonDir; moon.position.copy(camera.position).addScaledVector(md, 1100); moon.lookAt(camera.position); moonGlow.position.copy(moon.position);
  moon.visible = moonGlow.visible = skyState.moonOn;
  seaU.uT.value = t; seaU.uAmp.value = WAVE.amp; WAVE.t = t;
}

export function makeLantern(on = true) {
  const g = group(); const metal = toon('#2d2a33');
  mesh(new THREE.CylinderGeometry(.13, .15, .05, 10), metal, { p: [0, 0, 0], parent: g });
  const gm = toon('#ffd27a', { emissive: '#ffb347', ei: on ? 1 : 0, unique: true, ol: .003 }); g.userData.glassM = gm;
  mesh(new THREE.CylinderGeometry(.11, .11, .26, 10), gm, { p: [0, .16, 0], parent: g, cast: false });
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .78; cylBetween([Math.cos(a) * .12, .02, Math.sin(a) * .12], [Math.cos(a) * .12, .3, Math.sin(a) * .12], .012, metal, g, 4); }
  mesh(new THREE.ConeGeometry(.15, .12, 10), metal, { p: [0, .36, 0], parent: g });
  mesh(new THREE.TorusGeometry(.05, .012, 4, 10), metal, { p: [0, .45, 0], parent: g });
  const glow = glowSprite('#ffb04a', 1.6, { opacity: on ? .55 : 0, fog: true }); glow.position.y = .16; g.add(glow); g.userData.glow = glow;
  return g;
}
export function lanternOn(g, k) { g.userData.glassM.emissiveIntensity = k; g.userData.glow.material.opacity = .55 * k; }
// --- rock
export function makeRock(seed, s = 1, col = '#59627a') {
  const geo = new THREE.IcosahedronGeometry(1, 3); const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = noise3(v.x * 1.3 + seed, v.y * 1.3, v.z * 1.3) * .28 + noise3(v.x * 3 + seed, v.y * 3, v.z * 3) * .1; v.multiplyScalar(1 + n); if (v.y < -.2) v.y = -.2 + (v.y + .2) * .3; p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals(); const m = mesh(geo, toon(col), {}); m.scale.set(s, s * .9, s); return m;
}
export function redrawSign() { }
export const sprayMat = toon('#f4f8ff', { ol: 0, unique: true }); sprayMat.userData.noInk = true;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const plankTex = (cs, n = 8, vert = false) => canvasTex(512, 512, (x, w, h) => { for (let i = 0; i < n; i++) { x.fillStyle = cs[i % cs.length]; const s = w / n; if (vert) { x.fillRect(i * s, 0, s, h); x.fillStyle = 'rgba(30,16,10,.75)'; x.fillRect(i * s, 0, 4, h); } else { x.fillRect(0, i * s, w, s); x.fillStyle = 'rgba(30,16,10,.75)'; x.fillRect(0, i * s, w, 4); } } x.fillStyle = 'rgba(40,20,10,.18)'; const r = rng(7); for (let i = 0; i < 90; i++) x.fillRect(r() * w, r() * h, vert ? 3 : 30 + r() * 50, vert ? 30 + r() * 50 : 3); });
const WOODV = plankTex(['#b9824e', '#a9733f', '#c08a57'], 8, true), WOODH = plankTex(['#8a5a36', '#7d4f2e', '#94623c'], 8, false), FLOORT = plankTex(['#c79a66', '#b98b58', '#d0a572'], 7, true);

// ======================= series "เกมเอาชีวิตรอด": school (x 300), city of towers (x -300, rooftop y 0), classroom 07 inside the tower (CR, floor y -4) =======================
PRESETS.day = { top: '#2f7fe0', mid: '#86c4f6', hor: '#e8f4ff', glow: '#fff6d8', glowAmt: .5, sunDir: [.35, .62, .6], sunC: '#fff4e0', sunI: 3.0, hemiS: '#dcebff', hemiG: '#a89070', hemiI: 2.5, fog: '#d8e8f8', fogN: 60, fogF: 500, deep: '#2a78cf', shallow: '#74c2f2', glint: '#ffffff', glintAmt: .8, stars: 0, moon: 0, cloud: '#ffffff' };
PRESETS.after = { top: '#3a70d0', mid: '#9cc0ee', hor: '#ffe6c0', glow: '#ffd8a0', glowAmt: .6, sunDir: [-.5, .42, .7], sunC: '#ffe2b8', sunI: 3.0, hemiS: '#dce6ff', hemiG: '#a88a68', hemiI: 2.4, fog: '#f0dcc8', fogN: 60, fogF: 420, deep: '#2a78cf', shallow: '#74c2f2', glint: '#ffffff', glintAmt: .8, stars: 0, moon: 0, cloud: '#fff4e8' };
PRESETS.city = { top: '#3a78d0', mid: '#94bce8', hor: '#dfe8f2', glow: '#fff0d0', glowAmt: .4, sunDir: [.45, .6, .55], sunC: '#fff2dc', sunI: 2.9, hemiS: '#dce8ff', hemiG: '#8a8aa0', hemiI: 2.4, fog: '#c8d6e8', fogN: 40, fogF: 260, deep: '#2a78cf', shallow: '#74c2f2', glint: '#ffffff', glintAmt: .8, stars: 0, moon: 0, cloud: '#ffffff' };
PRESETS.room = { top: '#3a78d0', mid: '#94bce8', hor: '#dfe8f2', glow: '#fff0d0', glowAmt: 0, sunDir: [-.6, .5, .3], sunC: '#fff2dc', sunI: 2.0, hemiS: '#fff6ea', hemiG: '#8a7a6a', hemiI: 2.6, fog: '#c8d6e8', fogN: 30, fogF: 260, deep: '#2a78cf', shallow: '#74c2f2', glint: '#ffffff', glintAmt: 0, stars: 0, moon: 0, cloud: '#ffffff' };
PRESETS.roomN = { top: '#14246a', mid: '#2f47a8', hor: '#6178d0', glow: '#8da2ff', glowAmt: 0, sunDir: [-.6, .5, .3], sunC: '#9ab0ff', sunI: 1.2, hemiS: '#8ea0ff', hemiG: '#3c3060', hemiI: 1.9, fog: '#2a3060', fogN: 30, fogF: 220, deep: '#16286a', shallow: '#3d5cb0', glint: '#cfe0ff', glintAmt: 0, stars: .6, moon: 1, cloud: '#4a5aa0' };
PRESETS.cityN = { top: '#14246a', mid: '#2f47a8', hor: '#6178d0', glow: '#8da2ff', glowAmt: .25, sunDir: [-.4, .55, -1], sunC: '#bccbff', sunI: 1.5, hemiS: '#8ea0ff', hemiG: '#3c3060', hemiI: 1.8, fog: '#34489a', fogN: 40, fogF: 260, deep: '#16286a', shallow: '#3d5cb0', glint: '#cfe0ff', glintAmt: .8, stars: 1, moon: 1, cloud: '#4a5aa0' };
PRESETS.schoolN = { top: '#0c1438', mid: '#1c2a64', hor: '#3a4a8a', glow: '#6a7ad0', glowAmt: .2, sunDir: [-.4, .6, .6], sunC: '#9fb4ff', sunI: 1.5, hemiS: '#7a8ad8', hemiG: '#2a2440', hemiI: 1.55, fog: '#1a2250', fogN: 30, fogF: 200, deep: '#16286a', shallow: '#3d5cb0', glint: '#cfe0ff', glintAmt: .8, stars: 1, moon: 1, cloud: '#2a3466' };
PRESETS.cityN2 = { top: '#0a1030', mid: '#18245a', hor: '#34407a', glow: '#5a6ac0', glowAmt: .2, sunDir: [-.4, .55, -1], sunC: '#9fb4ff', sunI: 1.35, hemiS: '#6a7ac8', hemiG: '#241e38', hemiI: 1.5, fog: '#141c44', fogN: 30, fogF: 240, deep: '#16286a', shallow: '#3d5cb0', glint: '#cfe0ff', glintAmt: .8, stars: 1, moon: 1, cloud: '#232c5a' };
PRESETS.roomN2 = { top: '#0a1030', mid: '#18245a', hor: '#34407a', glow: '#5a6ac0', glowAmt: 0, sunDir: [-.6, .5, .3], sunC: '#8aa0e8', sunI: .9, hemiS: '#b8c4ee', hemiG: '#3a3450', hemiI: 1.45, fog: '#141c44', fogN: 30, fogF: 240, deep: '#16286a', shallow: '#3d5cb0', glint: '#cfe0ff', glintAmt: 0, stars: 1, moon: 1, cloud: '#232c5a' };
export const SC = group({ p: [300, 0, 0], parent: scene }), CT = group({ p: [-300, 0, 0], parent: scene }), CR = group({ p: [-300, -4, 0], parent: scene }); export const XA = {};
const tx = (w, h, f, o) => canvasTex(w, h, f, o);
XA.litMats = [];
const LIT = canvasTex(1024, 1024, (x, w, h) => { x.fillStyle = '#000000'; x.fillRect(0, 0, w, h); const r = rng(77); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const v = r(); if (v < .45) continue; x.fillStyle = v < .8 ? '#ffd88a' : v < .93 ? '#bfe0ff' : '#ff9a6a'; x.fillRect(22 + i * 128, 30 + j * 128, 84, 76); } });
function litMat(map, rep) { const lt = LIT.clone(); lt.needsUpdate = true; lt.wrapS = lt.wrapT = THREE.RepeatWrapping; lt.repeat.set(rep[0] / 4, rep[1] / 4); const m = toon('#ffffff', { map, unique: true }); m.emissive = new THREE.Color('#ffffff'); m.emissiveMap = lt; m.emissiveIntensity = 0; XA.litMats.push(m); return m; }
export function setNight(k) { XA.litMats.forEach(m => { m.emissiveIntensity = k; }); }
const winTex = (base, glass, lit = 0) => tx(256, 256, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { x.fillStyle = glass; x.fillRect(22 + i * 128, 30 + j * 128, 84, 76); x.strokeStyle = 'rgba(30,24,40,.8)'; x.lineWidth = 6; x.strokeRect(22 + i * 128, 30 + j * 128, 84, 76); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(30 + i * 128, 38 + j * 128, 18, 40); } });
{ // ---------- school courtyard (x 300): building along z -14 ----------
  mesh(new THREE.PlaneGeometry(160, 160), toon('#b9b4aa'), { r: [-90, 0, 0], parent: SC, cast: false });
  for (let x = -40; x <= 40; x += 4) mesh(rbox(.06, .01, 60), toon('#a8a398'), { p: [x, .005, 0], parent: SC, cast: false });
  for (const s of [-1, 1]) mesh(new THREE.PlaneGeometry(18, 30), toon('#8ac070'), { r: [-90, 0, 0], p: [s * 22, .01, 6], parent: SC, cast: false });
  const t = winTex('#f2e2c0', '#8ac4ec'); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(20, 4);
  const b = group({ p: [0, 0, -16], parent: SC }); mesh(rbox(48, 12, 8), litMat(t, [20, 4]), { p: [0, 6, 0], parent: b }); mesh(rbox(49, .8, 9), toon('#c8483a'), { p: [0, 12.4, 0], parent: b });
  for (let y = 3; y < 12; y += 3) mesh(rbox(48.4, .3, .5), toon('#e0c89c'), { p: [0, y, 4.1], parent: b, cast: false });
  mesh(rbox(4, 3.2, .2), toon('#5a3a26'), { p: [0, 1.6, 4.05], parent: b }); mesh(rbox(6, .3, 2.4), toon('#c8483a'), { p: [0, 3.4, 5], parent: b });
  XA.schoolSign = tx(512, 128, (x, w, h) => { x.fillStyle = '#2a4a8a'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffffff'; x.font = '700 66px Prompt'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('โรงเรียนมัธยม', w / 2, h / 2 + 4); });
  mesh(new THREE.PlaneGeometry(8, 2), toon('#ffffff', { map: XA.schoolSign }), { p: [0, 9.6, 4.12], parent: b, cast: false });
  { const g = group({ p: [9, 0, -6], parent: SC }); cylBetween([0, 0, 0], [0, 10, 0], .08, toon('#d8dce4'), g, 6); mesh(rbox(2.2, 1.4, .04), toon('#3a64b0'), { p: [1.15, 9.2, 0], parent: g }); mesh(rbox(2.2, .46, .05), toon('#ffffff'), { p: [1.15, 9.2, 0], parent: g }); }
  const r = rng(21); for (let i = 0; i < 14; i++) { const s = i % 2 ? -1 : 1, x = s * (16 + r() * 12), z = -6 + r() * 26; const g = group({ p: [x, 0, z], parent: SC }); cylBetween([0, 0, 0], [0, 2.4, 0], .2, toon('#7a5236'), g, 6); mesh(new THREE.SphereGeometry(1.8 + r() * .6, 12, 9), toon(i % 3 ? '#5aa858' : '#6ab868'), { p: [0, 3.4, 0], parent: g }); }
  const h1 = toon('#8ac070'); for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; mesh(new THREE.SphereGeometry(30 + r() * 20, 14, 8), h1, { p: [Math.sin(a) * 130, -14, Math.cos(a) * 130], s: [1, .6, 1], parent: SC, cast: false, recv: false }); }
}
// ---------- helicopters, desks, ropes, props ----------
function heli() { const g = group({ parent: scene }), m = toon('#3c4654'), d = toon('#2a313c');
  mesh(new THREE.SphereGeometry(1, 20, 14), m, { s: [1.5, 1.3, 2.6], parent: g }); const gl = mesh(new THREE.SphereGeometry(1, 16, 12), toon('#9ad8f4', { emissive: '#5ab0e0', ei: .3 }), { p: [0, .25, -1.7], s: [1.05, .85, 1.05], parent: g });
  cylBetween([0, .3, 1.8], [0, .7, 7.2], .32, m, g, 8); mesh(rbox(.12, 1.6, 1.2), d, { p: [0, 1.3, 7.1], parent: g }); mesh(rbox(1.8, .1, .7), d, { p: [0, .7, 6.6], parent: g });
  for (const s of [-1, 1]) { cylBetween([s * 1.1, -1.75, -2], [s * 1.1, -1.75, 2], .08, d, g, 6); cylBetween([s * .8, -1.2, -1], [s * 1.1, -1.75, -1], .06, d, g, 6); cylBetween([s * .8, -1.2, 1], [s * 1.1, -1.75, 1], .06, d, g, 6); }
  mesh(new THREE.CylinderGeometry(.2, .3, .5, 10), d, { p: [0, 1.45, 0], parent: g }); const rot = group({ p: [0, 1.75, 0], parent: g }); for (const a of [0, 90]) mesh(rbox(11, .07, .42), d, { r: [0, a, 0], parent: rot });
  const tr = group({ p: [.2, 1.3, 7.2], parent: g }); for (const a of [0, 90]) mesh(rbox(.05, 1.8, .2), d, { r: [a, 0, 0], parent: tr });
  const bl = glowSprite('#ff4a4a', 1.2, { opacity: .8, fog: true }); bl.position.set(0, -1.35, 0); g.add(bl); g.userData = { rot, tr, bl }; return g; }
XA.helis = [heli(), heli(), heli()];
export function heliAt(i, p, ry, t, tilt = 0) { const h = XA.helis[i]; h.visible = true; h.position.set(...p); h.rotation.set(tilt, ry * D2R, 0); h.userData.rot.rotation.y = t * 34 + i; h.userData.tr.rotation.x = t * 40; h.userData.bl.material.opacity = (t * 2 + i) % 1 < .5 ? .9 : .1; }
function desk() { const g = group({ parent: scene }), w = toon('#d8b07a'), mt = toon('#5a6070'); mesh(rbox(1.1, .07, .65), w, { p: [0, .76, 0], parent: g }); for (const [x, z] of [[-.48, -.26], [.48, -.26], [-.48, .26], [.48, .26]]) cylBetween([x, 0, z], [x, .74, z], .025, mt, g, 5); mesh(rbox(1.0, .22, .5), mt, { p: [0, .6, 0], parent: g });
  const c = group({ p: [0, 0, .6], parent: g }); mesh(rbox(.5, .05, .45), w, { p: [0, .46, 0], parent: c }); mesh(rbox(.5, .45, .05), w, { p: [0, .72, .22], parent: c }); for (const [x, z] of [[-.22, -.2], [.22, -.2], [-.22, .2], [.22, .2]]) cylBetween([x, 0, z], [x, .45, z], .02, mt, c, 5); return g; }
XA.desks = []; for (let i = 0; i < 10; i++) XA.desks.push(desk());
XA.ropes = []; { const rm = toon('#2a2a2a'); for (let i = 0; i < 4; i++) { const g = group({ parent: scene }); mesh(new THREE.CylinderGeometry(.035, .035, 1, 5), rm, { p: [0, -.5, 0], parent: g, cast: false }); XA.ropes.push(g); } }
export function ropeAt(i, top, len) { const r = XA.ropes[i]; r.visible = true; r.position.set(...top); r.scale.set(1, len, 1); }
XA.syr = group({ parent: scene }); { const gm = basic('#d8f0ff', { transparent: true, opacity: .6, noInk: true }); gm.userData.noInk = true; mesh(new THREE.CylinderGeometry(.03, .03, .22, 10), gm, { parent: XA.syr, cast: false }); mesh(new THREE.CylinderGeometry(.024, .024, .14, 10), toon('#5af0a0', { emissive: '#2ad080', ei: .8 }), { p: [0, -.03, 0], parent: XA.syr, cast: false }); cylBetween([0, .11, 0], [0, .2, 0], .008, toon('#f4f4f4'), XA.syr, 4); mesh(rbox(.08, .01, .03), toon('#f4f4f4'), { p: [0, .2, 0], parent: XA.syr }); cylBetween([0, -.11, 0], [0, -.22, 0], .004, toon('#c8ccd4'), XA.syr, 4); }
XA.ball = mesh(new THREE.SphereGeometry(.12, 16, 12), toon('#e8742a'), { parent: scene });
XA.gadget = group({ parent: scene }); { mesh(rbox(.18, .11, .07), toon('#e8a03a'), { parent: XA.gadget }); mesh(rbox(.12, .05, .01), toon('#2a3a4a', { emissive: '#4ae0ff', ei: .5 }), { p: [0, .01, .036], parent: XA.gadget, cast: false }); cylBetween([.07, .05, 0], [.09, .2, 0], .006, toon('#3a3a44'), XA.gadget, 4); XA.led = glowSprite('#ff4a4a', .12, { opacity: .9 }); XA.led.position.set(.09, .21, 0); XA.gadget.add(XA.led); }
XA.comm = group({ parent: scene }); { mesh(rbox(.06, .12, .025), toon('#2a2a32'), { parent: XA.comm }); mesh(rbox(.045, .07, .005), toon('#2a3a4a', { emissive: '#6ad0ff', ei: .6 }), { p: [0, .015, .014], parent: XA.comm, cast: false }); XA.commGlow = glowSprite('#6ad0ff', .25, { opacity: 0 }); XA.comm.add(XA.commGlow); }
// ---------- power stones ----------
const symTex = (sym, col) => tx(128, 128, (x, w, h) => { x.strokeStyle = '#ffffff'; x.fillStyle = '#ffffff'; x.lineWidth = 12; x.lineCap = 'round'; x.lineJoin = 'round'; x.shadowColor = col; x.shadowBlur = 16; x.beginPath();
  if (sym === 'flame') { x.moveTo(64, 14); x.bezierCurveTo(100, 50, 104, 84, 64, 114); x.bezierCurveTo(24, 84, 30, 60, 48, 44); x.bezierCurveTo(52, 64, 60, 70, 64, 74); x.stroke(); }
  else if (sym === 'drop') { x.moveTo(64, 14); x.bezierCurveTo(100, 64, 100, 112, 64, 112); x.bezierCurveTo(28, 112, 28, 64, 64, 14); x.stroke(); }
  else if (sym === 'bolt') { x.moveTo(74, 10); x.lineTo(40, 70); x.lineTo(70, 70); x.lineTo(52, 118); x.lineTo(92, 52); x.lineTo(62, 52); x.closePath(); x.stroke(); }
  else if (sym === 'spiral') { for (let a = 0; a < 16; a += .2) { const r = 4 + a * 3.2; x.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } x.stroke(); }
  else if (sym === 'skull') { x.arc(64, 54, 36, Math.PI * .85, Math.PI * 2.15); x.lineTo(84, 100); x.lineTo(44, 100); x.closePath(); x.stroke(); x.beginPath(); x.arc(50, 56, 9, 0, 7); x.arc(78, 56, 9, 0, 7); x.fill(); }
  else if (sym === 'fist') { x.roundRect(30, 46, 64, 56, 14); x.stroke(); x.beginPath(); for (let i = 0; i < 4; i++) { x.moveTo(36 + i * 16, 46); x.lineTo(36 + i * 16, 30); x.arc(42 + i * 16, 30, 6, Math.PI, 0); x.lineTo(48 + i * 16, 46); } x.stroke(); x.beginPath(); x.moveTo(30, 66); x.lineTo(18, 56); x.stroke(); }
  else if (sym === 'wind') { for (const [y, l] of [[36, 76], [64, 92], [92, 64]]) { x.moveTo(20, y); x.lineTo(20 + l - 12, y); x.arc(20 + l - 12, y - 12, 12, Math.PI / 2, -Math.PI * .8, true); } x.stroke(); }
  else if (sym === 'gear') { for (let a = 0; a < 8; a++) { const q = a * Math.PI / 4; x.moveTo(64 + Math.cos(q) * 30, 64 + Math.sin(q) * 30); x.lineTo(64 + Math.cos(q) * 48, 64 + Math.sin(q) * 48); } x.stroke(); x.beginPath(); x.arc(64, 64, 30, 0, 7); x.stroke(); x.beginPath(); x.arc(64, 64, 10, 0, 7); x.stroke(); }
  else if (sym === 'eye') { x.moveTo(12, 64); x.quadraticCurveTo(64, 10, 116, 64); x.quadraticCurveTo(64, 118, 12, 64); x.stroke(); x.beginPath(); x.arc(64, 64, 16, 0, 7); x.fill(); }
  else { x.arc(64, 64, 40, 0, 7); x.stroke(); } });
function makeStone(col, sym) { const g = group({ parent: scene }); const m = toon(col, { emissive: col, ei: .55, unique: true }); const c = mesh(new THREE.OctahedronGeometry(.13, 0), m, { p: [0, .17, 0], s: [1, 1.5, 1], parent: g }); mesh(new THREE.CylinderGeometry(.12, .15, .05, 7), toon('#6a6670'), { p: [0, .025, 0], parent: g });
  const gl = glowSprite(col, 1.0, { opacity: .55, fog: true }); gl.position.y = .2; g.add(gl); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: symTex(sym, col), transparent: true, depthWrite: false, fog: false })); sp.scale.setScalar(.2); sp.position.y = .48; g.add(sp); g.userData = { c, gl, sp, m }; return g; }
XA.stones = [makeStone('#ff5a4a', 'flame'), makeStone('#4aa8ff', 'drop'), makeStone('#ffd23a', 'bolt'), makeStone('#b06aff', 'spiral'), makeStone('#3a3044', 'skull')];
XA.stones.push(makeStone('#ff4a3a', 'fist'), makeStone('#3af08a', 'wind'), makeStone('#ffd23a', 'gear'), makeStone('#4aa8ff', 'eye')); XA.stones[4].userData.gl.material.color.set('#ff3a5a'); XA.stones[4].userData.m.emissive.set('#5a0a2a');
export function stoneAt(i, p, t, k = 1) { const s = XA.stones[i]; s.visible = true; s.position.set(...p); s.userData.c.rotation.y = t * 1.2 + i; s.userData.gl.material.opacity = (.35 + .25 * Math.sin(t * 3 + i)) * k; s.userData.gl.scale.setScalar(.8 + .5 * k); s.userData.sp.material.opacity = k; }
// ---------- city of towers (x -300). Our tower: x -5..5, z -5..5, rooftop y 0; ground y -40 ----------
const numTex = (n) => tx(256, 256, (x, w, h) => { x.fillStyle = '#f4f0e6'; x.fillRect(0, 0, w, h); x.strokeStyle = '#24202c'; x.lineWidth = 14; x.strokeRect(7, 7, w - 14, h - 14); x.fillStyle = '#24202c'; x.font = '700 150px Prompt'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n).padStart(2, '0'), w / 2, h / 2 + 8); });
XA.towers = {};
{ mesh(new THREE.PlaneGeometry(600, 600), toon('#7a7e8a'), { r: [-90, 0, 0], p: [0, -40, 0], parent: CT, cast: false }); for (let k = -3; k <= 3; k++) { mesh(rbox(.5, .02, 220), toon('#e8e0c8'), { p: [k * 30 + 15, -39.98, 0], parent: CT, cast: false }); }
  const pal = ['#e8c8a8', '#a8c0d8', '#d8d0b8', '#c0b0d0', '#b8d0c0', '#e0b8a8', '#c8c8d0'];
  const TT = pal.map((c, i) => { const t = winTex(c, i % 2 ? '#7ab0d8' : '#9ac8e8'); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; });
  const r = rng(33); let n = 1;
  for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const x = i * 30, z = j * 30;
    if (i === 0 && j === 0) { XA.towers[7] = { x, z, top: 0 }; continue; } if (n === 7) n++; const num = n++;
    const w = 11 + r() * 4, d = 11 + r() * 4, top = -14 + r() * 40 + (Math.abs(i) + Math.abs(j) > 3 ? 10 : 0); const H = top + 40;
    const tex = TT[(r() * TT.length) | 0].clone(); tex.needsUpdate = true; tex.repeat.set(w / 3, H / 3);
    const g = group({ p: [x, -40, z], parent: CT }); mesh(rbox(w, H, d), litMat(tex, [w / 3, H / 3]), { p: [0, H / 2, 0], parent: g, recv: false });
    mesh(rbox(w + .6, .8, d + .6), toon('#8a8a96'), { p: [0, H + .4, 0], parent: g, cast: false });
    const nm = toon('#ffffff', { map: numTex(num) }); for (const [px, pz, ry] of [[0, d / 2 + .05, 0], [0, -d / 2 - .05, 180], [w / 2 + .05, 0, 90], [-w / 2 - .05, 0, -90]]) mesh(new THREE.PlaneGeometry(3.2, 3.2), nm, { p: [px, H - 3, pz], r: [0, ry, 0], parent: g, cast: false });
    XA.towers[num] = { x, z, top, g, w, d }; }
  // our tower body (below the classroom) + rooftop
  const ot = winTex('#d8d0c0', '#8ab8e0'); ot.wrapS = ot.wrapT = THREE.RepeatWrapping; ot.repeat.set(3.4, 12); mesh(rbox(10.4, 35.8, 10.4), litMat(ot, [3.4, 12]), { p: [0, -40 + 17.9, 0], parent: CT });
  const rt = tx(256, 256, (x, w, h) => { x.fillStyle = '#a8a49c'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(60,60,70,.3)'; x.lineWidth = 4; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke(); } }, { repeat: [3, 3] });
  mesh(rbox(10.4, .4, 10.4), toon('#ffffff', { map: rt }), { p: [0, -.2, 0], parent: CT, cast: false });
  for (const [x, z, w, d] of [[0, 5.05, 10.4, .3], [0, -5.05, 10.4, .3], [5.05, 0, .3, 10.4], [-5.05, 0, .3, 10.4]]) mesh(rbox(w, .9, d), toon('#c8c2b8'), { p: [x, .45, z], parent: CT });
  XA.hut = group({ p: [3.2, 0, -3.3], parent: CT }); mesh(rbox(2.6, 2.8, 2.4), toon('#d8d0c0'), { p: [0, 1.4, 0], parent: XA.hut }); mesh(rbox(3, .25, 2.8), toon('#8a8a96'), { p: [0, 2.9, 0], parent: XA.hut }); mesh(rbox(1.1, 2.1, .1), toon('#5a6a8a'), { p: [-.2, 1.05, 1.22], parent: XA.hut }); mesh(new THREE.SphereGeometry(.05, 8, 6), toon('#f2c230'), { p: [.22, 1.05, 1.3], parent: XA.hut });
  { const g = group({ p: [-3.2, 0, -3.2], parent: CT }); mesh(new THREE.CylinderGeometry(1, 1, 1.8, 16), toon('#7ab0d0'), { p: [0, 1.6, 0], parent: g }); for (const [x, z] of [[-.6, -.6], [.6, -.6], [-.6, .6], [.6, .6]]) cylBetween([x, 0, z], [x, .7, z], .06, toon('#5a6070'), g, 5); cylBetween([.4, 2.5, .4], [.4, 4.5, .4], .04, toon('#5a6070'), g, 4); }
}
// ---------- the monster ----------
function monster() { const g = group({ parent: scene }), m = toon('#2a2632'), d = toon('#1e1a24'); const hips = group({ p: [0, 18, 0], parent: g });
  const leg = (s) => { const p = group({ p: [s * 2.4, 0, 0], parent: hips }); cylBetween([0, 0, 0], [0, -17, 0], 1.7, m, p, 10); mesh(new THREE.SphereGeometry(2.1, 12, 8), d, { p: [0, -17.4, -.8], s: [1, .6, 1.5], parent: p }); return p; };
  const body = group({ parent: hips }); mesh(new THREE.CapsuleGeometry(5.2, 10, 8, 16), m, { p: [0, 9, 0], parent: body }); mesh(new THREE.SphereGeometry(5.6, 16, 12), m, { p: [0, 15.5, -1.2], s: [1.25, .8, 1], parent: body });
  const head = group({ p: [0, 17.5, -4.2], parent: body }); mesh(new THREE.SphereGeometry(3.4, 16, 12), m, { s: [1, .9, 1], parent: head }); for (const s of [-1, 1]) mesh(new THREE.ConeGeometry(.9, 3.2, 8), d, { p: [s * 2.2, 2.6, .4], r: [-10, 0, -s * 25], parent: head });
  const eyeM = toon('#ffffff', { emissive: '#ffe0e0', ei: 1, unique: true }); const eyes = [-1, 1].map(s => { const e = mesh(new THREE.SphereGeometry(.75, 12, 8), eyeM, { p: [s * 1.3, .4, -2.9], s: [1.2, .7, .5], parent: head, cast: false }); const gl = glowSprite('#ff4a5a', 7, { opacity: .5, fog: false }); gl.position.copy(e.position).add(new THREE.Vector3(0, 0, -.6)); head.add(gl); return gl; });
  mesh(rbox(3, .3, .3), toon('#e8e0d8'), { p: [0, -1.4, -3.0], parent: head });
  const arm = (s) => { const p = group({ p: [s * 6.6, 16, -1], parent: body }); cylBetween([0, 0, 0], [s * 1, -19, 0], 1.3, m, p, 8); mesh(new THREE.SphereGeometry(2, 10, 8), d, { p: [s * 1, -19.5, 0], parent: p }); return p; };
  g.userData = { hips, body, head, L: leg(-1), R: leg(1), aL: arm(-1), aR: arm(1), eyes, eyeM }; return g; }
XA.mon = monster();
export function monAt(p, ry, ph, eye = .5, o = {}) { const M = XA.mon, u = M.userData; M.visible = true; M.position.set(...p); M.rotation.set(0, ry * D2R, 0); M.scale.setScalar(o.s || 1);
  u.L.rotation.x = Math.sin(ph) * .35; u.R.rotation.x = -Math.sin(ph) * .35; u.aL.rotation.x = -Math.sin(ph) * .3; u.aR.rotation.x = Math.sin(ph) * .3; if (o.reach) { u.aR.rotation.x = -o.reach * 1.3; u.aR.rotation.z = o.reach * .3; }
  u.hips.position.y = 18 + Math.abs(Math.cos(ph)) * .6; u.body.rotation.x = .28 + (o.lean || 0); u.head.rotation.set(o.hp || 0, (o.hy || 0) * D2R, 0);
  u.eyes.forEach(e => { e.material.opacity = eye; e.scale.setScalar(4 + eye * 6); }); u.eyeM.emissiveIntensity = .4 + eye; u.eyeM.emissive.set(eye > .8 ? '#ff6a6a' : '#ffe0e0'); }
// ---------- explosion ----------
XA.boom = group({ parent: scene }); { XA.boomF = [0, 1, 2, 3, 4, 5].map(i => { const s = glowSprite(i % 2 ? '#ffb030' : '#ff6a20', 6, { opacity: 0, fog: false }); XA.boom.add(s); return s; }); const sm = toon('#5a5660', { unique: true }); XA.boomS = [0, 1, 2, 3, 4, 5, 6].map(i => mesh(new THREE.SphereGeometry(1, 10, 8), sm, { parent: XA.boom, cast: false })); XA.boomSM = sm; }
export function boomAt(p, k) { const b = XA.boom; b.visible = k > 0; if (!b.visible) return; b.position.set(...p); const r = rng(5);
  XA.boomF.forEach((s, i) => { const a = r() * 6.28, d = k * (1 + r() * 3); s.position.set(Math.cos(a) * d, Math.sin(a) * d * .7 + k * 2, r() * 2); s.scale.setScalar(6 + 10 * Math.min(1, k * 2) * (1 - Math.min(1, k / 4) * .5)); s.material.opacity = Math.max(0, 1 - k / 3.5); });
  XA.boomS.forEach((m, i) => { const a = r() * 6.28; m.position.set(Math.cos(a) * (1 + k * 1.2), k * (1.5 + r() * 2.5) + i * .4, 1 + r()); m.scale.setScalar(Math.min(4.5, .5 + k * (1.2 + r()))); }); }
// ---------- classroom 07 (CR: floor y 0, walls x ±5, z ±5, ceiling 3.6). screen on the back wall z -5, windows on the left wall x -5, door on the right wall x 5 ----------
{ const fl = tx(256, 256, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = ['#c8a070', '#bb9464', '#d0aa7a'][i % 3]; x.fillRect(i * 32, 0, 32, h); x.fillStyle = 'rgba(60,30,20,.5)'; x.fillRect(i * 32, 0, 3, h); } }, { repeat: [4, 4] });
  mesh(new THREE.PlaneGeometry(10, 10), toon('#ffffff', { map: fl }), { r: [-90, 0, 0], parent: CR, cast: false });
  XA.wallM = toon('#dfe6d8', { unique: true }); const W = (p, s) => mesh(rbox(...s), XA.wallM, { p, parent: CR });
  W([0, 1.8, -5.15], [10.6, 3.6, .3]); W([0, 1.8, 5.15], [10.6, 3.6, .3]); W([5.15, 1.8, -1.2], [.3, 3.6, 7.6]); W([5.15, 3.0, 3.6], [.3, 1.2, 2.8]); W([5.15, 1.15, 4.6], [.3, 2.3, .8]);
  W([-5.15, .5, 0], [.3, 1.0, 10.6]); W([-5.15, 3.1, 0], [.3, 1.0, 10.6]); for (const z of [-4.5, 0, 4.5]) W([-5.15, 1.8, z], [.3, 1.6, 1.4]);
  mesh(rbox(10.6, .3, 10.6), toon('#f0ece4'), { p: [0, 3.75, 0], parent: CR, cast: false });
  mesh(rbox(10, .12, .04), toon('#a8b8a0'), { p: [0, 1.0, -4.98], parent: CR, cast: false });
  for (const x of [-2.5, 2.5]) for (const z of [-2.5, 1.5]) { mesh(rbox(1.6, .05, .5), toon('#fffaf0', { emissive: '#fff4d8', ei: .8 }), { p: [x, 3.58, z], parent: CR, cast: false }); }
  const gm = basic('#cfe8ff', { transparent: true, opacity: .18, noInk: true, depthWrite: false }); gm.userData.noInk = true; for (const z of [-2.25, 2.25]) { const gp = mesh(new THREE.PlaneGeometry(3.1, 1.6), gm, { r: [0, 90, 0], p: [-5.05, 1.8, z], parent: CR, cast: false }); gp.userData.noInk = true; const fr = toon('#7a8a9a'); mesh(rbox(.14, .1, 3.1), fr, { p: [-5.05, 1.8, z], parent: CR }); mesh(rbox(.14, 1.6, .1), fr, { p: [-5.05, 1.8, z], parent: CR }); }
  XA.doorP = group({ p: [5.05, 0, 2.8], parent: CR }); mesh(rbox(.08, 2.3, 1.6), toon('#8a6a4a'), { p: [0, 1.15, .8], parent: XA.doorP }); mesh(new THREE.SphereGeometry(.05, 8, 6), toon('#f2c230'), { p: [-.08, 1.1, 1.4], parent: XA.doorP });
  mesh(rbox(6.2, .5, .05), toon('#6a7a6a'), { p: [0, .25, 4.98], parent: CR, cast: false });
  XA.plateTex = tx(512, 160, () => { }); XA.plate = mesh(new THREE.PlaneGeometry(1.1, .34), toon('#ffffff', { map: XA.plateTex }), { p: [0, 3.4, -4.98], parent: CR, cast: false });
  // the big screen
  mesh(rbox(4.4, 2.6, .12), toon('#2a2a32'), { p: [0, 1.9, -4.94], parent: CR }); XA.scrTex = tx(1024, 576, () => { }); XA.scrM = basic('#ffffff', { map: XA.scrTex, noInk: true }); XA.scrM.userData.noInk = true; const sp = mesh(new THREE.PlaneGeometry(4.1, 2.3), XA.scrM, { p: [0, 1.9, -4.87], parent: CR, cast: false }); sp.userData.noInk = true;
  XA.scrGlow = glowSprite('#6ad0ff', 7, { opacity: 0 }); XA.scrGlow.position.set(0, 2.0, -5.2); CR.add(XA.scrGlow);
  XA.roomDesks = group({ parent: CR }); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const d = desk(); XA.roomDesks.add(d); d.position.set(-2.4 + i * 2.4, 0, -1.4 + j * 2.4); }
  XA.rubble = group({ parent: CR }); XA.rubble.visible = false; { const r = rng(9); for (let i = 0; i < 9; i++) mesh(rbox(.3 + r() * .5, .2 + r() * .3, .3 + r() * .4), toon('#9a9488'), { p: [-3 + r() * 6, .1, -3 + r() * 6], r: [r() * 30, r() * 90, 0], parent: XA.rubble }); }
}
export function setRoom(n, wall = '#dfe6d8') { XA.wallM.color.set(wall); const x = XA.plateTex.userData.ctx; x.fillStyle = '#2a3a6a'; x.fillRect(0, 0, 512, 160); x.fillStyle = '#ffffff'; x.font = '700 92px Prompt'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ห้อง ' + n, 256, 86); XA.plateTex.needsUpdate = true; }
setRoom('07');
// ---------- one panel drawer for the wall screen and the camera window ----------
function panel(x, W, H, mode, a = 0, b = 0) { x.clearRect(0, 0, W, H);
  const red = /red|traitor|warn|siren|detect|target|punish|locked|destroy/.test(mode), off = mode === 'off';
  if (off) { x.fillStyle = '#14161c'; x.fillRect(0, 0, W, H); x.fillStyle = 'rgba(255,255,255,.06)'; x.beginPath(); x.moveTo(W * .6, 0); x.lineTo(W * .8, 0); x.lineTo(W * .5, H); x.lineTo(W * .3, H); x.fill(); return; }
  const bg = red ? '#3a0610' : '#0a1640', ac = red ? '#ff4a5a' : '#6ad0ff'; x.fillStyle = bg; x.fillRect(0, 0, W, H);
  x.strokeStyle = ac; x.globalAlpha = .18; x.lineWidth = 2; for (let y = 0; y < H; y += 8) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); } x.globalAlpha = 1; x.lineWidth = 12; x.strokeRect(10, 10, W - 20, H - 20);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  const L = (s, y, size, col) => { let f = size; x.font = `700 ${f}px Prompt`; while (x.measureText(s).width > W - 90 && f > 22) { f -= 4; x.font = `700 ${f}px Prompt`; } x.fillStyle = col; x.fillText(s, W / 2, y); };
  const k = H / 576;
  if (mode === 'boot') { L('กำลังเชื่อมต่อ...', H / 2, 70 * k, ac); x.fillStyle = ac; x.fillRect(W * .2, H * .65, W * .6 * a, 22 * k); x.strokeStyle = ac; x.lineWidth = 4; x.strokeRect(W * .2, H * .65, W * .6, 22 * k); }
  else if (mode === 'welcome') { L('ยินดีต้อนรับสู่', H * .3, 80 * k, '#ffffff'); L('เกมเอาชีวิตรอด', H * .55, 128 * k, '#ffd24a'); L('ห้อง 07', H * .82, 56 * k, ac); }
  else if (mode === 'goal') { L('เป้าหมาย', H * .2, 70 * k, ac); L('เป็นห้องสุดท้าย', H * .47, 112 * k, '#ffffff'); L('ที่ยังเหลืออยู่', H * .72, 100 * k, '#ffd24a'); }
  else if (mode === 'stone') { L('หินพลังพิเศษ', H * .3, 112 * k, '#ffd24a'); if (a) { L('มอบความสามารถเฉพาะตัว', H * .58, 64 * k, '#ffffff'); L('ให้ผู้ครอบครอง', H * .76, 64 * k, '#ffffff'); } }
  else if (mode === 'announce') { L('ประกาศ', H * .17, 64 * k, ac); L('ห้องที่ยึดครองห้องอื่นได้', H * .4, 72 * k, '#ffffff'); if (a) { L('+ คะแนนพิเศษ', H * .62, 66 * k, '#ffd24a'); L('+ สิทธิ์เข้าพื้นที่ทรัพยากร', H * .8, 60 * k, '#6aff9a'); } }
  else if (mode === 'victor') { x.fillStyle = '#2a1840'; x.fillRect(20, 20, W - 40, H - 40); x.fillStyle = '#5a3a9a'; x.beginPath(); x.ellipse(W / 2, H * 1.02, W * .28, H * .36, 0, 0, 7); x.fill(); x.fillStyle = '#f7f2e8'; x.strokeStyle = '#1c1420'; x.lineWidth = 12; x.beginPath(); x.arc(W / 2, H * .5, H * .28, 0, 7); x.fill(); x.stroke();
    x.fillStyle = '#d8dce8'; x.beginPath(); x.arc(W / 2, H * .44, H * .3, Math.PI * 1.05, Math.PI * 1.95); x.lineTo(W / 2 + H * .2, H * .36); x.lineTo(W / 2 - H * .25, H * .38); x.closePath(); x.fill(); x.stroke();
    x.lineWidth = 10; x.beginPath(); x.moveTo(W / 2 - 70, H * .5); x.lineTo(W / 2 - 30, H * .52); x.moveTo(W / 2 + 30, H * .52); x.lineTo(W / 2 + 70, H * .5); x.stroke(); x.beginPath(); x.arc(W / 2, H * .58, 50, .3, Math.PI - .3); x.stroke(); if (a) { L('ทดสอบเสร็จสิ้น', H * .12, 48 * k, ac); } }
  else if (mode === 'test07') { L('การทดสอบพฤติกรรม', H * .28, 76 * k, '#ffffff'); L('ห้องหมายเลข 07', H * .5, 96 * k, '#ffd24a'); if (a) L('เสร็จสมบูรณ์ ✓', H * .76, 84 * k, '#6aff9a'); }
  else if (mode === 'warn') { x.fillStyle = '#ffd24a'; x.beginPath(); x.moveTo(W / 2, 40 * k); x.lineTo(W / 2 + 60 * k, 140 * k); x.lineTo(W / 2 - 60 * k, 140 * k); x.closePath(); x.fill(); x.fillStyle = '#3a0610'; x.font = `700 ${70 * k}px Prompt`; x.fillText('!', W / 2, 108 * k);
    L('คำเตือน', H * .38, 80 * k, '#ff4a5a'); L('ระดับภัยคุกคามเพิ่มขึ้น', H * .57, 72 * k, '#ffffff'); if (a) L('โปรดหลบอยู่ภายในอาคาร', H * .78, 64 * k, '#ffd24a'); }
  else if (mode === 'ctl') { L('หินควบคุม', H * .32, 104 * k, '#ff6a8a'); L('สัตว์ทดลอง', H * .6, 112 * k, '#ffffff'); }
  else if (mode === 'red') { L('ตรวจพบการละเมิดกฎ', H * .28, 80 * k, '#ffffff'); L('ระบบกำลังลงโทษ', H * .5, 80 * k, '#ff4a5a'); L('ห้องหมายเลข 07', H * .74, 80 * k, '#ffd24a'); }
  else if (mode === 'traitor') { L('ผู้ทรยศถูกตรวจพบแล้ว', H * .32, 80 * k, '#ffffff'); if (a) { L('เริ่มกระบวนการ', H * .56, 76 * k, '#ff4a5a'); L('กำจัดทั้งห้อง', H * .76, 96 * k, '#ff4a5a'); } }
  else if (mode === 'plan') { L('แผนลับ', H * .2, 64 * k, ac); L('ตึกหมายเลข 20', H * .48, 104 * k, '#ffffff'); L('คืนพรุ่งนี้', H * .74, 80 * k, '#ffd24a'); }
  else if (mode === 'signal') { L('ตรวจพบสัญญาณ', H * .3, 84 * k, '#ffd24a'); L('ต้นทาง: อุปกรณ์ของเอซ', H * .58, 64 * k, '#ffffff'); x.strokeStyle = '#6aff9a'; x.lineWidth = 6; x.beginPath(); for (let i = 0; i < 40; i++) x.lineTo(W * .15 + i * W * .7 / 39, H * .8 + Math.sin(i * 1.3 + a) * 22 * k * (i % 3 ? 1 : 2)); x.stroke(); }
  else if (mode === 'detect') { L('ตรวจพบการใช้พลังพิเศษ', H * .26, 84 * k, '#ffffff'); if (a) { L('ห้องหมายเลข 07', H * .52, 104 * k, '#ffd24a'); L('ถูกเปิดเผยตำแหน่งแล้ว', H * .76, 76 * k, '#ff4a5a'); } }
  else if (mode === 'target') { x.strokeStyle = 'rgba(255,74,90,.5)'; x.lineWidth = 8 * k; x.beginPath(); x.arc(W / 2, H * .5, H * .4, 0, 7); x.moveTo(W / 2 - H * .48, H * .5); x.lineTo(W / 2 + H * .48, H * .5); x.moveTo(W / 2, H * .04); x.lineTo(W / 2, H * .96); x.stroke(); L('ห้องหมายเลข 07', H * .24, 96 * k, '#ffd24a'); if (a) { L('ถูกจัดอยู่ใน', H * .5, 70 * k, '#ffffff'); L('กลุ่มเป้าหมายระดับสูง', H * .74, 92 * k, '#ff4a5a'); } }
  else if (mode === 'punish' || mode === 'destroy') { const m_ = Math.floor(a / 60), s_ = Math.floor(a % 60); L(mode === 'punish' ? 'ระบบลงโทษห้องหมายเลข 07' : 'เริ่มกระบวนการทำลายพื้นที่ทดลอง', H * .24, 64 * k, '#ffffff'); L(String(m_).padStart(2, '0') + ':' + String(s_).padStart(2, '0'), H * .58, 190 * k, '#ff4a5a'); L(mode === 'punish' ? 'ก่อนปีศาจบุกเข้ามา' : 'นับถอยหลัง', H * .85, 56 * k, '#ffd24a'); }
  else if (mode === 'locked') { x.strokeStyle = '#ff4a5a'; x.lineWidth = 14 * k; x.beginPath(); x.arc(W / 2, H * .3, 50 * k, Math.PI, 0); x.stroke(); x.fillStyle = '#ff4a5a'; x.fillRect(W / 2 - 75 * k, H * .3, 150 * k, 110 * k); L('ประตูถูกล็อก', H * .72, 100 * k, '#ffffff'); L('ระบบรักษาความปลอดภัย', H * .88, 50 * k, '#ff4a5a'); }
  else if (mode === 'map') { x.strokeStyle = '#6ad0ff'; x.lineWidth = 5 * k; for (let i = 0; i < 4; i++) x.strokeRect(W * .15, H * (.12 + i * .2), W * .7, H * .16); x.setLineDash([16, 12]); x.strokeStyle = '#ffd24a'; x.lineWidth = 8 * k; x.beginPath(); x.moveTo(W * .3, H * .2); x.lineTo(W * .3, H * .86); x.lineTo(W * .7, H * .86); x.stroke(); x.setLineDash([]); x.fillStyle = '#ff4a5a'; x.beginPath(); x.arc(W * .7, H * .86, 18 * k, 0, 7); x.fill(); L('ห้องทดลอง B3', H * .95, 40 * k, '#ffd24a'); }
  else if (mode === 'origin') { L('ตรวจพบพลังต้นกำเนิด', H * .22, 88 * k, '#ffd24a'); if (a) { L('ความสามารถที่แท้จริง', H * .48, 60 * k, '#ffffff'); L('คัดลอก + เชื่อมโยง', H * .72, 104 * k, '#6aff9a'); } }
  else if (mode === 'dir') { x.fillStyle = '#101018'; x.fillRect(20, 20, W - 40, H - 40); x.fillStyle = '#26262e'; x.beginPath(); x.ellipse(W / 2, H * 1.02, W * .28, H * .36, 0, 0, 7); x.fill(); x.fillStyle = '#f7f2e8'; x.strokeStyle = '#1c1420'; x.lineWidth = 12; x.beginPath(); x.arc(W / 2, H * .55, H * .26, 0, 7); x.fill(); x.stroke();
    x.fillStyle = '#f4f2ec'; x.beginPath(); x.ellipse(W / 2, H * .33, H * .42, H * .06, 0, 0, 7); x.fill(); x.stroke(); x.fillRect(W / 2 - H * .24, H * .1, H * .48, H * .22); x.strokeRect(W / 2 - H * .24, H * .1, H * .48, H * .22); x.fillStyle = '#26262e'; x.fillRect(W / 2 - H * .24, H * .25, H * .48, H * .06);
    x.fillStyle = '#1c1420'; x.fillRect(W / 2 - 70, H * .53, 36, 10); x.fillRect(W / 2 + 34, H * .53, 36, 10); x.lineWidth = 9; x.beginPath(); if (a) { x.arc(W / 2, H * .64, 46, .1, Math.PI - .1); x.fillStyle = '#5a1a2a'; x.fill(); } else x.arc(W / 2, H * .6, 50, .5, Math.PI - .5); x.stroke(); }
  else if (mode === 'final') { L('การทดสอบสุดท้าย', H * .32, 110 * k, '#ffd24a'); if (a) { L('หยุดออริจินให้ได้', H * .58, 76 * k, '#ffffff'); L('= อิสรภาพ', H * .8, 76 * k, '#6aff9a'); } }
  else if (mode === 'odata') { L('ORIGIN', H * .2, 110 * k, '#b06aff'); L('จุดอ่อน: ไม่พบ', H * .48, 80 * k, '#ff4a5a'); if (a) { L('พลังงานเข้า: หินพลังทั้งเมือง', H * .74, 56 * k, '#ffd24a'); } }
  else if (mode === 'phase1') { L('การทดสอบระยะที่ 1', H * .22, 84 * k, '#ffffff'); L('เสร็จสมบูรณ์', H * .44, 96 * k, '#6aff9a'); if (a) { L('มนุษย์ 4 คน', H * .68, 84 * k, '#ffd24a'); L('ผ่านการคัดเลือก', H * .86, 64 * k, '#ffffff'); } }
  else if (mode === 'glitch') { const r = rng(a + 1); for (let i = 0; i < 30; i++) { x.fillStyle = `rgba(${200 + r() * 55 | 0},${r() * 80 | 0},${r() * 120 | 0},${.3 + r() * .5})`; x.fillRect(r() * W, r() * H, 40 + r() * 300, 6 + r() * 30); } }
}
let _sk = ''; export function screen(mode, a = 0, b = 0, glow = .45) { const key = mode + '|' + a + '|' + b; XA.scrGlow.material.opacity = mode === 'off' ? 0 : glow; XA.scrGlow.material.color.set(/red|traitor|warn|detect|target|punish|locked|destroy/.test(mode) ? '#ff4a5a' : '#6ad0ff'); if (key === _sk) return; _sk = key; panel(XA.scrTex.userData.ctx, 1024, 576, mode, a, b); XA.scrTex.needsUpdate = true; }
screen('off');
// ---------- camera-attached UI window + flash + black ----------
scene.add(camera); XA.ui = group({ parent: camera }); XA.uiTex = tx(1024, 640, () => { });
{ const m = basic('#ffffff', { map: XA.uiTex, transparent: true, depthWrite: false, depthTest: false, fog: false, noInk: true }); m.depthTest = false; m.userData.noInk = true; XA.uiM = m; const p = mesh(new THREE.PlaneGeometry(1, .625), m, { parent: XA.ui, cast: false, recv: false }); p.renderOrder = 50; p.userData.noInk = true; }
XA.flash = glowSprite('#ffffff', 6, { opacity: 0 }); XA.flash.material.depthTest = false; XA.flash.renderOrder = 60; XA.flash.position.set(0, 0, -1); camera.add(XA.flash);
XA.black = mesh(new THREE.PlaneGeometry(4, 4), basic('#000000', { transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false, noInk: true }), { parent: camera, cast: false, recv: false }); XA.black.material.userData.noInk = true; XA.black.userData.noInk = true; XA.black.position.z = -.6; XA.black.renderOrder = 70;
XA.redM = mesh(new THREE.PlaneGeometry(4, 4), basic('#ff1a2a', { transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false, noInk: true, add: true }), { parent: camera, cast: false, recv: false }); XA.redM.material.userData.noInk = true; XA.redM.userData.noInk = true; XA.redM.position.z = -.61; XA.redM.renderOrder = 65;
let _uk = ''; export function drawUI(mode, a = 0, b = 0) { const key = mode + '|' + a + '|' + b; if (key === _uk) return; _uk = key; const x = XA.uiTex.userData.ctx; x.save(); x.beginPath(); x.roundRect(0, 0, 1024, 640, 40); x.clip(); panel(x, 1024, 640, mode, a, b); x.restore(); XA.uiTex.needsUpdate = true; }
export function uiAt(k, mode, a, b, z = -1.4, y = .05) { XA.ui.visible = k > .01; if (!XA.ui.visible) return; drawUI(mode, a, b); XA.ui.position.set(0, y, z); XA.ui.scale.setScalar(.25 + .35 * k); XA.uiM.opacity = Math.min(1, k) * .95; }
export function flash(k) { XA.flash.material.opacity = k; XA.flash.scale.setScalar(6); }
export function black(k) { XA.black.material.opacity = k; XA.black.visible = k > .001; }
export function redTint(k) { XA.redM.material.opacity = k; XA.redM.visible = k > .001; }
export function hideSea3() { sea.visible = false; seaFar.visible = false; WAVE.amp = 0; }
export function setScene(which) { SC.visible = which === 'sc'; CT.visible = CR.visible = which === 'ct'; clouds.visible = which !== 'none'; }
function hideProps() { for (const o of [...XA.helis, ...XA.desks, ...XA.ropes, ...XA.stones, XA.mon, XA.boom, XA.syr, XA.ball, XA.gadget, XA.comm]) { if (o.parent !== scene) scene.add(o); o.visible = false; o.position.set(0, -80, 0); o.rotation.set(0, 0, 0); o.scale.setScalar(1); }
  XA.roomDesks.visible = true; XA.rubble.visible = false; XA.doorP.rotation.y = 0; screen('off'); black(0); redTint(0); }
// ---------- ep3+: billboards on nearby towers (mirror the wall screen), gravity auras, sound rings, a stone pile ----------
XA.bills = group({ parent: CT }); XA.bills.visible = false;
for (const [x, z] of [[0, -30], [30, 0], [-30, 0], [30, -30], [-30, -30], [0, 30], [30, 30], [-30, 30]]) { const T = Object.values(XA.towers).find(t => t.x === x && t.z === z); if (!T || !T.g) continue;
  const y = Math.max(-30, T.top - 9), dx = -Math.sign(x), dz = -Math.sign(z); const w = 9, h = 5.1; T.by = y;
  const fr = mesh(rbox(w + .6, h + .6, .4), toon('#2a2a32'), { parent: XA.bills }); const sp = mesh(new THREE.PlaneGeometry(w, h), XA.scrM, { parent: XA.bills, cast: false }); sp.userData.noInk = true;
  if (dz && !dx) { fr.position.set(x, y, z + dz * (T.d / 2 + .25)); sp.position.set(x, y, z + dz * (T.d / 2 + .46)); if (dz < 0) { sp.rotation.y = Math.PI; } }
  else { const sx = dx; fr.position.set(x + sx * (T.w / 2 + .25), y, z + (dz ? dz * 2 : 0)); fr.rotation.y = Math.PI / 2; sp.position.set(x + sx * (T.w / 2 + .46), y, z + (dz ? dz * 2 : 0)); sp.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2; } }
XA.auras = [0, 1, 2, 3].map(() => { const s = glowSprite('#b06aff', 2, { opacity: 0, fog: false }); scene.add(s); return s; });
export function auraAt(i, p, size, k) { const a = XA.auras[i]; a.visible = k > .01; a.position.set(...p); a.scale.setScalar(size); a.material.opacity = k; }
XA.rings = [0, 1, 2].map(() => { const m = mesh(new THREE.TorusGeometry(1, .015, 6, 40), basic('#6ad0ff', { transparent: true, opacity: 0, noInk: true, add: true }), { parent: scene, cast: false, recv: false }); m.material.userData.noInk = true; m.userData.noInk = true; return m; });
export function ringsAt(p, t, k = 1, face = 0) { XA.rings.forEach((r, i) => { const u = ((t * 1.4 + i / 3) % 1); r.visible = k > 0; r.position.set(...p); r.rotation.set(0, face * D2R, 0); r.scale.setScalar(.1 + u * 1.6); r.material.opacity = (1 - u) * .8 * k; }); }
XA.pile = group({ parent: scene }); { const r = rng(41), cols = ['#ff5a4a', '#4aa8ff', '#ffd23a', '#b06aff', '#5af0a0']; for (let i = 0; i < 14; i++) { const c = cols[i % 5]; const m = mesh(new THREE.OctahedronGeometry(.11, 0), toon(c, { emissive: c, ei: .5 }), { p: [(r() - .5) * .9, .1 + r() * .25, (r() - .5) * .6], s: [1, 1.5, 1], r: [r() * 40, r() * 90, r() * 40], parent: XA.pile }); } const g = glowSprite('#ffe0a0', 2.4, { opacity: .5, fog: false }); g.position.y = .3; XA.pile.add(g); }
const _hp = hideProps; export function hideProps2() { _hp(); XA.bills.visible = false; XA.auras.forEach(a => { a.visible = false; }); XA.rings.forEach(r => { r.visible = false; }); XA.pile.visible = false; XA.pile.position.set(0, -80, 0); XA.roomDesks.children.forEach(d => { d.position.y = 0; d.rotation.set(0, 0, 0); }); }
{ // a short corridor outside the classroom door (x 5.3..7.5)
  const cm = toon('#cfd6c8'); mesh(rbox(2.4, .1, 6), toon('#a8a49c'), { p: [6.4, -.05, 3.2], parent: CR, cast: false }); mesh(rbox(.2, 3.6, 6), cm, { p: [7.5, 1.8, 3.2], parent: CR }); mesh(rbox(2.4, 3.6, .2), cm, { p: [6.4, 1.8, .3], parent: CR }); mesh(rbox(2.4, 3.6, .2), cm, { p: [6.4, 1.8, 6.1], parent: CR }); mesh(rbox(2.4, .2, 6), toon('#f0ece4'), { p: [6.4, 3.7, 3.2], parent: CR, cast: false });
  mesh(rbox(.05, .9, 1.4), toon('#ffffff', { emissive: '#fff4d8', ei: .4 }), { p: [7.38, 2.0, 3.4], parent: CR, cast: false }); }
XA.prints = group({ parent: CT }); XA.prints.visible = false; { const pm = basic('#2a2632', { transparent: true, opacity: .55, noInk: true, depthWrite: false }); pm.userData.noInk = true; for (const [x, z, r] of [[12, 2, 10], [17, -6, -8], [13, -14, 12]]) { const m = mesh(new THREE.CircleGeometry(1, 20), pm, { r: [-90, 0, r], p: [x, -39.97, z], s: [1.9, 3.2, 1], parent: XA.prints, cast: false, recv: false }); m.userData.noInk = true; } }
XA.sparks = [0, 1, 2].map(i => { const s = glowSprite(['#ff5a4a', '#4aa8ff', '#ffd23a'][i], 6, { opacity: 0, fog: false }); scene.add(s); return s; });
export function towerFall(n, k) { const T = XA.towers[n]; if (!T || !T.g) return; T.g.position.y = -40 - k * (T.top + 40) * 1.02; T.g.rotation.set(k * .05, 0, k * .08); }
const _hp2 = hideProps2; export function hideProps3() { _hp2(); XA.prints.visible = false; XA.sparks.forEach(s => { s.visible = false; }); Object.values(XA.towers).forEach(T => { if (T.g) { T.g.position.y = -40; T.g.rotation.set(0, 0, 0); } }); if (XA.ep2Hide) XA.ep2Hide(); if (XA.ep6Hide) XA.ep6Hide(); }

// ---------- ep2: rock wall, scrap metal (shield / gadget), speed streaks, analysis reticle + predicted-path dots ----------
XA.rwall = group({ parent: CR }); { const r = rng(23), rm = toon('#7a6a5a'), rm2 = toon('#8f7f6a'); for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) { const w = .45 + r() * .25, h = .5 + r() * .25; mesh(new THREE.DodecahedronGeometry(.32 + r() * .1, 0), (i + j) % 2 ? rm : rm2, { p: [(i - 4) * .36 + (r() - .5) * .08, .25 + j * .5 + (r() - .5) * .1, (r() - .5) * .14], s: [w * 2.2, h * 2.0, .9], r: [r() * 30, r() * 60, r() * 30], parent: XA.rwall }); } }
export function rwallAt(p, ry, k) { const w = XA.rwall; w.visible = k > .01; w.position.set(...p); w.rotation.set(0, ry * D2R, k < 1 ? (1 - k) * .05 * Math.sin(k * 60) : 0); w.scale.set(1, Math.max(.01, k), 1); w.position.y = p[1] - (1 - k) * .8; }
XA.scrap = group({ parent: scene }); XA.scrapP = []; { const r = rng(31), mm = [toon('#8a909a'), toon('#a8aeb6'), toon('#6a6e76'), toon('#b88a5a')];
  for (let i = 0; i < 16; i++) { const geo = i % 3 === 0 ? rbox(.22, .16, .03) : i % 3 === 1 ? new THREE.CylinderGeometry(.03, .03, .26, 6) : rbox(.18, .05, .05); const m = mesh(geo, mm[i % 4], { parent: XA.scrap });
    const a = i / 16 * Math.PI * 2, rr = i < 8 ? .2 : .38; XA.scrapP.push({ m, from: [(r() - .5) * 2.4, .05, (r() - .5) * 2.4], fr: [r() * 3, r() * 3, r() * 3], to: [Math.cos(a * 2) * rr, Math.sin(a * 2) * rr, 0], tr: [0, 0, a * 2] }); } }
export function scrapAt(p, ry, k, t, scl = 1, fy = -4) { const g = XA.scrap; g.visible = true; g.position.set(...p); g.rotation.set(0, ry * D2R, 0); g.scale.setScalar(scl);
  XA.scrapP.forEach((q, i) => { const u = clamp(k * 1.6 - i * .04); const e = u * u * (3 - 2 * u), hop = Math.sin(u * Math.PI) * .5; q.m.position.set(lerp(q.from[0] / scl, q.to[0], e), lerp((fy + .05 - p[1]) / scl, q.to[1], e) + hop, lerp(q.from[2] / scl, q.to[2], e)); q.m.rotation.set(lerp(q.fr[0], q.tr[0], e) + (1 - e) * t * 3, lerp(q.fr[1], q.tr[1], e), lerp(q.fr[2], q.tr[2], e)); }); }
XA.streaks = [0, 1, 2, 3].map(() => { const m = mesh(new THREE.PlaneGeometry(1, .06), basic('#5affa0', { transparent: true, opacity: 0, noInk: true, add: true, depthWrite: false }), { parent: scene, cast: false, recv: false }); m.material.userData.noInk = true; m.userData.noInk = true; return m; });
export function streakAt(i, p, ry, len, k) { const s = XA.streaks[i]; s.visible = k > .01; s.position.set(...p); s.rotation.set(0, ry * D2R, 0); s.scale.set(len, 1, 1); s.material.opacity = k; }
XA.ret = group({ parent: scene }); { const rm = basic('#ff3a4a', { transparent: true, opacity: .9, noInk: true, add: true, depthWrite: false }); rm.userData.noInk = true; XA.retM = rm; const t1 = mesh(new THREE.TorusGeometry(.5, .025, 6, 40), rm, { parent: XA.ret, cast: false, recv: false }); t1.userData.noInk = true; const t2 = mesh(new THREE.TorusGeometry(.3, .015, 6, 40), rm, { parent: XA.ret, cast: false, recv: false }); t2.userData.noInk = true; XA.retIn = t2;
  for (let i = 0; i < 4; i++) { const b = mesh(new THREE.PlaneGeometry(.22, .035), rm, { parent: XA.ret, cast: false, recv: false }); b.userData.noInk = true; const a = i * Math.PI / 2; b.position.set(Math.cos(a) * .62, Math.sin(a) * .62, 0); b.rotation.z = a; } }
export function retAt(p, s, k, t, flat = false, col = '#ff3a4a') { const g = XA.ret; g.visible = k > .01; if (!g.visible) return; g.position.set(...p); g.rotation.set(flat ? -Math.PI / 2 : 0, 0, t * .8); g.scale.setScalar(s * (1 + (1 - Math.min(1, k)) * 1.5)); XA.retM.opacity = Math.min(1, k) * .9; XA.retM.color.set(col); XA.retIn.scale.setScalar(1 + .15 * Math.sin(t * 8)); if (!flat) { scene.updateMatrixWorld(); g.quaternion.copy(camera.quaternion); g.rotateZ(t * .8); } }
XA.dots = [0, 1, 2, 3, 4, 5, 6, 7].map(() => { const s = glowSprite('#6ad0ff', .22, { opacity: 0, fog: false }); scene.add(s); return s; });
export function dotsAt(pts, k, t) { XA.dots.forEach((d, i) => { const q = pts[i]; d.visible = !!q && k > .01; if (!d.visible) return; d.position.set(...q); d.material.opacity = k * (.5 + .5 * Math.sin(t * 6 - i * .8)); }); }
export function auraCol(i, c) { XA.auras[i].material.color.set(c); }
XA.ep2Hide = () => { XA.rwall.visible = false; XA.scrap.visible = false; XA.streaks.forEach(s => { s.visible = false; }); XA.ret.visible = false; XA.dots.forEach(d => { d.visible = false; }); XA.auras.forEach(a => a.material.color.set('#b06aff')); };

// ======================= ep6-8: floor hatch, underground lab + control room (FAC, z 300), origin, energy wall, pillars, spaceship, link beams =======================
const addM = (c, o = .8) => { const m = basic(c, { transparent: true, opacity: o, noInk: true, add: true, depthWrite: false }); m.userData.noInk = true; return m; };
const noI = (m) => { m.userData.noInk = true; return m; };
// --- hatch in classroom 07 floor ---
XA.hatch = group({ p: [2.0, 0, -3.3], parent: CR }); { noI(mesh(new THREE.PlaneGeometry(1.2, 1.2), basic('#050608', { noInk: true }), { r: [-90, 0, 0], p: [0, .012, 0], parent: XA.hatch, cast: false }));
  XA.hatchLid = group({ p: [-.6, .02, 0], parent: XA.hatch }); mesh(rbox(1.2, .05, 1.2), toon('#8a8478'), { p: [.6, 0, 0], parent: XA.hatchLid }); mesh(rbox(.3, .03, .06), toon('#4a4a52'), { p: [1.0, .04, 0], parent: XA.hatchLid });
  XA.labTex = tx(1024, 576, () => { }); XA.mapP = mesh(new THREE.PlaneGeometry(1.4, .79), (() => { const m = basic('#ffffff', { map: XA.labTex, transparent: true, opacity: .9, noInk: true, add: true, depthWrite: false }); m.userData.noInk = true; return m; })(), { p: [0, 1.0, 0], parent: XA.hatch, cast: false }); XA.mapP.userData.noInk = true;
  XA.hatchGlow = glowSprite('#6ad0ff', 2.2, { opacity: 0 }); XA.hatchGlow.position.y = .3; XA.hatch.add(XA.hatchGlow); }
let _lk = ''; export function labScreen(mode, a = 0, b = 0) { const key = mode + '|' + a + '|' + b; if (key === _lk) return; _lk = key; panel(XA.labTex.userData.ctx, 1024, 576, mode, a, b); XA.labTex.needsUpdate = true; }
export function hatchAt(open, map = 0, ry = 0) { XA.hatch.visible = true; XA.hatchLid.rotation.z = open * 1.9; XA.hatchGlow.material.opacity = open * .5; XA.mapP.visible = map > .01; XA.mapP.material.opacity = map * .9; XA.mapP.scale.setScalar(.3 + .7 * map); XA.mapP.rotation.y = ry * D2R; if (map > .01) labScreen('map'); }
// --- facility: lab at FAC origin (x -8..8, z -6..6, ceiling 4.5), control room at FAC x 30 (x 23..37, z -6..6), corridor x 37.5..41 ---
export const FAC = group({ p: [0, 0, 300], parent: scene }); FAC.visible = false; XA.labStones = [];
{ const fl = tx(256, 256, (x, w, h) => { x.fillStyle = '#3a3e44'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = 4; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke(); } }, { repeat: [12, 4] });
  mesh(new THREE.PlaneGeometry(60, 16), toon('#ffffff', { map: fl }), { r: [-90, 0, 0], p: [16, 0, 0], parent: FAC, cast: false }); mesh(rbox(60, .3, 16), toon('#2a2c32'), { p: [16, 4.65, 0], parent: FAC, cast: false });
  const wm = toon('#4a5a54'), wm2 = toon('#3c4650'); const Wl = (p, sz, m = wm) => mesh(rbox(...sz), m, { p, parent: FAC });
  Wl([0, 2.25, -6.15], [16.6, 4.5, .3]); Wl([0, 2.25, 6.15], [16.6, 4.5, .3]); Wl([-8.15, 2.25, 0], [.3, 4.5, 12.6]); Wl([8.15, 2.25, 0], [.3, 4.5, 12.6]);
  Wl([30, 2.25, -6.15], [14.6, 4.5, .3], wm2); Wl([30, 2.25, 6.15], [14.6, 4.5, .3], wm2); Wl([22.85, 2.25, 0], [.3, 4.5, 12.6], wm2); Wl([37.15, 2.25, -3.7], [.3, 4.5, 4.9], wm2); Wl([37.15, 2.25, 3.7], [.3, 4.5, 4.9], wm2); Wl([37.15, 3.85, 0], [.3, 1.3, 2.6], wm2);
  Wl([41.2, 2.25, 0], [.3, 4.5, 12.6], wm2); Wl([39.2, 2.25, -6.15], [4.2, 4.5, .3], wm2);
  for (const x of [-6, -2, 2, 6]) cylBetween([x, 4.3, -6], [x, 4.3, 6], .12, toon('#6a6e76'), FAC, 6); cylBetween([-8, 3.9, -5.6], [8, 3.9, -5.6], .2, toon('#7a5a3a'), FAC, 8);
  for (const [x, z] of [[-4, 0], [4, 0], [30, 0]]) { mesh(rbox(1.6, .05, .5), toon('#fffaf0', { emissive: '#d0ffe8', ei: .7 }), { p: [x, 4.45, z], parent: FAC, cast: false }); }
  // shelves with stones along the lab's back and side walls
  const cols = ['#ff5a4a', '#4aa8ff', '#ffd23a', '#b06aff', '#3af08a']; const r = rng(61); const shelf = toon('#6a6458');
  for (const [x0, z0, ry] of [[-5, -5.6, 0], [0, -5.6, 0], [5, -5.6, 0], [-7.6, -2, 90], [-7.6, 2.5, 90], [7.6, -2, -90], [7.6, 2.5, -90]]) { const g = group({ p: [x0, 0, z0], r: [0, ry, 0], parent: FAC });
    for (let k = 0; k < 4; k++) mesh(rbox(3.4, .08, .7), shelf, { p: [0, .3 + k * .9, 0], parent: g }); mesh(rbox(.08, 3.3, .7), shelf, { p: [-1.7, 1.65, 0], parent: g }); mesh(rbox(.08, 3.3, .7), shelf, { p: [1.7, 1.65, 0], parent: g });
    for (let k = 0; k < 4; k++) for (let q = 0; q < 5; q++) { if (r() < .25) continue; const c = cols[(r() * 5) | 0]; const m = mesh(new THREE.OctahedronGeometry(.11, 0), toon(c, { emissive: c, ei: .6 }), { p: [-1.4 + q * .7, .5 + k * .9, 0], s: [1, 1.5, 1], parent: g, cast: false }); XA.labStones.push(m); } }
  // glass tanks with big stones
  const gm = basic('#9adcd0', { transparent: true, opacity: .22, noInk: true, depthWrite: false }); gm.userData.noInk = true;
  for (const [x, z, c] of [[-5, 3.6, '#ff5a4a'], [5, 3.6, '#3af08a'], [-5.5, -2.8, '#ffd23a'], [5.5, -2.8, '#4aa8ff']]) { mesh(new THREE.CylinderGeometry(.75, .75, .3, 16), toon('#4a4e56'), { p: [x, .15, z], parent: FAC }); noI(mesh(new THREE.CylinderGeometry(.7, .7, 2.4, 16, 1, true), gm, { p: [x, 1.5, z], parent: FAC, cast: false })); mesh(new THREE.CylinderGeometry(.75, .75, .2, 16), toon('#4a4e56'), { p: [x, 2.8, z], parent: FAC });
    mesh(new THREE.OctahedronGeometry(.32, 0), toon(c, { emissive: c, ei: .7 }), { p: [x, 1.5, z], s: [1, 1.5, 1], parent: FAC, cast: false }); const gl = glowSprite(c, 2.2, { opacity: .35 }); gl.position.set(x, 1.5, z); FAC.add(gl); }
  // the ladder from the hatch (lab corner)
  for (let k = 0; k < 9; k++) cylBetween([-7.2, .3 + k * .48, -4.6], [-6.4, .3 + k * .48, -4.6], .03, toon('#8a8a90'), FAC, 4); cylBetween([-7.2, 0, -4.6], [-7.2, 4.5, -4.6], .05, toon('#8a8a90'), FAC, 4); cylBetween([-6.4, 0, -4.6], [-6.4, 4.5, -4.6], .05, toon('#8a8a90'), FAC, 4);
  noI(mesh(new THREE.PlaneGeometry(1.4, 1.4), basic('#6ad0ff', { noInk: true }), { r: [90, 0, 0], p: [-6.8, 4.48, -4.6], parent: FAC, cast: false }));
  // centre: pedestal + the floating black core
  mesh(new THREE.CylinderGeometry(1.1, 1.4, .5, 8), toon('#3a3640'), { p: [0, .25, 0], parent: FAC }); XA.coreRing = noI(mesh(new THREE.TorusGeometry(1.25, .04, 6, 40), addM('#b06aff', .7), { r: [-90, 0, 0], p: [0, .52, 0], parent: FAC, cast: false }));
  XA.core = group({ p: [0, 1.7, 0], parent: FAC }); mesh(new THREE.OctahedronGeometry(.45, 0), toon('#0e0c14', { emissive: '#2a0a3a', ei: .6 }), { s: [1, 1.5, 1], parent: XA.core }); XA.coreGl = glowSprite('#8a4aff', 3.5, { opacity: .45 }); XA.core.add(XA.coreGl);
  // old monitor on the lab wall
  mesh(rbox(3.4, 2.0, .12), toon('#2a2a32'), { p: [0, 2.6, -5.9], parent: FAC }); noI(mesh(new THREE.PlaneGeometry(3.1, 1.75), noI(basic('#ffffff', { map: XA.labTex, noInk: true })), { p: [0, 2.6, -5.83], parent: FAC, cast: false }));
  // control room: monitor wall + big screen (mirrors the classroom screen) + consoles; the heavy door on x 37
  const mon = tx(256, 160, (x, w, h) => { x.fillStyle = '#0a1640'; x.fillRect(0, 0, w, h); x.strokeStyle = '#6ad0ff'; x.lineWidth = 3; const q = rng(5); for (let i = 0; i < 8; i++) { x.strokeRect(q() * w * .7, q() * h * .7, 20 + q() * 60, 14 + q() * 40); } x.fillStyle = '#ffd24a'; for (let i = 0; i < 6; i++) x.fillRect(q() * w, q() * h, 6, 6); });
  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { if (i >= 2 && i <= 3 && j < 2) continue; mesh(rbox(1.9, 1.15, .1), toon('#1a1a22'), { p: [24.8 + i * 2.05, .9 + j * 1.25, -5.9], parent: FAC }); noI(mesh(new THREE.PlaneGeometry(1.75, 1.0), noI(basic('#ffffff', { map: mon, noInk: true })), { p: [24.8 + i * 2.05, .9 + j * 1.25, -5.84], parent: FAC, cast: false })); }
  mesh(rbox(4.2, 2.5, .12), toon('#1a1a22'), { p: [30, 1.6, -5.88], parent: FAC }); noI(mesh(new THREE.PlaneGeometry(4.0, 2.25), XA.scrM, { p: [30, 1.6, -5.8], parent: FAC, cast: false }));
  for (const x of [26, 30, 34]) { mesh(rbox(2.6, .9, .9), toon('#3a3e48'), { p: [x, .45, -2.6], parent: FAC }); noI(mesh(new THREE.PlaneGeometry(2.3, .5), noI(basic('#ffffff', { map: mon, noInk: true })), { r: [-50, 0, 0], p: [x, .93, -2.6], parent: FAC, cast: false })); }
  XA.cdoor = group({ p: [37.15, 0, 0], parent: FAC }); for (const s of [-1, 1]) mesh(rbox(.25, 3.2, 1.3), toon('#6a7080'), { p: [0, 1.6, s * .65], parent: XA.cdoor }); mesh(rbox(.3, .2, 2.6), toon('#f2c230'), { p: [0, 1.6, 0], parent: XA.cdoor });
  XA.cpanel = group({ p: [41.0, 1.3, -2.5], parent: FAC }); mesh(rbox(.12, .9, .7), toon('#3a3e48'), { parent: XA.cpanel }); noI(mesh(new THREE.PlaneGeometry(.55, .4), noI(basic('#ffffff', { map: mon, noInk: true })), { r: [0, -90, 0], p: [-.07, .1, 0], parent: XA.cpanel, cast: false })); XA.cpanelGl = glowSprite('#ffd23a', 1.4, { opacity: 0 }); XA.cpanelGl.position.x = -.3; XA.cpanel.add(XA.cpanelGl); }
export function coreAt(t, k = 1) { XA.core.visible = true; XA.core.position.y = 1.7 + .1 * Math.sin(t * 1.4); XA.core.rotation.y = t * .6; XA.coreGl.material.opacity = .35 * k + .1 * Math.sin(t * 3); XA.coreGl.scale.setScalar(3 + 1.5 * k); XA.coreRing.material.opacity = .5 * k; }
export function doorBreak(k) { XA.cdoor.children.forEach((c, i) => { if (i < 2) { c.position.x = k * (2.5 + i); c.position.y = 1.6 - k * 1.2; c.rotation.set(k * (i ? .9 : -.7), 0, k * 1.4); } else c.visible = k < .1; }); }
// --- origin: a crystal titan at the north end of the street x 15 (city coords), standing on ground y -40 ---
XA.origin = group({ parent: CT }); XA.origin.visible = false;
{ const O = XA.origin, m = toon('#1c1428', { emissive: '#120a20', ei: .5 }), d = toon('#120c1c'); const body = group({ p: [0, 0, 0], parent: O }); XA.oBody = body;
  mesh(new THREE.SphereGeometry(22, 20, 14), m, { p: [0, 34, 0], s: [1.2, 1.1, 1], parent: body }); mesh(new THREE.SphereGeometry(16, 18, 12), m, { p: [0, 58, -6], s: [1.1, .9, 1], parent: body });
  for (const s of [-1, 1]) { cylBetween([s * 20, 40, -4], [s * 30, 6, -12], 4.5, m, body, 10); mesh(new THREE.SphereGeometry(6, 12, 8), d, { p: [s * 30, 4, -14], parent: body }); cylBetween([s * 10, 14, 0], [s * 13, 0, 0], 6, d, body, 10); }
  const cr = ['#ff5a4a', '#3af08a', '#ffd23a', '#4aa8ff', '#b06aff']; const r = rng(71); XA.oCrystals = [];
  for (let i = 0; i < 26; i++) { const a = (r() - .5) * 2.6, h = 30 + r() * 34, c = cr[i % 5]; const cm = toon(c, { emissive: c, ei: .5, unique: true }); const mm = mesh(new THREE.OctahedronGeometry(2.4 + r() * 3, 0), cm, { p: [Math.sin(a) * 18, h, Math.cos(a) * 16 + 6], s: [1, 2.4, 1], r: [r() * 40 - 20, r() * 90, r() * 40 - 20], parent: body, cast: false }); XA.oCrystals.push(cm); }
  XA.oEyes = []; for (const [x, y, sz] of [[-7, 60, 3.4], [7, 60, 3.4], [0, 67, 2.6]]) { const g = group({ p: [x, y, -19.5], parent: body }); mesh(new THREE.SphereGeometry(sz, 16, 10), toon('#e8f4ff', { emissive: '#bfe8ff', ei: 1.2 }), { s: [1.3, 1, .4], parent: g, cast: false }); const lid = mesh(new THREE.SphereGeometry(sz * 1.08, 16, 10), d, { s: [1.35, 1.05, .5], p: [0, 0, -.1], parent: g, cast: false }); const gl = glowSprite('#9ad8ff', sz * 9, { opacity: 0 }); gl.position.z = -2; g.add(gl); XA.oEyes.push({ g, lid, gl }); }
  XA.oGlow = glowSprite('#b06aff', 120, { opacity: 0 }); XA.oGlow.position.set(0, 45, 0); O.add(XA.oGlow); }
XA.motes = Array.from({ length: 40 }, (_, i) => { const s = glowSprite(['#ff5a4a', '#3af08a', '#ffd23a', '#4aa8ff', '#b06aff'][i % 5], 4, { opacity: 0 }); CT.add(s); return s; });
export function originAt(p, ry, eye, t, o = {}) { const O = XA.origin; O.visible = true; const dk = o.dis || 0; O.position.set(p[0], p[1] - dk * 30, p[2]); O.rotation.set(0, ry * D2R, 0); O.scale.setScalar((o.s || 1) * (1 - dk * .55));
  XA.oBody.rotation.set(.12 + Math.sin(t * .5) * .02 + (o.lean || 0), 0, Math.sin(t * .3) * .02);
  XA.oEyes.forEach(e => { const k = Math.min(1, eye); e.lid.scale.y = 1.05 * (1 - k); e.lid.visible = k < .98; e.gl.material.opacity = k * .6 * (1 - dk); });
  XA.oCrystals.forEach((m, i) => { m.emissiveIntensity = (.35 + (o.drain || 0) * (.6 + .4 * Math.sin(t * 6 + i))) * (1 - dk); }); XA.oGlow.material.opacity = ((o.drain || 0) * .25 + eye * .08) * (1 - dk);
  XA.motes.forEach((s, i) => { const q = (i * 37 % 40) / 40, u = (t * .25 + q) % 1; s.visible = dk > .01; s.position.set(p[0] + Math.sin(i * 2.3) * 30 * (1 + u), p[1] + 10 + u * 90 + q * 30, p[2] + Math.cos(i * 1.7) * 20); s.material.opacity = dk * (1 - u) * .8; s.scale.setScalar(4 + q * 6); }); }
// --- energy wall around the city (radius 135) ---
{ const hx = tx(256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#ffffff'; x.lineWidth = 3; const R = 32; for (let j = -1; j < 6; j++) for (let i = -1; i < 6; i++) { const cx = i * R * 1.5, cy = j * R * 1.732 + (i % 2 ? R * .866 : 0); x.beginPath(); for (let a = 0; a < 7; a++) x.lineTo(cx + R * Math.cos(a * Math.PI / 3), cy + R * Math.sin(a * Math.PI / 3)); x.stroke(); } }, { repeat: [40, 6] });
  const m = basic('#5ad0ff', { map: hx, transparent: true, opacity: 0, noInk: true, add: true, depthWrite: false }); m.side = THREE.DoubleSide; m.userData.noInk = true; m.fog = false;
  XA.ewall = noI(mesh(new THREE.CylinderGeometry(135, 135, 240, 64, 1, true), m, { p: [0, 80, 0], parent: CT, cast: false, recv: false })); XA.ewall.visible = false;
  const m2 = basic('#5ad0ff', { transparent: true, opacity: 0, noInk: true, add: true, depthWrite: false }); m2.side = THREE.DoubleSide; m2.userData.noInk = true; m2.fog = false; XA.ewall2 = noI(mesh(new THREE.CylinderGeometry(134.5, 134.5, 240, 64, 1, true), m2, { p: [0, 80, 0], parent: CT, cast: false, recv: false })); XA.ewall2.visible = false; }
export function ewallAt(k, t) { XA.ewall.visible = XA.ewall2.visible = k > .01; XA.ewall.material.opacity = k * (.55 + .15 * Math.sin(t * 3)); XA.ewall2.material.opacity = k * .12; XA.ewall.material.map.offset.y = t * .03; }
// --- exit gate (north, at the wall on street x 15) ---
XA.gate = group({ p: [15, -40, -134], parent: CT }); { const gm = toon('#3a3e48'); mesh(rbox(5, 30, 5), gm, { p: [-11, 15, 0], parent: XA.gate }); mesh(rbox(5, 30, 5), gm, { p: [11, 15, 0], parent: XA.gate }); mesh(rbox(27, 5, 5), gm, { p: [0, 32, 0], parent: XA.gate });
  XA.gateL = mesh(rbox(9, 28, 1.2), toon('#5a6070'), { p: [-4.5, 14, 0], parent: XA.gate }); XA.gateR = mesh(rbox(9, 28, 1.2), toon('#5a6070'), { p: [4.5, 14, 0], parent: XA.gate }); XA.gateGl = glowSprite('#fff0c0', 50, { opacity: 0 }); XA.gateGl.position.set(0, 14, -6); XA.gate.add(XA.gateGl); }
export function gateAt(open) { XA.gateL.position.x = -4.5 - open * 8.5; XA.gateR.position.x = 4.5 + open * 8.5; XA.gateGl.material.opacity = open * .6; }
// --- three energy pillars feeding the origin ---
XA.pillars = [[-15, -75], [45, -75], [15, -100]].map(([x, z]) => { const g = group({ p: [x, -40, z], parent: CT }); const pm = toon('#4a4e5a'); mesh(new THREE.CylinderGeometry(2.2, 3, 4, 8), pm, { p: [0, 2, 0], parent: g }); const top = group({ parent: g });
  mesh(new THREE.CylinderGeometry(1.2, 1.6, 26, 8), pm, { p: [0, 17, 0], parent: top }); for (let k = 0; k < 4; k++) mesh(new THREE.TorusGeometry(1.7, .3, 6, 16), toon('#7a7e8a'), { r: [90, 0, 0], p: [0, 8 + k * 6, 0], parent: top });
  const core = noI(mesh(new THREE.CylinderGeometry(.6, .6, 24, 8), addM('#b06aff', .8), { p: [0, 17, 0], parent: top, cast: false })); const gl = glowSprite('#b06aff', 14, { opacity: .5 }); gl.position.y = 31; top.add(gl);
  const beam = noI(mesh(new THREE.CylinderGeometry(.35, .35, 1, 6), addM('#c08aff', .6), { parent: CT, cast: false, recv: false })); return { g, top, core, gl, beam, x, z }; });
export function pillarAt(i, alive, broken, tgt, t) { const P = XA.pillars[i]; P.g.visible = true; P.top.rotation.set(broken * 1.2, 0, broken * .4); P.top.position.set(0, -broken * 6, broken * 4); P.core.material.opacity = alive * (.6 + .3 * Math.sin(t * 8 + i)); P.gl.material.opacity = alive * .55;
  const a = new THREE.Vector3(P.x, -40 + 31, P.z), b = tgt ? new THREE.Vector3(...tgt) : a; const len = a.distanceTo(b); P.beam.visible = !!tgt && alive > .05 && len > 1; if (P.beam.visible) { P.beam.position.copy(a).add(b).multiplyScalar(.5); P.beam.scale.set(1, len, 1); P.beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); P.beam.material.opacity = alive * (.45 + .25 * Math.sin(t * 10 + i)); } }
// --- every stone in the city glowing (rooftops) ---
XA.cstones = []; { const cs = ['#ff5a4a', '#3af08a', '#ffd23a', '#4aa8ff', '#b06aff']; let k = 0; Object.values(XA.towers).forEach(T => { if (!T.g) return; const s = glowSprite(cs[k++ % 5], 7, { opacity: 0, fog: true }); s.position.set(T.x + (k % 3 - 1) * 3, T.top + 1.5, T.z); CT.add(s); s.userData.T = T; XA.cstones.push(s); }); }
export function cstonesAt(k, t) { XA.cstones.forEach((s, i) => { s.visible = k > .01; s.position.y = s.userData.T.g.position.y + 40 + s.userData.T.top + 1.5; s.material.opacity = k * (.55 + .35 * Math.sin(t * 5 + i)); }); }
// --- spaceship over the city ---
XA.ship = group({ p: [0, 170, -120], parent: CT }); XA.ship.visible = false;
{ const S_ = XA.ship, hm = toon('#3a3c48'), dm = toon('#26262e'); mesh(new THREE.SphereGeometry(160, 40, 16), hm, { s: [1, .12, 1], parent: S_ }); mesh(new THREE.SphereGeometry(60, 24, 12), dm, { s: [1, .35, 1], p: [0, -8, 0], parent: S_ }); mesh(new THREE.SphereGeometry(70, 24, 12), hm, { s: [1, .3, 1], p: [0, 14, 0], parent: S_ });
  for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; const l = glowSprite(i % 2 ? '#ff6a4a' : '#ffd8a0', 14, { opacity: .8 }); l.position.set(Math.cos(a) * 140, -12, Math.sin(a) * 140); S_.add(l); } XA.shipGl = glowSprite('#9ad8ff', 160, { opacity: .5 }); XA.shipGl.position.y = -24; S_.add(XA.shipGl);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; mesh(rbox(30, 6, 8), dm, { p: [Math.cos(a) * 100, -16, Math.sin(a) * 100], r: [0, -a / D2R, 0], parent: S_ }); } }
export function shipAt(k, t) { XA.ship.visible = k > .01; XA.ship.position.y = 170 + (1 - k) * 120; XA.ship.rotation.y = t * .02; XA.shipGl.material.opacity = .45 * k; }
// --- power-link beams (Krai -> friends) ---
XA.links = [0, 1, 2].map(() => noI(mesh(new THREE.CylinderGeometry(.03, .03, 1, 6), addM('#6ad0ff', .9), { parent: scene, cast: false, recv: false })));
export function linkAt(i, a, b, k, col = '#6ad0ff') { const L_ = XA.links[i]; const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b); const len = A.distanceTo(B); L_.visible = k > .01 && len > .01; if (!L_.visible) return; L_.position.copy(A).add(B).multiplyScalar(.5); L_.scale.set(1 + 1.5 * k, len, 1 + 1.5 * k); L_.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); L_.material.opacity = k * .9; L_.material.color.set(col); }
XA.ep6Hide = () => { XA.hatch.visible = false; XA.mapP.visible = false; FAC.visible = false; XA.origin.visible = false; XA.motes.forEach(s => { s.visible = false; }); XA.ewall.visible = XA.ewall2.visible = false; XA.gate.visible = false; gateAt(0);
  XA.pillars.forEach(P => { P.g.visible = false; P.beam.visible = false; }); XA.cstones.forEach(s => { s.visible = false; }); XA.ship.visible = false; XA.links.forEach(l => { l.visible = false; }); doorBreak(0); XA.cpanelGl.material.opacity = 0; };
