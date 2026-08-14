import type { ReactNode } from 'react';
import type { EditorModeEnum, ProjectionModeEnum, MainMenuOptions } from './common';
import type { Model } from './model';
import type { RendererProps } from './rendererProps';

export type InitialData = Model & {
  fitToView?: boolean;
  view?: string;
};

export interface LocaleProps {
  common: {
    exampleText: string;
    delete: string;
    duplicate: string;
  };
  textBoxControls: {
    enterText: string;
    textSize: string;
    alignment: string;
    close: string;
  };
  mainMenu: {
    undo: string;
    redo: string;
    open: string;
    exportJson: string;
    exportCompactJson: string;
    exportImage: string;
    clearCanvas: string;
    clearCanvasConfirm: string;
    settings: string;
    gitHub: string;
    layers: string;
  };
  viewControls: {
    switchToFlatView: string;
    switchToIsometricView: string;
  };
  helpDialog: {
    title: string;
    close: string;
    keyboardShortcuts: string;
    mouseInteractions: string;
    action: string;
    shortcut: string;
    method: string;
    description: string;
    note: string;
    noteContent: string;
    // Keyboard shortcuts
    undoAction: string;
    undoDescription: string;
    redoAction: string;
    redoDescription: string;
    redoAltAction: string;
    redoAltDescription: string;
    copyAction: string;
    copyDescription: string;
    pasteAction: string;
    pasteDescription: string;
    helpAction: string;
    helpDescription: string;
    zoomInAction: string;
    zoomInShortcut: string;
    zoomInDescription: string;
    zoomOutAction: string;
    zoomOutShortcut: string;
    zoomOutDescription: string;
    panCanvasAction: string;
    panCanvasShortcut: string;
    panCanvasDescription: string;
    contextMenuAction: string;
    contextMenuShortcut: string;
    contextMenuDescription: string;
    // Mouse interactions
    selectToolAction: string;
    selectToolShortcut: string;
    selectToolDescription: string;
    panToolAction: string;
    panToolShortcut: string;
    panToolDescription: string;
    addItemAction: string;
    addItemShortcut: string;
    addItemDescription: string;
    drawRectangleAction: string;
    drawRectangleShortcut: string;
    drawRectangleDescription: string;
    createConnectorAction: string;
    createConnectorShortcut: string;
    createConnectorDescription: string;
    addTextAction: string;
    addTextShortcut: string;
    addTextDescription: string;
  };
  connectorHintTooltip: {
    tipCreatingConnectors: string;
    tipConnectorTools: string;
    clickInstructionStart: string;
    clickInstructionMiddle: string;
    clickInstructionEnd: string;
    nowClickTarget: string;
    dragStart: string;
    dragEnd: string;
    rerouteStart: string;
    rerouteMiddle: string;
    rerouteEnd: string;
  };
  lassoHintTooltip: {
    tipLasso: string;
    tipFreehandLasso: string;
    lassoDragStart: string;
    lassoDragEnd: string;
    freehandDragStart: string;
    freehandDragMiddle: string;
    freehandDragEnd: string;
    freehandComplete: string;
    moveStart: string;
    moveMiddle: string;
    moveEnd: string;
  };
  importHintTooltip: {
    title: string;
    instructionStart: string;
    menuButton: string;
    instructionMiddle: string;
    openButton: string;
    instructionEnd: string;
  };
  connectorRerouteTooltip: {
    title: string;
    instructionStart: string;
    instructionSelect: string;
    instructionMiddle: string;
    instructionClick: string;
    instructionAnd: string;
    instructionDrag: string;
    instructionEnd: string;
  };
  connectorEmptySpaceTooltip: {
    message: string;
    instruction: string;
  };
  contextMenu: {
    copySelection: string;
    deleteSelection: string;
    copyNode: string;
    copyRectangle: string;
    copyText: string;
    addNode: string;
    addRectangle: string;
    addConnector: string;
    duplicateNode: string;
    duplicateRectangle: string;
    duplicateText: string;
    editNode: string;
    deleteNode: string;
    editRectangle: string;
    deleteRectangle: string;
    editText: string;
    deleteText: string;
    editConnector: string;
    deleteConnector: string;
    editConnectorsHere: string;
    deleteConnectorsHere: string;
    paste: string;
  };
  settings: {
    zoom: {
      title: string;
      description: string;
      zoomToCursor: string;
      zoomToCursorDesc: string;
      trackpadMode: string;
      trackpadModeDesc: string;
    };
    labels: {
      title: string;
      description: string;
      expandButtonPadding: string;
      expandButtonPaddingDesc: string;
      currentPrefix: string;
      unitsLabel: string;
    };
    hotkeys: {
      title: string;
      profile: string;
      profileQwerty: string;
      profileSmnrct: string;
      profileNone: string;
      tool: string;
      hotkey: string;
      toolSelect: string;
      toolLasso: string;
      toolFreehandLasso: string;
      toolPan: string;
      toolAddItem: string;
      toolRectangle: string;
      toolConnector: string;
      toolText: string;
      note: string;
    };
    pan: {
      title: string;
      mousePanOptions: string;
      emptyAreaClickPan: string;
      holdToPan: string;
      middleClickPan: string;
      rightClickPan: string;
      ctrlClickPan: string;
      altClickPan: string;
      keyboardPanOptions: string;
      arrowKeys: string;
      wasdKeys: string;
      ijklKeys: string;
      keyboardPanSpeed: string;
      note: string;
    };
    connector: {
      title: string;
      connectionMode: string;
      clickMode: string;
      clickModeDesc: string;
      dragMode: string;
      dragModeDesc: string;
      animation: string;
      animationDesc: string;
      animationSpeed: string;
      note: string;
    };
    iconPacks: {
      title: string;
      lazyLoading: string;
      lazyLoadingDesc: string;
      availablePacks: string;
      coreIsoflow: string;
      alwaysEnabled: string;
      awsPack: string;
      gcpPack: string;
      azurePack: string;
      kubernetesPack: string;
      loading: string;
      loaded: string;
      notLoaded: string;
      iconCount: string;
      lazyLoadingDisabledNote: string;
      note: string;
    };
    // Optional: only en-US/ko-KR ship these so far; other locales fall back
    // to the raw key until the i18n completeness pass fills them in.
    mcp?: {
      title: string;
      description: string;
      enable: string;
      available: string;
      unavailable: string;
      url: string;
      token: string;
      clientConfig: string;
      copy: string;
      copied: string;
    };
    skills?: {
      title: string;
      description: string;
      autoArrangeName: string;
      autoArrangeDescription: string;
      run: string;
      noView: string;
    };
  };
  lazyLoadingWelcome: {
    title: string;
    message: string;
    configPath: string;
    configPath2: string;
    canDisable: string;
    signature: string;
  };
  // Display names for the base "isoflow" icon pack (keyed by icon id).
  // Other packs (AWS/GCP/Azure/Kubernetes) are product/brand names and stay in English.
  iconNames: Record<string, string>;
  itemControls: {
    close: string;
    color: string;
    useCustomColor: string;
    node: {
      editLabelTitle: string;
      editLabelDescription: string;
      basicInfoSection: string;
      appearanceSection: string;
      appearanceSectionDescription: string;
      iconLabel: string;
      iconChangeDescription: string;
      name: string;
      description: string;
      labelHeight: string;
      labelHeightHelp: string;
      iconSize: string;
      iconSizeHelp: string;
      updateIcon: string;
      backToSettings: string;
      expandDescription: string;
      collapseDescription: string;
    };
    connector: {
      editTitle: string;
      options: string;
      name: string;
      namePlaceholder: string;
      description: string;
      descriptionPlaceholder: string;
      labels: string;
      labelsCount: string;
      addLabel: string;
      deleteLabel: string;
      noLabels: string;
      labelNumber: string;
      labelText: string;
      position: string;
      heightOffset: string;
      showDottedLine: string;
      width: string;
      lineStyle: string;
      showArrow: string;
      preventOverlap: string;
      reverseDirection: string;
      connectorsCount: string;
      labelCountChip: string;
      connectorFallbackName: string;
      styleSolid: string;
      styleDashed: string;
      styleDotted: string;
    };
    iconSelection: {
      searchPlaceholder: string;
      importIcons: string;
      treatAsIsometric: string;
      uncheckForFlat: string;
      dragDropHint: string;
    };
    quickIconSelector: {
      searchPlaceholder: string;
      recentlyUsed: string;
      searchResults: string;
      noResults: string;
      helpSearching: string;
      helpBrowsing: string;
    };
  };
  layersPanel: {
    title: string;
    tabLayers: string;
    tabEdit: string;
    emptyDetail: string;
    emptyCanvas: string;
    groupNodes: string;
    groupConnectors: string;
    groupRectangles: string;
    groupTextBoxes: string;
    rectangleFallbackName: string;
  };
  // other namespaces can be added here
}

