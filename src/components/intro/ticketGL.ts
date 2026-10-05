/*
  The ticket's surface on the GPU. One fragment per grain: the canvas is sized to the grain
  grid and scaled up crisp, so each grain stays a hard-edged dot like a risograph print.

  What moves, and why it reads as alive rather than noisy:
  - Ink currents: domain-warped bands run diagonally up the ticket and travel along it,
    so the dark grain flows instead of flickering in place.
  - Dither: each grain has its own threshold that drifts slowly, so edges of the currents
    fizz gently.
  - Glints: rare light grains ride the current and fade.
  - Sheen: a soft band of light crosses the stock every few seconds.
  - Touch: grain parts around the pointer and the stock lightens there.
  - Print-in: grains switch on in a sweep from the left, with a ragged, grainy edge.
*/

const VS = `attribute vec2 aP; void main() { gl_Position = vec4(aP, 0., 1.); }`

const FS = `
precision highp float;
uniform vec2 uGrid;     // grains across, down
uniform float uT;
uniform float uReveal;  // 0..1
uniform vec3 uPtr;      // grain x, grain y, strength 0..1

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + 1.), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0., a = .5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; }
  return v;
}

void main() {
  vec2 g = vec2(gl_FragCoord.x - .5, uGrid.y - gl_FragCoord.y - .5);   // grain, top-left origin
  vec2 uv = (g + .5) / uGrid;                                          // 0..1 across the ticket
  vec2 p = (g + .5) / uGrid.y;                                         // square units
  float h = hash(g);
  float t = uT;

  // print-in: a sweep from the left with a ragged edge
  float k = uv.x * .72 + (1. - uv.y) * .18 + h * .22;
  if (k > uReveal * 1.12) { gl_FragColor = vec4(0.); return; }
  float fresh = smoothstep(uReveal * 1.12 - .08, uReveal * 1.12, k);   // just printed: brighter

  // ink currents: warped diagonal bands travelling up and to the right
  vec2 q = vec2(fbm(p * 1.3 + vec2(t * .05, -t * .03)), fbm(p * 1.3 + vec2(5.2, 1.3) - t * .04));
  vec2 r = vec2(fbm(p * 2.1 + q * 1.8 + vec2(1.7, 9.2) + t * .035), fbm(p * 2.1 + q * 1.8 + vec2(8.3, 2.8) - t * .02));
  float v = p.x * .62 - p.y + r.x * 1.35;
  float band = .5 + .5 * sin(v * 5.2 - t * .55);
  float dark = band * band * 1.12;

  // heavier grain toward the edges, like handled stock
  float edge = max(0., length((uv - vec2(.42, .5)) * vec2(1.5, 1.15)) - .46);
  dark = clamp(dark + edge * 1.1, 0., 1.);

  // touch: grain parts around the pointer
  vec2 d = (g - uPtr.xy) / uGrid.y;
  float lens = exp(-dot(d, d) * 26.) * uPtr.z;
  dark *= 1. - lens * .9;

  // dither: each grain's threshold drifts slowly
  float thr = fract(h * 7.13 + t * (.03 + .07 * hash(g + 3.1)));

  vec3 DARK = vec3(.066, .035, .15);
  vec3 MID = vec3(.17, .085, .45);
  vec3 A = vec3(.31, .16, .83);
  vec3 B = vec3(.41, .23, .95);
  vec3 SPECK = vec3(.76, .67, 1.);
  vec3 base = mix(A, B, smoothstep(.3, .75, fbm(p * 2.2 + vec2(t * .02, 0.))));

  vec3 col = dark > thr * .92 + .08 ? (dark > thr * .6 + .42 ? DARK : MID) : base;

  // glints ride the current: each lives a moment, then another lights elsewhere
  float slot = floor(t * .9 + h * 3.);
  float glint = step(.9935, hash(g + slot * vec2(.31, .17))) * (1. - dark) * (.6 + .4 * sin(fract(t * .9 + h * 3.) * 3.1416));
  col = mix(col, SPECK, glint);

  // sheen: a soft band of light crosses every ~9 seconds
  float sw = fract(t * .11 + .35) * 2.6 - .8;
  float sheen = exp(-pow((uv.x - (1. - uv.y) * .32 - sw) * 6.5, 2.));
  col += sheen * vec3(.07, .06, .1);

  col += lens * vec3(.06, .05, .1);
  col = mix(col, SPECK, fresh * .35);
  gl_FragColor = vec4(col, 1.);
}`

interface TicketGL {
  draw: (t: number, reveal: number, ptr: [number, number, number]) => void
  /** the last drawn frame, one pixel per grain, top row first */
  pixels: () => Uint8Array<ArrayBuffer>
  dispose: () => void
}

/** Sets up the shader on a canvas sized to the grain grid. Null when WebGL isn't available. */
export function createTicketGL(canvas: HTMLCanvasElement, cols: number, rows: number): TicketGL | null {
  canvas.width = cols
  canvas.height = rows
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: false })
  if (!gl) return null
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null
  }
  const vs = sh(gl.VERTEX_SHADER, VS)
  const fs = sh(gl.FRAGMENT_SHADER, FS)
  if (!vs || !fs) return null
  const prog = gl.createProgram()!
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  gl.useProgram(prog)
  const buf = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'aP')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  const u = (n: string) => gl.getUniformLocation(prog, n)
  const uT = u('uT')
  const uReveal = u('uReveal')
  const uPtr = u('uPtr')
  gl.uniform2f(u('uGrid'), cols, rows)
  gl.viewport(0, 0, cols, rows)
  gl.clearColor(0, 0, 0, 0)

  let last: [number, number, [number, number, number]] = [0, 0, [0, 0, 0]]
  const draw = (t: number, reveal: number, ptr: [number, number, number]) => {
    last = [t, reveal, ptr]
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform1f(uT, t)
    gl.uniform1f(uReveal, reveal)
    gl.uniform3f(uPtr, ptr[0], ptr[1], ptr[2])
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
  return {
    draw,
    pixels: () => {
      // redraw and read in the same task, so the frame is still in the buffer
      draw(...last)
      const raw = new Uint8Array(cols * rows * 4)
      gl.readPixels(0, 0, cols, rows, gl.RGBA, gl.UNSIGNED_BYTE, raw)
      const out = new Uint8Array(raw.length)
      const row = cols * 4
      for (let y = 0; y < rows; y++) out.set(raw.subarray((rows - 1 - y) * row, (rows - y) * row), y * row)
      return out
    },
    dispose: () => {
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
