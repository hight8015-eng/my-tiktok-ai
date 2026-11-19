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
const glowTex = canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.12, 'rgba(255,255,255,.62)'); g.addColorStop(.3, 'rgba(255,255,255,.26)'); g.addColorStop(.55, 'rgba(255,255,255,.08)'); g.addColorStop(.8, 'rgba(255,255,255,.02)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
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
  mesh(rbox(1.6, .012, 26), toon('#9a2232'), { p: [0, .006, -2], parent: HALL, cast: false });
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
  FA.army.forEach(m => { m.instanceMatrix.needsUpdate = true; m.visible = k > 0; }); if (FA.standards) armyStandards(k, gone); }
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
  mesh(rbox(10, .4, 9.6), toon('#ffffff', { map: stoneTex }), { p: [0, -.2, 1.8], parent: BALC, cast: false });
  mesh(rbox(10, .18, .5), toon('#9a96b0'), { p: [0, 1.0, -2.8], parent: BALC });
  for (let x = -4.6; x <= 4.6; x += .46) mesh(new THREE.CylinderGeometry(.09, .12, .9, 8), toon('#8a86a0'), { p: [x, .48, -2.8], parent: BALC });
  mesh(rbox(10, 8, .4), toon('#ffffff', { map: wallTex }), { p: [0, 4, 4.6], parent: BALC, cast: false });
  for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(.35, .4, 5, 12), toon('#8a86a0'), { p: [s * 4.2, 2.5, 4.0], parent: BALC });
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

// ---------- v4.22 AMBIENCE: floating particles in front of the camera + waving banners/flags, moon, stars ----------
const dotTex = T(64, 64, (x, w, h) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
const AMB_N = 160, ambGeo = new THREE.BufferGeometry(), ambPos = new Float32Array(AMB_N * 3), ambCol = new Float32Array(AMB_N * 3);
ambGeo.setAttribute('position', new THREE.BufferAttribute(ambPos, 3)); ambGeo.setAttribute('color', new THREE.BufferAttribute(ambCol, 3));
const ambMat = new THREE.PointsMaterial({ size: .07, map: dotTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true, sizeAttenuation: true, fog: false });
noOutline(ambMat); ambMat.userData.noInk = true;
const AMB = new THREE.Points(ambGeo, ambMat); AMB.frustumCulled = false; AMB.userData.noInk = true; AMB.renderOrder = 5; scene.add(AMB);
const AR = rng(77), ASEED = Array.from({ length: AMB_N }, () => [AR(), AR(), AR(), AR(), AR()]);
const AMB_KIND = { // colour, drift (x, y), size, twinkle speed, how many
  dust: { c: [1, .88, .66], v: [.05, .04], s: .065, tw: .6, n: 140, a: .8 },
  firefly: { c: [.85, 1, .45], v: [.08, .05], s: .08, tw: 2.2, n: 70, a: .9 },
  ember: { c: [1, .5, .15], v: [.1, .35], s: .075, tw: 3, n: 130, a: 1 },
  spark: { c: [1, .3, .4], v: [.06, .22], s: .06, tw: 2.5, n: 90, a: .9 },
  star: { c: [.8, .85, 1], v: [.01, .01], s: .045, tw: 1.4, n: 80, a: .6 } };
export function ambientAt(t, kind) { ensureText(); const K = AMB_KIND[kind]; AMB.visible = !!K; if (!K) return;
  camera.updateMatrixWorld(); AMB.position.copy(camera.position); AMB.quaternion.copy(camera.quaternion); ambMat.size = K.s;
  for (let i = 0; i < AMB_N; i++) { const [a, b, c, d, e] = ASEED[i], on = i < K.n; const z = -(1.6 + c * 7), hw = -z * .45, hh = -z * .8;
    let x = (a * 2 - 1) * hw + K.v[0] * t * (d - .5) * 2 + Math.sin(t * .7 + e * 9) * .12, y = (b * 2 - 1) * hh + K.v[1] * t + Math.sin(t * .5 + d * 7) * .08;
    x = ((x + hw) % (2 * hw) + 2 * hw) % (2 * hw) - hw; y = ((y + hh) % (2 * hh) + 2 * hh) % (2 * hh) - hh;
    ambPos.set(on ? [x, y, z] : [0, 0, 10], i * 3); const tw = K.a * (.45 + .55 * Math.max(0, Math.sin(t * K.tw + e * 20))) * (on ? 1 : 0);
    ambCol.set([K.c[0] * tw, K.c[1] * tw, K.c[2] * tw], i * 3); }
  ambGeo.attributes.position.needsUpdate = true; ambGeo.attributes.color.needsUpdate = true; }
// waving cloth: a subdivided plane hanging from its top edge
const CLOTHS = [];
function cloth(parent, p, w, h, col, o = {}) { const g = new THREE.PlaneGeometry(w, h, 8, 10); g.translate(0, -h / 2, 0);
  const m = mesh(g, toon(col, { side: THREE.DoubleSide, map: o.map || null }), { p, r: o.r || [0, 0, 0], parent, cast: false }); m.userData.base = g.attributes.position.array.slice(); m.userData.h = h; m.userData.amp = o.amp ?? .06; m.userData.ph = CLOTHS.length * 1.7; CLOTHS.push(m); return m; }
export function clothAt(t) { for (const m of CLOTHS) { let o = m, v = true; while (o) { v = v && o.visible; o = o.parent; } if (!v) continue;
  const P = m.geometry.attributes.position, B = m.userData.base, h = m.userData.h;
  for (let i = 0; i < P.count; i++) { const by = B[i * 3 + 1], k = Math.min(1, -by / h), bx = B[i * 3]; P.setZ(i, B[i * 3 + 2] + Math.sin(t * 2.2 + m.userData.ph + by * 3 + bx * 2) * m.userData.amp * k * k); P.setX(i, bx + Math.sin(t * 1.6 + m.userData.ph + by * 2) * m.userData.amp * .4 * k); }
  P.needsUpdate = true; m.geometry.computeVertexNormals(); } }
const crestTex = (bg, fg) => T(128, 256, (x, w, h) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = '#e2b23c'; x.fillRect(0, 0, w, 14); x.fillRect(8, 0, 6, h); x.fillRect(w - 14, 0, 6, h);
  x.beginPath(); x.moveTo(0, h - 40); x.lineTo(w / 2, h); x.lineTo(w, h - 40); x.lineTo(w, h); x.lineTo(0, h); x.fillStyle = 'rgba(0,0,0,0)'; x.clearRect(0, h - 40, w, 40); x.fillStyle = bg; x.beginPath(); x.moveTo(0, h - 41); x.lineTo(w / 2, h - 2); x.lineTo(w, h - 41); x.fill();
  x.fillStyle = fg; x.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283 - 1.57, r = k % 2 ? 16 : 36; x.lineTo(w / 2 + Math.cos(a) * r, 110 + Math.sin(a) * r); } x.fill(); }, {});
// hall: long crest banners on the walls + hanging chandeliers
{ for (const s of [-1, 1]) for (let z = 2.3; z >= -11; z -= 3.4) { const b = cloth(HALL, [s * 5.72, 6.2, z], 1.0, 3.0, '#ffffff', { map: crestTex('#6a2a8c', '#f2c94c'), r: [0, -s * 90, 0], amp: .025 }); }
  HA.chand = []; for (const z of [-1, -6.5]) { const c = group({ p: [0, 7.2, z], parent: HALL }); cylBetween([0, 0, 0], [0, 6, 0], .02, toon('#3a3040'), c, 4);
    mesh(new THREE.TorusGeometry(.9, .06, 8, 24), toon('#c9a24a'), { r: [90, 0, 0], parent: c });
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; mesh(new THREE.CylinderGeometry(.04, .04, .22, 6), toon('#f4ecd8'), { p: [Math.cos(a) * .9, .15, Math.sin(a) * .9], parent: c });
      const f = mesh(new THREE.SphereGeometry(.06, 8, 6), basic('#ffd27a', { add: true, transparent: true, opacity: .9 }), { p: [Math.cos(a) * .9, .32, Math.sin(a) * .9], parent: c, cast: false }); f.userData.noInk = true; HA.chand.push(f); } } }