export interface IconPackManagerProps {
  lazyLoadingEnabled: boolean;
  onToggleLazyLoading: (enabled: boolean) => void;
  packInfo: Array<{
    name: string;
    displayName: string;
    loaded: boolean;
    loading: boolean;
    error: string | null;
    iconCount: number;
  }>;
  enabledPacks: string[];
  onTogglePack: (packName: string, enabled: boolean) => void;
}

// Host-provided bridge to the app's own backend, which actually owns the
// running MCP server process — the library only renders its state and lets
// the user toggle it.
export interface MCPManagerProps {
  available: boolean;
  enabled: boolean;
  url: string | null;
  token: string | null;
  loading: boolean;
  onToggle: (enabled: boolean) => void;
}

export interface IsoflowProps {
  initialData?: InitialData;
  mainMenuOptions?: MainMenuOptions;
  onModelUpdated?: (Model: Model) => void;
  width?: number | string;
  height?: number | string;
  enableDebugTools?: boolean;
  editorMode?: keyof typeof EditorModeEnum;
  /** Same scene, same interactions — just a top-down square grid instead of the tilted isometric one. */
  projectionMode?: keyof typeof ProjectionModeEnum;
  renderer?: RendererProps;
  locale?: LocaleProps;
  iconPackManager?: IconPackManagerProps;
  /** Bridge to the host app's MCP server (see MCPManagerProps). Omit to hide the MCP settings tab entirely. */
  mcpManager?: MCPManagerProps;
  /** Renders the main menu (hamburger) button into this DOM node instead of its default floating position. */
  mainMenuPortalTarget?: HTMLElement | null;
  /** Renders the undo/redo buttons into this DOM node instead of the floating tool menu. */
  historyControlsPortalTarget?: HTMLElement | null;
  /** Renders the help (?) button into this DOM node instead of the zoom controls cluster. */
  helpButtonPortalTarget?: HTMLElement | null;
  /** Renders a standalone "export as image" button into this DOM node. Unlike the other portal targets, there's no default floating position — pass this only if you want the action available outside the main menu. */
  exportImageButtonPortalTarget?: HTMLElement | null;
  /** Renders a standalone settings button into this DOM node. Unlike the other portal targets, there's no default floating position — pass this only if you want the action available outside the main menu. */
  settingsButtonPortalTarget?: HTMLElement | null;
  /** Renders a standalone "export as compact JSON" button into this DOM node. Unlike the other portal targets, there's no default floating position — pass this only if you want the action available outside the main menu. */
  exportCompactJsonButtonPortalTarget?: HTMLElement | null;
  /** Renders a standalone layers-panel toggle button into this DOM node. Unlike the other portal targets, there's no default floating position — pass this only if you want the action available outside the main menu. */
  layersButtonPortalTarget?: HTMLElement | null;
  /** Extra items rendered into the main menu's dropdown, above its own built-in items. Called with a closeMenu callback so host-supplied items can close the menu after acting, the same way MainMenu's own items do. */
  mainMenuExtraItems?: (closeMenu: () => void) => ReactNode;
}
