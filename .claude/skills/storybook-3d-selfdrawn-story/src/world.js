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

// ======================= RELIEF BOAT =======================
export const boat = group({ parent: scene }); boat.visible = false; export const BT = {};
{
  const hg = new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); const hull = mesh(hg, toon('#b5442f', { side: THREE.DoubleSide }), { parent: boat }); hull.scale.set(1.0, .75, 2.6);
  const rim = mesh(new THREE.TorusGeometry(1, .07, 6, 24), toon('#f1e6d0'), { r: [90, 0, 0], parent: boat }); rim.scale.set(1.0, 2.6, 1);
  mesh(new THREE.CylinderGeometry(.93, .93, .05, 18), toon('#c79a66'), { p: [0, -.3, 0], s: [1, 1, 2.4], parent: boat }); BT.deckY = -.27;
  for (const z of [-.9, .7]) mesh(rbox(1.7, .07, .32), toon('#c79a66'), { p: [0, -.02, z], parent: boat });
  cylBetween([0, -.3, .2], [0, 3.6, .2], .06, toon('#6a4228'), boat, 6); BT.sail = mesh(new THREE.PlaneGeometry(1.9, 2.4, 4, 4), toon('#f1e6d0', { side: THREE.DoubleSide }), { p: [.0, 2.1, .25], r: [0, 80, 0], parent: boat });
  cylBetween([-.9, 3.3, .2], [.9, 3.3, .2], .04, toon('#6a4228'), boat, 5); BT.sail.visible = false; { const f = mesh(new THREE.CylinderGeometry(.13, .13, 1.6, 8), toon('#f1e6d0'), { p: [0, 3.14, .2], r: [0, 0, 90], parent: boat }); mesh(new THREE.PlaneGeometry(.5, .28), toon('#b5442f', { side: THREE.DoubleSide }), { p: [.25, 3.75, .2], parent: boat, cast: false }); }
}
boat.children.forEach((c, i) => { if (i >= 5) c.visible = false; }); BT.oars = [-1, 1].map(sd => { const g = group({ p: [sd * .95, .1, .2], parent: boat }); cylBetween([0, 0, 0], [sd * 1.5, -.35, 0], .035, toon('#8a5a36'), g, 5); mesh(rbox(.5, .04, .2), toon('#c79a66'), { p: [sd * 1.6, -.38, 0], parent: g }); return g; });
export function boatAt(x, z, t, ry = 0, k = 1) { boat.visible = true; const y = waveH(x, z, t); boat.position.set(x, y + .32, z); boat.rotation.set(.12 * k * Math.sin(t * 1.5 + 1), ry * D2R, .16 * k * Math.sin(t * 1.2)); }
// gulls
export const gulls = group({ parent: scene }); { const gm = toon('#fbf8f2', { side: THREE.DoubleSide }); for (let i = 0; i < 5; i++) { const g = group({ parent: gulls }); for (const s of [-1, 1]) { const w = mesh(new THREE.PlaneGeometry(.55, .16), gm, { p: [s * .27, 0, 0], parent: g, cast: false }); w.userData.s = s; } } }
export function gullsAt(t, c = [0, 18, 0], k = 1) { gulls.visible = k > 0; gulls.children.forEach((g, i) => { const a = t * .5 + i * 1.3, r = 7 + i * 1.6; g.position.set(c[0] + Math.cos(a) * r, c[1] + Math.sin(a * 1.7 + i) * 1.2 + i * .5, c[2] + Math.sin(a) * r); g.rotation.y = -a; g.children.forEach(w => { w.rotation.z = w.userData.s * Math.sin(t * 7 + i) * .6; }); }); }