// balcony: big moon + glow, a few banners on the wall
{ BALC.userData.moon = mesh(new THREE.CircleGeometry(4, 40), basic('#fff6d8', { fog: false }), { p: [8, 22, -60], parent: BALC, cast: false }); BALC.userData.moon.userData.noInk = true;
  const gl = mesh(new THREE.CircleGeometry(9, 40), basic('#b8c8ff', { fog: false, transparent: true, opacity: .18, add: true, depthWrite: false }), { p: [8, 22, -60.5], parent: BALC, cast: false }); gl.userData.noInk = true;
  for (const x of [-2.6, 2.6]) cloth(BALC, [x, 3.6, -2.95], .9, 2.2, '#ffffff', { map: crestTex('#24468e', '#f2c94c'), amp: .07 }); }
// field: battle flags along the army

// ---------- v4.23 PROP LIBRARY (refs: barrels, crates, carts, tents, racks, shields, lanterns, skulls...) ----------
const PM = (c) => toon(c), WOOD = '#8a5a36', WOOD2 = '#6e4426', IRON = '#5a5a68', GOLD = '#d9a93a';
const stripeTex2 = (a, b, n = 8) => T(256, 64, (x, w, h) => { for (let i = 0; i < n; i++) { x.fillStyle = i % 2 ? b : a; x.fillRect(i * w / n, 0, w / n + 1, h); } }, {});
function barrel(par, p, s = 1, ry = 0) { const g = group({ p, s: [s, s, s], r: [0, ry, 0], parent: par });
  const pts = []; for (let i = 0; i <= 8; i++) { const y = i / 8; pts.push(new THREE.Vector2(.36 + Math.sin(y * Math.PI) * .07, y * 1.0)); }
  mesh(new THREE.LatheGeometry(pts, 16), PM(WOOD), { parent: g }); mesh(new THREE.CircleGeometry(.36, 16), PM(WOOD2), { p: [0, 1, 0], r: [-90, 0, 0], parent: g });
  for (const y of [.14, .5, .86]) mesh(new THREE.TorusGeometry(.36 + Math.sin(y * Math.PI) * .07 + .005, .022, 6, 20), PM(IRON), { p: [0, y, 0], r: [90, 0, 0], parent: g }); return g; }
function crate(par, p, s = 1, ry = 0) { const g = group({ p, s: [s, s, s], r: [0, ry, 0], parent: par }); mesh(rbox(.8, .8, .8), toon('#ffffff', { map: woodTex }), { p: [0, .4, 0], parent: g });
  for (const sg of [-1, 1]) { mesh(rbox(.1, 1.05, .04), PM(WOOD2), { p: [0, .4, sg * .41], r: [0, 0, 45], parent: g }); mesh(rbox(.04, 1.05, .1), PM(WOOD2), { p: [sg * .41, .4, 0], r: [45, 0, 0], parent: g }); } return g; }
function wheel(par, p, r = .55, ry = 0) { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(new THREE.TorusGeometry(r, .05, 6, 20), PM(WOOD2), { parent: g }); mesh(new THREE.CylinderGeometry(.09, .09, .16, 10), PM(IRON), { r: [90, 0, 0], parent: g });
  for (let k = 0; k < 8; k++) mesh(rbox(.04, r * 2, .04), PM(WOOD), { r: [0, 0, k * 22.5], parent: g }); return g; }
function cart(par, p, ry = 0, load = 'hay') { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(rbox(1.6, .14, 2.4), toon('#ffffff', { map: woodTex }), { p: [0, .75, 0], parent: g });
  for (const sg of [-1, 1]) { mesh(rbox(.08, .4, 2.4), PM(WOOD), { p: [sg * .8, .98, 0], parent: g }); wheel(g, [sg * .9, .55, -.3], .55, 90); mesh(rbox(.06, .06, 1.6), PM(WOOD2), { p: [sg * .35, .62, 2.0], parent: g }); }
  if (load === 'hay') mesh(new THREE.SphereGeometry(.9, 12, 8), PM('#d9b85a'), { p: [0, .95, 0], s: [.85, .55, 1.3], parent: g }); else { barrel(g, [-.35, .82, -.5], .7); barrel(g, [.35, .82, -.5], .7); crate(g, [0, .82, .55], .7, 20); } return g; }
function tent(par, p, s = 1, c1 = '#efe6d2', c2 = '#b0303a', ry = 0) { const g = group({ p, s: [s, s, s], r: [0, ry, 0], parent: par });
  mesh(new THREE.ConeGeometry(1.8, 2.6, 8, 1, true), toon('#ffffff', { map: stripeTex2(c1, c2), side: THREE.DoubleSide }), { p: [0, 1.3, 0], parent: g });
  cylBetween([0, 2.5, 0], [0, 3.3, 0], .03, PM(WOOD2), g, 4); const f = mesh(new THREE.PlaneGeometry(.5, .28), toon(c2, { side: THREE.DoubleSide }), { p: [.26, 3.15, 0], parent: g, cast: false }); return g; }
function spearRack(par, p, ry = 0) { const g = group({ p, r: [0, ry, 0], parent: par }); for (const x of [-.7, .7]) cylBetween([x, 0, 0], [x, 1.1, 0], .04, PM(WOOD2), g, 6); cylBetween([-.75, 1, 0], [.75, 1, 0], .035, PM(WOOD2), g, 6);
  for (let k = 0; k < 5; k++) { const x = -.5 + k * .25; cylBetween([x, 0, .12], [x - .08, 2.2, -.05], .02, PM(WOOD), g, 4); mesh(new THREE.ConeGeometry(.05, .22, 4), PM('#c8ced8'), { p: [x - .085, 2.3, -.06], parent: g }); } return g; }
function shield(par, p, r = .45, ry = 0, c = '#24468e', rim = GOLD) { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(new THREE.CylinderGeometry(r, r, .06, 24), PM(c), { r: [90, 0, 0], parent: g });
  mesh(new THREE.TorusGeometry(r, .04, 6, 24), PM(rim), { parent: g }); mesh(new THREE.SphereGeometry(r * .22, 12, 8), PM('#d8dde6'), { p: [0, 0, .04], s: [1, 1, .6], parent: g }); return g; }
function armorStand(par, p, ry = 0) { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(new THREE.CylinderGeometry(.35, .4, .25, 12), PM('#5a5470'), { p: [0, .12, 0], parent: g });
  cylBetween([0, .25, 0], [0, 1.0, 0], .04, PM(IRON), g, 6); mesh(new THREE.CapsuleGeometry(.32, .45, 6, 12), PM('#c8ced8'), { p: [0, 1.35, 0], s: [1, 1, .8], parent: g });
  mesh(new THREE.SphereGeometry(.28, 14, 10), PM('#d8dde6'), { p: [0, 2.0, 0], parent: g }); mesh(rbox(.36, .05, .1), PM('#2a2a34'), { p: [0, 2.0, .25], parent: g });
  mesh(new THREE.ConeGeometry(.07, .3, 6), PM('#b0303a'), { p: [0, 2.35, 0], parent: g }); for (const sg of [-1, 1]) mesh(new THREE.SphereGeometry(.16, 10, 8), PM('#d8dde6'), { p: [sg * .36, 1.65, 0], s: [1, .7, 1], parent: g }); return g; }
function lantern(par, p, h = 1.8, warm = '#ffcf6a') { const g = group({ p, parent: par }); if (h > 0) cylBetween([0, 0, 0], [0, h, 0], .035, PM('#3a3040'), g, 6);
  mesh(rbox(.22, .3, .22), basic(warm, { transparent: true, opacity: .95 }), { p: [0, h + .05, 0], parent: g, cast: false }); mesh(new THREE.ConeGeometry(.2, .16, 4), PM('#3a3040'), { p: [0, h + .28, 0], r: [0, 45, 0], parent: g });
  const gl = glowSprite(warm, 1.6, { opacity: .55 }); gl.position.set(0, h + .05, 0); g.add(gl); return g; }
function candles(par, p, n = 3) { const g = group({ p, parent: par }); const R = rng(n * 13); for (let k = 0; k < n; k++) { const h = .2 + R() * .3, x = (R() - .5) * .4, z = (R() - .5) * .3;
  mesh(new THREE.CylinderGeometry(.045, .05, h, 8), PM('#efe6d2'), { p: [x, h / 2, z], parent: g }); const f = mesh(new THREE.SphereGeometry(.035, 6, 6), basic('#ffd27a'), { p: [x, h + .04, z], s: [1, 1.6, 1], parent: g, cast: false }); f.userData.noInk = true; }
  const gl = glowSprite('#ffb84a', 1.4, { opacity: .5 }); gl.position.set(0, .45, 0); g.add(gl); return g; }
