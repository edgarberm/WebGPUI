export const PixelPolicy = {
  // Modos disponibles
  SUBPIXEL: 'subpixel', // Sin snapping, máxima suavidad
  INTEGER: 'integer', // Snap a píxeles enteros
  HALF_PIXEL: 'half-pixel', // Permite .5 para centrado perfecto

  // Configuración global (puedes cambiarla en runtime)
  current: 'integer',

  // DPR aware snapping
  snapToDPR: true,
}

// FUNCIONES DE SNAPPING

/**
 * Snap a píxel según la política actual
 */
export function snapPixel(value, dpr = 1) {
  switch (PixelPolicy.current) {
    case PixelPolicy.SUBPIXEL:
      return value

    case PixelPolicy.HALF_PIXEL:
      // Permite .0 y .5 (útil para centrado perfecto)
      if (PixelPolicy.snapToDPR) {
        return Math.round(value * dpr * 2) / (dpr * 2)
      }
      return Math.round(value * 2) / 2

    case PixelPolicy.INTEGER:
    default:
      // Snap a píxel entero
      if (PixelPolicy.snapToDPR) {
        return Math.round(value * dpr) / dpr
      }
      return Math.round(value)
  }
}

/**
 * Snap un rectángulo completo (x, y, width, height)
 * Asegura que width/height también estén en píxeles enteros
 */
export function snapRect(x, y, w, h, dpr = 1) {
  const x1 = snapPixel(x, dpr)
  const y1 = snapPixel(y, dpr)
  const x2 = snapPixel(x + w, dpr)
  const y2 = snapPixel(y + h, dpr)

  return {
    x: x1,
    y: y1,
    w: x2 - x1,
    h: y2 - y1,
  }
}

/**
 * Snap tamaño (width/height) - útil para measure
 */
export function snapSize(value, dpr = 1) {
  // Los tamaños siempre deben ser enteros para evitar blur
  if (PixelPolicy.snapToDPR) {
    return Math.ceil(value * dpr) / dpr
  }
  return Math.ceil(value)
}

// HELPERS PARA DEBUGGING

export function isPixelAligned(value, dpr = 1) {
  const snapped = snapPixel(value, dpr)
  return Math.abs(value - snapped) < 0.001
}

export function logPixelAlignment(label, x, y, w, h, dpr = 1) {
  console.log(`[${label}] Alignment:`, {
    x: isPixelAligned(x, dpr) ? '✓' : `✗ (${x})`,
    y: isPixelAligned(y, dpr) ? '✓' : `✗ (${y})`,
    w: isPixelAligned(w, dpr) ? '✓' : `✗ (${w})`,
    h: isPixelAligned(h, dpr) ? '✓' : `✗ (${h})`,
  })
}
