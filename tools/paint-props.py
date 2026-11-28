#!/usr/bin/env python3
"""Build the native-resolution apparatus atlas. Requires Pillow."""

import json
from pathlib import Path

from PIL import Image, ImageDraw

INK = "#26272e"
WOOD = ("#503931", "#775643", "#ad8256", "#dbb177")
BRASS = ("#594538", "#92704e", "#c09358", "#edc786")
IRON = ("#2c3039", "#4b565b", "#748789", "#aeb9a5")
STONE = ("#333637", "#5c6460", "#858d7b", "#bbb8a0")
TEAL = ("#284346", "#42676b", "#70aba5", "#b9dacc")


def blank(size, paint):
    image = Image.new("RGBA", size)
    paint(ImageDraw.Draw(image), *size)
    return image


def bevel(d, box, palette, rivets=False):
    x0, y0, x1, y1 = box
    dark, mid, edge, shine = palette
    d.rectangle(box, fill=INK)
    d.rectangle((x0 + 1, y0 + 1, x1 - 1, y1 - 1), fill=dark)
    if x1 - x0 >= 4 and y1 - y0 >= 4:
        d.rectangle((x0 + 2, y0 + 2, x1 - 2, y1 - 2), fill=mid)
    d.line((x0 + 1, y0 + 1, x1 - 1, y0 + 1), fill=edge)
    if x1 - x0 >= 5 and y1 - y0 >= 3:
        d.line((x0 + 2, y0 + 2, x1 - 3, y0 + 2), fill=shine)
    if rivets:
        for x in (x0 + 3, x1 - 3):
            for y in (y0 + 3, y1 - 3):
                d.point((x, y), fill=shine)


def drafting(d, w, h):
    for x in (5, w - 8):
        bevel(d, (x, h - 10, x + 3, h - 2), WOOD)
    bevel(d, (1, 3, w - 2, h - 7), WOOD, True)
    d.line((2, 5, w - 3, 5), fill="#b5895c")
    d.polygon([(10, 5), (31, 5), (34, 7), (32, 14), (12, 14), (10, 12)], fill="#755846")
    d.polygon([(10, 4), (30, 4), (32, 6), (30, 12), (12, 12), (10, 14)], fill="#e9d2a2")
    d.line((13, 5, 29, 5), fill="#fff0c7")
    d.line((13, 8, 26, 8), fill="#aa8870")
    d.line((13, 10, 22, 10), fill="#aa8870")
    d.line((29, 10, 31, 12, 29, 13), fill="#a47c58")
    d.line((36, 7, 33, 12), fill=IRON[0])
    d.line((36, 7, 38, 11), fill=IRON[0])
    d.point((36, 7), fill=BRASS[3])


def lectern(d, w, h):
    bevel(d, (13, 6, 20, h - 3), WOOD)
    bevel(d, (8, h - 5, 25, h - 1), WOOD)
    bevel(d, (2, 4, w - 3, 10), WOOD)
    d.polygon([(5, 6), (7, 1), (14, 1), (17, 3), (21, 1), (28, 1), (30, 6), (28, 9), (18, 9), (17, 10), (7, 9)], fill=WOOD[0], outline=INK)
    d.polygon([(7, 2), (14, 2), (17, 4), (17, 8), (7, 7)], fill="#e4ca99")
    d.polygon([(17, 4), (21, 2), (28, 2), (28, 7), (17, 8)], fill="#f7e3b9")
    d.line((20, 6, 23, 3, 26, 6), fill="#728b75")
    d.line((10, 4, 14, 4), fill="#a98566")
    d.line((9, 6, 13, 6), fill="#a98566")


def terminal(d, w, h):
    bevel(d, (1, 11, w - 2, h - 1), WOOD, True)
    bevel(d, (6, 0, w - 6, h - 7), BRASS, True)
    d.rectangle((9, 3, w - 9, 9), fill="#263d3d")
    d.rectangle((10, 3, w - 10, 8), fill="#456c65")
    for y in (4, 6, 8):
        d.line((11, y, w - 11, y), fill="#86b497")
    d.point((13, 5), fill="#d3e6ab")
    d.point((w - 8, 11), fill="#9cbe85")
    bevel(d, (9, 14, w - 9, 17), IRON)


