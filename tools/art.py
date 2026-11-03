"""Procedural art generator for Santa Cap Catcher (offline fallback).

Draws cartoon sprites with PIL at 4x supersampling, then downsamples.
Every sprite is a transparent PNG sized <= 1024 px.
"""
import math
import os

from PIL import Image, ImageChops, ImageDraw, ImageFilter

OUT = r"E:\HatGame\art"
SS = 4  # supersample factor

DARK = (58, 20, 24, 255)


def canvas(w, h):
    return Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))


def save(img, w, h, name):
    img = img.resize((w, h), Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name + ".png")
    img.save(path)
    print(f"{name}.png  {w}x{h}")
    return path


# ---------------------------------------------------------------- primitives

def lerp(a, b, t):
    return a + (b - a) * t


def mix(c1, c2, t):
    return tuple(int(round(lerp(c1[i], c2[i], t))) for i in range(len(c1)))


def vgrad(size, top, bottom):
    w, h = size
    img = Image.new("RGBA", (w, h))
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        c = mix(top, bottom, t)
        for x in range(w):
            px[x, y] = c
    return img


def radial(size, inner, outer, cx=0.5, cy=0.5, radius=0.75):
    w, h = size
    img = Image.new("RGBA", (w, h))
    px = img.load()
    for y in range(h):
        for x in range(w):
            dx = (x / w - cx) * 1.0
            dy = (y / h - cy) * (h / w)
            d = math.sqrt(dx * dx + dy * dy) / radius
            px[x, y] = mix(inner, outer, min(1.0, d))
    return img


def bezier(p0, p1, p2, p3, n=64):
    pts = []
    for i in range(n + 1):
        t = i / n
        mt = 1 - t
        x = (mt ** 3) * p0[0] + 3 * (mt ** 2) * t * p1[0] + 3 * mt * (t ** 2) * p2[0] + (t ** 3) * p3[0]
        y = (mt ** 3) * p0[1] + 3 * (mt ** 2) * t * p1[1] + 3 * mt * (t ** 2) * p2[1] + (t ** 3) * p3[1]
        pts.append((x, y))
    return pts


def S(pts, w, h):
    return [(p[0] * w, p[1] * h) for p in pts]


def paste_gradient(layer, shape_mask, grad):
    layer.paste(grad, (0, 0), shape_mask)


def outline(layer, color=DARK, k=6):
    alpha = layer.split()[3]
    grown = alpha.filter(ImageFilter.MaxFilter(k * 2 + 1))
    ring = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    ring.paste(color, (0, 0), grown)
    ring.alpha_composite(layer)
    return ring


def glow(layer, color, radius, strength=1.0):
    alpha = layer.split()[3].filter(ImageFilter.GaussianBlur(radius))
    halo = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    tint = Image.new("RGBA", layer.size, (color[0], color[1], color[2], int(255 * strength)))
    halo.paste(tint, (0, 0), alpha)
    halo.alpha_composite(layer)
    return halo


def star4(size, color, cx, cy, r_long, r_short, rot=0.0):
    """Four point sparkle as a mask-drawable polygon."""
    pts = []
    for i in range(8):
        a = rot + i * math.pi / 4
        r = r_long if i % 2 == 0 else r_short
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    return pts


# ------------------------------------------------------------------- santa hat

