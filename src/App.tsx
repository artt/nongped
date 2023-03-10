import React from 'react';
import Fx from "components/Fx"
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import './App.scss';

function App() {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
        <Toolbar>
          xxx
          {/* <Typography variant="h6" noWrap component="div">
            Clipped drawer
          </Typography> */}
        </Toolbar>
      </AppBar>
      <Box sx={{
        flexGrow: 1,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Toolbar sx={{ flex: 0 }}/>
        <Box sx={{
          m: 4,
          flex: '1 1 40px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'stretch',
          flexDirection: 'column',
        }}>
          <Fx />
        </Box>
      </Box>
    </Box>
  );
}

export default App;
