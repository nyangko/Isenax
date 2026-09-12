import React, { useCallback, useMemo, useRef } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { UiElement } from 'src/components/UiElement/UiElement';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useResizeObserver } from 'src/hooks/useResizeObserver';
import { useScene } from 'src/hooks/useScene';
import {
  CoordsUtils,
  connectorPathTileToGlobal,
  getTilePosition,
  getUnprojectedBounds,
  getViewportSceneBounds
} from 'src/utils';
import { Coords } from 'src/types';

// Below this the whole diagram fits comfortably on screen and the map is
// just clutter.
const MIN_ITEMS = 8;
const WIDTH = 180;
const HEIGHT = 120;
// Below this the map plus its margins eats a third of the canvas and runs
// into the top toolbar (landscape phones).
const MIN_RENDERER_HEIGHT = 480;

// One rule for both the map and its toggle in ZoomControls, so the button
// never shows where the map can't: phone-width viewports (the same `sm`
// breakpoint the Layers panel uses to become a bottom sheet) and short ones.
export const useMinimapAvailable = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const rendererEl = useUiStateStore((state) => {
    return state.rendererEl;
  });
  const { size } = useResizeObserver(rendererEl);

  return !isMobile && size.height >= MIN_RENDERER_HEIGHT;
};
// Item dots are sized in screen px so they stay legible however large the
// diagram (the viewBox spans thousands of scene units).
const DOT_RADIUS_PX = 2.5;

const toPoints = (corners: Coords[]) => {
  return corners
    .map((c) => {
      return `${c.x},${c.y}`;
    })
    .join(' ');
};

// Deliberately not a scaled-down Renderer: this only answers "where am I"
// and "take me there", so it draws item dots, rectangle outlines, hairline
// connectors and the viewport -- no icons, no labels, no store subscriptions
// per layer. Toggled from ZoomControls / the minimap hotkey (uiState.showMinimap).
export const Minimap = () => {
  const theme = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const { currentView, connectors } = useScene();
  const scroll = useUiStateStore((state) => {
    return state.scroll;
  });
  const zoom = useUiStateStore((state) => {
    return state.zoom;
  });
  const rendererEl = useUiStateStore((state) => {
    return state.rendererEl;
  });
  const isFlat = useUiStateStore((state) => {
    return state.projectionMode === 'FLAT';
  });
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const showMinimap = useUiStateStore((state) => {
    return state.showMinimap;
  });
  const available = useMinimapAvailable();
  const { size: rendererSize } = useResizeObserver(rendererEl);

  const content = useMemo(() => {
    return getUnprojectedBounds(currentView, isFlat);
  }, [currentView, isFlat]);

  const dots = useMemo(() => {
    return currentView.items.map((item) => {
      return { id: item.id, ...getTilePosition({ tile: item.tile, flat: isFlat }) };
    });
  }, [currentView.items, isFlat]);

  const outlines = useMemo(() => {
    return (currentView.rectangles ?? []).map((rectangle) => {
      const { from, to } = rectangle;
      const corners = [from, { x: to.x, y: from.y }, to, { x: from.x, y: to.y }];

      return {
        id: rectangle.id,
        points: toPoints(
          corners.map((tile) => {
            return getTilePosition({ tile, flat: isFlat });
          })
        )
      };
    });
  }, [currentView.rectangles, isFlat]);

  // Paths are already routed by the scene store; just project the tiles.
  // No arrowheads: at this scale they'd be blobs and direction can't be read.
  const lines = useMemo(() => {
    return connectors.flatMap((connector) => {
      // The scene store routes paths after the model changes; a connector
      // can exist for a render before its path does.
      if (!connector.path) return [];

      const { tiles, rectangle } = connector.path;

      return [{
        id: connector.id,
        points: toPoints(
          tiles.map((tile) => {
            return getTilePosition({
              tile: connectorPathTileToGlobal(tile, rectangle.from),
              flat: isFlat
            });
          })
        )
      }];
    });
  }, [connectors, isFlat]);

  const centerOn = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const ctm = svgRef.current?.getScreenCTM();
      if (!ctm) return;

      const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());

      // SceneLayer shows scene point p at centre + scroll + p * zoom, so
      // centring p means scroll = -p * zoom.
      uiStateActions.setScroll({
        position: { x: -point.x * zoom, y: -point.y * zoom },
        offset: CoordsUtils.zero()
      });
    },
    [uiStateActions, zoom]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      centerOn(e);
    },
    [centerOn]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.buttons === 1) centerOn(e);
    },
    [centerOn]
  );

  if (!available || !showMinimap || currentView.items.length < MIN_ITEMS) return null;

  const viewport = getViewportSceneBounds({ scroll, zoom, rendererSize });
  // Union of content and viewport, so the viewport marker never leaves the
  // map when the user pans off the diagram.
  const x0 = Math.min(content.x, viewport.x);
  const y0 = Math.min(content.y, viewport.y);
  const x1 = Math.max(content.x + content.width, viewport.x + viewport.width);
  const y1 = Math.max(content.y + content.height, viewport.y + viewport.height);
  // preserveAspectRatio=meet: one screen px covers this many scene units.
  const unitsPerPx = Math.max((x1 - x0) / WIDTH, (y1 - y0) / HEIGHT);

  return (
    <UiElement>
      <Box
        component="svg"
        data-testid="minimap"
        ref={svgRef}
        width={WIDTH}
        height={HEIGHT}
        viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        sx={{ display: 'block', cursor: 'crosshair', touchAction: 'none' }}
      >
        {outlines.map((outline) => {
          return (
            <polygon
              key={outline.id}
              points={outline.points}
              fill={theme.palette.text.secondary}
              fillOpacity={0.12}
              stroke={theme.palette.text.secondary}
              strokeOpacity={0.4}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {lines.map((line) => {
          return (
            <polyline
              key={line.id}
              points={line.points}
              fill="none"
              stroke={theme.palette.text.secondary}
              strokeOpacity={0.5}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {dots.map((dot) => {
          return (
            <circle
              key={dot.id}
              cx={dot.x}
              cy={dot.y}
              r={DOT_RADIUS_PX * unitsPerPx}
              fill={theme.palette.text.secondary}
            />
          );
        })}
        <rect
          x={viewport.x}
          y={viewport.y}
          width={viewport.width}
          height={viewport.height}
          fill={theme.palette.primary.main}
          fillOpacity={0.08}
          stroke={theme.palette.primary.main}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      </Box>
    </UiElement>
  );
};