function skull(par, p, s = 1, ry = 0) { const g = group({ p, s: [s, s, s], r: [0, ry, 0], parent: par }); mesh(new THREE.SphereGeometry(.16, 12, 10), PM('#e8e0cc'), { p: [0, .16, 0], s: [1, .95, 1.05], parent: g });
  mesh(rbox(.18, .08, .14), PM('#e8e0cc'), { p: [0, .05, .04], parent: g }); for (const sg of [-1, 1]) mesh(new THREE.SphereGeometry(.045, 8, 6), PM('#1a1420'), { p: [sg * .06, .17, .13], parent: g }); return g; }
function bone(par, p, ry = 0) { const g = group({ p, r: [0, ry, 90], parent: par }); cylBetween([0, -.22, 0], [0, .22, 0], .025, PM('#e8e0cc'), g, 6); for (const y of [-.24, .24]) for (const x of [-.03, .03]) mesh(new THREE.SphereGeometry(.035, 6, 6), PM('#e8e0cc'), { p: [x, y, 0], parent: g }); return g; }
function cloud(par, p, s = 1) { const g = group({ p, s: [s, s, s], parent: par }); const R = rng(Math.round(p[0] * 7 + p[2])); for (let k = 0; k < 6; k++) { const m = mesh(new THREE.SphereGeometry(1 + R() * .8, 12, 8), basic('#ffffff', { transparent: true, opacity: .92 }), { p: [(k - 2.5) * 1.3, R() * .6, R() * .5], parent: g, cast: false }); m.userData.noInk = true; } return g; }
function castle(par, p, s = 1, roof = '#2a4f9e') { const g = group({ p, s: [s, s, s], parent: par }); const st = toon('#d8d2c4');
  mesh(rbox(10, 3.2, 1), st, { p: [0, 1.6, 0], parent: g }); for (let k = 0; k < 9; k++) mesh(rbox(.6, .5, 1.05), st, { p: [-4.5 + k * 1.12, 3.4, 0], parent: g });
  for (const x of [-5.2, 5.2, 0]) { const h = x ? 5 : 7; mesh(new THREE.CylinderGeometry(1.1, 1.2, h, 12), st, { p: [x, h / 2, .3], parent: g }); mesh(new THREE.ConeGeometry(1.4, 2.4, 12), PM(roof), { p: [x, h + 1.2, .3], parent: g });
    const f = cloth(g, [x, h + 3.4, .3], .5, .9, '#ffffff', { map: crestTex('#b0303a', '#f2c94c'), r: [0, 0, 90], amp: .08 }); cylBetween([x, h + 2.2, .3], [x, h + 3.5, .3], .04, PM(WOOD2), g, 4); }
  mesh(rbox(1.8, 2.2, .3), PM('#3a2a20'), { p: [0, 1.1, .55], parent: g }); return g; }
function grassField(par, n, area, seed = 3, col = '#7aa64a') { const R = rng(seed), geo = new THREE.ConeGeometry(.028, .2, 3), im = new THREE.InstancedMesh(geo, toon(col), n * 3); let i = 0;
  for (let k = 0; k < n; k++) { const x = area[0] + R() * (area[1] - area[0]), z = area[2] + R() * (area[3] - area[2]); for (let j = 0; j < 3; j++) { _p.set(x + (j - 1) * .07, .15, z + (R() - .5) * .06); _q.setFromEuler(new THREE.Euler((R() - .5) * .5, 0, (j - 1) * .35)); _s.set(1, .7 + R() * .6, 1); _m4.compose(_p, _q, _s); im.setMatrixAt(i++, _m4); } }
  im.castShadow = false; im.userData.noInk = true; par.add(im); return im; }
function stones(par, n, area, seed = 5, col = '#a89a84') { const R = rng(seed), im = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.12, 0), toon(col), n);
  for (let k = 0; k < n; k++) { _p.set(area[0] + R() * (area[1] - area[0]), .01, area[2] + R() * (area[3] - area[2])); _q.setFromEuler(new THREE.Euler(0, R() * 6, 0)); const s = .5 + R() * 1.2; _s.set(s, .25 * s, s * (.7 + R() * .6)); _m4.compose(_p, _q, _s); im.setMatrixAt(k, _m4); }
  im.castShadow = false; par.add(im); return im; }

