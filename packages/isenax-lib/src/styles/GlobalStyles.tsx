import React from 'react';
import { GlobalStyles as MUIGlobalStyles } from '@mui/material';
import 'react-quill-new/dist/quill.snow.css';

export const GlobalStyles = () => {
  return (
    <MUIGlobalStyles
      styles={{
        div: {
          boxSizing: 'border-box'
        },
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.22) transparent'
        },
        '*::-webkit-scrollbar': {
          width: 8,
          height: 8
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent'
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0, 0, 0, 0.22)',
          borderRadius: 8,
          border: '2px solid transparent',
          backgroundClip: 'padding-box'
        },
        '*::-webkit-scrollbar-thumb:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.4)'
        },
        '*::-webkit-scrollbar-corner': {
          background: 'transparent'
        },
        // Drives the connector flow-direction dot (see Connector.tsx). CSS
        // animation-delay reliably supports negative values for phase sync
        // across elements with the same duration — SVG SMIL (animateMotion)
        // doesn't honor that consistently, which is why this isn't SMIL.
        '@keyframes isenax-flow-motion': {
          from: { offsetDistance: '0%' },
          to: { offsetDistance: '100%' }
        },
        // Drilling into a child view and coming back out (see SceneLayer). The
        // scale direction is the whole point: going in, the child's content
        // grows up to full size the way a magnified detail would; coming out,
        // the parent settles back from slightly-too-close. A sideways jump
        // (view tree, breadcrumb) is a plain fade -- there's no in/out to read.
        '@keyframes isenax-view-enter-in': {
          from: { opacity: 0, transform: 'scale(0.92)' },
          to: { opacity: 1, transform: 'scale(1)' }
        },
        '@keyframes isenax-view-enter-out': {
          from: { opacity: 0, transform: 'scale(1.06)' },
          to: { opacity: 1, transform: 'scale(1)' }
        },
        '@keyframes isenax-view-enter-jump': {
          from: { opacity: 0 },
          to: { opacity: 1 }
        }
      }}
    />
  );
};
