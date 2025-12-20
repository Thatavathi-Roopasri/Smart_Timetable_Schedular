import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: any;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return context;
};

interface ThemeModeProviderProps {
  children: React.ReactNode;
}

export const ThemeModeProvider: React.FC<ThemeModeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Load theme preference from localStorage
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Initialize theme attribute on first load
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]); // Include isDarkMode as dependency

  // Save theme preference to localStorage and update attribute
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    // Update document attribute for CSS theming
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const lightTheme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#dc004e',
        light: '#ff5983',
        dark: '#9a0036',
      },
      background: {
        default: '#f8f9fa',
        paper: '#ffffff',
      },
      text: {
        primary: '#212121',
        secondary: '#666666',
      },
      divider: '#e0e0e0',
      action: {
        hover: 'rgba(25, 118, 210, 0.04)',
        selected: 'rgba(25, 118, 210, 0.08)',
        disabled: 'rgba(0, 0, 0, 0.26)',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#1976d2',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            borderRadius: '12px',
            border: '1px solid #f0f0f0',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '8px',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#ffffff',
              '& fieldset': {
                borderColor: '#e0e0e0',
              },
              '&:hover fieldset': {
                borderColor: '#1976d2',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1976d2',
                borderWidth: '2px',
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#e0e0e0',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1976d2',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1976d2',
              borderWidth: '2px',
            },
          },
        },
      },
      MuiFormControl: {
        styleOverrides: {
          root: {
            '& .MuiInputLabel-root': {
              '&.Mui-focused': {
                color: '#1976d2',
              },
            },
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#ffffff',
              '& fieldset': {
                borderColor: '#e0e0e0',
              },
              '&:hover fieldset': {
                borderColor: '#1976d2',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1976d2',
                borderWidth: '2px',
              },
            },
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: '#f8f9fa',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:nth-of-type(even)': {
              backgroundColor: '#fafbfc',
            },
            '&:hover': {
              backgroundColor: '#f5f5f5',
            },
          },
        },
      },
    },
  });

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#90caf9',
        light: '#bbdefb',
        dark: '#42a5f5',
        contrastText: '#121212',
      },
      secondary: {
        main: '#f48fb1',
        light: '#f8bbd9',
        dark: '#ec407a',
      },
      background: {
        default: '#0a0a0a',
        paper: '#1a1a1a',
      },
      text: {
        primary: '#ffffff',
        secondary: '#b0b0b0',
      },
      divider: '#333333',
      action: {
        hover: 'rgba(144, 202, 249, 0.08)',
        selected: 'rgba(144, 202, 249, 0.12)',
        disabled: 'rgba(255, 255, 255, 0.3)',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: '#666 #2b2b2b',
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              backgroundColor: '#2b2b2b',
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              borderRadius: 8,
              backgroundColor: '#666',
              minHeight: 24,
              border: '3px solid #2b2b2b',
            },
            '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
              backgroundColor: '#959595',
            },
            '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
              backgroundColor: '#959595',
            },
            '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
              backgroundColor: '#959595',
            },
            '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
              backgroundColor: '#2b2b2b',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: '#1a1a1a',
            backgroundImage: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            borderRadius: '12px',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: '#1a1a1a',
            backgroundImage: 'none',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: '#1a1a1a',
            backgroundImage: 'none',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#333333',
            },
            '&.Mui-selected': {
              backgroundColor: '#2c2c2c',
              '&:hover': {
                backgroundColor: '#3a3a3a',
              },
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#1a1a1a',
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '8px',
            fontWeight: 500,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#252525',
              '& fieldset': {
                borderColor: '#404040',
              },
              '&:hover fieldset': {
                borderColor: '#90caf9',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#90caf9',
              },
            },
            '& .MuiInputLabel-root': {
              color: '#b0b0b0',
            },
            '& .MuiInputBase-input': {
              color: '#ffffff',
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            backgroundColor: '#252525',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#404040',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#90caf9',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#90caf9',
            },
            '& .MuiSelect-select': {
              color: '#ffffff',
            },
          },
        },
      },
      MuiFormControl: {
        styleOverrides: {
          root: {
            '& .MuiInputLabel-root': {
              color: '#b0b0b0',
              '&.Mui-focused': {
                color: '#90caf9',
              },
            },
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#252525',
              '& fieldset': {
                borderColor: '#404040',
              },
              '&:hover fieldset': {
                borderColor: '#90caf9',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#90caf9',
              },
            },
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            backgroundColor: '#1a1a1a',
            backgroundImage: 'none',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: '#2a2a2a',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:nth-of-type(odd)': {
              backgroundColor: '#1f1f1f',
            },
            '&:hover': {
              backgroundColor: '#252525',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.12)',
          },
          filled: {
            backgroundColor: 'rgba(33, 150, 243, 0.3)',
            color: '#ffffff',
          },
          outlined: {
            backgroundColor: 'transparent',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            backgroundColor: '#252525',
            color: '#ffffff',
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            backgroundColor: '#1e1e1e',
            color: '#ffffff',
          },
        },
      },
    },
  });

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};