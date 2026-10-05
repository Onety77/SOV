import type { Snapshot } from '@/components/intro/Ticket'
import { inside } from '@/components/intro/ticketTexture'

/*
  WebGL particles for the way in. Every particle starts as one grain of the ticket, exactly
  where it was on screen, square and in its own colour. Starting from the perforation, they
  peel away on bowed 3D paths into a tilted ring that spins faster and faster, turning violet
  and luminous as they go. The ring then swings face-on and rushes at the camera: we fly
  through it. All motion is computed in the vertex shader from one time uniform.
*/

const VS = `
attribute vec2 aStart;
attribute vec3 aColor;
attribute vec4 aRand;
attribute float aText;
uniform float uT;
uniform vec2 uRes;
uniform float uR;
uniform float uSize;
uniform float uDpr;
varying vec3 vColor;
varying float vAlpha;
varying float vE;
const float D = 900.0;
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1., 0., 0., 0., c, s, 0., -s, c); }
void main() {
  vec2 center = uRes * 0.5;
  float k = clamp((uT - aRand.x) / 1.05, 0., 1.);
  float e = k < .5 ? 4. * k * k * k : 1. - pow(-2. * k + 2., 3.) / 2.;
  vec3 p0 = vec3(aStart - center, 0.);

  float spin = uT * 1.5 + uT * uT * 1.1;
  float th = aRand.y + spin * (0.7 + aRand.w * 0.6);
  float r = uR * (0.84 + aRand.z * 0.3);
  vec3 ring = vec3(cos(th) * r, (aRand.z - .5) * uR * 0.09, sin(th) * r);
  ring = rotX(mix(1.0, 1.5708, smoothstep(0.9, 2.0, uT))) * ring;
  float dive = smoothstep(1.25, 2.35, uT);
  ring.z += dive * dive * D * 1.3;

  vec3 p = mix(p0, ring, e);
  p.z += sin(e * 3.14159) * (140. + 260. * aRand.w);
  float s = D / max(D - p.z, 1.);
  vec2 sc = center + p.xy * s;
  vec2 clip = sc / uRes * 2. - 1.;
  gl_Position = vec4(clip.x, -clip.y, 0., 1.);
  gl_PointSize = min(uSize * mix(1., .55 + aRand.w * .6, e) * s, 56.) * uDpr;

  vec3 glow = mix(vec3(.47, .3, .96), vec3(.82, .74, 1.), aRand.w * aRand.w * aRand.w);
  vColor = mix(aColor, glow, smoothstep(.05, .75, e) * (1. - aText * .4));
  vAlpha = (1. - smoothstep(D * .5, D * .97, p.z)) * (1. - smoothstep(2.05, 2.45, uT));
  vE = e;
}`

