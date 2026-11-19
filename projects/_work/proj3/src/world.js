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


// ======================= "นาฬิกาพกสีทอง": modern street (x 300), medieval town (origin), the duke's manor hall (x -300) =======================
PRESETS.day = { top: '#2f7fe0', mid: '#86c4f6', hor: '#e8f4ff', glow: '#fff6d8', glowAmt: .5, sunDir: [.35, .62, .6], sunC: '#fff4e0', sunI: 3.0, hemiS: '#dcebff', hemiG: '#a89070', hemiI: 2.5, fog: '#d8e8f8', fogN: 60, fogF: 500, deep: '#2a78cf', shallow: '#74c2f2', glint: '#ffffff', glintAmt: .8, stars: 0, moon: 0, cloud: '#ffffff' };
PRESETS.inside = { top: '#2f7fe0', mid: '#86c4f6', hor: '#e8f4ff', glow: '#fff6d8', glowAmt: 0, sunDir: [-.6, .5, .4], sunC: '#fff0d8', sunI: 2.2, hemiS: '#fff2dc', hemiG: '#8a6a50', hemiI: 2.4, fog: '#3a2a24', fogN: 30, fogF: 120, deep: '#2a78cf', shallow: '#74c2f2', glint: '#ffffff', glintAmt: 0, stars: 0, moon: 0, cloud: '#ffffff' };
PRESETS.insideN = { top: '#14246a', mid: '#2f47a8', hor: '#6178d0', glow: '#8da2ff', glowAmt: 0, sunDir: [-.6, .5, .4], sunC: '#9ab0ff', sunI: 1.3, hemiS: '#8ea0ff', hemiG: '#3c3060', hemiI: 1.9, fog: '#1a2050', fogN: 30, fogF: 120, deep: '#16286a', shallow: '#3d5cb0', glint: '#cfe0ff', glintAmt: 0, stars: 0, moon: 0, cloud: '#4a5aa0' };
export const ST = group({ p: [300, 0, 0], parent: scene }), TW = group({ parent: scene }), HL = group({ p: [-300, 0, 0], parent: scene }); export const XA = {};
const tx = (w, h, f, o) => canvasTex(w, h, f, o);
{ // ---------- modern street (along z) ----------
  mesh(rbox(8, .1, 200), toon('#4a4e5c'), { p: [0, -.05, 0], parent: ST, cast: false }); for (let z = -90; z < 90; z += 4) mesh(rbox(.18, .02, 1.8), toon('#f2e8c8'), { p: [0, .01, z], parent: ST, cast: false });
  for (const s of [-1, 1]) { mesh(rbox(3, .2, 200), toon('#b8b2a8'), { p: [s * 5.5, .1, 0], parent: ST, cast: false });
    const r = rng(s > 0 ? 3 : 4); for (let z = -80; z < 80; z += 7) { const h = 6 + r() * 10, w = 6.4, c = ['#d8a888', '#a8b8d0', '#e0c890', '#b0a0c8', '#c89a8a'][(r() * 5) | 0]; const g = group({ p: [s * (7 + w / 2), 0, z], parent: ST }); mesh(rbox(w, h, 6.6), toon(c), { p: [0, h / 2, 0], parent: g });
      XA.winS = XA.winS || toon('#ffe2a0', { emissive: '#ffb347', ei: .8 }); for (let y = 1.5; y < h - 1; y += 2.2) for (const dz of [-1.8, 0, 1.8]) mesh(rbox(.1, 1.1, .9), XA.winS, { p: [-s * w / 2, y, dz], parent: g, cast: false }); }
    for (let z = -60; z < 60; z += 10) { const g = group({ p: [s * 4.4, .2, z], parent: ST }); cylBetween([0, 0, 0], [0, 3.6, 0], .06, toon('#3a3e48'), g, 6); cylBetween([0, 3.6, 0], [-s * .6, 3.8, 0], .05, toon('#3a3e48'), g, 6); mesh(new THREE.SphereGeometry(.16, 10, 8), toon('#fff2c0', { emissive: '#ffd27a', ei: 1 }), { p: [-s * .6, 3.7, 0], parent: g, cast: false }); const gl = glowSprite('#ffd27a', 2.2, { opacity: .6, fog: true }); gl.position.set(-s * .6, 3.7, 0); g.add(gl); } }
}
{ // ---------- medieval town square ----------
  const cob = tx(256, 256, (x, w, h) => { x.fillStyle = '#b8a688'; x.fillRect(0, 0, w, h); const r = rng(5); x.strokeStyle = 'rgba(70,50,40,.5)'; x.lineWidth = 4; for (let i = 0; i < 40; i++) { x.beginPath(); x.ellipse(r() * w, r() * h, 14 + r() * 10, 10 + r() * 8, r() * 3, 0, 7); x.stroke(); } }, { repeat: [40, 40] });
  mesh(new THREE.PlaneGeometry(200, 200), toon('#ffffff', { map: cob }), { r: [-90, 0, 0], parent: TW, cast: false });
  const timber = (c) => tx(256, 256, (x, w, h) => { x.fillStyle = c; x.fillRect(0, 0, w, h); x.fillStyle = '#5a3a26'; x.fillRect(0, 0, w, 14); x.fillRect(0, h / 2 - 7, w, 14); x.fillRect(0, 0, 14, h); x.fillRect(w - 14, 0, 14, h); x.lineWidth = 12; x.strokeStyle = '#5a3a26'; x.beginPath(); x.moveTo(0, h / 2); x.lineTo(w / 2, 0); x.moveTo(w, h / 2); x.lineTo(w / 2, 0); x.stroke(); x.fillStyle = '#ffe2a0'; x.fillRect(w * .35, h * .62, w * .3, h * .22); x.strokeRect(w * .35, h * .62, w * .3, h * .22); });
  const T1 = [timber('#f2e6cc'), timber('#ecdcc0'), timber('#f4ead8')], roofs = ['#b8483a', '#8a5a3a', '#a8483a', '#6a5a7a'].map(c => toon(c));
  const r = rng(11);
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, R = 10 + r() * 2.5; if (Math.abs(Math.sin(a)) < .25 && Math.cos(a) < 0) continue; const w = 4 + r() * 1.6, h = 4.2 + r() * 2.4; const g = group({ p: [Math.sin(a) * R, 0, Math.cos(a) * R], parent: TW }); g.rotation.y = a + Math.PI;
    const t = T1[i % 3].clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 2.4, h / 2.4); mesh(rbox(w, h, 4), toon('#ffffff', { map: t, unique: true }), { p: [0, h / 2, 0], parent: g });
    const rg = new THREE.ConeGeometry(w * .78, 2.4, 4); rg.rotateY(Math.PI / 4); mesh(rg, roofs[i % 4], { p: [0, h + 1.2, 0], s: [1, 1, 4 / w], parent: g }); mesh(rbox(.9, 1.7, .1), toon('#6a4226'), { p: [w * .2, .85, 2.02], parent: g }); }
  // well in the middle
  { const g = group({ p: [0, 0, 0], parent: TW }); mesh(new THREE.CylinderGeometry(.9, .95, .8, 16), toon('#a8a098'), { p: [0, .4, 0], parent: g }); for (const s of [-1, 1]) cylBetween([s * .8, .8, 0], [s * .8, 2.0, 0], .06, toon('#6a4226'), g, 6); const rf = new THREE.ConeGeometry(1.2, .7, 4); rf.rotateY(Math.PI / 4); mesh(rf, toon('#b8483a'), { p: [0, 2.3, 0], parent: g }); }
  // castle on the hill (-z)
  { const g = group({ p: [0, 0, -46], parent: TW }), st = toon('#c8c0b4'), rf = toon('#4a5aa8'); mesh(rbox(26, 9, 6), st, { p: [0, 4.5, 0], parent: g }); for (const x of [-13, -4.5, 4.5, 13]) { const h = x * x < 30 ? 18 : 13; mesh(new THREE.CylinderGeometry(2.2, 2.4, h, 14), st, { p: [x, h / 2, 1], parent: g }); mesh(new THREE.ConeGeometry(2.8, 4.5, 14), rf, { p: [x, h + 2.2, 1], parent: g }); }
    for (let x = -12; x <= 12; x += 2) mesh(rbox(1, 1, 6.2), st, { p: [x, 9.5, 0], parent: g }); mesh(new THREE.CylinderGeometry(9, 12, 3, 20), toon('#7aa860'), { p: [0, -1, 0], parent: g, cast: false }); }
  // hills
  { const h1 = toon('#8ac070'), h2 = toon('#9ccc80'); for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, R = 120 + r() * 40; mesh(new THREE.SphereGeometry(30 + r() * 20, 14, 8), i % 2 ? h1 : h2, { p: [Math.sin(a) * R, -12, Math.cos(a) * R], s: [1, .6, 1], parent: TW, cast: false, recv: false }); } }
}
{ // ---------- the duke's hall (x -300): back wall z -5, window on the left wall x -6, door on the right wall ----------
  const fl = tx(256, 256, (x, w, h) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#c8b89c' : '#a89478'; x.fillRect(i * 64, j * 64, 64, 64); } }, { repeat: [6, 6] });
  mesh(new THREE.PlaneGeometry(14, 14), toon('#ffffff', { map: fl }), { r: [-90, 0, 0], parent: HL, cast: false });
  const stoneT = tx(256, 256, (x, w, h) => { x.fillStyle = '#c9b8a0'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(80,60,50,.4)'; x.lineWidth = 4; for (let r = 0; r < 4; r++) { x.beginPath(); x.moveTo(0, r * 64); x.lineTo(w, r * 64); x.stroke(); for (let c = 0; c < 3; c++) { const bx = c * 96 + (r % 2) * 48; x.beginPath(); x.moveTo(bx, r * 64); x.lineTo(bx, r * 64 + 64); x.stroke(); } } }, { repeat: [5, 2] });
  XA.wallM = toon('#ffffff', { map: stoneT, unique: true }); const W = (p, s) => mesh(rbox(...s), XA.wallM, { p, parent: HL });
  W([0, 2.5, -5.2], [14, 5, .4]); W([6.2, 2.5, 0], [.4, 5, 14]); W([-6.2, .55, 0], [.4, 1.1, 14]); W([-6.2, 4.1, 0], [.4, 1.8, 14]); W([-6.2, 2.1, -4.0], [.4, 2.1, 6]); W([-6.2, 2.1, 4.0], [.4, 2.1, 6]); // window gap at z -1..1, y 1.1..3.2
  mesh(rbox(14, .3, 14), toon('#6a4a36'), { p: [0, 5.1, 0], parent: HL, cast: false });
  // the window (frame, glass, latch) + the glass shards below it
  XA.win = group({ p: [-6.05, 2.15, 0], parent: HL }); { const fr = toon('#5a3a26'); for (const y of [-1.05, 1.05]) mesh(rbox(.2, .14, 2.1), fr, { p: [0, y, 0], parent: XA.win }); for (const z of [-1.03, 0, 1.03]) mesh(rbox(.2, 2.1, .12), fr, { p: [0, 0, z], parent: XA.win });
    const gm = basic('#bfe4ff', { transparent: true, opacity: .35, noInk: true }); gm.userData.noInk = true; const gl = mesh(new THREE.PlaneGeometry(2, 2), gm, { r: [0, 90, 0], p: [.02, 0, 0], parent: XA.win, cast: false }); gl.userData.noInk = true;
    XA.latch = group({ p: [.12, 0, 0], parent: XA.win }); mesh(rbox(.06, .1, .32), toon('#3a3a44'), { parent: XA.latch }); mesh(rbox(.08, .16, .06), toon('#f2c230'), { p: [.02, 0, .1], parent: XA.latch }); }
  XA.shards = group({ p: [-5.6, .02, .1], parent: HL }); { const sm = toon('#d8f0ff', { emissive: '#bfe4ff', ei: .5 }); const r = rng(13); for (let i = 0; i < 9; i++) { const m = mesh(new THREE.TetrahedronGeometry(.04 + r() * .04), sm, { p: [(r() - .5) * .5, .02, (r() - .5) * .7], r: [r() * 90, r() * 90, 0], parent: XA.shards }); }
    XA.shardGlints = [0, 1, 2].map(i => { const g = glowSprite('#ffffff', .35, { opacity: .8 }); g.position.set((i - 1) * .15, .06, (i - 1) * .2); XA.shards.add(g); return g; }); }
  // banners + pillars + throne + carpet
  XA.hallDeco = group({ parent: HL }); { const bn = tx(128, 256, (x, w, h) => { x.fillStyle = '#9a2a3a'; x.fillRect(0, 0, w, h); x.fillStyle = '#f2c230'; x.beginPath(); x.moveTo(w / 2, 70); x.lineTo(w - 24, 120); x.lineTo(w / 2, 180); x.lineTo(24, 120); x.fill(); x.fillRect(0, 0, w, 14); });
    for (const x of [-3.5, 3.5]) mesh(new THREE.PlaneGeometry(1.2, 2.4), toon('#ffffff', { map: bn }), { p: [x, 3.1, -4.98], parent: XA.hallDeco, cast: false });
    for (const x of [-4.6, 4.6]) for (const z of [-2.6, 1.4]) mesh(new THREE.CylinderGeometry(.32, .36, 5, 12), toon('#d8ccb8'), { p: [x, 2.5, z], parent: XA.hallDeco });
    mesh(rbox(1.8, .02, 10), toon('#a8243a'), { p: [0, .01, 0], parent: XA.hallDeco, cast: false }); mesh(rbox(3.4, .3, 1.8), toon('#a89478'), { p: [0, .15, -4.0], parent: XA.hallDeco });
    XA.throne = group({ p: [0, .3, -4.1], parent: XA.hallDeco }); mesh(rbox(1.1, .5, .9), toon('#8a2a46'), { p: [0, .25, 0], parent: XA.throne }); mesh(rbox(1.2, 1.8, .2), toon('#f2c230'), { p: [0, .9, -.4], parent: XA.throne }); mesh(rbox(.9, 1.4, .1), toon('#8a2a46'), { p: [0, .95, -.28], parent: XA.throne }); }
  // the treasure pedestal: empty glass case
  XA.ped = group({ p: [1.6, 0, -1.6], parent: HL }); { mesh(new THREE.CylinderGeometry(.35, .45, 1.0, 12), toon('#d8ccb8'), { p: [0, .5, 0], parent: XA.ped }); mesh(rbox(.4, .08, .4), toon('#9a2a3a'), { p: [0, 1.04, 0], parent: XA.ped }); const gm = basic('#d8f0ff', { transparent: true, opacity: .22, noInk: true, depthWrite: false }); gm.userData.noInk = true; const c = mesh(rbox(.6, .6, .6), gm, { p: [0, 1.32, 0], parent: XA.ped, cast: false }); c.userData.noInk = true; mesh(new THREE.EdgesGeometry ? rbox(.01, .01, .01) : rbox(.01, .01, .01), gm, { parent: XA.ped }); }
  // the daughter's bedroom props (same room, night)
  XA.bed = group({ parent: HL }); XA.bed.visible = false; { mesh(rbox(2.0, .5, 3.0), toon('#8a5a3a'), { p: [3.4, .25, -2.8], parent: XA.bed }); mesh(rbox(1.9, .25, 2.9), toon('#f8d0e0'), { p: [3.4, .62, -2.8], parent: XA.bed }); mesh(rbox(1.8, 1.4, .15), toon('#8a5a3a'), { p: [3.4, .9, -4.3], parent: XA.bed });
    mesh(rbox(1.6, .08, .9), toon('#a8703e'), { p: [-2.4, .85, -3.8], parent: XA.bed }); for (const [x, z] of [[-3.1, -4.15], [-1.7, -4.15], [-3.1, -3.45], [-1.7, -3.45]]) mesh(rbox(.1, .85, .1), toon('#7a4a2a'), { p: [x, .42, z], parent: XA.bed });
    XA.letterTex = tx(512, 384, (x, w, h) => { x.fillStyle = '#f6ecd0'; x.fillRect(0, 0, w, h); x.fillStyle = '#4a2a1a'; x.font = '700 50px Itim, Prompt'; x.textAlign = 'left'; x.fillText('ถึงแม่นม', 40, 70); x.font = '400 44px Itim, Prompt'; x.fillText('คืนพรุ่งนี้ ข้าจะหนี', 40, 160); x.fillText('ออกจากเมืองนี้', 40, 225); x.fillText('อย่าบอกท่านพ่อ', 40, 290); x.fillStyle = '#9a2a3a'; x.beginPath(); x.arc(440, 330, 30, 0, 7); x.fill(); });
    XA.letter = mesh(new THREE.PlaneGeometry(.5, .375), toon('#ffffff', { map: XA.letterTex }), { r: [-90, 0, 8], p: [-2.4, .9, -3.75], parent: XA.bed, cast: false });
    XA.candleG = group({ p: [-1.9, .89, -4.0], parent: XA.bed }); mesh(new THREE.CylinderGeometry(.04, .04, .22, 8), toon('#fbf2e2'), { p: [0, .11, 0], parent: XA.candleG }); const f = glowSprite('#ffb04a', .8, { opacity: .8 }); f.position.y = .27; XA.candleG.add(f); }
}
// ---------- props ----------
XA.watchTex = tx(256, 256, () => { });
let _wk = ''; export function drawWatch(t01, red = 0) { const key = Math.round(t01 * 120) + '|' + (red > .5 ? 1 : 0); if (key === _wk) return; _wk = key; const x = XA.watchTex.userData.ctx; x.fillStyle = red > .5 ? '#ffd0d0' : '#fff8e8'; x.fillRect(0, 0, 256, 256); x.strokeStyle = '#3a2a1a'; x.lineWidth = 6; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.beginPath(); x.moveTo(128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100); x.lineTo(128 + Math.sin(a) * 84, 128 - Math.cos(a) * 84); x.stroke(); }
  const a = t01 * Math.PI * 2; x.lineWidth = 9; x.strokeStyle = red > .5 ? '#d02020' : '#2a1a10'; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(a) * 82, 128 - Math.cos(a) * 82); x.stroke(); x.lineWidth = 12; x.strokeStyle = '#2a1a10'; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(a / 12 + 5.7) * 50, 128 - Math.cos(a / 12 + 5.7) * 50); x.stroke(); x.fillStyle = '#f2c230'; x.beginPath(); x.arc(128, 128, 10, 0, 7); x.fill(); XA.watchTex.needsUpdate = true; }
