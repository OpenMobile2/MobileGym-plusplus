from pathlib import Path
import re

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[5]
SOURCE = ROOT / "ctrip_images"
OUTPUT = ROOT / "docs" / "ctrip-replication" / "evidence-contact-sheets"
COLS = 6
ROWS = 5
CELL_W = 150
CELL_H = 310
THUMB_W = 138
THUMB_H = 276


def sort_key(path: Path) -> tuple[int, str]:
    numbers = re.findall(r"(\d+)", path.stem)
    return (int(numbers[-2]) if len(numbers) > 1 else 0, path.name)


def label_for(path: Path) -> str:
    numbers = re.findall(r"(\d+)", path.stem)
    tail = numbers[-2] if len(numbers) > 1 else path.stem
    prefix = "added/" if path.parent.name == "added" else ""
    return f"{prefix}{tail}"


OUTPUT.mkdir(parents=True, exist_ok=True)
files = sorted(
    [*SOURCE.rglob("*.jpg"), *SOURCE.rglob("*.jpeg"), *SOURCE.rglob("*.png")],
    key=sort_key,
)
font = ImageFont.load_default()
page_size = COLS * ROWS

for page_index in range((len(files) + page_size - 1) // page_size):
    canvas = Image.new("RGB", (COLS * CELL_W, ROWS * CELL_H), "#e5e7eb")
    draw = ImageDraw.Draw(canvas)
    batch = files[page_index * page_size : (page_index + 1) * page_size]
    for index, path in enumerate(batch):
        row, col = divmod(index, COLS)
        x = col * CELL_W + 6
        y = row * CELL_H + 6
        with Image.open(path) as source:
            thumb = source.convert("RGB")
            thumb.thumbnail((THUMB_W, THUMB_H), Image.Resampling.LANCZOS)
        frame = Image.new("RGB", (THUMB_W, THUMB_H), "white")
        frame.paste(
            thumb,
            ((THUMB_W - thumb.width) // 2, (THUMB_H - thumb.height) // 2),
        )
        canvas.paste(frame, (x, y))
        draw.text((x + 3, y + THUMB_H + 7), label_for(path), fill="#111827", font=font)
    out = OUTPUT / f"sheet-{page_index + 1}.jpg"
    canvas.save(out, quality=90, optimize=True)
    print(out)
