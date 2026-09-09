import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary:    { main: '#1F5F8B', dark: '#1C4E70' }, // normal + hover del design system
    secondary:  { main: '#338FC4' },
    success:    { main: '#2E9D78' },
    warning:    { main: '#E5A33B' },
    error:      { main: '#D9534F' },
    background: { default: '#F5F8FC', paper: '#FFFFFF' },
    text:       { primary: '#132B3E', secondary: '#64748B' },
  },
  typography: {
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
    h1:    { fontSize: '2rem',     fontWeight: 700 }, // 32px  Dashboard
    h2:    { fontSize: '1.5rem',   fontWeight: 600 }, // 24px  Titulos de seccion
    h3:    { fontSize: '1.25rem',  fontWeight: 500 }, // 20px
    body1: { fontSize: '1rem',     fontWeight: 400 }, // 16px
    body2: { fontSize: '0.875rem', fontWeight: 400 }, // 14px
  },
  shape: { borderRadius: 8 }, // radio de botones y campos
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: 'none', fontWeight: 500 } },
    },
  },
});

export default theme;