// ======================= VALLEY: river (z axis), red village (x<0), blue village (x>0) =======================
PRESETS.day = { top: '#2f7fe0', mid: '#86c4f6', hor: '#e2f4ff', glow: '#fff6d8', glowAmt: .5, sunDir: [.35, .62, .6], sunC: '#fff4e0', sunI: 3.0, hemiS: '#dcebff', hemiG: '#9ab070', hemiI: 2.5, fog: '#cfe6ff', fogN: 90, fogF: 950, deep: '#2a78cf', shallow: '#74c2f2', glint: '#ffffff', glintAmt: .8, stars: 0, moon: 0, cloud: '#ffffff' };
PRESETS.gold = { top: '#4a78d0', mid: '#f3b48a', hor: '#ffe0a0', glow: '#ffd28a', glowAmt: .7, sunDir: [-.5, .3, .55], sunC: '#ffd9a8', sunI: 3.0, hemiS: '#d6d8ff', hemiG: '#b08a5a', hemiI: 2.3, fog: '#f6c9a0', fogN: 80, fogF: 800, deep: '#2f6cb8', shallow: '#86b8e8', glint: '#fff0c0', glintAmt: 1, stars: 0, moon: 0, cloud: '#ffd9c0' };
export const RED = '#cf3640', BLUE = '#2f74c8', DY = 1.26, HW = 6; // deck y, half river width
export const VL = group({ parent: scene }); export const VA = {};
{
  const grass = toon('#86c85a'), dirt = toon('#b98a5a'), road = toon('#e6c891');
  for (const s of [-1, 1]) {
    mesh(rbox(600, 6, 900), grass, { p: [s * (HW + 300), -2, 0], parent: VL, cast: false });
    mesh(rbox(.4, 1.7, 900), dirt, { p: [s * (HW - .15), .16, 0], parent: VL, cast: false });
    mesh(rbox(60, .05, 2.3), road, { p: [s * (HW + 30), 1.02, 0], parent: VL, cast: false });
    mesh(rbox(1.6, .05, 60), road, { p: [s * (HW + 2.2), 1.02, 0], parent: VL, cast: false });
  }
  // fields
  { const r = rng(21), cols = ['#f2d35e', '#a7d85f', '#6fb64a', '#e9b84f', '#9ccf55']; for (let i = 0; i < 70; i++) { const s = i % 2 ? 1 : -1, x = 30 + r() * 120, z = -260 + r() * 520, w = 10 + r() * 16, d = 8 + r() * 14; mesh(rbox(w, .04, d), toon(cols[i % 5]), { p: [s * x, 1.02 + (i % 3) * .004, z], parent: VL, cast: false }); }
    for (let i = 0; i < 26; i++) { const s = i % 2 ? 1 : -1, x = 9 + r() * 14, z = (r() < .5 ? -1 : 1) * (22 + r() * 200), w = 6 + r() * 8, d = 6 + r() * 10; mesh(rbox(w, .04, d), toon(cols[i % 5]), { p: [s * x, 1.02 + (i % 3) * .004, z], parent: VL, cast: false }); } }
  // houses
  VA.winM = toon('#ffe2a0', { emissive: '#ffb347', ei: 0, unique: true }); VA.houses = [];
  const house = (s, x, z, w, hh, ry = 0, chief = false) => { const g = group({ p: [s * x, 1, z], parent: VL }); g.rotation.y = ry * D2R * s; const col = s < 0 ? RED : BLUE;
    mesh(rbox(w, hh, 3), toon(chief ? '#fff3dc' : ['#f6e6c8', '#f1dcc0', '#fbeed8'][Math.round(x) % 3]), { p: [0, hh / 2, 0], parent: g });
    const rg = new THREE.CylinderGeometry(.02, w * .62, 1.6, 4); rg.rotateY(Math.PI / 4); mesh(rg, toon(col), { p: [0, hh + .8, 0], s: [1.18, 1, 1.12], parent: g });
    const dx = chief ? 0 : -w * .22; mesh(rbox(.8, 1.5, .08), toon('#7a4a2a'), { p: [dx, .75, 1.52], parent: g }); mesh(rbox(.96, .1, .12), toon(col), { p: [dx, 1.56, 1.52], parent: g });
    for (const wx of chief ? [-w * .32, w * .32] : [w * .22]) { mesh(rbox(.66, .66, .08), VA.winM, { p: [wx, hh - .9, 1.52], parent: g }); mesh(rbox(.76, .08, .1), toon('#7a4a2a'), { p: [wx, hh - .9, 1.53], parent: g }); mesh(rbox(.08, .76, .1), toon('#7a4a2a'), { p: [wx, hh - .9, 1.53], parent: g }); }
    mesh(rbox(.34, .9, .34), toon('#a8705a'), { p: [w * .25, hh + 1.3, -.2], parent: g });
    if (chief) { cylBetween([w / 2 + .5, 0, 1.2], [w / 2 + .5, 5.2, 1.2], .05, toon('#5a4030'), g, 6); const f = mesh(new THREE.PlaneGeometry(1.5, .9, 6, 1), toon(col, { side: THREE.DoubleSide }), { p: [w / 2 + 1.28, 4.7, 1.2], parent: g, cast: false }); VA.flags = VA.flags || []; VA.flags.push(f); }
    VA.houses.push(g); return g; };
  for (const s of [-1, 1]) { house(s, 11.6, -3.4, 4.4, 3.3, 0, true); house(s, 12.2, 9.5, 3.2, 2.6, -8); house(s, 15.8, 5.2, 3.4, 2.9, -14); house(s, 17, -8.5, 3.2, 2.6, 10); house(s, 10.6, -11, 3, 2.4, 6); house(s, 21.5, -1.8, 3.4, 3, 0); house(s, 21, 11, 3, 2.6, -18); house(s, 14.2, 14, 3, 2.4, -6); house(s, 19.5, -15, 3.2, 2.8, 12); house(s, 26, 6, 3.2, 2.7, -20); house(s, 26.5, -9, 3, 2.5, 14); }
  // trees
  { const r = rng(9), tr = toon('#8a5a36'), c1 = toon('#4fa04a'), c2 = toon('#62b658'), tg = new THREE.CylinderGeometry(.16, .22, 1.4, 6), sg = new THREE.SphereGeometry(1, 10, 8);
    for (let i = 0; i < 90; i++) { const s = i % 2 ? 1 : -1; let x = 8 + r() * 90, z = -230 + r() * 460; if (Math.abs(z) < 20 && x < 30) z = (z < 0 ? -1 : 1) * (22 + r() * 60); const k = .8 + r() * .9; const g = group({ p: [s * x, 1, z], parent: VL }); mesh(tg, tr, { p: [0, .7, 0], parent: g, cast: false }); mesh(sg, c1, { p: [0, 1.4 + k, 0], s: [k * 1.05, k * 1.15, k * 1.05], parent: g }); mesh(sg, c2, { p: [k * .5, 1.2 + k * .8, k * .3], s: k * .62, parent: g, cast: false }); }
    for (const [s, x, z, k] of [[-1, 15.5, -4.5, 1.2], [1, 15.5, -4.5, 1.2], [-1, 8, -7, .9], [1, 8, -7, .9]]) { const g = group({ p: [s * x, 1, z], parent: VL }); mesh(tg, tr, { p: [0, .7, 0], parent: g, cast: false }); mesh(sg, c1, { p: [0, 1.4 + k, 0], s: [k * 1.05, k * 1.15, k * 1.05], parent: g }); mesh(sg, c2, { p: [k * .5, 1.2 + k * .8, k * .3], s: k * .62, parent: g, cast: false }); } }
  // far mountains
  { const r = rng(5), m1 = toon('#8eaee0'), m2 = toon('#a9c2ea'), sn = toon('#f4f8ff'); for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2 + r() * .1, R = 520 + r() * 160, h = 90 + r() * 110, w = 110 + r() * 80; const c = mesh(new THREE.ConeGeometry(w, h, 5), i % 2 ? m1 : m2, { p: [Math.cos(a) * R, h / 2 - 4, Math.sin(a) * R], r: [0, r() * 90, 0], parent: VL, cast: false, recv: false }); c.material.userData.noInk = false; mesh(new THREE.ConeGeometry(w * .3, h * .3, 5), sn, { p: [Math.cos(a) * R, h * .85 - 4, Math.sin(a) * R], r: [0, c.rotation.y / D2R, 0], parent: VL, cast: false, recv: false }); } }
  // rocks + reeds on the banks
  for (const [x, z, k] of [[-6.3, 9, .7], [6.4, -12, .8], [-6.2, -18, .6], [6.3, 16, .7], [-6.4, 26, .9], [6.2, 30, .6]]) { const m = makeRock(x * 7 + z, k, '#9aa3b5'); m.position.set(x, .9, z); VL.add(m); }

  // ---------- bridge (two halves growing from each bank) ----------
  const BR = group({ parent: VL }); VA.br = BR; VA.parts = [];
  const add = (m, x, side) => { m.userData.bx = Math.abs(x); m.userData.side = side; VA.parts.push(m); return m; };
  const wd = [toon('#d9a868'), toon('#cc9a5a'), toon('#e0b274')], pile = toon('#8a5a36');
  for (let i = 0; i < 24; i++) { const x = -5.75 + i * .5; add(mesh(rbox(.46, .12, 2.3), wd[i % 3], { p: [x, DY - .06, 0], parent: BR }), x, x < 0 ? -1 : 1); }
  for (const x of [-5, -3, -1, 1, 3, 5]) { const g = group({ parent: BR }); for (const z of [-.9, .9]) mesh(new THREE.CylinderGeometry(.15, .17, 3.2, 8), pile, { p: [x, -.4, z], parent: g }); mesh(rbox(.2, .2, 2.2), pile, { p: [x, DY - .24, 0], parent: g, cast: false }); cylBetween([x, .1, -.9], [x, 1.0, .9], .05, pile, g, 5); add(g, x + (x < 0 ? -.75 : .75), x < 0 ? -1 : 1); }
  for (let i = 0; i < 12; i++) { const x = -5.5 + i * 1 + (i < 6 ? 0 : 0); const s = x < 0 ? -1 : 1, col = toon(s < 0 ? RED : BLUE); const g = group({ parent: BR }); { const z = -1.08; mesh(rbox(.12, .82, .12), col, { p: [x, DY + .41, z], parent: g }); mesh(rbox(1.0, .1, .1), col, { p: [x, DY + .8, z], parent: g, cast: false }); mesh(rbox(1.0, .07, .07), toon('#fff3dc'), { p: [x, DY + .45, z], parent: g, cast: false }); mesh(rbox(1.0, .14, .14), col, { p: [x, DY + .07, 1.08], parent: g, cast: false }); } add(g, x + s * .5, s); }
  // stringers under the deck so the open end reads
  VA.spark = glowSprite('#fff2b0', 3.2, { opacity: 0 }); VA.spark.position.set(0, DY + .3, 0); BR.add(VA.spark);
  // toll gate (imagined)
  VA.toll = group({ p: [0, DY, 0], parent: BR }); { const c = toon(BLUE), w = toon('#fff3dc'); for (const z of [-1.0, 1.0]) mesh(rbox(.16, 1.5, .16), c, { p: [0, .75, z], parent: VA.toll }); for (let i = 0; i < 6; i++) mesh(rbox(.14, .14, .36), i % 2 ? c : w, { p: [0, 1.05, -.9 + i * .36], parent: VA.toll, cast: false });
    VA.tollTex = canvasTex(512, 256, () => { }); mesh(new THREE.PlaneGeometry(1.5, .75), toon('#ffffff', { map: VA.tollTex, side: THREE.DoubleSide }), { p: [0, 1.95, 0], r: [0, 0, 0], parent: VA.toll, cast: false }); mesh(rbox(.1, .5, .1), c, { p: [0, 1.5, 0], parent: VA.toll }); }
  // ---------- signboard (in-world counter) ----------
  VA.sign = group({ p: [-8.4, 1, 3.4], r: [0, 14, 0], parent: VL }); { const wdm = toon('#a9733f'); for (const x of [-1.0, 1.0]) mesh(rbox(.16, 2.9, .16), wdm, { p: [x, 1.45, 0], parent: VA.sign }); mesh(rbox(2.5, 1.9, .12), wdm, { p: [0, 2.15, .04], parent: VA.sign });
    VA.signTex = canvasTex(640, 480, () => { }); VA.signP = mesh(new THREE.PlaneGeometry(2.3, 1.72), toon('#ffffff', { map: VA.signTex, grad: undefined }), { p: [0, 2.15, .115], parent: VA.sign, cast: false }); mesh(rbox(2.7, .14, .3), toon('#8a5a36'), { p: [0, 3.17, .04], parent: VA.sign }); }
  // ---------- props ----------
  const bag = (col) => { const g = group({ parent: scene }); mesh(new THREE.SphereGeometry(.2, 14, 10), toon('#e8cf9a'), { s: [1, .9, 1], parent: g }); mesh(new THREE.CylinderGeometry(.07, .1, .12, 8), toon('#e8cf9a'), { p: [0, .2, 0], parent: g }); mesh(new THREE.TorusGeometry(.085, .028, 5, 12), toon(col), { p: [0, .16, 0], r: [90, 0, 0], parent: g }); mesh(new THREE.CylinderGeometry(.05, .05, .02, 12), toon(col), { p: [0, 0, .195], r: [90, 0, 0], parent: g, cast: false }); g.scale.setScalar(.8); return g; };
  VA.bagR = bag(RED); VA.bagB = bag(BLUE);
  const hammer = () => { const g = group({ parent: scene }); mesh(new THREE.CylinderGeometry(.03, .03, .5, 6), toon('#8a5a36'), { p: [0, .25, 0], parent: g }); mesh(rbox(.3, .16, .16), toon('#5b6474'), { p: [0, .52, 0], parent: g }); return g; };
  VA.ham = [hammer(), hammer()]; VA.lamp = makeLantern(true); scene.add(VA.lamp);
  VA.coin = mesh(new THREE.CylinderGeometry(.07, .07, .02, 14), toon('#f2c230'), { r: [90, 0, 0], parent: scene });
  VA.plank = [0, 1].map(i => mesh(rbox(.46, .12, 2.3), wd[i], { parent: scene }));
  // ---------- crowd (instanced workers) ----------
  const NC = 160; VA.cb = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.24, .16, 3, 8), toon('#ffffff'), NC); VA.ch = new THREE.InstancedMesh(new THREE.SphereGeometry(.26, 12, 10), toon('#f7f2e8'), NC); VA.chat = new THREE.InstancedMesh(new THREE.ConeGeometry(.42, .22, 10), toon('#e9c877'), NC);
  for (const m of [VA.cb, VA.ch, VA.chat]) { m.frustumCulled = false; m.castShadow = true; scene.add(m); } VA.NC = NC;
}
const _m = new THREE.Matrix4(), _c = new THREE.Color();
export function crowd(list, t = 0) { // list of [x, y, z, side, phase, bobAmp]
  const n = Math.min(list.length, VA.NC); VA.cb.count = VA.ch.count = VA.chat.count = n; VA.cb.visible = VA.ch.visible = VA.chat.visible = n > 0;
  for (let i = 0; i < n; i++) { const [x, y, z, s, ph = 0, amp = .08] = list[i]; const b = Math.abs(Math.sin(t * 7 + ph)) * amp; _m.makeTranslation(x, y + .37 + b, z); VA.cb.setMatrixAt(i, _m); VA.cb.setColorAt(i, _c.set(s < 0 ? '#e06a5c' : '#5a9ade')); _m.makeTranslation(x, y + .84 + b, z); VA.ch.setMatrixAt(i, _m); _m.makeTranslation(x, y + 1.14 + b, z); VA.chat.setMatrixAt(i, _m); }
  VA.cb.instanceMatrix.needsUpdate = VA.ch.instanceMatrix.needsUpdate = VA.chat.instanceMatrix.needsUpdate = true; if (VA.cb.instanceColor) VA.cb.instanceColor.needsUpdate = true;
}
export function bridgeAt(kL, kR) { for (const m of VA.parts) { const k = m.userData.side < 0 ? kL : kR; m.visible = (HW - m.userData.bx) < k * HW - 1e-3; } }
export function valleyNight(k) { VA.winM.emissiveIntensity = k; }
export function flagsAt(t) { (VA.flags || []).forEach((f, j) => { const p = f.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin(x * 4 + t * 5 + j) * .09 * (x + .75)); } p.needsUpdate = true; }); }
let _sk = '';
export function drawSign(title, num, col = RED, flip = 0) { const key = title + num + col; if (key !== _sk) { _sk = key; const x = VA.signTex.userData.ctx; x.fillStyle = '#fff6e2'; x.fillRect(0, 0, 640, 480); x.fillStyle = col; x.fillRect(0, 0, 640, 150); x.fillStyle = '#ffffff'; x.font = '700 76px Prompt'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(title, 320, 80);
    const ds = String(num).padStart(3, '0'); for (let i = 0; i < 3; i++) { const bx = 110 + i * 150; x.fillStyle = '#2a2330'; x.beginPath(); x.roundRect(bx, 200, 130, 220, 14); x.fill(); x.fillStyle = '#fff6e2'; x.font = '700 170px Prompt'; x.fillText(ds[i], bx + 65, 318); x.fillStyle = '#17121c'; x.fillRect(bx, 306, 130, 6); } VA.signTex.needsUpdate = true; }
  VA.signP.scale.y = Math.max(.02, Math.abs(Math.cos(flip * Math.PI))); }