const FS = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
varying float vE;
void main() {
  float d = length(gl_PointCoord - .5);
  float a = mix(1., smoothstep(.5, .15, d), smoothstep(0., .3, vE)) * vAlpha;
  float light = smoothstep(.1, .6, vE);
  gl_FragColor = vec4(vColor * a * mix(1., .5, light), a * (1. - light * .85));
}`

// a full-screen quad that dims what's already drawn, so spinning particles leave trails
const FADE_VS = `attribute vec2 aP; void main() { gl_Position = vec4(aP, 0., 1.); }`
const FADE_FS = `precision mediump float; uniform float uK; void main() { gl_FragColor = vec4(0., 0., 0., uK); }`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader')
  return sh
}

interface Run {
  draw: (t: number) => void
  dispose: () => void
}

/** Sets up the particles from a ticket snapshot. Returns null when WebGL isn't available. */
export function createParticles(canvas: HTMLCanvasElement, snap: Snapshot): Run | null {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true })
  if (!gl) return null
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const W = window.innerWidth
  const H = window.innerHeight
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)

  // pick particles from the snapshot
  const { canvas: src, rect, cell, cuts } = snap
  const data = src.getContext('2d')!.getImageData(0, 0, src.width, src.height).data
  const total = src.width * src.height
  const budget = W < 700 ? 11000 : 24000
  const keep = Math.min(1, budget / total)
  const tearX = rect.left + rect.width * 0.79
  const tearY = rect.top + rect.height * 0.5
  const far = Math.hypot(rect.width, rect.height) * 0.8
  const start: number[] = []
  const color: number[] = []
  const rand: number[] = []
  const text: number[] = []
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const i = (y * src.width + x) * 4
      if (data[i + 3] < 128 || !inside(x * cell + cell / 2, y * cell + cell / 2, cuts)) continue
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const isText = r > 200 && g > 200 && b > 200 ? 1 : 0
      if (!isText && Math.random() > keep) continue
      const sx = rect.left + x * cell + cell / 2
      const sy = rect.top + y * cell + cell / 2
      start.push(sx, sy)
      color.push(r / 255, g / 255, b / 255)
      const dist = Math.hypot(sx - tearX, sy - tearY) / far
      const ang = Math.atan2(sy - H / 2, sx - W / 2)
      rand.push(Math.min(0.5, dist * 0.42) + Math.random() * 0.1, ang + (Math.random() - 0.5) * 1.2, Math.random(), Math.random())
      text.push(isText)
    }
  }
  const n = text.length
  const size = cell * Math.sqrt(1 / keep) * 1.08

  const link = (vs: string, fs: string) => {
    const pr = gl.createProgram()!
    gl.attachShader(pr, compile(gl, gl.VERTEX_SHADER, vs))
    gl.attachShader(pr, compile(gl, gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(pr)
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error('link')
    return pr
  }
  let prog: WebGLProgram
  let fade: WebGLProgram
  try {
    prog = link(VS, FS)
    fade = link(FADE_VS, FADE_FS)
  } catch {
    return null
  }
  const quad = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const fadeP = gl.getAttribLocation(fade, 'aP')
  const fadeK = gl.getUniformLocation(fade, 'uK')
  gl.useProgram(prog)
  const buffers: WebGLBuffer[] = []
  const attrs: { loc: number; buf: WebGLBuffer; size: number }[] = []
  const attr = (name: string, arr: number[], sizeN: number) => {
    const buf = gl.createBuffer()!
    buffers.push(buf)
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW)
    attrs.push({ loc: gl.getAttribLocation(prog, name), buf, size: sizeN })
  }
  attr('aStart', start, 2)
  attr('aColor', color, 3)
  attr('aRand', rand, 4)
  attr('aText', text, 1)
  const bindParticles = () => {
    gl.useProgram(prog)
    gl.disableVertexAttribArray(fadeP)
    for (const a of attrs) {
      gl.bindBuffer(gl.ARRAY_BUFFER, a.buf)
      gl.enableVertexAttribArray(a.loc)
      gl.vertexAttribPointer(a.loc, a.size, gl.FLOAT, false, 0, 0)
    }
  }
  const u = (name: string) => gl.getUniformLocation(prog, name)
  gl.uniform2f(u('uRes'), W, H)
  gl.uniform1f(u('uR'), Math.min(W, H) * (W < 700 ? 0.36 : 0.3))
  gl.uniform1f(u('uSize'), size)
  gl.uniform1f(u('uDpr'), dpr)
  const uT = u('uT')
  bindParticles()
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  gl.disable(gl.DEPTH_TEST)
  gl.clearColor(0, 0, 0, 0)

  return {
    draw: (t) => {
      // crisp while it's still a ticket; trails once it's spinning
      const trail = t < 0.55 ? 1 : 0.3 + 0.7 * Math.min(1, Math.max(0, (t - 1.7) / 0.5))
      if (trail >= 1) gl.clear(gl.COLOR_BUFFER_BIT)
      else {
        for (const a of attrs) gl.disableVertexAttribArray(a.loc)
        gl.useProgram(fade)
        gl.bindBuffer(gl.ARRAY_BUFFER, quad)
        gl.enableVertexAttribArray(fadeP)
        gl.vertexAttribPointer(fadeP, 2, gl.FLOAT, false, 0, 0)
        gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA)
        gl.uniform1f(fadeK, trail)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      }
      bindParticles()
      gl.uniform1f(uT, t)
      gl.drawArrays(gl.POINTS, 0, n)
    },
    dispose: () => {
      buffers.forEach((b) => gl.deleteBuffer(b))
      gl.deleteBuffer(quad)
      gl.deleteProgram(prog)
      gl.deleteProgram(fade)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
