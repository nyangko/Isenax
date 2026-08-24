import React, { useMemo, memo } from 'react';
import { useTheme, Box } from '@mui/material';
import { UNPROJECTED_TILE_SIZE, PROJECTED_TILE_SIZE } from 'src/config';
import {
  getAnchorTile,
  getColorVariant,
  getConnectorDirectionIcon
} from 'src/utils';
import { getGroupOffset, getPerpendicularAt } from 'src/utils/connectorGroups';
import { Circle } from 'src/components/Circle/Circle';
import { Svg } from 'src/components/Svg/Svg';
import { useIsoProjection } from 'src/hooks/useIsoProjection';
import { useConnector } from 'src/hooks/useConnector';
import { useScene } from 'src/hooks/useScene';
import { useColor } from 'src/hooks/useColor';
import { useUiStateStore } from 'src/stores/uiStateStore';

// Shared reference point for flow-animation phase sync (see flowBeginSec
// below) — captured once per page load, not per connector.
const ANIMATION_EPOCH = Date.now();

interface Props {
  connector: ReturnType<typeof useScene>['connectors'][0];
  isSelected?: boolean;
  groupIndex?: number;
  groupTotal?: number;
  groupReversed?: boolean;
  groupWidthRatio?: number;
  dimmed?: boolean;
}

// The whole SVG is skewed onto the isometric grid by a CSS matrix (see
// getIsoProjectionCss) that does NOT scale every local tile-space direction
// equally on screen — e.g. a (dx=1,dy=1) step projects to a visibly longer
// on-screen line than a (dx=1,dy=0) step of the same local length. Endpoint
// retraction needs to happen in on-screen length, not local length, or the
// gap ends up a different visual size depending on which way the connector
// approaches its target.
const ISO_SCALE_A = PROJECTED_TILE_SIZE.width / 2 / UNPROJECTED_TILE_SIZE;
const ISO_SCALE_B = PROJECTED_TILE_SIZE.height / 2 / UNPROJECTED_TILE_SIZE;

const projectedLength = (dx: number, dy: number): number => {
  const sx = ISO_SCALE_A * (dx + dy);
  const sy = ISO_SCALE_B * (dy - dx);
  return Math.sqrt(sx * sx + sy * sy) || 1;
};

// A connector's path runs tile-center to tile-center, which lands its drawn
// endpoint dead in the middle of the item it connects to. Retract it just
// enough that the line meets the icon's edge instead of running under it.
const ENDPOINT_INSET_SCREEN_PX = UNPROJECTED_TILE_SIZE * 0.35;

const segmentScreenLength = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  isFlat: boolean
): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return isFlat ? Math.sqrt(dx * dx + dy * dy) || 1 : projectedLength(dx, dy);
};

// Walk from one end of the path, accumulating on-screen segment length, and
// return the point `targetDist` screen-px in — capped at half the path's
// total screen length. A single-segment lookup isn't reliable here: routed
// paths can have a very short (even near-zero) first hop right next to an
// item (waypoint routing, grouped-connector offsets), which would otherwise
// swallow the whole inset in one tiny segment and leave the line touching
// the icon. Walking the full path finds the real edge regardless.
const pointAtScreenDistance = (
  points: { x: number; y: number }[],
  fromStart: boolean,
  targetDist: number,
  isFlat: boolean
): { x: number; y: number } => {
  const seq = fromStart ? points : [...points].reverse();

  let total = 0;
  for (let i = 0; i < seq.length - 1; i++) {
    total += segmentScreenLength(seq[i], seq[i + 1], isFlat);
  }

  let remaining = Math.min(targetDist, total / 2);
  for (let i = 0; i < seq.length - 1; i++) {
    const segLen = segmentScreenLength(seq[i], seq[i + 1], isFlat);
    if (remaining <= segLen) {
      const t = remaining / segLen;
      return {
        x: seq[i].x + (seq[i + 1].x - seq[i].x) * t,
        y: seq[i].y + (seq[i + 1].y - seq[i].y) * t
      };
    }
    remaining -= segLen;
  }
  return seq[seq.length - 1];
};

