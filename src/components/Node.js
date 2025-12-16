import { normalizeColor } from '../utils/utils.js'

export default class Node {
  constructor() {
    // Frame properties
    this.explicitWidth = null
    this.explicitHeight = null
    this.maxWidth = null
    this.maxHeight = null

    // Style properties
    this.paddingVal = 0
    this.bgColor = [1.0, 1.0, 1.0, 0.0]
    this.cornerRadiusVal = 0

    // Layout properties
    this.layoutMode = 'none' // 'vertical', 'horizontal', 'stack'
    this.stackSpacing = 0
    this.alignmentHorizontal = 'left' // 'left', 'center', 'right'
    this.alignmentVertical = 'top' // 'top', 'center', 'bottom'

    // Children
    this.childrenArray = []

    // Measured values
    this.measuredWidth = 0
    this.measuredHeight = 0
    this.x = this.y = this.w = this.h = 0
  }

  // ========== LAYOUT MODIFIERS ==========
  direction(mode) {
    this.layoutMode = mode

    return this
  }

  spacing(value) {
    this.stackSpacing = value
    return this
  }

  alignment(h, v) {
    if (typeof h === 'object') {
      // .alignment({ horizontal: 'center', vertical: 'top' })
      this.alignmentHorizontal = h.horizontal ?? this.alignmentHorizontal
      this.alignmentVertical = h.vertical ?? this.alignmentVertical
    } else if (v !== undefined) {
      // .alignment('center', 'top')
      this.alignmentHorizontal = h
      this.alignmentVertical = v
    } else {
      // .alignment('center') - aplica a ambos ejes según el layout
      if (this.layoutMode === 'vertical') {
        this.alignmentHorizontal = h
      } else if (this.layoutMode === 'horizontal') {
        this.alignmentVertical = h
      } else {
        // Para stack o none, aplica a ambos
        this.alignmentHorizontal = h
        this.alignmentVertical = h
      }
    }

    return this
  }

  // ========== STYLE MODIFIERS ==========

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

  // ========== MEASURE ==========

  measure(tr) {
    switch (this.layoutMode) {
      case 'vertical':
        return this._measureVStack(tr)
      case 'horizontal':
        return this._measureHStack(tr)
      case 'stack':
        return this._measureZStack(tr)
      default:
        return this._measureDefault(tr)
    }
  }

