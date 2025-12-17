import React, { useRef, useState } from 'react'
import { Box, Button, Typography, List, ListItem, ListItemText, LinearProgress } from '@mui/material'
import RadarBackground from '../components/RadarBackground'
import TopBar from '../components/TopBar'
import { joinSession } from '../lib/firebase'
import { makeOffer } from '../lib/webrtc'

function Send() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState<number[]>([])
  const codeInputsRef = useRef<Array<HTMLInputElement | null>>([])

  const openPicker = () => {
    inputRef.current?.click()
  }

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const selected = e.target.files ? Array.from(e.target.files) : []
    setFiles(selected)
  }

  const sendFiles = async () => {
    if (files.length === 0) return
    const trimmed = code.trim()
    if (!/^\d{6}$/.test(trimmed)) {
      alert('Please enter a valid 6-digit code')
      return
    }
    setSending(true)
    setProgress(Array(files.length).fill(0))

    const ok = await joinSession(trimmed)
    if (!ok) {
      alert('Could not join session. Check the code and try again.')
      setSending(false)
      return
    }

    const { dc, opened } = await makeOffer(trimmed)
    await opened

    // Send simple file header + chunked content
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const header = JSON.stringify({ __type: 'file-header', name: file.name, size: file.size, type: file.type })
      dc.send(header)
      const chunkSize = 64 * 1024 // 64KB
      let offset = 0
      while (offset < file.size) {
        const slice = file.slice(offset, offset + chunkSize)
        const buf = await slice.arrayBuffer()
        dc.send(buf)
        offset += chunkSize
        setProgress((prev) => {
          const next = prev.slice()
          next[i] = Math.min(100, Math.round((offset / file.size) * 100))
          return next
        })
      }
      // signal end-of-file for the receiver
      dc.send(JSON.stringify({ __type: 'file-end', name: file.name }))
    }
    setSending(false)
    alert('Files sent. You may close this page.')
  }

  const handleDigitChange = (index: number, value: string) => {
    const v = (value || '').replace(/[^0-9]/g, '').slice(0, 1)
    // Build new code string with the digit at index
    const chars = code.split('')
    // Ensure length 6
    while (chars.length < 6) chars.push('')
    chars[index] = v
    const nextCode = chars.join('').slice(0, 6)
    setCode(nextCode)
    if (v && index < 5) {
      codeInputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const chars = code.split('')
      while (chars.length < 6) chars.push('')
      if (!chars[index] && index > 0) {
        // move back and clear previous
        chars[index - 1] = ''
        setCode(chars.join('').slice(0, 6))
        requestAnimationFrame(() => codeInputsRef.current[index - 1]?.focus())
      } else {
        // clear current
        chars[index] = ''
        setCode(chars.join('').slice(0, 6))
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      codeInputsRef.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault()
      codeInputsRef.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text') || ''
    const digits = text.replace(/\D/g, '').slice(0, 6)
    if (digits.length) {
      e.preventDefault()
      setCode(digits)
      requestAnimationFrame(() => codeInputsRef.current[Math.min(5, digits.length)]?.focus())
    }
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        bgcolor: '#fff',
        color: '#0a2540',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3vh',
        p: '2vh',
        pt: '96px',
        boxSizing: 'border-box',
        fontFamily: 'monospace',
        textAlign: 'center',
      }}
    >
      <TopBar />
      <RadarBackground color="#2b6fff" rings={8} durationSec={7} />

      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={onChange}
      />

      <Button
        onClick={openPicker}
        aria-label="Pick files"
        sx={{
          minHeight: '20vh',
          minWidth: '60vw',
          color: '#0a2540',
          background: 'rgba(43, 111, 255, 0.08)',
          borderRadius: 2,
          backdropFilter: 'blur(8px)',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          fontSize: 'clamp(18px, 3.5vw, 32px)',
          fontWeight: 700,
        }}
      >
        Choose Files
      </Button>

      {files.length > 0 && (
        <Box sx={{ maxHeight: '30vh', overflowY: 'auto', width: '80vw', p: 2, background: 'white', backdropFilter: 'blur(6px)', border: '1px solid rgba(43, 111, 255, 0.25)', borderRadius: 2 }}>
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ mb: 1, color: '#0a2540', opacity: 0.8, letterSpacing: '0.12em' }}>
              Enter 6-digit code
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.2 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 48,
                    height: 56,
                    borderRadius: 2,
                    background: 'white',
                    border: '2px solid #2b6fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(6px)'
                  }}
               >
                  <input
                    ref={(el) => (codeInputsRef.current[i] = el)}
                    value={(code[i] ?? '')}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    aria-label={`Digit ${i + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: 22,
                      color: '#0a2540',
                      caretColor: '#2b6fff',
                    }}
                  />
                </Box>
              ))}
            </Box>
            <Typography sx={{ mt: 0.75, fontSize: 12, color: '#0a2540', opacity: 0.6 }}>
              Enter the code shown on the receiver
            </Typography>
          </Box>
          <List sx={{ color: 'black' }}>
            {files.map((f, i) => (
              <ListItem key={i} sx={{ py: 0.5 }}>
                <ListItemText primary={f.name} secondary={`${(f.size / 1024).toFixed(1)} KB`} />
                {sending && (
                  <Box sx={{ width: '30%', ml: 2 }}>
                    <LinearProgress variant="determinate" value={progress[i] || 0} />
                  </Box>
                )}
              </ListItem>
            ))}
          </List>
          <Button
            onClick={sendFiles}
            disabled={sending || !/^\d{6}$/.test(code)}
            sx={{
              mt: 2,
              color: sending ? '#8aa0d6' : '#0a2540',
              background: 'rgba(43, 111, 255, 0.08)',
              border: '1px solid rgba(43, 111, 255, 0.25)',
              backdropFilter: 'blur(8px)'
            }}
          >
            {sending ? 'Sending…' : 'Send Files'}
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default Send
