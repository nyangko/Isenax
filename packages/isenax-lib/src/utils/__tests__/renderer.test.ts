import { Coords, Size, Scroll } from 'src/types';
import { CoordsUtils, SizeUtils, getConnectorGroups, getGroupOffset } from 'src/utils';
import { PROJECTED_TILE_SIZE, UNPROJECTED_TILE_SIZE } from 'src/config';
import { getGridSubset, isWithinBounds, screenToIso, getItemAtTile, getTilePosition } from '../renderer';

const getRendererSize = (tileSize: Size, zoom: number = 1): Size => {
  const projectedTileSize = SizeUtils.multiply(PROJECTED_TILE_SIZE, zoom);

  return {
    width: projectedTileSize.width * tileSize.width,
    height: projectedTileSize.height * tileSize.height
  };
};

const getScroll = (coords: Coords): Scroll => {
  return {
    position: coords,
    offset: CoordsUtils.zero()
  };
};

describe('Tests renderer utils', () => {
  test('getGridSubset() works correctly', () => {
    const gridSubset = getGridSubset([
      { x: 5, y: 5 },
      { x: 7, y: 7 }
    ]);

    expect(gridSubset).toEqual([
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 5, y: 7 },
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 6, y: 7 },
      { x: 7, y: 5 },
      { x: 7, y: 6 },
      { x: 7, y: 7 }
    ]);
  });

  test('isWithinBounds() works correctly', () => {
    const bounds: Coords[] = [
      { x: 4, y: 4 },
      { x: 6, y: 6 }
    ];

    const withinBounds = isWithinBounds({ x: 5, y: 5 }, bounds);
    const onBorder = isWithinBounds({ x: 4, y: 4 }, bounds);
    const outsideBounds = isWithinBounds({ x: 3, y: 3 }, bounds);

    expect(withinBounds).toBe(true);
    expect(onBorder).toBe(true);
    expect(outsideBounds).toBe(false);
  });

  test('screenToIso() works correctly when mouse is at center of project', () => {
    const zoom = 1;
    const rendererSize = getRendererSize({ width: 10, height: 10 }, zoom);
    const scroll = getScroll({ x: 0, y: 0 });
    const tile = screenToIso({
      mouse: {
        x: rendererSize.width / 2,
        y: rendererSize.height / 2
      },
      zoom,
      scroll,
      rendererSize
    });

    expect(tile).toEqual({ x: 0, y: -0 });
  });

  test('screenToIso() works correctly when mouse is at topLeft corner of project', () => {
    const zoom = 1;
    const rendererSize = getRendererSize({ width: 10, height: 10 }, zoom);
    const scroll = getScroll({ x: 0, y: 0 });
    const tile = screenToIso({
      mouse: {
        x: 0,
        y: 0
      },
      zoom,
      scroll,
      rendererSize
    });

    expect(tile).toEqual({ x: 0, y: 10 });
  });

  test('screenToIso() works correctly when mouse is at topLeft corner of project and zoom is 0.5', () => {
    const zoom = 0.5;
    const rendererSize = getRendererSize({ width: 10, height: 10 }, zoom);
    const scroll = getScroll({ x: 0, y: 0 });
    const tile = screenToIso({
      mouse: {
        x: 0,
        y: 0
      },
      zoom,
      scroll,
      rendererSize
    });

    expect(tile).toEqual({ x: 0, y: 10 });
  });

  test('screenToIso() works correctly when mouse is at center of project and zoom is 0.5 and screen is halfway scrolled', () => {
    const zoom = 1;
    const rendererSize = getRendererSize({ width: 10, height: 10 }, zoom);
    const scroll = getScroll({
      x: rendererSize.width / 2,
      y: rendererSize.height / 2
    });
    const tile = screenToIso({
      mouse: {
        x: rendererSize.width / 2,
        y: rendererSize.height / 2
      },
      zoom,
      scroll,
      rendererSize
    });

    expect(tile).toEqual({ x: 0, y: 10 });
  });

  test('getItemAtTile() selects a TextBox instead of an underlying Rectangle when clicking on the text, even off its single anchor row', () => {
    const scene = {
      items: [],
      connectors: [],
      rectangles: [
        { id: 'zone', from: { x: -5, y: -5 }, to: { x: 5, y: 5 } }
      ],
      textBoxes: [
        {
          id: 'label',
          tile: { x: -2, y: -2 },
          orientation: 'X',
          size: { width: 3, height: 1 }
        }
      ]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    // Directly on the textbox's own anchor row: already worked before the fix.
    expect(getItemAtTile({ tile: { x: -1, y: -2 }, scene })).toEqual({
      type: 'TEXTBOX',
      id: 'label'
    });

    // One row off the anchor, but still within the text's rendered (1-tile-tall)
    // footprint — this used to fall through to the Rectangle underneath.
    expect(getItemAtTile({ tile: { x: -1, y: -1 }, scene })).toEqual({
      type: 'TEXTBOX',
      id: 'label'
    });

    // Comfortably outside the textbox's footprint: still resolves to the Rectangle.
    expect(getItemAtTile({ tile: { x: -1, y: 3 }, scene })).toEqual({
      type: 'RECTANGLE',
      id: 'zone'
    });
  });

  test('getItemAtTile() hits a fractionally-positioned TextBox (e.g. a zone label placed at {x: 1.2, y: -4.8})', () => {
    const scene = {
      items: [],
      connectors: [],
      rectangles: [
        { id: 'zone', from: { x: 0, y: -5 }, to: { x: 4, y: -1 } }
      ],
      textBoxes: [
        {
          id: 'label',
          tile: { x: 1.2, y: -4.8 },
          orientation: 'X',
          size: { width: 2, height: 1 }
        }
      ]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    expect(getItemAtTile({ tile: { x: 1, y: -5 }, scene })).toEqual({
      type: 'TEXTBOX',
      id: 'label'
    });
  });

  test('getItemAtTile() falls through a locked item to whatever is underneath it', () => {
    const scene = {
      items: [{ id: 'node', tile: { x: 0, y: 0 } }],
      connectors: [],
      rectangles: [{ id: 'zone', from: { x: -5, y: -5 }, to: { x: 5, y: 5 } }],
      textBoxes: []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    expect(getItemAtTile({ tile: { x: 0, y: 0 }, scene })).toEqual({
      type: 'ITEM',
      id: 'node'
    });

    // Locking the node makes the click fall through to the rectangle behind it.
    expect(getItemAtTile({ tile: { x: 0, y: 0 }, scene, lockedIds: ['node'] })).toEqual({
      type: 'RECTANGLE',
      id: 'zone'
    });

    // A locked rectangle with nothing else there resolves to nothing at all.
    expect(
      getItemAtTile({ tile: { x: 0, y: 0 }, scene, lockedIds: ['node', 'zone'] })
    ).toBeNull();
  });

  test('getItemAtTile() picks the connector nearest the click among several sharing the same tile', () => {
    // Three connectors between the same two points share the exact same tile
    // path (that's why they get a perpendicular pixel offset at render time
    // to visually spread apart) -- tile-only matching can't tell them apart,
    // so a click on one of the outer (offset) lines must resolve to that
    // specific connector, not just whichever is first in the array.
    const rectangleFrom = { x: 4, y: 0 };
    const pathTiles = [
      { x: 4, y: 0 },
      { x: 3, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 0 }
    ]; // -> global tiles (0,0)..(4,0) via connectorPathTileToGlobal

    const makeConnector = (id: string) => ({
      id,
      anchors: [{ id: `${id}-a1`, ref: { item: 'a' } }, { id: `${id}-a2`, ref: { item: 'b' } }],
      path: { tiles: pathTiles, rectangle: { from: rectangleFrom, to: { x: 0, y: 0 } } }
    });

    const connectors = [makeConnector('c0'), makeConnector('c1'), makeConnector('c2')];
    const scene = { items: [], connectors, rectangles: [], textBoxes: [] } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    const tile = { x: 2, y: 0 };
    const rendererSize: Size = { width: 1000, height: 1000 };
    const zoom = 1;
    const scroll: Scroll = { position: { x: 0, y: 0 }, offset: CoordsUtils.zero() };

    // Reuse the real grouping/offset math to compute where "c2" (the third,
    // most-offset connector) actually renders, then click exactly there.
    const groups = getConnectorGroups(connectors as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    const group = groups.get('c2')!;
    const offsetPx = getGroupOffset(group.index, group.total, UNPROJECTED_TILE_SIZE, group.groupWidthRatio);
    const offsetTiles = offsetPx / UNPROJECTED_TILE_SIZE;
    // The path runs along x, so getPerpendicularAt's unit vector is (0, 1).
    const world = getTilePosition({ tile: { x: tile.x, y: tile.y + offsetTiles } });
    const mouseScreen = {
      x: world.x + rendererSize.width / 2,
      y: world.y + rendererSize.height / 2
    };

    expect(
      getItemAtTile({ tile, scene, mouseScreen, rendererSize, zoom, scroll })
    ).toEqual({ type: 'CONNECTOR', id: 'c2' });

    // Without screen-space info, it falls back to the old first-match behavior.
    expect(getItemAtTile({ tile, scene })).toEqual({ type: 'CONNECTOR', id: 'c0' });
  });
});
