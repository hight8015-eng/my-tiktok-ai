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


// ======================= THE LAST VILLAIN sets =======================
export { seaFar };
export function hideSea() { sea.visible = false; seaFar.visible = false; clouds.visible = false; }
const T = (w, h, f, o) => canvasTex(w, h, f, o);
const stoneTex = T(512, 512, (x, w, h) => { x.fillStyle = '#6e6a82'; x.fillRect(0, 0, w, h); const r = rng(5); for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const v = 96 + (r() * 22 | 0); x.fillStyle = `rgb(${v},${v - 4},${v + 18})`; x.fillRect(i * 128 + 4, j * 128 + 4, 120, 120); } x.strokeStyle = '#3a3650'; x.lineWidth = 6; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, h); x.moveTo(0, i * 128); x.lineTo(w, i * 128); x.stroke(); } }, { repeat: [6, 10] });
const wallTex = T(512, 512, (x, w, h) => { x.fillStyle = '#5c5874'; x.fillRect(0, 0, w, h); const r = rng(9); for (let j = 0; j < 8; j++) for (let i = 0; i < 4; i++) { const v = 84 + (r() * 20 | 0); x.fillStyle = `rgb(${v},${v - 2},${v + 16})`; x.fillRect(i * 128 + (j % 2) * 64 + 3, j * 64 + 3, 122, 58); } }, { repeat: [3, 3] });
const woodTex = T(512, 512, (x, w, h) => { const c = ['#8a5a36', '#7d4f2e', '#94623c']; for (let i = 0; i < 8; i++) { x.fillStyle = c[i % 3]; x.fillRect(i * 64, 0, 64, h); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(i * 64, 0, 3, h); } }, { repeat: [2, 2] });
const glassTex = T(512, 512, (x, w, h) => { const cx = 256, cy = 256; const cols = ['#d8483e', '#3a6fd8', '#f2c94c', '#7a4ac8', '#3aa86a']; for (let k = 0; k < 16; k++) { x.fillStyle = cols[k % 5]; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, 250, k / 16 * 6.283, (k + 1) / 16 * 6.283); x.fill(); }
  x.fillStyle = '#ffe7a0'; x.beginPath(); x.arc(cx, cy, 70, 0, 7); x.fill(); x.strokeStyle = '#2a2236'; x.lineWidth = 10; for (let k = 0; k < 16; k++) { x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(k / 16 * 6.283) * 250, cy + Math.sin(k / 16 * 6.283) * 250); x.stroke(); } x.beginPath(); x.arc(cx, cy, 70, 0, 7); x.arc(cx, cy, 160, 0, 7); x.stroke(); x.lineWidth = 16; x.beginPath(); x.arc(cx, cy, 246, 0, 7); x.stroke(); });
