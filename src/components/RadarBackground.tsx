import React from 'react'
import { Box } from '@mui/material'

type Props = {
  color?: string
  rings?: number
  durationSec?: number
}

export default function RadarBackground({ color = '#2b6fff', rings = 6, durationSec = 6 }: Props) {
  const circles = Array.from({ length: rings })
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '200vmax',
          height: '20vmax',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          filter: 'blur(0.4px)',
        }}
      >
        {circles.map((_, i) => {
          const t = rings <= 1 ? 0 : i / (rings - 1)
          const scale = 0.3 + t * (1.6 - 0.3)
          return (
            <Box
              key={i}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '200vmin',
                height: '200vmin',
                borderRadius: '50%',
                border: `2px solid ${color}80`,
                boxShadow: `0 0 18px ${color}40`,
                transform: `translate(-50%, -50%) scale(${scale})`,
              }}
            />
          )
        })}
      </Box>
    </Box>
  )
}
