import type { Connector } from 'src/types';
import { UNPROJECTED_TILE_SIZE, CONNECTOR_DEFAULTS } from 'src/config';

/**
 * Calculate the perpendicular unit vector at a point along a tile path.
 * Shared between Connector.tsx (rendering) and renderer.ts's getItemAtTile
 * (hit-testing) so a click's nearest-connector check always agrees with
 * where the connector is actually drawn.
 */
export function getPerpendicularAt(
  tiles: { x: number; y: number }[],
  i: number
): { dx: number; dy: number } {
  const curr = tiles[i];
  let dirX = 0;
  let dirY = 0;

  if (i > 0 && i < tiles.length - 1) {
    const prev = tiles[i - 1];
    const next = tiles[i + 1];
    dirX = ((curr.x - prev.x) + (next.x - curr.x)) / 2;
    dirY = ((curr.y - prev.y) + (next.y - curr.y)) / 2;
  } else if (i === 0 && tiles.length > 1) {
    dirX = tiles[1].x - curr.x;
    dirY = tiles[1].y - curr.y;
  } else if (i === tiles.length - 1 && tiles.length > 1) {
    const prev = tiles[i - 1];
    dirX = curr.x - prev.x;
    dirY = curr.y - prev.y;
  }

  const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  return { dx: -dirY / len, dy: dirX / len };
}

function getAnchorRefString(ref: Connector['anchors'][0]['ref']): string {
  if (ref.item !== undefined) {
    return ref.item;
  }
  if (ref.tile !== undefined) {
    return `tile:${ref.tile.x},${ref.tile.y}`;
  }
  if (ref.anchor !== undefined) {
    return `anchor:${ref.anchor}`;
  }
  return JSON.stringify(ref);
}

/**
 * Group connectors that share the same pair of anchor references.
 * Returns a Map where each connector ID maps to its index within its group
 * and the total group size.
 */
export function getConnectorGroups(
  connectors: Connector[]
): Map<string, { index: number; total: number; reversed: boolean; groupWidthRatio: number }> {
  const groups = new Map<
    string,
    { id: string; reversed: boolean; width: number; fixed: boolean }[]
  >();

  for (const connector of connectors) {
    if (connector.anchors.length < 2) {
      continue;
    }

    // Group by overall endpoints (first/last), not anchors.length === 2 --
    // a connector with waypoints in between (e.g. dragged into a bend, even
    // one later straightened back to collinear) must still group with a
    // straight sibling sharing the same start/end, or both lose their offset
    // and render on top of each other.
    const ref1 = getAnchorRefString(connector.anchors[0].ref);
    const ref2 = getAnchorRefString(connector.anchors[connector.anchors.length - 1].ref);
    const sorted = [ref1, ref2].sort();
    const key = sorted.join('|');
    // Anchor order (which endpoint was drawn first) differs per connector even
    // within the same group; normalize against the group's canonical (sorted)
    // order so perpendicular offsets below are all computed relative to the
    // same direction instead of each connector's own draw direction.
    const reversed = ref1 !== sorted[0];
    const width = connector.width ?? CONNECTOR_DEFAULTS.width;
    // A connector that opts out of auto-spacing still renders at its raw,
    // un-offset (i.e. tile-centered) position — it stays in the group so its
    // width/presence is accounted for, it just never gets assigned an offset
    // slot itself (see the `floating` split below).
    const fixed = connector.preventOverlap === false;

    const existing = groups.get(key);
    if (existing) {
      existing.push({ id: connector.id, reversed, width, fixed });
    } else {
      groups.set(key, [{ id: connector.id, reversed, width, fixed }]);
    }
  }

  const result = new Map<
    string,
    { index: number; total: number; reversed: boolean; groupWidthRatio: number }
  >();

  for (const entries of groups.values()) {
    // Fraction of a tile the group's connectors would occupy side by side —
    // used by getGroupOffset to widen spacing when the group is thick, so a
    // fatter connector doesn't visually overlap its thinner groupmates.
    // Includes fixed connectors' width too, since they still take up space.
    const groupWidthRatio =
      entries.reduce((sum, entry) => sum + entry.width, 0) / UNPROJECTED_TILE_SIZE;

    const floating = entries.filter((entry) => !entry.fixed);
    const hasFixed = floating.length !== entries.length;
    const n = floating.length;
    // A plain n-member group's middle slot lands exactly on offset 0 whenever
    // n is odd (see getGroupOffset) — harmless by itself, but that's exactly
    // where every fixed sibling renders, so an odd-sized floating subgroup
    // would silently land on top of it. Padding the slot count to the next
    // even number shifts every floating slot off of 0 without changing
    // anything when there's no fixed sibling to collide with.
    const effectiveTotal = hasFixed && n % 2 === 1 ? n + 1 : n;

    floating.forEach(({ id, reversed }, index) => {
      result.set(id, { index, total: effectiveTotal, reversed, groupWidthRatio });
    });
    // Fixed entries are intentionally left out of `result` — callers default
    // a missing entry to `{ total: 1 }`, which renders it at its raw,
    // un-offset position (exactly what "prevent overlap: false" should mean).
  }

  return result;
}

/**
 * Calculate the perpendicular pixel offset for a connector within a group.
 * Connectors in a group normally fit within a single tile, but if the
 * group's combined width (groupWidthRatio) exceeds the default 80% budget,
 * spacing widens to match — otherwise a thick connector can visually
 * overlap thinner groupmates even though each has its own "slot".
 *
 * @param index - Position of the connector within its group (0-based)
 * @param total - Total number of connectors in the group
 * @param tileSize - Size of one tile in pixels (connectors must fit within this)
 * @param groupWidthRatio - Combined connector width as a fraction of one tile
 *   (from getConnectorGroups); omit or pass 0 to keep the original fixed 80% spacing.
 * @returns Pixel offset to apply perpendicular to the connector path
 */
export function getGroupOffset(
  index: number,
  total: number,
  tileSize: number,
  groupWidthRatio: number = 0
): number {
  if (total <= 1) {
    return 0;
  }

  // Use 80% of tile to leave padding at edges, unless the group's connectors
  // are collectively thicker than that, in which case widen to fit them.
  const usableWidth = tileSize * Math.max(0.8, groupWidthRatio * 1.5);
  const spacing = usableWidth / (total - 1);

  // Negated so index 0 (the picker list's top row) lands on the visually
  // "first" side rather than the last — otherwise dragging a connector to
  // the top of the list moved it to the back of the stack instead.
  return ((total - 1) / 2 - index) * spacing;
}
