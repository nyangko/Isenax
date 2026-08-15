import type { ReactNode } from 'react';
import { Coords, EditorModeEnum, ProjectionModeEnum, ToolbarPositionEnum, MainMenuOptions } from './common';
import { Icon } from './model';
import { ItemReference } from './scene';
import { HotkeyProfile } from 'src/config/hotkeys';
import { PanSettings } from 'src/config/panSettings';
import { ZoomSettings } from 'src/config/zoomSettings';
import { LabelSettings } from 'src/config/labelSettings';
import { IconPackManagerProps, MCPManagerProps } from './isoflowProps';

interface AddItemControls {
  type: 'ADD_ITEM';
}

export interface ConnectorGroupControls {
  type: 'CONNECTOR_GROUP';
  ids: string[];
  focusedId: string | null;
}

export type ItemControls = ItemReference | AddItemControls | ConnectorGroupControls;

export interface Mouse {
  position: {
    screen: Coords;
    tile: Coords;
  };
  mousedown: {
    screen: Coords;
    tile: Coords;
  } | null;
  delta: {
    screen: Coords;
    tile: Coords;
  } | null;
}

// Mode types
export interface InteractionsDisabled {
  type: 'INTERACTIONS_DISABLED';
  showCursor: boolean;
}

export interface CursorMode {
  type: 'CURSOR';
  showCursor: boolean;
  mousedownItem: ItemReference | null;
}

export interface DragItemsMode {
  type: 'DRAG_ITEMS';
  showCursor: boolean;
  items: ItemReference[];
  isInitialMovement: Boolean;
}

export interface PanMode {
  type: 'PAN';
  showCursor: boolean;
  temp?: boolean; // For panning temporarily from other modes
}

export interface PlaceIconMode {
  type: 'PLACE_ICON';
  showCursor: boolean;
  id: string | null;
}

export interface ConnectorMode {
  type: 'CONNECTOR';
  showCursor: boolean;
  id: string | null;
  // For click-based connection mode
  startAnchor?: {
    tile?: Coords;
    itemId?: string;
  };
  isConnecting?: boolean;
}

export interface DrawRectangleMode {
  type: 'RECTANGLE.DRAW';
  showCursor: boolean;
  id: string | null;
}

export const AnchorPositionOptions = {
  BOTTOM_LEFT: 'BOTTOM_LEFT',
  BOTTOM_RIGHT: 'BOTTOM_RIGHT',
  TOP_RIGHT: 'TOP_RIGHT',
  TOP_LEFT: 'TOP_LEFT'
} as const;

export type AnchorPosition = keyof typeof AnchorPositionOptions;

export interface TransformRectangleMode {
  type: 'RECTANGLE.TRANSFORM';
  showCursor: boolean;
  id: string;
  selectedAnchor: AnchorPosition | null;
}

export interface TextBoxMode {
  type: 'TEXTBOX';
  showCursor: boolean;
  id: string | null;
}

export interface LassoMode {
  type: 'LASSO';
  showCursor: boolean;
  selection: {
    startTile: Coords;
    endTile: Coords;
    items: ItemReference[];
  } | null;
  isDragging: boolean;
}

export interface FreehandLassoMode {
  type: 'FREEHAND_LASSO';
  showCursor: boolean;
  path: Coords[]; // Screen coordinates of the drawn path
  selection: {
    pathTiles: Coords[]; // Tile coordinates of the path points
    items: ItemReference[];
  } | null;
  isDragging: boolean;
}

export type Mode =
  | InteractionsDisabled
  | CursorMode
  | PanMode
  | PlaceIconMode
  | ConnectorMode
  | DrawRectangleMode
  | TransformRectangleMode
  | DragItemsMode
  | TextBoxMode
  | LassoMode
  | FreehandLassoMode;
// End mode types

export interface Scroll {
  position: Coords;
  offset: Coords;
}

export interface IconCollectionState {
  id?: string;
  isExpanded: boolean;
}

export type IconCollectionStateWithIcons = IconCollectionState & {
  icons: Icon[];
};

export const DialogTypeEnum = {
  EXPORT_IMAGE: 'EXPORT_IMAGE',
  HELP: 'HELP',
  SETTINGS: 'SETTINGS'
} as const;

export interface ContextMenu {
  type: 'ITEM' | 'EMPTY' | 'SELECTION';
  item?: ItemReference;
  tile: Coords;
  // Populated when right-clicking a tile where multiple connectors overlap —
  // lets the context menu offer group actions instead of only acting on
  // whichever single connector getItemAtTile happened to pick.
  groupIds?: string[];
}


export type ConnectorInteractionMode = 'click' | 'drag';

