// 05 — 3D / GLASS: a raymarched glass blob in front of kinetic marquee type.
// Two refractions (in and out), so the type behind it inverts like it would
// through a real glass ball; dispersion, Beer–Lambert tint, studio softbox
// reflections, a floating shadow with a caustic. Satellites bud off and slam
// back in on the half-time hits, then the camera dives into the glass.
import { W, H, b, bp, E, C, clamp, lerp, prog, TAU, wobble } from "../core.js";
import { layout, glyph } from "../type.js";
import { PALETTE, NOISE, FLUID } from "../glsl.js";

const cx = W / 2, cy = H / 2;

const SHADER = `
uniform vec2 uRes;
uniform sampler2D uBack;
uniform float uTime, uR, uDisp, uFluid, uAbs, uFt;
uniform vec2 uC;
uniform vec3 uSquash, uRot;
uniform vec4 uS1, uS2, uS3;
${PALETTE}
${NOISE}
${FLUID}
mat3 rotXY(vec2 a){
  float cx = cos(a.x), sx = sin(a.x), cy = cos(a.y), sy = sin(a.y);
  return mat3(cy, 0., -sy, 0., 1., 0., sy, 0., cy) * mat3(1., 0., 0., 0., cx, sx, 0., -sx, cx);
}
float smin(float a, float b, float k){ float h = clamp(.5 + .5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
mat3 R;
float map(vec3 p){
  vec3 q = R * p;
  vec3 s = q / uSquash;
  float d = (length(s) - 1.) * min(uSquash.x, min(uSquash.y, uSquash.z));
  float n = sin(q.x * 2.3 + uRot.z * 1.3) * sin(q.y * 2.1 - uRot.z * 1.1) * sin(q.z * 1.9 + uRot.z * .8);
  n += .5 * sin(q.x * 4.1 - uRot.z * .7) * sin(q.z * 3.7 + uRot.z * 1.5);
  d += n * uDisp;
  if (uS1.w > 0.) d = smin(d, length(p - uS1.xyz) - uS1.w, .38);
  if (uS2.w > 0.) d = smin(d, length(p - uS2.xyz) - uS2.w, .38);
  if (uS3.w > 0.) d = smin(d, length(p - uS3.xyz) - uS3.w, .3);
  return d;
}
vec3 nrm(vec3 p){
  const vec2 k = vec2(1., -1.);
  const float h = .002;
  return normalize(k.xyy * map(p + k.xyy * h) + k.yyx * map(p + k.yyx * h) + k.yxy * map(p + k.yxy * h) + k.xxx * map(p + k.xxx * h));
}
vec3 back(vec2 px){ vec2 uv = px / uRes; return texture(uBack, vec2(uv.x, 1. - uv.y)).rgb; }
float box(vec2 a, vec2 c, vec2 s, float soft){ vec2 d = abs(a - c) - s; return 1. - smoothstep(0., soft, max(d.x, d.y)); }
vec3 env(vec3 d){
  vec2 a = vec2(atan(d.x, d.z), asin(clamp(d.y, -1., 1.)));
  vec3 c = mix(vec3(.72, .7, .68), vec3(.98, .96, .93), smoothstep(-.3, .9, d.y));
  c = mix(c, vec3(.16, .15, .15), smoothstep(-.05, -.55, d.y));
  c += 3.2 * box(a, vec2(-.72, .55), vec2(.3, .2), .08);
  c += 1.8 * box(a, vec2(.95, .15), vec2(.1, .42), .06);
  c += .9 * box(a, vec2(0., -.1), vec2(1.4, .05), .2) * vec3(1., .55, .35);
  return c;
}
const float ZB = -4.6;
const float CAM = 4.;
void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 cG = vec2(uC.x, uRes.y - uC.y);
  vec2 q = (frag - cG) / uR;
  R = rotXY(uRot.xy);
  vec3 ro = vec3(0., 0., CAM);
  vec3 rd = normalize(vec3(q, -CAM));
  // floating shadow + caustic on the backdrop
  vec2 qs = vec2(.5, -.62);
  float sh = smoothstep(1.3, .35, length((q - qs) / vec2(1.05, .95)));
  float cau = smoothstep(.5, 0., length((q - qs * 1.08) / vec2(1., .75)));
  float fadeFx = 1. - uFluid;
  vec3 col = back(frag) * (1. - .3 * sh * fadeFx) + cau * cau * .55 * fadeFx * vec3(1., .6, .28);

  // bounding sphere test
  float bR = 2.25;
  float bb = dot(ro, rd), cc = dot(ro, ro) - bR * bR, disc = bb * bb - cc;
  if (disc > 0.) {
    float t = max(-bb - sqrt(disc), 0.);
    float tEnd = -bb + sqrt(disc);
    bool hit = false;
    for (int i = 0; i < 80; i++) {
      float d = map(ro + rd * t);
      if (d < .0012) { hit = true; break; }
      t += d * .92;
      if (t > tEnd) break;
    }
    if (hit) {
      vec3 p = ro + rd * t;
      vec3 n = nrm(p);
      float cosi = clamp(dot(-rd, n), 0., 1.);
      float F = .04 + .96 * pow(1. - cosi, 5.);
      // refraction in
      vec3 r1 = refract(rd, n, 1. / 1.47);
      vec3 p2 = p - n * .004;
      float s = .0;
      for (int i = 0; i < 28; i++) {
        float d = -map(p2 + r1 * s);
        if (d < .0015) break;
        s += max(d, .015);
      }
      vec3 pe = p2 + r1 * s;
      vec3 ne = nrm(pe);
      vec3 r2 = refract(r1, -ne, 1.47);
      if (dot(r2, r2) < .01) r2 = reflect(r1, -ne);
      float k = (ZB - pe.z) / min(r2.z, -.08);
      vec3 X = pe + r2 * k;
      vec2 sq = X.xy * (CAM / (CAM - ZB));
      vec2 pxs = cG + sq * uR;
      vec2 v = pxs - frag;
      vec3 refr = vec3(back(frag + v * 1.045).r, back(frag + v).g, back(frag + v * .955).b);
      vec3 tint = exp(-s * vec3(.1, .55, .95) * uAbs);
      vec3 c = refr * mix(vec3(1.), tint, .72);
      // dive: the inside of the glass becomes the fluid of chapter 06
      if (uFluid > 0.) c = mix(c, fluid(mix(frag + v * .35, frag, uFluid), uRes, uFt, 2.4), uFluid);
      vec3 rf = reflect(rd, n);
      c = mix(c, env(rf), F * .9 * fadeFx);
      vec3 l1 = normalize(vec3(-.6, .6, .8)), l2 = normalize(vec3(.8, .2, .6));
      c += (pow(max(dot(rf, l1), 0.), 180.) * 2.2 + pow(max(dot(rf, l2), 0.), 90.) * .6) * fadeFx;
      c += (1. - cosi) * .1 * vec3(1., .6, .4) * fadeFx;
      col = c;
    }
  }
  if (uFluid > .97) col = mix(col, fluid(frag, uRes, uFt, 2.4), (uFluid - .97) / .03);
  o = vec4(col, 1.);
}`;