// ---------- dressing each set ----------
{ // FIELD: dirt road, grass tufts, army camp (tents, racks, barrels, crates, cart), snow-capped peaks, rolling hills, clouds, a castle on the hill
  mesh(rbox(5, .02, 80), PM('#9a8060'), { p: [0, .005, 0], parent: FIELD, cast: false }); stones(FIELD, 160, [-2.4, 2.4, -30, 30], 11);
  grassField(FIELD, 700, [-16, 16, -22, 22], 3, '#7e9a50'); grassField(FIELD, 300, [-30, 30, -60, -22], 4, '#728e48');
  for (const [x, z] of [[-60, -150], [-20, -170], [30, -160], [75, -150]]) { mesh(new THREE.SphereGeometry(40, 20, 12), PM('#5f8a4a'), { p: [x, -22, z + 60], s: [1.4, .6, 1], parent: FIELD, cast: false }); }
  const R = rng(21); for (let i = 0; i < 9; i++) { const x = -180 + i * 45 + R() * 20, z = -190 - R() * 40, h = 40 + R() * 40; mesh(new THREE.ConeGeometry(9 + R() * 4, 12, 5), PM('#f4f2ec'), { p: [x, 15 + h / 2 - 2, z + 1], parent: FIELD, cast: false }); }
  for (const [x, y, z, s] of [[-40, 40, -120, 4], [20, 48, -140, 5], [60, 36, -110, 3.5], [-80, 52, -150, 5], [0, 30, -90, 3]]) cloud(FIELD, [x, y, z], s);
  castle(FIELD, [-28, 4, -60], 1.6); }
{ // HALL: armour stands along the carpet, shields + crossed spears on the pillars, candelabras, chests
  for (const s of [-1, 1]) for (let z = 4; z >= -13; z -= 3.4) { shield(HALL, [s * 3.0, 3.2, z], .5, s * 90, s < 0 ? '#6a2a8c' : '#24468e'); }
  for (const [x, z] of [[-2.2, -9.8], [2.2, -9.8], [-1.8, 3.6], [1.8, 3.6]]) { cylBetween([x, 0, z], [x, 1.6, z], .05, PM(GOLD), HALL, 6); candles(HALL, [x, 1.6, z], 3); }
  for (const [x, z] of [[-4.6, -3], [4.6, 0.5]]) { crate(HALL, [x, 0, z], .9, 15); barrel(HALL, [x + .2, 0, z + 1.2], .85); } }
{ // BALCONY: lanterns on the railing, potted plants, a far castle with lit windows on the hill, clouds across the moon
  for (const x of [-4, -1.4, 1.4, 4]) lantern(BALC, [x, 1.1, -2.8], .35, '#ffcf6a');
  for (const x of [-3.2, 3.2]) { mesh(new THREE.CylinderGeometry(.32, .24, .5, 12), PM('#a0583a'), { p: [x, .25, -2.2], parent: BALC }); mesh(new THREE.SphereGeometry(.45, 12, 10), PM('#3e7a4a'), { p: [x, .75, -2.2], s: [1, .9, 1], parent: BALC }); }
  castle(BALC, [18, -6, -70], 2.2, '#3a2a5a'); for (const [x, y, z, s] of [[2, 26, -58, 2.4], [16, 30, -64, 3]]) { const c = cloud(BALC, [x, y, z], s); c.children.forEach(m => m.material = basic('#8a90c0', { transparent: true, opacity: .8 })); } }
{ // CRYPT: skulls, bones, candle clusters, broken pillars, hanging chains, a coffin
  const R = rng(31); for (let i = 0; i < 18; i++) skull(CRYPT, [(R() - .5) * 18, 0, -4 - R() * 14], .9 + R() * .6, R() * 6);
  for (let i = 0; i < 24; i++) bone(CRYPT, [(R() - .5) * 18, .03, -3 - R() * 15], R() * 6);
  for (const [x, z] of [[-4, -5], [4, -5.5], [-6.5, -9], [6.5, -9.5], [-2.5, -2.5], [2.8, -2.8]]) candles(CRYPT, [x, 0, z], 5);
  for (const [x, z, h] of [[-7.5, -6, 3.5], [7.5, -6.5, 2.2], [-9, -12, 6], [9, -13, 4.5]]) { mesh(new THREE.CylinderGeometry(.55, .65, h, 10), PM('#5a5470'), { p: [x, h / 2, z], parent: CRYPT }); mesh(rbox(1.5, .3, 1.5), PM('#4a4460'), { p: [x, .15, z], parent: CRYPT }); }
  for (const [x, z] of [[-3, -7], [3.4, -7.5]]) for (let k = 0; k < 9; k++) mesh(new THREE.TorusGeometry(.09, .025, 6, 10), PM(IRON), { p: [x, 8 - k * .17, z], r: [0, k % 2 ? 90 : 0, 0], parent: CRYPT });
  const cf = group({ p: [5, 0, -3.6], r: [0, -30, 0], parent: CRYPT }); mesh(rbox(1, .6, 2.3), PM('#4a3020'), { p: [0, .3, 0], parent: cf }); mesh(rbox(1.08, .12, 2.38), PM('#3a2418'), { p: [.15, .66, -.1], r: [0, 8, 0], parent: cf }); cylBetween([0, .73, -.6], [0, .73, .4], .03, PM(GOLD), cf, 4); cylBetween([-.3, .73, -.3], [.3, .73, -.3], .03, PM(GOLD), cf, 4); }
{ // VILLAGE: fences, a well, haystacks, barrels, lanterns, trees; the hut gets a table, a chair, a candle and a shelf
  for (let i = 0; i < 12; i++) { const x = -14 + i * 2.4; cylBetween([x, 0, -2], [x, 1, -2], .06, PM(WOOD2), VILL, 5); if (i < 11) { cylBetween([x, .7, -2], [x + 2.4, .7, -2], .04, PM(WOOD), VILL, 4); cylBetween([x, .35, -2], [x + 2.4, .35, -2], .04, PM(WOOD), VILL, 4); } }
  const wl = group({ p: [6, 0, -4], parent: VILL }); mesh(new THREE.CylinderGeometry(.9, .95, .9, 14, 1, true), toon('#8a8494', { side: THREE.DoubleSide }), { p: [0, .45, 0], parent: wl }); for (const x of [-.9, .9]) cylBetween([x, .9, 0], [x, 2.2, 0], .06, PM(WOOD2), wl, 5); mesh(new THREE.ConeGeometry(1.4, .8, 4), PM('#6a4a3a'), { p: [0, 2.5, 0], r: [0, 45, 0], parent: wl });
  for (const [x, z] of [[-9, -4], [-7.6, -4.6]]) mesh(new THREE.SphereGeometry(.9, 12, 8), PM('#d9b85a'), { p: [x, .5, z], s: [1, .8, 1], parent: VILL });
  for (const [x, z] of [[2, -4.5], [2.8, -4.2], [-3, -4.4]]) barrel(VILL, [x, 0, z], .9, x);
  for (const x of [-11, -4, 3, 10]) lantern(VILL, [x, 0, -1.4], 2.0);
  const R = rng(41); for (let i = 0; i < 10; i++) { const x = -26 + i * 5.6 + R() * 2, z = -22 - R() * 6; cylBetween([x, 0, z], [x, 2, z], .25, PM('#5a4030'), VILL, 6); mesh(new THREE.ConeGeometry(1.8, 4, 8), PM('#2f5a3a'), { p: [x, 3.6, z], parent: VILL }); }
  mesh(rbox(1.2, .08, .8), PM(WOOD), { p: [1.2, .75, -1.6], parent: VI.hut }); for (const [x, z] of [[.7, -1.9], [1.7, -1.9], [.7, -1.3], [1.7, -1.3]]) cylBetween([x, 0, z], [x, .72, z], .03, PM(WOOD2), VI.hut, 4);
  candles(VI.hut, [1.3, .79, -1.6], 1); mesh(rbox(1.6, .06, .35), PM(WOOD), { p: [-.4, 2.2, -2.75], parent: VI.hut }); for (let k = 0; k < 5; k++) mesh(rbox(.14, .3 + (k % 2) * .08, .22), PM(['#8a3a3a', '#3a5a8a', '#6a8a3a'][k % 3]), { p: [-1 + k * .2, 2.4, -2.75], parent: VI.hut }); }

// ---------- v4.24 more props (refs: bunting, market stalls, baskets, herbs, torches, campfires) ----------
function bunting(par, a, b, n = 14, cols = ['#b0303a', '#e2b23c', '#24468e']) { cylBetween(a, b, .012, PM('#3a3040'), par, 4);
  for (let k = 0; k < n; k++) { const u = (k + .5) / n, x = a[0] + (b[0] - a[0]) * u, z = a[2] + (b[2] - a[2]) * u, y = a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * .6;
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.16, 0, 0), new THREE.Vector3(.16, 0, 0), new THREE.Vector3(0, -.34, 0)]); g.computeVertexNormals();
    const m = mesh(g, toon(cols[k % cols.length], { side: THREE.DoubleSide }), { p: [x, y, z], r: [0, Math.atan2(b[0] - a[0], b[2] - a[2]) * 57.3 + 90, 0], parent: par, cast: false }); } }
function basket(par, p, fill = '#d8822a', s = 1) { const g = group({ p, s: [s, s, s], parent: par }); mesh(new THREE.CylinderGeometry(.32, .24, .26, 14, 1, true), toon('#b8863a', { side: THREE.DoubleSide }), { p: [0, .13, 0], parent: g });
  mesh(new THREE.TorusGeometry(.32, .025, 6, 16), PM('#9a6a2a'), { p: [0, .26, 0], r: [90, 0, 0], parent: g }); const R = rng(Math.round(p[0] * 10 + p[2]));
  for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283, r = k ? .17 : 0; mesh(new THREE.SphereGeometry(.09, 10, 8), PM(fill), { p: [Math.cos(a) * r, .26 + (k ? 0 : .06), Math.sin(a) * r], parent: g }); } return g; }
function sack(par, p, s = 1) { const g = group({ p, s: [s, s, s], parent: par }); mesh(new THREE.SphereGeometry(.3, 12, 10), PM('#c8b088'), { p: [0, .3, 0], s: [1, 1.2, .9], parent: g }); mesh(new THREE.ConeGeometry(.1, .18, 8), PM('#b89a70'), { p: [0, .72, 0], parent: g }); return g; }
function stall(par, p, ry = 0, c1 = '#b0303a') { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(rbox(2.2, .9, .8), toon('#ffffff', { map: woodTex }), { p: [0, .45, 0], parent: g });
  for (const x of [-1.05, 1.05]) for (const z of [-.35, .35]) cylBetween([x, 0, z], [x, 2.1, z], .04, PM(WOOD2), g, 5);
  mesh(rbox(2.5, .05, 1.3), toon('#ffffff', { map: stripeTex2('#efe6d2', c1, 10) }), { p: [0, 2.15, .15], r: [14, 0, 0], parent: g });
  basket(g, [-.6, .9, 0], '#d8442a', .9); basket(g, [.1, .9, 0], '#c88a3a', .9); basket(g, [.75, .9, 0], '#7ab04a', .9); sack(g, [1.4, 0, .4], .9); sack(g, [-1.4, 0, .3], .8); return g; }
function woodpile(par, p, ry = 0) { const g = group({ p, r: [0, ry, 0], parent: par }); for (let r = 0; r < 3; r++) for (let k = 0; k < 4 - r; k++) mesh(new THREE.CylinderGeometry(.1, .1, .9, 8), PM(k % 2 ? '#8a5a36' : '#9a6a40'), { p: [(k - (3 - r) / 2) * .21, .1 + r * .18, 0], r: [90, 0, 0], parent: g });
  const ax = group({ p: [.6, 0, .2], r: [0, 0, -20], parent: g }); cylBetween([0, 0, 0], [0, .7, 0], .025, PM(WOOD), ax, 5); mesh(rbox(.2, .12, .03), PM('#9aa0ae'), { p: [.08, .65, 0], parent: ax }); return g; }
function torch(par, p, ry = 0) { const g = group({ p, r: [0, ry, 0], parent: par }); cylBetween([0, 0, 0], [0, .5, .15], .03, PM('#3a3040'), g, 5); mesh(new THREE.CylinderGeometry(.07, .05, .14, 8), PM('#5a4030'), { p: [0, .55, .17], parent: g });
  const f = mesh(new THREE.ConeGeometry(.08, .28, 8), basic('#ffb03a', { transparent: true, opacity: .95 }), { p: [0, .74, .17], parent: g, cast: false }); f.userData.noInk = true; FLAMES.push(f);
  const gl = glowSprite('#ff8a2a', 1.8, { opacity: .55 }); gl.position.set(0, .75, .17); g.add(gl); return g; }
