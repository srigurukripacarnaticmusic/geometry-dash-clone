export function withAlpha(color, alpha) {
  if (color.startsWith("rgba")) {
    return color.replace(/rgba\(([^)]+),\s*[\d.]+\)/, `rgba($1, ${alpha})`);
  }

  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
  }

  const hex = color.replace("#", "");
  const normalized = hex.length === 3
    ? hex.split("").map((character) => `${character}${character}`).join("")
    : hex;

  const value = parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function blend(colorA, colorB, ratio) {
  const a = toRgb(colorA);
  const b = toRgb(colorB);
  const mix = (first, second) => Math.round(first + (second - first) * ratio);
  return `rgb(${mix(a.r, b.r)}, ${mix(a.g, b.g)}, ${mix(a.b, b.b)})`;
}

export function toRgb(color) {
  if (color.startsWith("rgb")) {
    const values = color
      .replace(/[rgba()]/g, "")
      .split(",")
      .map((value) => Number.parseFloat(value.trim()));
    return {
      r: values[0],
      g: values[1],
      b: values[2]
    };
  }

  const hex = color.replace("#", "");
  const normalized = hex.length === 3
    ? hex.split("").map((character) => `${character}${character}`).join("")
    : hex;
  const value = parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}
