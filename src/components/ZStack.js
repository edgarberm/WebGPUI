import View from './View.js'

export default class ZStack extends View {
  constructor() {
    super()
    this.alignmentHorizontal = 'center' // 'leading', 'center', 'trailing'
    this.alignmentVertical = 'center' // 'top', 'center', 'bottom'
  }

  alignment(h, v) {
    if (typeof h === 'object') {
      this.alignmentHorizontal = h.horizontal ?? 'center'
      this.alignmentVertical = h.vertical ?? 'center'
    } else {
      this.alignmentHorizontal = h ?? 'center'
      this.alignmentVertical = v ?? 'center'
    }
    
    return this
  }

  measure(tr) {
    let w = 0
    let h = 0

    // Medir todos los hijos y encontrar el tamaño máximo
    this.childrenArray.forEach((c) => {
      c.measure(tr)
      w = Math.max(w, c.measuredWidth)
      h = Math.max(h, c.measuredHeight)
    })

    this.measuredWidth = this.explicitWidth ?? w + this.paddingVal * 2
    this.measuredHeight = this.explicitHeight ?? h + this.paddingVal * 2
  }

  layout(x, y, aw, ah) {
    super.layout(x, y, aw, ah)

    const iw = this.w - this.paddingVal * 2
    const ih = this.h - this.paddingVal * 2

    // Colocar cada hijo según el alignment
    this.childrenArray.forEach((c) => {
      let cx = x + this.paddingVal
      let cy = y + this.paddingVal

      // Alineación horizontal
      switch (this.alignmentHorizontal) {
        case 'leading':
          cx = x + this.paddingVal
          break
        case 'center':
          cx = x + this.paddingVal + (iw - c.measuredWidth) / 2
          break
        case 'trailing':
          cx = x + this.paddingVal + (iw - c.measuredWidth)
          break
      }

      // Alineación vertical
      switch (this.alignmentVertical) {
        case 'top':
          cy = y + this.paddingVal
          break
        case 'center':
          cy = y + this.paddingVal + (ih - c.measuredHeight) / 2
          break
        case 'bottom':
          cy = y + this.paddingVal + (ih - c.measuredHeight)
          break
      }

      c.layout(cx, cy, c.measuredWidth, c.measuredHeight)
    })
  }
}