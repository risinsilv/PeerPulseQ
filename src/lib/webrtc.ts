import { setOffer, setAnswer, addIceCandidate, onOffer, onCandidates, onAnswer } from './firebase'

const defaultIceServers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
]

export interface MakeOfferOptions {
  iceServers?: RTCIceServer[]
  dataChannelLabel?: string
  onMessage?: (e: MessageEvent) => void
}

export interface OfferHandle {
  pc: RTCPeerConnection
  dc: RTCDataChannel
  offer: RTCSessionDescriptionInit
  unsubscribe: () => void
  opened: Promise<void>
}

// Minimal helper: create an SDP offer and publish it + ICE to RTDB
export async function makeOffer(sessionCode: string, opts: MakeOfferOptions = {}): Promise<OfferHandle> {
  const iceServers = opts.iceServers || defaultIceServers
  const dataChannelLabel = opts.dataChannelLabel || 'data'

  const pc = new RTCPeerConnection({ iceServers })
  const dc = pc.createDataChannel(dataChannelLabel)
  dc.binaryType = 'arraybuffer'
  if (opts.onMessage) dc.onmessage = opts.onMessage

  // Promise resolves when the data channel is open and ready to send
  const opened = new Promise<void>((resolve) => {
    if (dc.readyState === 'open') {
      resolve()
    } else {
      const onOpen = () => {
        try { dc.removeEventListener('open', onOpen) } catch {}
        resolve()
      }
      dc.addEventListener('open', onOpen)
    }
  })

  // Publish ICE candidates via helper (stored under candidates/caller)
  pc.onicecandidate = (e) => {
    if (!e.candidate) return
    try { addIceCandidate(sessionCode, 'caller', e.candidate.toJSON()) } catch {}
  }

  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)

  // Publish offer using helper to sessions/{code}/offer
  await setOffer(sessionCode, offer)

  // Listen for callee ICE candidates and add to connection
  const unsubCalleeCands = onCandidates(sessionCode, 'callee', async (list) => {
    for (const c of list) {
      try { await pc.addIceCandidate(c) } catch {}
    }
  })

  // Apply callee answer when available
  const unsubAnswer = onAnswer(sessionCode, async (answer) => {
    if (answer && !pc.currentRemoteDescription) {
      try { await pc.setRemoteDescription(answer) } catch {}
    }
  })

  const unsubscribe = () => {
    try { unsubCalleeCands && unsubCalleeCands() } catch {}
    try { unsubAnswer && unsubAnswer() } catch {}
  }

  return { pc, dc, offer, unsubscribe, opened }
}

export interface AnswerOptions {
  iceServers?: RTCIceServer[]
  onMessage?: (e: MessageEvent) => void
}

export interface AnswerHandle {
  pc: RTCPeerConnection
  dc?: RTCDataChannel
  answer?: RTCSessionDescriptionInit
  unsubscribe: () => void
}

// Minimal helper: listen for offer, set it, create/publish answer, and handle ICE
export async function answerOffer(sessionCode: string, opts: AnswerOptions = {}): Promise<AnswerHandle> {
  const iceServers = opts.iceServers || defaultIceServers
  const pc = new RTCPeerConnection({ iceServers })
  let dc: RTCDataChannel | undefined

  // Receive data channel from caller
  pc.ondatachannel = (e) => {
    dc = e.channel
    dc.binaryType = 'arraybuffer'
    if (opts.onMessage && dc) dc.onmessage = opts.onMessage
  }

  // Publish callee ICE candidates
  pc.onicecandidate = (e) => {
    if (!e.candidate) return
    try { addIceCandidate(sessionCode, 'callee', e.candidate.toJSON()) } catch {}
  }

  let unsub: (() => void) | undefined
  let publishedAnswer: RTCSessionDescriptionInit | undefined

  unsub = onOffer(sessionCode, async (offer) => {
    if (!offer) return
    if (!pc.currentRemoteDescription) {
      await pc.setRemoteDescription(offer)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      await setAnswer(sessionCode, answer)
      publishedAnswer = answer
    }
  })

  // Also consume caller ICE candidates that may arrive after answer
  const unsubCallerCands = onCandidates(sessionCode, 'caller', async (list) => {
    for (const c of list) {
      try { await pc.addIceCandidate(c) } catch {}
    }
  })

  const unsubscribe = () => {
    try { unsub && unsub() } catch {}
    try { unsubCallerCands && unsubCallerCands() } catch {}
  }

  return { pc, dc, answer: publishedAnswer, unsubscribe }
}
