import { getConnectorGroups, getGroupOffset } from '../connectorGroups';
import { Connector } from 'src/types';

const TILE_SIZE = 100; // matches UNPROJECTED_TILE_SIZE

const makeConnector = (
  id: string,
  fromItem: string,
  toItem: string,
  customColor?: string,
  width?: number,
  preventOverlap?: boolean
): Connector => ({
  id,
  anchors: [
    { id: `${id}-a1`, ref: { item: fromItem } },
    { id: `${id}-a2`, ref: { item: toItem } }
  ],
  ...(customColor ? { customColor } : {}),
  ...(width !== undefined ? { width } : {}),
  ...(preventOverlap !== undefined ? { preventOverlap } : {})
});

// CONNECTOR_DEFAULTS.width (config.ts) — connectors below that don't pass an
// explicit width fall back to this for groupWidthRatio purposes.
const DEFAULT_WIDTH = 7;

const makeTileConnector = (
  id: string,
  fromTile: { x: number; y: number },
  toTile: { x: number; y: number }
): Connector => ({
  id,
  anchors: [
    { id: `${id}-a1`, ref: { tile: fromTile } },
    { id: `${id}-a2`, ref: { tile: toTile } }
  ]
});

describe('getConnectorGroups', () => {
  it('should return empty map for empty array', () => {
    const result = getConnectorGroups([]);
    expect(result.size).toBe(0);
  });

  it('should return index=0, total=1 for single connector', () => {
    const result = getConnectorGroups([makeConnector('c1', 'item1', 'item2')]);
    expect(result.get('c1')).toEqual({
      index: 0,
      total: 1,
      reversed: false,
      groupWidthRatio: DEFAULT_WIDTH / TILE_SIZE
    });
  });

  it('should group two connectors between same items', () => {
    const result = getConnectorGroups([
      makeConnector('c1', 'item1', 'item2'),
      makeConnector('c2', 'item1', 'item2')
    ]);
    const ratio = (2 * DEFAULT_WIDTH) / TILE_SIZE;
    expect(result.get('c1')).toEqual({ index: 0, total: 2, reversed: false, groupWidthRatio: ratio });
    expect(result.get('c2')).toEqual({ index: 1, total: 2, reversed: false, groupWidthRatio: ratio });
  });

  it('should group connectors regardless of anchor order', () => {
    const result = getConnectorGroups([
      makeConnector('c1', 'item1', 'item2'),
      makeConnector('c2', 'item2', 'item1')
    ]);
    const ratio = (2 * DEFAULT_WIDTH) / TILE_SIZE;
    expect(result.get('c1')).toEqual({ index: 0, total: 2, reversed: false, groupWidthRatio: ratio });
    expect(result.get('c2')).toEqual({ index: 1, total: 2, reversed: true, groupWidthRatio: ratio });
  });

  it('should NOT group connectors between different items', () => {
    const result = getConnectorGroups([
      makeConnector('c1', 'item1', 'item2'),
      makeConnector('c2', 'item1', 'item3')
    ]);
    const ratio = DEFAULT_WIDTH / TILE_SIZE;
    expect(result.get('c1')).toEqual({ index: 0, total: 1, reversed: false, groupWidthRatio: ratio });
    expect(result.get('c2')).toEqual({ index: 0, total: 1, reversed: false, groupWidthRatio: ratio });
  });

  it('should handle 8 connectors between the same two items', () => {
    const connectors = Array.from({ length: 8 }, (_, i) =>
      makeConnector(`c${i}`, 'item1', 'item2')
    );
    const result = getConnectorGroups(connectors);
    const ratio = (8 * DEFAULT_WIDTH) / TILE_SIZE;

    for (let i = 0; i < 8; i++) {
      expect(result.get(`c${i}`)).toEqual({ index: i, total: 8, reversed: false, groupWidthRatio: ratio });
    }
  });

  it('should handle tile-based anchors', () => {
    const result = getConnectorGroups([
      makeTileConnector('c1', { x: 0, y: 0 }, { x: 1, y: 1 }),
      makeTileConnector('c2', { x: 0, y: 0 }, { x: 1, y: 1 }),
      makeTileConnector('c3', { x: 2, y: 2 }, { x: 3, y: 3 })
    ]);
    const pairRatio = (2 * DEFAULT_WIDTH) / TILE_SIZE;
    const soloRatio = DEFAULT_WIDTH / TILE_SIZE;
    expect(result.get('c1')).toEqual({ index: 0, total: 2, reversed: false, groupWidthRatio: pairRatio });
    expect(result.get('c2')).toEqual({ index: 1, total: 2, reversed: false, groupWidthRatio: pairRatio });
    expect(result.get('c3')).toEqual({ index: 0, total: 1, reversed: false, groupWidthRatio: soloRatio });
  });

  it('should handle mixed groups', () => {
    const result = getConnectorGroups([
      makeConnector('c1', 'A', 'B'),
      makeConnector('c2', 'A', 'B'),
      makeConnector('c3', 'A', 'B'),
      makeConnector('c4', 'A', 'C'),
      makeConnector('c5', 'A', 'C'),
      makeConnector('c6', 'D', 'E')
    ]);
    const trioRatio = (3 * DEFAULT_WIDTH) / TILE_SIZE;
    const pairRatio = (2 * DEFAULT_WIDTH) / TILE_SIZE;
    const soloRatio = DEFAULT_WIDTH / TILE_SIZE;

    expect(result.get('c1')).toEqual({ index: 0, total: 3, reversed: false, groupWidthRatio: trioRatio });
    expect(result.get('c2')).toEqual({ index: 1, total: 3, reversed: false, groupWidthRatio: trioRatio });
    expect(result.get('c3')).toEqual({ index: 2, total: 3, reversed: false, groupWidthRatio: trioRatio });
    expect(result.get('c4')).toEqual({ index: 0, total: 2, reversed: false, groupWidthRatio: pairRatio });
    expect(result.get('c5')).toEqual({ index: 1, total: 2, reversed: false, groupWidthRatio: pairRatio });
    expect(result.get('c6')).toEqual({ index: 0, total: 1, reversed: false, groupWidthRatio: soloRatio });
  });

  describe('mixed preventOverlap within a group', () => {
    // A connector with preventOverlap: false is left out of `result` entirely
    // (callers default a missing entry to `{ total: 1 }`, which renders at
    // the raw, un-offset/tile-centered position) — so "no collision" below
    // means the floating connector's own offset never comes out to 0.
    it('gives the one floating connector a non-zero offset when its sibling opts out', () => {
      const result = getConnectorGroups([
        makeConnector('c1', 'A', 'B', undefined, undefined, true),
        makeConnector('c2', 'A', 'B', undefined, undefined, false)
      ]);

      expect(result.get('c2')).toBeUndefined();
      const c1 = result.get('c1')!;
      expect(getGroupOffset(c1.index, c1.total, TILE_SIZE, c1.groupWidthRatio)).not.toBe(0);
    });

    it('keeps an even-sized floating subgroup unchanged (already avoids 0)', () => {
      const result = getConnectorGroups([
        makeConnector('c1', 'A', 'B', undefined, undefined, true),
        makeConnector('c2', 'A', 'B', undefined, undefined, true),
        makeConnector('c3', 'A', 'B', undefined, undefined, false)
      ]);

      expect(result.get('c3')).toBeUndefined();
      const c1 = result.get('c1')!;
      const c2 = result.get('c2')!;
      expect(c1.total).toBe(2);
      const offsets = [
        getGroupOffset(c1.index, c1.total, TILE_SIZE, c1.groupWidthRatio),
        getGroupOffset(c2.index, c2.total, TILE_SIZE, c2.groupWidthRatio)
      ];
      expect(offsets).not.toContain(0);
    });

    it('pads an odd-sized floating subgroup so none of them land on 0', () => {
      const result = getConnectorGroups([
        makeConnector('c1', 'A', 'B', undefined, undefined, true),
        makeConnector('c2', 'A', 'B', undefined, undefined, false),
        makeConnector('c3', 'A', 'B', undefined, undefined, true),
        makeConnector('c4', 'A', 'B', undefined, undefined, true)
      ]);

      expect(result.get('c2')).toBeUndefined();
      const offsets = ['c1', 'c3', 'c4'].map((id) => {
        const entry = result.get(id)!;
        return getGroupOffset(entry.index, entry.total, TILE_SIZE, entry.groupWidthRatio);
      });
      expect(offsets).not.toContain(0);
    });

    it('leaves a pure floating group (no preventOverlap: false) unaffected', () => {
      const result = getConnectorGroups([
        makeConnector('c1', 'A', 'B', undefined, undefined, true),
        makeConnector('c2', 'A', 'B', undefined, undefined, true),
        makeConnector('c3', 'A', 'B', undefined, undefined, true)
      ]);

      expect(result.get('c1')).toEqual({ index: 0, total: 3, reversed: false, groupWidthRatio: (3 * DEFAULT_WIDTH) / TILE_SIZE });
    });
  });

  it('should group a connector with a waypoint (3+ anchors) with its 2-anchor sibling by first/last endpoint', () => {
    const withWaypoint: Connector = {
      id: 'c1',
      anchors: [
        { id: 'c1-a1', ref: { item: 'item1' } },
        { id: 'c1-mid', ref: { tile: { x: 2, y: 0 } } },
        { id: 'c1-a2', ref: { item: 'item2' } }
      ]
    };
    const result = getConnectorGroups([withWaypoint, makeConnector('c2', 'item1', 'item2')]);
    const ratio = (2 * DEFAULT_WIDTH) / TILE_SIZE;
    expect(result.get('c1')).toEqual({ index: 0, total: 2, reversed: false, groupWidthRatio: ratio });
    expect(result.get('c2')).toEqual({ index: 1, total: 2, reversed: false, groupWidthRatio: ratio });
  });

  it('should widen spacing for a group with mixed connector widths', () => {
    const result = getConnectorGroups([
      makeConnector('thin1', 'item1', 'item2', undefined, 10),
      makeConnector('thick', 'item1', 'item2', undefined, 30),
      makeConnector('thin2', 'item1', 'item2', undefined, 10)
    ]);
    const ratio = (10 + 30 + 10) / TILE_SIZE;
    expect(result.get('thin1')?.groupWidthRatio).toBeCloseTo(ratio);
    expect(result.get('thick')?.groupWidthRatio).toBeCloseTo(ratio);
    expect(result.get('thin2')?.groupWidthRatio).toBeCloseTo(ratio);
  });
});

