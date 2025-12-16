export const colorShader = `
  struct VSOut {
    @builtin(position) pos: vec4<f32>,
    @location(0) color: vec4<f32>,
  };

  @vertex fn vs(
    @location(0) pos: vec2<f32>,
    @location(1) color: vec4<f32>
  ) -> VSOut {
    var out: VSOut;
    out.pos = vec4<f32>(pos, 0.0, 1.0);
    out.color = color;
    return out;
  }

  @fragment fn fs(@location(0) color: vec4<f32>) -> @location(0) vec4<f32> {
    return color;
  }
`