def draw_santa_hat(w, h, palette, name, gift=False, sparkles=False):
    img = canvas(w, h)
    W, H = w * SS, h * SS
    fur_light = palette.get("fur_light", (255, 255, 255, 255))
    fur_dark = palette.get("fur_dark", (208, 210, 224, 255))

    body_pts = (
        bezier((0.20, 0.78), (0.17, 0.50), (0.52, 0.26), (0.845, 0.255), 96)
        + bezier((0.845, 0.255), (0.96, 0.42), (0.93, 0.60), (0.815, 0.78), 96)
        + [(0.50, 0.83), (0.20, 0.78)]
    )
    body_mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(body_mask).polygon(S(body_pts, W, H), fill=255)
    body_mask = body_mask.filter(ImageFilter.GaussianBlur(1.2))

    grad = vgrad((W, H), palette["light"], palette["dark"])
    body = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    body.paste(grad, (0, 0), body_mask)

    # shading fold along the cone (clipped to the hat body)
    fold = Image.new("L", (W, H), 0)
    fold_pts = bezier((0.31, 0.79), (0.28, 0.55), (0.58, 0.34), (0.82, 0.30), 60)
    ImageDraw.Draw(fold).line(S(fold_pts, W, H), fill=90, width=int(10 * SS / 2))
    fold = fold.filter(ImageFilter.GaussianBlur(6 * SS))
    fold = ImageChops.multiply(fold, body_mask)
    shade = Image.new("RGBA", (W, H), palette["shade"])
    body.paste(shade, (0, 0), fold)

    # specular highlight (clipped to the hat body)
    hi = Image.new("L", (W, H), 0)
    ImageDraw.Draw(hi).ellipse(
        [0.24 * W, 0.42 * H, 0.52 * W, 0.72 * H], fill=95
    )
    hi = hi.filter(ImageFilter.GaussianBlur(22 * SS))
    hi = ImageChops.multiply(hi, body_mask)
    body.paste(Image.new("RGBA", (W, H), (255, 255, 255, 255)), (0, 0), hi)

    img.alpha_composite(body)

    # pompom at the tip
    pom = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pom_mask = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(pom_mask)
    cx, cy, r = 0.868 * W, 0.245 * H, 0.108 * W
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    for a in range(0, 360, 40):
        bx = cx + math.cos(math.radians(a)) * r * 0.72
        by = cy + math.sin(math.radians(a)) * r * 0.72
        rr = r * 0.42
        d.ellipse([bx - rr, by - rr, bx + rr, by + rr], fill=255)
    pom_grad = vgrad((W, H), fur_light, fur_dark)
    pom.paste(pom_grad, (0, 0), pom_mask)
    img.alpha_composite(pom)

    # fur band
    band = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    band_mask = Image.new("L", (W, H), 0)
    bd = ImageDraw.Draw(band_mask)
    x0, x1 = 0.115 * W, 0.895 * W
    y0, y1 = 0.695 * H, 0.845 * H
    bd.rounded_rectangle([x0, y0, x1, y1], radius=0.062 * W, fill=255)
    for i in range(9):
        px = lerp(x0 + 0.03 * W, x1 - 0.03 * W, i / 8)
        rr = (0.038 if i % 2 == 0 else 0.028) * W
        bd.ellipse([px - rr, y0 - rr * 0.6, px + rr, y1 + rr * 0.6], fill=255)
    band_grad = vgrad((W, H), fur_light, fur_dark)
    band.paste(band_grad, (0, 0), band_mask)
    img.alpha_composite(band)

    if gift:
        gx, gy, gw, gh = 0.06 * W, 0.60 * H, 0.34 * W, 0.26 * H
        box = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        bm = Image.new("L", (W, H), 0)
        ImageDraw.Draw(bm).rounded_rectangle([gx, gy, gx + gw, gy + gh], radius=0.03 * W, fill=255)
        box.paste(vgrad((W, H), (250, 78, 82, 255), (176, 22, 34, 255)), (0, 0), bm)
        ribbon = Image.new("L", (W, H), 0)
        rd = ImageDraw.Draw(ribbon)
        rd.rectangle([gx + gw * 0.40, gy, gx + gw * 0.58, gy + gh], fill=255)
        rd.rectangle([gx, gy + gh * 0.40, gx + gw, gy + gh * 0.57], fill=255)
        box.paste(Image.new("RGBA", (W, H), (255, 226, 150, 255)), (0, 0), ribbon)
        bow = Image.new("L", (W, H), 0)
        bdw = ImageDraw.Draw(bow)
        bdw.ellipse([gx + gw * 0.14, gy - gh * 0.20, gx + gw * 0.48, gy + gh * 0.12], fill=255)
        bdw.ellipse([gx + gw * 0.52, gy - gh * 0.20, gx + gw * 0.86, gy + gh * 0.12], fill=255)
        box.paste(Image.new("RGBA", (W, H), (255, 210, 110, 255)), (0, 0), bow)
        img.alpha_composite(box)

    if sparkles:
        sp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sd = ImageDraw.Draw(sp)
        for (sx, sy, rl, rs, rot) in [
            (0.14, 0.24, 0.085, 0.026, 0.0),
            (0.30, 0.13, 0.055, 0.018, 0.2),
            (0.66, 0.11, 0.070, 0.022, 0.1),
            (0.93, 0.62, 0.055, 0.018, 0.0),
            (0.10, 0.86, 0.045, 0.015, 0.0),
        ]:
            sd.polygon(star4(W, None, sx * W, sy * H, rl * W, rs * W, rot), fill=(255, 252, 226, 255))
        sp = glow(sp, (255, 226, 140), 10 * SS, 0.9)
        img.alpha_composite(sp)

    img = outline(img, DARK, k=6)
    img = glow(img, (255, 214, 120), 9 * SS, 0.22)
    return save(img, w, h, name)


