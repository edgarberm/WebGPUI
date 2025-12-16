# WebGPUI

> Experimental UI & layout engine built directly on top of **WebGPU**.

WebGPUI is a **research / playground project** that explores how a modern, declarative UI system (inspired by SwiftUI / Compose) can be implemented **from scratch** using WebGPU, without relying on DOM, Canvas 2D, or existing UI frameworks.

This repository is not a finished framework. It is a **living experiment** focused on architecture, layout, rendering pipelines, and API design.

---

## ✨ Goals

* Explore **retained-mode UI** concepts on top of WebGPU
* Implement a **two-pass layout system** (measure → layout)
* Experiment with **stack-based layouts** (VStack / HStack)
* Render everything via **GPU pipelines**, not DOM
* Keep the codebase **small, readable, and hackable**

Non-goals (for now):

* Production readiness
* Stable APIs
* Full widget set
* Accessibility, i18n, input handling, etc.

---

## 🧠 Core Concepts

### Declarative Views

UI is described using a tree of `View` objects:

```js
new VStack()
  .spacing(16)
  .padding(20)
  .children(
    new Text('Hello WebGPU').font(28).fontWeight('bold'),
    new View().frame({ width: 300, height: 20 })
  )
```

### Two-Pass Layout

Layout follows a **measure → layout** model:

1. **Measure pass**: each view computes its intrinsic size
2. **Layout pass**: available space is resolved top-down

This mirrors how real UI frameworks work and avoids one-pass hacks.

### No DOM Rendering

* No HTML elements
* No CSS layout
* No Canvas 2D rendering for UI

Everything ends up as **vertex buffers + GPU pipelines**.

---

## 🧪 Current State

What currently works:

* Basic `View` abstraction
* `VStack`, `HStack`, `ZStack` and `Text`
* Padding, spacing, fixed frames
* Text rasterization via offscreen canvas → GPU textures
* WebGPU render loop

What is still experimental / incomplete:

* Text rendering pipeline (actively evolving)
* Texture batching & atlasing
* Proper clipping & overflow
* Input / events
* Performance optimizations

Expect things to break, change, or disappear.

---

## 🚧 Project Status

This project is:

* ✅ Public
* ✅ Open for learning, forking and experimentation
* ❌ Not production-ready
* ❌ Not API-stable

If you are looking for a UI framework to ship an app today, this is **not it**.
If you are curious about **how UI frameworks work internally**, this repo is for you.

---

## 📄 License

MIT License.

You are free to use, modify and redistribute this code, including for commercial purposes.
See the `LICENSE` file for details.

---

## 🙋‍♂️ Author

Created by **Edgar Bermejo**.

This repo exists primarily as a personal research project, but contributions, discussions and ideas are welcome.

---

## ⚠️ Disclaimer

This code is provided **as-is**, without warranties of any kind.
APIs, structure and concepts may change at any time.

Use it to learn, experiment and explore WebGPU-based UI systems.
