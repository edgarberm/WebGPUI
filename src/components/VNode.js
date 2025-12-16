import Node from './Node.js'

export default class VNode extends Node {
  constructor() {
    super()
    this.stackSpacing = 0
    this.alignmentHorizontal = 'left' // 'left' | 'center' | 'right'
  }

  spacing(v) {
    this.stackSpacing = v

    return this
  }

  alignment(value) {
    this.alignmentHorizontal = value ?? 'left'

    return this
  }

  measure(tr) {
    let w = 0
    let h = this.paddingVal * 2

    this.childrenArray.forEach((c) => {
      c.measure(tr)
      w = Math.max(w, c.measuredWidth)
      h += c.measuredHeight
    })

    h += (this.childrenArray.length - 1) * (this.stackSpacing || 0)

    this.measuredWidth = this.explicitWidth ?? w + this.paddingVal * 2
    this.measuredHeight = this.explicitHeight ?? h
  }

  layout(x, y, aw, ah) {
    super.layout(x, y, aw, ah)

    const iw = this.w - this.paddingVal * 2
    let cy = y + this.paddingVal

    this.childrenArray.forEach((c) => {
      let cx = x + this.paddingVal

      switch (this.alignmentHorizontal) {
        case 'center':
          cx += (iw - c.measuredWidth) / 2
          break
        case 'right':
          cx += iw - c.measuredWidth
          break
      }

      if (c.isText) {
        c.layout(cx, cy) // Text usa su tamaño real
      } else {
        c.layout(cx, cy, iw, c.measuredHeight)
      }

      cy += c.h + this.stackSpacing
    })
  }
}
