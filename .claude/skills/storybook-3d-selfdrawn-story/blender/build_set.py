# v7.6 Blender set builder (runs on the user's computer):  blender -b -P blender/build_set.py -- <recipe.json> <out.glb> [--samples 128] [--res 1024]
# Tested on Blender 5.3 with warehouse_test.json. Also writes <out>.blend and <out>_preview.png (lit render from cam_door; --no-preview skips it).
# Builds a set from a JSON recipe (boxes/planes/props + CC0 .glb/.blend assets + lights + camera marks + colliders), lights it in Cycles,
# BAKES light+colour into one texture per object, and exports a .glb that src/blendset.js loads (characters stay our 2D sprites).
# Recipe (metres, y-up like our engine; Blender is z-up, converted here):
# { "name": "warehouse", "style": {"bevel": .02, "sat": 1.1},
#   "objects": [ {"kind": "box", "name": "floor", "size": [14, .1, 14], "pos": [0, -.05, 0], "color": "#3a3530", "tex": "concrete"},
#                {"kind": "asset", "name": "crate1", "file": "assets/kenney/crate.glb", "pos": [2, 0, -3], "rot": [0, 30, 0], "scale": 1},
#                {"kind": "box", "name": "lamp_emit", "size": [.4, .1, .4], "pos": [0, 4, 0], "color": "#ffd59a", "emit": 6} ],
#   "lights": [ {"name": "light_lamp", "type": "point", "pos": [0, 3.8, 0], "color": "#ffd59a", "power": 300, "engine_power": 1.6},
#               {"name": "sun", "type": "sun", "rot": [50, 0, 30], "color": "#9fb6ff", "power": 2} ],
#   "world": {"color": "#141826", "strength": .3, "hdri": null, "fog": .02},
#   "cams": [ {"name": "cam_door", "pos": [0, 1.5, 6], "look": [0, 1.2, 0]} ],
#   "colliders": [ {"name": "col_pillar", "size": [.8, 4, .8], "pos": [0, 2, -1.9]} ] }
import bpy, bmesh, json, sys, math, os
from mathutils import Vector, Euler
argv = sys.argv[sys.argv.index('--') + 1:]; RECIPE, OUT = argv[0], os.path.abspath(argv[1]); os.makedirs(os.path.dirname(OUT), exist_ok=True)   # abspath: render.filepath misresolves relative paths
SAMPLES = int(argv[argv.index('--samples') + 1]) if '--samples' in argv else 128
RES = int(argv[argv.index('--res') + 1]) if '--res' in argv else 1024
R = json.load(open(RECIPE, encoding='utf-8-sig')); BASE = os.path.dirname(os.path.abspath(RECIPE))
yz = lambda p: Vector((p[0], -p[2], p[1]))                                  # our (x, y-up, z) -> Blender (x, -z, y)
def rgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (1,)
bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.view_settings.view_transform = 'Standard'; sc.cycles.samples = SAMPLES; sc.cycles.device = 'GPU' if '--gpu' in argv else 'CPU'
def nodes_on(d):                                                              # use_nodes is deprecated (default True in new Blenders): only set it where needed
    if bpy.app.version < (5, 0, 0): d.use_nodes = True
def shade(c, k): return tuple(min(1, v * k) for v in c[:3]) + (1,)
def mat(name, color, emit=0, rough=.7, tex=None):                              # tex: None | 'concrete' | 'wood' | 'brick' | 'metal'  (procedural, baked into the lightmap)
    m = bpy.data.materials.new(name); nodes_on(m); nt = m.node_tree; b = nt.nodes['Principled BSDF']; base = rgb(color)
    b.inputs['Base Color'].default_value = base; b.inputs['Roughness'].default_value = rough
    if tex:
        tc = nt.nodes.new('ShaderNodeTexCoord')
        if tex == 'brick':
            br = nt.nodes.new('ShaderNodeTexBrick'); br.inputs['Color1'].default_value = shade(base, 1.15); br.inputs['Color2'].default_value = shade(base, .72)
            br.inputs['Mortar'].default_value = shade(base, .35); br.inputs['Scale'].default_value = 2.2; br.inputs['Mortar Size'].default_value = .025; br.inputs['Brick Width'].default_value = .5; br.inputs['Row Height'].default_value = .25
            nt.links.new(tc.outputs['Object'], br.inputs['Vector']); nt.links.new(br.outputs['Color'], b.inputs['Base Color'])
        else:
            nz = nt.nodes.new('ShaderNodeTexWave' if tex == 'wood' else 'ShaderNodeTexNoise'); rp = nt.nodes.new('ShaderNodeValToRGB')
            if tex == 'wood': nz.inputs['Scale'].default_value = 5; nz.inputs['Distortion'].default_value = 6; nz.inputs['Detail'].default_value = 3
            else: nz.inputs['Scale'].default_value = 9 if tex == 'concrete' else 22; nz.inputs['Detail'].default_value = 9
            rp.color_ramp.elements[0].color = shade(base, .6); rp.color_ramp.elements[1].color = shade(base, 1.2)
            nt.links.new(tc.outputs['Object'], nz.inputs['Vector']); nt.links.new(nz.outputs[0 if tex == 'wood' else 'Fac'], rp.inputs['Fac']); nt.links.new(rp.outputs['Color'], b.inputs['Base Color'])
            if tex == 'metal': b.inputs['Metallic'].default_value = .55; b.inputs['Roughness'].default_value = .38
    if emit: b.inputs['Emission Color'].default_value = base; b.inputs['Emission Strength'].default_value = emit
    return m