function campfire(par, p) { const g = group({ p, parent: par }); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; mesh(new THREE.DodecahedronGeometry(.14, 0), PM('#7a7484'), { p: [Math.cos(a) * .45, .06, Math.sin(a) * .45], parent: g }); }
  for (let k = 0; k < 3; k++) mesh(new THREE.CylinderGeometry(.05, .05, .7, 6), PM('#6a4426'), { p: [0, .12, 0], r: [80, k * 60, 0], parent: g });
  for (let k = 0; k < 3; k++) { const f = mesh(new THREE.ConeGeometry(.16 - k * .03, .55 - k * .1, 8), basic(['#ff8a2a', '#ffb03a', '#ffe08a'][k], { transparent: true, opacity: .9 }), { p: [0, .32, 0], parent: g, cast: false }); f.userData.noInk = true; FLAMES.push(f); }
  for (const x of [-.55, .55]) cylBetween([x, 0, 0], [x, 1.1, 0], .03, PM(WOOD2), g, 4); cylBetween([-.6, 1.05, 0], [.6, 1.05, 0], .025, PM(WOOD2), g, 4);
  mesh(new THREE.SphereGeometry(.22, 12, 8, 0, 6.283, Math.PI / 2, Math.PI / 2), PM('#3a3a44'), { p: [0, .78, 0], parent: g }); const gl = glowSprite('#ff7a2a', 3, { opacity: .5 }); gl.position.set(0, .5, 0); g.add(gl); return g; }
function herbs(par, p) { const g = group({ p, parent: par }); cylBetween([0, 0, 0], [0, -.25, 0], .01, PM('#3a3040'), g, 3); const R = rng(Math.round(p[0] * 9));
  for (let k = 0; k < 5; k++) mesh(new THREE.ConeGeometry(.06, .35, 5), PM(['#5a8a4a', '#7a9a4a', '#4a7a3a'][k % 3]), { p: [(R() - .5) * .14, -.42, (R() - .5) * .1], r: [180 + (R() - .5) * 20, 0, (R() - .5) * 20], parent: g }); return g; }
function flowerBox(par, p, l = 1.2) { const g = group({ p, parent: par }); mesh(rbox(l, .22, .3), PM('#7a4a2a'), { p: [0, .11, 0], parent: g }); const R = rng(Math.round(p[0] * 13));
  for (let k = 0; k < 7; k++) { const x = (k / 6 - .5) * (l - .2); mesh(new THREE.SphereGeometry(.1, 8, 6), PM('#3e7a4a'), { p: [x, .3, 0], parent: g }); mesh(new THREE.SphereGeometry(.05, 8, 6), PM(['#e2445a', '#f2c94c', '#e8a0d0'][k % 3]), { p: [x + .03, .4, .06], parent: g }); } return g; }
const FLAMES = [];
export function flamesAt(t) { FLAMES.forEach((f, i) => { f.scale.set(1 + .12 * Math.sin(t * 11 + i * 2), 1 + .25 * Math.sin(t * 8.3 + i * 1.3), 1 + .12 * Math.cos(t * 9 + i)); }); }
{ // HALL: bunting across the nave + flower urns by the altar
  for (const x of [-3.4, 3.4]) { mesh(new THREE.CylinderGeometry(.3, .2, .6, 12), PM('#d8d2e4'), { p: [x, .3 + .9, -11.4], parent: HALL }); for (let k = 0; k < 5; k++) mesh(new THREE.SphereGeometry(.12, 8, 6), PM(['#e2445a', '#f4ecd8', '#f2c94c'][k % 3]), { p: [x + (k - 2) * .1, 1.65 + (k % 2) * .08, -11.4], parent: HALL }); } }
{ // BALCONY: flower boxes on the railing
  for (const x of [-2.7, 0, 2.7]) flowerBox(BALC, [x, 1.09, -2.8], 1.1); }
{ // CRYPT: wall torches ring the ritual circle
  for (const [x, z] of [[-8, -4], [8, -4], [-9, -10], [9, -10], [-5, -16], [5, -16]]) { mesh(rbox(1.2, 3, .4), PM('#4a4460'), { p: [x, 1.5, z - .3], parent: CRYPT }); torch(CRYPT, [x, 1.6, z - .1], 0); } }
{ // VILLAGE: market stalls, woodpile, string lights; hut: hanging herbs, pots on a shelf, bread basket, broom
  for (const x of [-14, -4, 6]) { const a = [x, 2.4, -1.5], b = [x + 10, 2.4, -1.5]; cylBetween(a, b, .01, PM('#3a3040'), VILL, 3); for (let k = 1; k < 10; k++) { const l = mesh(new THREE.SphereGeometry(.07, 8, 6), basic(['#ffcf6a', '#ff8a5a', '#fff2b0'][k % 3]), { p: [x + k, 2.4 - Math.sin(k / 10 * Math.PI) * .35, -1.5], parent: VILL, cast: false }); l.userData.noInk = true; } }
  for (const x of [-2, -1.4, -.8, .4, 1]) herbs(VI.hut, [x, 3.95, -1.8]);
  for (const [x, c] of [[-1.8, '#5a5a68'], [-1.45, '#a0583a'], [-1.1, '#5a5a68']]) mesh(new THREE.CylinderGeometry(.13, .1, .22, 10), PM(c), { p: [x, 2.36, -2.75], parent: VI.hut });
  basket(VI.hut, [1.0, .79, -1.5], '#c88a3a', .6); const br = group({ p: [2.6, 0, -2.6], r: [0, 0, 12], parent: VI.hut }); cylBetween([0, 0, 0], [0, 1.4, 0], .025, PM(WOOD), br, 4); mesh(new THREE.ConeGeometry(.16, .4, 8), PM('#d9b85a'), { p: [0, .15, 0], r: [180, 0, 0], parent: br }); }

// ---------- v4.25 STORY DRESSING: props that belong to what happens in each scene ----------
{ // BATTLEFIELD (Kael vs the army, then the heroes' charge): standards carried IN the army's front rank, war debris on the ground
  FA.standards = []; for (const c of [2, 7, 12.5, 18, 23]) { const g = group({ parent: FIELD }); g.userData.x = (c - 12.5) * 1.1; cylBetween([0, 0, 0], [0, 3.6, 0], .04, PM(WOOD2), g, 6); mesh(new THREE.ConeGeometry(.06, .2, 6), PM(GOLD), { p: [0, 3.7, 0], parent: g });
    cloth(g, [.03, 3.5, 0], .55, 1.0, '#ffffff', { map: crestTex(c === 12.5 ? '#e2b23c' : '#b0303a', c === 12.5 ? '#b0303a' : '#f2c94c'), r: [0, 0, 90], amp: .08 }); g.visible = false; FA.standards.push(g); }
  const R = rng(61); for (let i = 0; i < 14; i++) { const x = (R() - .5) * 12, z = -2 - R() * 9; if (Math.abs(x) < 1.6) continue; const g = group({ p: [x, 0, z], r: [(R() - .5) * 40, R() * 180, (R() - .5) * 40], parent: FIELD });   // broken spears stuck in the ground
    cylBetween([0, 0, 0], [0, .7 + R() * .6, 0], .018, PM('#6a4a2a'), g, 4); }
  for (let i = 0; i < 7; i++) { const x = (R() - .5) * 11, z = -1 - R() * 8; if (Math.abs(x) < 1.8) continue; const sh = shield(FIELD, [x, .04, z], .34, 0, R() < .5 ? '#b0303a' : '#6a7486', '#9aa0ae'); sh.rotation.set(-Math.PI / 2 + (R() - .5) * .3, 0, R() * 6); }
  for (let i = 0; i < 6; i++) { const m = mesh(new THREE.CircleGeometry(.8 + R() * .9, 20), basic('#2a2228', { transparent: true, opacity: .35, depthWrite: false }), { p: [(R() - .5) * 10, .02, -1 - R() * 9], r: [-90, 0, 0], parent: FIELD, cast: false }); m.userData.noInk = true; } }   // scorch marks