let F;
const ROWS = [
  { text: "DEPTH — LIGHT — GLASS — ", y: 262, cap: 150, speed: -210, mode: "stroke", vars: { wght: 700, wdth: 100 } },
  { text: "MOTION DESIGN — MOTION DESIGN — ", y: 610, cap: 250, speed: 170, mode: "fill", vars: { wght: 900, wdth: 125 } },
  { text: "REFRACTION — CAUSTICS — ", y: 918, cap: 150, speed: -250, mode: "stroke", vars: { wght: 700, wdth: 100 } },
];

function marquee(ctx, t) {
  const tl = t - b(16);
  for (const row of ROWS) {
    const size = row.cap / (F.capH / F.upm);
    const L = layout(F, row.text, { size, vars: row.vars, track: 10 });
    let off = (row.speed * tl) % L.width;
    if (off > 0) off -= L.width;
    ctx.fillStyle = C.ink;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    for (let x0 = off - L.width; x0 < W + L.width; x0 += L.width) {
      if (x0 > W || x0 + L.width < 0) continue;
      for (const it of L.items) {
        const x = x0 + it.x;
        if (x > W || x + it.adv < 0 || it.ch === " ") continue;
        glyph(ctx, F, it.ch, L.w, x, row.y + row.cap / 2, size, row.mode);
      }
    }
  }
}

function satellites(t) {
  // bud off at 16.5, orbit, slam back in on the 18 hit, bud again, fold in for the dive
  const out = [];
  const specs = [
    { ph: 0.3, w: 1.9, tilt: 0.5, r: 0.3 },
    { ph: 3.2, w: -1.6, tilt: -0.35, r: 0.24 },
    { ph: 1.7, w: 2.4, tilt: 1.1, r: 0.17 },
  ];
  const away1 = E.outBack(bp(t, 16.35, 17.2), 1.2) * (1 - E.inBack(bp(t, 17.55, 18.0), 1.6));
  const away2 = E.outBack(bp(t, 18.2, 18.9), 1.4) * (1 - E.inCubic(bp(t, 19.2, 19.6)));
  const away = Math.max(away1, away2);
  const tl = t - b(16);
  specs.forEach((s, i) => {
    const a = s.ph + s.w * tl;
    const dist = lerp(0.15, 1.55 + 0.12 * i, away);
    const x = Math.cos(a) * dist, z = Math.sin(a) * dist;
    const y = Math.sin(a * 0.7 + i) * 0.35 * away + z * Math.sin(s.tilt) * 0.3;
    out.push([x, y, z, s.r * clamp(away * 3)]);
  });
  return out;
}

export default {
  id: "s5",
  label: "3D / GLASS",
  t0: b(16),
  t1: b(20),
  samples: 6,
  shutter: 0.6,
  hardIn: true,
  hudAt: (t) => (t < b(19.75) ? "ink" : "paper"),
  post: (t) => ({ bloom: 0.22, bloomThr: 0.92, vignette: 0.28 }),

  init(env) {
    F = env.faces.display;
    env.comp.register("glass", SHADER);
  },

  render(env, t) {
    const { ctx } = env;
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, 0, W, H);
    marquee(ctx, t);
    env.flush2D();
    env.has2D = false;

    const tl = t - b(16);
    const hitA = wobble(t - b(16), 2.6, 3.2), hitB = wobble(t - b(18), 3.0, 3.6);
    const sq = 0.16 * hitA + 0.13 * hitB;
    const dive = E.inExpo(bp(t, 19.35, 20.0));
    const R = lerp(272, 3400, dive);
    const fl = 12 * Math.sin(tl * 1.7) * (1 - dive);
    const s = satellites(t);
    env.gl("glass", {
      uC: [cx, cy + fl],
      uR: R,
      uDisp: 0.035 + 0.05 * bp(t, 18.3, 19.3) + 0.06 * Math.abs(hitA) + 0.05 * Math.abs(hitB),
      uSquash: [1 + sq * 0.6, 1 - sq, 1 + sq * 0.6],
      uRot: [0.35 + 0.2 * Math.sin(tl * 0.8), tl * 0.9, tl * 1.4],
      uS1: s[0],
      uS2: s[1],
      uS3: s[2],
      uAbs: 0.5,
      uFluid: E.inCubic(bp(t, 19.45, 20.0)),
      uFt: t,
      uTime: t,
    });
  },
};