const circleTex = T(512, 512, (x, w, h) => { x.strokeStyle = '#ff3a5a'; x.lineWidth = 10; x.lineCap = 'round'; for (const r of [240, 200, 120]) { x.beginPath(); x.arc(256, 256, r, 0, 7); x.stroke(); } x.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 * 2 - 1.57; x.lineTo(256 + Math.cos(a) * 200, 256 + Math.sin(a) * 200); } x.closePath(); x.stroke(); x.font = 'bold 34px serif'; x.fillStyle = '#ff3a5a'; for (let k = 0; k < 12; k++) { x.save(); x.translate(256, 256); x.rotate(k / 12 * 6.283); x.fillText('ᚱᛟᚾ'[k % 3], -10, -212); x.restore(); } });
// ---------- HALL: cathedral / engagement altar (local origin, carpet along -z, altar at z -12) ----------
export const HALL = group({ parent: scene }); export const HA = {};
{
  mesh(rbox(12, .4, 34), toon('#ffffff', { map: stoneTex }), { p: [0, -.2, -6], parent: HALL, cast: false });
  mesh(rbox(1.6, .03, 26), toon('#9a2232'), { p: [0, .02, -2], parent: HALL, cast: false });
  for (const s of [-1, 1]) { mesh(rbox(.4, 12, 34), toon('#ffffff', { map: wallTex }), { p: [s * 6, 6, -6], parent: HALL, cast: false });
    for (let z = 4; z >= -13; z -= 3.4) { mesh(new THREE.CylinderGeometry(.42, .5, 9, 14), toon('#8a86a0'), { p: [s * 3.4, 4.5, z], parent: HALL }); mesh(rbox(1.2, .4, 1.2), toon('#6e6a86'), { p: [s * 3.4, .2, z], parent: HALL });
      mesh(rbox(.9, 2.6, .05), toon('#5a2f72', { side: THREE.DoubleSide }), { p: [s * 5.75, 5.6, z - 1.7], r: [0, 90, 0], parent: HALL, cast: false }); } }
  mesh(rbox(12, 14, .4), toon('#ffffff', { map: wallTex }), { p: [0, 7, -16.5], parent: HALL, cast: false });
  HA.glass = mesh(new THREE.CircleGeometry(2.6, 40), basic('#ffffff', { map: glassTex }), { p: [0, 7.2, -16.25], parent: HALL, cast: false }); HA.glass.userData.noInk = true;
  for (let i = 0; i < 3; i++) mesh(rbox(7 - i * 1.2, .3, 2.2 - i * .5), toon('#7a7690'), { p: [0, .15 + i * .3, -11.8 - i * .1], parent: HALL });
  HA.altar = mesh(rbox(2.2, 1.0, .9), toon('#d8d2e4'), { p: [0, 1.4, -12.4], parent: HALL });
  HA.circle = mesh(new THREE.CircleGeometry(3.2, 48), basic('#ffffff', { map: circleTex, transparent: true, opacity: 0, add: true, depthWrite: false }), { r: [-90, 0, 0], p: [0, .93, -11.6], parent: HALL, cast: false }); HA.circle.userData.noInk = true;
  HA.candles = []; for (const s of [-1, 1]) for (const z of [-10.5, -6, -1.5]) { const g = group({ p: [s * 2.4, 0, z], parent: HALL }); mesh(new THREE.CylinderGeometry(.05, .12, 1.6, 8), toon('#c9a24a'), { p: [0, .8, 0], parent: g }); mesh(new THREE.CylinderGeometry(.07, .07, .3, 8), toon('#f4efe2'), { p: [0, 1.75, 0], parent: g });
    const f = glowSprite('#ffb04a', .7, { opacity: .9 }); f.position.set(0, 2.0, 0); g.add(f); HA.candles.push(f); }
  HALL.visible = false;
}
export function hallAt(t, o = {}) { HALL.visible = true; HA.circle.material.opacity = o.circle || 0; HA.circle.rotation.z = t * .4; HA.candles.forEach((f, i) => { f.scale.setScalar(.6 + .08 * Math.sin(t * 13 + i * 2)); });
  const L = pts; L[0].position.set(0, 4, -8); L[0].color.set('#ffcf8a'); L[0].intensity = o.warm ?? 60; L[0].distance = 30;
  L[1].position.set(0, 7, -15); L[1].color.set(o.circle ? '#ff3a5a' : '#c9b4ff'); L[1].intensity = (o.glass ?? 50) + (o.circle || 0) * 120; L[1].distance = 26; }
