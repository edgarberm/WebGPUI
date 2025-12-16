import Node from './Node.js'

export default class HNode extends Node {
  spacing(value) {
    this.stackSpacing = value

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

    let cx = x + this.paddingVal

    this.childrenArray.forEach((c) => {
      c.layout(cx, y + this.paddingVal, c.measuredWidth, this.h)
      cx += c.w + (this.stackSpacing || 0)
    })
  }
}