def lane(d, w, h, surface):
    palettes = [
        ("#3f565a", "#60868a", "#73999b", "#91afab"),
        ("#464f49", "#6b7b6d", "#829181", "#9da28a"),
        ("#554238", "#8b6c53", "#a0835e", "#b3966e"),
        ("#695039", "#ac8351", "#c99d62", "#e1bd7c"),
        ("#3d4b44", "#59665b", "#737e65", "#8c9175"),
    ]
    dark, mid, edge, shine = palettes[surface]
    d.rectangle((0, 0, w - 1, h - 1), fill=dark)
    d.rectangle((0, 1, w - 1, h - 2), fill=mid)
    d.line((0, 1, w - 1, 1), fill=edge)
    if surface in (0, 3):
        for y in range(4, h - 1, 4):
            d.line((0, y + 1, w - 1, y + 1), fill=dark)
            for x in range((y * 5) % 23, w - 9, 23):
                d.line((x, y, x + 8 + y % 3, y), fill=shine)
    elif surface == 1:
        for y in range(4, h - 1, 5):
            d.line((0, y, w - 1, y), fill=edge)
            for x in range(y % 5, w, 12):
                d.line((x, y, x, min(y + 3, h - 2)), fill=dark)
    elif surface == 2:
        for x in range(w):
            for y in range(3, h - 2):
                if (x * 11 + y * 6 + x * y) % 13 < 2:
                    d.point((x, y), fill=edge if x % 2 else dark)
    else:
        for y in range(2, h - 1):
            for x in range(w):
                if (x + y % 2 * 2) % 4 < 2:
                    d.point((x, y), fill=edge if y % 3 else shine)


def wood_sled(d, w, h):
    bevel(d, (1, h - 5, w - 2, h - 1), IRON, w > 12)
    bevel(d, (2, h - 10, w - 3, h - 4), WOOD)
    if h > 10:
        bevel(d, (4, 0, w - 5, h - 5), WOOD, True)
        d.line((5, 4, w - 6, 4), fill="#a88059")
    d.point((1, h - 3), fill=IRON[3])
    d.point((w - 2, h - 3), fill=IRON[3])


def plate(d, w, h, engaged, shed):
    bevel(d, (0, 0, w - 1, h - 1), IRON if shed else STONE, True)
    trim = ("#405c49", "#58846e", "#94b690", "#cad8aa") if engaged else BRASS
    bevel(d, (3, 2, w - 4, h - 4), trim)
    d.line((5, h - 3, w - 6, h - 3), fill=trim[2])
    for x in range(6, w - 5, 4):
        d.line((x, 5, x + 1, 6), fill=trim[0])
    if shed:
        d.line((6, h - 4, w - 7, h - 4), fill=trim[3])


def cylinder(d, w, h):
    bevel(d, (0, 1, 4, h - 2), BRASS)
    bevel(d, (w - 5, 1, w - 1, h - 2), BRASS)
    bevel(d, (0, h - 5, w - 1, h - 1), BRASS)
    for x in (2, w - 3):
        for y in (4, h - 3):
            d.point((x, y), fill=BRASS[3])


def fluid(d, w, h):
    d.rectangle((0, 0, w - 1, h - 1), fill=TEAL[2])
    d.rectangle((0, 0, w - 1, 1), fill=TEAL[3])
    d.line((2, 2, 2, h - 3), fill="#9bc7b2")
    d.line((4, 2, 4, h - 6), fill="#8ab8a9")
    d.line((w - 1, h - 1, 0, h - 1), fill=TEAL[1])
    for x, y in ((6, 5), (13, 7), (19, 4), (23, 9)):
        d.point((x, y), fill="#8ab8a9")


