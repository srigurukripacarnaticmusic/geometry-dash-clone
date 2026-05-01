export function aabbIntersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function containsPoint(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

function pointInTriangle(point, a, b, c) {
  const area = (first, second, third) => (
    (first.x * (second.y - third.y) + second.x * (third.y - first.y) + third.x * (first.y - second.y)) / 2
  );

  const triangleArea = Math.abs(area(a, b, c));
  const area1 = Math.abs(area(point, b, c));
  const area2 = Math.abs(area(a, point, c));
  const area3 = Math.abs(area(a, b, point));
  return Math.abs(triangleArea - (area1 + area2 + area3)) < 0.5;
}

export function rectIntersectsSpike(rect, spike) {
  const bounds = {
    x: spike.x,
    y: spike.y,
    width: spike.width,
    height: spike.height
  };

  if (!aabbIntersects(rect, bounds)) {
    return false;
  }

  const points = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x, y: rect.y + rect.height },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x + rect.width * 0.5, y: rect.y + rect.height * 0.5 }
  ];

  let triangle;

  if (spike.direction === "down") {
    triangle = [
      { x: spike.x, y: spike.y },
      { x: spike.x + spike.width * 0.5, y: spike.y + spike.height },
      { x: spike.x + spike.width, y: spike.y }
    ];
  } else if (spike.direction === "left") {
    triangle = [
      { x: spike.x + spike.width, y: spike.y },
      { x: spike.x, y: spike.y + spike.height * 0.5 },
      { x: spike.x + spike.width, y: spike.y + spike.height }
    ];
  } else if (spike.direction === "right") {
    triangle = [
      { x: spike.x, y: spike.y },
      { x: spike.x + spike.width, y: spike.y + spike.height * 0.5 },
      { x: spike.x, y: spike.y + spike.height }
    ];
  } else {
    triangle = [
      { x: spike.x, y: spike.y + spike.height },
      { x: spike.x + spike.width * 0.5, y: spike.y },
      { x: spike.x + spike.width, y: spike.y + spike.height }
    ];
  }

  return points.some((point) => pointInTriangle(point, triangle[0], triangle[1], triangle[2]));
}