# ------------------------------------------------------------------- bad bomb

def draw_bad_bomb(w, h):
    img = canvas(w, h)
    W, H = w * SS, h * SS

    # monster head
    head = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    hm = Image.new("L", (W, H), 0)
    hd = ImageDraw.Draw(hm)
    hd.ellipse([0.13 * W, 0.20 * H, 0.79 * W, 0.80 * H], fill=255)
    for side in (-1, 1):
        cx = 0.46 * W + side * 0.27 * W
        hd.ellipse([cx - 0.10 * W, 0.16 * H, cx + 0.10 * W, 0.38 * H], fill=255)
    head.paste(vgrad((W, H), (126, 224, 108, 255), (38, 148, 66, 255)), (0, 0), hm)

    # belly highlight
    hi = Image.new("L", (W, H), 0)
    ImageDraw.Draw(hi).ellipse([0.22 * W, 0.28 * H, 0.52 * W, 0.60 * H], fill=70)
    hi = hi.filter(ImageFilter.GaussianBlur(14 * SS))
    head.paste(Image.new("RGBA", (W, H), (255, 255, 255, 255)), (0, 0), hi)

    # eyes
    ed = ImageDraw.Draw(head)
    for side in (-1, 1):
        cx = 0.46 * W + side * 0.115 * W
        cy = 0.415 * H
        rx, ry = 0.062 * W, 0.075 * H
        ed.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(255, 255, 255, 255))
        prx, pry = 0.030 * W, 0.036 * H
        px = cx + side * 0.012 * W
        ed.ellipse([px - prx, cy - pry, px + prx, cy + pry], fill=(24, 20, 30, 255))
        ed.ellipse([px - prx * 0.4, cy - pry * 0.75, px + prx * 0.15, cy - pry * 0.2], fill=(255, 255, 255, 255))
        # angry brow
        bx0 = cx - 0.075 * W
        bx1 = cx + 0.075 * W
        by = cy - 0.115 * H
        ed.polygon(
            [(bx0, by + side * 0.028 * H), (bx1, by - side * 0.018 * H),
             (bx1, by - side * 0.018 * H + 0.030 * H), (bx0, by + side * 0.028 * H + 0.030 * H)],
            fill=(26, 44, 24, 255),
        )

    # jagged grin
    mouth = []
    mx, my = 0.32 * W, 0.60 * H
    mw, mh = 0.30 * W, 0.10 * H
    for i in range(7):
        mouth.append((mx + mw * i / 6, my + (mh * 0.35 if i % 2 else 0)))
    for i in range(7):
        mouth.append((mx + mw * (1 - i / 6), my + mh))
    ed.polygon(mouth, fill=(46, 16, 26, 255))
    for i in range(3):
        tx = mx + mw * (0.12 + 0.28 * i)
        ed.polygon([(tx, my + mh * 0.34), (tx + mw * 0.10, my + mh * 0.34),
                    (tx + mw * 0.05, my + mh * 0.86)], fill=(255, 255, 255, 255))

    img.alpha_composite(head)

    # lump of coal (bad item with no weapon imagery)
    coal = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cm = Image.new("L", (W, H), 0)
    cx, cy, cr = 0.775 * W, 0.665 * H, 0.16 * W
    poly = []
    for i in range(12):
        ang = i / 12 * 2 * math.pi
        rr = cr * (1 + 0.10 * math.sin(3 * ang) + 0.07 * math.sin(5 * ang + 1.3))
        poly.append((cx + math.cos(ang) * rr, cy + math.sin(ang) * rr))
    ImageDraw.Draw(cm).polygon(poly, fill=255)
    coal.paste(radial((W, H), (84, 82, 96, 255), (18, 16, 26, 255), 0.53, 0.46, 0.55), (0, 0), cm)
    # glossy facets
    for k, (ox, oy, rw, rh) in enumerate([(-0.30, -0.38, 0.20, 0.14), (0.12, -0.18, 0.16, 0.11), (-0.06, 0.30, 0.18, 0.12)]):
        hlt = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(hlt).ellipse([cx + ox * cr - rw * cr, cy + oy * cr - rh * cr,
                                     cx + ox * cr + rw * cr, cy + oy * cr + rh * cr],
                                    fill=(255, 255, 255, 92 - k * 18))
        hlt = hlt.filter(ImageFilter.GaussianBlur(3 * SS))
        coal.alpha_composite(hlt)
    img.alpha_composite(coal)

    img = outline(img, DARK, k=6)
    img = glow(img, (120, 255, 140), 8 * SS, 0.18)
    return save(img, w, h, "BadBomb")