const insetEndpoints = (
  points: { x: number; y: number }[],
  isFlat: boolean
): { x: number; y: number }[] => {
  if (points.length < 2) return points;
  const result = points.map((p) => ({ ...p }));

  result[0] = pointAtScreenDistance(points, true, ENDPOINT_INSET_SCREEN_PX, isFlat);
  result[result.length - 1] = pointAtScreenDistance(points, false, ENDPOINT_INSET_SCREEN_PX, isFlat);

  return result;
};

const pointsToString = (points: { x: number; y: number }[]): string => {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
};

/**
 * Build a polyline points string from tiles, applying a perpendicular pixel offset.
 */
const buildOffsetPolyline = (
  tiles: { x: number; y: number }[],
  drawOffset: { x: number; y: number },
  perpOffset: number,
  isFlat: boolean
): string => {
  const points = tiles.map((tile, i) => {
    const { dx, dy } = getPerpendicularAt(tiles, i);
    return {
      x: tile.x * UNPROJECTED_TILE_SIZE + drawOffset.x + dx * perpOffset,
      y: tile.y * UNPROJECTED_TILE_SIZE + drawOffset.y + dy * perpOffset
    };
  });
  return pointsToString(insetEndpoints(points, isFlat));
};

export const Connector = memo(({ connector: _connector, isSelected, groupIndex = 0, groupTotal = 1, groupReversed = false, groupWidthRatio = 0, dimmed = false }: Props) => {
  const theme = useTheme();
  const predefinedColor = useColor(_connector.color);
  const { currentView } = useScene();
  const connector = useConnector(_connector.id);
  const connectorAnimationEnabled = useUiStateStore((state) => {
    return state.connectorAnimationEnabled;
  });
  const connectorAnimationSpeed = useUiStateStore((state) => {
    return state.connectorAnimationSpeed;
  });
  const isFlat = useUiStateStore((state) => {
    return state.projectionMode === 'FLAT';
  });

  if (!connector) {
    return null;
  }

  // Use custom color if provided, otherwise use predefined color
  const color = connector.customColor
    ? { value: connector.customColor }
    : predefinedColor;

  if (!color) {
    return null;
  }

  const { css, pxSize } = useIsoProjection({
    ...connector.path.rectangle
  });

  const drawOffset = useMemo(() => {
    return {
      x: UNPROJECTED_TILE_SIZE / 2,
      y: UNPROJECTED_TILE_SIZE / 2
    };
  }, []);

  // connector.path.tiles are stored as an offset from rectangle.from (the
  // MAX-x/MAX-y corner) — isometric's skew + the scale(-1,1) mirror below turn
  // that into a correctly-oriented drawing. Flat mode has no skew to lean on,
  // so re-anchor the same tiles against the wrapper's actual anchor tile
  // instead: useIsoProjection positions the flat wrapper at
  // {x: rectangle.to.x, y: rectangle.from.y} (min-x, but MAX-y since flat's
  // tile.y is negated in getTilePosition) — only x needs reflecting, y is
  // already relative to the same corner the wrapper uses.
  const pathTiles = useMemo(() => {
    if (!isFlat) return connector.path.tiles;

    const { from, to } = connector.path.rectangle;
    const flipX = from.x - to.x;

    return connector.path.tiles.map((tile) => {
      return { x: flipX - tile.x, y: tile.y };
    });
  }, [connector.path.tiles, connector.path.rectangle, isFlat]);

  const connectorWidthPx = useMemo(() => {
    return (UNPROJECTED_TILE_SIZE / 100) * connector.width;
  }, [connector.width]);

  // 20 is the width slider's midpoint — the arrowhead's fixed points below were
  // sized for that reference width, so thinner/thicker lines get a proportionally
  // smaller/larger arrow instead of always the same fixed size.
  const arrowScale = useMemo(() => {
    return Math.max(0.6, Math.min(1.8, connectorWidthPx / 20));
  }, [connectorWidthPx]);

  // Pixel offset to spread parallel connectors within one tile. The perpendicular
  // direction below is derived from each connector's own tile path, which points
  // the opposite way for a connector drawn start<->end reversed relative to its
  // groupmates — negate here (once, for every consumer) so the group spreads
  // apart consistently instead of two reversed connectors landing on top of
  // each other.
  const groupOffsetPx = useMemo(() => {
    const offset = getGroupOffset(groupIndex, groupTotal, UNPROJECTED_TILE_SIZE, groupWidthRatio);
    return groupReversed ? -offset : offset;
  }, [groupIndex, groupTotal, groupReversed, groupWidthRatio]);

  const pathString = useMemo(() => {
    if (groupTotal > 1) {
      return buildOffsetPolyline(pathTiles, drawOffset, groupOffsetPx, isFlat);
    }
    const points = pathTiles.map((tile) => ({
      x: tile.x * UNPROJECTED_TILE_SIZE + drawOffset.x,
      y: tile.y * UNPROJECTED_TILE_SIZE + drawOffset.y
    }));
    return pointsToString(insetEndpoints(points, isFlat));
  }, [pathTiles, drawOffset, groupTotal, groupOffsetPx, isFlat]);

  // Create offset paths for double lines
  const offsetPaths = useMemo(() => {
    if (!connector.lineType || connector.lineType === 'SINGLE') return null;

    const tiles = pathTiles;
    if (tiles.length < 2) return null;

    const doubleOffset = connectorWidthPx * 3;

    if (groupTotal > 1) {
      // For grouped double lines: apply group offset + double-line offset together
      return {
        path1: buildOffsetPolyline(tiles, drawOffset, groupOffsetPx + doubleOffset, isFlat),
        path2: buildOffsetPolyline(tiles, drawOffset, groupOffsetPx - doubleOffset, isFlat)
      };
    }

    // Non-grouped double lines: original behavior
    return {
      path1: buildOffsetPolyline(tiles, drawOffset, doubleOffset, isFlat),
      path2: buildOffsetPolyline(tiles, drawOffset, -doubleOffset, isFlat)
    };
  }, [pathTiles, connector.lineType, connectorWidthPx, drawOffset, groupTotal, groupOffsetPx, isFlat]);

  const anchorPositions = useMemo(() => {
    if (!isSelected) return [];

    const { from, to } = connector.path.rectangle;

    return connector.anchors.map((anchor) => {
      const position = getAnchorTile(anchor, currentView);
      const local = isFlat
        ? { x: position.x - to.x, y: from.y - position.y }
        : { x: from.x - position.x, y: from.y - position.y };

      return {
        id: anchor.id,
        x: local.x * UNPROJECTED_TILE_SIZE + drawOffset.x,
        y: local.y * UNPROJECTED_TILE_SIZE + drawOffset.y
      };
    });
  }, [
    currentView,
    connector.path.rectangle,
    connector.anchors,
    drawOffset,
    isSelected,
    isFlat
  ]);

  const directionIcon = useMemo(() => {
    const icon = getConnectorDirectionIcon(pathTiles);
    if (!icon || groupTotal <= 1) return icon;

    // getConnectorDirectionIcon places the arrowhead on the connector's raw
    // (un-offset) path, so every connector in a group would otherwise draw its
    // arrow at the same spot — shift it by the same perpendicular offset
    // applied to the line itself.
    const { dx, dy } = getPerpendicularAt(pathTiles, pathTiles.length - 2);
    return {
      ...icon,
      x: icon.x + dx * groupOffsetPx,
      y: icon.y + dy * groupOffsetPx
    };
  }, [pathTiles, groupTotal, groupOffsetPx]);

  const strokeDashArray = useMemo(() => {
    switch (connector.style) {
      case 'DASHED':
        return `${connectorWidthPx * 2}, ${connectorWidthPx * 2}`;
      case 'DOTTED':
        return `0, ${connectorWidthPx * 1.8}`;
      case 'SOLID':
      default:
        return 'none';
    }
  }, [connector.style, connectorWidthPx]);

  // Flow indicator: a dot that rides along the connector's own path, independent
  // of its style (SOLID/DASHED/DOTTED stay exactly as drawn — nothing about the
  // line itself changes when animation is on).
  const flowPathD = useMemo(() => {
    const points = pathString.trim();
    if (!points) return '';
    return `M${points.replace(/ /g, ' L ')}`;
  }, [pathString]);

  const flowDurationSec = useMemo(() => {
    const tiles = connector.path.tiles;
    let lengthPx = 0;
    for (let i = 1; i < tiles.length; i++) {
      const dx = (tiles[i].x - tiles[i - 1].x) * UNPROJECTED_TILE_SIZE;
      const dy = (tiles[i].y - tiles[i - 1].y) * UNPROJECTED_TILE_SIZE;
      lengthPx += Math.sqrt(dx * dx + dy * dy);
    }
    return Math.max(0.6, lengthPx / connectorAnimationSpeed);
  }, [connector.path.tiles, connectorAnimationSpeed]);

  // Connectors mount at different times (drawn later, re-rendered, etc.), so
  // each one's own animation would otherwise start its cycle at 0 on mount
  // and drift out of phase from groupmates with the same duration. Phase
  // every connector's flow dot against one shared clock instead: a negative
  // animation-delay jumps it straight to where it would already be if it had
  // been running since that shared reference point, so two connectors with
  // the same length/speed always line up. (CSS animation-delay honors
  // negative values reliably; SVG SMIL's `begin` does not, which is why this
  // is a CSS animation rather than <animateMotion>.)
  const flowBeginSec = useMemo(() => {
    const elapsedSec = (Date.now() - ANIMATION_EPOCH) / 1000;
    return -(elapsedSec % flowDurationSec);
  }, [flowDurationSec]);

  const lineType = connector.lineType || 'SINGLE';

  return (
    <Box style={{ ...css, opacity: dimmed ? 0.25 : 1, transition: 'opacity 0.2s ease-in-out' }}>
      <Svg
        style={{
          // TODO: The original x coordinates of each tile seems to be calculated wrongly
          // in isometric mode — they're mirrored along the x-axis. The hack below fixes
          // this, but we should try to fix this issue at the root of the problem (might
          // have further implications). Flat mode's pathTiles above are already
          // re-anchored to the correct orientation, so this mirror must not double up there.
          transform: isFlat ? undefined : 'scale(-1, 1)'
        }}
        viewboxSize={pxSize}
      >
        {lineType === 'SINGLE' ? (
          <>
            {isSelected && (
              <polyline
                points={pathString}
                stroke={theme.palette.primary.main}
                strokeWidth={connectorWidthPx * 2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={0.5}
                fill="none"
              />
            )}
            <polyline
              points={pathString}
              stroke={theme.palette.common.white}
              strokeWidth={connectorWidthPx * 1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={0.7}
              strokeDasharray={strokeDashArray}
              fill="none"
            />
            <polyline
              points={pathString}
              stroke={getColorVariant(color.value, 'dark', { grade: 1 })}
              strokeWidth={connectorWidthPx}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={strokeDashArray}
              fill="none"
            />
          </>
        ) : offsetPaths ? (
          <>
            {isSelected && (
              <>
                <polyline
                  points={offsetPaths.path1}
                  stroke={theme.palette.primary.main}
                  strokeWidth={connectorWidthPx * 2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={0.5}
                  fill="none"
                />
                <polyline
                  points={offsetPaths.path2}
                  stroke={theme.palette.primary.main}
                  strokeWidth={connectorWidthPx * 2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={0.5}
                  fill="none"
                />
              </>
            )}
            {/* First line of double */}
            <polyline
              points={offsetPaths.path1}
              stroke={theme.palette.common.white}
              strokeWidth={connectorWidthPx * 1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={0.7}
              strokeDasharray={strokeDashArray}
              fill="none"
            />
            <polyline
              points={offsetPaths.path1}
              stroke={getColorVariant(color.value, 'dark', { grade: 1 })}
              strokeWidth={connectorWidthPx}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={strokeDashArray}
              fill="none"
            />
            {/* Second line of double */}
            <polyline
              points={offsetPaths.path2}
              stroke={theme.palette.common.white}
              strokeWidth={connectorWidthPx * 1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={0.7}
              strokeDasharray={strokeDashArray}
              fill="none"
            />
            <polyline
              points={offsetPaths.path2}
              stroke={getColorVariant(color.value, 'dark', { grade: 1 })}
              strokeWidth={connectorWidthPx}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={strokeDashArray}
              fill="none"
            />
          </>
        ) : null}

        {/* Flow direction indicator: a dot riding the connector's own path,
            independent of its line style (solid/dashed/dotted are untouched).
            Driven by a CSS motion-path animation (not SVG SMIL) so the
            negative animation-delay phase sync above actually takes effect —
            see flowBeginSec's comment. */}
        {connectorAnimationEnabled && flowPathD && (
          <circle
            // A CSS animation already running with a given animation-delay
            // doesn't reliably re-jump to a new phase if that delay changes
            // in place (e.g. once flowDurationSec settles after the
            // connector's path finalizes) — keying on both forces a clean
            // remount instead, so the sync offset is always applied fresh.
            key={`${flowDurationSec}-${flowBeginSec}`}
            r={connectorWidthPx * 1.3}
            fill={getColorVariant(color.value, 'dark', { grade: 1 })}
            stroke={theme.palette.common.white}
            strokeWidth={connectorWidthPx * 0.4}
            style={{
              offsetPath: `path("${flowPathD}")`,
              offsetRotate: '0deg',
              animationName: 'isenax-flow-motion',
              animationDuration: `${flowDurationSec}s`,
              animationDelay: `${flowBeginSec}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite'
            } as React.CSSProperties}
          />
        )}

        {/* Circle for port-channel representation */}
        {lineType === 'DOUBLE_WITH_CIRCLE' && pathTiles.length >= 2 && (() => {
          const midIndex = Math.floor(pathTiles.length / 2);
          const midTile = pathTiles[midIndex];
          const { dx, dy } = getPerpendicularAt(pathTiles, midIndex);
          const x = midTile.x * UNPROJECTED_TILE_SIZE + drawOffset.x + dx * groupOffsetPx;
          const y = midTile.y * UNPROJECTED_TILE_SIZE + drawOffset.y + dy * groupOffsetPx;

          // Calculate rotation based on line direction at middle point
          let rotation = 0;
          if (midIndex > 0 && midIndex < pathTiles.length - 1) {
            const prevTile = pathTiles[midIndex - 1];
            const nextTile = pathTiles[midIndex + 1];
            const rdx = nextTile.x - prevTile.x;
            const rdy = nextTile.y - prevTile.y;
            rotation = Math.atan2(rdy, rdx) * (180 / Math.PI);
          }

          // Increased size to encompass both lines with the spacing
          const circleRadiusX = connectorWidthPx * 5;
          const circleRadiusY = connectorWidthPx * 4;

          return (
            <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
              <ellipse
                cx={0}
                cy={0}
                rx={circleRadiusX}
                ry={circleRadiusY}
                fill="none"
                stroke={getColorVariant(color.value, 'dark', { grade: 1 })}
                strokeWidth={connectorWidthPx * 0.8}
              />
              <ellipse
                cx={0}
                cy={0}
                rx={circleRadiusX}
                ry={circleRadiusY}
                fill="none"
                stroke={theme.palette.common.white}
                strokeWidth={connectorWidthPx * 1.2}
                strokeOpacity={0.5}
              />
            </g>
          );
        })()}

        {anchorPositions.map((anchor) => {
          return (
            <g key={anchor.id}>
              <Circle
                tile={anchor}
                radius={18}
                fill={theme.palette.common.white}
                fillOpacity={0.7}
              />
              <Circle
                tile={anchor}
                radius={12}
                stroke={theme.palette.common.black}
                fill={theme.palette.common.white}
                strokeWidth={6}
              />
            </g>
          );
        })}

        {directionIcon && connector.showArrow !== false && (
          <g transform={`translate(${directionIcon.x}, ${directionIcon.y})`}>
            <g transform={`rotate(${directionIcon.rotation}) scale(${arrowScale})`}>
              <polygon
                fill="black"
                stroke={theme.palette.common.white}
                strokeWidth={4}
                points="17.58,17.01 0,-17.01 -17.58,17.01"
              />
            </g>
          </g>
        )}
      </Svg>
    </Box>
  );
});