export function armyStandards(k, gone = 0) { FA.standards.forEach((g, i) => { const on = k > .05 && gone < .08; g.visible = on; g.position.set(g.userData.x, 0, -13.6); g.scale.setScalar(Math.max(.001, k)); }); }
{ // WEDDING HALL (the forced engagement): pews for the guests, a flower arch over the altar, rose petals on the carpet, white + gold swags
  for (const s of [-1, 1]) for (let z = 2.6; z >= -8.2; z -= 1.8) { const g = group({ p: [s * 2.7, 0, z], parent: HALL }); mesh(rbox(2.2, .12, .5), PM('#7a4a2e'), { p: [0, .48, 0], parent: g }); mesh(rbox(2.2, .55, .08), PM('#6a3e26'), { p: [0, .8, -.24], parent: g });
    for (const x of [-1.05, 1.05]) mesh(rbox(.08, .5, .5), PM('#5a3420'), { p: [x, .25, 0], parent: g }); mesh(new THREE.SphereGeometry(.13, 8, 6), PM('#f4ecd8'), { p: [-s * 1.1, .95, .05], parent: g }); }
  const ar = group({ p: [0, .9, -11.9], parent: HALL }); mesh(new THREE.TorusGeometry(1.7, .07, 8, 40, Math.PI), PM('#e8e0cc'), { p: [0, 1.4, 0], parent: ar });
  for (let k = 0; k <= 22; k++) { const a = k / 22 * Math.PI, x = Math.cos(a) * 1.7, y = 1.4 + Math.sin(a) * 1.7; mesh(new THREE.SphereGeometry(.13 + (k % 3) * .02, 8, 6), PM(['#f4ecd8', '#e8a0b0', '#f2c94c', '#3e7a4a'][k % 4]), { p: [x, y, .08], parent: ar }); }
  for (const x of [-1.7, 1.7]) cylBetween([x, -.9, 0], [x, 1.4, 0], .06, PM('#e8e0cc'), ar, 6);
  const R = rng(71), pg = new THREE.CircleGeometry(.05, 6), pim = new THREE.InstancedMesh(pg, basic('#e8708a'), 160); for (let i = 0; i < 160; i++) { _p.set((R() - .5) * 1.4, .045, 3 - R() * 13); _q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, R() * 6)); _s.setScalar(.7 + R() * .8); _m4.compose(_p, _q, _s); pim.setMatrixAt(i, _m4); }
  pim.userData.noInk = true; HALL.add(pim);
  for (let z = 4; z >= -13; z -= 3.4) for (const s of [-1, 1]) { const sw = mesh(new THREE.TorusGeometry(.75, .07, 6, 20, Math.PI), PM('#f4ecd8'), { p: [s * 3.4, 6.1, z - 1.7], r: [0, 90, 180], s: [1, .45, 1], parent: HALL }); mesh(new THREE.SphereGeometry(.16, 8, 6), PM(GOLD), { p: [s * 3.4, 6.1, z], parent: HALL }); } }
{ // BALCONY (the love scene): climbing roses on the pillars and railing
  for (const s of [-1, 1]) for (let k = 0; k < 16; k++) { const a = k * 1.1, y = .2 + k * .3; mesh(new THREE.SphereGeometry(.16, 8, 6), PM('#2f6a3a'), { p: [s * 4.2 + Math.cos(a) * .42, y, 4.0 + Math.sin(a) * .42], parent: BALC }); if (k % 2) mesh(new THREE.SphereGeometry(.09, 8, 6), PM('#d0304a'), { p: [s * 4.2 + Math.cos(a) * .5, y + .05, 4.0 + Math.sin(a) * .5], parent: BALC }); }
  for (let x = -4.4; x <= 4.4; x += .55) { mesh(new THREE.SphereGeometry(.12, 8, 6), PM('#2f6a3a'), { p: [x, 1.12, -2.62], parent: BALC }); if (Math.round(x * 10) % 3 === 0) mesh(new THREE.SphereGeometry(.07, 8, 6), PM('#d0304a'), { p: [x + .05, 1.2, -2.52], parent: BALC }); } }
{ // VILLAGE (a quiet farming village at night): the woodpile stays, plus a plough and a water trough
  woodpile(VILL, [-1, 0, -4.6], 0); mesh(rbox(1.6, .4, .6), PM('#6a4a2a'), { p: [4, .2, -3], parent: VILL }); mesh(rbox(1.5, .05, .5), basic('#4a6a9a'), { p: [4, .38, -3], parent: VILL, cast: false }); }

// ======================= v4.28 FX + STORY PROPS LIBRARY =======================
// text props draw their Thai text lazily (first frame after the Prompt font is ready)
const TXT = [];
function txtTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; TXT.push({ c, t, draw, done: false }); return t; }
function ensureText() { if (!TXT.some(e => !e.done)) return; if (document.fonts && !document.fonts.check('700 40px Prompt')) return; TXT.forEach(e => { if (e.done) return; e.draw(e.c.getContext('2d'), e.c.width, e.c.height); e.t.needsUpdate = true; e.done = true; }); }
const FONT = (px, w = 700) => `${w} ${px}px Prompt, sans-serif`;
// ---------- 3D FX ----------
const crackTex = T(512, 512, (x, w, h) => { const r = rng(17); x.lineCap = 'round'; x.lineJoin = 'round';
  const br = (px, py, a, len, wd, d) => { if (d > 5 || len < 8) return; let X = px, Y = py; x.beginPath(); x.moveTo(X, Y); const n = 5; for (let i = 0; i < n; i++) { a += (r() - .5) * .9; X += Math.cos(a) * len / n; Y += Math.sin(a) * len / n; x.lineTo(X, Y); }
    x.lineWidth = wd; x.stroke(); if (r() < .8) br(X, Y, a + (r() - .5) * 1.4, len * .62, wd * .7, d + 1); if (r() < .6) br(X, Y, a + (r() < .5 ? -1 : 1) * (.5 + r() * .6), len * .55, wd * .6, d + 1); };
  for (const [col, wd] of [['rgba(255,40,60,.35)', 22], ['#ff3048', 8], ['#ffd0d8', 2.5]]) { x.strokeStyle = col; const r0 = rng(17); for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283 + r0() * .4; const rr = r; br(256, 256, a, 120 + r0() * 60, wd, 0); } }
  const g = x.createRadialGradient(256, 256, 0, 256, 256, 60); g.addColorStop(0, 'rgba(255,90,90,.9)'); g.addColorStop(1, 'rgba(255,0,40,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, {});
const CRACKS = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), basic('#ffffff', { map: crackTex, transparent: true, add: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.visible = false; m.userData.noInk = true; scene.add(m); return m; });
export function cracksAt(i, p, k, size = 6) { const m = CRACKS[i]; m.visible = k > 0; if (!m.visible) return; m.position.set(p.x ?? p[0], (p.y ?? p[1]) + .03, p.z ?? p[2]); const s = size * (.15 + .85 * (1 - Math.pow(1 - Math.min(1, k), 3))); m.scale.set(s, s, 1); m.material.opacity = Math.min(1, k * 3) * (k > 1 ? Math.max(0, 2 - k) : 1); }
const RAYS = group({ parent: scene }); { for (let i = 0; i < 6; i++) { const m = mesh(new THREE.ConeGeometry(1.2 + i * .25, 26, 16, 1, true), basic('#fff2c0', { transparent: true, opacity: .1, add: true, depthWrite: false, side: THREE.DoubleSide }), { p: [(i - 2.5) * 1.6, 13, (i % 2) * 1.2], r: [0, 0, (i - 2.5) * 3], parent: RAYS, cast: false }); m.userData.noInk = true; } RAYS.visible = false; }
export function raysAt(p, k, t = 0, col = '#fff2c0') { RAYS.visible = k > 0; if (!k) return; RAYS.position.set(p.x ?? p[0], p.y ?? p[1], p.z ?? p[2]); RAYS.children.forEach((m, i) => { m.material.color.set(col); m.material.opacity = k * (.07 + .05 * Math.sin(t * 1.3 + i * 1.7)); }); }
const FOG = [], fogTex = T(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, {});
for (let i = 0; i < 26; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogTex, transparent: true, depthWrite: false, opacity: 0 })); s.userData.noInk = true; s.visible = false; scene.add(s); FOG.push(s); }
export function fogAt(p, t, k = 1, col = '#b8b0d8', spread = 9) { const r = rng(23); FOG.forEach((s, i) => { s.visible = k > 0; if (!k) return; const x = (r() - .5) * spread * 2 + Math.sin(t * .15 + i) * 1.2, z = (r() - .5) * spread * 1.6;
  s.position.set((p.x ?? p[0]) + x, (p.y ?? p[1]) + .25 + r() * .4, (p.z ?? p[2]) + z); s.scale.set(4 + r() * 3, 1.6 + r(), 1); s.material.color.set(col); s.material.opacity = k * (.35 + .2 * Math.sin(t * .4 + i)); }); }