# ----------------------------------------------------------------- other props

def draw_ring(w, h):
    img = canvas(w, h)
    W, H = w * SS, h * SS
    mask = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(mask)
    outer = 0.44 * W
    inner = 0.355 * W
    d.ellipse([0.5 * W - outer, 0.5 * H - outer, 0.5 * W + outer, 0.5 * H + outer], fill=255)
    d.ellipse([0.5 * W - inner, 0.5 * H - inner, 0.5 * W + inner, 0.5 * H + inner], fill=0)
    ring = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ring.paste(radial((W, H), (255, 246, 198, 255), (236, 158, 32, 255), 0.5, 0.5, 0.6), (0, 0), mask)
    ring = glow(ring, (255, 206, 96), 16 * SS, 0.85)
    img.alpha_composite(ring)
    # sparkle accents
    sp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sp)
    for a in (35, 125, 215, 305):
        cx = 0.5 * W + math.cos(math.radians(a)) * 0.40 * W
        cy = 0.5 * H + math.sin(math.radians(a)) * 0.40 * H
        sd.polygon(star4(W, None, cx, cy, 0.055 * W, 0.018 * W, math.radians(a)), fill=(255, 252, 232, 255))
    sp = glow(sp, (255, 232, 150), 8 * SS, 0.8)
    img.alpha_composite(sp)
    return save(img, w, h, "ForeheadRing")


def draw_snowflake(w, h):
    img = canvas(w, h)
    W, H = w * SS, h * SS
    d = ImageDraw.Draw(img)
    cx, cy = W / 2, H / 2
    r = 0.40 * W
    for i in range(6):
        a = math.radians(i * 60)
        x1 = cx + math.cos(a) * r
        y1 = cy + math.sin(a) * r
        d.line([cx, cy, x1, y1], fill=(255, 255, 255, 255), width=int(0.045 * W))
        for t, bl in ((0.55, 0.20), (0.76, 0.14)):
            bx = cx + math.cos(a) * r * t
            by = cy + math.sin(a) * r * t
            for s in (-1, 1):
                aa = a + s * math.radians(45)
                d.line([bx, by, bx + math.cos(aa) * r * bl, by + math.sin(aa) * r * bl],
                       fill=(255, 255, 255, 255), width=int(0.032 * W))
    d.ellipse([cx - 0.06 * W, cy - 0.06 * W, cx + 0.06 * W, cy + 0.06 * W], fill=(255, 255, 255, 255))
    img = glow(img, (226, 244, 255), 6 * SS, 0.55)
    return save(img, w, h, "Snowflake")


def draw_star_burst(w, h):
    img = canvas(w, h)
    W, H = w * SS, h * SS
    core = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(core)
    cd.polygon(star4(W, None, W / 2, H / 2, 0.47 * W, 0.075 * W), fill=(255, 190, 48, 255))
    cd.polygon(star4(W, None, W / 2, H / 2, 0.40 * W, 0.052 * W, math.pi / 4), fill=(255, 220, 110, 255))
    cd.polygon(star4(W, None, W / 2, H / 2, 0.26 * W, 0.05 * W, math.pi / 4), fill=(255, 252, 222, 255))
    core = glow(core, (255, 196, 64), 14 * SS, 0.75)
    img.alpha_composite(core)
    sparks = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sparks)
    for a, rr, sz in ((0, 0.40, 0.06), (70, 0.42, 0.045), (140, 0.38, 0.055),
                      (200, 0.45, 0.04), (265, 0.39, 0.05), (320, 0.43, 0.045)):
        cx = W / 2 + math.cos(math.radians(a)) * rr * W
        cy = H / 2 + math.sin(math.radians(a)) * rr * H
        sd.polygon(star4(W, None, cx, cy, sz * W, sz * 0.32 * W, math.radians(a)),
                   fill=(255, 210, 92, 255))
    sparks = glow(sparks, (255, 176, 40), 9 * SS, 0.9)
    img.alpha_composite(sparks)
    return save(img, w, h, "StarBurst")


