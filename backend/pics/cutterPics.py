from PIL import Image
import numpy as np

img = Image.open("ВсеЗубрикиБезФона.png").convert("RGBA")
w, h = img.size

# Сетка 3x2 — координаты центров кругов (подбери под свой файл)
cols, rows = 3, 2
cell_w, cell_h = w // cols, h // rows

names = [
    "zubrik_traveler", "zubrik_artist",   "zubrik_musician",
    "zubrik_historik", "zubrik_muzikant", "zubrik_gourmet",
]

for i, name in enumerate(names):
    row, col = divmod(i, cols)

    # Вырезаем ячейку
    x0, y0 = col * cell_w, row * cell_h
    cell = img.crop((x0, y0, x0 + cell_w, y0 + cell_h))

    # Создаём круглую маску
    cw, ch = cell.size
    cx, cy = cw // 2, ch // 2
    radius = min(cx, cy) - 10  # -10 отступ от края

    mask = Image.new("L", (cw, ch), 0)
    arr = np.zeros((ch, cw), dtype=np.uint8)
    Y, X = np.ogrid[:ch, :cw]
    circle = (X - cx)**2 + (Y - cy)**2 <= radius**2
    arr[circle] = 255
    mask = Image.fromarray(arr)

    # Применяем маску к альфа-каналу
    r, g, b, a = cell.split()
    a = Image.fromarray(np.minimum(np.array(a), np.array(mask)))
    result = Image.merge("RGBA", (r, g, b, a))

    result.save(f"{name}.png")
    print(f"Saved {name}.png")