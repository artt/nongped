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

const navItems = [
  {
    label: 'GDP',
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
    label: 'Countries (Beta)',
    path: 'countries',
  }
]

export default function App() {

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const page = query.get('p')

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
        <Box sx={{ display: 'flex' }}>
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
              // overflow: 'hidden',
            }}>
              {!page && <div className="center"><img src={logoUrl} alt="nongped" width="400" height="400" style={{maxWidth: "100%"}}/></div>}
              {page === 'gdp' && <Gdp />}
              {page === 'inflation' && <Inflation />}
              {page === 'fx' && <Fx />}
              {page === 'countries' && <Countries />}
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    </LocalizationProvider>
  );
}
