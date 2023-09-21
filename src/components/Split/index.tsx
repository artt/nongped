import React from "react"
import Box from "@mui/material/Box";
import { createTheme } from "@mui/material/styles";

type Props = {
  topPercent?: number,
  top: React.ReactNode,
  bottom: React.ReactNode,
  grow?: "top" | "bottom",
}

export default function Split({ topPercent, top, bottom, grow="top" }: Props) {

  const theme = createTheme();

  return(
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(3),
    }}>
      
      <Box sx={{
        flex: grow === "bottom" ? '' : `1 1 ${topPercent || 100}%`,
        position: 'relative',
      }}>
        {top}
      </Box>

      <Box sx={{
        flex: grow === "bottom" ? '1 1 100%' : (topPercent ? `1 1 ${100 - topPercent}%` : ''),
        position: 'relative',
        minWidth: 0,
      }}>
        {bottom}
      </Box>

    </Box>
  )
}