import glob
import os
import warnings
from typing import Optional

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.font_manager import FontProperties, findfont
from matplotlib.collections import LineCollection
from matplotlib.colors import LinearSegmentedColormap, to_rgb
from matplotlib.patches import Polygon


FIG_SIZE = (12, 12)
DPI = 320
SQUIRCLE_EXPONENT = 4
CANVAS_RADIUS = 1.0
SQUIRCLE_RADIUS = 0.85  # Slight inset so the shape does not touch the frame.
SQUARE_RADIUS = 0.75  # Visually similar size to squircle
PHI = (1 + 5**0.5) / 2
TEXT_X_OFFSET = 0.0
TEXT_Y_OFFSET = -0.124
OUTPUT_PATH = "./src/assets/logo.png"
ICON_OUTPUT_PATH = "./src/assets/logo_icon.png"
FONT_FAMILY = "HarmonyOS Sans"
FONT_WEIGHT = "black"
FONT_FILE_PATTERNS = [
    os.path.expanduser("~/Library/Fonts/HarmonyOS_Sans_Black.*"),
    "/Library/Fonts/HarmonyOS_Sans_Black.*",
    "/System/Library/Fonts/HarmonyOS_Sans_Black.*",
    "/System/Library/Fonts/Supplemental/HarmonyOS_Sans_Black.*",
]
CHARACTER = "R"
TEXT_FONT_SIZE = 400


def _generate_squircle_points(radius: float, exponent: float, samples: int = 4096) -> np.ndarray:
    t = np.linspace(0.0, 2.0 * np.pi, samples)
    cos_t = np.cos(t)
    sin_t = np.sin(t)
    x = radius * np.sign(cos_t) * np.abs(cos_t) ** (2.0 / exponent)
    y = radius * np.sign(sin_t) * np.abs(sin_t) ** (2.0 / exponent)
    return np.column_stack((x, y))


def _resolve_font_path() -> Optional[str]:
    for pattern in FONT_FILE_PATTERNS:
        for candidate in glob.glob(pattern):
            if os.path.isfile(candidate):
                return candidate
    return None


def _load_font(size: float) -> FontProperties:
    requested = FontProperties(family=FONT_FAMILY, weight=FONT_WEIGHT)
    try:
        font_path = findfont(requested, fallback_to_default=False)
        return FontProperties(fname=font_path, size=size)
    except ValueError:
        fallback = _resolve_font_path()
        if fallback:
            return FontProperties(fname=fallback, size=size)
        warnings.warn(
            "HarmonyOS Sans SC Black not found. Falling back to DejaVu Sans Bold.",
            stacklevel=2,
        )
        return FontProperties(family="DejaVu Sans", weight="bold", size=size)


def _create_metallic_gradient(ax, clip_path):
    # Create a diagonal gradient
    x = np.linspace(-CANVAS_RADIUS, CANVAS_RADIUS, 500)
    y = np.linspace(-CANVAS_RADIUS, CANVAS_RADIUS, 500)
    X, Y = np.meshgrid(x, y)
    Z = X + Y  # Diagonal gradient

    # Metallic colormap: Dark Grey -> Light Grey -> Dark Grey
    colors = [
        (0.05, 0.05, 0.05),  # Very Dark
        (0.1, 0.1, 0.1),  # Dark Grey
        (0.18, 0.18, 0.18),  # Subtle Highlight
        (0.1, 0.1, 0.1),  # Dark Grey
        (0.05, 0.05, 0.05),  # Very Dark
    ]
    n_bins = 256
    cmap = LinearSegmentedColormap.from_list("metallic", colors, N=n_bins)

    im = ax.imshow(
        Z,
        extent=(-CANVAS_RADIUS, CANVAS_RADIUS, -CANVAS_RADIUS, CANVAS_RADIUS),
        origin="lower",
        cmap=cmap,
        alpha=1.0,
        zorder=1,
    )
    im.set_clip_path(clip_path)


