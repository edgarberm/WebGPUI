export const rectShader = `
  struct VSOut {
    @builtin(position) pos: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) fragPos: vec2<f32>,  // Posición del fragmento en el rect
    @location(2) rectSize: vec2<f32>, // Tamaño del rect
    @location(3) cornerRadius: f32,   // Radio de las esquinas
  };

  @vertex fn vs(
    @location(0) pos: vec2<f32>,
    @location(1) color: vec4<f32>,
    @location(2) fragPos: vec2<f32>,
    @location(3) rectSize: vec2<f32>,
    @location(4) cornerRadius: f32
  ) -> VSOut {
    var out: VSOut;
    out.pos = vec4<f32>(pos, 0.0, 1.0);
    out.color = color;
    out.fragPos = fragPos;
    out.rectSize = rectSize;
    out.cornerRadius = cornerRadius;
    return out;
  }

  // SDF para rectángulo con esquinas redondeadas
  fn sdRoundedBox(p: vec2<f32>, size: vec2<f32>, radius: f32) -> f32 {
    let q = abs(p) - size + radius;
    return length(max(q, vec2<f32>(0.0))) + min(max(q.x, q.y), 0.0) - radius;
  }

  @fragment fn fs(input: VSOut) -> @location(0) vec4<f32> {
    // Centro del rect
    let center = input.rectSize * 0.5;
    
    // Posición relativa al centro
    let p = input.fragPos - center;
    
    // Calcular distancia al borde usando SDF
    let dist = sdRoundedBox(p, input.rectSize * 0.5, input.cornerRadius);
    
    // Anti-aliasing suave más preciso
    // Usamos derivadas para calcular el tamaño del píxel en coordenadas locales
    let pixelSize = length(vec2<f32>(dpdx(p.x), dpdy(p.y)));
    
    // Anti-aliasing en aproximadamente 1 píxel
    //let alpha = 1.0 - smoothstep(-pixelSize, pixelSize, dist);

    // Smoothstep doble (más natural, tipo iOS)
    let t = clamp(-dist / (pixelSize * 2.5), 0.0, 1.0);
    let alpha = smoothstep(0.0, 1.0, t);
    
    // Aplicar alpha al color
    return vec4<f32>(input.color.rgb, input.color.a * alpha);
  }
`