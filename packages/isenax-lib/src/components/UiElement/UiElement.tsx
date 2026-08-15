import React from 'react';
import { Card, SxProps } from '@mui/material';
import { clickStopperProps } from 'src/utils';

interface Props {
  children: React.ReactNode;
  sx?: SxProps;
  style?: React.CSSProperties;
}

// forwardRef so this can be wrapped in MUI transition components (e.g.
// Slide) that need a real DOM ref to measure/animate the child -- without
// it they get null from findDOMNode and crash on getBoundingClientRect.
export const UiElement = React.forwardRef<HTMLDivElement, Props>(
  ({ children, sx, style }, ref) => {
    return (
      <Card
        ref={ref}
        sx={{
          borderRadius: 2,
          boxShadow: 1,
          borderColor: 'grey.400',
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
