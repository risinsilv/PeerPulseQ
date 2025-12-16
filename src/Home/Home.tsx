import React from 'react'
import { Box, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { createSession, joinSession } from './../lib/firebase'



async function onReceivedCLicked() {
  const code = await createSession()
  console.log('Session code (share this with sender):', code)
  
}

async function onSendClicked() {
  
  
}

function Home() {
  const navigate = useNavigate()
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
        alignItems: 'stretch',
        justifyContent: 'center',
        gap: '2vh',
        p: '2vh',
        boxSizing: 'border-box',
        fontFamily: 'monospace',
      }}
    >
      <Button
        fullWidth
        onClick={() => navigate('/send')}
        aria-label="Send"
        sx={{
          flex: 1,
          minHeight: '40vh',
          border: '4px solid #fff',
          bgcolor: '#000',
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          fontSize: 'clamp(24px, 6vw, 64px)',
          fontWeight: 700,
          boxShadow: '0 0 0 6px #000, inset 0 0 0 6px #000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2vw',
          "& .sendIcon": {
            width: 'clamp(32px, 8vw, 80px)',
            height: 'clamp(32px, 8vw, 80px)',
            animation: 'paperPlane 1.8s ease-in-out infinite',
          },
          "@keyframes paperPlane": {
            '0%': { transform: 'translate(0, 0)' },
            '50%': { transform: 'translate(6px, -6px)' },
            '100%': { transform: 'translate(0, 0)' },
          },
          '&:hover': {
            transform: 'scale(0.995)',
            filter: 'brightness(1.2)',
            bgcolor: '#000',
            borderColor: '#fff',
          },
        }}
      >
        <svg className="sendIcon" viewBox="0 0 24 24">
          <path d="M2 12 L22 3 L14 21 L11 13 Z" fill="none" stroke="#fff" strokeWidth="2" />
          <path d="M22 3 L11 13" fill="none" stroke="#fff" strokeWidth="2" />
        </svg>
        SEND
      </Button>

      <Button
        fullWidth
        onClick={() => onReceivedCLicked()}
        aria-label="Receive"
        sx={{
          flex: 1,
          minHeight: '40vh',
          border: '4px dashed #fff',
          bgcolor: '#000',
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          fontSize: 'clamp(24px, 6vw, 64px)',
          fontWeight: 700,
          boxShadow: '0 0 0 6px #000, inset 0 0 0 6px #000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2vw',
          "& .receiveIcon": {
            width: 'clamp(32px, 8vw, 80px)',
            height: 'clamp(32px, 8vw, 80px)',
            animation: 'arrowPulse 1.6s ease-in-out infinite',
          },
          "@keyframes arrowPulse": {
            '0%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(6px)' },
            '100%': { transform: 'translateY(0)' },
          },
          '&:hover': {
            transform: 'scale(0.995)',
            filter: 'brightness(1.2)',
            bgcolor: '#000',
            borderColor: '#fff',
          },
        }}
      >
        <svg className="receiveIcon" viewBox="0 0 24 24">
          <path d="M12 3 L12 17" fill="none" stroke="#fff" strokeWidth="2" />
          <path d="M6 11 L12 17 L18 11" fill="none" stroke="#fff" strokeWidth="2" />
        </svg>
        RECEIVE
      </Button>
    </Box>
  )
}

export default Home