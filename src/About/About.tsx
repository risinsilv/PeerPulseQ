 
import { Box, Typography } from '@mui/material'
import TopBar from '../components/TopBar'
import RadarBackground from '../components/RadarBackground'

export default function About() {
  return (
    <Box sx={{
      position: 'fixed', inset: 0, bgcolor: '#fff', color: '#0a2540',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
      p: '2vh', pt: '96px', fontFamily: 'monospace', textAlign: 'center'
    }}>
      <TopBar />
      <RadarBackground color="#2b6fff" rings={8} durationSec={7} />
      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 900 }}>
        <Typography sx={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '0.12em', mb: 2 }}>
          About PeerPulseQ
        </Typography>
        <Typography sx={{ fontSize: 'clamp(14px, 2.2vw, 18px)', lineHeight: 1.6 }}>
          PeerPulseQ is a peer‑to‑peer file transfer app that uses WebRTC for direct, private connections. A simple six‑digit session code pairs a sender and receiver, and Firebase Realtime Database acts as the lightweight signaling layer.
        </Typography>
        <Typography sx={{ fontSize: 'clamp(14px, 2.2vw, 18px)', lineHeight: 1.6, mt: 2 }}>
          Files are streamed over a WebRTC Data Channel with chunking for reliability. No files are stored on servers. Use the Send screen to pick your files, and the Receive screen to generate and share a session code.
        </Typography>
      </Box>
    </Box>
  )
}
