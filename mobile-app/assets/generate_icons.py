"""
Generate Khidmat AI app icons + splash images.
Creates: icon.png, adaptive-icon.png, splash.png, favicon.png
Run: python generate_icons.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

OUT_DIR = Path(__file__).parent

# Brand colors — Khidmat 2026
BRAND_PURPLE = (0x3e, 0x00, 0x3f)  # #3e003f deep aubergine
BRAND_PURPLE_HI = (0x5a, 0x1f, 0x5c)  # lighter purple for gradient end
BRAND_ORANGE = (0xf0, 0x54, 0x23)  # #f05423 warm orange accent
BG_DARK = (0x3e, 0x00, 0x3f)       # splash bg = brand purple
BG_LIGHT = (0xf5, 0xf5, 0xf5)      # #f5f5f5 off-white


def gradient_circle(size: int, colors: list) -> Image.Image:
    """Make a radial-ish gradient circle (mimics LinearGradient look)."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    steps = 200
    for i in range(steps):
        t = i / steps
        # interpolate top-left to bottom-right (linear)
        r = int(colors[0][0] + (colors[1][0] - colors[0][0]) * t)
        g = int(colors[0][1] + (colors[1][1] - colors[0][1]) * t)
        b = int(colors[0][2] + (colors[1][2] - colors[0][2]) * t)
        y0 = int((i / steps) * size)
        y1 = int(((i + 1) / steps) * size) + 1
        draw.rectangle([(0, y0), (size, y1)], fill=(r, g, b))
    # Mask to circle with rounded corners
    mask = Image.new("L", (size, size), 0)
    mdraw = ImageDraw.Draw(mask)
    radius = int(size * 0.22)  # iOS app-icon rounding
    mdraw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def draw_sparkle(img: Image.Image, center: tuple, size: int, color=(255, 255, 255, 255)):
    """Draw a 4-point star (sparkle) at center with given size."""
    cx, cy = center
    draw = ImageDraw.Draw(img)
    # Vertical bar
    w = size * 0.18
    draw.ellipse([(cx - w/2, cy - size/2), (cx + w/2, cy + size/2)], fill=color)
    # Horizontal bar
    draw.ellipse([(cx - size/2, cy - w/2), (cx + size/2, cy + w/2)], fill=color)
    # Diagonals (smaller)
    d = size * 0.55
    dw = w * 0.7
    for angle in (45, 135):
        # Just draw two extra dots offset diagonally for visual sparkle
        import math
        ang = math.radians(angle)
        ox = math.cos(ang) * d / 3
        oy = math.sin(ang) * d / 3
        draw.ellipse([(cx + ox - dw/2, cy + oy - dw/2), (cx + ox + dw/2, cy + oy + dw/2)], fill=color)
        draw.ellipse([(cx - ox - dw/2, cy - oy - dw/2), (cx - ox + dw/2, cy - oy + dw/2)], fill=color)


def make_icon(size: int) -> Image.Image:
    """Square purple gradient icon with brand logo (logo.png) overlaid."""
    bg = gradient_circle(size, [BRAND_PURPLE, BRAND_PURPLE_HI])
    # Overlay the brand logo if available
    logo_path = OUT_DIR / "logo.png"
    if logo_path.exists():
        try:
            logo = Image.open(logo_path).convert("RGBA")
            # Process pixels: (a) make near-white/grey bg transparent, (b) recolor purple to white
            data = list(logo.getdata())
            new_data = []
            for px in data:
                r, g, b, a = px
                # Knock out light/white backgrounds (anything that is grey > 200)
                if r > 200 and g > 200 and b > 200:
                    new_data.append((0, 0, 0, 0))
                # Brand purple strokes → white (so they show on purple bg)
                elif r < 100 and g < 40 and b < 100:
                    new_data.append((255, 255, 255, 255))
                else:
                    new_data.append(px)
            logo.putdata(new_data)
            target = int(size * 0.72)
            logo = logo.resize((target, target), Image.LANCZOS)
            offset = (size - target) // 2
            bg.paste(logo, (offset, offset), logo)
            return bg
        except Exception as e:
            print(f"WARN: failed to overlay logo: {e}")
    # Fallback: orange sparkle
    sparkle_size = int(size * 0.55)
    draw_sparkle(bg, (size // 2, size // 2 - int(size * 0.04)), sparkle_size, color=(*BRAND_ORANGE, 255))
    return bg


def make_adaptive(size: int) -> Image.Image:
    """Android adaptive — foreground only, transparent edges (safe zone 66% center)."""
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    safe = int(size * 0.66)
    inner = make_icon(safe)
    offset = (size - safe) // 2
    bg.paste(inner, (offset, offset), inner)
    return bg


def make_splash(width: int, height: int) -> Image.Image:
    """Dark splash with centered icon + 'Khidmat AI' wordmark."""
    img = Image.new("RGB", (width, height), BG_DARK)
    icon_size = int(min(width, height) * 0.30)
    icon = make_icon(icon_size)
    cx = (width - icon_size) // 2
    cy = (height - icon_size) // 2 - int(height * 0.05)
    img.paste(icon, (cx, cy), icon)
    # Add subtle glow ring
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    ring_size = int(icon_size * 1.4)
    gdraw.ellipse(
        [(width // 2 - ring_size // 2, cy + icon_size // 2 - ring_size // 2),
         (width // 2 + ring_size // 2, cy + icon_size // 2 + ring_size // 2)],
        outline=(*BRAND_ORANGE, 80),
        width=2,
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=8))
    img.paste(glow, (0, 0), glow)
    # Repaste icon on top of glow
    img.paste(icon, (cx, cy), icon)
    return img


def make_favicon() -> Image.Image:
    return make_icon(48)


def make_logo_white(size: int = 1024) -> Image.Image:
    """White-line variant of the brand logo for use on purple tile backgrounds."""
    src = OUT_DIR / "logo.png"
    if not src.exists():
        return Image.new("RGBA", (size, size), (0, 0, 0, 0))
    logo = Image.open(src).convert("RGBA")
    data = list(logo.getdata())
    new_data = []
    for px in data:
        r, g, b, a = px
        if r > 200 and g > 200 and b > 200:
            new_data.append((0, 0, 0, 0))  # light bg → transparent
        elif r < 100 and g < 40 and b < 100:
            new_data.append((255, 255, 255, 255))  # purple strokes → white
        else:
            new_data.append(px)  # keep orange dots
    logo.putdata(new_data)
    return logo.resize((size, size), Image.LANCZOS)


def main():
    # iOS / Universal icon
    icon = make_icon(1024)
    icon.save(OUT_DIR / "icon.png", "PNG", optimize=True)
    print("OK icon.png (1024×1024)")

    # White-line logo variant for in-app tile usage
    logo_white = make_logo_white(1024)
    logo_white.save(OUT_DIR / "logo-white.png", "PNG", optimize=True)
    print("OK logo-white.png (1024×1024)")

    # Android adaptive foreground
    adaptive = make_adaptive(1024)
    adaptive.save(OUT_DIR / "adaptive-icon.png", "PNG", optimize=True)
    print("OK adaptive-icon.png (1024×1024)")

    # Splash
    splash = make_splash(1284, 2778)
    splash.save(OUT_DIR / "splash.png", "PNG", optimize=True)
    print("OK splash.png (1284×2778)")

    # Favicon for web
    favicon = make_favicon()
    favicon.save(OUT_DIR / "favicon.png", "PNG", optimize=True)
    print("OK favicon.png (48×48)")


if __name__ == "__main__":
    main()
