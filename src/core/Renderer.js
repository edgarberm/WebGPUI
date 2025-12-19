import { textShader, rectShader } from '../shaders/index.js'
import TextRenderer from './TextRenderer.js'
import {
  DIRTY_RENDER,
  DIRTY_MEASURE,
  DIRTY_LAYOUT,
} from '../core/DirtyFlags.js'

/**
 * @todo
 *
 * 1️⃣ Sistema dirty / invalidation (measure vs layout vs paint) ⏳
 * 2️⃣ Re-layout solo cuando sea necesario (pipeline por fases)
 * 3️⃣ Decidir política de píxeles (sub-pixel vs integer + snapping)
 * 4️⃣ Renderer optimizations (batching / instancing básico)
 * 5️⃣ Clipping / masks6️⃣ Shadows SDF
 */
export default class WebGPURenderer {
  constructor(canvas, root) {
    this.canvas = canvas
    this.root = root
    this.dpr = window.devicePixelRatio || 1
    this.textRenderer = new TextRenderer(this.dpr)
    this.needsRender = false

    window.addEventListener('resize', () => this.onResize())

    this.init()
  }

  async init() {
    const adapter = await navigator.gpu.requestAdapter()
    this.device = await adapter.requestDevice()
    this.ctx = this.canvas.getContext('webgpu')
    const format = navigator.gpu.getPreferredCanvasFormat()

    this.ctx.configure({ device: this.device, format })

    // Pipelines (rect y text)
    this.rectPipeline = this.createRectPipeline(format)
    this.textPipeline = this.createTextPipeline(format)

    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    })

    // Conectamos renderer a root
    this.root.setRenderer(this)
    this.markDirty()
  }

  createRectPipeline(format) {
    return this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: this.device.createShaderModule({ code: rectShader }),
        entryPoint: 'vs',
        buffers: [
          {
            arrayStride: 44,
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x2' },
              { shaderLocation: 1, offset: 8, format: 'float32x4' },
              { shaderLocation: 2, offset: 24, format: 'float32x2' },
              { shaderLocation: 3, offset: 32, format: 'float32x2' },
              { shaderLocation: 4, offset: 40, format: 'float32' },
            ],
          },
        ],
      },
      fragment: {
        module: this.device.createShaderModule({ code: rectShader }),
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
  }

  createTextPipeline(format) {
    return this.device.createRenderPipeline({
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
  }

  renderFrame() {
    this.needsRender = false

    const w = (this.canvas.width = innerWidth * this.dpr)
    const h = (this.canvas.height = innerHeight * this.dpr)

    // === Medir y layout ===
    this.root.measure(this.textRenderer)
    this.root.layout(0, 0, w / this.dpr, h / this.dpr)

    const encoder = this.device.createCommandEncoder()
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.ctx.getCurrentTexture().createView(),
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: { r: 1, g: 1, b: 1, a: 1 },
        },
      ],
    })

    // === Dibujar nodos rect ===
    const nodes = this.root
      .getAllViews()
      .filter((n) => !n.isText && n.dirty & DIRTY_RENDER)

    nodes.forEach((n) => {
      const verts = n.getVertices(w / this.dpr, h / this.dpr)
      const buf = this.device.createBuffer({
        size: verts.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      })

      new Float32Array(buf.getMappedRange()).set(verts)

      buf.unmap()

      pass.setPipeline(this.rectPipeline)
      pass.setVertexBuffer(0, buf)
      pass.draw(verts.length / 11)

      n.dirty &= ~DIRTY_RENDER
    })

    // === Dibujar nodos texto ===
    const texts = this.root
      .getAllViews()
      .filter((n) => n.isText && n.dirty & DIRTY_RENDER)

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

      t.dirty &= ~DIRTY_RENDER
    })

    pass.end()

    this.device.queue.submit([encoder.finish()])
  }

  markDirty() {
    if (!this.needsRender) {
      this.needsRender = true
      requestAnimationFrame(() => this.renderFrame())
    }
  }

  onResize() {
    this.dpr = window.devicePixelRatio || 1
    // Marcar toda la escena como sucia
    const markDirtyRecursively = (node) => {
      node.dirty |= DIRTY_MEASURE | DIRTY_LAYOUT | DIRTY_RENDER
      node.childrenArray.forEach(markDirtyRecursively)
    }
    markDirtyRecursively(this.root)

    this.markDirty()
  }
}
