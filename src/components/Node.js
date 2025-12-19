import { normalizeColor } from '../utils/utils.js'
import {
  DIRTY_MEASURE,
  DIRTY_LAYOUT,
  DIRTY_RENDER,
} from '../core/DirtyFlags.js'

export default class Node {
  constructor() {
    // Frame properties
    this.explicitWidth = null
    this.explicitHeight = null
    this.maxWidth = null
    this.maxHeight = null

    // Style properties
    this.paddingVal = 0
    this.bgColor = [255, 255, 255, 0]
    this.borderRadiusValue = 0

    // Layout properties
    this.layoutMode = 'none' // 'vertical', 'horizontal', 'stack'
    this.stackSpacing = 0
    this.justifyContent = 'start' // 'start', 'end', 'center', 'space-between', 'space-around', 'space-evenly'
    this.alignItems = 'start' // 'start', 'center', 'end', 'stretch'

    // Children
    this.childrenArray = []

    // Measured values
    this.measuredWidth = 0
    this.measuredHeight = 0
    this.x = 0
    this.y = 0
    this.w = 0
    this.h = 0

    this.parent = null

    this.dirty = DIRTY_MEASURE | DIRTY_LAYOUT | DIRTY_RENDER
    this._renderer = null
  }

  // ========== LAYOUT MODIFIERS ==========

  direction(mode) {
    this.layoutMode = mode

    this.invalidate(DIRTY_LAYOUT)

    return this
  }

  spacing(value) {
    this.stackSpacing = value

    this.invalidate(DIRTY_LAYOUT)

    return this
  }

  justify(value) {
    this.justifyContent = value

    this.invalidate(DIRTY_LAYOUT)

    return this
  }

  align(value) {
    this.alignItems = value

    this.invalidate(DIRTY_LAYOUT)

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

    this.invalidate(DIRTY_MEASURE)

    return this
  }

  padding(p) {
    this.paddingVal = p

    this.invalidate(DIRTY_MEASURE)

    return this
  }

  background(c) {
    this.bgColor = normalizeColor(c)

    this.invalidate(DIRTY_RENDER)

    return this
  }

  borderRadius(r) {
    this.borderRadiusValue = r

    this.invalidate(DIRTY_RENDER)

    return this
  }

  children(...c) {
    this.childrenArray = c
    c.forEach((child) => {
      child.parent = this
      if (this._renderer) child.setRenderer(this._renderer)
    })

    this.invalidate(DIRTY_MEASURE)
    return this
  }

  // ========== DIRTY/INVALIDATE ==========

  invalidate(flag = DIRTY_RENDER) {
    if (this.dirty & flag) return

    this.dirty |= flag

    // Propagate up
    if (this.parent) {
      if (flag & DIRTY_MEASURE) {
        this.parent.invalidate(DIRTY_MEASURE)
      } else if (flag & DIRTY_LAYOUT) {
        this.parent.invalidate(DIRTY_LAYOUT)
      } else {
        this.parent.invalidate(DIRTY_RENDER)
      }
    }

    if (this._renderer) {
      this._renderer.markDirty()
    }
  }

  setRenderer(renderer) {
    this._renderer = renderer
    this.childrenArray.forEach((c) => c.setRenderer(renderer))
  }

  // ========== MEASURE ==========

