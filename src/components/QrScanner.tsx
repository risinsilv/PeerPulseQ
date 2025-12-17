import { useEffect, useRef } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

type Props = {
  onResult: (text: string) => void
  onClose: () => void
}

export default function QrScanner({ onResult, onClose }: Props) {
  const containerId = useRef(`qr-scanner-${Math.random().toString(36).slice(2)}`)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    const id = containerId.current
    const scanner = new Html5Qrcode(id, {
      verbose: false,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    })
    scannerRef.current = scanner

    const start = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            onResult(decodedText)
          },
          () => {}
        )
      } catch (err) {
        // ignore; show hint to user
      }
    }
    start()

    return () => {
      const s = scannerRef.current
      if (s) {
        try {
          s.stop().then(() => s.clear()).catch(() => s.clear())
        } catch {}
      }
    }
  }, [onResult])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Typography sx={{ mb: 1, letterSpacing: '0.12em' }}>Scan QR Code</Typography>
      <Box id={containerId.current} sx={{ width: { xs: 240, sm: 280 }, height: { xs: 240, sm: 280 }, border: '1px solid rgba(43,111,255,0.25)', borderRadius: 2 }} />
      <Button onClick={onClose} sx={{ mt: 1, color: '#0a2540', background: 'rgba(43, 111, 255, 0.08)', border: '1px solid rgba(43, 111, 255, 0.25)' }}>
        Close Scanner
      </Button>
    </Box>
  )
}