def piston(d, w, h):
    bevel(d, (w // 2 - 4, 0, w // 2 + 4, h - 3), IRON)
    bevel(d, (0, h - 5, w - 1, h - 1), BRASS)
    d.line((3, h - 3, w - 4, h - 3), fill=IRON[3])


def balance_post(d, w, h):
    d.polygon([(5, h - 3), (7, 5), (10, 2), (13, 2), (16, 5), (18, h - 3)], fill=STONE[1], outline=INK)
    d.line((8, 8, 7, h - 4), fill=STONE[3])
    d.ellipse((8, 2, 15, 9), fill=IRON[1], outline=INK)
    d.point((11, 5), fill=BRASS[3])
    bevel(d, (1, h - 4, w - 2, h - 1), BRASS)


def ballast_rack(d, w, h):
    bevel(d, (0, 1, w - 1, h - 1), WOOD, True)
    bevel(d, (6, 2, w - 6, h - 4), IRON)
    d.line((9, 5, w - 9, 5), fill=IRON[3])
    d.line((9, 7, w - 9, 7), fill=IRON[1])


def interlock(d, w, h, held):
    bevel(d, (0, 0, w - 1, h - 1), BRASS, True)
    bevel(d, (5, 2, w - 6, h - 3), TEAL if held else IRON)
    d.line((7, 4, w - 8, 4), fill="#a6c38c" if held else "#a99f87")
    for x in (8, w - 9):
        d.point((x, h - 4), fill="#d9ebaf" if held else "#cc975d")


def main():
    root = Path(__file__).resolve().parents[1]
    target = root / ("src" if (root / "src").is_dir() else "dist")
    items = {}

    def add(name, size, paint):
        items[name] = blank(size, paint)

    add("drafting", (46, 23), drafting)
    add("lectern", (34, 16), lectern)
    add("terminal", (35, 20), terminal)
    for style, name in enumerate(("smooth", "stone", "rough", "oiled", "mat")):
        add(name, (193 if style < 3 else 79 if style == 3 else 151, 13 if style < 3 else 12), lambda d, w, h, style=style: lane(d, w, h, style))
    add("scoreBand", (30, 12), lambda d, w, h: bevel(d, (0, 0, w - 1, h - 1), BRASS, True))
    add("frictionSled", (11, 10), wood_sled)
    add("ballastSled", (23, 17), wood_sled)
    add("massBlock", (17, 14), lambda d, w, h: bevel(d, (0, 0, w - 1, h - 1), WOOD, True))
    for active in (False, True):
        suffix = "Live" if active else ""
        add("forcePlate" + suffix, (26, 14), lambda d, w, h, active=active: plate(d, w, h, active, False))
        add("shedPlate" + suffix, (21, 18), lambda d, w, h, active=active: plate(d, w, h, active, True))
        add("interlock" + suffix, (28, 9), lambda d, w, h, active=active: interlock(d, w, h, active))
    for name, width in (("Wide", 46), ("Narrow", 20)):
        add("cylinder" + name, (width + 5, 33), cylinder)
        add("fluid" + name, (width, 15), fluid)
        add("piston" + name, (width, 16), piston)
    add("hydraulicCap", (49, 9), lambda d, w, h: bevel(d, (0, 0, w - 1, h - 1), BRASS, True))
    add("pressureGauge", (35, 17), lambda d, w, h: bevel(d, (0, 0, w - 1, h - 1), IRON, True))
    add("testBlock", (28, 15), lambda d, w, h: bevel(d, (0, 0, w - 1, h - 1), IRON, True))
    add("beam", (12, 5), lambda d, w, h: bevel(d, (0, 0, w - 1, h - 1), BRASS))
    add("fulcrum", (24, 23), balance_post)
    add("ballast", (22, 10), ballast_rack)
    add("rail", (48, 4), lambda d, w, h: bevel(d, (0, 0, w - 1, h - 1), IRON))
    add("pipe", (48, 8), lambda d, w, h: bevel(d, (0, 0, w - 1, h - 1), IRON))

    atlas = Image.new("RGBA", (256, 256))
    regions = {}
    left, top, row_height = 0, 0, 0
    for name, item in items.items():
        w, h = item.size
        if left + w > atlas.width:
            left, top, row_height = 0, top + row_height + 1, 0
        if top + h > atlas.height:
            raise ValueError(f"{name} does not fit in the prop atlas")
        atlas.paste(item, (left, top))
        regions[name] = [left, top, w, h]
        left += w + 1
        row_height = max(row_height, h)
    atlas.save(target / "art" / "props.png")
    lines = [f" {name}:{json.dumps(region, separators=(',', ':'))}" for name, region in regions.items()]
    (target / "prop-atlas.js").write_text("'use strict';\n\n// Generated by tools/paint-props.py. Coordinates are in atlas pixels.\nconst propAtlasRegions={\n" + ",\n".join(lines) + "\n};\n", encoding="utf-8")


if __name__ == "__main__":
    main()
