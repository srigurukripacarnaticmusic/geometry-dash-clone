export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function inverseLerp(a, b, value) {
  if (a === b) {
    return 0;
  }

  return clamp((value - a) / (b - a), 0, 1);
}

export function approach(value, target, amount) {
  if (value < target) {
    return Math.min(value + amount, target);
  }

  return Math.max(value - amount, target);
}

export function damp(current, target, smoothing, dt) {
  return lerp(current, target, 1 - Math.exp(-smoothing * dt));
}

export function signNonZero(value) {
  return value >= 0 ? 1 : -1;
}

export function wrap(value, min, max) {
  const range = max - min;

  if (range === 0) {
    return min;
  }

  return ((((value - min) % range) + range) % range) + min;
}

export function snap(value, size) {
  return Math.round(value / size) * size;
}

export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

export function randInt(min, max) {
  return Math.floor(randRange(min, max + 1));
}

export function pingPong(time, length) {
  const double = length * 2;
  const wrapped = wrap(time, 0, double);
  return wrapped <= length ? wrapped : double - wrapped;
}

export function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

export function radToDeg(radians) {
  return (radians * 180) / Math.PI;
}

export function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

export function formatPercent(value) {
  return `${Math.round(clamp(value, 0, 1) * 100)}%`;
}