export interface UiState {
  view: string;
  mainMenuOptions: MainMenuOptions;
  editorMode: keyof typeof EditorModeEnum;
  iconCategoriesState: IconCollectionState[];
  mode: Mode;
  dialog: keyof typeof DialogTypeEnum | null;
  isMainMenuOpen: boolean;
  itemControls: ItemControls | null;
  contextMenu: ContextMenu | null;
  zoom: number;
  scroll: Scroll;
  mouse: Mouse;
  rendererEl: HTMLDivElement | null;
  enableDebugTools: boolean;
  hotkeyProfile: HotkeyProfile;
  panSettings: PanSettings;
  zoomSettings: ZoomSettings;
  labelSettings: LabelSettings;
  connectorInteractionMode: ConnectorInteractionMode;
  connectorAnimationEnabled: boolean;
  connectorAnimationSpeed: number;
  expandLabels: boolean;
  projectionMode: keyof typeof ProjectionModeEnum;
  toolbarPosition: keyof typeof ToolbarPositionEnum;
  iconPackManager: IconPackManagerProps | null;
  mcpManager: MCPManagerProps | null;
  /** Skill ids the user has enabled in Settings; gates whether their action is offered. */
  enabledSkills: string[];
  isAnythingCopied: boolean;
  mainMenuPortalTarget: HTMLElement | null;
  historyControlsPortalTarget: HTMLElement | null;
  helpButtonPortalTarget: HTMLElement | null;
  exportImageButtonPortalTarget: HTMLElement | null;
  settingsButtonPortalTarget: HTMLElement | null;
  exportCompactJsonButtonPortalTarget: HTMLElement | null;
  layersButtonPortalTarget: HTMLElement | null;
  layersPanelOpen: boolean;
  /** Item/connector/rectangle/textBox ids hidden from the canvas via the Layers panel. Session-only. */
  hiddenLayerIds: string[];
  /** Ids marked locked via the Layers panel. Session-only; not yet enforced against canvas interaction. */
  lockedLayerIds: string[];
  // Render prop rather than a plain node so the host app can close the menu
  // after its own item is clicked -- MainMenu owns isMainMenuOpen and no
  // other mechanism lets an externally-supplied item reach it.
  mainMenuExtraItems: ((closeMenu: () => void) => ReactNode) | null;
}

export interface UiStateActions {
  setView: (view: string) => void;
  setMainMenuOptions: (options: MainMenuOptions) => void;
  setEditorMode: (mode: keyof typeof EditorModeEnum) => void;
  setIconCategoriesState: (iconCategoriesState: IconCollectionState[]) => void;
  resetUiState: () => void;
  setMode: (mode: Mode) => void;
  incrementZoom: () => void;
  decrementZoom: () => void;
  setIsMainMenuOpen: (isOpen: boolean) => void;
  setDialog: (dialog: keyof typeof DialogTypeEnum | null) => void;
  setZoom: (zoom: number) => void;
  setScroll: (scroll: Scroll) => void;
  setItemControls: (itemControls: ItemControls | null) => void;
  setContextMenu: (contextMenu: ContextMenu | null) => void;
  setMouse: (mouse: Mouse) => void;
  setRendererEl: (el: HTMLDivElement) => void;
  setEnableDebugTools: (enabled: boolean) => void;
  setMainMenuPortalTarget: (el: HTMLElement | null) => void;
  setHistoryControlsPortalTarget: (el: HTMLElement | null) => void;
  setHelpButtonPortalTarget: (el: HTMLElement | null) => void;
  setExportImageButtonPortalTarget: (el: HTMLElement | null) => void;
  setSettingsButtonPortalTarget: (el: HTMLElement | null) => void;
  setExportCompactJsonButtonPortalTarget: (el: HTMLElement | null) => void;
  setLayersButtonPortalTarget: (el: HTMLElement | null) => void;
  setLayersPanelOpen: (open: boolean) => void;
  setMainMenuExtraItems: (items: ((closeMenu: () => void) => ReactNode) | null) => void;
  setHotkeyProfile: (profile: HotkeyProfile) => void;
  setPanSettings: (settings: PanSettings) => void;
  setZoomSettings: (settings: ZoomSettings) => void;
  setLabelSettings: (settings: LabelSettings) => void;
  setConnectorInteractionMode: (mode: ConnectorInteractionMode) => void;
  setConnectorAnimationEnabled: (enabled: boolean) => void;
  setConnectorAnimationSpeed: (speed: number) => void;
  setExpandLabels: (expand: boolean) => void;
  setProjectionMode: (mode: keyof typeof ProjectionModeEnum) => void;
  setToolbarPosition: (position: keyof typeof ToolbarPositionEnum) => void;
  setIconPackManager: (iconPackManager: IconPackManagerProps | null) => void;
  setMcpManager: (mcpManager: MCPManagerProps | null) => void;
  setEnabledSkills: (enabledSkills: string[]) => void;
  setIsAnythingCopied: (isAnythingCopied: boolean) => void;
  toggleLayerHidden: (id: string) => void;
  toggleLayerLocked: (id: string) => void;
}

export type UiStateStore = UiState & {
  actions: UiStateActions;
};
