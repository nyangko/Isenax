import React, { createContext, useContext, useRef } from 'react';
import { createStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import {
  CoordsUtils,
  incrementZoom,
  decrementZoom,
  getStartingMode
} from 'src/utils';
import { UiStateStore } from 'src/types';
import { INITIAL_UI_STATE } from 'src/config';
import { DEFAULT_HOTKEY_PROFILE, HotkeyProfile } from 'src/config/hotkeys';
import { DEFAULT_PAN_SETTINGS } from 'src/config/panSettings';
import { DEFAULT_ZOOM_SETTINGS } from 'src/config/zoomSettings';
import { DEFAULT_LABEL_SETTINGS } from 'src/config/labelSettings';

const initialState = () => {
  return createStore<UiStateStore>()(
    persist(
      (set, get) => {
        return {
          zoom: INITIAL_UI_STATE.zoom,
          scroll: INITIAL_UI_STATE.scroll,
          view: '',
          mainMenuOptions: [],
          editorMode: 'EXPLORABLE_READONLY',
          mode: getStartingMode('EXPLORABLE_READONLY'),
          iconCategoriesState: [],
          isMainMenuOpen: false,
          dialog: null,
          rendererEl: null,
          contextMenu: null,
          mouse: {
            position: { screen: CoordsUtils.zero(), tile: CoordsUtils.zero() },
            mousedown: null,
            delta: null
          },
          itemControls: null,
          enableDebugTools: false,
          hotkeyProfile: DEFAULT_HOTKEY_PROFILE,
          panSettings: DEFAULT_PAN_SETTINGS,
          zoomSettings: DEFAULT_ZOOM_SETTINGS,
          labelSettings: DEFAULT_LABEL_SETTINGS,
          connectorInteractionMode: 'click', // Default to click mode
          connectorAnimationEnabled: true, // Default to animated flow direction
          connectorAnimationSpeed: 220, // px/sec — matches the original hardcoded default
          expandLabels: false, // Default to collapsed labels
          projectionMode: 'ISOMETRIC', // Default to the tilted isometric view
          iconPackManager: null, // Will be set by Isoflow if provided
          isAnythingCopied: false,
          mainMenuPortalTarget: null,
          historyControlsPortalTarget: null,
          helpButtonPortalTarget: null,
          exportImageButtonPortalTarget: null,
          settingsButtonPortalTarget: null,
          exportCompactJsonButtonPortalTarget: null,
          layersButtonPortalTarget: null,
          layersPanelOpen: false,
          mainMenuExtraItems: null,

          actions: {
            setView: (view) => {
              set({ view });
            },
            setMainMenuOptions: (mainMenuOptions) => {
              set({ mainMenuOptions });
            },
            setEditorMode: (mode) => {
              set({ editorMode: mode, mode: getStartingMode(mode) });
            },
            setIconCategoriesState: (iconCategoriesState) => {
              set({ iconCategoriesState });
            },
            resetUiState: () => {
              set({
                mode: getStartingMode(get().editorMode),
                scroll: {
                  position: CoordsUtils.zero(),
                  offset: CoordsUtils.zero()
                },
                itemControls: null,
                zoom: 1
              });
            },
            setMode: (mode) => {
              set({ mode });
            },
            setDialog: (dialog) => {
              set({ dialog });
            },
            setIsMainMenuOpen: (isMainMenuOpen) => {
              set({ isMainMenuOpen, itemControls: null });
            },
            incrementZoom: () => {
              const { zoom } = get();
              set({ zoom: incrementZoom(zoom) });
            },
            decrementZoom: () => {
              const { zoom } = get();
              set({ zoom: decrementZoom(zoom) });
            },
            setZoom: (zoom) => {
              set({ zoom });
            },
            setScroll: ({ position, offset }) => {
              set({
                scroll: { position, offset: offset ?? get().scroll.offset }
              });
            },
            setItemControls: (itemControls) => {
              set({ itemControls });
            },
            setContextMenu: (contextMenu) => {
              set({ contextMenu });
            },
            setMouse: (mouse) => {
              set({ mouse });
            },
            setEnableDebugTools: (enableDebugTools) => {
              set({ enableDebugTools });
            },
            setMainMenuPortalTarget: (mainMenuPortalTarget) => {
              set({ mainMenuPortalTarget });
            },
            setHistoryControlsPortalTarget: (historyControlsPortalTarget) => {
              set({ historyControlsPortalTarget });
            },
            setHelpButtonPortalTarget: (helpButtonPortalTarget) => {
              set({ helpButtonPortalTarget });
            },
            setExportImageButtonPortalTarget: (
              exportImageButtonPortalTarget
            ) => {
              set({ exportImageButtonPortalTarget });
            },
            setSettingsButtonPortalTarget: (settingsButtonPortalTarget) => {
              set({ settingsButtonPortalTarget });
            },
            setExportCompactJsonButtonPortalTarget: (
              exportCompactJsonButtonPortalTarget
            ) => {
              set({ exportCompactJsonButtonPortalTarget });
            },
            setLayersButtonPortalTarget: (layersButtonPortalTarget) => {
              set({ layersButtonPortalTarget });
            },
            setLayersPanelOpen: (layersPanelOpen) => {
              set({ layersPanelOpen });
            },
            setMainMenuExtraItems: (mainMenuExtraItems) => {
              set({ mainMenuExtraItems });
            },
            setRendererEl: (el: HTMLDivElement) => {
              set({ rendererEl: el });
            },
            setHotkeyProfile: (hotkeyProfile: HotkeyProfile) => {
              set({ hotkeyProfile });
            },
            setPanSettings: (panSettings) => {
              set({ panSettings });
            },
            setZoomSettings: (zoomSettings) => {
              set({ zoomSettings });
            },
            setLabelSettings: (labelSettings) => {
              set({ labelSettings });
            },
            setConnectorInteractionMode: (connectorInteractionMode) => {
              set({ connectorInteractionMode });
            },
            setConnectorAnimationEnabled: (connectorAnimationEnabled) => {
              set({ connectorAnimationEnabled });
            },
            setConnectorAnimationSpeed: (connectorAnimationSpeed) => {
              set({ connectorAnimationSpeed });
            },
            setExpandLabels: (expandLabels) => {
              set({ expandLabels });
            },
            setProjectionMode: (projectionMode) => {
              set({ projectionMode });
            },
            setIconPackManager: (iconPackManager) => {
              set({ iconPackManager });
            },
            setIsAnythingCopied: (isAnythingCopied) => {
              set({ isAnythingCopied });
            }
          }
        };
      },
      {
        // Only the user-preference slice persists -- everything else here
        // (zoom/scroll/mouse/mode/dialog/portal targets/etc.) is transient
        // per-session UI state that shouldn't survive or leak across reloads.
        name: 'isenax-ui-settings',
        partialize: (state) => {
          return {
            hotkeyProfile: state.hotkeyProfile,
            panSettings: state.panSettings,
            zoomSettings: state.zoomSettings,
            labelSettings: state.labelSettings,
            connectorInteractionMode: state.connectorInteractionMode,
            connectorAnimationEnabled: state.connectorAnimationEnabled,
            connectorAnimationSpeed: state.connectorAnimationSpeed,
            expandLabels: state.expandLabels,
            projectionMode: state.projectionMode
          };
        }
      }
    )
  );
};

const UiStateContext = createContext<ReturnType<typeof initialState> | null>(
  null
);

interface ProviderProps {
  children: React.ReactNode;
}

// TODO: Typings below are pretty gnarly due to the way Zustand works.
// see https://github.com/pmndrs/zustand/discussions/1180#discussioncomment-3439061
export const UiStateProvider = ({ children }: ProviderProps) => {
  const storeRef = useRef<ReturnType<typeof initialState> | undefined>(
    undefined
  );

  if (!storeRef.current) {
    storeRef.current = initialState();
  }

  return (
    <UiStateContext.Provider value={storeRef.current}>
      {children}
    </UiStateContext.Provider>
  );
};

export function useUiStateStore<T>(
  selector: (state: UiStateStore) => T,
  equalityFn?: (left: T, right: T) => boolean
) {
  const store = useContext(UiStateContext);

  if (store === null) {
    throw new Error('Missing provider in the tree');
  }

  const value = useStoreWithEqualityFn(store, selector, equalityFn);
  return value;
}

// Hook to get store API for imperative access (getState without subscribing)
export function useUiStateStoreApi() {
  const store = useContext(UiStateContext);

  if (store === null) {
    throw new Error('Missing provider in the tree');
  }

  return store;
}