const ROCKS = group({ parent: scene }); { const R = rng(29); for (let i = 0; i < 14; i++) { const m = mesh(new THREE.DodecahedronGeometry(.12 + R() * .2, 0), toon('#6e6878'), { p: [(R() - .5) * 4, 0, (R() - .5) * 3], r: [R() * 90, R() * 90, 0], parent: ROCKS }); m.userData.h = .4 + R() * 2.2; m.userData.ph = R() * 6; } ROCKS.visible = false; }
export function rocksAt(p, t, k) { ROCKS.visible = k > 0; if (!k) return; ROCKS.position.set(p.x ?? p[0], p.y ?? p[1], p.z ?? p[2]); ROCKS.children.forEach(m => { m.position.y = m.userData.h * Math.min(1, k) + Math.sin(t * 1.5 + m.userData.ph) * .08; m.rotation.y = t * .5 + m.userData.ph; }); }
// ---------- STORY PROPS (each returns a group; place with parent + position) ----------
export const PROP = {};
PROP.wantedWall = (par, p, ry = 0) => { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(rbox(4.4, 2.6, .25), toon('#ffffff', { map: wallTex }), { p: [0, 1.3, -.1], parent: g });
  const tex = txtTex(512, 704, (x, w, h) => { x.fillStyle = '#efe0bc'; x.fillRect(0, 0, w, h); x.strokeStyle = '#6a3a1a'; x.lineWidth = 14; x.strokeRect(14, 14, w - 28, h - 28); x.textAlign = 'center'; x.fillStyle = '#8a1a1a'; x.font = FONT(84); x.fillText('ประกาศจับ', w / 2, 120);
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(w / 2, 320, 130, 0, 7); x.fill(); x.lineWidth = 8; x.strokeStyle = '#1c1420'; x.stroke(); x.fillStyle = '#1c1420'; x.beginPath(); x.arc(w / 2, 300, 132, Math.PI * 1.05, Math.PI * 1.95); x.fill(); x.fillStyle = '#d01a2a'; x.beginPath(); x.arc(w / 2 - 45, 330, 16, 0, 7); x.arc(w / 2 + 45, 330, 16, 0, 7); x.fill();
    x.fillStyle = '#3a2010'; x.font = FONT(64); x.fillText('ราชันแห่งบาป', w / 2, 540); x.font = FONT(44, 600); x.fillText('ค่าหัว: ทั้งอาณาจักร', w / 2, 620); });
  const R = rng(37); for (let i = 0; i < 6; i++) { const m = mesh(new THREE.PlaneGeometry(.78, 1.07), toon('#ffffff', { map: tex }), { p: [-1.6 + (i % 4) * 1.05 + (i > 3 ? .5 : 0), 1.85 - (i > 3 ? 1.15 : 0) - (i % 2) * .06, .04 + i * .002], r: [0, 0, (R() - .5) * 10], parent: g, cast: false }); m.userData.noInk = true; } return g; };
PROP.prophecyStone = (par, p, ry = 0) => { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(rbox(2.2, 2.8, .5), toon('#6e6a80'), { p: [0, 1.4, 0], parent: g }); mesh(new THREE.CylinderGeometry(1.1, 1.1, .5, 20, 1, false, 0, Math.PI), toon('#6e6a80'), { p: [0, 2.8, 0], r: [90, 0, 90], parent: g });
  const tex = txtTex(512, 640, (x, w, h) => { x.clearRect(0, 0, w, h); x.textAlign = 'center'; x.shadowColor = '#ff2a4a'; x.shadowBlur = 30; x.fillStyle = '#ffd0d8'; x.font = FONT(58); ['จอมมาร', 'จะกลับมา', 'ในอีก', '100 ปี'].forEach((l, i) => x.fillText(l, w / 2, 140 + i * 125)); });
  const m = mesh(new THREE.PlaneGeometry(1.8, 2.25), basic('#ffffff', { map: tex, transparent: true, add: true, depthWrite: false }), { p: [0, 1.65, .27], parent: g, cast: false }); m.userData.noInk = true; g.userData.glow = m; return g; };
PROP.countdown = (par, p, txt = 'อีก 3 วัน', ry = 0) => { const g = group({ p, r: [0, ry, 0], parent: par }); for (const x of [-.75, .75]) cylBetween([x, 0, 0], [x, 2.0, 0], .05, PM(WOOD2), g, 6);
  const tex = txtTex(512, 300, (x, w, h) => { x.fillStyle = '#f4ecd8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#8a1f2e'; x.lineWidth = 16; x.strokeRect(10, 10, w - 20, h - 20); x.textAlign = 'center'; x.fillStyle = '#5a3a20'; x.font = FONT(46, 600); x.fillText('งานอภิเษกสมรส', w / 2, 100); x.fillStyle = '#c0182a'; x.font = FONT(96); x.fillText(txt, w / 2, 220); });
  mesh(rbox(1.7, 1.0, .08), toon('#ffffff', { map: tex }), { p: [0, 1.6, 0], parent: g }); const hg = group({ p: [0, 2.35, 0], parent: g }); for (const s of [-1, 1]) mesh(new THREE.ConeGeometry(.22, .4, 16), basic('#cfe8ff', { transparent: true, opacity: .55 }), { p: [0, s * .2, 0], r: [s > 0 ? 180 : 0, 0, 0], parent: hg });
  mesh(new THREE.ConeGeometry(.16, .22, 16), toon('#e2c070'), { p: [0, -.28, 0], parent: hg }); for (const y of [-.42, .42]) mesh(new THREE.CylinderGeometry(.28, .28, .05, 16), PM(WOOD), { p: [0, y, 0], parent: hg }); return g; };
PROP.letter = (par) => { const g = group({ parent: par }); mesh(rbox(.34, .22, .01), toon('#f2e6c8'), { parent: g }); mesh(new THREE.CylinderGeometry(.05, .05, .02, 14), toon('#b0101e'), { p: [0, 0, .012], r: [90, 0, 0], parent: g }); return g; };
PROP.blackSword = (par) => { const g = group({ parent: par }); mesh(new THREE.CylinderGeometry(.02, .02, .16, 8), toon('#3a2a3a'), { parent: g }); mesh(rbox(.2, .03, .04), toon('#5a1a2a'), { p: [0, .09, 0], parent: g });
  mesh(rbox(.05, .78, .012), toon('#1c1622', { emissive: '#3a0a2a', ei: .6 }), { p: [0, .5, 0], parent: g }); const e = mesh(rbox(.012, .74, .014), basic('#ff3050'), { p: [0, .5, .002], parent: g, cast: false }); e.userData.noInk = true; return g; };
PROP.thornCrown = (par, p = [0, 0, 0]) => { const g = group({ p, parent: par }); mesh(new THREE.TorusGeometry(.2, .03, 6, 20), toon('#2a2230'), { r: [90, 0, 0], parent: g }); for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283; mesh(new THREE.ConeGeometry(.03, .14, 5), toon('#3a2a3a'), { p: [Math.cos(a) * .2, .07, Math.sin(a) * .2], parent: g }); } return g; };
PROP.crystalStaff = (par) => { const g = group({ parent: par }); mesh(new THREE.CylinderGeometry(.02, .025, 1.6, 8), toon('#e8e0f0'), { p: [0, .3, 0], parent: g }); const c = mesh(new THREE.OctahedronGeometry(.12, 0), basic('#c8a0ff', { transparent: true, opacity: .95 }), { p: [0, 1.2, 0], s: [1, 1.6, 1], parent: g });
  c.userData.noInk = true; const gl = glowSprite('#b080ff', .9, { opacity: .7 }); gl.position.set(0, 1.2, 0); g.add(gl); return g; };
PROP.bouquet = (par, wilt = 0) => { const g = group({ parent: par }); mesh(new THREE.ConeGeometry(.08, .28, 10), toon('#f4ecd8'), { p: [0, -.08, 0], r: [180, 0, 0], parent: g });
  for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283, r = k ? .08 : 0; const c = new THREE.Color(k % 2 ? '#e8708a' : '#f4ecd8').lerp(new THREE.Color('#6a5a4a'), wilt); mesh(new THREE.SphereGeometry(.055, 8, 6), toon('#' + c.getHexString()), { p: [Math.cos(a) * r, .1 - wilt * .08 * (k % 3), Math.sin(a) * r], parent: g }); } return g; };
