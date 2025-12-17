import { Zip, ZipDeflate, ZipPassThrough, unzipSync } from 'fflate'

export type ZipBeginMeta = {
  __type: 'zip-begin'
  files: { name: string; size: number; type: string; compress: boolean }[]
}

export type ZipEndMeta = { __type: 'zip-end' }

const DEFAULT_LEVEL: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 = 3
const DEFAULT_CHUNK = 64 * 1024

function isCompressible(name: string, type: string) {
  const ext = name.toLowerCase().split('.').pop() || ''
  const noCompressExt = new Set([
    'jpg', 'jpeg', 'png', 'webp', 'gif',
    'mp4', 'mkv', 'mov', 'avi',
    'mp3', 'aac', 'wav',
    'zip', 'rar', '7z',
    'pdf',
  ])
  if (noCompressExt.has(ext)) return false
  if (type.startsWith('image/') || type.startsWith('audio/') || type.startsWith('video/')) return false
  if (type === 'application/pdf') return false
  return true
}

function u8Concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((s, c) => s + c.byteLength, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const c of chunks) {
    out.set(c, off)
    off += c.byteLength
  }
  return out
}

async function waitForDrain(dc: RTCDataChannel) {
  if (dc.bufferedAmount === 0) return
  const target = 256 * 1024
  dc.bufferedAmountLowThreshold = target
  if (dc.bufferedAmount <= target) return
  await new Promise<void>((resolve) => {
    const onLow = () => { try { dc.removeEventListener('bufferedamountlow', onLow) } catch {}; resolve() }
    dc.addEventListener('bufferedamountlow', onLow)
    // Fallback: timeout in case event isn't supported
    setTimeout(() => { try { dc.removeEventListener('bufferedamountlow', onLow) } catch {}; resolve() }, 200)
  })
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(u8.byteLength)
  new Uint8Array(buf).set(u8)
  return buf
}

async function sendChunked(dc: RTCDataChannel, chunk: Uint8Array, max = DEFAULT_CHUNK) {
  let offset = 0
  while (offset < chunk.byteLength) {
    const part = chunk.subarray(offset, Math.min(offset + max, chunk.byteLength))
    dc.send(toArrayBuffer(part))
    offset += part.byteLength
    if (dc.bufferedAmount > 1024 * 1024) await waitForDrain(dc)
  }
}

// Sends selected files as a ZIP stream over a data channel with per-file compression rules.
export async function sendZipOverDC(files: File[], dc: RTCDataChannel, level = DEFAULT_LEVEL, maxChunk = DEFAULT_CHUNK): Promise<void> {
  // metadata first
  const meta: ZipBeginMeta = {
    __type: 'zip-begin',
    files: files.map(f => ({ name: f.name, size: f.size, type: f.type, compress: isCompressible(f.name, f.type) })),
  }
  dc.send(JSON.stringify(meta))

  // stream ZIP
  const zip = new Zip(async (chunk, final) => {
    if (chunk instanceof Uint8Array) await sendChunked(dc, chunk, maxChunk)
    if (final) {
      const end: ZipEndMeta = { __type: 'zip-end' }
      dc.send(JSON.stringify(end))
    }
  })

  for (const f of files) {
    const compress = isCompressible(f.name, f.type)
    const entry = compress ? new ZipDeflate(f.name, { level: level as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 }) : new ZipPassThrough(f.name)
    zip.add(entry)
    const reader = f.stream().getReader()
    while (true) {
      const { value, done } = await reader.read()
      if (done) { entry.push(new Uint8Array(0), true); break }
      entry.push(value as Uint8Array, false)
    }
  }
  zip.end()
}

export type UnzippedEntry = { name: string; data: Uint8Array }

// Accumulates chunks between zip-begin and zip-end markers, then returns extracted files
export function createZipReceiver(onComplete: (entries: UnzippedEntry[]) => void) {
  let collecting = false
  let parts: Uint8Array[] = []
  // no metadata stored client-side; receiver lists extracted entries

  return function handleMessage(ev: MessageEvent) {
    const data = ev.data
    if (typeof data === 'string') {
      try {
        const msg = JSON.parse(data)
        if (msg && msg.__type === 'zip-begin') {
          collecting = true
          parts = []
        } else if (msg && msg.__type === 'zip-end') {
          if (collecting) {
            const all = u8Concat(parts)
            const unzipped = unzipSync(all)
            const entries: UnzippedEntry[] = []
            for (const name of Object.keys(unzipped)) {
              entries.push({ name, data: unzipped[name] })
            }
            onComplete(entries)
          }
          collecting = false
          parts = []
        }
      } catch {
        // ignore non-JSON control strings
      }
    } else if (data instanceof ArrayBuffer) {
      if (collecting) parts.push(new Uint8Array(data))
    } else if (data instanceof Blob) {
      // Some browsers may deliver as Blob; convert
      if (!collecting) return
      const bufPromise = data.arrayBuffer()
      bufPromise.then((buf) => parts.push(new Uint8Array(buf)))
    }
  }
}
