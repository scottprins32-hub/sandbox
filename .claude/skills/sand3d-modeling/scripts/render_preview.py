"""Render a sand3d program to a PNG so you can look at what you built.

sand3d writes geometry and exports files; it has no renderer of its own. This script
builds a program's object in a fresh scene, poses its joints if asked, frames it with
a camera, and renders it with Cycles on the CPU (no GPU or display needed).

    python render_preview.py PROGRAM.py FUNCTION OUT.png
        [--pose JOINT=VALUE ...]   joints to move first (degrees, or the program's unit)
        [--view AZIMUTH,ELEVATION] where the camera stands, degrees (default 35,22)
        [--size WIDTHxHEIGHT]      default 1600x900
        [--samples N]              default 48; lower is faster and noisier
        [--ground "#rrggbb"|none]  floor colour under the object (default "#c9c4bb")
        [--zoom F]                 above 1 moves in, below 1 moves out
        [--look X,Y,Z]             aim at this point (program units) instead of the centre

The program is ordinary Python and runs with your rights: only render programs you
have read. Run with the Python that has sand3d installed.
"""
import argparse
import importlib.util
import math
import os
import sys

import bpy
from mathutils import Vector

import sand3d as s3d


def load(program, function):
    spec = importlib.util.spec_from_file_location("sand3d_program", program)
    module = importlib.util.module_from_spec(spec)
    sys.modules["sand3d_program"] = module
    spec.loader.exec_module(module)
    built = getattr(module, function)()
    return getattr(built, "root", built)


def meshes(root):
    return [o for o in [root, *root.children_recursive] if o.type == "MESH"]


def bounds(root):
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in meshes(root) for c in o.bound_box]
    lo = Vector([min(p[i] for p in pts) for i in range(3)])
    hi = Vector([max(p[i] for p in pts) for i in range(3)])
    return lo, hi


def colour(hex_):
    h = hex_.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb] + [1.0]


def stage(root, view, size, samples, ground, zoom, look):
    scene = bpy.context.scene
    lo, hi = bounds(root)
    centre = Vector(look) if look else (lo + hi) / 2
    radius = max((hi - lo).length / 2, 1e-6)
    corners = [Vector((x, y, z)) for x in (lo.x, hi.x) for y in (lo.y, hi.y) for z in (lo.z, hi.z)]

    if ground != "none":
        bpy.ops.mesh.primitive_plane_add(size=radius * 600, location=(centre.x, centre.y, lo.z))
        floor = bpy.context.object
        mat = bpy.data.materials.new("preview_floor")
        mat.use_nodes = True                                         # needed on bpy 4.5; a no-op warning on 5.x
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = colour(ground)
        bsdf.inputs["Roughness"].default_value = 0.9
        floor.data.materials.append(mat)

    az, el = (math.radians(a) for a in view)
    direction = Vector((math.cos(el) * math.cos(az), math.cos(el) * math.sin(az), math.sin(el)))
    cam_data = bpy.data.cameras.new("preview_camera")
    cam_data.lens = 60
    aspect = size[0] / size[1]
    tan_wide = cam_data.sensor_width / 2 / cam_data.lens             # the sensor's width is the frame's longer side
    tan_h, tan_v = (tan_wide, tan_wide / aspect) if aspect >= 1 else (tan_wide * aspect, tan_wide)
    right = Vector((0, 0, 1)).cross(direction).normalized() if abs(direction.z) < 0.999 else Vector((1, 0, 0))
    up = direction.cross(right)
    distance = 1.08 / zoom * max(                                    # far enough that every corner is in frame
        (c - centre).dot(direction) + max(abs((c - centre).dot(right)) / tan_h, abs((c - centre).dot(up)) / tan_v)
        for c in corners)
    cam_data.clip_start, cam_data.clip_end = distance / 500, distance * 2000
    cam = bpy.data.objects.new("preview_camera", cam_data)
    scene.collection.objects.link(cam)
    cam.location = centre + direction * distance
    cam.rotation_euler = (centre - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam

    sun_data = bpy.data.lights.new("preview_sun", "SUN")
    sun_data.energy, sun_data.angle = 3.2, math.radians(6)
    sun = bpy.data.objects.new("preview_sun", sun_data)
    scene.collection.objects.link(sun)
    key = Vector((math.cos(az + 1.0), math.sin(az + 1.0), 1.5))      # from the camera's left, above
    sun.rotation_euler = (-key).to_track_quat("-Z", "Y").to_euler()

    world = scene.world or bpy.data.worlds.new("preview_world")
    scene.world = world
    world.use_nodes = True
    back = world.node_tree.nodes["Background"]
    back.inputs["Color"].default_value = (0.78, 0.85, 0.94, 1.0)
    back.inputs["Strength"].default_value = 0.9

    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    return scene


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("program"), ap.add_argument("function"), ap.add_argument("out")
    ap.add_argument("--pose", action="append", default=[])
    ap.add_argument("--view", default="35,22")
    ap.add_argument("--size", default="1600x900")
    ap.add_argument("--samples", type=int, default=48)
    ap.add_argument("--ground", default="#c9c4bb")
    ap.add_argument("--zoom", type=float, default=1.0)
    ap.add_argument("--look", default=None)
    a = ap.parse_args()

    s3d.empty_scene()
    root = load(a.program, a.function)
    for item in a.pose:
        name, value = item.split("=")
        s3d.pose(root, float(value), joint=name)
    scene = stage(root, [float(v) for v in a.view.split(",")], [int(v) for v in a.size.split("x")], a.samples,
                  a.ground, a.zoom, [float(v) for v in a.look.split(",")] if a.look else None)
    scene.render.filepath = os.path.abspath(a.out)
    bpy.ops.render.render(write_still=True)
    print("rendered", scene.render.filepath)


if __name__ == "__main__":
    main()