  _measureDefault(tr) {
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

  _measureVStack(tr) {
    let w = 0
    let h = this.paddingVal * 2

    this.childrenArray.forEach((c) => {
      c.measure(tr)
      w = Math.max(w, c.measuredWidth)
      h += c.measuredHeight
    })

    if (this.childrenArray.length > 0) {
      h += (this.childrenArray.length - 1) * this.stackSpacing
    }

    this.measuredWidth = this.explicitWidth ?? w + this.paddingVal * 2
    this.measuredHeight = this.explicitHeight ?? h
  }

  _measureHStack(tr) {
    let w = this.paddingVal * 2
    let h = 0

    this.childrenArray.forEach((c) => {
      c.measure(tr)
      w += c.measuredWidth
      h = Math.max(h, c.measuredHeight)
    })

    if (this.childrenArray.length > 0) {
      w += (this.childrenArray.length - 1) * this.stackSpacing
    }

    this.measuredWidth = this.explicitWidth ?? w
    this.measuredHeight = this.explicitHeight ?? h + this.paddingVal * 2
  }

  _measureZStack(tr) {
    let w = 0
    let h = 0

    this.childrenArray.forEach((c) => {
      c.measure(tr)
      w = Math.max(w, c.measuredWidth)
      h = Math.max(h, c.measuredHeight)
    })

    this.measuredWidth = this.explicitWidth ?? w + this.paddingVal * 2
    this.measuredHeight = this.explicitHeight ?? h + this.paddingVal * 2
  }

  // ========== LAYOUT ==========

  layout(x, y, aw, ah) {
    // Set own position and size
    this.x = x
    this.y = y
    this.w = this.maxWidth === Infinity ? aw : Math.min(this.measuredWidth, aw)
    this.h =
      this.maxHeight === Infinity ? ah : Math.min(this.measuredHeight, ah)

    // Layout children based on mode
    switch (this.layoutMode) {
      case 'vertical':
        return this._layoutVStack(x, y, aw, ah)
      case 'horizontal':
        return this._layoutHStack(x, y, aw, ah)
      case 'stack':
        return this._layoutZStack(x, y, aw, ah)
      default:
        return this._layoutDefault(x, y, aw, ah)
    }
  }

  _layoutDefault(x, y, aw, ah) {
    // Layout children at same position (stacked, but no special alignment)
    this.childrenArray.forEach((c) => {
      c.layout(
        x + this.paddingVal,
        y + this.paddingVal,
        this.w - this.paddingVal * 2,
        this.h - this.paddingVal * 2
      )
    })
  }

  _layoutVStack(x, y, aw, ah) {
    const iw = this.w - this.paddingVal * 2
    let cy = y + this.paddingVal

    this.childrenArray.forEach((c) => {
      let cx = x + this.paddingVal

      // Horizontal alignment
      switch (this.alignmentHorizontal) {
        case 'center':
          cx += (iw - c.measuredWidth) / 2
          break
        case 'right':
          cx += iw - c.measuredWidth
          break
      }

      if (c.isText) {
        c.layout(cx, cy)
      } else {
        c.layout(cx, cy, iw, c.measuredHeight)
      }

      cy += c.h + this.stackSpacing
    })
  }

  _layoutHStack(x, y, aw, ah) {
    const ih = this.h - this.paddingVal * 2
    let cx = x + this.paddingVal

    this.childrenArray.forEach((c) => {
      let cy = y + this.paddingVal

      // Vertical alignment
      switch (this.alignmentVertical) {
        case 'center':
          cy += (ih - c.measuredHeight) / 2
          break
        case 'bottom':
          cy += ih - c.measuredHeight
          break
      }

      c.layout(cx, cy, c.measuredWidth, ih)
      cx += c.w + this.stackSpacing
    })
  }

  _layoutZStack(x, y, aw, ah) {
    const iw = this.w - this.paddingVal * 2
    const ih = this.h - this.paddingVal * 2

    this.childrenArray.forEach((c) => {
      let cx = x + this.paddingVal
      let cy = y + this.paddingVal

      // Horizontal alignment
      switch (this.alignmentHorizontal) {
        case 'center':
          cx += (iw - c.measuredWidth) / 2
          break
        case 'right':
          cx += iw - c.measuredWidth
          break
      }

      // Vertical alignment
      switch (this.alignmentVertical) {
        case 'center':
          cy += (ih - c.measuredHeight) / 2
          break
        case 'bottom':
          cy += ih - c.measuredHeight
          break
      }

      c.layout(cx, cy, c.measuredWidth, c.measuredHeight)
    })
  }

  // ========== RENDERING ==========

  getVertices(cw, ch) {
    const x0 = (this.x / cw) * 2 - 1
    const y0 = 1 - (this.y / ch) * 2
    const x1 = ((this.x + this.w) / cw) * 2 - 1
    const y1 = 1 - ((this.y + this.h) / ch) * 2
    const [r, g, b, a] = this.bgColor

    const w = this.w
    const h = this.h
    const rad = this.cornerRadiusVal

    // prettier-ignore
    return new Float32Array([
      x0, y0, r, g, b, a, 0, 0, w, h, rad,
      x1, y0, r, g, b, a, w, 0, w, h, rad,
      x0, y1, r, g, b, a, 0, h, w, h, rad,
      x0, y1, r, g, b, a, 0, h, w, h, rad,
      x1, y0, r, g, b, a, w, 0, w, h, rad,
      x1, y1, r, g, b, a, w, h, w, h, rad,
    ])
  }

  getAllViews() {
    return [this, ...this.childrenArray.flatMap((c) => c.getAllViews())]
  }
}
