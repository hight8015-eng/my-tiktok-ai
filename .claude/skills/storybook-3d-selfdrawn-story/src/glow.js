// glow.js (v5.7): light you can SEE. Study of the user's film refs (Blade Runner haze, stage beams, window god rays, a match
// lighting a face in a blue room, a glowing doorway behind a kid): light shows up in the air (haze), sources bloom, their
// colour SPILLS onto nearby surfaces, wet ground mirrors them as long vertical streaks, and figures in front of a bright
// source become silhouettes with a rim. Everything here is additive, unlit, no ink, depthWrite off.
import { THREE, basic, canvasTex, mesh, group } from './engine.js';
const VS = `uniform float uH; varying float vAlong; varying vec3 vN; varying vec3 vV;
  void main(){ vAlong = .5 - position.y / uH; vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const FS = `uniform vec3 uCol; uniform float uOp, uSoft; varying float vAlong; varying vec3 vN; varying vec3 vV;
  void main(){ float e = pow(abs(dot(vN, vV)), uSoft); float f = pow(1. - clamp(vAlong, 0., 1.), 1.4) * smoothstep(0., .06, vAlong); gl_FragColor = vec4(uCol * uOp * e * f, 1.); }`;
/* volumetric beam material for a ConeGeometry of height h whose apex (+y) sits at the light: soft at the edges (facing ratio),
   brightest at the source, fading with distance (falloff) */
export function beamMat(col, op = .35, h = 10, soft = 1.6) { const m = new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color(col) }, uOp: { value: op }, uH: { value: h }, uSoft: { value: soft } },
  vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }); m.userData.noInk = true; m.userData.outlineParameters = { visible: false, keepAlive: true }; return m; }
export function beam(par, from, to, r = 1, col = '#fff0d0', op = .3) { const A = new THREE.Vector3(...from), B = new THREE.Vector3(...to), d = B.clone().sub(A), h = d.length();
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 28, 1, true), beamMat(col, op, h)); m.position.copy(A.clone().add(B).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.normalize());
  m.castShadow = m.receiveShadow = false; m.userData.noInk = true; m.renderOrder = 4; par.add(m); return m; }
export const RAD = canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.12, 'rgba(255,255,255,.62)'); g.addColorStop(.3, 'rgba(255,255,255,.26)'); g.addColorStop(.55, 'rgba(255,255,255,.08)'); g.addColorStop(.8, 'rgba(255,255,255,.02)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
const STRK = canvasTex(64, 256, (x) => { const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.2, 'rgba(255,255,255,.9)'); g.addColorStop(.5, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 256);
  const h = x.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(.3, 'rgba(0,0,0,.6)'); h.addColorStop(.5, 'rgba(0,0,0,0)'); h.addColorStop(.7, 'rgba(0,0,0,.6)'); h.addColorStop(1, 'rgba(0,0,0,1)'); x.globalCompositeOperation = 'destination-out'; x.fillStyle = h; x.fillRect(0, 0, 64, 256); });
const add = (col, op, map) => { const m = basic(col, { transparent: true, opacity: op, add: true, depthWrite: false, map }); m.userData.noInk = true; return m; };
/* the colour of a source spilling onto the ground / a wall around it (light pool) */
export function spill(par, p, r, col, op = .35, rot = [-90, 0, 0]) { const m = mesh(new THREE.PlaneGeometry(r * 2, r * 2), add(col, op, RAD), { p, r: rot, parent: par, cast: false, recv: false }); m.renderOrder = 3; return m; }
/* wet road reflection of a sign/lamp: a long soft streak running from under the source toward the viewer */
export function streak(par, p, w, len, col, op = .45) { const g = group({ p, parent: par }); const m = mesh(new THREE.PlaneGeometry(w, len), add(col, op, STRK), { p: [0, 0, len / 2], r: [-90, 0, 0], parent: g, cast: false, recv: false }); m.renderOrder = 3; g.userData.m = m; STREAKS.push(g); return g; }
const STREAKS = [];
export function glowAt(t) { STREAKS.forEach((g, i) => { g.userData.m.scale.x = 1 + .12 * Math.sin(t * 3.1 + i * 1.7) + .06 * Math.sin(t * 7.3 + i); }); }   // rain ripples make the reflections shimmer
