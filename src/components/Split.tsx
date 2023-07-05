import React from "react"
import Box from "@mui/material/Box";
import { createTheme } from "@mui/material/styles";

type Props = {
  topPercent?: number,
  top: React.ReactNode,
  bottom: React.ReactNode,
}

export default function Split({ topPercent=50, top, bottom }: Props) {

  const theme = createTheme();

  return(
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(3),
    }}>
      
      <Box sx={{ flex: `1 1 ${topPercent}%` }}>
        {top}
      </Box>

      <Box sx={{ flex: `1 1 ${100 - topPercent}%`, display: 'flex', minWidth: 0 }}>
        {bottom}
      </Box>

    </Box>
  )
}