objs = []; groups = {}
for o in R.get('objects', []):
    if o['kind'] in ('box', 'cyl'):
        rot = o.get('rot', [0, 0, 0])
        if o['kind'] == 'box':
            bpy.ops.mesh.primitive_cube_add(size=1, location=yz(o['pos'])); ob = bpy.context.object; s = o['size']; ob.scale = (s[0], s[2], s[1])
        else:                                                                     # cylinder: r, h along engine axis 'y' (default) | 'x' | 'z'
            bpy.ops.mesh.primitive_cylinder_add(vertices=o.get('seg', 20), radius=o['r'], depth=o['h'], location=yz(o['pos'])); ob = bpy.context.object
            ax = o.get('axis', 'y'); ob.rotation_euler = {'y': (0, 0, 0), 'x': (0, math.pi / 2, 0), 'z': (math.pi / 2, 0, 0)}[ax]
        bpy.ops.object.transform_apply(scale=True, rotation=(o['kind'] == 'cyl'))
        if any(rot): ob.rotation_euler = Euler([math.radians(v) for v in (rot[0], -rot[2], rot[1])])   # engine (rx, ry, rz) -> Blender; yaw ry = Blender z
        if R.get('style', {}).get('bevel') and o['kind'] == 'box' and not o.get('nobevel'): bv = ob.modifiers.new('bevel', 'BEVEL'); bv.width = min(R['style']['bevel'], min(o['size']) / 3); bv.segments = 2
        ob.data.materials.append(mat(o['name'] + '_m', o.get('color', '#808080'), o.get('emit', 0), o.get('rough', .7), o.get('tex')))
        if o.get('group'): groups.setdefault(o['group'], []).append(ob)
    elif o['kind'] == 'asset':
        f = os.path.join(BASE, o['file']); before = set(bpy.data.objects)
        if f.endswith(('.glb', '.gltf')): bpy.ops.import_scene.gltf(filepath=f)
        elif f.endswith('.fbx'): bpy.ops.import_scene.fbx(filepath=f)
        elif f.endswith('.obj'): bpy.ops.wm.obj_import(filepath=f)
        new = [x for x in bpy.data.objects if x not in before and x.type == 'MESH']
        if not new: print('ASSET EMPTY', f); continue
        bpy.ops.object.select_all(action='DESELECT')
        for x in new: x.select_set(True)
        bpy.context.view_layer.objects.active = new[0]; bpy.ops.object.join(); ob = bpy.context.object
        ob.location = yz(o['pos']); ob.rotation_euler = Euler([math.radians(v) for v in (o.get('rot', [0, 0, 0])[0], -o.get('rot', [0, 0, 0])[2], o.get('rot', [0, 0, 0])[1])])
        ob.scale = [o.get('scale', 1)] * 3
    else: continue
    ob.name = o['name']; objs.append(ob)
for gname, members in groups.items():                                          # "group": props that share one baked texture (fewer bakes, one draw call each)
    bpy.ops.object.select_all(action='DESELECT')
    for x in members:
        if x.modifiers:
            bpy.context.view_layer.objects.active = x; x.select_set(True); bpy.ops.object.convert(target='MESH')
        x.select_set(True)
    bpy.context.view_layer.objects.active = members[0]; bpy.ops.object.join(); j = bpy.context.object; j.name = gname
    objs = [x for x in objs if x not in members] + [j]
for c in R.get('colliders', []):
    bpy.ops.mesh.primitive_cube_add(size=1, location=yz(c['pos'])); ob = bpy.context.object; s = c['size']; ob.scale = (s[0], s[2], s[1]); ob.name = c['name']; ob.hide_render = True
