import { produce } from 'immer';
import { ModeActions, Coords, ItemReference } from 'src/types';
import { useScene } from 'src/hooks/useScene';
import type { State } from 'src/stores/reducers/types';
import {
  getItemByIdOrThrow,
  CoordsUtils,
  hasMovedTile,
  getAnchorParent,
  getAnchorTile,
  getItemAtTile,
  findNearestUnoccupiedTilesForGroup,
  setWindowCursor
} from 'src/utils';

// Dragging a connector's line always creates a real waypoint anchor at the
// drag-start tile (see Cursor.ts's getAnchor), even if the drag ends back
// on the original straight line -- nothing ever prunes it, so it silently
// breaks that connector's overlap-prevention grouping from then on (it no
// longer has exactly 2 anchors). Remove an interior anchor here if it's
// (re)dropped back onto the straight line between its neighbors, same as
// most diagram tools do when you drag a bend point onto its own line.
const COLLINEAR_EPSILON = 1e-6;

const pruneCollinearAnchor = (
  itemId: string,
  scene: ReturnType<typeof useScene>
) => {
  const connector = getAnchorParent(itemId, scene.connectors);
  const { index } = getItemByIdOrThrow(connector.anchors, itemId);

  if (index === 0 || index === connector.anchors.length - 1) return;

  const view = scene.currentView;
  const prev = getAnchorTile(connector.anchors[index - 1], view);
  const curr = getAnchorTile(connector.anchors[index], view);
  const next = getAnchorTile(connector.anchors[index + 1], view);

  const cross =
    (next.x - prev.x) * (curr.y - prev.y) -
    (next.y - prev.y) * (curr.x - prev.x);

  if (Math.abs(cross) < COLLINEAR_EPSILON) {
    scene.updateConnector(connector.id, {
      anchors: connector.anchors.filter((a) => a.id !== itemId)
    });
  }
};

const dragItems = (
  items: ItemReference[],
  tile: Coords,
  delta: Coords,
  scene: ReturnType<typeof useScene>
) => {
  // Separate all item types upfront
  const itemRefs = items.filter(item => item.type === 'ITEM');
  const textBoxRefs = items.filter(item => item.type === 'TEXTBOX');
  const rectangleRefs = items.filter(item => item.type === 'RECTANGLE');
  const anchorRefs = items.filter(item => item.type === 'CONNECTOR_ANCHOR');

  // Calculate node targets if any nodes are selected
  let newTiles: Coords[] | null = null;
  if (itemRefs.length > 0) {
    const itemsWithTargets = itemRefs.map(item => {
      const node = getItemByIdOrThrow(scene.items, item.id).value;
      return {
        id: item.id,
        targetTile: CoordsUtils.add(node.tile, delta)
      };
    });

    newTiles = findNearestUnoccupiedTilesForGroup(
      itemsWithTargets,
      scene,
      itemRefs.map(item => item.id)
    );

    // If nodes can't find valid positions, abort the entire drag operation
    if (!newTiles) {
      return;
    }
  }

  // Check if there's anything to update
  const hasUpdates = newTiles || textBoxRefs.length > 0 || rectangleRefs.length > 0;

  if (hasUpdates) {
    // Wrap ALL updates in a single transaction with state chaining
    // This ensures each update builds on the previous one's state
    scene.transaction(() => {
      let currentState: State | undefined;

      // 1. Update nodes
      if (newTiles) {
        itemRefs.forEach((item, index) => {
          currentState = scene.updateViewItem(item.id, {
            tile: newTiles[index]
          }, currentState);
        });
      }

      // 2. Update textboxes (chained from node state)
      textBoxRefs.forEach((item) => {
        const textBox = getItemByIdOrThrow(scene.textBoxes, item.id).value;
        currentState = scene.updateTextBox(item.id, {
          tile: CoordsUtils.add(textBox.tile, delta)
        }, currentState);
      });

      // 3. Update rectangles (chained from textbox state)
      rectangleRefs.forEach((item) => {
        const rectangle = getItemByIdOrThrow(scene.rectangles, item.id).value;
        currentState = scene.updateRectangle(item.id, {
          from: CoordsUtils.add(rectangle.from, delta),
          to: CoordsUtils.add(rectangle.to, delta)
        }, currentState);
      });
    });
  }

  // Handle connector anchors separately (they have different update logic)
  anchorRefs.forEach((item) => {
    const connector = getAnchorParent(item.id, scene.connectors);

    const newConnector = produce(connector, (draft) => {
      const anchor = getItemByIdOrThrow(connector.anchors, item.id);

      const itemAtTile = getItemAtTile({ tile, scene });

      switch (itemAtTile?.type) {
        case 'ITEM':
          draft.anchors[anchor.index] = {
            ...anchor.value,
            ref: {
              item: itemAtTile.id
            }
          };
          break;
        case 'CONNECTOR_ANCHOR':
          draft.anchors[anchor.index] = {
            ...anchor.value,
            ref: {
              anchor: itemAtTile.id
            }
          };
          break;
        default:
          draft.anchors[anchor.index] = {
            ...anchor.value,
            ref: {
              tile
            }
          };
          break;
      }
    });

    scene.updateConnector(connector.id, newConnector);
  });
};

export const DragItems: ModeActions = {
  entry: ({ uiState, rendererRef }) => {
    if (uiState.mode.type !== 'DRAG_ITEMS' || !uiState.mouse.mousedown) return;

    setWindowCursor('grabbing');
    const renderer = rendererRef;
    renderer.style.userSelect = 'none';
  },
  exit: ({ rendererRef }) => {
    setWindowCursor('default');
    const renderer = rendererRef;
    renderer.style.userSelect = 'auto';
  },
  mousemove: ({ uiState, scene }) => {
    if (uiState.mode.type !== 'DRAG_ITEMS' || !uiState.mouse.mousedown) return;

    if (uiState.mode.isInitialMovement) {
      const delta = CoordsUtils.subtract(
        uiState.mouse.position.tile,
        uiState.mouse.mousedown.tile
      );

      dragItems(uiState.mode.items, uiState.mouse.position.tile, delta, scene);

      uiState.actions.setMode(
        produce(uiState.mode, (draft) => {
          draft.isInitialMovement = false;
        })
      );

      return;
    }

    if (!hasMovedTile(uiState.mouse) || !uiState.mouse.delta?.tile) return;

    const delta = uiState.mouse.delta.tile;

    dragItems(uiState.mode.items, uiState.mouse.position.tile, delta, scene);
  },
  mouseup: ({ uiState, scene }) => {
    if (uiState.mode.type === 'DRAG_ITEMS') {
      uiState.mode.items
        .filter((item) => item.type === 'CONNECTOR_ANCHOR')
        .forEach((item) => pruneCollinearAnchor(item.id, scene));
    }

    uiState.actions.setItemControls(null);
    uiState.actions.setMode({
      type: 'CURSOR',
      showCursor: true,
      mousedownItem: null
    });
  }
};
