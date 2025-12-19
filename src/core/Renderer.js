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
 * 1️⃣ Re-layout solo cuando sea necesario (pipeline por fases)
 * 2️⃣ Decidir política de píxeles (sub-pixel vs integer + snapping)
 * 3️⃣ Renderer optimizations (batching / instancing básico)
 * 4️⃣ Culling / Clipping / masks
 * 5️⃣ Shadows SDF
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

    const allNodes = this.root.getAllViews()

    // === RECT NODES ===
    allNodes
      .filter((n) => !n.isText)
      .forEach((n) => {
        if (n.dirty & DIRTY_RENDER) {
          n.updateBuffer(this.device, w / this.dpr, h / this.dpr)
        }

        if (n._vertexBuffer) {
          pass.setPipeline(this.rectPipeline)
          pass.setVertexBuffer(0, n._vertexBuffer)
          pass.draw(n._vertices.length / 11)
        }
      })

    // === TEXT NODES ===
    allNodes
      .filter((t) => t.isText)
      .forEach((t) => {
        if (t.dirty & DIRTY_RENDER) {
          t.prepareTexture(this.device, this.textRenderer)
          t.updateBuffer(this.device, w / this.dpr, h / this.dpr)
          t.prepareBindGroup(this.device, this.sampler, this.textPipeline)
        }

        pass.setPipeline(this.textPipeline)
        pass.setBindGroup(0, t.bindGroup)
        pass.setVertexBuffer(0, t._vertexBuffer)
        pass.draw(t._vertices.length / 4)
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