def _draw_fading_line(ax, p1, p2, color="white", linewidth=24, zorder=2):
    # Draw a line from p1 to p2 that fades to transparent at both ends
    x1, y1 = p1
    x2, y2 = p2

    num_segments = 100
    t = np.linspace(0, 1, num_segments + 1)
    x = x1 + (x2 - x1) * t
    y = y1 + (y2 - y1) * t

    points = np.array([x, y]).T.reshape(-1, 1, 2)
    segments = np.concatenate([points[:-1], points[1:]], axis=1)

    # Alpha profile: 0 -> 1 -> 0 (sinusoidal)
    t_mid = (t[:-1] + t[1:]) / 2
    base_alpha = 0.6  # Max alpha (dimmer)
    alpha = base_alpha * np.sin(np.pi * t_mid)

    rgb = np.array(to_rgb(color))
    colors = np.zeros((num_segments, 4))
    colors[:, :3] = rgb
    colors[:, 3] = alpha

    lc = LineCollection(segments, colors=colors, linewidths=linewidth, zorder=zorder)
    ax.add_collection(lc)


def _get_squircle_limit(coord: float, radius: float, exponent: float) -> float:
    # |x|^n + |y|^n = r^n
    if abs(coord) >= radius:
        return 0.0
    return (radius**exponent - abs(coord) ** exponent) ** (1.0 / exponent)


def draw_logo(output_path: str = OUTPUT_PATH, style: str = "dark") -> None:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    fig = plt.figure(figsize=FIG_SIZE, dpi=DPI)
    fig.patch.set_alpha(0.0)
    ax = fig.add_subplot(111)
    ax.set_facecolor((0.0, 0.0, 0.0, 0.0))

    # 1. Generate Squircle Path
    points = _generate_squircle_points(SQUIRCLE_RADIUS, SQUIRCLE_EXPONENT)

    if style == "dark":
        squircle_patch = Polygon(points, closed=True, facecolor="none", edgecolor="none", zorder=1)
        ax.add_patch(squircle_patch)
        # 2. Metallic Gradient Background
        _create_metallic_gradient(ax, squircle_patch)
        # 3. 3D Bump (Rim Light)
        ax.plot(points[:, 0], points[:, 1], color=(0.4, 0.4, 0.4), linewidth=2.5, zorder=1.5, alpha=0.8)
        line_color = "white"
        text_color = "white"
    else:
        # Light / Icon style
        squircle_patch = Polygon(points, closed=True, facecolor="white", edgecolor="none", zorder=1)
        ax.add_patch(squircle_patch)
        line_color = "black"
        text_color = "black"

    # 4. Aux Lines (Fading and clipped)
    guide_axis = SQUARE_RADIUS / PHI

    # Horizontal lines
    for y in (guide_axis, -guide_axis):
        x_limit = _get_squircle_limit(y, SQUIRCLE_RADIUS, SQUIRCLE_EXPONENT)
        _draw_fading_line(ax, (-x_limit, y), (x_limit, y), color=line_color)

    # Vertical lines
    for x in (guide_axis, -guide_axis):
        y_limit = _get_squircle_limit(x, SQUIRCLE_RADIUS, SQUIRCLE_EXPONENT)
        _draw_fading_line(ax, (x, -y_limit), (x, y_limit), color=line_color)

    font_prop = _load_font(size=TEXT_FONT_SIZE)
    ax.text(
        TEXT_X_OFFSET,
        TEXT_Y_OFFSET,
        CHARACTER,
        color=text_color,
        fontproperties=font_prop,
        ha="center",
        va="center",
        zorder=3,
    )

    ax.set_xlim(-CANVAS_RADIUS, CANVAS_RADIUS)
    ax.set_ylim(-CANVAS_RADIUS, CANVAS_RADIUS)
    ax.set_aspect("equal")
    ax.axis("off")

    plt.savefig(output_path, dpi=DPI, transparent=True, bbox_inches="tight", pad_inches=0.0)
    plt.close(fig)


if __name__ == "__main__":
    print(f"Generating Dark Logo at {OUTPUT_PATH}...")
    draw_logo(OUTPUT_PATH, style="dark")
    print(f"Generating Icon Logo at {ICON_OUTPUT_PATH}...")
    draw_logo(ICON_OUTPUT_PATH, style="light")