for L in R.get('lights', []):
    t = {'point': 'POINT', 'spot': 'SPOT', 'sun': 'SUN', 'area': 'AREA'}[L['type']]
    ld = bpy.data.lights.new(L['name'], t); ld.color = rgb(L.get('color', '#ffffff'))[:3]; ld.energy = L.get('power', 100)
    lo = bpy.data.objects.new(L['name'] + '_bl', ld); sc.collection.objects.link(lo)
    if 'pos' in L: lo.location = yz(L['pos'])
    if 'rot' in L: lo.rotation_euler = Euler([math.radians(v) for v in L['rot']])
    if L['name'].startswith('light_'):                                       # marker for our engine (real light for the 2D characters)
        e = bpy.data.objects.new(L['name'], None); sc.collection.objects.link(e); e.location = lo.location
        e['type'] = L['type']; e['color'] = L.get('color', '#ffffff'); e['power'] = L.get('engine_power', 1.5)
for cm in R.get('cams', []):
    e = bpy.data.objects.new(cm['name'], None); sc.collection.objects.link(e); e.location = yz(cm['pos'])
    d = yz(cm['look']) - e.location; e.rotation_euler = d.to_track_quat('Y', 'Z').to_euler()   # glTF export rotates empties' axes: Blender +Y -> glTF -Z, which blendset.js reads as "forward"
W = R.get('world', {}); wd = bpy.data.worlds.new('w'); sc.world = wd; nodes_on(wd); bg = wd.node_tree.nodes['Background']
if W.get('hdri'):
    env = wd.node_tree.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(os.path.join(BASE, W['hdri'])); wd.node_tree.links.new(env.outputs[0], bg.inputs[0])
else: bg.inputs[0].default_value = rgb(W.get('color', '#202020'))
bg.inputs[1].default_value = W.get('strength', .5)
# ---- preview: lit Cycles render from the first cam mark (cam_door) through a real camera -> <out>.png ; use --no-preview to skip
STEM = os.path.splitext(OUT)[0]
if R.get('cams') and '--no-preview' not in argv:
    pc = [c for c in R['cams'] if c['name'] == 'cam_door'] or R['cams'][:1]; pc = pc[0]
    cd = bpy.data.cameras.new('preview_cam'); cd.lens = 28; co = bpy.data.objects.new('preview_cam', cd); sc.collection.objects.link(co)
    co.location = yz(pc['pos']); co.rotation_euler = (yz(pc['look']) - co.location).to_track_quat('-Z', 'Y').to_euler(); sc.camera = co
    sc.render.resolution_x = RES; sc.render.resolution_y = int(RES * 9 / 16); sc.render.filepath = STEM + '_preview.png'; sc.render.image_settings.file_format = 'PNG'
    bpy.ops.render.render(write_still=True); print('PREVIEW', sc.render.filepath, 'from', pc['name'])
    bpy.data.objects.remove(co); bpy.data.cameras.remove(cd)               # keep the exported glb free of the helper camera
# ---- bake: smart UV per object -> COMBINED (light + colour) into one image -> swap the material for that image
sc.cycles.bake_type = 'COMBINED'; sc.render.bake.use_pass_direct = True; sc.render.bake.use_pass_indirect = True; sc.render.bake.margin = 8
for ob in objs:
    if ob.name.endswith('_nobake'): continue
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    if ob.modifiers: bpy.ops.object.convert(target='MESH')
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.uv.smart_project(island_margin=.02); bpy.ops.object.mode_set(mode='OBJECT')
    res = RES if max(ob.dimensions) > 2 else RES // 2
    if ob.name in groups: res = RES if ob.name in R.get('lowres', []) else min(RES * 2, 4096)   # recipe 'lowres': groups that need no detail (thin / emissive / scattered)
    img = bpy.data.images.new(ob.name + '_bake', res, res);
    for m in ob.data.materials:
        n = m.node_tree.nodes.new('ShaderNodeTexImage'); n.image = img; m.node_tree.nodes.active = n
    bpy.ops.object.bake(type='COMBINED'); img.pack()
    bm = bpy.data.materials.new(ob.name + '_baked'); nodes_on(bm); nt = bm.node_tree; b = nt.nodes['Principled BSDF']
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = img; nt.links.new(t.outputs[0], b.inputs['Base Color'])
    ob.data.materials.clear(); ob.data.materials.append(bm); print('baked', ob.name, res)
bpy.ops.wm.save_as_mainfile(filepath=STEM + '.blend', compress=True); print('BLEND', STEM + '.blend')
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_extras=True, export_lights=False, export_draco_mesh_compression_enable=False,export_yup=True)
print('SET OK', OUT, len(objs), 'objects')
