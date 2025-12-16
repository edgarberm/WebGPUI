import View from './View.js'

export default class Text extends View {
  constructor(content) {
    super()

    this.textContent = content
    this.fontSize = 16
    this.fontFamily = 'system-ui,-apple-system,sans-serif'
    this._fontWeight = 'normal'
    this.textColor = [0, 0, 0, 1]
    this.texture = null
    this.isText = true
  }

  font(size, family = 'system-ui,-apple-system,sans-serif') {
    this.fontSize = size
    this.fontFamily = family
    this.texture = null

    return this
  }

  fontWeight(weight) {
    this._fontWeight = weight
    this.texture = null

    return this
  }

  foregroundColor(color) {
    this.textColor = color
    this.texture = null

    return this
  }

  measure(textRenderer) {
    const padding = 4
    const ts = textRenderer.measureText(
      this.textContent,
      this.fontSize,
      this.fontFamily,
      this._fontWeight
    )

    this.measuredWidth = ts.width + padding * 2
    this.measuredHeight = ts.height + padding * 2
  }

  layout(x, y, availableWidth, availableHeight) {
    this.x = x
    this.y = y
    this.w =
      this.maxWidth === Infinity
        ? availableWidth
        : Math.min(this.measuredWidth, availableWidth)
    this.h =
      this.maxHeight === Infinity
        ? availableHeight
        : Math.min(this.measuredHeight, availableHeight)
  }

  prepareTexture(device, textRenderer) {
    if (!this.texture) {
      const res = textRenderer.renderToTexture(
        device,
        this.textContent,
        this.fontSize,
        this.fontFamily,
        this._fontWeight,
        this.textColor
      )
      this.texture = res.texture
      this.texWidth = res.width
      this.texHeight = res.height
    }
  }

  getTexturedVertices(canvasWidth, canvasHeight) {
    const x0 = (this.x / canvasWidth) * 2 - 1
    const y0 = 1 - (this.y / canvasHeight) * 2
    const x1 = ((this.x + this.w) / canvasWidth) * 2 - 1
    const y1 = 1 - ((this.y + this.h) / canvasHeight) * 2

    // prettier-ignore
    return new Float32Array([
      x0, y0, 0, 0,
      x1, y0, 1, 0,
      x0, y1, 0, 1,
      x0, y1, 0, 1,
      x1, y0, 1, 0,
      x1, y1, 1, 1,
    ])
  }
}
