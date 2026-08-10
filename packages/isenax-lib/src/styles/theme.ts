import { createTheme, ThemeOptions } from '@mui/material';

interface CustomThemeVars {
  appPadding: {
    x: number;
    y: number;
  };
  toolMenu: {
    height: number;
  };
  customPalette: {
    [key in string]: string;
  };
}

declare module '@mui/material/styles' {
  interface Theme {
    customVars: CustomThemeVars;
  }

  interface ThemeOptions {
    customVars: CustomThemeVars;
  }
}

export const customVars: CustomThemeVars = {
  appPadding: {
    x: 40,
    y: 40
  },
  toolMenu: {
    height: 40
  },
  customPalette: {
    diagramBg: '#f6faff',
    defaultColor: '#a5b8f3'
  }
};

const createShadows = () => {
  const flat = '0px 1px 2px rgba(0,0,0,0.04)';
  // Menus/popovers/hint tooltips all sit in this range — border carries most of
  // the depth cue, this shadow just softens the edge.
  const floating = '0px 4px 12px rgba(0,0,0,0.08)';
  // Matches isenax-app's own .dialog shadow (App.css) so both look like one system.
  const modal = '0px 24px 48px -16px rgba(0,0,0,0.28)';

  const shadows = Array(25)
    .fill(flat)
    .map((_, i) => {
      if (i === 0) return 'none';
      if (i <= 3) return flat;
      if (i <= 15) return floating;
      return modal;
    }) as Required<ThemeOptions>['shadows'];

  return shadows;
};

export const themeConfig: ThemeOptions = {
  customVars,
  shadows: createShadows(),
  transitions: {
    duration: {
      shortest: 50,
      shorter: 100,
      short: 150,
      standard: 200,
      complex: 250,
      enteringScreen: 150,
      leavingScreen: 100
    }
  },
  typography: {
    h2: {
      fontSize: '4em',
      fontStyle: 'bold',
      lineHeight: 1.2
    },
    h5: {
      fontSize: '1.3em',
      lineHeight: 1.2
    },
    body1: {
      fontSize: '0.85em',
      lineHeight: 1.2
    },
    body2: {
      fontSize: '0.75em',
      lineHeight: 1.2
    }
  },
  shape: {
    borderRadius: 8
  },
  palette: {
    primary: {
      main: '#23262b',
      dark: '#16181b',
      light: '#4a4e55',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#df004c'
    },
    divider: 'rgba(0,0,0,0.08)'
  },
  components: {
    MuiPaper: {
      variants: [
        {
          // Card already forces variant:'outlined' via its own defaultProps below,
          // so this only touches Dialog/Menu/Popover/tooltip Paper's, which default
          // to variant:'elevation'.
          props: { variant: 'elevation' },
          style: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`
          })
        }
      ]
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
        variant: 'outlined'
      }
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          backgroundColor: 'white'
        }
      }
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
        disableTouchRipple: true
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        variant: 'contained',
        disableRipple: true,
        disableTouchRipple: true
      },
      styleOverrides: {
        root: {
          textTransform: 'none'
        }
      }
    },
    MuiTooltip: {
      defaultProps: {
        // Matches isenax-app's own CSS-only toolbar tooltip (App.css
        // [data-tooltip]) so the two tooltip systems -- MUI here for
        // portaled Isoflow buttons, plain CSS there for the app's own
        // buttons -- read as one system instead of two different ones.
        arrow: false,
        enterDelay: 150,
        enterNextDelay: 150
      },
      styleOverrides: {
        tooltip: {
          backgroundColor: '#23262b',
          color: '#fff',
          fontSize: 11,
          fontWeight: 500,
          padding: '4px 8px',
          borderRadius: 6
        }
      }
    },
    MuiSvgIcon: {
      defaultProps: {
        color: 'action'
      },
      styleOverrides: {
        root: {
          width: 17,
          height: 17
        }
      }
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          gap: 4
        },
        grouped: {
          margin: 0,
          border: 0,
          borderRadius: '999px !important'
        }
      }
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: 0,
          borderRadius: 999,
          color: theme.palette.text.secondary,
          '&.Mui-selected': {
            backgroundColor: theme.palette.grey[200],
            color: theme.palette.text.primary
          },
          '&.Mui-selected:hover': {
            backgroundColor: theme.palette.grey[300]
          }
        })
      }
    },
    MuiSlider: {
      styleOverrides: {
        rail: {
          height: 3
        },
        track: {
          height: 3
        },
        thumb: {
          width: 16,
          height: 16
        }
      }
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          // Stock MUI Switch has ~48px of invisible touch-target padding, so
          // consecutive FormControlLabels never touched even at margin:0. Our
          // Switch root is a real 20px tall, so without this two stacked
          // Switch rows render back to back with zero gap between them.
          marginBottom: 8
        }
      }
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 36,
          height: 20,
          padding: 0,
          // FormControlLabel applies a fixed -11px margin to pull its label
          // toward the switch, sized for MUI's default (much wider, padded)
          // 58px root. Our root is only 36px, so without this the label ends
          // up touching (or overlapping) the switch with zero visual gap.
          marginRight: 10
        },
        switchBase: {
          padding: 2,
          '&.Mui-checked': {
            transform: 'translateX(16px)'
          },
          '&.Mui-checked + .MuiSwitch-track': {
            opacity: 1
          }
        },
        thumb: {
          width: 16,
          height: 16,
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          // MUI's default checked-thumb color is currentColor, which inherits
          // the switchBase's checked color (theme.palette.primary.main) — now
          // that primary is near-black, the thumb became the same color as
          // the track and visually vanished. Force it white in both states.
          backgroundColor: '#fff'
        },
        track: ({ theme }) => ({
          borderRadius: 10,
          opacity: 1,
          backgroundColor: theme.palette.grey[300]
        })
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined'
      },
      styleOverrides: {
        root: {
          '.MuiInputBase-input': {}
        }
      }
    }
  }
};

export const theme = createTheme(themeConfig);