// ---------- FIELD: plains, army, burning city (group at x 300) ----------
export const FIELD = group({ p: [300, 0, 0], parent: scene }); export const FA = {};
{
  mesh(rbox(400, 2, 400), toon('#6a7a4a'), { p: [0, -1, -100], parent: FIELD, cast: false });
  const R = rng(4); for (let i = 0; i < 9; i++) { const m = mesh(new THREE.ConeGeometry(30 + R() * 30, 40 + R() * 40, 5), toon('#5a5a7a'), { p: [-180 + i * 45 + R() * 20, 15, -190 - R() * 40], parent: FIELD, cast: false }); m.userData.noInk = false; }
  FA.rock = mesh(new THREE.DodecahedronGeometry(1.4, 0), toon('#6e6878'), { p: [0, .3, 0], s: [1.6, .7, 1.3], parent: FIELD });
  // army: instanced little soldiers (capsule body, head ball, helmet) on a grid in front of the rock
  const N = 260, bodyG = new THREE.CapsuleGeometry(.22, .4, 4, 8), headG = new THREE.SphereGeometry(.2, 10, 8), helmG = new THREE.SphereGeometry(.215, 10, 6, 0, 6.283, 0, 1.5), spearG = new THREE.CylinderGeometry(.02, .02, 1.6, 4);
  FA.army = [new THREE.InstancedMesh(bodyG, toon('#6a7486'), N), new THREE.InstancedMesh(headG, toon('#f4efe4'), N), new THREE.InstancedMesh(helmG, toon('#9aa4b4'), N), new THREE.InstancedMesh(spearG, toon('#5a4430'), N)];
  FA.armyPos = []; for (let i = 0; i < N; i++) { const r = i / 26 | 0, c = i % 26; FA.armyPos.push([(c - 12.5) * 1.1 + R() * .3, -14 - r * 1.3 - R() * .3, R() * 6.283]); }
  FA.army.forEach(m => { m.castShadow = true; FIELD.add(m); });
  // the burning city (houses + flames) far back
  FA.city = group({ p: [0, 0, -45], parent: FIELD }); FA.flames = [];
  for (let i = 0; i < 14; i++) { const x = (i - 7) * 4 + R() * 1.5, z = -R() * 8, h = 2 + R() * 3; mesh(rbox(3, h, 3), toon('#7a5a4a'), { p: [x, h / 2, z], parent: FA.city }); mesh(new THREE.ConeGeometry(2.4, 1.8, 4), toon('#5a2a2a'), { p: [x, h + .9, z], r: [0, 45, 0], parent: FA.city });
    for (let k = 0; k < 2; k++) { const f = mesh(new THREE.ConeGeometry(.9, 2.6, 6), basic('#ff8a2a', { transparent: true, opacity: .9 }), { p: [x + (k - .5) * 1.4, h + 1.6, z], parent: FA.city, cast: false }); f.userData.noInk = true; FA.flames.push(f); }
    const g = glowSprite('#ff6a2a', 9, { opacity: .5 }); g.position.set(x, h + 2, z); FA.city.add(g); }
  FA.poster = mesh(new THREE.PlaneGeometry(1.6, 2.2), basic('#ffffff'), { p: [6, 1.8, -6], parent: FIELD, cast: false }); FA.poster.userData.noInk = true;
  mesh(rbox(2.2, 3.2, .2), toon('#6a4a30'), { p: [6, 1.8, -6.12], parent: FIELD });
  FIELD.visible = false;
}
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
export function armyAt(k, t, gone = 0) { // gone 0..1: front rows vanish first
  const N = FA.armyPos.length; for (let i = 0; i < N; i++) { const [x, z, ph] = FA.armyPos[i], row = Math.floor(i / 26), v = clamp((gone * 12 - row * .9) / 1.2), sc = (1 - v) * k, bob = Math.abs(Math.sin(t * 3 + ph)) * .04;
    _q.setFromEuler(new THREE.Euler(0, Math.PI, 0)); _s.setScalar(Math.max(1e-4, sc));
    [[0, .55 + bob], [0, 1.05 + bob], [0, 1.08 + bob], [.3, .9 + bob]].forEach(([dx, y], j) => { _p.set(x + dx, y * Math.max(.001, sc) + v * 1.2, z); _m4.compose(_p, _q, _s); FA.army[j].setMatrixAt(i, _m4); }); }
  FA.army.forEach(m => { m.instanceMatrix.needsUpdate = true; m.visible = k > 0; }); }
