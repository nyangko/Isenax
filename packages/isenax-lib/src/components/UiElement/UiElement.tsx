import React from 'react';
import { Card, SxProps } from '@mui/material';
import { clickStopperProps } from 'src/utils';

interface Props {
  children: React.ReactNode;
  sx?: SxProps;
  style?: React.CSSProperties;
  // A docked sidebar (flush to the renderer edge, full height) reads as a
  // popup card with the default rounded corners + drop shadow -- this swaps
  // in a flat, bordered look instead. Floating toolbars/panels keep the
  // default.
  variant?: 'floating' | 'docked';
}

// forwardRef so this can be wrapped in MUI transition components (e.g.
// Slide) that need a real DOM ref to measure/animate the child -- without
// it they get null from findDOMNode and crash on getBoundingClientRect.
export const UiElement = React.forwardRef<HTMLDivElement, Props>(
  ({ children, sx, style, variant = 'floating' }, ref) => {
    return (
      <Card
        ref={ref}
        sx={{
          ...(variant === 'docked'
            ? {
                borderRadius: 0,
                boxShadow: 'none',
                borderLeft: 1,
                borderColor: 'grey.300'
              }
            : {
                borderRadius: 2,
                boxShadow: 1,
                borderColor: 'grey.400'
              }),
          p: 0,
          ...sx
        }}
        style={style}
        {...clickStopperProps}
      >
        {children}
      </Card>
    );
  }
);