describe('getGroupOffset', () => {
  it('should return 0 for single connector', () => {
    expect(getGroupOffset(0, 1, TILE_SIZE)).toBe(0);
  });

  it('should return symmetric offsets for two connectors', () => {
    const o0 = getGroupOffset(0, 2, TILE_SIZE);
    const o1 = getGroupOffset(1, 2, TILE_SIZE);
    // index 0 (the picker list's top row) gets the positive extreme — see
    // the comment on getGroupOffset for why.
    expect(o0).toBeGreaterThan(0);
    expect(o1).toBeLessThan(0);
    expect(o0).toBe(-o1);
  });

  it('should return correct offsets for 8 connectors', () => {
    const offsets = Array.from({ length: 8 }, (_, i) =>
      getGroupOffset(i, 8, TILE_SIZE)
    );

    // Verify symmetry: offset[i] === -offset[7-i]
    for (let i = 0; i < 4; i++) {
      expect(offsets[i]).toBeCloseTo(-offsets[7 - i], 10);
    }

    // Verify monotonically decreasing (index 0 gets the highest offset)
    for (let i = 1; i < 8; i++) {
      expect(offsets[i]).toBeLessThan(offsets[i - 1]);
    }
  });

  it('should fit all connectors within one tile', () => {
    for (const total of [2, 3, 4, 5, 6, 7, 8]) {
      const offsets = Array.from({ length: total }, (_, i) =>
        getGroupOffset(i, total, TILE_SIZE)
      );
      const minOffset = Math.min(...offsets);
      const maxOffset = Math.max(...offsets);
      const totalSpread = maxOffset - minOffset;

      // Total spread must fit within the tile (using 80% of tile)
      expect(totalSpread).toBeLessThanOrEqual(TILE_SIZE * 0.8);
    }
  });

  it('should center the group around 0', () => {
    for (const total of [2, 3, 4, 5, 6, 7, 8]) {
      const sum = Array.from({ length: total }, (_, i) =>
        getGroupOffset(i, total, TILE_SIZE)
      ).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(0, 10);
    }
  });

  it('should scale with tile size', () => {
    const offset100 = getGroupOffset(0, 4, 100);
    const offset200 = getGroupOffset(0, 4, 200);
    expect(offset200).toBeCloseTo(offset100 * 2);
  });

  it('should widen spacing when groupWidthRatio exceeds the default 80% budget', () => {
    const narrow = getGroupOffset(0, 3, TILE_SIZE, 0.2);
    const wide = getGroupOffset(0, 3, TILE_SIZE, 0.9);
    expect(Math.abs(wide)).toBeGreaterThan(Math.abs(narrow));
  });

  it('should ignore groupWidthRatio below the default 80% budget', () => {
    const withoutRatio = getGroupOffset(0, 3, TILE_SIZE);
    const withSmallRatio = getGroupOffset(0, 3, TILE_SIZE, 0.1);
    expect(withSmallRatio).toBeCloseTo(withoutRatio);
  });
});

