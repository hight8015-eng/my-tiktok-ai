// v7.6 blendset.js: load a Blender-built set (.glb with BAKED light) into our scene. Characters stay our 2D sprites.
//   import { loadSet } from './blendset.js';
//   const WH2 = await loadSet(scene, 'sets/warehouse.glb', { pos: [-600, 0, 600], scale: 1, toon: false });
//   WH2.root.visible = true/false per shot (like our hand-built sets);  WH2.lights = the set's practical lights (point/spot)
// How the bake is read (blender/build_set.py writes it this way):
//   - every mesh has ONE baked texture (light + colour already in it) -> MeshBasicMaterial: no double lighting, very fast
//   - objects named "*_emit" glow (bloom picks them up); "*_glass" are transparent; "*_nobake" keep a lit toon material
//   - empties named "light_*" carry custom props {type: 'point'|'spot', color, power} -> real lights for OUR characters,
//     so the 2D sprites get the same warm/cool light as the baked room
//   - empties named "cam_*" are camera marks: WH2.cams.cam_door = { pos, look } for camX()
//   - meshes named "col_*" are invisible collision boxes: WH2.colliders (walk paths must avoid them; see lessons ep2/ep3)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export async function loadSet(scene, url, o = {}) {
  const g = await new GLTFLoader().loadAsync(url), root = g.scene; root.position.set(...(o.pos || [0, 0, 0])); root.scale.setScalar(o.scale ?? 1);
  const S = { root, lights: [], cams: {}, colliders: [] };
  root.traverse((n) => {
    const nm = (n.name || '').toLowerCase();
    if (n.isMesh) {
      if (nm.startsWith('col_')) { n.visible = false; S.colliders.push(new THREE.Box3().setFromObject(n)); return; }
      const m = n.material, map = m && m.map;
      if (!nm.includes('_nobake') && !o.toon) {
        const b = new THREE.MeshBasicMaterial({ map, color: map ? 0xffffff : (m.color || new THREE.Color(0xffffff)), transparent: nm.includes('_glass') || m.transparent, opacity: m.opacity ?? 1, side: m.side });
        if (map) map.colorSpace = THREE.SRGBColorSpace;
        if (nm.includes('_emit')) b.toneMapped = false;                      // stays bright -> bloom
        n.material = b;
      }
      n.castShadow = false; n.receiveShadow = !!o.shadows; n.userData.noInk = !o.ink;
    }
    if (nm.startsWith('light_')) {
      const p = n.userData || {}, col = new THREE.Color(p.color || '#ffd9a0'), pw = p.power ?? 1.5;
      const L = p.type === 'spot' ? new THREE.SpotLight(col, pw, p.dist ?? 8, (p.angle ?? 40) * Math.PI / 180, .5, 2) : new THREE.PointLight(col, pw, p.dist ?? 6, 2);
      n.add(L); S.lights.push(L);
    }
    if (nm.startsWith('cam_')) {
      root.updateMatrixWorld(true); const pos = n.getWorldPosition(new THREE.Vector3()), dir = new THREE.Vector3(0, 0, -1).transformDirection(n.matrixWorld);
      S.cams[n.name] = { pos: pos.toArray(), look: pos.clone().addScaledVector(dir, 4).toArray() };
    }
  });
  scene.add(root); root.visible = o.visible ?? false; return S;
}
// blocked(S, x, z, r): true if a character of radius r at (x, z) would stand inside a collider (use when planning walk paths)
export function blocked(S, x, z, r = .25) { return S.colliders.some(b => x > b.min.x - r && x < b.max.x + r && z > b.min.z - r && z < b.max.z + r); }
