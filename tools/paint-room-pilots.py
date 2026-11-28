#!/usr/bin/env python3
"""Paint the room backdrops and foreground atlas at 1×. Requires Pillow."""

import argparse
import json
import re
import random
from pathlib import Path

from PIL import Image, ImageDraw

ROOM = (360, 180)
TILE = 16


def room(color):
    image = Image.new("RGB", ROOM, color)
    return image, ImageDraw.Draw(image)


def stones(draw, box, width, height, colors, seed):
    """Lay staggered, upper-left-lit blocks inside a bounded surface."""
    left, top, right, bottom = box
    mortar, shade, mid, light = colors
    rng = random.Random(seed)
    draw.rectangle(box, fill=mortar)
    for row, y in enumerate(range(top, bottom, height)):
        for x in range(left - (width // 2 if row % 2 else 0), right, width):
            x0, x1, y1 = max(left, x), min(right, x + width - 2), min(bottom, y + height - 2)
            if x1 <= x0:
                continue
            draw.rectangle((x0, y, x1, y1), fill=rng.choice((shade, mid, mid)))
            draw.line((x0 + 1, y, x1 - 1, y), fill=light)
            if y1 > y + 3 and x1 - x0 > 8 and rng.randrange(3) == 0:
                nick = rng.randrange(x0 + 3, x1 - 2)
                draw.line((nick, y + 3, nick + 2, y + 3), fill=light)


def grass_tile(rng, base):
    tile = Image.new("RGB", (TILE, TILE), base)
    draw = ImageDraw.Draw(tile)
    for _ in range(36):
        x, y = rng.randrange(TILE), rng.randrange(TILE)
        shade = rng.choice(("#415443", "#526349", "#546647", "#3c5140", "#67744d"))
        draw.line((x, y, x + rng.randrange(1, 4), y), fill=shade)
    return tile


def canopy(oak, seed):
    sprite = Image.new("RGBA", (34, 40))
    draw = ImageDraw.Draw(sprite)
    draw.ellipse((1, 30, 32, 38), fill="#253529")
    draw.rectangle((14, 21, 19, 36), fill="#665642")
    draw.line((15, 25, 15, 36), fill="#a28455")
    if oak:
        crowns = [(6, 14, 29, 32), (2, 11, 21, 29), (13, 10, 31, 26), (9, 4, 27, 24)]
        for x0, y0, x1, y1 in crowns:
            draw.ellipse((x0, y0, x1, y1), fill="#2d4537")
            draw.ellipse((x0 + 1, y0, x1 - 4, y1 - 4), fill="#506348")
            draw.arc((x0 + 2, y0 + 1, x1 - 4, y1 - 2), 165, 276, fill="#788253", width=2)
    else:
        for top, half, bottom in [(12, 16, 33), (7, 12, 24), (2, 8, 15)]:
            draw.polygon([(16, top), (16 + half, bottom - 3), (23, bottom), (9, bottom), (16 - half, bottom - 3)], fill="#293f36")
            draw.polygon([(16, top + 1), (16, bottom - 3), (4 + 16 - half, bottom - 2), (16 - half, bottom - 3)], fill="#536d4f")
            draw.line((16, top + 1, 16 - half + 2, bottom - 4), fill="#7e8b5c", width=2)
            draw.line((17, bottom - 4, 16 + half - 2, bottom - 4), fill="#3c5542")
    rng = random.Random(seed)
    for _ in range(30):
        x, y = rng.randrange(2, 32), rng.randrange(5, 32)
        if sprite.getpixel((x, y))[:3] in {(80, 99, 72), (83, 109, 79)}:
            draw.point((x, y), fill="#6a7850")
    return sprite


def outdoor(art):
    image, draw = room("#465a44")
    rng = random.Random(204)
    tiles = [grass_tile(rng, color) for color in ("#495e45", "#4b5f46", "#485d46", "#465a42")] * 2
    for y in range(0, ROOM[1], TILE):
        for x in range(0, ROOM[0], TILE):
            image.paste(rng.choice(tiles), (x, y))

    # Connected east and north routes, aligned to the original door thresholds.
    outline = [(0, 111), (297, 111), (297, 0), (329, 0), (329, 125), (323, 132), (360, 112), (360, 136), (0, 136)]
    path = Image.new("1", ROOM)
    edge = ImageDraw.Draw(path)
    edge.polygon(outline, fill=1)
    edge.rectangle((310, 112, 359, 135), fill=1)
    image.paste("#796f52", mask=path)
    draw.polygon([(0, 114), (300, 114), (300, 0), (326, 0), (326, 117), (359, 115), (359, 132), (0, 132)], fill="#9b8963")
    for x in range(0, 298, 4):
        for y, direction in ((113, 1), (133, -1)):
            length = rng.randrange(1, 5)
            draw.line((x, y, x + length, y + direction * rng.randrange(3)), fill=rng.choice(("#687252", "#536649", "#7a7955")))
    for y in range(0, 107, 4):
        for x, direction in ((298, 1), (328, -1)):
            draw.line((x, y, x + direction * rng.randrange(3), y + rng.randrange(3)), fill="#6c7653")
    for x, y, dx, dy in [(x, edge, 0, step) for x in range(3, 298, 5) for edge, step in ((113, 1), (133, -1))] + [(edge, y, step, 0) for y in range(1, 108, 5) for edge, step in ((298, 1), (328, -1))]:
        if rng.randrange(4) == 0:
            draw.line((x, y, x + 3 * dx, y + 3 * dy), fill="#57694b")
            draw.point((x + 2 * dx + dy, y + 2 * dy + dx), fill="#728054")
        elif rng.randrange(5) == 0:
            draw.point((x + 5 * dx, y + 5 * dy), fill="#bcaa80")
    for _ in range(180):
        x, y = rng.randrange(360), rng.randrange(180)
        if image.getpixel((x, y)) == (155, 137, 99):
            draw.line((x, y, x + 1, y), fill=rng.choice(("#a6926b", "#8d7d59")))
    for x, y in [(17, 93), (76, 95), (107, 39), (143, 25), (212, 18), (281, 35), (341, 94), (94, 155), (178, 155), (250, 148), (280, 165)]:
        draw.ellipse((x - 5, y, x + 5, y + 4), fill="#394f40")
        draw.ellipse((x - 4, y - 3, x + 4, y + 2), fill="#65754e")
        draw.line((x - 3, y - 1, x + 1, y - 3), fill="#879262")
        draw.point((x + 2, y - 1), fill="#bcad75")

    # Keep the shared atlas's original regions intact. The approach gets its own strip.
    atlas_path = art / "foreground.png"
    atlas = Image.open(atlas_path).convert("RGBA")
    strip_y = 97
    expanded = Image.new("RGBA", (atlas.width, strip_y + 40))
    expanded.paste(atlas.crop((0, 0, atlas.width, strip_y)))
    pines = [canopy(False, 82), canopy(True, 9), canopy(False, 12)]
    for index, sprite in enumerate(pines):
        expanded.paste(sprite, (index * 34, strip_y))
    for x, y, index in [(12, 29, 0), (52, 40, 1), (243, 9, 2), (320, 123, 2), (11, 125, 1)]:
        sprite = pines[index]
        image.paste(sprite, (x, y), sprite)
    expanded.save(atlas_path)
    image.save(art / "room-0.webp", lossless=True)


def castle_lab(art):
    image, draw = room("#433a37")
    stones(draw, (0, 29, 359, 175), TILE * 2, TILE, ("#413b39", "#5a5550", "#605b52", "#71695d"), 34)
    stones(draw, (0, 0, 359, 28), TILE * 2, 11, ("#4e4138", "#80634c", "#8a6d53", "#a78665"), 67)
    draw.rectangle((0, 26, 359, 27), fill="#bc9a70")
    draw.rectangle((0, 28, 359, 31), fill="#544438")
    draw.rectangle((0, 32, 359, 35), fill="#48413c")
    draw.rectangle((0, 165, 359, 179), fill="#514941")
    draw.line((0, 165, 359, 165), fill="#7c7161")
    for x in (4, 348):
        draw.rectangle((x, 26, x + 6, 164), fill="#716152")
        draw.line((x + 1, 31, x + 1, 163), fill="#90806a")
    draw.line((54, 14, 302, 14), fill="#4e3a32", width=4)
    draw.line((54, 13, 302, 13), fill="#a88966")
    for x in (58, 102, 153, 202, 254, 298):
        draw.rectangle((x - 2, 10, x + 2, 19), fill="#594b42")
        draw.point((x - 1, 11), fill="#d0ac78")
    # The existing tracks and controls render over this recessed bay.
    draw.rectangle((52, 34, 307, 103), fill="#332d2c")
    draw.rectangle((54, 35, 305, 100), fill="#75624b")
    draw.line((55, 36, 304, 36), fill="#ac8f66")
    draw.rectangle((60, 40, 299, 97), fill="#253431")
    draw.rectangle((61, 41, 298, 94), fill="#2e3d3a")
    draw.line((61, 93, 298, 93), fill="#273532")
    draw.line((55, 98, 304, 98), fill="#a08760")
    for x in (55, 301):
        for y in (42, 94):
            draw.point((x + 1, y), fill="#c8aa79")
    image.save(art / "room-1.webp", lossless=True)


def observatory(art, id):
    study = 29 <= id <= 32
    study_floor = ("#3a333e", "#514655", "#595064", "#686179")
    observatory_floor = ("#282c42", "#393e55", "#41455d", "#51576c")
    image, draw = room("#272b42")
    stones(draw, (0, 43, 359, 170), TILE * 2, TILE, study_floor if study else observatory_floor, 57 + id)
    shafts = Image.new("RGBA", ROOM)
    light = ImageDraw.Draw(shafts)
    for left, right in [(27, 47), (278, 297)]:
        light.polygon([(left, 18), (right, 18), (right + 31, 122), (left + 19, 122)], fill=(173, 191, 218, 18))
        light.polygon([(left + 8, 25), (right - 4, 25), (right + 26, 117), (left + 25, 117)], fill=(173, 191, 218, 12))
    image.paste(shafts, mask=shafts.getchannel("A"))
    stones(draw, (0, 0, 359, 37), TILE * 2, 12, ("#292c40", "#414056", "#49485e", "#626074"), 15)
    draw.rectangle((0, 37, 359, 40), fill="#554651")
    # The lab stairwell interrupts the rail. Study rooms have a continuous north wall.
    stairwell = id in (24, 25, 26, 27, 33)
    for left, right in ([(0, 293), (332, 359)] if stairwell else [(0, 359)]):
        draw.rectangle((left, 38, right, 39), fill="#a38560")
        draw.line((left, 40, right, 40), fill="#715843")
    for x in (17, 69, 286, 338):
        draw.rectangle((x, 35, x + 3, 41), fill="#76604c")
        draw.point((x + 1, 38), fill="#c2a472")
    for y, tone in enumerate(("#232433", "#282a3d", "#2e3044", "#35394f"), 41):
        draw.line((0, y, 359, y), fill=tone)
    if stairwell:
        draw.rectangle((294, 0, 331, 34), fill="#626477")
        draw.rectangle((296, 0, 329, 31), fill="#393b4e")
        draw.line((294, 35, 331, 35), fill="#777888")
        draw.line((297, 36, 328, 36), fill="#292a3a")
    for left, stars in [(16, [(3, 11), (12, 4), (22, 8), (34, 14), (27, 20)]), (334, [(2, 17), (5, 10), (10, 15), (13, 5), (19, 10)])]:
        draw.rectangle((left, 7, 53 if left == 16 else 356, 32), fill="#252a43", outline="#745e54")
        points = [(left + x, 9 + y) for x, y in stars]
        draw.line(points, fill="#666988")
        for x, y in points:
            draw.point((x, y), fill="#b7a98b")
    draw.rectangle((81, 7, 274, 44), fill="#211e32", outline="#705951")
    draw.line((82, 44, 273, 44), fill="#ad8d65")
    draw.rectangle((0, 169, 359, 179), fill="#2c2b42")
    draw.line((0, 169, 359, 169), fill="#726255")
    if study:
        glow = Image.new("RGBA", ROOM)
        brush = ImageDraw.Draw(glow)
        for x in (50, 306):
            for radius, opacity in ((27, 19), (20, 29), (13, 44)):
                brush.ellipse((x - radius, 46 - radius // 2, x + radius, 46 + radius), fill=(214, 167, 103, opacity))
        image.paste(glow, mask=glow.getchannel("A"))
        for x in (50, 306):
            draw.rectangle((x - 3, 35, x + 3, 43), fill="#635140")
            draw.rectangle((x - 1, 36, x + 1, 40), fill="#dba975")
            draw.point((x, 38), fill="#ffe3a6")
        rug(draw, (116, 124, 239, 155), "#5b4658", "#94745d")
    elif id in (24, 33):
        for x in (102, 156, 209, 261):
            draw.line((x, 10, x, 41), fill="#655670")
        for i in range(24):
            draw.point((92 + i * 41 % 169, 11 + i * 13 % 28), fill="#aaa4a6")
    image.save(art / ("observatory-charge-lab.webp" if id == 25 else f"room-{id}.webp"), lossless=True)


def shelf(draw, x, y, width, seed):
    rng = random.Random(seed)
    draw.rectangle((x - 1, y + 2, x + width, y + 16), fill="#3e3233")
    draw.rectangle((x, y, x + width - 1, y + 12), fill="#6e4a39")
    end = x + width - 3
    for start in range(x + 3, end, 3):
        h = rng.randint(4, 9)
        draw.line((start, y + 11 - h, start, y + 10), fill=rng.choice(("#9e815b", "#ab916e", "#796d55", "#845954", "#6b7b74")))
    draw.line((x, y + 12, end + 2, y + 12), fill="#c09b6b")
    draw.line((x + 1, y + 13, end + 1, y + 13), fill="#906746")


def rug(draw, box, color, trim):
    x0, y0, x1, y1 = box
    draw.rectangle(box, fill="#453a39")
    draw.rectangle((x0 + 2, y0 + 1, x1 - 2, y1 - 2), fill=color, outline=trim)
    draw.rectangle((x0 + 5, y0 + 4, x1 - 5, y1 - 5), outline=trim)
    for x in range(x0 + 9, x1 - 7, 10):
        draw.point((x, y0 + 2), fill=trim)
        draw.point((x, y1 - 3), fill=trim)


def sandstone_rooms(art, atlas, regions):
    for id in [*range(2, 9), *range(16, 24)]:
        research = id >= 16
        image, draw = room("#443a37")
        floors = (
            ("#3e3938", "#55514c", "#605950", "#6e6559"),
            ("#39383c", "#4a4c56", "#52535d", "#626373"),
            ("#443838", "#615047", "#68574d", "#796359"),
        )
        stones(draw, (0, 31, 359, 165), 32, TILE, floors[(id + 1) % 3], 310 + id)
        stones(draw, (0, 0, 359, 30), 32, 11, ("#4b3b34", "#795c47", "#896a53", "#a48262"), 250 + id)
        draw.rectangle((0, 27, 359, 28), fill="#b08c63")
        draw.rectangle((0, 29, 359, 31), fill="#685142")
        draw.rectangle((0, 32, 359, 35), fill="#403837")
        draw.rectangle((0, 165, 359, 179), fill="#4d4642")
        draw.line((0, 165, 359, 165), fill="#81715f")
        for x in (4, 348):
            draw.rectangle((x, 25, x + 7, 165), fill="#665747")
            draw.line((x + 1, 33, x + 1, 164), fill="#9b846b")
        if research:
            rug(draw, (91, 53, 269, 116), ("#65504e", "#4c5b57", "#574e68")[(id - 16) % 3], "#a18461")
            for x in (23, 95, 230, 312):
                shelf(draw, x, 29, 29, x + id)
            for sx, sy, w, h, x, y, _depth in regions[16]:
                cabinet = atlas.crop((sx, sy, sx + w, sy + h))
                image.paste(cabinet, (x, y), cabinet)
        elif id <= 6:
            bay(draw, (52, 34, 307, 103), id)
            draw.line((43, 13, 281, 13), fill="#b08c66")
            draw.line((43, 15, 281, 15), fill="#584437")
            for x in (48, 92, 135, 186, 232, 275):
                draw.rectangle((x, 10, x + 3, 18), fill="#705346")
                draw.point((x + 1, 11), fill="#d2b180")
        else:
            rug(draw, (77, 51, 215, 98), "#784d4a" if id == 7 else "#495b69", "#ac8861")
            for x in (57, 119, 182, 247):
                draw.rectangle((x, 10, x + 14, 26), fill="#60463c")
                draw.rectangle((x + 2, 12, x + 12, 24), fill="#9d7655")
                draw.line((x + 5, 15, x + 8, 21), fill="#d2aa78")
        for x in (35, 85, 143, 197, 265, 325):
            if research and any(abs(x - shelf_x) < 24 for shelf_x in (37, 109, 244, 326)):
                continue
            draw.rectangle((x - 6, 28, x + 19, 34), fill="#594334")
            draw.line((x - 6, 28, x + 19, 28), fill="#92714e")
            draw.rectangle((x + 1, 29, x + 5, 31), fill="#a28057")
        feet = (31, 320) if id in (3, 5, 6, 8) else (26, 70, 267, 317)
        for x in feet:
            y = 135 if id in (3, 5, 6, 8) else 146
            draw.rectangle((x, y + 4, x + 16, y + 9), fill="#403535")
            draw.rectangle((x + 1, y, x + 14, y + 6), fill="#785e4a")
            draw.line((x + 2, y, x + 13, y), fill="#a88961")
        image.save(art / f"room-{id}.webp", lossless=True)


def bay(draw, box, index):
    x0, y0, x1, y1 = box
    timber = ("#846649", "#70645a", "#7f6259")[(index - 1) % 3]
    draw.rectangle(box, fill="#332e2e")
    draw.rectangle((x0 + 2, y0 + 1, x1 - 2, y1 - 2), fill=timber)
    draw.line((x0 + 3, y0 + 2, x1 - 3, y0 + 2), fill="#ae9069")
    draw.rectangle((x0 + 7, y0 + 5, x1 - 7, y1 - 5), fill="#263230")
    draw.rectangle((x0 + 9, y0 + 7, x1 - 9, y1 - 7), fill="#303e3b")
    draw.line((x0 + 8, y1 - 6, x1 - 8, y1 - 6), fill="#6c6552")
    for x in (x0 + 4, x1 - 4):
        for y in (y0 + 8, y1 - 8):
            draw.point((x, y), fill="#d1ae7a")


def cliff(size, seed):
    w, h = size
    image = Image.new("RGBA", size)
    ink = ImageDraw.Draw(image)
    peak = 24 if w > 46 else 21
    ink.polygon([(0, h - 3), (8, 9), (peak + 13, 7), (w - 2, h - 4), (w - 9, h - 1)], fill="#715544")
    ink.polygon([(2, h - 5), (9, 10), (peak + 13, 8), (peak + 8, 13), (22, 14), (18, h - 5)], fill="#b28a64")
    ink.line((9, 10, peak + 12, 8), fill="#d1ac7e")
    for y in range(14, h - 4, 3):
        ink.line((10 - (y - 14) // 3, y, w - 10 + (y - 14) // 3, y - 1), fill=("#9f7856", "#84604c")[(y + seed) % 2])
    return image


def hut(size, dome=False):
    w, h = size
    image = Image.new("RGBA", size)
    ink = ImageDraw.Draw(image)
    roof = h // 2
    ink.rectangle((2, roof, w - 3, h - 3), fill="#614a3d")
    ink.rectangle((4, roof, w - 5, h - 4), fill="#a6805a")
    for y in range(roof + 3, h - 5, 4):
        ink.line((4, y, w - 5, y), fill="#84654e")
    if dome:
        ink.ellipse((1, 6, w - 2, roof + 15), fill="#5e7476", outline="#ceb083")
        ink.arc((9, 7, w - 10, roof + 12), 180, 359, fill="#b29f78", width=2)
        ink.rectangle((1, roof + 1, w - 2, roof + 5), fill="#c9a977")
    else:
        ink.polygon([(0, roof + 2), (w // 2, 4), (w - 1, roof + 2)], fill="#8f5f48")
        ink.line((0, roof + 1, w // 2, 4, w - 1, roof + 1), fill="#d0a16d", width=2)
    ink.rectangle((w // 2 - 4, h - 13, w // 2 + 4, h - 3), fill="#443a37")
    ink.rectangle((w // 2 - 3, h - 12, w // 2 + 2, h - 3), fill="#695743")
    return image


# The runtime table remains the single source for sprite locations and depth.
def atlas_regions(scenery):
    table = scenery.read_text().split("const foregroundRegions={", 1)[1].split("};", 1)[0]
    return {
        int(id): json.loads("[" + rows.strip().rstrip(",") + "]")
        for id, rows in re.findall(r"(?m)^ (\d+):\[\n(.*?)^ \],", table, re.DOTALL)
    }


def repaint_atlas(art, regions):
    atlas_path = art / "foreground.png"
    atlas = Image.open(atlas_path).convert("RGBA")
    for i, (sx, sy, w, h) in enumerate(dict.fromkeys(tuple(r[:4]) for id in (9, 10, 11, 14) for r in regions[id])):
        if (w, h) == (17, 13):
            continue
        tree = canopy(i % 3 == 1, 82 + i)
        atlas.paste(tree.resize((w, h), Image.Resampling.NEAREST), (sx, sy))
    for i, (sx, sy, w, h) in enumerate(dict.fromkeys(tuple(r[:4]) for r in regions[12])):
        atlas.paste(cliff((w, h), i), (sx, sy))
    for sx, sy, w, h, dome in [(94, 40, 55, 57, True), (218, 40, 45, 38, False)]:
        atlas.paste(hut((w, h), dome), (sx, sy))
    for i, (sx, sy, w, h) in enumerate(dict.fromkeys(tuple(r[:4]) for r in regions[14] if r[2] == 23)):
        plant = Image.new("RGBA", (w, h))
        ink = ImageDraw.Draw(plant)
        ink.ellipse((2, 14, 21, h - 2), fill="#364637")
        ink.rectangle((10, 9, 12, h - 5), fill="#8a6c4e")
        ink.ellipse((2, 2, 20, h - 9), fill="#567051", outline="#8d996a")
        ink.arc((4, 3, 18, h - 10), 170, 260, fill="#b0aa73")
        for x, y in ((7, 7 + i), (15, 9), (10, 13)):
            ink.point((x, y), fill="#c49a65")
        atlas.paste(plant, (sx, sy))
    cabinet = Image.new("RGBA", (24, 26))
    ink = ImageDraw.Draw(cabinet)
    shelf(ink, 2, 2, 20, 805)
    ink.rectangle((3, 15, 20, 24), fill="#654637", outline="#8c674c")
    ink.point((8, 19), fill="#c7a274")
    ink.point((15, 19), fill="#c7a274")
    atlas.paste(cabinet, (263, 40))
    atlas.save(atlas_path)
    return atlas


# North and south door thresholds are at game x=625, or native x=312.5.
SERVICE_GATE_X = 312

TRAILS = {
    9: [[(0, 122), (360, 122)], [(210, 123), (210, 35)]],
    10: [[(311, 0), (312, 65), (267, 114), (313, 145), (312, 180)], [(273, 116), (360, 116)]],
    11: [[(0, 122), (38, 129), (95, 109), (156, 128), (211, 120), (313, 134), (360, 122)]],
    12: [[(0, 119), (81, 108), (154, 130), (224, 109), (360, 122)], [(224, 109), (270, 121), (SERVICE_GATE_X, 147), (SERVICE_GATE_X, 180)]],
    13: [[(0, 122), (78, 133), (165, 112), (257, 123), (271, 88)]],
    14: [[(360, 126), (314, 126), (224, 118)], [(310, 126), (313, 180)]],
    15: [[(0, 122), (113, 150), (215, 133), (SERVICE_GATE_X, 114), (SERVICE_GATE_X, 0)]],
}


def trail(draw, paths, rng):
    # Draw the outer edges first so a spur does not cut across the main road.
    for color, width in (("#73634e", 23), ("#ab946d", 19)):
        for path in paths:
            draw.line(path, fill=color, width=width, joint="curve")
    for path in paths:
        for (x0, y0), (x1, y1) in zip(path, path[1:]):
            length = max(abs(x1 - x0), abs(y1 - y0))
            if not length:
                continue
            for i in range(4, length, 9):
                x, y = x0 + (x1 - x0) * i // length, y0 + (y1 - y0) * i // length
                dx, dy = round(8 * (y1 - y0) / length), round(8 * (x0 - x1) / length)
                offset = rng.choice((-1, 1))
                draw.line((x + dx * offset, y + dy * offset, x + dx * offset + 2, y + dy * offset), fill=rng.choice(("#8c7957", "#beab7e", "#a18e64")))


def water(draw, id, rng):
    if id == 9:
        draw.polygon([(0, 42), (73, 40), (173, 43), (279, 42), (360, 45), (360, 90), (265, 89), (180, 92), (71, 89), (0, 90)], fill="#5d7058")
        draw.rectangle((0, 44, 359, 88), fill="#3b6871")
        draw.line((0, 45, 359, 45), fill="#72978b")
        draw.line((0, 88, 359, 88), fill="#5d867f")
        bounds = (2, 49, 348, 86)
    else:
        draw.polygon([(163, 0), (195, 0), (198, 60), (198, 180), (162, 180), (161, 89)], fill="#7e795f")
        draw.rectangle((165, 0, 195, 179), fill="#3a6975")
        draw.line((165, 0, 165, 179), fill="#88a294")
        draw.line((195, 0, 195, 179), fill="#688e87")
        bounds = (168, 3, 187, 178)
    x0, y0, x1, y1 = bounds
    for _ in range(62):
        x, y = rng.randint(x0, x1), rng.randint(y0, y1)
        draw.line((x, y, x + rng.randrange(2, 8), y), fill=rng.choice(("#467680", "#5d8790", "#38626e")))


def outdoor_rooms(art, atlas, regions):
    for id, paths in TRAILS.items():
        desert = id in (12, 13, 15)
        rng = random.Random(430 + id)
        image, draw = room("#ae8863" if desert else "#4a5e44")
        for y in range(0, 180, TILE):
            for x in range(0, 360, TILE):
                if desert:
                    color = rng.choice(("#ad8763", "#b18a65", "#ad8561", "#af8965"))
                    draw.rectangle((x, y, x + TILE - 1, y + TILE - 1), fill=color)
                    for _ in range(6):
                        u, v = x + rng.randrange(TILE), y + rng.randrange(TILE)
                        draw.line((u, v, u + 2, v), fill=rng.choice(("#bb936b", "#a48160")))
                else:
                    color = rng.choice(("#495e45", "#4b5f46", "#485d46", "#465a42"))
                    image.paste(grass_tile(rng, color), (x, y))
        if id in (12, 15):
            for x in range(0, 340, 54):
                size = (52, 25)
                sprite = cliff(size, id)
                image.paste(sprite, (x, -10 + rng.randrange(4)), sprite)
        for group in ([paths] if id == 12 else [[path] for path in paths]):
            trail(draw, group, rng)
        if id in (9, 11):
            water(draw, id, rng)
        for sx, sy, w, h, x, y, _depth, *freestanding in regions.get(id, []):
            if not freestanding:
                sprite = atlas.crop((sx, sy, sx + w, sy + h))
                image.paste(sprite, (x, y), sprite)
        image.save(art / f"room-{id}.webp", lossless=True)


def nacre(art):
    image, draw = room("#19233d")
    rng = random.Random(102)
    for _ in range(92):
        x, y = rng.randrange(360), rng.randrange(91)
        draw.point((x, y), fill=rng.choice(("#9c91aa", "#d7b6b4", "#678499")))
    draw.ellipse((251, 20, 284, 53), fill="#a27395", outline="#d4a6ad")
    draw.arc((251, 20, 284, 53), 180, 352, fill="#edbac1", width=2)
    draw.ellipse((258, 29, 267, 35), outline="#bb8ba2")
    for y, main, shade in [(90, "#40486b", "#343c60"), (95, "#505575", "#444764")]:
        for x in range(-21, 360, 39):
            top = y - rng.randrange(13, 29)
            draw.polygon([(x, y), (x + 22, top), (x + 47, y)], fill=main)
            draw.polygon([(x + 22, top), (x + 29, y), (x + 47, y)], fill=shade)
    stones(draw, (0, 91, 359, 179), 26, TILE, ("#383d56", "#4b5067", "#525874", "#646a84"), 601)
    draw.line((0, 91, 359, 91), fill="#9d879b", width=2)
    for x in range(14, 354, 15):
        draw.point((x, 92), fill="#c3a7a7")
    for x, y in [(29, 110), (60, 145), (111, 164), (268, 150), (343, 115)]:
        draw.polygon([(x, y - 7), (x + 4, y - 11), (x + 7, y - 7), (x + 5, y), (x, y + 1)], fill="#7d8f9f")
        draw.line((x + 1, y, x + 4, y - 10), fill="#aab6ba")
    image.save(art / "room-34.webp", lossless=True)


def shed(art):
    image, draw = room("#30292a")
    draw.rectangle((18, 22, 341, 157), fill="#775540")
    stones(draw, (20, 87, 340, 156), 38, 10, ("#694b39", "#8f6946", "#99734d", "#a98257"), 619)
    draw.rectangle((19, 21, 341, 45), fill="#554037")
    for x in range(20, 336, 23):
        draw.rectangle((x, 24, x + 19, 44), fill="#715244")
        draw.line((x, 25, x, 43), fill="#936a4c")
    draw.rectangle((18, 45, 341, 48), fill="#ad8058")
    draw.rectangle((18, 49, 341, 52), fill="#503a31")
    shelf(draw, 165, 27, 41, 619)
    shelf(draw, 233, 27, 38, 631)
    shelf(draw, 290, 27, 38, 683)
    image.save(art / "room-35.webp", lossless=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    project = Path(__file__).resolve().parents[1]
    default = project / ("src" if (project / "src").is_dir() else "dist") / "art"
    parser.add_argument("--art-dir", type=Path, default=default)
    art = parser.parse_args().art_dir
    outdoor(art)
    castle_lab(art)
    regions = atlas_regions(art.parent / "scenery.js")
    atlas = repaint_atlas(art, regions)
    sandstone_rooms(art, atlas, regions)
    outdoor_rooms(art, atlas, regions)
    for id in range(24, 34):
        observatory(art, id)
    nacre(art)
    shed(art)


if __name__ == "__main__":
    main()
