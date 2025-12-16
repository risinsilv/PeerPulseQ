import React, { useRef, useState } from 'react'
import { Box, Button, Typography, List, ListItem, ListItemText } from '@mui/material'
import { joinSession } from '../lib/firebase'
import { makeOffer } from '../lib/webrtc'

function Send() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [files, setFiles] = useState<File[]>([])

  const openPicker = () => {
    inputRef.current?.click()
  }

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const selected = e.target.files ? Array.from(e.target.files) : []
    setFiles(selected)
  }

  const promptCodeAndSend = async () => {
    if (files.length === 0) return
    const input = window.prompt('Enter 6-digit code from receiver:', '') || ''
    const code = input.trim()
    if (!/^\d{6}$/.test(code)) {
      alert('Please enter a valid 6-digit code')
      return
    }
    const ok = await joinSession(code)
    if (!ok) {
      alert('Could not join session. Check the code and try again.')
      return
    }

    const { dc } = await makeOffer(code)

    // Send simple file header + chunked content
    for (const file of files) {
      const header = JSON.stringify({ __type: 'file-header', name: file.name, size: file.size, type: file.type })
      dc.send(header)
      const chunkSize = 64 * 1024 // 64KB
      let offset = 0
      while (offset < file.size) {
        const slice = file.slice(offset, offset + chunkSize)
        const buf = await slice.arrayBuffer()
        dc.send(buf)
        offset += chunkSize
      }
    }
    alert('Files sent. You may close this page.')
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        bgcolor: '#000',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3vh',
        p: '2vh',
        boxSizing: 'border-box',
        fontFamily: 'monospace',
        textAlign: 'center',
      }}
    >
      <Typography sx={{ fontSize: 'clamp(20px, 4vw, 40px)', letterSpacing: '0.15em' }}>
        Select Files to Send
      </Typography>

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
          border: '4px solid #fff',
          bgcolor: '#000',
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          fontSize: 'clamp(18px, 3.5vw, 32px)',
          fontWeight: 700,
          boxShadow: '0 0 0 6px #000, inset 0 0 0 6px #000',
          '&:hover': {
            transform: 'scale(0.995)',
            filter: 'brightness(1.2)',
            bgcolor: '#000',
            borderColor: '#fff',
          },
        }}
      >
        Choose Files
      </Button>

      {files.length > 0 && (
        <Box sx={{ maxHeight: '30vh', overflowY: 'auto', width: '80vw', border: '2px dashed #fff', p: 2 }}>
          <List sx={{ color: '#fff' }}>
            {files.map((f, i) => (
              <ListItem key={i} sx={{ py: 0.5 }}>
                <ListItemText primary={f.name} secondary={`${(f.size / 1024).toFixed(1)} KB`} />
              </ListItem>
            ))}
          </List>
          <Button onClick={promptCodeAndSend} sx={{ mt: 2, border: '2px solid #fff', color: '#fff' }}>
            Send Files
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default Send
