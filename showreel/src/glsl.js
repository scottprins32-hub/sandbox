// Shared GLSL: palette, hashing, value-noise fbm and the domain-warped fluid
// field used by both the glass dive (05) and the shader chapter (06).
import { C, glc } from "./core.js";

const v3 = (hex) => `vec3(${glc(hex).map((x) => x.toFixed(4)).join(",")})`;

export const PALETTE = `
const vec3 INK = ${v3(C.ink)};
const vec3 PAPER = ${v3(C.paper)};
const vec3 EMBER = ${v3(C.ember)};
const vec3 COBALT = ${v3(C.cobalt)};
const vec3 SUN = ${v3(C.sun)};
`;

export const NOISE = `
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6. - 15.) + 10.);
  float a = h21(i), b = h21(i + vec2(1, 0)), c = h21(i + vec2(0, 1)), d = h21(i + vec2(1, 1));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
const mat2 ROT = mat2(.8, .6, -.6, .8);
float fbm(vec2 p){
  float s = 0., a = .5;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = ROT * p * 2.03 + 17.1; a *= .5; }
  return s;
}
`;

// f in 0..1, plus the warp vectors q and r for colouring
export const FLUID = `
float fluidField(vec2 p, float t, out vec2 q, out vec2 r){
  q = vec2(fbm(p + vec2(0., 0.) + .09 * t), fbm(p + vec2(5.2, 1.3) - .07 * t));
  r = vec2(fbm(p + 3.6 * q + vec2(1.7, 9.2) + .16 * t), fbm(p + 3.6 * q + vec2(8.3, 2.8) - .13 * t));
  return fbm(p + 3.1 * r);
}
vec3 fluidColor(float f, vec2 q, vec2 r){
  vec3 c = mix(INK, COBALT, smoothstep(.18, .52, f));
  c = mix(c, EMBER, smoothstep(.34, .82, dot(q, q) * f * 1.9));
  c = mix(c, SUN, smoothstep(.52, .92, r.x * f * 2.2));
  c = mix(c, PAPER, smoothstep(.7, .95, f * f * 1.55));
  return c;
}
vec3 fluid(vec2 px, vec2 res, float t, float scale){
  vec2 p = (px - .5 * res) / res.y * scale;
  vec2 q, r;
  float f = fluidField(p, t, q, r);
  return fluidColor(f, q, r);
}
`;