def rounded_panel(w, h, fill_top, fill_bottom, border, radius, name,
                  border_w=0.018, sheen=True, snowflakes=False):
    img = canvas(w, h)
    W, H = w * SS, h * SS
    m = Image.new("L", (W, H), 0)
    r = radius * W
    ImageDraw.Draw(m).rounded_rectangle([0, 0, W - 1, H - 1], radius=r, fill=255)
    body = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    body.paste(vgrad((W, H), fill_top, fill_bottom), (0, 0), m)

    if sheen:
        sh = Image.new("L", (W, H), 0)
        ImageDraw.Draw(sh).ellipse([-0.2 * W, -0.55 * H, 1.2 * W, 0.42 * H], fill=48)
        sh = sh.filter(ImageFilter.GaussianBlur(10 * SS))
        body.paste(Image.new("RGBA", (W, H), (255, 255, 255, 255)), (0, 0), sh)

    if snowflakes:
        fl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        fd = ImageDraw.Draw(fl)
        for (fx, fy, s) in [(0.10, 0.07, 0.035), (0.30, 0.045, 0.022), (0.62, 0.05, 0.028),
                            (0.86, 0.085, 0.030), (0.14, 0.30, 0.018), (0.88, 0.42, 0.020)]:
            cx, cy, rr = fx * W, fy * H, s * W
            for i in range(6):
                a = math.radians(i * 60)
                fd.line([cx, cy, cx + math.cos(a) * rr, cy + math.sin(a) * rr],
                        fill=(255, 236, 180, 190), width=int(0.008 * W))
        body.alpha_composite(fl)

    # border ring drawn as outline of the rounded rect
    bm = Image.new("L", (W, H), 0)
    bd = ImageDraw.Draw(bm)
    bw = int(border_w * W)
    bd.rounded_rectangle([bw // 2, bw // 2, W - 1 - bw // 2, H - 1 - bw // 2],
                         radius=r, outline=255, width=bw)
    body.paste(Image.new("RGBA", (W, H), border), (0, 0), bm)
    img.alpha_composite(body)
    return save(img, w, h, name)


def draw_miss_icon(w, h):
    img = canvas(w, h)
    W, H = w * SS, h * SS
    cx, cy = W / 2, H / 2
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        r = 0.46 * W if i % 2 == 0 else 0.21 * W
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).polygon(pts, fill=255)
    body = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    body.paste(radial((W, H), (255, 240, 176, 255), (232, 154, 26, 255), 0.42, 0.34, 0.7), (0, 0), mask)
    img.alpha_composite(body)
    img = outline(img, (120, 62, 10, 255), k=4)
    img = glow(img, (255, 206, 96), 7 * SS, 0.5)
    return save(img, w, h, "MissStar")


def draw_white(w, h, name="White"):
    img = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    return save(img, w, h, name)


if __name__ == "__main__":
    RED = {"light": (248, 84, 78, 255), "dark": (150, 16, 26, 255), "shade": (110, 8, 18, 190)}
    GOLD = {"light": (255, 232, 148, 255), "dark": (192, 120, 18, 255), "shade": (140, 84, 6, 190),
            "fur_light": (255, 246, 206, 255), "fur_dark": (232, 188, 104, 255)}

    draw_santa_hat(512, 512, RED, "CapRed")
    draw_santa_hat(512, 512, GOLD, "CapGold", sparkles=True)
    draw_bad_bomb(512, 512)
    draw_ring(384, 384)
    draw_snowflake(128, 128)
    draw_star_burst(384, 384)
    rounded_panel(512, 168, (120, 20, 30, 220), (70, 8, 16, 220), (255, 206, 110, 235), 0.42, "HudPlate", snowflakes=False)
    rounded_panel(620, 900, (108, 14, 26, 214), (46, 4, 12, 224), (255, 210, 120, 235), 0.055, "ResultCard", snowflakes=True)
    rounded_panel(480, 160, (238, 66, 64, 255), (176, 18, 30, 255), (255, 216, 128, 255), 0.40, "RetryButton")
    draw_miss_icon(128, 128)
    draw_white(32, 32)
