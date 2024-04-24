import React from "react";
import Fx from "components/Fx"
import Inflation from 'components/Inflation';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useLocation } from "react-router-dom";
import Link from "components/Link";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import "styles/main.scss"

import logoUrl from 'assets/nongped.svg'
import Countries from "components/Countries";
import Gdp from "components/Gdp";
import Exports from "components/Exports";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

const navItems = [
  {
    label: 'GDP (Beta)',
    path: 'gdp'
  },
  {
    label: 'Inflation',
    path: 'inflation',
  },
  {
    label: 'FX',
    path: 'fx',
  },
  {
    label: 'Exports (Soon!)',
    path: 'exports',
  },
  {
    label: 'Countries (Beta)',
    path: 'countries',
  }
]

export default function App() {

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const page = query.get('p')

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const theme = createTheme({
    palette: {
      primary: {
        main: '#107d98',
      },
      // mode: 'dark',
    },
  })

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', width: '100%' }}>
          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              zIndex: (theme) => theme.zIndex.drawer + 1
            }}
          >
            <Toolbar>
              <Link to="/" color="#fff" sx={{ flexGrow: 1 }}>
                <Typography
                  variant="h6"
                  noWrap
                  component="div"
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <img src={logoUrl} alt="nongped" width="32" height="32" style={{ marginRight: '4px' }} />
                  NongPed
                </Typography>
              </Link>
              <Box sx={{ flexGrow: 1, ml: 1 }} />
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                {navItems.map((item, i) => (
                  <Button
                    key={i}
                    sx={{ color: '#fff' }}
                    component={Link}
                    to={item.path ? `/?p=${item.path}` : '/'}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
              {/* use menu instead if screen is xs */}
              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                <Button
                  sx={{ color: '#fff' }}
                  // component={Link}
                  // to="/"
                  onClick={handleMenuClick}
                >
                  Menu
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleMenuClose}
                >
                  {navItems.map((item, i) => (
                    <MenuItem
                      key={i}
                      component={Link}
                      to={item.path ? `/?p=${item.path}` : '/'}
                      onClick={handleMenuClose}
                    >
                      {item.label}
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            </Toolbar>
          </AppBar>
          <Box sx={{
            flexGrow: 1,
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <Toolbar sx={{ flex: 0 }} />
            <Box sx={{
              m: 4,
              flex: '1 1 40px',
              // overflow: 'hidden',
              height: '100%',
            }}>
              {!page && <div className="center"><img src={logoUrl} alt="nongped" width="400" height="400" style={{maxWidth: "100%"}}/></div>}
              {page === 'gdp' && <Gdp />
                // TODO: need to check if the mouse is in the chart
                // otherwise this will be passed on to all the charts
              }
              {page === 'inflation' && <Inflation />}
              {page === 'fx' && <Fx />}
              {page === 'exports' && <Exports />}
              {page === 'countries' && <Countries />}
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    </LocalizationProvider>
  );
}
