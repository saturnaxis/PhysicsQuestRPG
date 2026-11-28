#!/usr/bin/env python3
"""Draw Physics Quest's cast sheets and layered rail vehicles. Requires Pillow."""

import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

CELL = (26, 32)
SOOT = "#28252f"
BRASS = ("#76513c", "#ab7a49", "#e0ba77")
IRON = ("#383943", "#595c65", "#898286")
SKIN = {
    "fair": ("#a96955", "#d29771", "#f3c69b"),
    "warm": ("#90513e", "#bd7950", "#e3a56e"),
    "deep": ("#623e3a", "#9b5d43", "#c78354"),
}
# Hair, coat, skin, silhouette and portrait detail.
CAST = {
    "inez": (("#6e5a62", "#bba294", "#e4cdad"), ("#49354e", "#624c6a", "#8c7291"), "fair", "bun", "glasses"),
    "teo": (("#402934", "#623a35", "#9d5c42"), ("#624635", "#9e734a", "#c9a16a"), "warm", "curls", "bib"),
    "fen": (("#482f32", "#704538", "#ad7150"), ("#3d4935", "#596447", "#829068"), "fair", "tail", "scarf"),
    "lin": (("#292c41", "#3c3c53", "#60586a"), ("#394057", "#52627d", "#7d8ca1"), "fair", "long", "pins"),
    "pax": (("#433039", "#69443e", "#a86b54"), ("#57384a", "#87516b", "#ae7384"), "fair", "curls", "phones"),
    "uma": (("#332632", "#4f3030", "#80503d"), ("#404b35", "#617452", "#8b9a5d"), "deep", "braids", "band"),
    "dev": (("#292b3a", "#413c4b", "#696473"), ("#724739", "#ae7349", "#d8a366"), "warm", "sweep", "harness"),
    "kit": (("#543138", "#844a38", "#c67e4d"), ("#474938", "#687350", "#909963"), "fair", "tail", "goggles"),
    "ada": (("#473038", "#6c4541", "#9b6652"), ("#624139", "#97593f", "#c98359"), "fair", "sweep", "harness"),
    "ren": (("#4a3035", "#754938", "#b77954"), ("#444730", "#68754d", "#8e9962"), "fair", "curls", "bib"),
    "jo": (("#493534", "#68483e", "#9a6f53"), ("#393b55", "#515b76", "#74869b"), "warm", "sweep", "beard"),
    "bea": (("#6a5049", "#af8c72", "#d8ba95"), ("#543b42", "#865057", "#ae706b"), "fair", "bun", "harness"),
    "neri": (("#502f36", "#78473d", "#a8654d"), ("#633b38", "#965740", "#c37950"), "warm", "braids", "leaf"),
    "orin": (("#3e3039", "#60404a", "#8b5860"), ("#593b39", "#8a5046", "#b87656"), "warm", "curls", "harness"),
    "elio": (("#503335", "#874f39", "#c78450"), ("#294550", "#386c75", "#69999a"), "warm", "sweep", "bib"),
    "kez": (("#38283e", "#53384f", "#795068"), ("#4d385d", "#77537d", "#9d7598"), "fair", "long", "pins"),
    "niko": (("#3c2c36", "#5d3d36", "#8a5b40"), ("#6b4a33", "#a16e44", "#cc995e"), "deep", "curls", "goggles"),
    "student-rose": (("#44313b", "#694649", "#9c6960"), ("#533a4a", "#885e69", "#ab8189"), "warm", "long", "bib"),
    "student-teal": (("#463435", "#705340", "#9e7450"), ("#354955", "#537884", "#7e9e9d"), "fair", "sweep", "bib"),
    "student-olive": (("#332b3b", "#563e56", "#7a5a68"), ("#4a4736", "#777653", "#a39e71"), "deep", "curls", "bib"),
    "student-plum": (("#342738", "#593945", "#8a5862"), ("#4d3f5f", "#766484", "#a089a6"), "warm", "braids", "bib"),
}