export function cityAt(on, t) { FA.city.visible = on; FA.flames.forEach((f, i) => { f.scale.set(1 + .15 * Math.sin(t * 9 + i), 1 + .3 * Math.sin(t * 7 + i * 1.7), 1); }); }
export function posterAt(on) { FA.poster.visible = on; if (on && !FA.posterDrawn) { FA.posterDrawn = true; FA.poster.material.map = canvasTex(512, 704, (x, w, h) => {
  x.fillStyle = '#e8d4a8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#7a5a30'; x.lineWidth = 18; x.strokeRect(9, 9, w - 18, h - 18); x.fillStyle = '#5a1a1a'; x.textAlign = 'center'; x.font = 'bold 78px Prompt'; x.fillText('ประกาศจับ', 256, 110);
  x.fillStyle = '#f7f2e8'; x.beginPath(); x.arc(256, 330, 140, 0, 7); x.fill(); x.lineWidth = 10; x.strokeStyle = '#22223a'; x.stroke(); x.fillStyle = '#221c30'; x.beginPath(); x.arc(256, 300, 142, Math.PI * 1.02, Math.PI * 1.98); x.fill();
  x.fillStyle = '#c0182a'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(256 + s * 48, 345, 14, 18, 0, 0, 7); x.fill(); } x.strokeStyle = '#22223a'; x.lineWidth = 8; x.beginPath(); x.moveTo(220, 410); x.quadraticCurveTo(256, 395, 300, 405); x.stroke();
  x.fillStyle = '#5a1a1a'; x.font = 'bold 50px Prompt'; x.fillText('ราชันแห่งบาป', 256, 540); x.font = '600 34px Prompt'; x.fillText('ศัตรูของมนุษยชาติ', 256, 600); x.font = 'bold 40px Prompt'; x.fillStyle = '#9a2a1a'; x.fillText('ค่าหัว ∞', 256, 660); });
  FA.poster.material.needsUpdate = true; } }
// ---------- BALCONY: castle balcony under the moon (group at x -300) ----------
export const BALC = group({ p: [-300, 0, 0], parent: scene });
{
  mesh(rbox(10, .4, 6), toon('#ffffff', { map: stoneTex }), { p: [0, -.2, 0], parent: BALC, cast: false });
  mesh(rbox(10, .18, .5), toon('#9a96b0'), { p: [0, 1.0, -2.8], parent: BALC });
  for (let x = -4.6; x <= 4.6; x += .46) mesh(new THREE.CylinderGeometry(.09, .12, .9, 8), toon('#8a86a0'), { p: [x, .48, -2.8], parent: BALC });
  mesh(rbox(10, 8, .4), toon('#ffffff', { map: wallTex }), { p: [0, 4, 3], parent: BALC, cast: false });
  for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(.35, .4, 5, 12), toon('#8a86a0'), { p: [s * 4.2, 2.5, 2.4], parent: BALC });
  const tw = group({ p: [-14, 0, -40], parent: BALC }); mesh(new THREE.CylinderGeometry(3, 3.4, 26, 14), toon('#5a5674'), { p: [0, 13, 0], parent: tw, cast: false }); mesh(new THREE.ConeGeometry(4, 8, 14), toon('#3a2a5a'), { p: [0, 30, 0], parent: tw, cast: false });
  for (let i = 0; i < 5; i++) { const w = mesh(rbox(.8, 1.2, .1), basic('#ffd27a'), { p: [Math.sin(i) * 1, 6 + i * 4, 3.4], parent: tw, cast: false }); w.userData.noInk = true; }
  BALC.visible = false;
}
// ---------- CRYPT: the sealed demon god (group at z 300) ----------
export const CRYPT = group({ p: [0, 0, 300], parent: scene }); export const CR = {};
{
  mesh(rbox(40, .4, 40), toon('#3a3448'), { p: [0, -.2, 0], parent: CRYPT, cast: false });
  CR.circle = mesh(new THREE.CircleGeometry(9, 48), basic('#ffffff', { map: circleTex, transparent: true, opacity: .8, add: true, depthWrite: false }), { r: [-90, 0, 0], p: [0, .03, -10], parent: CRYPT, cast: false }); CR.circle.userData.noInk = true;
  const d = CR.demon = group({ p: [0, 0, -12], parent: CRYPT }), skin = toon('#2a1f3a'), horn = toon('#d8cbb8');
  mesh(new THREE.SphereGeometry(4.6, 24, 16), skin, { p: [0, 5, 0], s: [1, 1.15, .8], parent: d });                       // hunched body
  CR.head = group({ p: [0, 10.2, 1.2], parent: d }); mesh(new THREE.SphereGeometry(2.4, 24, 16), skin, { s: [1.1, 1, 1], parent: CR.head });
  for (const s of [-1, 1]) { const h = mesh(new THREE.ConeGeometry(.6, 3.6, 10), horn, { p: [s * 1.6, 2.2, 0], r: [0, 0, -s * 32], parent: CR.head });
    mesh(new THREE.SphereGeometry(1.3, 14, 10), skin, { p: [s * 4.6, 5.5, 1.2], s: [1, 1.8, 1], parent: d });
    CR['eye' + s] = mesh(new THREE.SphereGeometry(.42, 14, 10), basic('#ff2a3a'), { p: [s * .85, .2, 2.15], s: [1.4, .7, .5], parent: CR.head }); CR['eye' + s].userData.noInk = true;
    for (const k of [0, 1]) { const a = [s * 13, 7 - k * 3, -6 + k * 6]; cylBetween([s * 4.4, 6 - k * 2, 0], a, .16, toon('#7a7a88'), d, 6); mesh(new THREE.CylinderGeometry(.7, .9, 14, 10), toon('#4a4458'), { p: [a[0] - s * 0, 7, a[2] - 12 + 12], parent: d }); } }
  CR.eyeGlow = glowSprite('#ff2a3a', 6, { opacity: 0 }); CR.eyeGlow.position.set(0, 10.4, 3.6); d.add(CR.eyeGlow);
  CRYPT.visible = false;
}
export function cryptAt(t, eye = 0) { CRYPT.visible = true; CR.circle.rotation.z = -t * .3; CR.head.rotation.set(Math.sin(t * .5) * .03, Math.sin(t * .3) * .05, 0);
  for (const s of [-1, 1]) { CR['eye' + s].scale.set(1.4, .05 + .65 * eye, .5); CR['eye' + s].visible = eye > .02; } CR.eyeGlow.material.opacity = .7 * eye;
  pts[0].position.set(0, 3, 290); pts[0].color.set('#ff3a5a'); pts[0].intensity = 80 + 40 * Math.sin(t * 3); pts[0].distance = 40; }