describe('8 parallel connectors with individual colors', () => {
  const colors = [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080'
  ];

  it('should allow 8 connectors between same nodes with different colors', () => {
    const connectors = colors.map((color, i) =>
      makeConnector(`c${i}`, 'item1', 'item2', color)
    );

    expect(connectors).toHaveLength(8);

    const uniqueColors = new Set(connectors.map((c) => c.customColor));
    expect(uniqueColors.size).toBe(8);

    const groups = getConnectorGroups(connectors);
    for (let i = 0; i < 8; i++) {
      expect(groups.get(`c${i}`)).toEqual({ index: i, total: 8, reversed: false, groupWidthRatio: (8 * DEFAULT_WIDTH) / TILE_SIZE });
    }
  });

  it('should produce distinct offsets for all 8 connectors', () => {
    const offsets = Array.from({ length: 8 }, (_, i) =>
      getGroupOffset(i, 8, TILE_SIZE)
    );
    const uniqueOffsets = new Set(offsets);
    expect(uniqueOffsets.size).toBe(8);
  });

  it('should serialize 8 connectors between two nodes to JSON and back', () => {
    const connectors = colors.map((color, i) =>
      makeConnector(`c${i}`, 'item1', 'item2', color)
    );

    const json = JSON.stringify({ connectors });
    const parsed = JSON.parse(json);

    expect(parsed.connectors).toHaveLength(8);

    for (let i = 0; i < 8; i++) {
      const c = parsed.connectors[i];
      expect(c.id).toBe(`c${i}`);
      expect(c.anchors[0].ref.item).toBe('item1');
      expect(c.anchors[1].ref.item).toBe('item2');
      expect(c.customColor).toBe(colors[i]);
    }

    // Verify grouping works after deserialization
    const groups = getConnectorGroups(parsed.connectors);
    for (let i = 0; i < 8; i++) {
      expect(groups.get(`c${i}`)).toEqual({ index: i, total: 8, reversed: false, groupWidthRatio: (8 * DEFAULT_WIDTH) / TILE_SIZE });
    }
  });
});
