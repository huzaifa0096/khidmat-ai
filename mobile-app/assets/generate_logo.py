"""
Generate a placeholder Khidmat logo PNG using brand colors.
This serves until the real brand calligraphy is dropped in as logo.png.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import os
import platform

OUT = Path(__file__).parent / "logo.png"
SIZE = 1024
PADDING = 80

BRAND_PURPLE = (0x3e, 0x00, 0x3f, 255)
BRAND_ORANGE = (0xf0, 0x54, 0x23, 255)
BG = (0, 0, 0, 0)  # transparent


def find_urdu_font(target_size: int):
    """Try common Windows + macOS Urdu/Arabic fonts."""
    candidates_windows = [
        r"C:\Windows\Fonts\NotoNastaliqUrdu-Regular.ttf",
        r"C:\Windows\Fonts\Jameel Noori Nastaleeq.ttf",
        r"C:\Windows\Fonts\NotoNaskhArabic-Regular.ttf",
        r"C:\Windows\Fonts\Arial.ttf",
        r"C:\Windows\Fonts\segoeui.ttf",
    ]
    for p in candidates_windows:
        if os.path.isfile(p):
            try:
                return ImageFont.truetype(p, target_size)
            except Exception:
                pass
    return ImageFont.load_default()


def shape_arabic(text: str) -> str:
    try:
        import arabic_reshaper
        from bidi.algorithm import get_display
        return get_display(arabic_reshaper.reshape(text))
    except Exception:
        try:
            import arabic_reshaper
            return arabic_reshaper.reshape(text)[::-1]
        except Exception:
            return text[::-1]


def main():
    img = Image.new("RGBA", (SIZE, SIZE), BG)
    draw = ImageDraw.Draw(img)

    # 1. Big Urdu wordmark "خدمت" properly shaped + RTL-ordered
    font_big = find_urdu_font(620)
    text = shape_arabic("خدمت")
    try:
        bbox = draw.textbbox((0, 0), text, font=font_big)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        x = (SIZE - w) / 2 - bbox[0]
        y = (SIZE - h) / 2 - bbox[1] - 30
    except Exception:
        x, y = SIZE * 0.10, SIZE * 0.18

    draw.text((x, y), text, font=font_big, fill=BRAND_PURPLE)

    # 2. Three orange accent dots (mirrors the original logo's accent dots)
    cx = SIZE // 2
    by = int(SIZE * 0.80)
    r = 36
    for i, dx in enumerate([-90, 0, 90]):
        draw.ellipse(
            [(cx + dx - r, by - r), (cx + dx + r, by + r)],
            fill=BRAND_ORANGE,
        )

    img.save(OUT, "PNG", optimize=True)
    print(f"OK logo.png written -> {OUT}")


if __name__ == "__main__":
    main()
