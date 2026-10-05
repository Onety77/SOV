import type { Snapshot } from '@/components/intro/Ticket'
import { inside } from '@/components/intro/ticketTexture'

/*
  WebGL particles for the way in. Every particle starts as one grain of the ticket, exactly
  where it sat on screen, square and in its own colour, so the hand-off from the real
  ticket is invisible. Then one quiet gesture:

  - The stub is admitted: it slides a few pixels away from the perforation and fades.
  - The ticket dissolves into its grain, starting at the tear: each grain drifts a little
    toward you and up the page, softens to a dot, and fades. No glow, no spin, no flash.
*/

export const BEATS = { navigate: 0.55, reveal: 0.6, end: 1.2 } as const

const VS = `
attribute vec2 aStart;
attribute vec3 aColor;
attribute vec4 aRand;
attribute float aText;
uniform float uT;
uniform vec2 uRes;
uniform float uSize;
uniform float uDpr;
uniform float uTear;
varying vec3 vColor;
varying float vAlpha;
varying float vE;
const float D = 900.0;
void main() {
  float t = uT;
  vec2 center = uRes * .5;
  vec3 p = vec3(aStart - center, 0.);
  bool stub = aStart.x > uTear;

  // the stub tears away first: a short slide right, gone in a moment
  float ks = smoothstep(0., .35, t);
  // the ticket dissolves from the tear outward, each grain on its own short drift
  float k = clamp((t - .08 - aRand.x) / .62, 0., 1.);
  float e = 1. - pow(1. - k, 3.);

  if (stub) p.x += ks * (18. + 10. * aRand.w);
  // a shared drift up and to the right, each grain wandering a little off it
  vec2 wander = vec2(cos(aRand.y * 6.2832), sin(aRand.y * 6.2832)) * (6. + 16. * aRand.w);
  p.xy += e * (vec2(16., -14.) + wander);
  p.z += e * (120. + 160. * aRand.w);

  float s = D / (D - p.z);
  vec2 sc = center + p.xy * s;
  vec2 clip = sc / uRes * 2. - 1.;
  gl_Position = vec4(clip.x, -clip.y, 0., 1.);
  gl_PointSize = uSize * mix(1., .7, e) * s * uDpr;

  vColor = aColor;
  vAlpha = stub ? 1. - ks : 1. - smoothstep(.15, 1., k);
  vE = e;
}`

const FS = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
varying float vE;
void main() {
  float d = length(gl_PointCoord - .5);
  float a = mix(1., smoothstep(.5, .2, d), vE) * vAlpha;
  gl_FragColor = vec4(vColor * a, a);
}`

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
  const data = src.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, src.width, src.height).data
  const total = src.width * src.height
  const budget = W < 700 ? 14000 : 30000
  const keep = Math.min(1, budget / total)
  const tearX = rect.left + rect.width * 0.79
  const far = rect.width * 0.85
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
      // the stub goes first, then the tear runs left across the ticket
      const fromTear = sx > tearX ? ((sx - tearX) / far) * 0.25 : (tearX - sx) / far
      rand.push(Math.min(0.32, fromTear * 0.3) + Math.random() * 0.06, Math.atan2(sy - H / 2, sx - W / 2) + (Math.random() - 0.5) * 1.3, Math.random(), Math.random())
      text.push(isText)
    }
  }
  const n = text.length
  const size = cell * Math.sqrt(1 / keep) * 1.08

  const link = (vs: string, fs: string) => {
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error((gl.getShaderInfoLog(sh) ?? 'shader') + (gl.isContextLost() ? ' (context lost)' : ''))
      return sh
    }
    const pr = gl.createProgram()!
    gl.attachShader(pr, compile(gl.VERTEX_SHADER, vs))
    gl.attachShader(pr, compile(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(pr)
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error('link')
    return pr
  }
  let prog: WebGLProgram
  try {
    prog = link(VS, FS)
  } catch (e) {
    if (import.meta.env.DEV) console.error('warp shader', e)
    return null
  }

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

  gl.useProgram(prog)
  const u = (name: string) => gl.getUniformLocation(prog, name)
  gl.uniform2f(u('uRes'), W, H)
  gl.uniform1f(u('uSize'), size)
  gl.uniform1f(u('uDpr'), dpr)
  gl.uniform1f(u('uTear'), tearX)
  const uT = u('uT')
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  gl.disable(gl.DEPTH_TEST)
  gl.clearColor(0, 0, 0, 0)
  for (const a of attrs) {
    if (a.loc < 0) continue // an attribute the shader doesn't read
    gl.bindBuffer(gl.ARRAY_BUFFER, a.buf)
    gl.enableVertexAttribArray(a.loc)
    gl.vertexAttribPointer(a.loc, a.size, gl.FLOAT, false, 0, 0)
  }

  return {
    draw: (t) => {
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1f(uT, t)
      gl.drawArrays(gl.POINTS, 0, n)
    },
    dispose: () => {
      buffers.forEach((b) => gl.deleteBuffer(b))
      gl.deleteProgram(prog)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
