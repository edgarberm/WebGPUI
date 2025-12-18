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
  let center = input.rectSize * 0.5;
  let p = input.fragPos - center;

  let dist = sdRoundedBox(
    p,
    input.rectSize * 0.5,
    input.cornerRadius
  );

  // AA correcto en espacio de pantalla
  let aa = fwidth(dist);

  // Suavizado solo hacia fuera (sin bleeding)
  let alpha = clamp(0.5 - dist / aa, 0.0, 1.0);

  return vec4<f32>(
    input.color.rgb,
    input.color.a * alpha
  );
}

`
