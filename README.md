# 🧱 WebGPUI

WebGPUI is an experimental UI and layout library built directly on top of WebGPU.

It is not a framework and does not try to abstract the web.
This project exists as a research and learning exercise to explore how a modern UI system can be built without the DOM, without CSS, and without Canvas 2D, using WebGPU as the rendering backend.

## 🎯 Project goals

WebGPUI explores and builds, from scratch:

- A declarative layout system
- A GPU-driven 2D renderer
- A node-based UI model
- A web-native API, not inspired by SwiftUI or React, but by fundamental layout concepts

WebGPUI is not production-ready and has no stable API.

## 🧠 Core concept: Node

All UI is built from a single primitive:

### Node

A Node represents:

- A GPU-rendered rectangle
- An optional container for child nodes
- A unit of layout

There are no specialized node types for stacks or layers.
Layout behavior is defined through modifiers on the same Node type.

### 📐 Declarative layout

Layout is controlled through modifiers applied to a Node.

#### Layout direction

```js
node.direction('vertical')   // 'vertical' | 'horizontal' | 'stack'
```

- vertical → column layout
- horizontal → row layout
- stack → overlapping / stacking

#### Spacing and padding

```js
node
  .spacing(16)
  .padding(24)
```

#### Alignment

```js
node.align('center')       // main axis
node.crossAlign('start')  // cross axis
```

(depending on the chosen direction)

#### 🎨 Visual styling

Background and rounded corners

```js
node
  .background([255, 255, 255, 1])
  .borderRadius(12)
  ```

Colors are defined using RGBA, keeping the API familiar to web developers.

#### 🔤 Text

Text is implemented as a specialized kind of Node:

```js
new Text("Hello WebGPUI")
  .font(24, "system-ui")
  .fontWeight(600)
  .color([0, 0, 0, 1])
```

Internally:

- Text is rasterized using a 2D canvas
- Uploaded as a WebGPU texture
- Rendered as a quad with alpha blending

#### 🔁 Layout pipeline

WebGPUI follows a classic two-pass layout model:

1. Measure pass
Each node computes its intrinsic size.

2. Layout pass
Each node receives an available space and positions its children.

This mirrors how real UI engines work, implemented explicitly and from scratch.

## 🚀 Minimal example

```js
const app = new Node()
  .direction('vertical')
  .spacing(20)
  .padding(40)
  .background([240, 240, 240, 1])
  .children(
    new Text("WebGPUI")
      .font(32)
      .fontWeight(700),

    new Node()
      .frame(200, 100)
      .background([245, 90, 30, 1])
      .borderRadius(16)
  )

new WebGPURenderer(canvas, app)
```

## ⚠️ Project status

WebGPUI is experimental.

#### Currently implemented

✔️ Unified Node model

✔️ Direction-based layout

✔️ Padding, spacing and alignment

✔️ Rounded rectangle rendering on GPU

✔️ Text rendering via WebGPU

✔️ Full GPU render loop


#### Not implemented / work in progress

❌ Events and interaction

❌ Clipping / overflow handling

❌ Text atlases and batching

❌ Buffer and draw call optimization

❌ Stable public API


## 🧪 Who is this for?

WebGPUI is for:

- Developers who want to understand how UI engines work
- People interested in WebGPU and GPU-driven UIs
- Exploration, experimentation and learning

It is not a replacement for React, SwiftUI or any existing UI framework.

## 📦 Installation

```bash
git clone https://github.com/edgarberm/WebGPUI.git
```


**The project is not currently distributed as an npm package.**

## 📜 License

MIT License.

## 👤 Author

Created by Edgar Bermejo
A personal research project focused on UI systems and WebGPU.