  measure(textRenderer) {
    if (!(this.dirty & DIRTY_MEASURE)) return

    switch (this.layoutMode) {
      case 'vertical':
        this._measureVerticalNode(textRenderer)
        break
      case 'horizontal':
        this._measureHorizontalNode(textRenderer)
        break
      case 'stack':
        this._measureStackNode(textRenderer)
        break
      default:
        this._measureDefault(textRenderer)
    }

    this.dirty &= ~DIRTY_MEASURE
    this.dirty |= DIRTY_LAYOUT | DIRTY_RENDER
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

  _measureVerticalNode(tr) {
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

  _measureHorizontalNode(tr) {
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

  _measureStackNode(tr) {
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
    const needsLayout = this.dirty & DIRTY_LAYOUT

    if (needsLayout) {
      this._layoutImpl(x, y, aw, ah)

      this.dirty &= ~DIRTY_LAYOUT
      this.dirty |= DIRTY_RENDER
    }

    // 🔑 SIEMPRE propagar a hijos
    this.childrenArray.forEach((c) => {
      c.layout(c.x, c.y, c.w, c.h)
    })
  }

  _layoutImpl(x, y, aw, ah) {
    const maxW = this.maxWidth ?? Infinity
    const maxH = this.maxHeight ?? Infinity

    this.x = x
    this.y = y
    this.w = this.w = Math.min(this.measuredWidth, aw, maxW)
    this.h = this.h = Math.min(this.measuredHeight, ah, maxH)

    switch (this.layoutMode) {
      case 'vertical':
        return this._layoutVerticalNode(x, y, aw, ah)
      case 'horizontal':
        return this._layoutHorizontalNode(x, y, aw, ah)
      case 'stack':
        return this._layoutStackNode(x, y, aw, ah)
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

  _layoutVerticalNode(x, y, aw, ah) {
    const iw = this.w - this.paddingVal * 2
    const ih = this.h - this.paddingVal * 2

    const totalChildrenHeight = this.childrenArray.reduce(
      (sum, c) => sum + c.measuredHeight,
      0
    )

    const totalSpacing = (this.childrenArray.length - 1) * this.stackSpacing
    const availableSpace = ih - totalChildrenHeight - totalSpacing

    let cy = y + this.paddingVal
    let dynamicSpacing = this.stackSpacing

    switch (this.justifyContent) {
      case 'end':
        cy += availableSpace
        break
      case 'center':
        cy += availableSpace / 2
        break
      case 'space-between':
        dynamicSpacing =
          this.childrenArray.length > 1
            ? this.stackSpacing +
              availableSpace / (this.childrenArray.length - 1)
            : this.stackSpacing
        break
      case 'space-around': {
        const space = availableSpace / this.childrenArray.length
        cy += space / 2
        dynamicSpacing = this.stackSpacing + space
        break
      }
      case 'space-evenly': {
        const space = availableSpace / (this.childrenArray.length + 1)
        cy += space
        dynamicSpacing = this.stackSpacing + space
        break
      }
    }

    this.childrenArray.forEach((c) => {
      let cx = x + this.paddingVal

      // Cross-axis alignment
      switch (this.alignItems) {
        case 'center':
          cx += (iw - c.measuredWidth) / 2
          break
        case 'end':
          cx += iw - c.measuredWidth
          break
        case 'stretch':
          // stretch se resuelve pasando iw al layout
          break
      }

      if (c.isText) {
        c.layout(cx, cy)
      } else {
        c.layout(cx, cy, iw, c.measuredHeight)
      }

      cy += c.h + dynamicSpacing
    })
  }

  _layoutHorizontalNode(x, y, aw, ah) {
    const iw = this.w - this.paddingVal * 2
    const ih = this.h - this.paddingVal * 2

    const totalChildrenWidth = this.childrenArray.reduce(
      (sum, c) => sum + c.measuredWidth,
      0
    )

    const totalSpacing = (this.childrenArray.length - 1) * this.stackSpacing
    const availableSpace = iw - totalChildrenWidth - totalSpacing

    let cx = x + this.paddingVal
    let dynamicSpacing = this.stackSpacing

    switch (this.justifyContent) {
      case 'end':
        cx += availableSpace
        break
      case 'center':
        cx += availableSpace / 2
        break
      case 'space-between':
        dynamicSpacing =
          this.childrenArray.length > 1
            ? this.stackSpacing +
              availableSpace / (this.childrenArray.length - 1)
            : this.stackSpacing
        break
      case 'space-around': {
        const space = availableSpace / this.childrenArray.length
        cx += space / 2
        dynamicSpacing = this.stackSpacing + space
        break
      }
      case 'space-evenly': {
        const space = availableSpace / (this.childrenArray.length + 1)
        cx += space
        dynamicSpacing = this.stackSpacing + space
        break
      }
    }

    this.childrenArray.forEach((c) => {
      let cy = y + this.paddingVal

      switch (this.alignItems) {
        case 'center':
          cy += (ih - c.measuredHeight) / 2
          break
        case 'end':
          cy += ih - c.measuredHeight
          break
        case 'stretch':
          break
      }

      c.layout(cx, cy, c.measuredWidth, ih)
      cx += c.w + dynamicSpacing
    })
  }

  _layoutStackNode(x, y, aw, ah) {
    const iw = this.w - this.paddingVal * 2
    const ih = this.h - this.paddingVal * 2

    this.childrenArray.forEach((c) => {
      let cx = x + this.paddingVal
      let cy = y + this.paddingVal

      switch (this.alignItems) {
        case 'center':
          cx += (iw - c.measuredWidth) / 2
          cy += (ih - c.measuredHeight) / 2
          break
        case 'end':
          cx += iw - c.measuredWidth
          cy += ih - c.measuredHeight
          break
      }

      c.layout(cx, cy, iw, ih)
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
    const rad = this.borderRadiusValue

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
