// 06 — SHADER: one domain-warped fluid field, four ways to see it. Diagonal
// wipes on each beat swap the rendering style — flow, isolines, halftone,
// datamosh — while the simulation underneath never cuts.
import { W, H, b, bp, E, C, prog, snap, hit } from "../core.js";
import { layout, glyph } from "../type.js";
import { PALETTE, NOISE, FLUID } from "../glsl.js";
import { scramble } from "../hud.js";

// pass 1 (half res): the fluid field itself — colour in rgb, height in a.
// Same GL (y-up) mapping as the glass dive in 05, so the cut is seamless.
const FIELD = `
uniform vec2 uRes;
uniform float uFt, uPulse;
${PALETTE}
${NOISE}
${FLUID}
void main(){
  vec2 px = gl_FragCoord.xy * 2.;
  vec2 p = (px - .5 * uRes) / uRes.y * (2.4 - .25 * uPulse);
  vec2 q, r;
  float f = fluidField(p, uFt, q, r);
  o = vec4(fluidColor(f, q, r), f);
}`;

// pass 2 (full res): four ways of looking at that field
const SHADER = `
uniform vec2 uRes;
uniform sampler2D uAux;
uniform float uW1, uW2, uW3, uRamp, uStep;
${PALETTE}
${NOISE}
float lum(vec3 c){ return dot(c, vec3(.299, .587, .114)); }
vec3 field(vec2 px, out float f){
  vec4 s = texture(uAux, vec2(px.x, uRes.y - px.y) / uRes);
  f = s.a;
  return s.rgb;
}
vec3 modeFlow(vec2 px){ float f; return field(px, f); }
vec3 modeIso(vec2 px){
  float f; vec3 c = field(px, f);
  float v = f * 13.;
  float w = fwidth(v);
  float d = abs(fract(v) - .5);
  float major = step(2.5, mod(floor(v + .5), 3.));
  float line = 1. - smoothstep(w * (.8 + major * 1.2), w * (1.8 + major * 1.6), .5 - d);
  vec3 bg = mix(INK, c, .1 + .12 * smoothstep(.3, .8, f));
  return mix(bg, mix(c * 1.2, PAPER, .2 + .45 * major), line);
}
vec3 modeTone(vec2 px){
  float a = .35, cs = cos(a), sn = sin(a);
  mat2 m = mat2(cs, sn, -sn, cs);
  float cell = 17.;
  vec2 g = m * px / cell;
  vec2 id = floor(g) + .5;
  vec2 cp = transpose(m) * (id * cell);
  float f; vec3 c = field(cp, f);
  float r = (1. - lum(c) * .82) * .62;
  float d = length(g - id);
  float aa = fwidth(d);
  float dot_ = 1. - smoothstep(r - aa, r + aa, d);
  return mix(PAPER, c, dot_);
}
vec3 nearestPal(vec3 c){
  vec3 best = INK; float bd = 1e9;
  vec3 P[5] = vec3[5](INK, PAPER, EMBER, COBALT, SUN);
  for (int i = 0; i < 5; i++){ vec3 e = c - P[i]; float d = dot(e, e); if (d < bd){ bd = d; best = P[i]; } }
  return best;
}
vec3 modeMosh(vec2 px){
  float bs = 7. + 58. * uRamp * uRamp;
  float row = floor(px.y / (bs * 1.5));
  float rnd = h21(vec2(row, uStep));
  if (rnd > .72 - .3 * uRamp) px.x += (h21(vec2(row * 1.7, uStep + 3.)) - .5) * (120. + 520. * uRamp);
  vec2 q = floor(px / bs) * bs + bs * .5;
  float sh = 6. + 34. * uRamp;
  float f;
  vec3 cr = nearestPal(field(q + vec2(sh, 0.), f));
  vec3 cg = nearestPal(field(q, f));
  vec3 cb = nearestPal(field(q - vec2(sh, 0.), f));
  vec3 c = vec3(cr.r, cg.g, cb.b);
  c *= .92 + .08 * step(.5, fract(px.y * .5));
  return c;
}
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float d = (px.x + .55 * px.y) / (uRes.x + .55 * uRes.y);
  vec3 col;
  float edge = 0.;
  // later wipes win; each wipe sweeps its style in from the left
  float e1 = uW1 * 1.1 - d, e2 = uW2 * 1.1 - d, e3 = uW3 * 1.1 - d;
  if (e3 > 0.) { col = modeMosh(px); edge = e3; }
  else if (e2 > 0.) { col = modeTone(px); edge = e2; }
  else if (e1 > 0.) { col = modeIso(px); edge = e1; }
  else col = modeFlow(px);
  float lw = 2.5 / (uRes.x + .55 * uRes.y);
  float ln = 0.;
  for (int k = 0; k < 3; k++) {
    float w = k == 0 ? uW1 : k == 1 ? uW2 : uW3;
    if (w > 0. && w < 1.) ln = max(ln, 1. - smoothstep(lw, lw * 2., abs(w * 1.1 - d)));
  }
  col = mix(col, PAPER, ln);
  o = vec4(col, 1.);
}`;

