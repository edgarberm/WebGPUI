import { colorShader, textShader } from '../shaders/index.js'
import TextRenderer from './TextRenderer.js'

/**
 * @todo
 *
 * - Un sistema para invalidar/marcar dirty cuando algo cambie
 * - Detectar resize del canvas
 * - Re-layout solo cuando sea necesario
 * - Diferenciar entre cambios que requieren re-measure vs solo re-paint
 */
export default class WebGPURenderer {
  constructor(canvas, root) {
    this.canvas = canvas
    this.root = root
    this.dpr = window.devicePixelRatio || 1
    this.textRenderer = new TextRenderer(this.dpr)

    this.init()
  }

  async init() {
    const adapter = await navigator.gpu.requestAdapter()
    this.device = await adapter.requestDevice()

    this.ctx = this.canvas.getContext('webgpu')

    const format = navigator.gpu.getPreferredCanvasFormat()

    this.ctx.configure({ device: this.device, format })

    // Pipeline para rectangles
    this.rectPipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: this.device.createShaderModule({ code: colorShader }),
        entryPoint: 'vs',
        buffers: [
          {
            arrayStride: 24,
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x2' },
              { shaderLocation: 1, offset: 8, format: 'float32x4' },
            ],
          },
        ],
      },
      fragment: {
        module: this.device.createShaderModule({ code: colorShader }),
        entryPoint: 'fs',
        targets: [
          {
            format,
            // AÑADIR BLENDING para soportar transparencia
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
            },
          },
        ],
      },
      primitive: { topology: 'triangle-list' },
    })

    // Pipeline para texto con blending
    this.textPipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: this.device.createShaderModule({ code: textShader }),
        entryPoint: 'vs',
        buffers: [
          {
            arrayStride: 16,
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x2' },
              { shaderLocation: 1, offset: 8, format: 'float32x2' },
            ],
          },
        ],
      },
      fragment: {
        module: this.device.createShaderModule({ code: textShader }),
        entryPoint: 'fs',
        targets: [
          {
            format,
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
            },
          },
        ],
      },
      primitive: { topology: 'triangle-list' },
    })

    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    })

    this.render()
  }

  render() {
    const w = (this.canvas.width = innerWidth * this.dpr)
    const h = (this.canvas.height = innerHeight * this.dpr)

    this.root.measure(this.textRenderer)
    this.root.layout(0, 0, w / this.dpr, h / this.dpr)

    const encoder = this.device.createCommandEncoder()
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.ctx.getCurrentTexture().createView(),
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: { r: 0.95, g: 0.95, b: 0.95, a: 1 },
        },
      ],
    })

    // Dibujar rectangles
    const views = this.root.getAllViews().filter((v) => !v.isText)
    if (views.length) {
      const verts = new Float32Array(
        views.flatMap((v) => [...v.getVertices(w / this.dpr, h / this.dpr)])
      )
      const buf = this.device.createBuffer({
        size: verts.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      })

      new Float32Array(buf.getMappedRange()).set(verts)

      buf.unmap()

      pass.setPipeline(this.rectPipeline)
      pass.setVertexBuffer(0, buf)
      pass.draw(verts.length / 6)
    }

    // Dibujar textos
    const texts = this.root.getAllViews().filter((v) => v.isText)

    texts.forEach((t) => {
      t.prepareTexture(this.device, this.textRenderer)

      const verts = new Float32Array(
        t.getTexturedVertices(w / this.dpr, h / this.dpr)
      )

      const buf = this.device.createBuffer({
        size: verts.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      })

      new Float32Array(buf.getMappedRange()).set(verts)

      buf.unmap()

      const bindGroup = this.device.createBindGroup({
        layout: this.textPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: t.texture.createView() },
          { binding: 1, resource: this.sampler },
        ],
      })

      pass.setPipeline(this.textPipeline)
      pass.setBindGroup(0, bindGroup)
      pass.setVertexBuffer(0, buf)
      pass.draw(verts.length / 4)
    })

    pass.end()

    this.device.queue.submit([encoder.finish()])

    requestAnimationFrame(() => this.render())
  }
}
