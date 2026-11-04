"""Assemble a character's 128x128 sheet: 8 columns x 4 rows of 16x32.

Columns follow movement.js POSE_COLUMN, plus two expression frames:
  0 stand  1 walkA  2 walkB  3 runStand  4 runA  5 runB  6 blink  7 alert
Rows: 0 down, 1 up, 2 left, 3 right (right = mirror of left).

Motion matches the engine's existing sheets: walk frames bob 1px (head and
torso drop, feet stay planted); run frames lean, so the head dips 2px and
the shoulders 1px, and in side view the head also leads by 1px.
"""
from PIL import Image, ImageOps

from .bodies import BODIES
from .compose import H, W, blink, despeckle, outline, resolve, shade, stack

COLUMNS = ["stand", "walkA", "walkB", "runStand", "runA", "runB", "blink", "alert"]
ROWS = ["down", "up", "left", "right"]
SHEET_W, SHEET_H = W * len(COLUMNS), H * len(ROWS)

# which body template, and which motion transform, each column uses
_BODY = {"stand": "stand", "walkA": "stepA", "walkB": "stepB", "runStand": "stand",
         "runA": "stepA", "runB": "stepB", "blink": "stand", "alert": "alert"}
CHIN_ROW, TORSO_ROW = 21, 24  # rows that can be dropped without losing a feature
FOREHEAD_ROW = 13
GROWN_ROWS = (25, 28)  # waist and shin, repeated on everyone but children


def _drop(canvas, rows):
    """Remove `rows` and pad the top: everything above them sinks."""
    kept = [r for i, r in enumerate(canvas) if i not in rows]
    return [["."] * W for _ in rows] + kept


def _lead(canvas, below):
    """Shift rows above `below` one pixel toward the facing (left)."""
    return [r[1:] + ["."] if i < below else r for i, r in enumerate(canvas)]


def _widen(canvas, rows):
    """Push each half of `rows` out one pixel: a broader torso."""
    return [r[1:8] + [r[7], r[8]] + r[8:15] if i in rows else r for i, r in enumerate(canvas)]


def _slim_head(canvas, direction):
    """Take two columns and a forehead row off the head, so heads stop dwarfing
    bodies. Front and back trim each side, keeping columns 4-11 where the eyes
    are. Side views trim the back of the head: the face stays whole."""
    def trim(r):
        if direction == "left":
            return r[0:9] + r[10:12] + r[13:16] + [".", "."]
        return ["."] + r[0:3] + r[4:12] + r[13:16] + ["."]

    return _drop([trim(r) if y <= CHIN_ROW else r for y, r in enumerate(canvas)], {FOREHEAD_ROW})


def _stretch(canvas, rows):
    """Repeat `rows`, pushing everything above them up: a longer body, feet fixed."""
    out = []
    for y, r in enumerate(canvas):
        out.append(r)
        if y in rows:
            out.append(list(r))
    return out[len(rows):]


def _build(canvas, build, direction):
    """Reshape an adult frame. Rows drop out below the chin, so feet stay put."""
    if build == "child":
        return _drop(canvas, {TORSO_ROW + 1, TORSO_ROW + 3})
    if build == "heavy":
        return _widen(canvas, range(CHIN_ROW + 1, TORSO_ROW + 4))
    if build == "elder":
        canvas = _lead(canvas, CHIN_ROW + 1) if direction == "left" else canvas
        return _drop(canvas, {TORSO_ROW})
    return canvas


def frame_keys(char, direction, column):
    """Shaded key grid ((material, tone) / "outline" / "white") for one frame."""
    body, arms_up = BODIES[char["body"]][direction][_BODY[column]]
    head = char["heads"][direction]
    if column == "alert":
        head = char.get("alert_heads", {}).get(direction, head)
    head = head if isinstance(head, list) else [head]
    under = char.get("under", {}).get(direction, [])
    over = char.get("over", {}).get(direction, [])
    # body, things behind the head, head, things in front, raised arms last
    canvas = stack(body, *under, *head, *over, arms_up)
    if column == "blink":
        canvas = blink(canvas)
    canvas = _slim_head(canvas, direction)
    canvas = _build(canvas, char.get("build"), direction)
    if column in ("walkA", "walkB"):
        canvas = _drop(canvas, {TORSO_ROW})
    elif column.startswith("run"):
        if direction == "left":
            canvas = _lead(canvas, CHIN_ROW + 1)
        canvas = _drop(canvas, {CHIN_ROW, TORSO_ROW})
    if char.get("build") != "child":
        canvas = _stretch(canvas, GROWN_ROWS[1:] if char.get("build") == "heavy" else GROWN_ROWS)
    return despeckle(shade(outline(canvas)))


def frame(char, direction, column):
    return resolve(frame_keys(char, direction, column), char["mats"])


def build_sheet(char):
    sheet = Image.new("RGBA", (SHEET_W, SHEET_H), (0, 0, 0, 0))
    for c, column in enumerate(COLUMNS):
        for r, direction in enumerate(ROWS[:3]):
            sheet.paste(frame(char, direction, column), (c * W, r * H))
        left = sheet.crop((c * W, 2 * H, (c + 1) * W, 3 * H))
        sheet.paste(ImageOps.mirror(left), (c * W, 3 * H))
    return sheet
