import React from 'react';
import Fx from "components/Fx"
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import './App.scss';

const navItems = [
  'Home',
  'About',
  'Contact'
];

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
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1 }}
          >
            NongPed
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            {navItems.map(item => (
              <Button
                key={item}
                sx={{ color: '#fff' }}
              >
                {item}
              </Button>
            ))}
          </Box>
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
