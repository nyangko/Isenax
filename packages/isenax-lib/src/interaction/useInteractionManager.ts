import { useCallback, useEffect, useRef } from 'react';
import { useModelStoreApi } from 'src/stores/modelStore';
import { useUiStateStore, useUiStateStoreApi } from 'src/stores/uiStateStore';
import { ModeActions, State, SlimMouseEvent, Mouse } from 'src/types';
import { DialogTypeEnum } from 'src/types/ui';
import { getMouse, getItemAtTile, getConnectorsAtTile, generateId, incrementZoom, decrementZoom, isPointInPolygon, isWithinBounds } from 'src/utils';
import { useResizeObserver } from 'src/hooks/useResizeObserver';
import { useScene } from 'src/hooks/useScene';
import { useHistory } from 'src/hooks/useHistory';
import { HOTKEY_PROFILES } from 'src/config/hotkeys';
import { TEXTBOX_DEFAULTS } from 'src/config';
import { Cursor } from './modes/Cursor';
import { DragItems } from './modes/DragItems';
import { DrawRectangle } from './modes/Rectangle/DrawRectangle';
import { TransformRectangle } from './modes/Rectangle/TransformRectangle';
import { Connector } from './modes/Connector';
import { Pan } from './modes/Pan';
import { PlaceIcon } from './modes/PlaceIcon';
import { TextBox } from './modes/TextBox';
import { Lasso } from './modes/Lasso';
import { FreehandLasso } from './modes/FreehandLasso';
import { usePanHandlers } from './usePanHandlers';

interface PendingMouseUpdate {
  mouse: Mouse;
  event: SlimMouseEvent;
}

const useRAFThrottle = () => {
  const rafIdRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<PendingMouseUpdate | null>(null);
  const callbackRef = useRef<((update: PendingMouseUpdate) => void) | null>(null);

  const scheduleUpdate = useCallback((mouse: Mouse, event: SlimMouseEvent, callback: (update: PendingMouseUpdate) => void) => {
    pendingUpdateRef.current = { mouse, event };
    callbackRef.current = callback;

    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (pendingUpdateRef.current && callbackRef.current) {
          callbackRef.current(pendingUpdateRef.current);
          pendingUpdateRef.current = null;
        }
      });
    }
  }, []);

  const flushUpdate = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (pendingUpdateRef.current && callbackRef.current) {
      callbackRef.current(pendingUpdateRef.current);
      pendingUpdateRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    pendingUpdateRef.current = null;
  }, []);

  return { scheduleUpdate, flushUpdate, cleanup };
};

const modes: { [k in string]: ModeActions } = {
  CURSOR: Cursor,
  DRAG_ITEMS: DragItems,
  'RECTANGLE.DRAW': DrawRectangle,
  'RECTANGLE.TRANSFORM': TransformRectangle,
  CONNECTOR: Connector,
  PAN: Pan,
  PLACE_ICON: PlaceIcon,
  TEXTBOX: TextBox,
  LASSO: Lasso,
  FREEHAND_LASSO: FreehandLasso
};

const getModeFunction = (mode: ModeActions, e: SlimMouseEvent) => {
  switch (e.type) {
    case 'mousemove':
      return mode.mousemove;
    case 'mousedown':
      return mode.mousedown;
    case 'mouseup':
      return mode.mouseup;
    default:
      return null;
  }
};