let _tl = 0; export function drawToll() { if (_tl) return; _tl = 1; const x = VA.tollTex.userData.ctx; x.fillStyle = BLUE; x.fillRect(0, 0, 512, 256); x.fillStyle = '#fff6e2'; x.fillRect(14, 14, 484, 228); x.fillStyle = BLUE; x.font = '700 92px Prompt'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ค่าข้าม', 256, 90); x.fillStyle = '#2a2330'; x.font = '700 70px Prompt'; x.fillText('10 บาท', 256, 185); VA.tollTex.needsUpdate = true; }

// ======================= CARPENTER'S DESK =======================
export const desk = group({ p: [600, 60, 0], parent: scene }); desk.visible = false; export const DK = {};
{
  mesh(new THREE.PlaneGeometry(14, 9), toon('#ffffff', { map: WOODV, ol: 0 }), { p: [0, 3, -2.2], parent: desk, cast: false });
  mesh(new THREE.PlaneGeometry(14, 12), toon('#ffffff', { map: FLOORT, ol: 0 }), { r: [-90, 0, 0], p: [0, 0, 2], parent: desk, cast: false });
  mesh(rbox(3.6, .12, 1.7), toon('#c08a57'), { p: [0, .92, .1], parent: desk }); for (const [x, z] of [[-1.6, -.6], [1.6, -.6], [-1.6, .8], [1.6, .8]]) mesh(rbox(.14, .9, .14), toon('#8a5a36'), { p: [x, .45, z], parent: desk });
  DK.lamp = makeLantern(true); DK.lamp.position.set(1.45, .98, -.4); desk.add(DK.lamp);
  DK.tex = [0, 1].map(() => canvasTex(640, 448, () => { })); DK.plan = DK.tex.map((tx, i) => mesh(new THREE.PlaneGeometry(1.25, .875), toon('#ffffff', { map: tx }), { r: [-90, 0, 0], p: [i ? .625 : -.625, .99, .15], parent: desk, cast: false }));
  DK.pencil = group({ parent: desk }); mesh(new THREE.CylinderGeometry(.022, .022, .34, 6), toon('#f2c230'), { p: [0, .17, 0], parent: DK.pencil }); mesh(new THREE.ConeGeometry(.022, .06, 6), toon('#2a2330'), { p: [0, -.03, 0], r: [180, 0, 0], parent: DK.pencil });
  // shelves + tools on the back wall
  mesh(rbox(3.0, .08, .4), toon('#8a5a36'), { p: [-1.6, 2.5, -2.0], parent: desk }); for (let i = 0; i < 5; i++) mesh(new THREE.CylinderGeometry(.09, .09, .5 + (i % 3) * .1, 8), toon(['#f3e6c8', '#e8cf9a', '#fff3dc'][i % 3]), { p: [-2.7 + i * .5, 2.8, -2.0], r: [0, 0, 90], parent: desk });
  { const g = group({ p: [1.9, 2.6, -2.1], parent: desk }); mesh(rbox(1.3, .26, .05), toon('#b9c2d0'), { parent: g }); mesh(rbox(.42, .34, .1), toon('#8a5a36'), { p: [-.86, .02, 0], parent: g }); }
}
let _pl = 0; export function drawPlans() { if (_pl) return; _pl = 1; DK.tex.forEach((tx, i) => { const x = tx.userData.ctx, W = 640, H = 448; x.fillStyle = '#2b5fc0'; x.fillRect(0, 0, W, H); x.strokeStyle = 'rgba(255,255,255,.16)'; x.lineWidth = 2; for (let g = 0; g <= W; g += 40) { x.beginPath(); x.moveTo(g, 0); x.lineTo(g, H); x.stroke(); } for (let g = 0; g <= H; g += 40) { x.beginPath(); x.moveTo(0, g); x.lineTo(W, g); x.stroke(); }
    x.save(); if (i) { x.translate(W, 0); x.scale(-1, 1); } x.strokeStyle = '#ffffff'; x.lineWidth = 6; x.lineCap = 'round';
    x.beginPath(); x.moveTo(90, 250); x.lineTo(640, 250); x.moveTo(90, 270); x.lineTo(640, 270); x.stroke(); for (const px of [190, 370, 550]) { x.beginPath(); x.moveTo(px, 270); x.lineTo(px, 400); x.moveTo(px + 22, 270); x.lineTo(px + 22, 400); x.moveTo(px, 300); x.lineTo(px + 22, 380); x.stroke(); }
    for (let px = 110; px <= 640; px += 60) { x.beginPath(); x.moveTo(px, 250); x.lineTo(px, 196); x.stroke(); } x.beginPath(); x.moveTo(100, 196); x.lineTo(640, 196); x.stroke();
    x.lineWidth = 3; x.beginPath(); x.moveTo(20, 250); x.lineTo(90, 250); x.lineTo(90, 420); x.stroke(); x.setLineDash([10, 8]); x.beginPath(); x.moveTo(90, 420); x.quadraticCurveTo(360, 440, 640, 420); x.stroke(); x.setLineDash([]); x.restore();
    x.fillStyle = '#ffffff'; x.font = '700 46px Prompt'; x.textAlign = i ? 'right' : 'left'; x.textBaseline = 'middle'; x.fillText(i ? 'แบบสะพาน ฝั่งฟ้า' : 'แบบสะพาน ฝั่งแดง', i ? W - 26 : 26, 52);
    x.save(); x.translate(i ? 150 : W - 150, 118); x.rotate(i ? .2 : -.2); x.strokeStyle = i ? '#9fd0ff' : '#ff6a6a'; x.fillStyle = x.strokeStyle; x.lineWidth = 7; x.beginPath(); x.roundRect(-112, -42, 224, 84, 10); x.stroke(); x.font = '700 50px Prompt'; x.textAlign = 'center'; x.fillText('จ่ายแล้ว', 0, 2); x.restore(); tx.needsUpdate = true; }); }