// ---------- VILLAGE: houses outside (group at z -300) + the hut interior at local x 40 ----------
export const VILL = group({ p: [0, 0, -300], parent: scene }); export const VI = {};
{
  mesh(rbox(120, .4, 120), toon('#4a5a3a'), { p: [0, -.2, 0], parent: VILL, cast: false });
  const R = rng(7); for (let i = 0; i < 6; i++) { const x = (i - 2.5) * 7 + R() * 2, z = -8 - (i % 2) * 6; mesh(rbox(4, 3, 4), toon('#9a7a5a'), { p: [x, 1.5, z], parent: VILL }); mesh(new THREE.ConeGeometry(3.4, 2.4, 4), toon('#6a4a3a'), { p: [x, 4.2, z], r: [0, 45, 0], parent: VILL });
    const w = mesh(rbox(.9, .9, .05), basic(i === 2 ? '#ffd27a' : '#3a3a5a'), { p: [x, 1.6, z + 2.03], parent: VILL, cast: false }); w.userData.noInk = true; }
  VI.hut = group({ p: [40, 0, 0], parent: VILL });
  mesh(rbox(6, .2, 6), toon('#ffffff', { map: woodTex }), { p: [0, -.1, 0], parent: VI.hut, cast: false });
  for (const [x, z, ry] of [[0, -3, 0], [-3, 0, 90], [3, 0, 90]]) mesh(rbox(6, 4, .2), toon('#ffffff', { map: woodTex }), { p: [x, 2, z], r: [0, ry, 0], parent: VI.hut, cast: false });
  VI.win = mesh(rbox(1, 1, .05), basic('#9ab4ff'), { p: [1.4, 2.4, -2.88], parent: VI.hut, cast: false }); VI.win.userData.noInk = true;
  mesh(rbox(1.6, .35, 2.4), toon('#7a5434'), { p: [-1.2, .25, -1.5], parent: VI.hut }); VI.blanket = mesh(rbox(1.5, .14, 1.6), toon('#4a6a9a'), { p: [-1.2, .5, -1.1], parent: VI.hut }); mesh(rbox(1.2, .16, .5), toon('#efe9dc'), { p: [-1.2, .5, -2.4], parent: VI.hut });
  VILL.visible = false;
}
export function hideSets() { HALL.visible = FIELD.visible = BALC.visible = CRYPT.visible = VILL.visible = false; }
