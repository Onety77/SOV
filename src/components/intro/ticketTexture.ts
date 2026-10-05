/*
  The ticket's surface: violet stock with diagonal drifts of dark grain, like ink pulled
  across a risograph. Rendered at one pixel per grain (1.5–2 CSS pixels) and scaled up crisp, so the
  grain reads as grain. Each frame is a few array passes; the threshold of every pixel
  drifts slowly, so the grain shimmers instead of flickering.

  `reveal` (0–1) prints the ticket in: pixels switch on in a scattered order, the same way
  the particles leave it on the way out.
*/

/** CSS pixels per grain: finer on phones, where the ticket is small and held close */
export const cellFor = (width: number) => (width < 520 ? 1.5 : 2)

// value noise
const P = new Uint8Array(512)
{
  let s = 1337
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const p = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255]
}
const fade = (t: number) => t * t * (3 - 2 * t)
function noise(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const X = xi & 255
  const Y = yi & 255
  const a = P[P[X] + Y] / 255
  const b = P[P[X + 1] + Y] / 255
  const c = P[P[X] + Y + 1] / 255
  const d = P[P[X + 1] + Y + 1] / 255
  const u = fade(xf)
  const v = fade(yf)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

const rgba = (r: number, g: number, b: number) => (255 << 24) | (b << 16) | (g << 8) | r // little-endian ABGR

const DARK = rgba(17, 9, 38)
const MID = rgba(43, 21, 112)
const BASE_A = rgba(82, 42, 214)
const BASE_B = rgba(101, 56, 240)
const SPECK = rgba(170, 140, 255)

interface Texture {
  w: number
  h: number
  image: ImageData
  render: (t: number, reveal?: number) => ImageData
}

export function createTexture(w: number, h: number): Texture {
  const image = new ImageData(w, h)
  const out = new Uint32Array(image.data.buffer)
  const n = w * h
  // per-pixel constants: threshold seed, shimmer rate, reveal order, speck chance
  const seed = new Float32Array(n)
  const rate = new Float32Array(n)
  const order = new Float32Array(n)
  let s = 7
  const rnd = () => ((s = (s * 48271) % 2147483647) / 2147483647)
  for (let i = 0; i < n; i++) {
    seed[i] = rnd()
    rate[i] = 0.15 + rnd() * 0.5
    order[i] = rnd()
  }
  const inv = 1 / h

  const render = (t: number, reveal = 1) => {
    for (let y = 0; y < h; y++) {
      const Y = y * inv
      for (let x = 0; x < w; x++) {
        const i = y * w + x
        if (order[i] > reveal) {
          out[i] = 0
          continue
        }
        const X = x * inv
        // warped diagonal bands rising to the right
        const warp = noise(X * 1.7 + t * 0.05, Y * 1.7 - t * 0.04) * 0.65 + noise(X * 4.1 - t * 0.03, Y * 4.1) * 0.35
        const v = X * 0.62 - Y + warp * 1.1
        const band = Math.sin(v * 5.2 + t * 0.22) * 0.5 + 0.5
        // heavier grain toward the corners, like the stock was handled there
        const edge = Math.max(0, Math.hypot(X / (w * inv) - 0.45, Y - 0.5) * 1.5 - 0.35)
        const dark = Math.min(1, band * band * 1.15 + edge * 0.6)
        let thr = seed[i] + t * rate[i] * 0.12
        thr -= Math.floor(thr)
        if (dark > thr * 0.92 + 0.08) out[i] = dark > thr * 0.6 + 0.42 ? DARK : MID
        else if (seed[i] > 0.985 - (1 - dark) * 0.02) out[i] = SPECK
        else out[i] = noise(X * 2.3, Y * 2.3 + t * 0.02) > 0.5 ? BASE_B : BASE_A
      }
    }
    return image
  }

  return { w, h, image, render }
}

/** Ticket outline: notches at the four corners and where the stub tears off. */
export const shape = (w: number, h: number) => {
  const r = Math.max(8, Math.round(h * 0.035))
  const perfX = Math.round(w * 0.79)
  const pr = Math.round(r * 1.25)
  return {
    r,
    perfX,
    pr,
    /** circles cut out of the rectangle */
    cuts: [
      [0, 0, r],
      [w, 0, r],
      [0, h, r],
      [w, h, r],
      [perfX, 0, pr],
      [perfX, h, pr],
    ] as [number, number, number][],
  }
}

export const inside = (x: number, y: number, cuts: [number, number, number][]) => cuts.every(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 > r * r)