drawWatch(.85);
XA.watch = group({ parent: scene }); { const g = toon('#f2c230', { emissive: '#ffb000', ei: .35 }); mesh(new THREE.CylinderGeometry(.11, .11, .04, 24), g, { r: [90, 0, 0], parent: XA.watch }); mesh(new THREE.CircleGeometry(.09, 24), toon('#ffffff', { map: XA.watchTex }), { p: [0, 0, .021], parent: XA.watch, cast: false }); mesh(new THREE.TorusGeometry(.03, .012, 6, 12), g, { p: [0, .135, 0], parent: XA.watch }); mesh(new THREE.CylinderGeometry(.02, .02, .03, 8), g, { p: [0, .115, 0], parent: XA.watch }); XA.watchGlow = glowSprite('#ffe080', .7, { opacity: 0 }); XA.watch.add(XA.watchGlow); }
XA.mag = group({ parent: scene }); { mesh(new THREE.TorusGeometry(.09, .016, 8, 20), toon('#c8a030'), { parent: XA.mag }); const gm = basic('#d8f0ff', { transparent: true, opacity: .35, noInk: true }); gm.userData.noInk = true; const gl = mesh(new THREE.CircleGeometry(.085, 20), gm, { parent: XA.mag, cast: false }); gl.userData.noInk = true; cylBetween([0, -.1, 0], [0, -.26, 0], .02, toon('#5a3a26'), XA.mag, 6); }
XA.sword = group({ parent: scene }); { mesh(rbox(.05, .8, .015), toon('#dce4f0'), { p: [0, .48, 0], parent: XA.sword }); mesh(rbox(.24, .04, .05), toon('#f2c230'), { p: [0, .07, 0], parent: XA.sword }); cylBetween([0, -.08, 0], [0, .06, 0], .022, toon('#5a2a2a'), XA.sword, 6); mesh(new THREE.SphereGeometry(.03, 8, 6), toon('#f2c230'), { p: [0, -.09, 0], parent: XA.sword }); }
XA.scrollTex = tx(256, 512, (x, w, h) => { x.fillStyle = '#f6ecd0'; x.fillRect(0, 0, w, h); x.fillStyle = '#4a2a1a'; x.font = '700 46px Prompt'; x.textAlign = 'center'; x.fillText('หนี้สิน', w / 2, 60); x.font = '400 30px Prompt'; const r = rng(3); for (let i = 0; i < 9; i++) { x.textAlign = 'left'; x.fillText('—', 24, 120 + i * 40); x.textAlign = 'right'; x.fillText(((r() * 900 + 100) | 0) + ' เหรียญ', w - 20, 120 + i * 40); } x.fillStyle = '#c82a2a'; x.font = '700 40px Prompt'; x.textAlign = 'center'; x.fillText('รวม 9,999', w / 2, 490); });
XA.scroll = group({ parent: scene }); { mesh(new THREE.PlaneGeometry(.36, .72), toon('#ffffff', { map: XA.scrollTex, side: THREE.DoubleSide }), { p: [0, -.36, 0], parent: XA.scroll, cast: false }); mesh(new THREE.CylinderGeometry(.03, .03, .42, 8), toon('#c8a868'), { r: [0, 0, 90], parent: XA.scroll }); }
XA.helmet = group({ parent: scene }); { mesh(new THREE.SphereGeometry(.17, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon('#9aa4b4'), { parent: XA.helmet }); mesh(new THREE.CylinderGeometry(.27, .27, .02, 18), toon('#8a94a4'), { parent: XA.helmet }); }
XA.spear = group({ parent: scene }); { cylBetween([0, 0, 0], [0, 2.1, 0], .025, toon('#6a4226'), XA.spear, 6); mesh(new THREE.ConeGeometry(.05, .25, 6), toon('#dce4f0'), { p: [0, 2.2, 0], parent: XA.spear }); }
XA.candle = group({ parent: scene }); { mesh(new THREE.CylinderGeometry(.035, .04, .16, 8), toon('#fbf2e2'), { p: [0, .08, 0], parent: XA.candle }); mesh(new THREE.CylinderGeometry(.08, .08, .02, 12), toon('#c8a030'), { parent: XA.candle }); const f = glowSprite('#ffb04a', .7, { opacity: .85 }); f.position.y = .22; XA.candle.add(f); }
// ---------- camera-attached UI (the mission window) + white flash ----------
scene.add(camera); XA.ui = group({ parent: camera }); XA.uiTex = tx(1024, 760, () => { });
{ const m = basic('#ffffff', { map: XA.uiTex, transparent: true, depthWrite: false, depthTest: false, fog: false, noInk: true }); m.depthTest = false; m.userData.noInk = true; XA.uiM = m; const p = mesh(new THREE.PlaneGeometry(1, .742), m, { parent: XA.ui, cast: false, recv: false }); p.renderOrder = 50; p.userData.noInk = true; XA.uiP = p; }
XA.flash = glowSprite('#ffffff', 6, { opacity: 0 }); XA.flash.material.depthTest = false; XA.flash.renderOrder = 60; XA.flash.position.set(0, 0, -1); camera.add(XA.flash);
let _uk = ''; export function drawUI(mode, a = 0, b = 0) { const key = mode + '|' + a + '|' + b; if (key === _uk) return; _uk = key; const x = XA.uiTex.userData.ctx, W = 1024, H = 760; x.clearRect(0, 0, W, H);
  const red = mode === 'next' || mode === 'glitch'; x.fillStyle = red ? 'rgba(40,6,16,.88)' : 'rgba(10,22,60,.86)'; x.strokeStyle = red ? '#ff4a5a' : '#6ad0ff'; x.lineWidth = 10; x.beginPath(); x.roundRect(14, 14, W - 28, H - 28, 34); x.fill(); x.stroke();
  x.fillStyle = red ? '#ff4a5a' : '#6ad0ff'; x.fillRect(14, 14, W - 28, 96); x.fillStyle = '#0a1030'; x.font = '700 58px Prompt'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const head = { choice: 'ทางเลือก', mission: 'ภารกิจ', day: 'ภารกิจ', glitch: 'ภารกิ#', next: 'ภารกิจต่อไป', done: 'สำเร็จ' }[mode] || ''; x.fillText(head, W / 2, 64);
  const L = (s, y, size, col) => { let f = size; x.font = `700 ${f}px Prompt`; while (x.measureText(s).width > W - 120 && f > 24) { f -= 4; x.font = `700 ${f}px Prompt`; } x.fillStyle = col; x.fillText(s, W / 2, y); };
  if (mode === 'choice') { const box = (y, s1, s2, on) => { x.fillStyle = on ? 'rgba(255,210,74,.25)' : 'rgba(255,255,255,.06)'; x.strokeStyle = on ? '#ffd24a' : 'rgba(255,255,255,.35)'; x.lineWidth = 8; x.beginPath(); x.roundRect(80, y, W - 160, 230, 26); x.fill(); x.stroke(); L(s1, y + 80, 64, on ? '#ffd24a' : '#ffffff'); L(s2, y + 165, 44, '#c8d8ff'); };
    box(150, 'ปฏิเสธ', 'ทำเหมือนไม่เคยพบกัน', a === 1); box(430, 'เข้าร่วมเกม', 'รับเงิน 10,000,000 บาท', a === 2); }
  else if (mode === 'mission') { L('สืบหาคนขโมยเพชร', 250, 84, '#ffffff'); L('ประจำตระกูลดยุค', 360, 74, '#ffd24a'); if (a) { L('เวลา 3 วัน', 540, 110, '#6aff9a'); } }
  else if (mode === 'day') { L('วันที่ ' + a + ' / 3', 300, 130, '#ffffff'); L(a === 1 ? 'สอบสวนผู้ต้องสงสัย 3 คน' : 'ค้นหาหลักฐาน', 500, 60, '#ffd24a'); }
  else if (mode === 'done') { L('สืบคดีแรกสำเร็จ', 330, 92, '#6aff9a'); L('✓', 520, 160, '#6aff9a'); }
  else if (mode === 'glitch') { const r = rng(a + 1); for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(${200 + r() * 55 | 0},${r() * 80 | 0},${r() * 120 | 0},${.3 + r() * .5})`; x.fillRect(30 + r() * (W - 60), 120 + r() * (H - 160), 40 + r() * 300, 6 + r() * 30); } L('สืบคดีแรกสำ#จ', 360, 80, '#ff9aa8'); }
  else if (mode === 'next') { L('จงหาว่าใคร', 280, 96, '#ffffff'); L('เป็นคนฆ่า', 410, 96, '#ff4a5a'); if (a) L('ชายแปลกหน้า', 560, 110, '#ffd24a'); }
  XA.uiTex.needsUpdate = true; }
export function uiAt(k, mode, a, b, z = -1.4, y = .05) { XA.ui.visible = k > .01; if (!XA.ui.visible) return; drawUI(mode, a, b); XA.ui.position.set(0, y, z); XA.ui.scale.setScalar(.25 + .35 * k); XA.uiM.opacity = Math.min(1, k); }
export function flash(k) { XA.flash.material.opacity = k; XA.flash.scale.setScalar(6); }
export function hideSea3() { sea.visible = false; seaFar.visible = false; WAVE.amp = 0; }
export function setScene(which) { ST.visible = which === 'st'; TW.visible = which === 'tw'; HL.visible = which === 'hl'; clouds.visible = which !== 'hl'; }
// freeze-frame dust (stops when time stops)
XA.dust = new THREE.InstancedMesh(new THREE.OctahedronGeometry(.02), basic('#fff2d0', { noInk: true }), 120); XA.dust.material.userData.noInk = true; XA.dust.frustumCulled = false; XA.dust.count = 0; scene.add(XA.dust);
const _M3 = new THREE.Matrix4(), _P3 = new THREE.Vector3(), _S3 = new THREE.Vector3(1, 1, 1), _Q3 = new THREE.Quaternion();
export function dust(c, t, n = 100, w = 6) { const r = rng(17); for (let i = 0; i < n; i++) { _P3.set(c[0] + (r() - .5) * w, c[1] + ((r() * 3 + t * .15 * (.5 + r())) % 3), c[2] + (r() - .5) * w); _M3.compose(_P3, _Q3, _S3); XA.dust.setMatrixAt(i, _M3); } XA.dust.count = n; XA.dust.instanceMatrix.needsUpdate = true; }
