"""
unit-002-3d.py — Model maskot 3D low-poly stylized untuk hero nixeon://408.

Bagian dipisah (Head, Visor, Hair, Horn_L/R, Neck, Torso, Arm_*, Leg_*,
Pauldron_*, Pedestal, Ring_1..3) supaya three.js bisa menganimasikan
tiap bagian (micro-animation).

Jalankan:
  python3 ~/blender-projects/scripts/blender_run.py \
      ~/nixeon-408/assets/3d/unit-002-3d.py

Output: unit-002.obj + .mtl, unit-002.glb, unit-002.blend
"""
import bpy
import math
import os

OUT = "/home/mariio77/nixeon-408/assets/3d"
os.makedirs(OUT, exist_ok=True)

for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
for mesh in list(bpy.data.meshes):
    bpy.data.meshes.remove(mesh)
for m in list(bpy.data.materials):
    bpy.data.materials.remove(m)


def mat(name, rgb, rough=0.5, metal=0.0, emis=None, emis_str=4.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (rgb[0], rgb[1], rgb[2], 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emis is not None:
        for key in ("Emission Color", "Emission"):
            if key in b.inputs:
                b.inputs[key].default_value = (emis[0], emis[1], emis[2], 1.0)
                break
        if "Emission Strength" in b.inputs:
            b.inputs["Emission Strength"].default_value = emis_str
    return m


# palet — selaras dengan website
M_SKIN  = mat("skin",     (0.95, 0.87, 0.81), rough=0.62)
M_HAIR  = mat("hair",     (0.88, 0.84, 0.87), rough=0.42)
M_PINK  = mat("hair_pink",(0.96, 0.63, 0.71), rough=0.42)
M_HORN  = mat("horn",     (0.80, 0.11, 0.22), rough=0.30,
              emis=(0.60, 0.05, 0.14), emis_str=2.6)
M_SUIT  = mat("suit",     (0.085, 0.085, 0.105), rough=0.40, metal=0.30)
M_ARMOR = mat("armor",    (0.46, 0.075, 0.145), rough=0.32, metal=0.45)
M_GLOW  = mat("glow",     (0.32, 0.88, 0.94), rough=0.15,
              emis=(0.32, 0.88, 0.94), emis_str=9.0)
M_VISOR = mat("visor",    (0.10, 0.62, 0.72), rough=0.08, metal=0.2,
              emis=(0.22, 0.80, 0.90), emis_str=7.0)
M_DARK  = mat("dark",     (0.050, 0.050, 0.065), rough=0.72)


def flat(obj, material, bevel=0.0):
    obj.data.materials.append(material)
    for p in obj.data.polygons:
        p.use_smooth = False
    if bevel > 0:
        md = obj.modifiers.new("bev", "BEVEL")
        md.width = bevel
        md.segments = 1
    return obj


def box(name, loc, dims, material, rot=(0, 0, 0), bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = (dims[0] / 2, dims[1] / 2, dims[2] / 2)
    o.rotation_euler = rot
    return flat(o, material, bevel)


def ico(name, loc, r, material, scale=(1, 1, 1), sub=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    return flat(o, material)


def cyl(name, loc, r, depth, material, verts=8, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc)
    o = bpy.context.object
    o.name = name
    o.rotation_euler = rot
    return flat(o, material)


def cone(name, loc, r1, r2, depth, material, rot=(0, 0, 0), verts=6):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2,
                                    depth=depth, location=loc)
    o = bpy.context.object
    o.name = name
    o.rotation_euler = rot
    return flat(o, material)


def torus(name, loc, R, r, material, rot=(0, 0, 0), mseg=32, nseg=5):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r,
                                     major_segments=mseg, minor_segments=nseg,
                                     location=loc)
    o = bpy.context.object
    o.name = name
    o.rotation_euler = rot
    return flat(o, material)


R = math.radians

# ══ PEDESTAL ══════════════════════════════════════════════════════════
cyl("Pedestal", (0, 0, 0.46), 0.40, 0.09, M_DARK, verts=6)
torus("Pedestal_Rim", (0, 0, 0.505), 0.40, 0.011, M_GLOW, mseg=6, nseg=4)

# ══ KAKI ══════════════════════════════════════════════════════════════
for nm, x in (("Leg_L", -0.088), ("Leg_R", 0.088)):
    cyl(nm, (x, 0, 0.72), 0.072, 0.44, M_SUIT, verts=7)
    # sepatu
    box(nm.replace("Leg", "Boot"), (x, -0.028, 0.535), (0.115, 0.19, 0.085), M_ARMOR)

box("Hips", (0, 0, 0.955), (0.235, 0.155, 0.10), M_SUIT)

# ══ TORSO (menyambung ke pinggul & leher) ═════════════════════════════
box("Torso", (0, 0, 1.175), (0.255, 0.165, 0.35), M_SUIT, bevel=0.012)
# strip dada menyala
box("Chest_Glow", (0, -0.088, 1.215), (0.075, 0.012, 0.135), M_GLOW)
box("Chest_Plate", (0, -0.086, 1.09), (0.20, 0.02, 0.075), M_ARMOR)

# ══ LENGAN ════════════════════════════════════════════════════════════
for nm, x in (("Arm_L", -0.175), ("Arm_R", 0.175)):
    cyl(nm, (x, 0, 1.075), 0.052, 0.30, M_SUIT, verts=7)
    ico(nm.replace("Arm", "Hand"), (x, -0.01, 0.915), 0.062, M_DARK, scale=(1, 1, 0.85))

# ══ PAULDRON ══════════════════════════════════════════════════════════
for nm, x in (("Pauldron_L", -0.205), ("Pauldron_R", 0.205)):
    ico(nm, (x, 0, 1.30), 0.105, M_ARMOR, scale=(1.0, 0.92, 0.72))
    box(nm + "_Glow", (x, -0.055, 1.30), (0.03, 0.01, 0.055), M_GLOW)

# ══ LEHER ═════════════════════════════════════════════════════════════
cyl("Neck", (0, 0, 1.395), 0.068, 0.11, M_SKIN, verts=8)
torus("Collar", (0, 0, 1.365), 0.108, 0.014, M_GLOW, mseg=16, nseg=5)

# ══ KEPALA ════════════════════════════════════════════════════════════
ico("Head", (0, 0, 1.615), 0.225, M_SKIN, scale=(1.0, 0.95, 1.05), sub=2)

# visor menyala — "kunci" keterbacaan wajah, gaya mecha
box("Visor", (0, -0.168, 1.628), (0.325, 0.115, 0.105), M_VISOR,
    rot=(R(-6), 0, 0), bevel=0.018)
box("Visor_Slit", (0, -0.216, 1.632), (0.255, 0.014, 0.032), M_GLOW)

# ══ RAMBUT (bob, menempel kepala) ═════════════════════════════════════
ico("Hair", (0, 0.020, 1.648), 0.238, M_HAIR, scale=(1.02, 1.0, 0.98), sub=2)
# poni depan — tipis & mengikuti lengkung kepala
box("Fringe", (0, -0.175, 1.735), (0.30, 0.115, 0.075), M_PINK,
    rot=(R(16), 0, 0), bevel=0.016)
# sisi bob kiri/kanan
for nm, x in (("Hair_L", -0.205), ("Hair_R", 0.205)):
    box(nm, (x, 0.01, 1.575), (0.075, 0.185, 0.22), M_PINK, bevel=0.018)

# ══ TANDUK (menonjol jelas dari siluet) ═══════════════════════════════
for nm, x, tilt, tw in (("Horn_L", -0.118, -20, -5), ("Horn_R", 0.118, 20, 5)):
    # tanduk panjang & tegak, muncul dari atas kepala, jelas di siluet
    cone(nm, (x, -0.045, 1.965), 0.072, 0.006, 0.50, M_HORN,
         rot=(R(6), R(tw), R(tilt)), verts=6)
    torus(nm + "_Base", (x, -0.045, 1.735), 0.062, 0.011, M_GLOW, mseg=10, nseg=4,
          rot=(0, 0, R(tilt)))

# ══ CINCIN HOLOGRAM ═══════════════════════════════════════════════════
rings = [
    ("Ring_1", 0.66, 0.72, (R(90), 0, 0)),
    ("Ring_2", 0.78, 0.58, (R(76), 0, R(20))),
    ("Ring_3", 0.56, 0.88, (R(104), 0, R(-16))),
]
for nm, rad, z, rot in rings:
    torus(nm, (0, 0, z), rad, 0.0085, M_GLOW, rot=rot, mseg=34, nseg=5)

# pose: sedikit berputar supaya dinamis
for o in bpy.data.objects:
    if o.name != "Pedestal" and not o.name.startswith("Ring"):
        o.rotation_euler.z += R(16)

# ── simpan & export ───────────────────────────────────────────────────
blend_path = os.path.join(OUT, "unit-002.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print("[3d] blend ->", os.path.exists(blend_path))

obj_path = os.path.join(OUT, "unit-002.obj")
bpy.ops.wm.obj_export(
    filepath=obj_path, export_materials=True, export_object_groups=True,
    export_material_groups=True, apply_modifiers=True, export_selected_objects=False,
)
print("[3d] obj   ->", os.path.exists(obj_path))

glb_path = os.path.join(OUT, "unit-002.glb")
bpy.ops.export_scene.gltf(filepath=glb_path, export_format="GLB")
print("[3d] glb   ->", os.path.exists(glb_path))

meshes = [o for o in bpy.data.objects if o.type == "MESH"]
verts = sum(len(o.data.vertices) for o in meshes)
faces = sum(len(o.data.polygons) for o in meshes)
print(f"[3d] objek: {len(meshes)} | vertex: {verts} | face: {faces}")
print("[3d] nama:", sorted(o.name for o in meshes))
for p in (obj_path, obj_path.replace(".obj", ".mtl"), glb_path, blend_path):
    if os.path.exists(p):
        print(f"[3d]   {os.path.basename(p)} = {os.path.getsize(p)} B")
print("[3d] SELESAI")
