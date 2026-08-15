import { produce } from 'immer';
import {
  ConnectorAnchor,
  SceneConnector,
  ModeActions,
  ModeActionsAction,
  Coords,
  View
} from 'src/types';
import {
  getItemAtTile,
  getConnectorsAtTile,
  hasMovedTile,
  getAnchorAtTile,
  getItemByIdOrThrow,
  generateId,
  CoordsUtils,
  getAnchorTile,
  connectorPathTileToGlobal
} from 'src/utils';
import { useScene } from 'src/hooks/useScene';

const getAnchorOrdering = (
  anchor: ConnectorAnchor,
  connector: SceneConnector,
  view: View
) => {
  const anchorTile = getAnchorTile(anchor, view);
  const index = connector.path.tiles.findIndex((pathTile) => {
    const globalTile = connectorPathTileToGlobal(
      pathTile,
      connector.path.rectangle.from
    );
    return CoordsUtils.isEqual(globalTile, anchorTile);
  });

  if (index === -1) {
    throw new Error(
      `Could not calculate ordering index of anchor [anchorId: ${anchor.id}]`
    );
  }

  return index;
};

const getAnchor = (
  connectorId: string,
  tile: Coords,
  scene: ReturnType<typeof useScene>
) => {
  const connector = getItemByIdOrThrow(scene.connectors, connectorId).value;
  const anchor = getAnchorAtTile(tile, connector.anchors);

  if (!anchor) {
    const newAnchor: ConnectorAnchor = {
      id: generateId(),
      ref: { tile }
    };

    const orderedAnchors = [...connector.anchors, newAnchor]
      .map((anch) => {
        return {
          ...anch,
          ordering: getAnchorOrdering(anch, connector, scene.currentView)
        };
      })
      .sort((a, b) => {
        return a.ordering - b.ordering;
      });

    scene.updateConnector(connector.id, { anchors: orderedAnchors });
    return newAnchor;
  }

  return anchor;
};

const mousedown: ModeActionsAction = ({
  uiState,
  scene,
  isRendererInteraction,
  rendererSize
}) => {
  if (uiState.mode.type !== 'CURSOR' || !isRendererInteraction) return;

  const itemAtTile = getItemAtTile({
    tile: uiState.mouse.position.tile,
    scene,
    lockedIds: uiState.lockedLayerIds,
    mouseScreen: uiState.mouse.position.screen,
    rendererSize,
    zoom: uiState.zoom,
    scroll: uiState.scroll
  });

  if (itemAtTile) {
    uiState.actions.setMode(
      produce(uiState.mode, (draft) => {
        draft.mousedownItem = itemAtTile;
      })
    );
  } else {
    uiState.actions.setMode(
      produce(uiState.mode, (draft) => {
        draft.mousedownItem = null;
      })
    );

    uiState.actions.setItemControls(null);

    // Read-only diagrams now stay in CURSOR mode too (so clicking an item
    // still opens its read-only controls panel, see mouseup below) -- but
    // the empty-space "add node/area" quick menu is still an edit action.
    if (uiState.editorMode !== 'EDITABLE') return;

    // Show context menu for empty space on left click
    uiState.actions.setContextMenu({
      type: 'EMPTY',
      tile: uiState.mouse.position.tile
    });
  }
};

export const Cursor: ModeActions = {
  entry: (state) => {
    const { uiState } = state;

    if (uiState.mode.type !== 'CURSOR') return;

    if (uiState.mode.mousedownItem) {
      mousedown(state);
    }
  },
  mousemove: ({ scene, uiState }) => {
    if (uiState.mode.type !== 'CURSOR' || !hasMovedTile(uiState.mouse)) return;

    let item = uiState.mode.mousedownItem;

    // Read-only: never enter a mutating drag (moving the item, or -- for a
    // connector -- creating a new anchor at the drag point via getAnchor
    // below). Fall through to the empty-space branch instead, which just
    // pans, same as dragging from empty space always has.
    if (item && uiState.editorMode !== 'EDITABLE') {
      item = null;
    }

    if (item?.type === 'CONNECTOR' && uiState.mouse.mousedown) {
      const anchor = getAnchor(item.id, uiState.mouse.mousedown.tile, scene);

      item = {
        type: 'CONNECTOR_ANCHOR',
        id: anchor.id
      };
    }

    if (item) {
      uiState.actions.setMode({
        type: 'DRAG_ITEMS',
        showCursor: true,
        items: [item],
        isInitialMovement: true
      });
    } else {
      // If no item is being dragged and the mouse has moved, switch to PAN mode
      // Only do this if the drag started on empty space
      if (uiState.mouse.mousedown) {
        uiState.actions.setMode({
          type: 'PAN',
          showCursor: false
        });
      }
    }
  },
  mousedown,
  mouseup: ({ uiState, scene, isRendererInteraction }) => {
    if (uiState.mode.type !== 'CURSOR' || !isRendererInteraction) return;

    const hasMoved = uiState.mouse.mousedown && hasMovedTile(uiState.mouse);

    if (uiState.mode.mousedownItem && !hasMoved) {
      if (uiState.mode.mousedownItem.type === 'ITEM') {
        uiState.actions.setItemControls({
          type: 'ITEM',
          id: uiState.mode.mousedownItem.id
        });
      } else if (uiState.mode.mousedownItem.type === 'RECTANGLE') {
        uiState.actions.setItemControls({
          type: 'RECTANGLE',
          id: uiState.mode.mousedownItem.id
        });
      } else if (uiState.mode.mousedownItem.type === 'CONNECTOR') {
        const clickTile = uiState.mouse.mousedown?.tile ?? uiState.mouse.position.tile;
        const connectorIds = getConnectorsAtTile({ tile: clickTile, scene });

        if (connectorIds.length > 0) {
          // mousedownItem.id is now resolved to the specific connector whose
          // own rendered (offset) line the click actually landed on -- see
          // getItemAtTile -- so it's always a better focus target than
          // nulling it out just because groupmates share the same tile.
          uiState.actions.setItemControls({
            type: 'CONNECTOR_GROUP',
            ids: connectorIds,
            focusedId: uiState.mode.mousedownItem.id
          });
        }
      } else if (uiState.mode.mousedownItem.type === 'TEXTBOX') {
        uiState.actions.setItemControls({
          type: 'TEXTBOX',
          id: uiState.mode.mousedownItem.id
        });
      }
    } else {
      uiState.actions.setItemControls(null);
    }

    uiState.actions.setMode(
      produce(uiState.mode, (draft) => {
        draft.mousedownItem = null;
      })
    );
  }
};
