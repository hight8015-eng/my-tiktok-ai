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