def character(profile, direction, step, carry):
    hair, coat, tone, silhouette, detail = profile
    hs, hm, hl = hair
    cs, cm, cl = coat
    ss, sm, sl = SKIN[tone]
    image = Image.new("RGBA", CELL)
    d = ImageDraw.Draw(image)
    d.ellipse((4, 26, 22, 30), fill=(28, 25, 34, 95))
    side = direction == "east"
    back = direction == "north"
    swing = (0, 2, -2)[step]
    bob = int(step != 0)
    d.polygon([(7 + swing, 23), (12 + swing, 24), (12 + swing, 28), (7 + swing, 29)], fill="#333142", outline=SOOT)
    d.polygon([(14 - swing, 23), (19 - swing, 24), (20 - swing, 28), (15 - swing, 29)], fill="#463947", outline=SOOT)
    d.line((8 + swing, 27, 11 + swing, 27), fill="#756054")
    d.line((16 - swing, 27, 19 - swing, 27), fill="#887061")
    d.polygon([(7, 15 + bob), (18, 15 + bob), (21, 21), (19, 26), (7, 26), (5, 21)], fill=cs, outline=SOOT)
    d.polygon([(8, 16 + bob), (17, 16 + bob), (18, 23), (8, 24)], fill=cm)
    d.line((9, 17 + bob, 16, 17 + bob), fill=cl)
    if back:
        d.rectangle((9, 19, 16, 23), fill=cs)
        d.line((11, 20, 15, 20), fill=cl)
    else:
        d.line((10, 19, 12, 23, 15, 18), fill=cl)
        d.point((13, 24), fill="#cfab73")
    if detail in {"bib", "harness"} and not back:
        d.line((8, 17, 11, 22, 18, 18), fill="#493b38", width=2)
        d.point((11, 22), fill="#e2bb80")
    if silhouette in {"tail", "long", "braids"}:
        d.polygon([(7, 8 + bob), (17, 8 + bob), (19, 16), (21, 20), (17, 21), (14, 17), (7, 19), (5, 16)], fill=hs, outline=SOOT)
        d.line((18, 13, 18, 17, 20, 19), fill=hm, width=2)
    cx = 1 if side else 0
    def rect(box, color):
        x0, y0, x1, y1 = box
        d.rectangle((x0 + cx, y0 + bob, x1 + cx, y1 + bob), fill=color)
    if silhouette == "bun":
        rect((3, 7, 8, 12), SOOT)
        rect((4, 6, 8, 12), hs)
        rect((5, 7, 7, 10), hl)
    elif silhouette == "tail":
        rect((4, 8, 7, 15), SOOT)
        rect((4, 10, 6, 14), hm)
        rect((4, 14, 5, 17), hs)
    elif silhouette == "braids":
        rect((4, 7, 7, 16), SOOT)
        rect((5, 7, 6, 14), hm)
        rect((5, 9, 5, 10), hl)
        rect((6, 13, 6, 14), hl)
    elif silhouette == "curls":
        rect((5, 6, 7, 11), hs)
        rect((9, 3, 12, 5), hs)
        rect((15, 3, 17, 5), hs)
        rect((18, 5, 20, 8), hs)
    d.polygon([(7 + cx, 6 + bob), (10 + cx, 4 + bob), (16 + cx, 4 + bob), (19 + cx, 7 + bob), (19 + cx, 14 + bob), (16 + cx, 17 + bob), (9 + cx, 16 + bob), (6 + cx, 13 + bob)], fill=hs, outline=SOOT)
    if not back:
        rect((9, 9, 17, 14), sm)
        rect((10, 14, 15, 15), sm)
        rect((9, 10, 10, 14), ss)
        rect((12, 9, 16, 12), sl)
        rect((13, 14, 16, 14), sl)
        if side:
            rect((17, 12, 19, 13), sm)
            rect((16, 11, 16, 11), SOOT)
            rect((16, 14, 17, 14), ss)
        else:
            rect((11, 11, 11, 12), SOOT)
            rect((15, 11, 15, 12), SOOT)
            rect((12, 14, 14, 14), ss)
    else:
        rect((9, 8, 17, 14), hm)
        rect((10, 14, 15, 15), hs)
    for x, y, width in {
        "curls": [(7, 6, 3), (10, 3, 3), (14, 4, 4), (17, 6, 2), (8, 9, 3)],
        "braids": [(6, 7, 3), (8, 5, 3), (11, 4, 4), (15, 5, 3), (6, 13, 2)],
        "sweep": [(9, 5, 8), (8, 6, 8), (7, 7, 7), (8, 8, 4)],
        "bun": [(8, 6, 8), (10, 5, 6), (7, 8, 4), (16, 7, 2)],
    }.get(silhouette, [(8, 5, 9), (7, 6, 10), (7, 7, 6), (7, 8, 4)]):
        rect((x, y, x + width - 1, y), hm)
        rect((x + 1, y, x + 1, y), hl)
    if detail in {"glasses", "phones", "goggles", "band", "pins", "leaf"}:
        gold = "#d3ac6d"
        if detail in {"glasses", "phones"} and not back:
            rect((10, 11, 12, 11), "#7d6352")
            rect((14, 11, 16, 11), "#7d6352")
            rect((11, 12, 11, 12), "#b49567")
            if not side:
                rect((15, 12, 15, 12), "#b49567")
        if detail in {"phones", "scarf"}:
            rect((8, 16, 17, 17), cs)
        if detail == "phones":
            rect((8, 16, 9, 18), gold)
            rect((16, 16, 17, 18), gold)
        if detail == "goggles":
            rect((9, 5, 12, 6), gold)
            rect((14, 5, 17, 6), gold)
            rect((10, 5, 11, 5), "#5e6577")
            rect((15, 5, 16, 5), "#5e6577")
        if detail == "band":
            rect((8, 7, 17, 7), gold)
        if detail in {"pins", "leaf"}:
            rect((7, 7, 9, 7), gold if detail == "pins" else "#99a468")
            rect((7, 5, 8, 5), gold if detail == "pins" else "#859451")
    if detail == "scarf":
        rect((8, 16, 17, 17), "#756450")
    if detail == "beard" and not back:
        rect((10, 14, 16, 15), hs)
        rect((11, 14, 14, 14), hm)
    if carry:
        # The actual carried object is rendered separately by the game.
        for x in ((10, 18) if side else (6, 18)):
            d.rectangle((x, 19, x + 3, 23), fill=cs, outline=SOOT)
            d.rectangle((x + 1, 18, x + 3, 20), fill=sm)
            d.point((x + 2, 18), fill=sl)
    else:
        for x, y in ((5, 20 + swing), (19, 20 - swing)):
            if side and x == 5:
                continue
            d.rectangle((x, y, x + 2, y + 4), fill=cs, outline=SOOT)
            d.point((x + 1, y + 3), fill=sm)
    return image


