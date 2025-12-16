import Node from './Node.js'

export default class VNode extends Node {
  spacing(v) {
    this.stackSpacing = v

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
      c.layout(x + this.paddingVal, cy, iw, c.measuredHeight)
      cy += c.h + (this.stackSpacing || 0)
    })
  }
}