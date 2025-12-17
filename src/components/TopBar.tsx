 
import { Box, Button, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const ACCENT = '#2b6fff'
const TEXT = '#0a2540'

export default function TopBar() {
  const navigate = useNavigate()
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        px: 3,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(8px)',
        // no bottom border per request
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate('/')}
        title="Home">
        <Typography
          component="div"
          sx={{
            fontFamily: 'monospace',
            fontWeight: 800,
            fontSize: 'clamp(18px, 2.6vw, 28px)',
            color: TEXT,
            letterSpacing: '0.12em',
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: '0.25rem',
          }}
        >
          <span style={{ color: TEXT }}>Peer</span>
          <span style={{ color: ACCENT }}>PulseQ</span>
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          onClick={() => navigate('/')}
          variant="text"
          disableRipple
          sx={{
            px: 0,
            minWidth: 'auto',
            color: '#818589',
            textTransform: 'none',
            fontFamily: 'monospace',
            fontWeight: 600,
            letterSpacing: '0.12em',
            background: 'transparent',
            border: 'none',
            '&:hover': { background: 'transparent', color: ACCENT },
          }}
        >
          Home
        </Button>
        <Button
          onClick={() => navigate('/about')}
          variant="text"
          disableRipple
          sx={{
            px: 0,
            minWidth: 'auto',
            color: '#818589',
            textTransform: 'none',
            fontFamily: 'monospace',
            fontWeight: 600,
            letterSpacing: '0.12em',
            background: 'transparent',
            border: 'none',
            '&:hover': { background: 'transparent', color: ACCENT },
          }}
        >
          About
        </Button>
      </Box>
    </Box>
  )
}
