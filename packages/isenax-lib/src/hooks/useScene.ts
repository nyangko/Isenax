import { useCallback, useMemo, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import {
  ModelItem,
  ViewItem,
  Connector,
  ConnectorAnchor,
  TextBox,
  Rectangle,
  UiStateStore,
  ItemReference
} from 'src/types';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useModelStore, useModelStoreApi } from 'src/stores/modelStore';
import { useSceneStore, useSceneStoreApi } from 'src/stores/sceneStore';
import * as reducers from 'src/stores/reducers';
import type { State } from 'src/stores/reducers/types';
import { copyObject, findNearestUnoccupiedTile, generateId, getItemById, getItemByIdOrThrow, getPastedObject, getTargetTileFunction, isPastedValid } from 'src/utils';
import {
  CONNECTOR_DEFAULTS,
  RECTANGLE_DEFAULTS,
  TEXTBOX_DEFAULTS
} from 'src/config';

export const useScene = () => {
  const { views, colors, icons, items, version, title, description } =
    useModelStore(
      (state) => ({
        views: state.views,
        colors: state.colors,
        icons: state.icons,
        items: state.items,
        version: state.version,
        title: state.title,
        description: state.description
      }),
      shallow
    );
  const { connectors: sceneConnectors, textBoxes: sceneTextBoxes } =
    useSceneStore(
      (state) => ({
        connectors: state.connectors,
        textBoxes: state.textBoxes
      }),
      shallow
    );
  const currentViewId = useUiStateStore((state) => state.view);
  const transactionInProgress = useRef(false);

  const modelStoreApi = useModelStoreApi();
  const sceneStoreApi = useSceneStoreApi();

  const currentView = useMemo(() => {
    if (!views || !currentViewId) {
      return {
        id: '',
        name: 'Default View',
        items: [],
        connectors: [],
        rectangles: [],
        textBoxes: []
      };
    }

    try {
      return getItemByIdOrThrow(views, currentViewId).value;
    } catch (error) {
      return (
        views[0] || {
          id: currentViewId,
          name: 'Default View',
          items: [],
          connectors: [],
          rectangles: [],
          textBoxes: []
        }
      );
    }
  }, [currentViewId, views]);

  const itemsList = useMemo(() => {
    return currentView.items ?? [];
  }, [currentView.items]);

  const colorsList = useMemo(() => {
    return colors ?? [];
  }, [colors]);

  const connectorsList = useMemo(() => {
    return (currentView.connectors ?? []).map((connector) => {
      const sceneConnector = sceneConnectors?.[connector.id];

      return {
        ...CONNECTOR_DEFAULTS,
        ...connector,
        ...sceneConnector
      };
    });
  }, [currentView.connectors, sceneConnectors]);

  const rectanglesList = useMemo(() => {
    return (currentView.rectangles ?? []).map((rectangle) => {
      return {
        ...RECTANGLE_DEFAULTS,
        ...rectangle
      };
    });
  }, [currentView.rectangles]);

  const textBoxesList = useMemo(() => {
    return (currentView.textBoxes ?? []).map((textBox) => {
      const sceneTextBox = sceneTextBoxes?.[textBox.id];

      return {
        ...TEXTBOX_DEFAULTS,
        ...textBox,
        ...sceneTextBox
      };
    });
  }, [currentView.textBoxes, sceneTextBoxes]);

  const getState = useCallback((): State => {
    const model = modelStoreApi.getState();
    const scene = sceneStoreApi.getState();
    return {
      model: {
        version: model.version,
        title: model.title,
        description: model.description,
        colors: model.colors,
        icons: model.icons,
        items: model.items,
        views: model.views
      },
      scene: {
        connectors: scene.connectors,
        textBoxes: scene.textBoxes
      }
    };
  }, [modelStoreApi, sceneStoreApi]);

  const setState = useCallback(
    (newState: State) => {
      modelStoreApi.getState().actions.set(newState.model, true);
      sceneStoreApi.getState().actions.set(newState.scene, true);
    },
    [modelStoreApi, sceneStoreApi]
  );

  const saveToHistoryBeforeChange = useCallback(() => {
    if (transactionInProgress.current) {
      return;
    }

    modelStoreApi.getState().actions.saveToHistory();
    sceneStoreApi.getState().actions.saveToHistory();
  }, [modelStoreApi, sceneStoreApi]);

  const createModelItem = useCallback(
    (newModelItem: ModelItem, state?: State) => {

      if (!transactionInProgress.current) {
        saveToHistoryBeforeChange();
      }

      const newState = reducers.createModelItem(newModelItem, state || getState());
      setState(newState);
      return newState;
    },
    [getState, setState, saveToHistoryBeforeChange]
  );

  const updateModelItem = useCallback(
    (id: string, updates: Partial<ModelItem>) => {
      saveToHistoryBeforeChange();
      const newState = reducers.updateModelItem(id, updates, getState());
      setState(newState);
    },
    [getState, setState, saveToHistoryBeforeChange]
  );

  const deleteModelItem = useCallback(
    (id: string) => {
      saveToHistoryBeforeChange();
      const newState = reducers.deleteModelItem(id, getState());
      setState(newState);
    },
    [getState, setState, saveToHistoryBeforeChange]
  );

  const createChildView = useCallback(
    (modelItemId: string, viewName?: string) => {
      if (!currentViewId) return;

      saveToHistoryBeforeChange();
      const { state: newState, newViewId } = reducers.createChildView(
        modelItemId,
        { viewId: currentViewId, state: getState() },
        viewName
      );
      setState(newState);
      return { state: newState, newViewId };
    },
    [getState, setState, currentViewId, saveToHistoryBeforeChange]
  );

  const createViewItem = useCallback(
    (newViewItem: ViewItem, currentState?: State) => {
      if (!currentViewId) return;

      if (!transactionInProgress.current) {
        saveToHistoryBeforeChange();
      }

      const stateToUse = currentState || getState();

      const newState = reducers.view({
        action: 'CREATE_VIEWITEM',
        payload: newViewItem,
        ctx: { viewId: currentViewId, state: stateToUse }
      });
      setState(newState);
      return newState;
    },
    [getState, setState, currentViewId, saveToHistoryBeforeChange]
  );

  const updateViewItem = useCallback(
    (id: string, updates: Partial<ViewItem>, currentState?: State) => {
      if (!currentViewId) return getState();

      if (!transactionInProgress.current) {
        saveToHistoryBeforeChange();
      }

      const stateToUse = currentState || getState();
      const newState = reducers.view({
        action: 'UPDATE_VIEWITEM',
        payload: { id, ...updates },
        ctx: { viewId: currentViewId, state: stateToUse }
      });
      setState(newState);
      return newState;
    },
    [getState, setState, currentViewId, saveToHistoryBeforeChange]
  );

  const deleteViewItem = useCallback(
    (id: string) => {
      if (!currentViewId) return;

      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'DELETE_VIEWITEM',
        payload: id,
        ctx: { viewId: currentViewId, state: getState() }
      });
      setState(newState);
    },
    [getState, setState, currentViewId, saveToHistoryBeforeChange]
  );

  const createConnector = useCallback(
    (newConnector: Connector) => {
      if (!currentViewId) return;

      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'CREATE_CONNECTOR',
        payload: newConnector,
        ctx: { viewId: currentViewId, state: getState() }
      });
      setState(newState);
    },
    [getState, setState, currentViewId, saveToHistoryBeforeChange]
  );

  const updateConnector = useCallback(
    (id: string, updates: Partial<Connector>) => {
      if (!currentViewId) return;

      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'UPDATE_CONNECTOR',
        payload: { id, ...updates },
        ctx: { viewId: currentViewId, state: getState() }
      });
      setState(newState);
    },
    [getState, setState, currentViewId, saveToHistoryBeforeChange]
  );

  const deleteConnector = useCallback(
    (id: string) => {
      if (!currentViewId) return;

      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'DELETE_CONNECTOR',
        payload: id,
        ctx: { viewId: currentViewId, state: getState() }
      });
      setState(newState);
    },
    [getState, setState, currentViewId, saveToHistoryBeforeChange]
  );

  const reorderConnectors = useCallback(
    (orderedIds: string[]) => {
      if (!currentViewId) return;

      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'REORDER_CONNECTORS',
        payload: orderedIds,
        ctx: { viewId: currentViewId, state: getState() }
      });
      setState(newState);
    },
    [getState, setState, currentViewId, saveToHistoryBeforeChange]
  );

  const createTextBox = useCallback(
    (newTextBox: TextBox, state?: State) => {
      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'CREATE_TEXTBOX',
        payload: newTextBox,
        ctx: { viewId: currentViewId, state: state || getState() }
      });
      setState(newState);
      return newState;
    },
    [getState, setState, currentViewId, saveToHistoryBeforeChange]
  );

  const updateTextBox = useCallback(
    (id: string, updates: Partial<TextBox>, currentState?: State) => {
      if (!currentViewId) return currentState || getState();

      if (!transactionInProgress.current) {
        saveToHistoryBeforeChange();
      }

      const stateToUse = currentState || getState();
      const newState = reducers.view({
        action: 'UPDATE_TEXTBOX',
        payload: { id, ...updates },
        ctx: { viewId: currentViewId, state: stateToUse }
      });
      setState(newState);
      return newState;
    },
    [getState, setState, currentViewId, saveToHistoryBeforeChange]
  );

  const deleteTextBox = useCallback(
    (id: string) => {
      if (!currentViewId) return;

      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'DELETE_TEXTBOX',
        payload: id,
        ctx: { viewId: currentViewId, state: getState() }
      });
      setState(newState);
    },
    [getState, setState, currentViewId, saveToHistoryBeforeChange]
  );

  const createRectangle = useCallback(
    (newRectangle: Rectangle, state?: State) => {
      if (!currentViewId) return;

      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'CREATE_RECTANGLE',
        payload: newRectangle,
        ctx: { viewId: currentViewId, state: state || getState() }
      });
      setState(newState);
      return newState;
    },
    [getState, setState, currentViewId, saveToHistoryBeforeChange]
  );

  const updateRectangle = useCallback(
    (id: string, updates: Partial<Rectangle>, currentState?: State) => {
      if (!currentViewId) return currentState || getState();

      if (!transactionInProgress.current) {
        saveToHistoryBeforeChange();
      }

      const stateToUse = currentState || getState();
      const newState = reducers.view({
        action: 'UPDATE_RECTANGLE',
        payload: { id, ...updates },
        ctx: { viewId: currentViewId, state: stateToUse }
      });
      setState(newState);
      return newState;
    },
    [getState, setState, currentViewId, saveToHistoryBeforeChange]
  );

  const deleteRectangle = useCallback(
    (id: string) => {
      if (!currentViewId) return;

      saveToHistoryBeforeChange();
      const newState = reducers.view({
        action: 'DELETE_RECTANGLE',
        payload: id,
        ctx: { viewId: currentViewId, state: getState() }
      });
      setState(newState);
    },
    [getState, setState, currentViewId, saveToHistoryBeforeChange]
  );

  const transaction = useCallback(
    (operations: () => void) => {
      if (transactionInProgress.current) {
        operations();
        return;
      }

      saveToHistoryBeforeChange();
      transactionInProgress.current = true;

      try {
        operations();
      } finally {
        transactionInProgress.current = false;
      }
    },
    [saveToHistoryBeforeChange]
  );

  const placeIcon = useCallback(
    (params: { modelItem: ModelItem; viewItem: ViewItem }) => {
      saveToHistoryBeforeChange();
      transactionInProgress.current = true;

      try {
        const stateAfterModelItem = createModelItem(params.modelItem);

        if (stateAfterModelItem) {
          createViewItem(params.viewItem, stateAfterModelItem);
        }

        // A connector ended on an empty tile is anchored there by coordinate
        // (ref: { tile }) rather than to an item. Placing a node on that exact
        // tile afterwards would otherwise only coincide visually — snap any
        // matching tile-anchor onto the new node so the connector actually links to it.
        (currentView.connectors ?? []).forEach((connector) => {
          const matchesNewTile = (anchor: ConnectorAnchor) =>
            anchor.ref.tile?.x === params.viewItem.tile.x &&
            anchor.ref.tile?.y === params.viewItem.tile.y;

          if (!connector.anchors.some(matchesNewTile)) return;

          updateConnector(connector.id, {
            anchors: connector.anchors.map((anchor) =>
              matchesNewTile(anchor)
                ? { ...anchor, ref: { item: params.modelItem.id } }
                : anchor
            )
          });
        });
      } finally {
        transactionInProgress.current = false;
      }
    },
    [createModelItem, createViewItem, updateConnector, currentView.connectors, saveToHistoryBeforeChange]
  );

  const copyObjectsToClipboard = (uiState: UiStateStore, selectedItem?: ItemReference) => {
    const model = modelStoreApi.getState()
    const selectedObjects = 
      selectedItem ? [selectedItem] :
      (
        uiState.mode.type === 'LASSO' ||
        uiState.mode.type === 'FREEHAND_LASSO'
      ) && uiState.mode.selection ?
        uiState.mode.selection.items
        :
        [uiState.itemControls && 'id' in uiState.itemControls ? (uiState.itemControls as ItemReference) : null].filter(Boolean) as ItemReference[];
        
    copyObject(selectedObjects.map((currentItem) => {
      if (!currentItem) return;
      switch (currentItem.type) {
        case 'ITEM': {
          const modelItem = getItemById(model.items, currentItem.id)?.value;
          const viewItem = getItemById(currentView.items, currentItem.id)?.value;
          if (!viewItem || !modelItem) return;

          return { type: currentItem.type, item: { modelItem, viewItem } }
        }
        case 'RECTANGLE': {
          if (!currentView.rectangles) return;
          const item = getItemById(currentView.rectangles, currentItem.id)?.value;
          return { type: currentItem.type, item }
        }
        case 'TEXTBOX': {
          if (!currentView.textBoxes) return;
          const item = getItemById(currentView.textBoxes, currentItem.id)?.value;
          return { type: currentItem.type, item }
        }
      }
    }));

    uiState.actions.setIsAnythingCopied(true);
  }

  const pasteObjectsFromClipboard: (uiState: UiStateStore, activeScene: ReturnType<typeof useScene>) => Promise<void> = 
  async (uiState, activeScene) => {
    const pastedArray = await getPastedObject();

    if (!isPastedValid(pastedArray)) {
      uiState.actions.setIsAnythingCopied(false); // Remove paste option if object on clipboard is invalid (clipboard item possibly not from isenax)
      return;
    };

    saveToHistoryBeforeChange();
    transactionInProgress.current = true;

    try {
      const mouseTile = uiState.mouse.position.tile;
      const getTargetTile = getTargetTileFunction(pastedArray[0], mouseTile, activeScene);
      let state: State | undefined;
  
      pastedArray.forEach(pastedObject => {
        const newId = generateId();
  
        if (pastedObject.type === 'ITEM') {
          const { viewItem, modelItem } = pastedObject.item;
          const stateWithNewModel = createModelItem({
            ...modelItem,
            id: newId
          }, state)
          
          // Chain updated state from each iteration
          state = createViewItem({
            ...viewItem,
            id: newId,
            tile: getTargetTile(viewItem.tile)
          }, stateWithNewModel)
        } else if (pastedObject.type === 'RECTANGLE') {
          state = createRectangle({
            ...pastedObject.item, 
            id: newId,
            from: getTargetTile(pastedObject.item.from),
            to: getTargetTile(pastedObject.item.to)
          }, state)
        } else if (pastedObject.type === "TEXTBOX") {
          state = createTextBox({
            ...pastedObject.item, 
            id: newId,
            tile: getTargetTile(pastedObject.item.tile)
          }, state);
        }
      })
    } finally {
      transactionInProgress.current = false;
    }
  }

  const deleteObjects = (uiState: UiStateStore) => {
    const selectedObjects =
      (uiState.mode.type === 'LASSO' || uiState.mode.type === 'FREEHAND_LASSO') &&
      uiState.mode.selection
        ? uiState.mode.selection.items
        : [];

    if (selectedObjects.length === 0) return;

    transaction(() => {
      selectedObjects.forEach((item) => {
        switch (item.type) {
          case 'ITEM':
            deleteViewItem(item.id);
            break;
          case 'RECTANGLE':
            deleteRectangle(item.id);
            break;
          case 'TEXTBOX':
            deleteTextBox(item.id);
            break;
        }
      });
    });

    uiState.actions.setMode({ type: 'CURSOR', mousedownItem: null, showCursor: true });
  }

  const duplicateItem: (itemRef: ItemReference, activeScene: ReturnType<typeof useScene>) => void = (itemRef, activeScene) => {
    const model = modelStoreApi.getState();
    const newId = generateId();
    const offset = { x: 1, y: 1 };

    transaction(() => {
      if (itemRef.type === 'ITEM') {
        const modelItem = getItemById(model.items, itemRef.id)?.value;
        const viewItem = getItemById(currentView.items, itemRef.id)?.value;
        if (!modelItem || !viewItem) return;

        const targetTile = findNearestUnoccupiedTile(
          { x: viewItem.tile.x + offset.x, y: viewItem.tile.y + offset.y },
          activeScene
        ) || viewItem.tile;

        createModelItem({ ...modelItem, id: newId });
        createViewItem({ ...viewItem, id: newId, tile: targetTile });
      } else if (itemRef.type === 'RECTANGLE') {
        if (!currentView.rectangles) return;
        const rectangle = getItemById(currentView.rectangles, itemRef.id)?.value;
        if (!rectangle) return;

        createRectangle({
          ...rectangle,
          id: newId,
          from: { x: rectangle.from.x + offset.x, y: rectangle.from.y + offset.y },
          to: { x: rectangle.to.x + offset.x, y: rectangle.to.y + offset.y }
        });
      } else if (itemRef.type === 'TEXTBOX') {
        if (!currentView.textBoxes) return;
        const textBox = getItemById(currentView.textBoxes, itemRef.id)?.value;
        if (!textBox) return;

        const targetTile = findNearestUnoccupiedTile(
          { x: textBox.tile.x + offset.x, y: textBox.tile.y + offset.y },
          activeScene
        ) || textBox.tile;

        createTextBox({ ...textBox, id: newId, tile: targetTile });
      }
    });
  }

  return {
    items: itemsList,
    connectors: connectorsList,
    colors: colorsList,
    rectangles: rectanglesList,
    textBoxes: textBoxesList,
    currentView,
    createModelItem,
    updateModelItem,
    deleteModelItem,
    createChildView,
    createViewItem,
    updateViewItem,
    deleteViewItem,
    createConnector,
    updateConnector,
    deleteConnector,
    reorderConnectors,
    createTextBox,
    updateTextBox,
    deleteTextBox,
    createRectangle,
    updateRectangle,
    deleteRectangle,
    transaction,
    placeIcon,
    copyObjectsToClipboard,
    pasteObjectsFromClipboard,
    deleteObjects,
    duplicateItem,
  };
};