const CAPTIONS = [
  [20.0, "FIG. A", "DOMAIN-WARPED FLOW"],
  [21.0, "FIG. B", "ISOLINES"],
  [22.0, "FIG. C", "HALFTONE"],
  [23.0, "FIG. D", "DATAMOSH"],
];

let M;

export default {
  id: "s6",
  label: "SHADER",
  t0: b(20),
  t1: b(24),
  samples: 6,
  shutter: 0.5,
  hud: "paper",
  hudAt: (t) => (t >= b(22.1) && t < b(23.1) ? "ink" : "paper"),
  post: (t) => ({ vignette: 0.3, bloom: 0.12, bloomThr: 0.9, glitch: 0.8 * E.inCubic(bp(t, 23.3, 24.0)), ca: 0.012 * E.inCubic(bp(t, 23.0, 24.0)) }),

  init(env) {
    M = env.faces.mono;
    env.comp.register("fluidField", FIELD);
    env.comp.register("fluid", SHADER);
  },

  render(env, t, opts = {}) {
    const { ctx } = env;
    const ramp = bp(t, 23.0, 24.0);
    let pulse = 0;
    for (let k = 21; k < 24; k++) pulse += hit(t - b(k), 7);
    const wipe = (k) => snap(prog(t, b(k), b(k) + 0.24));
    env.comp.runAux("fluidField", { uFt: t + 1.4 * ramp * ramp, uPulse: pulse });
    env.gl("fluid", {
      uW1: wipe(21),
      uW2: wipe(22),
      uW3: wipe(23),
      uRamp: ramp,
      uStep: Math.floor((t - b(23)) / (b(1) / 8)),
    });

    if (opts.caption === false) return;
    // figure caption, bottom centre
    let cap = CAPTIONS[0];
    for (const c of CAPTIONS) if (t >= b(c[0])) cap = c;
    const sp = prog(t, b(cap[0]), b(cap[0]) + 0.2);
    const light = t >= b(22.1) && t < b(23.1);
    const col = light ? C.ink : C.paper;
    const str = `${cap[1]}   ${cap[2]}`;
    const s = scramble(str, sp, Math.floor(t * 60));
    const L = layout(M, s, { size: 16, vars: { wght: 600 }, track: 80 });
    const x0 = W / 2 - L.width / 2, y = H - 112;
    ctx.fillStyle = light ? "rgba(242,237,228,0.9)" : "rgba(14,13,12,0.72)";
    ctx.fillRect(x0 - 22, y - 26, L.width + 44, 40);
    ctx.fillStyle = col;
    for (const it of L.items) if (it.ch !== " ") glyph(ctx, M, it.ch, L.w, x0 + it.x, y, 16);
  },
};
