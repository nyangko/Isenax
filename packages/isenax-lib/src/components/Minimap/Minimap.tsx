import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import { IconMap as MinimapIcon, IconX as CloseIcon } from '@tabler/icons-react';
import { UiElement } from 'src/components/UiElement/UiElement';
import { IconButton } from 'src/components/IconButton/IconButton';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useResizeObserver } from 'src/hooks/useResizeObserver';
import { useScene } from 'src/hooks/useScene';
import {
  CoordsUtils,
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
// and "take me there", so it draws item dots, rectangle outlines and the
// viewport -- no icons, no connectors, no store subscriptions per layer.
export const Minimap = () => {
  const theme = useTheme();
  const [hidden, setHidden] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const { currentView } = useScene();
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

  if (currentView.items.length < MIN_ITEMS) return null;

  if (hidden) {
    return (
      <UiElement>
        <IconButton
          name="Show minimap"
          Icon={<MinimapIcon size={20} />}
          onClick={() => {
            return setHidden(false);
          }}
        />
      </UiElement>
    );
  }

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
    <UiElement sx={{ position: 'relative' }}>
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
      <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
        <IconButton
          name="Hide minimap"
          Icon={<CloseIcon size={14} />}
          onClick={() => {
            return setHidden(true);
          }}
        />
      </Box>
    </UiElement>
  );
};
