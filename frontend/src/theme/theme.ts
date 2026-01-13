import { createTheme } from '@mui/material';
import type { PaletteMode } from '@mui/material';

export const getTheme = (mode: PaletteMode) => createTheme({
    palette: {
        mode,
        ...(mode === 'light'
            ? {
                primary: { main: '#6b1d7a' }, // LEV Purple
                secondary: { main: '#e91e8c' }, // Pink accent
                background: { default: '#f5f0f7', paper: '#ffffff' },
            }
            : {
                primary: { main: '#9b4dca' }, // Lighter purple for dark mode
                secondary: { main: '#f06292' }, // Pink accent
                background: { default: '#1a0f1e', paper: '#2d1f33' },
                text: { primary: '#f1f5f9', secondary: '#c4b1c9' },
                action: { hover: 'rgba(155, 77, 202, 0.15)' },
                divider: 'rgba(155, 77, 202, 0.2)',
            }),
    },
    typography: {
        fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                    '&:hover': { boxShadow: 'none' },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
                outlined: {
                    borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)',
                    backgroundColor: mode === 'dark' ? '#1e293b' : '#ffffff',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.12)',
                },
            },
        },
    },
});
