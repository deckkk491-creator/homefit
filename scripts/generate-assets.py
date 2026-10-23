"""Генерирует иконку и сплэш HomeFit (без сторонних ассетов).

Запуск: python3 scripts/generate-assets.py
Требуется Pillow (pip install pillow).
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "images"
OUT.mkdir(parents=True, exist_ok=True)

INK = (14, 15, 12)
LIME = (200, 245, 60)


def dumbbell(draw: ImageDraw.ImageDraw, cx: float, cy: float, s: float, color) -> None:
    """Рисует стилизованную гантель, s — масштаб (ширина ~ s)."""
    bar_h = s * 0.075
    draw.rounded_rectangle(
        (cx - s * 0.36, cy - bar_h / 2, cx + s * 0.36, cy + bar_h / 2),
        radius=bar_h / 2,
        fill=color,
    )
    for side in (-1, 1):
        # большой диск
        x = cx + side * s * 0.25
        w, h = s * 0.11, s * 0.52
        draw.rounded_rectangle((x - w / 2, cy - h / 2, x + w / 2, cy + h / 2), radius=w * 0.38, fill=color)
        # малый диск
        x2 = cx + side * s * 0.385
        w2, h2 = s * 0.08, s * 0.34
        draw.rounded_rectangle((x2 - w2 / 2, cy - h2 / 2, x2 + w2 / 2, cy + h2 / 2), radius=w2 * 0.38, fill=color)


def icon(size: int = 1024) -> Image.Image:
    img = Image.new("RGB", (size, size), INK)
    d = ImageDraw.Draw(img)
    # мягкий круг-акцент
    r = size * 0.36
    d.ellipse((size / 2 - r, size / 2 - r, size / 2 + r, size / 2 + r), fill=LIME)
    dumbbell(d, size / 2, size / 2, size * 0.56, INK)
    return img


def splash(size: int = 1024) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = size * 0.46
    d.ellipse((size / 2 - r, size / 2 - r, size / 2 + r, size / 2 + r), fill=LIME + (255,))
    dumbbell(d, size / 2, size / 2, size * 0.72, INK + (255,))
    return img


def adaptive_foreground(size: int = 1024) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = size * 0.27
    d.ellipse((size / 2 - r, size / 2 - r, size / 2 + r, size / 2 + r), fill=LIME + (255,))
    dumbbell(d, size / 2, size / 2, size * 0.42, INK + (255,))
    return img


if __name__ == "__main__":
    icon().save(OUT / "icon.png")
    splash().save(OUT / "splash-icon.png")
    adaptive_foreground().save(OUT / "android-icon-foreground.png")
    icon(48).save(OUT / "favicon.png")
    print("OK ->", OUT)
