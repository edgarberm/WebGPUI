import { normalizeColor } from '../utils/utils.js'

export default class Node {
  constructor() {
    this.explicitWidth = null
    this.explicitHeight = null
    this.maxWidth = null
    this.maxHeight = null
    this.paddingVal = 0
    this.bgColor = [1.0, 1.0, 1.0, 0.0]
    this.cornerRadiusVal = 0
    this.childrenArray = []
    this.measuredWidth = 0
    this.measuredHeight = 0
    this.x = this.y = this.w = this.h = 0
  }

  frame(v, h) {
    if (typeof v === 'object') {
      this.explicitWidth = v.width ?? null
      this.explicitHeight = v.height ?? null
      this.maxWidth = v.maxWidth ?? null
      this.maxHeight = v.maxHeight ?? null
    } else {
      this.explicitWidth = v
      this.explicitHeight = h
    }

    return this
  }

  padding(p) {
    this.paddingVal = p

    return this
  }

  background(c) {
    this.bgColor = normalizeColor(c)

    return this
  }

  cornerRadius(r) {
    this.cornerRadiusVal = r

    return this
  }

  children(...c) {
    this.childrenArray = c

    return this
  }

  measure(tr) {
    let w = this.paddingVal * 2
    let h = this.paddingVal * 2

    if (this.childrenArray.length) {
      this.childrenArray.forEach((c) => {
        c.measure(tr)
        w = Math.max(w, c.measuredWidth + this.paddingVal * 2)
        h = Math.max(h, c.measuredHeight + this.paddingVal * 2)
      })
    }

    this.measuredWidth = this.explicitWidth ?? w
    this.measuredHeight = this.explicitHeight ?? h
  }

  layout(x, y, aw, ah) {
    this.x = x
    this.y = y
    this.w = this.maxWidth === Infinity ? aw : Math.min(this.measuredWidth, aw)
    this.h =
      this.maxHeight === Infinity ? ah : Math.min(this.measuredHeight, ah)
  }

  getVertices(cw, ch) {
    const x0 = (this.x / cw) * 2 - 1
    const y0 = 1 - (this.y / ch) * 2
    const x1 = ((this.x + this.w) / cw) * 2 - 1
    const y1 = 1 - ((this.y + this.h) / ch) * 2
    const [r, g, b, a] = this.bgColor

    // Coordenadas locales del fragmento (para el SDF)
    const w = this.w
    const h = this.h
    const rad = this.cornerRadiusVal

    // Cada vértice: pos(2) + color(4) + fragPos(2) + rectSize(2) + cornerRadius(1) = 11 floats
    // prettier-ignore
    return new Float32Array([
      // Triangle 1
      x0, y0, r, g, b, a, 0, 0, w, h, rad,
      x1, y0, r, g, b, a, w, 0, w, h, rad,
      x0, y1, r, g, b, a, 0, h, w, h, rad,
      // Triangle 2
      x0, y1, r, g, b, a, 0, h, w, h, rad,
      x1, y0, r, g, b, a, w, 0, w, h, rad,
      x1, y1, r, g, b, a, w, h, w, h, rad,
    ])
  }

  getAllViews() {
    return [this, ...this.childrenArray.flatMap((c) => c.getAllViews())]
  }
}