def sheet(profile):
    result = Image.new("RGBA", (156, 128))
    for row, direction in enumerate(("east", "west", "south", "north")):
        for column in range(6):
            source = "east" if direction == "west" else direction
            frame = character(profile, source, column % 3, column >= 3)
            if direction == "west":
                frame = frame.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            result.paste(frame, (column * CELL[0], row * CELL[1]))
    return result


def chassis():
    image = Image.new("RGBA", (48, 34))
    d = ImageDraw.Draw(image)
    d.ellipse((1, 28, 46, 33), fill=(29, 26, 32, 108))
    d.polygon([(7, 23), (40, 23), (45, 27), (43, 31), (5, 31), (2, 28)], fill=IRON[0], outline=SOOT)
    d.line((5, 29, 42, 29), fill=IRON[1], width=2)
    for x in (9, 33):
        d.polygon([(x, 24), (x + 5, 22), (x + 10, 25), (x + 8, 31), (x + 1, 31)], fill=IRON[1], outline=SOOT)
        d.line((x + 2, 27, x + 8, 27), fill=IRON[2])
        d.rectangle((x + 4, 27, x + 6, 29), fill=BRASS[0])
    d.polygon([(12, 12), (16, 9), (33, 9), (38, 13), (41, 20), (35, 28), (13, 28), (7, 21)], fill=BRASS[0], outline=SOOT)
    d.polygon([(13, 13), (16, 11), (32, 11), (36, 14), (35, 25), (15, 25), (10, 20)], fill=BRASS[1])
    d.line((12, 15, 15, 12, 32, 12), fill=BRASS[2])
    for side in (0, 1):
        sign = 1 if side == 0 else -1
        x = 3 if side == 0 else 44
        d.line((x + 7 * sign, 14, x + 2 * sign, 19, x, 25), fill=SOOT, width=5)
        d.line((x + 7 * sign, 14, x + 2 * sign, 19, x, 25), fill=BRASS[1], width=3)
        d.point((x + 2 * sign, 19), fill=BRASS[2])
        d.rectangle((x + 1 * sign - 2, 24, x + 1 * sign + 2, 27), fill=IRON[1], outline=SOOT)
    d.ellipse((12, 11, 35, 32), fill=SOOT, outline=IRON[1])
    d.polygon([(14, 4), (20, 1), (30, 1), (35, 5), (35, 11), (31, 14), (17, 14), (13, 10)], fill=BRASS[0], outline=SOOT)
    d.polygon([(15, 6), (20, 2), (29, 2), (34, 5), (31, 7), (16, 8)], fill=BRASS[1])
    d.line((17, 5, 21, 3, 29, 3), fill=BRASS[2])
    d.rectangle((15, 7, 33, 11), fill="#322f39")
    d.line((18, 13, 30, 13), fill=IRON[2])
    return image


