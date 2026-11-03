"""Assemble a character's 80x128 sheet: 5 columns x 4 rows of 16x32.

Columns: 0 stand, 1 step A, 2 step B, 3 blink, 4 alert ("spotted you").
Rows:    0 down, 1 up, 2 left, 3 right (right = mirror of left).
The renderer picks column = actorFrame(a) and row = facing.
"""
from PIL import Image, ImageOps

from .bodies import BODIES
from .compose import H, W, render

COLUMNS = ["stand", "stepA", "stepB", "blink", "alert"]
ROWS = ["down", "up", "left", "right"]
SHEET_W, SHEET_H = W * len(COLUMNS), H * len(ROWS)


def frame(char, direction, column):
    body_frame = "stand" if column == "blink" else column
    body, overlay = BODIES[char["body"]][direction][body_frame]
    head = char["heads"][direction]
    if column == "alert":
        head = char.get("alert_heads", {}).get(direction, head)
    # body under head; raised arms go over the head
    return render([body, head, overlay], char["mats"], closed_eyes=(column == "blink"))


def build_sheet(char):
    sheet = Image.new("RGBA", (SHEET_W, SHEET_H), (0, 0, 0, 0))
    for c, column in enumerate(COLUMNS):
        for r, direction in enumerate(ROWS[:3]):
            sheet.paste(frame(char, direction, column), (c * W, r * H))
        left = sheet.crop((c * W, 2 * H, (c + 1) * W, 3 * H))
        sheet.paste(ImageOps.mirror(left), (c * W, 3 * H))
    return sheet
