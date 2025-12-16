export function normalizeColor([r, g, b, a = 1]) {
  return [
    r / 255,
    g / 255,
    b / 255,
    a,
  ]
}