def flywheel(frame):
    image = Image.new("RGBA", (22, 22))
    d = ImageDraw.Draw(image)
    d.ellipse((0, 0, 21, 21), fill=SOOT)
    d.ellipse((1, 1, 20, 20), fill=BRASS[0])
    d.arc((1, 1, 20, 20), 165, 310, fill=BRASS[2], width=2)
    d.ellipse((4, 4, 17, 17), fill="#35343b")
    for quadrant in range(4):
        angle = (frame / 8 + quadrant) * math.pi / 2
        x, y = round(10.5 + 7 * math.cos(angle)), round(10.5 + 7 * math.sin(angle))
        d.line((10, 10, x, y), fill=BRASS[1], width=2)
        d.point((x, y), fill=BRASS[2])
    d.rectangle((9, 9, 12, 12), fill=BRASS[2], outline=BRASS[0])
    d.point((10, 10), fill="#f5d7a2")
    return image


def visor_frame(index):
    tones = (("#8a4b37", "#eb914a", "#ffe3a0"), ("#7f393c", "#f76548", "#ffbc89"), ("#376d58", "#66d097", "#dbffc8"))
    shade, display, bright = tones[index]
    image = Image.new("RGBA", (16, 6))
    d = ImageDraw.Draw(image)
    d.polygon([(0, 2), (3, 1), (13, 1), (15, 2), (13, 4), (2, 4)], fill=shade)
    d.line((3, 2, 12, 2), fill=display, width=2)
    d.line((5, 2, 7, 2), fill=bright)
    d.point((11, 2), fill=bright)
    return image


def rail_cart(receiver):
    image = Image.new("RGBA", (48, 28))
    d = ImageDraw.Draw(image)
    metal = ("#3f555c", "#65858a", "#9bafb0") if receiver else BRASS
    d.ellipse((2, 23, 45, 26), fill=(29, 26, 32, 104))
    for x in (10, 30):
        d.ellipse((x, 17, x + 10, 25), fill=SOOT)
        d.ellipse((x + 2, 18, x + 8, 23), fill=IRON[2])
        d.point((x + 5, 21), fill=IRON[0])
    d.rectangle((4, 17, 43, 21), fill=IRON[0], outline=SOOT)
    d.rectangle((1, 17, 5, 19), fill=IRON[2])
    d.rectangle((43, 17, 46, 19), fill=IRON[2])
    d.polygon([(4, 7), (44, 7), (41, 17), (38, 19), (10, 19), (6, 16)], fill=metal[0], outline=SOOT)
    d.polygon([(5, 8), (43, 8), (40, 15), (8, 15)], fill=metal[1])
    d.line((5, 8, 43, 8), fill=metal[2], width=2)
    for x in (9, 36):
        d.line((x, 9, x + 1, 16), fill=metal[2])
        d.point((x + 1, 17), fill="#dcca9b")
    if receiver:
        d.rectangle((18, 4, 30, 15), fill=IRON[0], outline=SOOT)
        d.rectangle((20, 6, 28, 11), fill="#486e6f")
        d.line((21, 8, 27, 8), fill="#8bccb1")
        d.point((28, 13), fill="#ebce88")
    else:
        for x in (14, 24, 32):
            d.rectangle((x, 10, x + 2, 14), fill=metal[0])
        d.rectangle((21, 10, 27, 13), fill="#ddac69")
    return image


