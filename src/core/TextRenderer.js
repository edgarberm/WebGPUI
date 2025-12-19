import { snapSize } from './PixelPolicy.js'

export default class TextRenderer {
  constructor(dpr = 1) {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d', {
      alpha: true,
      willReadFrequently: false,
    })
    this.textureCache = new Map()
    this.dpr = dpr

    this.ctx.imageSmoothingEnabled = false
  }

  measureText(text, fontSize, fontFamily, fontWeight) {
    // PRIMERO configurar la fuente
    this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`

    // LUEGO medir el texto
    const m = this.ctx.measureText(text)

    // Usar métricas reales para altura más precisa
    const actualHeight = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent

    const width = snapSize(m.width, this.dpr)
    const height = snapSize(actualHeight || fontSize * 1.2, this.dpr)

    return { width, height }
  }

  renderToTexture(device, text, fontSize, fontFamily, fontWeight, color) {
    const key = `${text}-${fontSize}-${fontWeight}-${color.join()}`

    if (this.textureCache.has(key)) return this.textureCache.get(key)

    const padding = 4
    const size = this.measureText(text, fontSize, fontFamily, fontWeight)
    const paddingSnapped = snapSize(padding, this.dpr)
    const w = size.width + paddingSnapped * 2
    const h = size.height + paddingSnapped * 2

    this.canvas.width = Math.ceil(w * this.dpr)
    this.canvas.height = Math.ceil(h * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)

    // Limpiar con transparencia
    this.ctx.clearRect(0, 0, w, h)

    this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    this.ctx.fillStyle = `rgba(${color.map((c) => c * 255).join(',')})`
    this.ctx.textBaseline = 'top'
    this.ctx.fillText(text, padding, padding)

    const img = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    )
    const tex = device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    })

    device.queue.writeTexture(
      { texture: tex },
      img.data,
      { bytesPerRow: this.canvas.width * 4 },
      [this.canvas.width, this.canvas.height]
    )

    const res = { texture: tex, width: w, height: h }

    this.textureCache.set(key, res)

    return res
  }

  clearCache() {
    this.textureCache.clear()
  }

  setDPR(dpr) {
    if (this.dpr !== dpr) {
      this.dpr = dpr
      this.clearCache()
    }
  }
}
