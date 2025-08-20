// theme.ts
import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: 'rgba(33, 150, 243, 0.05)',
      paper: '#F9FAFB',
    },
    primary: {
      main: '#00A8E8',         // Accent blue for buttons, links, highlights
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FFD700',         // Optional: gold accent (for highlights, icons, rewards)
    },
    text: {
      primary: '#1B1F23',      // Dark gray text for readability
      secondary: '#555C68',    // Slightly lighter for subtitles
    },
    divider: '#E0E0E0',        // Light gray borders
  },
  typography: {
    fontFamily: '"Inter", "Open Sans", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: 'lg',
      },
    },
  },
})

export default theme