def strip(frames):
    width, height = frames[0].size
    image = Image.new("RGBA", (width * len(frames), height))
    for index, frame in enumerate(frames):
        image.paste(frame, (index * width, 0))
    return image


def contact_sheet(path, sheets, base, wheels, visors, carts):
    background = "#1d222d"
    width, column, row = 1496, 366, 324
    cast_rows = (len(sheets) + 3) // 4
    image = Image.new("RGB", (width, 44 + cast_rows * row + 300), background)
    d = ImageDraw.Draw(image)
    heading = ImageFont.load_default(size=21)
    caption = ImageFont.load_default(size=15)
    d.text((16, 11), "Physics Quest · Art Pass 3 | Cast & Rail Vehicles", fill="#f1d9aa", font=heading)
    for i, (name, art) in enumerate(sheets.items()):
        x, y = 16 + i % 4 * column, 52 + i // 4 * row
        d.rounded_rectangle((x, y, x + 351, y + 309), radius=8, fill="#293441", outline="#3c4a57")
        d.text((x + 12, y + 8), name.replace("-", " ").title(), fill="#f1d9aa", font=caption)
        d.text((x + 84, y + 30), "WALK", fill="#aab8cb", font=caption)
        d.text((x + 235, y + 30), "CARRY", fill="#aab8cb", font=caption)
        for j, label in enumerate(("E", "W", "S", "N")):
            d.text((x + 19, y + 68 + 64 * j), label, fill="#aab8cb", font=caption)
        atlas = art.resize((312, 256), Image.Resampling.NEAREST)
        image.paste(atlas, (x + 34, y + 48), atlas)
    top = 48 + cast_rows * row
    for i, name in enumerate(("Fault · start", "Fault · reverse", "Online")):
        d.text((20, top + i * 70 + 19), name, fill="#f1d9aa", font=caption)
        for j, frame in enumerate(wheels):
            pose = base.copy()
            pose.alpha_composite(frame, (13, 11))
            pose.alpha_composite(visors[i], (16, 6))
            pose = pose.resize((96, 68), Image.Resampling.NEAREST)
            image.paste(pose, (155 + j * 160, top + i * 70), pose)
    for i, (name, art) in enumerate(carts.items()):
        x = 20 + 285 * i
        d.text((x, top + 233), name, fill="#f1d9aa", font=caption)
        scaled = art.resize((96, 56), Image.Resampling.NEAREST)
        image.paste(scaled, (x + 128, top + 218), scaled)
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    project = Path(__file__).resolve().parents[1]
    default = project / ("src" if (project / "src").is_dir() else "dist") / "art"
    parser.add_argument("--art-dir", type=Path, default=default)
    parser.add_argument("--contact-sheet", type=Path)
    args = parser.parse_args()
    sheets = {name: sheet(profile) for name, profile in CAST.items()}
    for name, art in sheets.items():
        art.save(args.art_dir / f"{name}-directions.png")
    base = chassis()
    wheels = [flywheel(frame) for frame in range(8)]
    visors = [visor_frame(frame) for frame in range(3)]
    carts = {"Launch cart": rail_cart(False), "Receiving cart": rail_cart(True)}
    base.save(args.art_dir / "guardian.png")
    strip(wheels).save(args.art_dir / "guardian-wheel.png")
    strip(visors).save(args.art_dir / "guardian-visor.png")
    for filename, art in zip(("cart.png", "receiver.png"), carts.values()):
        art.save(args.art_dir / filename)
    if args.contact_sheet:
        contact_sheet(args.contact_sheet, sheets, base, wheels, visors, carts)


if __name__ == "__main__":
    main()
