export const textShader = `
  @group(0) @binding(0) var myTex: texture_2d<f32>;
  @group(0) @binding(1) var mySampler: sampler;

  struct VSOut {
    @builtin(position) pos: vec4<f32>,
    @location(0) uv: vec2<f32>
  };

  @vertex fn vs(
    @location(0) pos: vec2<f32>,
    @location(1) uv: vec2<f32>
  ) -> VSOut {
    var out: VSOut;
    out.pos = vec4<f32>(pos, 0.0, 1.0);
    out.uv = uv;
    return out;
  }

  @fragment fn fs(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    return textureSample(myTex, mySampler, uv);
  }
`