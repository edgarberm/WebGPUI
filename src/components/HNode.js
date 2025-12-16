import Node from './Node.js'

export default class HNode extends Node {
  constructor() {
    super()
    this.stackSpacing = 0
    this.alignmentVertical = 'top' // 'top' | 'center' | 'bottom'
  }

  spacing(value) {
    this.stackSpacing = value

    return this
  }

  alignment(value) {
    this.alignmentVertical = value ?? 'top'

    return this
  }

  measure(tr) {
    let w = this.paddingVal * 2
    let h = 0

    this.childrenArray.forEach((c) => {
      c.measure(tr)
      w += c.measuredWidth
      h = Math.max(h, c.measuredHeight)
    })

    w += (this.childrenArray.length - 1) * (this.stackSpacing || 0)

    this.measuredWidth = this.explicitWidth ?? w
    this.measuredHeight = this.explicitHeight ?? h + this.paddingVal * 2
  }

  layout(x, y, aw, ah) {
    super.layout(x, y, aw, ah)

    const ih = this.h - this.paddingVal * 2
    let cx = x + this.paddingVal

    this.childrenArray.forEach((c) => {
      let cy = y + this.paddingVal

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
}
