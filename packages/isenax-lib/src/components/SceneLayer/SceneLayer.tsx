import React, { useRef, useEffect, useState, memo } from 'react';
import gsap from 'gsap';
import { Box, SxProps } from '@mui/material';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { ViewTransition } from 'src/types/ui';

const VIEW_TRANSITION_ANIMATION: Record<ViewTransition, string> = {
  IN: 'isenax-view-enter-in',
  OUT: 'isenax-view-enter-out',
  JUMP: 'isenax-view-enter-jump'
};

interface Props {
  children?: React.ReactNode;
  order?: number;
  sx?: SxProps;
  disableAnimation?: boolean;
}

export const SceneLayer = memo(({
  children,
  order = 0,
  sx,
  disableAnimation
}: Props) => {
  const [isFirstRender, setIsFirstRender] = useState(true);
  const elementRef = useRef<HTMLDivElement>(null);

  const scroll = useUiStateStore((state) => {
    return state.scroll;
  });
  const zoom = useUiStateStore((state) => {
    return state.zoom;
  });
  const viewTransition = useUiStateStore((state) => {
    return state.viewTransition;
  });

  useEffect(() => {
    if (!elementRef.current) return;

    gsap.to(elementRef.current, {
      duration: disableAnimation || isFirstRender ? 0 : 0.016, // ~1 frame at 60fps for smooth motion
      ease: 'none', // Linear easing for immediate response
      translateX: scroll.position.x,
      translateY: scroll.position.y,
      scale: zoom
    });

    if (isFirstRender) {
      setIsFirstRender(false);
    }
  }, [zoom, scroll, disableAnimation, isFirstRender]);

  return (
    <Box
      ref={elementRef}
      sx={{
        position: 'absolute',
        zIndex: order,
        top: '50%',
        left: '50%',
        width: 0,
        height: 0,
        userSelect: 'none',
        ...sx
      }}
    >
      {/* The view transition rides on its own element: this one's transform is
          owned by gsap for pan/zoom, and two writers on one transform fight.
          Keyed on the nonce so the animation replays for every view change,
          including two in the same direction. */}
      <Box
        key={viewTransition?.nonce ?? 'no-transition'}
        sx={
          viewTransition
            ? {
                // This element's origin is the scene's origin tile, which is
                // wherever the user has panned it to -- scaling about that
                // would fling the content in from off-screen. Scale about what
                // they're actually looking at instead: the viewport centre,
                // expressed in this element's own (pre-zoom) coordinates.
                transformOrigin: `${-scroll.position.x / zoom}px ${-scroll.position.y / zoom}px`,
                animation: `${VIEW_TRANSITION_ANIMATION[viewTransition.direction]} 200ms cubic-bezier(0.23, 1, 0.32, 1)`,
                '@media (prefers-reduced-motion: reduce)': {
                  animation: `isenax-view-enter-jump 120ms linear`
                }
              }
            : undefined
        }
      >
        {children}
      </Box>
    </Box>
  );
});
