 
import { Box, Button } from '@mui/material'
import RadarBackground from '../components/RadarBackground'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'

function Home() {
  const navigate = useNavigate()
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
        alignItems: 'stretch',
        justifyContent: 'center',
        gap: '2vh',
        p: '2vh',
        pt: '96px',
        boxSizing: 'border-box',
        fontFamily: 'monospace',
      }}
    >
      <TopBar />
      <RadarBackground color="#2b6fff" rings={8} durationSec={7} />
      <Button
        fullWidth
        onClick={() => navigate('/send')}
        aria-label="Send"
        sx={{
          flex: 1,
          minHeight: '40vh',
          color: '#0a2540',
          background: 'rgba(43, 111, 255, 0.08)',
          border: '1px solid rgba(43, 111, 255, 0.25)',
          backdropFilter: 'blur(8px)',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          fontSize: 'clamp(24px, 6vw, 64px)',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2vw',
          "& .sendIcon": {
            width: 'clamp(32px, 8vw, 80px)',
            height: 'clamp(32px, 8vw, 80px)',
            animation: 'paperPlane 1.8s ease-in-out infinite',
            stroke: '#2b6fff'
          },
          "@keyframes paperPlane": {
            '0%': { transform: 'translate(0, 0)' },
            '50%': { transform: 'translate(6px, -6px)' },
            '100%': { transform: 'translate(0, 0)' },
          },
        }}
      >
        <svg className="sendIcon" viewBox="0 0 24 24">
          <path d="M2 12 L22 3 L14 21 L11 13 Z" fill="none" stroke="#2b6fff" strokeWidth="2" />
          <path d="M22 3 L11 13" fill="none" stroke="#2b6fff" strokeWidth="2" />
        </svg>
        SEND
      </Button>

      <Button
        fullWidth
        onClick={() => navigate('/receive')}
        aria-label="Receive"
        sx={{
          flex: 1,
          minHeight: '40vh',
          color: '#0a2540',
          background: 'rgba(43, 111, 255, 0.08)',
          border: '1px solid rgba(43, 111, 255, 0.25)',
          backdropFilter: 'blur(8px)',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          fontSize: 'clamp(24px, 6vw, 64px)',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2vw',
          "& .receiveIcon": {
            width: 'clamp(32px, 8vw, 80px)',
            height: 'clamp(32px, 8vw, 80px)',
            animation: 'arrowPulse 1.6s ease-in-out infinite',
            stroke: '#2b6fff'
          },
          "@keyframes arrowPulse": {
            '0%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(6px)' },
            '100%': { transform: 'translateY(0)' },
          },
        }}
      >
        <svg className="receiveIcon" viewBox="0 0 24 24">
          <path d="M12 3 L12 17" fill="none" stroke="#2b6fff" strokeWidth="2" />
          <path d="M6 11 L12 17 L18 11" fill="none" stroke="#2b6fff" strokeWidth="2" />
        </svg>
        RECEIVE
      </Button>
    </Box>
  )
}

export default Home