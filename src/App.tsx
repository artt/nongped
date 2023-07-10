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
import "styles/main.scss"

const navItems = [
  {
    label: 'Home',
    path: '',
  },
  {
    label: 'Inflation',
    path: 'inflation',
  },
  {
    label: 'FX',
    path: 'fx',
  },
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
            {/* add nongped.svg as the site's logo */}
            <img src="/nongped.svg" alt="nongped" width="32" height="32" />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1, ml: 1 }}
            >
              NongPed
            </Typography>
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
            overflow: 'hidden',
          }}>
            {!page && <div className="center"><img src="/nongped.svg" alt="nongped" width="400" height="400" /></div>}
            {page === 'fx' && <Fx />}
            {page === 'inflation' && <Inflation />}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
