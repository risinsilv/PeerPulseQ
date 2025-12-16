import React, { useEffect, useRef, useState } from 'react'
import { Box, Button, Typography, Divider, List, ListItem, ListItemText } from '@mui/material'
import { createSession } from '../lib/firebase'
import { answerOffer } from '../lib/webrtc'

interface ReceivedFile {
  name: string
  type: string
  size: number
  chunks: ArrayBuffer[]
  received: number
}

function Receive() {
  const [code, setCode] = useState<string>('')
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([])
  const [ready, setReady] = useState(false)
  const initRef = useRef(false)

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
      setReady(true)
    }

    run()
    return () => {
      try { unsub && unsub() } catch {}
      try { pc && pc.close() } catch {}
    }
  }, [])

  const saveLastFile = () => {
    const f = receivedFiles[receivedFiles.length - 1]
    if (!f) return
    const blob = new Blob(f.chunks, { type: f.type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = f.name
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Box sx={{
      position: 'fixed', inset: 0, bgcolor: '#000', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '2vh', p: '2vh', fontFamily: 'monospace', textAlign: 'center'
    }}>
      <Typography sx={{ fontSize: 'clamp(24px, 5vw, 48px)', letterSpacing: '0.2em' }}>
        Your Session Code
      </Typography>
      <Typography sx={{ fontSize: 'clamp(32px, 8vw, 72px)', fontWeight: 700 }}>
        {code || '------'}
      </Typography>
      <Divider sx={{ width: '60%', borderColor: '#444' }} />
      <Typography sx={{ fontSize: 'clamp(16px, 3vw, 24px)' }}>
        Waiting for sender to connect...
      </Typography>

      {receivedFiles.length > 0 && (
        <Box sx={{ width: '80vw', maxWidth: 700 }}>
          <Typography sx={{ mt: 2, mb: 1 }}>Last received file:</Typography>
          <List>
            <ListItem>
              <ListItemText
                primary={receivedFiles[receivedFiles.length - 1].name}
                secondary={`${(receivedFiles[receivedFiles.length - 1].received / 1024).toFixed(1)} KB / ${(receivedFiles[receivedFiles.length - 1].size / 1024).toFixed(1)} KB`}
              />
            </ListItem>
          </List>
          <Button onClick={saveLastFile} disabled={!ready} sx={{ border: '2px solid #fff', color: '#fff' }}>
            Save File
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default Receive
