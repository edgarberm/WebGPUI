import Node from './Node.js'
import { normalizeColor } from '../utils/utils.js'
import { DIRTY_RENDER } from '../core/DirtyFlags.js'

export default class Text extends Node {
  constructor(content) {
    super()

    this.textContent = content
    this.fontSize = 16
    this.fontFamily = 'system-ui,-apple-system,sans-serif'
    this._fontWeight = 'normal'
    this.textColor = [0, 0, 0, 1]
    this.texture = null
    this.isText = true

    this._vertexBuffer = null
    this._vertices = null
    this.bindGroup = null
  }

  font(size, family) {
    this.fontSize = size
    if (family) this.fontFamily = family
    this.texture = null

    return this
  }

  fontWeight(weight) {
    this._fontWeight = weight
    this.texture = null

    return this
  }

  color(color) {
    this.textColor = normalizeColor(color)
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

  layout(x, y) {
    this.x = x
    this.y = y
    this.w = this.measuredWidth
    this.h = this.measuredHeight
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

  updateBuffer(device, canvasWidth, canvasHeight) {
    this._vertices = this.getTexturedVertices(canvasWidth, canvasHeight)

    if (!this._vertexBuffer) {
      this._vertexBuffer = device.createBuffer({
        size: this._vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      })
    }

    device.queue.writeBuffer(this._vertexBuffer, 0, this._vertices)
    this.dirty &= ~DIRTY_RENDER
  }

  prepareBindGroup(device, sampler, pipeline) {
    if (!this.bindGroup) {
      this.bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: this.texture.createView() },
          { binding: 1, resource: sampler },
        ],
      })
    }
  }
}