PROP.ring = (par) => { const g = group({ parent: par }); mesh(new THREE.TorusGeometry(.03, .008, 8, 16), toon('#e2b23c'), { parent: g }); const j = mesh(new THREE.OctahedronGeometry(.016, 0), basic('#ff2040'), { p: [0, .035, 0], parent: g }); j.userData.noInk = true; return g; };
PROP.dagger = (par) => { const g = group({ parent: par }); mesh(new THREE.CylinderGeometry(.015, .015, .1, 8), toon('#5a1a2a'), { parent: g }); mesh(rbox(.1, .02, .03), toon('#e2b23c'), { p: [0, .055, 0], parent: g }); mesh(new THREE.ConeGeometry(.025, .26, 4), toon('#dfe3ec'), { p: [0, .2, 0], s: [1, 1, .3], parent: g }); return g; };
PROP.torchHand = (par) => { const g = group({ parent: par }); mesh(new THREE.CylinderGeometry(.025, .03, .6, 8), PM('#6a4426'), { p: [0, .15, 0], parent: g }); const f = mesh(new THREE.ConeGeometry(.07, .24, 8), basic('#ffb03a', { transparent: true, opacity: .95 }), { p: [0, .56, 0], parent: g, cast: false });
  f.userData.noInk = true; FLAMES.push(f); const gl = glowSprite('#ff8a2a', 1.4, { opacity: .55 }); gl.position.set(0, .56, 0); g.add(gl); return g; };
PROP.pitchfork = (par) => { const g = group({ parent: par }); mesh(new THREE.CylinderGeometry(.018, .018, 1.5, 6), PM(WOOD), { p: [0, .35, 0], parent: g }); mesh(rbox(.24, .03, .03), PM(IRON), { p: [0, 1.1, 0], parent: g }); for (const x of [-.11, 0, .11]) mesh(new THREE.ConeGeometry(.015, .26, 4), PM(IRON), { p: [x, 1.25, 0], parent: g }); return g; };
PROP.boneThrone = (par, p, ry = 0) => { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(rbox(1.6, .5, 1.2), toon('#3a3040'), { p: [0, .25, 0], parent: g }); mesh(rbox(1.6, 2.6, .3), toon('#2a2230'), { p: [0, 1.3, -.5], parent: g });
  for (let k = 0; k < 7; k++) { const x = -.75 + k * .25; cylBetween([x, 1.0, -.62], [x * 1.15, 3.1 + (k % 2) * .4, -.7], .03, toon('#c8ced8'), g, 4); mesh(new THREE.ConeGeometry(.05, .2, 4), toon('#c8ced8'), { p: [x * 1.15, 3.2 + (k % 2) * .4, -.7], parent: g }); }
  for (const x of [-.6, 0, .6]) skull(g, [x, 2.55, -.32], 1.1); for (const s of [-1, 1]) { mesh(rbox(.25, .6, 1.2), toon('#3a3040'), { p: [s * .8, .8, 0], parent: g }); skull(g, [s * .8, 1.1, .45], .9); } return g; };
PROP.heroStatue = (par, p, ry = 0) => { const g = group({ p, r: [0, ry, 0], parent: par }); const st = toon('#c8c4b8'); mesh(rbox(1.6, 1.0, 1.6), toon('#9a96a8'), { p: [0, .5, 0], parent: g }); mesh(new THREE.CapsuleGeometry(.42, .7, 8, 16), st, { p: [0, 1.95, 0], parent: g });
  mesh(new THREE.SphereGeometry(.42, 16, 12), st, { p: [0, 2.85, 0], parent: g }); cylBetween([.4, 2.1, .1], [.55, 3.6, .2], .07, st, g, 6); cylBetween([.55, 3.6, .2], [.6, 4.6, .25], .05, st, g, 4); cylBetween([-.4, 2.1, 0], [-.45, 1.4, .1], .07, st, g, 6);
  const tex = txtTex(512, 128, (x, w, h) => { x.fillStyle = '#e2c070'; x.fillRect(0, 0, w, h); x.textAlign = 'center'; x.fillStyle = '#3a2a10'; x.font = FONT(56); x.fillText('ลูเซียน ผู้กล้าแห่งแสง', w / 2, 84); });
  mesh(new THREE.PlaneGeometry(1.4, .35), toon('#ffffff', { map: tex }), { p: [0, .55, .81], parent: g, cast: false }); return g; };
PROP.mirror = (par, p, ry = 0) => { const g = group({ p, r: [0, ry, 0], parent: par }); mesh(new THREE.TorusGeometry(.75, .09, 10, 32), toon('#c9a24a'), { p: [0, 1.6, 0], s: [1, 1.35, 1], parent: g }); cylBetween([0, 0, -.1], [0, .6, -.1], .08, toon('#c9a24a'), g, 8);
  g.userData.glass = mesh(new THREE.CircleGeometry(.72, 32), basic('#3a3450'), { p: [0, 1.6, .01], s: [1, 1.35, 1], parent: g, cast: false }); g.userData.eyes = [-1, 1].map(s => { const e = mesh(new THREE.SphereGeometry(.06, 10, 8), basic('#ff2030', { transparent: true }), { p: [s * .18, 1.7, .03], s: [1.4, .7, .3], parent: g, cast: false }); e.userData.noInk = true; return e; }); return g; };
PROP.mirrorAt = (g, k, t) => { g.userData.eyes.forEach(e => { e.material.opacity = k * (.8 + .2 * Math.sin(t * 9)); e.visible = k > .02; }); g.userData.glass.material.color.set(new THREE.Color('#3a3450').lerp(new THREE.Color('#4a1020'), k)); };
PROP.sealChains = (par, p, n = 6) => { const g = group({ p, parent: par }); g.userData.ch = []; for (let c = 0; c < n; c++) { const a = c / n * 6.283, cg = group({ parent: g }); const L = 9; for (let k = 0; k < 14; k++) { const u = k / 13; mesh(new THREE.TorusGeometry(.13, .04, 6, 12), toon('#8a8494'), { p: [Math.cos(a) * (1.5 + u * L), 3 + u * 3.5, Math.sin(a) * (1.5 + u * L) * .6], r: [0, a * 57 + (k % 2) * 90, 0], parent: cg }); } g.userData.ch.push(cg); } return g; };
PROP.chainsAt = (g, k) => { const n = g.userData.ch.length; g.userData.ch.forEach((cg, i) => { const br = k * n > i + .5; cg.visible = !br; }); };   // k 0..1: chains snap one by one

// ---------- v4.29 HALL fullness (refs: no empty floor): candle stands along the aisle, hanging lanterns, flower vases ----------
{ HA.aisle = group({ parent: HALL }); for (let z = 3.2; z >= -8.6; z -= 2.4) for (const s of [-1, 1]) { const x = s * 1.25; cylBetween([x, 0, z], [x, 1.25, z], .035, PM(GOLD), HA.aisle, 6); mesh(new THREE.CylinderGeometry(.16, .06, .06, 12), PM(GOLD), { p: [x, 1.27, z], parent: HA.aisle }); candles(HA.aisle, [x, 1.3, z], 3); }
  for (let z = 1.5; z >= -9; z -= 3.5) for (const s of [-1, 1]) { const g = group({ p: [s * 2.2, 0, z], parent: HA.aisle }); cylBetween([0, 5.6, 0], [0, 12, 0], .015, PM('#3a3040'), g, 3); lantern(g, [0, 5.2, 0], 0, '#ffcf6a'); }
  for (const [x, z] of [[-4.6, -9.6], [4.6, -9.6], [-4.6, 0], [4.6, 0]]) { mesh(new THREE.CylinderGeometry(.35, .25, .8, 14), PM('#d8d2e4'), { p: [x, .4, z], parent: HA.aisle }); for (let k = 0; k < 7; k++) mesh(new THREE.SphereGeometry(.15, 8, 6), PM(['#e2445a', '#f4ecd8', '#f2c94c', '#e8a0b0'][k % 4]), { p: [x + Math.cos(k) * .2, 1.0 + (k % 3) * .1, z + Math.sin(k) * .2], parent: HA.aisle }); } }
