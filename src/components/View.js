export default class View {
  constructor() {
    this.explicitWidth = null
    this.explicitHeight = null
    this.maxWidth = null
    this.maxHeight = null
    this.paddingVal = 0
    this.bgColor = [1.0, 1.0, 1.0, 0.0]
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
    this.bgColor = c
    return this
  }
  children(...c) {
    this.childrenArray = c
    return this
  }

  measure() {
    this.measuredWidth = this.explicitWidth ?? this.paddingVal * 2
    this.measuredHeight = this.explicitHeight ?? this.paddingVal * 2
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
    return new Float32Array([
      x0,
      y0,
      r,
      g,
      b,
      a,
      x1,
      y0,
      r,
      g,
      b,
      a,
      x0,
      y1,
      r,
      g,
      b,
      a,
      x0,
      y1,
      r,
      g,
      b,
      a,
      x1,
      y0,
      r,
      g,
      b,
      a,
      x1,
      y1,
      r,
      g,
      b,
      a,
    ])
  }

  getAllViews() {
    return [this, ...this.childrenArray.flatMap((c) => c.getAllViews())]
  }
}
