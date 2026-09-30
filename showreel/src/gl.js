// WebGL2 compositor: scene layers → linear-light motion-blur accumulation →
// bloom → lens/CA/grade/grain → 8-bit output.
import { W, H } from "./core.js";

const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;

const HEAD = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
`;

const ACCUM = HEAD + `
uniform sampler2D uGL, u2D;
uniform float uHasGL, uHas2D, uW;
uniform vec4 uXf; // zoom, rotation, shift x px, shift y px
const vec2 R = vec2(${W}., ${H}.);
void main(){
  vec2 q = (uv - .5) * R - uXf.zw;
  float c = cos(-uXf.y), s = sin(-uXf.y);
  q = mat2(c, s, -s, c) * q / uXf.x;
  vec2 p = q / R + .5;
  vec3 base = uHasGL > .5 ? texture(uGL, p).rgb : vec3(0.);
  vec4 top = uHas2D > .5 ? texture(u2D, vec2(p.x, 1. - p.y)) : vec4(0.);
  vec3 col = base * (1. - top.a) + top.rgb;
  col = pow(max(col, 0.), vec3(2.2));
  o = vec4(col * uW, uW);
}`;

const PREFILTER = HEAD + `
uniform sampler2D uSrc; uniform vec2 uTexel; uniform float uThr;
void main(){
  vec3 c = vec3(0.);
  c += texture(uSrc, uv + uTexel * vec2(-1., -1.)).rgb;
  c += texture(uSrc, uv + uTexel * vec2( 1., -1.)).rgb;
  c += texture(uSrc, uv + uTexel * vec2(-1.,  1.)).rgb;
  c += texture(uSrc, uv + uTexel * vec2( 1.,  1.)).rgb;
  c *= .25;
  float br = max(c.r, max(c.g, c.b));
  float knee = uThr * .5;
  float soft = clamp(br - uThr + knee, 0., 2. * knee);
  soft = soft * soft / (4. * knee + 1e-4);
  float contrib = max(soft, br - uThr) / max(br, 1e-4);
  o = vec4(c * contrib, 1.);
}`;

const DOWN = HEAD + `
uniform sampler2D uSrc; uniform vec2 uTexel;
void main(){
  vec3 c = texture(uSrc, uv).rgb * 4.;
  c += texture(uSrc, uv + uTexel * vec2(-1., -1.)).rgb;
  c += texture(uSrc, uv + uTexel * vec2( 1., -1.)).rgb;
  c += texture(uSrc, uv + uTexel * vec2(-1.,  1.)).rgb;
  c += texture(uSrc, uv + uTexel * vec2( 1.,  1.)).rgb;
  o = vec4(c / 8., 1.);
}`;

const UP = HEAD + `
uniform sampler2D uSrc; uniform vec2 uTexel;
void main(){
  vec3 c = vec3(0.);
  c += texture(uSrc, uv + uTexel * vec2(-2., 0.)).rgb;
  c += texture(uSrc, uv + uTexel * vec2( 2., 0.)).rgb;
  c += texture(uSrc, uv + uTexel * vec2(0., -2.)).rgb;
  c += texture(uSrc, uv + uTexel * vec2(0.,  2.)).rgb;
  c += texture(uSrc, uv + uTexel * vec2(-1., -1.)).rgb * 2.;
  c += texture(uSrc, uv + uTexel * vec2( 1., -1.)).rgb * 2.;
  c += texture(uSrc, uv + uTexel * vec2(-1.,  1.)).rgb * 2.;
  c += texture(uSrc, uv + uTexel * vec2( 1.,  1.)).rgb * 2.;
  o = vec4(c / 12., 1.);
}`;

const POST = HEAD + `
uniform sampler2D uAcc, uBloom, uHud;
uniform float uTime, uCA, uDistort, uBloomAmt, uVig, uGrain, uFlash, uFlashExp, uFade, uGlitch, uSeed, uHasHud;
uniform vec3 uFlashCol;
const vec2 R = vec2(${W}., ${H}.);
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main(){
  vec2 d = uv - .5;
  vec2 da = d * vec2(R.x / R.y, 1.);
  float r2 = dot(da, da);
  vec2 u = .5 + d * (1. + uDistort * r2);
  // glitch: horizontal slice displacement
  if (uGlitch > 0.) {
    float band = floor(uv.y * 24. + floor(uSeed * 7.));
    float rnd = h12(vec2(band, floor(uSeed * 13.)));
    float on = step(1. - uGlitch * .6, rnd);
    u.x += on * (h12(vec2(band, uSeed)) - .5) * .18 * uGlitch;
  }
  vec2 ca = d * uCA * (.4 + r2 * 2.);
  vec3 c;
  c.r = texture(uAcc, u - ca).r;
  c.g = texture(uAcc, u).g;
  c.b = texture(uAcc, u + ca).b;
  float a = texture(uAcc, u).a;
  c /= max(a, 1e-5);
  c += texture(uBloom, u).rgb * uBloomAmt;
  // exposure flash: light floods in, highlights clip, blacks stay deep
  c = c * (1. + 6. * uFlashExp) + uFlashExp * uFlashExp * .015;
  c = pow(max(c, 0.), vec3(1. / 2.2));
  if (uHasHud > .5) { vec4 hd = texture(uHud, vec2(uv.x, 1. - uv.y)); c = c * (1. - hd.a) + hd.rgb; }
  float v = smoothstep(.35, 1.15, length(d * vec2(1.1, 1.)) * 1.35);
  c *= 1. - uVig * v;
  c *= 1. - uFade;
  c = mix(c, uFlashCol, clamp(uFlash, 0., 1.));
  // film grain, stronger in mids, plus TPDF dither
  vec2 px = uv * R;
  float g = h12(px + fract(uTime * 61.7) * 917.) + h12(px * 1.37 + fract(uTime * 17.3) * 331.) - 1.;
  float lum = dot(c, vec3(.299, .587, .114));
  c += g * uGrain * (.55 + .45 * (1. - abs(lum * 2. - 1.)));
  c += (h12(px + 71.3) + h12(px * .77 + 11.9) - 1.) / 255.;
  o = vec4(c, 1.);
}`;

export class Compositor {
  constructor(canvas) {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error("WebGL2 unavailable");
    if (!gl.getExtension("EXT_color_buffer_float")) throw new Error("float color buffers unavailable");
    gl.getExtension("OES_texture_float_linear");
    this.gl = gl;
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.progs = {};
    this.p = {
      accum: this.program(ACCUM),
      pre: this.program(PREFILTER),
      down: this.program(DOWN),
      up: this.program(UP),
      post: this.program(POST),
    };
    this.tex2D = this.texture(W, H, gl.RGBA8);
    this.texBack = this.texture(W, H, gl.RGBA8);
    this.texHud = this.texture(W, H, gl.RGBA8);
    this.scene = this.fbo(W, H, gl.RGBA16F);
    this.aux = this.fbo(W / 2, H / 2, gl.RGBA16F); // half-res field buffer for heavy shaders
    this.acc = this.fbo(W, H, gl.RGBA16F);
    this.bloom = [];
    let w = W, h = H;
    for (let i = 0; i < 6; i++) {
      w = Math.max(1, Math.round(w / 2));
      h = Math.max(1, Math.round(h / 2));
      this.bloom.push(this.fbo(w, h, gl.RGBA16F));
    }
  }

  program(fs) {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(s);
        const lines = src.split("\n").map((l, i) => `${i + 1}: ${l}`).join("\n");
        throw new Error(`shader compile failed: ${log}\n${lines}`);
      }
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, "p");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    p.loc = {};
    return p;
  }

  /** Register a scene shader. Source is the body after the standard header. */
  register(name, src) {
    this.progs[name] = this.program(HEAD + src);
  }

  texture(w, h, fmt) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texStorage2D(gl.TEXTURE_2D, 1, fmt, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    t.w = w;
    t.h = h;
    return t;
  }

  fbo(w, h, fmt) {
    const gl = this.gl;
    const tex = this.texture(w, h, fmt);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("fbo incomplete");
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, tex, w, h };
  }

  upload(tex, canvas) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  }

  uniforms(p, u) {
    const gl = this.gl;
    let unit = 0;
    for (const k in u) {
      let loc = p.loc[k];
      if (loc === undefined) loc = p.loc[k] = gl.getUniformLocation(p, k);
      if (loc === null) continue;
      const v = u[k];
      if (typeof v === "number") gl.uniform1f(loc, v);
      else if (v instanceof WebGLTexture) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, v);
        gl.uniform1i(loc, unit++);
      } else if (v && v.fv) {
        gl[`uniform${v.fv}fv`](loc, v.data);
      } else if (v.length === 2) gl.uniform2f(loc, v[0], v[1]);
      else if (v.length === 3) gl.uniform3f(loc, v[0], v[1], v[2]);
      else if (v.length === 4) gl.uniform4f(loc, v[0], v[1], v[2], v[3]);
    }
  }

  draw(p, target, u) {
    const gl = this.gl;
    gl.useProgram(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
    gl.viewport(0, 0, target ? target.w : W, target ? target.h : H);
    this.uniforms(p, u);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // ── per frame ──
  beginFrame() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.acc.fb);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /** Render a registered scene shader into the scene buffer. */
  runScene(name, u) {
    const p = this.progs[name];
    if (!p) throw new Error(`no scene shader ${name}`);
    this.draw(p, this.scene, { ...u, uRes: [W, H], uBack: this.texBack, uAux: this.aux.tex });
  }

  /** Render a registered shader into the half-res aux buffer (uRes stays full-res). */
  runAux(name, u) {
    const p = this.progs[name];
    if (!p) throw new Error(`no aux shader ${name}`);
    this.draw(p, this.aux, { ...u, uRes: [W, H] });
  }

  accumulate({ weight, hasGL, has2D, xf }) {
    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    this.draw(this.p.accum, this.acc, {
      uGL: this.scene.tex,
      u2D: this.tex2D,
      uHasGL: hasGL ? 1 : 0,
      uHas2D: has2D ? 1 : 0,
      uW: weight,
      uXf: xf ?? [1, 0, 0, 0],
    });
    gl.disable(gl.BLEND);
  }

  endFrame(post, hudCanvas) {
    const B = this.bloom;
    const src = this.acc;
    if (post.bloom > 0) {
      this.draw(this.p.pre, B[0], { uSrc: src.tex, uTexel: [1 / src.w, 1 / src.h], uThr: post.bloomThr ?? 0.8 });
      for (let i = 1; i < B.length; i++) this.draw(this.p.down, B[i], { uSrc: B[i - 1].tex, uTexel: [1 / B[i - 1].w, 1 / B[i - 1].h] });
      const gl = this.gl;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      for (let i = B.length - 1; i > 0; i--) this.draw(this.p.up, B[i - 1], { uSrc: B[i].tex, uTexel: [1 / B[i].w, 1 / B[i].h] });
      gl.disable(gl.BLEND);
    }
    if (hudCanvas) this.upload(this.texHud, hudCanvas);
    this.draw(this.p.post, null, {
      uAcc: src.tex,
      uBloom: B[0].tex,
      uHud: this.texHud,
      uHasHud: hudCanvas ? 1 : 0,
      uTime: post.time ?? 0,
      uCA: post.ca ?? 0,
      uDistort: post.distort ?? 0,
      uBloomAmt: post.bloom ?? 0,
      uVig: post.vignette ?? 0.25,
      uGrain: post.grain ?? 0.035,
      uFlash: post.flash ?? 0,
      uFlashExp: post.flashExp ?? 0,
      uFlashCol: post.flashColor ?? [1, 1, 1],
      uFade: post.fade ?? 0,
      uGlitch: post.glitch ?? 0,
      uSeed: post.seed ?? 0,
    });
  }

  read(buf) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    return buf;
  }
}