export const useInteractionManager = () => {
  const rendererRef = useRef<HTMLElement | undefined>(undefined);
  const reducerTypeRef = useRef<string | undefined>(undefined);
  // Touch has no right-click -- a long-press on the canvas opens the same
  // context menu instead. Cancelled by touchmove past a small threshold (so
  // it doesn't fire mid-pan/drag) and cleared on touchend.
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressFiredRef = useRef(false);

  const modeType = useUiStateStore((state) => state.mode.type);
  const rendererEl = useUiStateStore((state) => state.rendererEl);
  const editorMode = useUiStateStore((state) => state.editorMode);

  const uiStateApi = useUiStateStoreApi();
  const trackpadMode = useUiStateStore((state) => state.zoomSettings.trackpadMode);
  const modelStoreApi = useModelStoreApi();
  const scene = useScene();
  const { size: rendererSize } = useResizeObserver(rendererEl);
  const { undo, redo, canUndo, canRedo } = useHistory();
  const { createTextBox } = scene;
  const { handleMouseDown: handlePanMouseDown, handleMouseUp: handlePanMouseUp } = usePanHandlers();
  const { scheduleUpdate, flushUpdate, cleanup } = useRAFThrottle();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const uiState = uiStateApi.getState();

      if (e.key === 'Escape') {
        e.preventDefault();

        if (uiState.itemControls) {
          uiState.actions.setItemControls(null);
          return;
        }

        if (uiState.mode.type === 'CONNECTOR') {
          const connectorMode = uiState.mode;

          const isConnectionInProgress =
            (uiState.connectorInteractionMode === 'click' && connectorMode.isConnecting) ||
            (uiState.connectorInteractionMode === 'drag' && connectorMode.id !== null);

          if (isConnectionInProgress && connectorMode.id) {
            scene.deleteConnector(connectorMode.id);

            uiState.actions.setMode({
              type: 'CONNECTOR',
              showCursor: true,
              id: null,
              startAnchor: undefined,
              isConnecting: false
            });
          }
        }

        return;
      }

      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.closest('.ql-editor')
      ) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
      }

      if (
        isCtrlOrCmd &&
        (e.key.toLowerCase() === 'y' ||
          (e.key.toLowerCase() === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
      }

      if (isCtrlOrCmd && (e.key.toLowerCase() === 'c')) {
        e.preventDefault();
        scene.copyObjectsToClipboard(uiState);
        return;
      }

      if (isCtrlOrCmd && (e.key.toLowerCase() === 'v')) {
        e.preventDefault();
        scene.pasteObjectsFromClipboard(uiState, scene);
        return;
      }

      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        (uiState.mode.type === 'LASSO' || uiState.mode.type === 'FREEHAND_LASSO') &&
        uiState.mode.selection
      ) {
        e.preventDefault();
        scene.deleteObjects(uiState);
        return;
      }

      // Help dialog shortcut
      if (e.key === 'F1') {
        e.preventDefault();
        uiState.actions.setDialog(DialogTypeEnum.HELP);
      }

      const hotkeyMapping = HOTKEY_PROFILES[uiState.hotkeyProfile];
      const key = e.key.toLowerCase();

      if (key === 'i' && uiState.editorMode === 'EDITABLE' && uiState.itemControls && 'id' in uiState.itemControls && uiState.itemControls.type === 'ITEM') {
        e.preventDefault();
        const event = new CustomEvent('quickIconChange');
        window.dispatchEvent(event);
      }

      if (hotkeyMapping.select && key === hotkeyMapping.select) {
        e.preventDefault();
        uiState.actions.setMode({
          type: 'CURSOR',
          showCursor: true,
          mousedownItem: null
        });
      } else if (hotkeyMapping.pan && key === hotkeyMapping.pan) {
        e.preventDefault();
        uiState.actions.setMode({
          type: 'PAN',
          showCursor: false
        });
        uiState.actions.setItemControls(null);
      } else if (hotkeyMapping.addItem && key === hotkeyMapping.addItem) {
        e.preventDefault();
        uiState.actions.setItemControls({
          type: 'ADD_ITEM'
        });
        uiState.actions.setMode({
          type: 'PLACE_ICON',
          showCursor: true,
          id: null
        });
      } else if (hotkeyMapping.rectangle && key === hotkeyMapping.rectangle) {
        e.preventDefault();
        uiState.actions.setMode({
          type: 'RECTANGLE.DRAW',
          showCursor: true,
          id: null
        });
      } else if (hotkeyMapping.connector && key === hotkeyMapping.connector) {
        e.preventDefault();
        uiState.actions.setMode({
          type: 'CONNECTOR',
          id: null,
          showCursor: true
        });
      } else if (hotkeyMapping.text && key === hotkeyMapping.text) {
        e.preventDefault();
        const textBoxId = generateId();
        createTextBox({
          ...TEXTBOX_DEFAULTS,
          id: textBoxId,
          tile: uiState.mouse.position.tile
        });
        uiState.actions.setMode({
          type: 'TEXTBOX',
          showCursor: false,
          id: textBoxId
        });
      } else if (hotkeyMapping.lasso && key === hotkeyMapping.lasso) {
        e.preventDefault();
        uiState.actions.setMode({
          type: 'LASSO',
          showCursor: true,
          selection: null,
          isDragging: false
        });
      } else if (hotkeyMapping.freehandLasso && key === hotkeyMapping.freehandLasso) {
        e.preventDefault();
        uiState.actions.setMode({
          type: 'FREEHAND_LASSO',
          showCursor: true,
          path: [],
          selection: null,
          isDragging: false
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      return window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, canUndo, canRedo, uiStateApi, createTextBox, scene]);

  const processMouseUpdate = useCallback(
    (nextMouse: Mouse, e: SlimMouseEvent, skipModeUpdate?: boolean) => {
      if (!rendererRef.current) return;

      const uiState = uiStateApi.getState();

      if (skipModeUpdate) {
        uiState.actions.setMouse(nextMouse);
        return;
      }

      const mode = modes[uiState.mode.type];
      const modeFunction = getModeFunction(mode, e);
      if (!modeFunction) return;
      
      const model = modelStoreApi.getState();

      uiState.actions.setMouse(nextMouse);

      const baseState: State = {
        model,
        scene,
        uiState: { ...uiState, mouse: nextMouse },
        rendererRef: rendererRef.current,
        rendererSize,
        isRendererInteraction: rendererRef.current === e.target
      };

      if (reducerTypeRef.current !== uiState.mode.type) {
        const prevReducer = reducerTypeRef.current
          ? modes[reducerTypeRef.current]
          : null;

        if (prevReducer && prevReducer.exit) {
          prevReducer.exit(baseState);
        }

        if (mode.entry) {
          mode.entry(baseState);
        }
      }

      modeFunction(baseState);
      reducerTypeRef.current = uiState.mode.type;
    },
    [uiStateApi, modelStoreApi, scene, rendererSize]
  );

  const onMouseEvent = useCallback(
    (e: SlimMouseEvent) => {
      if (!rendererRef.current) return;

      const uiState = uiStateApi.getState();

      const nextMouse = getMouse({
        interactiveElement: rendererRef.current,
        zoom: uiState.zoom,
        scroll: uiState.scroll,
        lastMouse: uiState.mouse,
        mouseEvent: e,
        rendererSize,
        flat: uiState.projectionMode === 'FLAT'
      });

      if (e.type === 'mousemove') {
        scheduleUpdate(nextMouse, e, (update) => {
          processMouseUpdate(update.mouse, update.event);
        });
      } else {
        flushUpdate();
        processMouseUpdate(nextMouse, e,
          (e.type === 'mousedown' && handlePanMouseDown(e)) ||
          (e.type === 'mouseup' && handlePanMouseUp(e)) ||
          // A right/middle-button down or up should never drive left-click mode
          // logic (e.g. a right-click completing an in-progress connector) —
          // only the contextmenu handler should react to the right button.
          e.button !== 0
        );
      }
    },
    [uiStateApi, rendererSize, handlePanMouseDown, handlePanMouseUp, scheduleUpdate, flushUpdate, processMouseUpdate]
  );

  const onContextMenu = useCallback(
    (e: SlimMouseEvent) => {
      e.preventDefault();

      const uiState = uiStateApi.getState();

      // Read-only/locked diagrams (EXPLORABLE_READONLY) still attach mouse
      // listeners for panning, but none of the edit/delete context-menu
      // actions should be reachable there.
      if (uiState.editorMode !== 'EDITABLE') {
        return;
      }

      if (uiState.mode.type === 'CONNECTOR') {
        const connectorMode = uiState.mode;

        const isConnectionInProgress =
          (uiState.connectorInteractionMode === 'click' && connectorMode.isConnecting) ||
          (uiState.connectorInteractionMode === 'drag' && connectorMode.id !== null);

        if (isConnectionInProgress && connectorMode.id) {
          // Right-click cancels an in-progress connector instead of opening the
          // usual context menu — a quick way to back out without leaving a stub.
          scene.deleteConnector(connectorMode.id);

          uiState.actions.setMode({
            type: 'CONNECTOR',
            showCursor: true,
            id: null,
            startAnchor: undefined,
            isConnecting: false
          });

          return;
        }
      }

      if (uiState.panSettings.rightClickPan) {
        return;
      }

      const mouseTile = uiState.mouse.position.tile;
      const itemAtTile = getItemAtTile({ tile: mouseTile, scene });
      const isAnyItemSelectedInLasso = (uiState.mode.type === 'LASSO' || uiState.mode.type === 'FREEHAND_LASSO') && !!uiState.mode.selection?.items.length;

      if (isAnyItemSelectedInLasso) {
        const isInsideLassoSelection = (
          uiState.mode.type === 'LASSO' &&
          uiState.mode.selection &&
          isWithinBounds(mouseTile, [uiState.mode.selection.startTile, uiState.mode.selection.endTile])
        ) || (
          uiState.mode.type === 'FREEHAND_LASSO' &&
          uiState.mode.selection &&
          isPointInPolygon(mouseTile, uiState.mode.selection.pathTiles)
        );

        if (isInsideLassoSelection) {
          uiState.actions.setContextMenu({
            type: 'SELECTION',
            tile: mouseTile
          });
          return;
        } 
      }

      if (itemAtTile) {
        const groupIds =
          itemAtTile.type === 'CONNECTOR'
            ? getConnectorsAtTile({ tile: mouseTile, scene })
            : undefined;

        uiState.actions.setContextMenu({
          type: 'ITEM',
          item: itemAtTile,
          tile: mouseTile,
          groupIds: groupIds && groupIds.length > 1 ? groupIds : undefined
        });
      } else {
        uiState.actions.setContextMenu({
          type: 'EMPTY',
          tile: mouseTile
        });
      }
    },
    [uiStateApi, scene]
  );

  useEffect(() => {
    if (modeType === 'INTERACTIONS_DISABLED') return;

    const el = window;

    const clearLongPressTimer = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const clientX = Math.floor(touch.clientX);
      const clientY = Math.floor(touch.clientY);

      longPressFiredRef.current = false;
      longPressStartRef.current = { x: clientX, y: clientY };

      onMouseEvent({
        ...e,
        clientX,
        clientY,
        type: 'mousedown',
        button: 0
      });

      clearLongPressTimer();
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        longPressFiredRef.current = true;

        const uiState = uiStateApi.getState();

        // The pending "open edit panel on release" state would otherwise
        // still fire on touchend, opening ItemControls alongside the
        // context menu it's about to show.
        if ('mousedownItem' in uiState.mode) {
          uiState.actions.setMode({
            ...uiState.mode,
            mousedownItem: null
          } as typeof uiState.mode);
        }

        onContextMenu({
          clientX,
          clientY,
          target: e.target,
          type: 'contextmenu',
          preventDefault: () => {},
          button: 2,
          ctrlKey: false,
          altKey: false,
          shiftKey: false,
          metaKey: false
        });
      }, 500);
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const clientX = Math.floor(touch.clientX);
      const clientY = Math.floor(touch.clientY);

      if (longPressStartRef.current && longPressTimerRef.current) {
        const dx = clientX - longPressStartRef.current.x;
        const dy = clientY - longPressStartRef.current.y;
        if (Math.hypot(dx, dy) > 10) clearLongPressTimer();
      }

      onMouseEvent({
        ...e,
        clientX,
        clientY,
        type: 'mousemove',
        button: 0
      });
    };

    const onTouchEnd = (e: TouchEvent) => {
      clearLongPressTimer();

      if (longPressFiredRef.current) {
        // Context menu is already open from the long-press -- don't also
        // dispatch the release as a click/tap.
        longPressFiredRef.current = false;
        return;
      }

      onMouseEvent({
        ...e,
        clientX: 0,
        clientY: 0,
        type: 'mouseup',
        button: 0
      });
    };

    const onScroll = (e: WheelEvent) => {
      const uiState = uiStateApi.getState();
      const isPinchGesture = e.ctrlKey;

      const applyZoom = () => {
        const oldZoom = uiState.zoom;
        const newZoom = e.deltaY > 0 ? decrementZoom(oldZoom) : incrementZoom(oldZoom);

        if (newZoom === oldZoom) return;

        if (uiState.zoomSettings.zoomToCursor && rendererRef.current && rendererSize) {
          const rect = rendererRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          const mouseRelativeToCenterX = mouseX - rendererSize.width / 2;
          const mouseRelativeToCenterY = mouseY - rendererSize.height / 2;

          const worldX = (mouseRelativeToCenterX - uiState.scroll.position.x) / oldZoom;
          const worldY = (mouseRelativeToCenterY - uiState.scroll.position.y) / oldZoom;

          const newScrollX = mouseRelativeToCenterX - worldX * newZoom;
          const newScrollY = mouseRelativeToCenterY - worldY * newZoom;

          uiState.actions.setZoom(newZoom);
          uiState.actions.setScroll({
            position: { x: newScrollX, y: newScrollY },
            offset: uiState.scroll.offset
          });
        } else {
          uiState.actions.setZoom(newZoom);
        }
      };

      if (trackpadMode) {
        if (isPinchGesture) {
          e.preventDefault();
          applyZoom();
        } else {
          e.preventDefault();
          uiState.actions.setScroll({
            position: {
              x: uiState.scroll.position.x - e.deltaX,
              y: uiState.scroll.position.y - e.deltaY
            },
            offset: uiState.scroll.offset
          });
        }
      } else {
        applyZoom();
      }
    };

    el.addEventListener('mousemove', onMouseEvent);
    el.addEventListener('mousedown', onMouseEvent);
    el.addEventListener('mouseup', onMouseEvent);
    el.addEventListener('contextmenu', onContextMenu);
    el.addEventListener('touchstart', onTouchStart);
    el.addEventListener('touchmove', onTouchMove);
    el.addEventListener('touchend', onTouchEnd);
    rendererEl?.addEventListener('wheel', onScroll, { passive: !trackpadMode });

    return () => {
      el.removeEventListener('mousemove', onMouseEvent);
      el.removeEventListener('mousedown', onMouseEvent);
      el.removeEventListener('mouseup', onMouseEvent);
      el.removeEventListener('contextmenu', onContextMenu);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      rendererEl?.removeEventListener('wheel', onScroll);
      // Deliberately NOT clearing the long-press timer here -- this cleanup
      // re-runs on every dependency change (mode/renderer-size/etc.), not
      // just unmount, and those fire constantly during an interaction. The
      // timer callback reads live state via uiStateApi.getState() at fire
      // time, so surviving a listener rebind is harmless; clearing it here
      // was cancelling real long-presses mid-hold.
      cleanup();
    };
  }, [
    editorMode,
    modeType,
    onMouseEvent,
    onContextMenu,
    rendererEl,
    rendererSize,
    uiStateApi,
    trackpadMode,
    cleanup
  ]);

  const setInteractionsElement = useCallback((element: HTMLElement) => {
    rendererRef.current = element;
  }, []);

  return {
    setInteractionsElement
  };
};
