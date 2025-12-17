import React, { useEffect, useRef, useState } from 'react'
import { Box, Button, Typography, Divider, List, ListItem, ListItemText, LinearProgress } from '@mui/material'
import { createSession, deleteSession } from '../lib/firebase'
import { answerOffer } from '../lib/webrtc'
import RadarBackground from '../components/RadarBackground'
import TopBar from '../components/TopBar'
import * as QRCode from 'qrcode'
import { useNavigate } from 'react-router-dom'

interface ReceivedFile {
  name: string
  type: string
  size: number
  chunks: ArrayBuffer[]
  received: number
}

function Receive() {
  const navigate = useNavigate()
  const [code, setCode] = useState<string>('')
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([])
  const [ready, setReady] = useState(false)
  const initRef = useRef(false)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)
  const [stopped, setStopped] = useState(false)
  const [qrUrl, setQrUrl] = useState<string>('')

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    let unsub: (() => void) | undefined
    let pc: RTCPeerConnection | undefined

    const run = async () => {
      const existing = sessionStorage.getItem('sessionCode') || ''
      const sessionCode = existing || await createSession()
      if (!existing) sessionStorage.setItem('sessionCode', sessionCode)
      setCode(sessionCode)
      try {
        const url = await QRCode.toDataURL(sessionCode, { width: 256, margin: 1 })
        setQrUrl(url)
      } catch {}

      const { unsubscribe, pc: peer } = await answerOffer(sessionCode, {
        onMessage: (e) => {
          if (typeof e.data === 'string') {
            // Header message
            try {
              const meta = JSON.parse(e.data)
              if (meta && meta.__type === 'file-header') {
                setReceivedFiles((prev) => prev.concat({
                  name: meta.name,
                  type: meta.type,
                  size: meta.size,
                  chunks: [],
                  received: 0,
                }))
              } else if (meta && meta.__type === 'file-end') {
                // finalize current file (optional place for validations)
              }
            } catch {}
          } else if (e.data instanceof ArrayBuffer) {
            // Chunk message
            setReceivedFiles((prev) => {
              const next = [...prev]
              const target = next[next.length - 1]
              if (target) {
                target.chunks.push(e.data)
                target.received += e.data.byteLength
              }
              return next
            })
          }
        },
      })
      unsub = unsubscribe
      pc = peer
      pcRef.current = peer
      unsubRef.current = unsubscribe
      setReady(true)
    }

    run()
    return () => {
      try { unsub && unsub() } catch {}
      try { pc && pc.close() } catch {}
    }
  }, [])

  const stopReceiving = async () => {
    try { unsubRef.current && unsubRef.current() } catch {}
    try { pcRef.current && pcRef.current.close() } catch {}
    setStopped(true)
    try {
      if (code) {
        await deleteSession(code)
      }
    } catch {}
    try { sessionStorage.removeItem('sessionCode') } catch {}
    navigate('/')
  }

  return (
    <Box sx={{
      position: 'fixed', inset: 0, bgcolor: '#fff', color: '#0a2540',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '2vh', p: '2vh', pt: '96px', fontFamily: 'monospace', textAlign: 'center'
    }}>
      <TopBar />
      <RadarBackground color="#2b6fff" rings={8} durationSec={7} />
      <Box sx={{ position: 'relative', zIndex: 1, display: 'contents' }}>
      <Typography sx={{ fontSize: 'clamp(24px, 5vw, 48px)', letterSpacing: '0.2em' }}>
        Your Session Code
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography sx={{ fontSize: 'clamp(32px, 8vw, 72px)', fontWeight: 700 }}>
          {code || '------'}
        </Typography>
        <Button
          onClick={() => code && navigator.clipboard.writeText(code)}
          sx={{
            height: 'fit-content',
            color: '#0a2540',
            background: 'rgba(43, 111, 255, 0.08)',
            border: '1px solid rgba(43, 111, 255, 0.25)',
            backdropFilter: 'blur(8px)',
          }}
          disabled={!code}
        >
          Copy
        </Button>
      </Box>
      {qrUrl && (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <img src={qrUrl} alt="Session QR Code" style={{ width: 200, height: 200 }} />
          <Typography sx={{ fontSize: 12, color: '#0a2540', opacity: 0.7 }}>
            Scan this QR to join
          </Typography>
        </Box>
      )}
      <Divider sx={{ width: '60%', borderColor: '#444' }} />
      <Typography sx={{ fontSize: 'clamp(16px, 3vw, 24px)' }}>
        {stopped ? 'Stopped receiving.' : 'Waiting for sender to connect...'}
      </Typography>

      <Button
        onClick={stopReceiving}
        disabled={stopped || !ready}
        sx={{
          mt: 1,
          color: '#0a2540',
          background: 'rgba(43, 111, 255, 0.08)',
          border: '1px solid rgba(43, 111, 255, 0.25)',
          backdropFilter: 'blur(8px)',
        }}
      >
        Stop Receiving
      </Button>

      {receivedFiles.length > 0 && (
        <Box sx={{ width: '80vw', maxWidth: 700 }}>
          <Typography sx={{ mt: 2, mb: 1 }}>Received files:</Typography>
          <Box sx={{ maxHeight: '40vh', overflowY: 'auto', pr: 1 }}>
          <List>
            {receivedFiles.map((f, i) => (
              <ListItem key={i}>
                
                <ListItemText
                  primary={f.name}
                  secondary={`${(f.received / 1024).toFixed(1)} KB / ${(f.size / 1024).toFixed(1)} KB`}
                />
                <Box sx={{ width: '40%', ml: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.round((f.received / Math.max(1, f.size)) * 100))}
                    sx={{
                      backgroundColor: '#e8f5e9',
                      '& .MuiLinearProgress-bar': { backgroundColor: '#2ecc71' },
                    }}
                  />
                  {f.received >= f.size && (
                    <Typography sx={{ mt: 0.5, fontSize: 12, color: '#2e7d32' }}>
                      Download completed
                    </Typography>
                  )}
                </Box>
                <Button onClick={() => {
                  const blob = new Blob(f.chunks, { type: f.type })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = f.name
                  a.click()
                  URL.revokeObjectURL(url)
                }} sx={{
                  marginLeft: 2,
                  color: '#0a2540',
                  background: 'rgba(43, 111, 255, 0.08)',
                  border: '1px solid rgba(43, 111, 255, 0.25)',
                  backdropFilter: 'blur(8px)'
                }}>
                  Save
                </Button>
              </ListItem>
            ))}
          </List>
          </Box>
        </Box>
      )}
      </Box>
    </Box>
  )
}

export default Receive
