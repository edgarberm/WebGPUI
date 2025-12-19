# 🎢 WebGPUI

WebGPUI is an experimental UI and layout library built directly on top of WebGPU.

It is **not a framework** and does not try to abstract the web.
This project exists as a research and learning exercise to explore how a modern UI system can be built **without the DOM, without CSS, and without Canvas 2D**, using WebGPU as the rendering backend.

## 🎯 Project goals

WebGPUI explores and builds, from scratch:

- A declarative layout system
- A GPU-driven 2D renderer
- A node-based UI model
- A web-native API inspired by SwiftUI concepts, adapted to feel natural in the web ecosystem

WebGPUI is **not production-ready** and has **no stable API**.

---

## 🧠 Core concepts

WebGPUI is built around **two fundamental building blocks**:

### Node

`Node` is the core layout and rendering primitive.

A Node represents:

- A GPU-rendered rectangle
- A container for child nodes
- A unit of layout and composition

There are no separate stack or container types.
**Layout behavior is configured through modifiers on the same Node type**, similar to how CSS flexbox works.

### Text

`Text` is a specialized node used for rendering text.

It participates fully in layout like any other node, but renders its content using a GPU texture generated from text rasterization.

---

## 📐 Declarative layout

Layout is controlled through modifiers applied to a `Node`.

### Layout direction

```js
.direction('vertical')   // 'vertical' | 'horizontal' | 'stack'
```

`vertical` → column layout (like flex-direction: column)

`horizontal` → row layout (like flex-direction: row)

`stack` → overlapping children (Z-stack–like behavior)


### Spacing and padding

```js
.spacing(16)
.padding(24)
```

`spacing` controls space between children.

`padding` controls inner spacing inside the node.

### Justify & align (flexbox-like)

WebGPUI uses a layout model inspired by CSS flexbox.

```js
.justify('center')  // 'start' | 'end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
.align('center')    // 'start' | 'center' | 'end' | 'stretch'
```

`justify` controls distribution along the main axis.

`align` controls alignment on the cross axis.

Behavior depends on the chosen `direction`.

## 🎨 Visual styling

Background and rounded corners are GPU-rendered.

```js
.background([255, 255, 255, 1])
.borderRadius(12)
```

Colors are defined using RGBA values, keeping the API familiar to web developers.

## 🔤 Text

Text is implemented as a specialized node:

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
- Participates in layout like any other node


## 🔁 Layout pipeline
WebGPUI follows a classic two-pass layout model, similar to real UI engines:

1. **Measure pass**. 
Each node computes its intrinsic size based on content and children.

1. **Layout pass**. 
Each node receives an available space and positions its children according to layout rules.

This pipeline is implemented explicitly and manually, as part of the learning goals of the project.

## 🚀 Minimal example

```js
const app = new Node()
  .direction('vertical')
  .justify('center')
  .align('center')
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

Currently implemented

✅ Unified node-based layout model  
✅ Direction-based layout (vertical / horizontal / stack)  
✅ Flexbox-like justify & align behavior  
✅ Padding and spacing  
✅ Rounded rectangle rendering on GPU  
✅ Text rendering via WebGPU  
✅ Buffer and draw-call optimization  
✅ Dirty / invalidation system (measure, layout, render)

Not implemented / work in progress

❌ Events and interaction  
❌ Clipping / overflow handling  
❌ Text atlases and batching  
❌ Stable public API

## 🧪 Who is this for?

WebGPUI is for:

- Developers who want to understand how UI engines work internally
- People interested in WebGPU and GPU-driven UIs
- Exploration, experimentation and learning

It is not a replacement for React, SwiftUI, or existing UI frameworks.

## 📦 Installation

```bash
git clone https://github.com/edgarberm/WebGPUI.git
```

The project is not currently distributed as an npm package.

## 📜 License
MIT License.

## 👤 Author
Created by Edgar Bermejo
A personal research project focused on UI systems and WebGPU.