"""Render hero 3D dengan auto-framing (tidak akan memotong objek)."""
import bpy, math, os
from mathutils import Vector

BLEND = "/home/mariio77/nixeon-408/assets/3d/unit-002.blend"
OUT = "/home/mariio77/nixeon-408/docs/preview-3d.png"

bpy.ops.wm.open_mainfile(filepath=BLEND)
sc = bpy.context.scene

# ── bounding box seluruh mesh ─────────────────────────────────────────
pts = []
for o in bpy.data.objects:
    if o.type != "MESH":
        continue
    for c in o.bound_box:
        pts.append(o.matrix_world @ Vector(c))
mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
center = (mn + mx) / 2
size = mx - mn
radius = max(size.x, size.y, size.z) * 0.62
print(f"[render] bounds z: {mn.z:.2f}..{mx.z:.2f}  radius={radius:.2f}")

# ── kamera: 3/4 low-angle, jarak dihitung agar muat + margin 22% ──────
cam_d = bpy.data.cameras.new("Cam")
cam_d.lens = 58
cam = bpy.data.objects.new("Cam", cam_d)
sc.collection.objects.link(cam)
sc.camera = cam

azim = math.radians(36)
elev = math.radians(12)
dist = radius * 3.35
cam.location = (
    center.x + dist * math.cos(elev) * math.sin(azim),
    center.y - dist * math.cos(elev) * math.cos(azim),
    center.z + dist * math.sin(elev) + radius * 0.16,
)
# arahkan kamera tepat ke pusat objek
d = center - Vector(cam.location)
cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()

# ── pencahayaan ───────────────────────────────────────────────────────
def light(name, kind, energy, size, loc, target, color=(1, 1, 1)):
    ld = bpy.data.lights.new(name, kind)
    ld.energy = energy
    ld.color = color
    if kind == "AREA":
        ld.size = size
    lo = bpy.data.objects.new(name, ld)
    sc.collection.objects.link(lo)
    lo.location = loc
    v = Vector(target) - Vector(loc)
    lo.rotation_euler = v.to_track_quat("-Z", "Y").to_euler()
    return lo

T = (center.x, center.y, center.z + radius * 0.15)
light("Key",   "AREA", 900, 3.0, (2.6, -3.0, 3.6), T)
light("RimR",  "AREA", 520, 2.2, (-2.6, 1.9, 1.9), T, (1.0, 0.20, 0.32))
light("RimC",  "AREA", 380, 1.8, (2.7, 2.2, 2.3), T, (0.34, 0.85, 0.96))
light("Fill",  "AREA", 120, 3.2, (-2.4, -2.6, 2.2), T, (0.75, 0.78, 0.9))

# ── render ────────────────────────────────────────────────────────────
sc.render.engine = "CYCLES"
sc.cycles.device = "CPU"
sc.cycles.samples = 48
sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = 760, 950
sc.render.film_transparent = False

w = bpy.data.worlds.new("W")
sc.world = w
w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.028, 0.028, 0.036, 1)

sc.render.filepath = OUT
sc.render.image_settings.file_format = "PNG"
bpy.ops.render.render(write_still=True)
print("[render] OK", os.path.exists(OUT), os.path.getsize(OUT) if os.path.exists(OUT) else 0)
