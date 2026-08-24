import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Box, useTheme, useMediaQuery, Stack, SwipeableDrawer, Slide } from '@mui/material';
import { EditorModeEnum, DialogTypeEnum } from 'src/types';
import { UiElement } from 'components/UiElement/UiElement';
import { SceneLayer } from 'src/components/SceneLayer/SceneLayer';
import { DragAndDrop } from 'src/components/DragAndDrop/DragAndDrop';
import { ToolMenu } from 'src/components/ToolMenu/ToolMenu';
import { HistoryControls } from 'src/components/HistoryControls/HistoryControls';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { MainMenu } from 'src/components/MainMenu/MainMenu';
import { ExportImageButton } from 'src/components/ExportImageButton/ExportImageButton';
import { SettingsButton } from 'src/components/SettingsButton/SettingsButton';
import { ExportCompactJsonButton } from 'src/components/ExportCompactJsonButton/ExportCompactJsonButton';
import { LayersButton } from 'src/components/LayersButton/LayersButton';
import { LayersPanel } from 'src/components/LayersPanel/LayersPanel';
import { ZoomControls } from 'src/components/ZoomControls/ZoomControls';
import { DebugUtils } from 'src/components/DebugUtils/DebugUtils';
import { useResizeObserver } from 'src/hooks/useResizeObserver';
import { ContextMenuManager } from 'src/components/ContextMenu/ContextMenuManager';
import { useScene } from 'src/hooks/useScene';
import { ExportImageDialog } from '../ExportImageDialog/ExportImageDialog';
import { HelpDialog } from '../HelpDialog/HelpDialog';
import { SettingsDialog } from '../SettingsDialog/SettingsDialog';
import { ConnectorEmptySpaceTooltip } from '../ConnectorEmptySpaceTooltip/ConnectorEmptySpaceTooltip';
import { ConnectorRerouteTooltip } from '../ConnectorRerouteTooltip/ConnectorRerouteTooltip';
import { LassoHintTooltip } from '../LassoHintTooltip/LassoHintTooltip';
import { HintStack } from '../HintStack/HintStack';
import { CoordsUtils, getTilePosition } from 'src/utils';

const ToolsEnum = {
  MAIN_MENU: 'MAIN_MENU',
  ZOOM_CONTROLS: 'ZOOM_CONTROLS',
  TOOL_MENU: 'TOOL_MENU',
  ITEM_CONTROLS: 'ITEM_CONTROLS'
} as const;

interface EditorModeMapping {
  [k: string]: (keyof typeof ToolsEnum)[];
}

const EDITOR_MODE_MAPPING: EditorModeMapping = {
  [EditorModeEnum.EDITABLE]: [
    'ITEM_CONTROLS',
    'ZOOM_CONTROLS',
    'TOOL_MENU',
    'MAIN_MENU'
  ],
  // ITEM_CONTROLS included: clicking a node/connector should still open its
  // (now read-only) panel to inspect -- see ConnectorControls/NodeSettings/
  // etc., which each disable their own inputs when editorMode isn't EDITABLE.
  [EditorModeEnum.EXPLORABLE_READONLY]: ['ITEM_CONTROLS', 'ZOOM_CONTROLS'],
  // Keeps MAIN_MENU/TOOL_MENU (hamburger menu, undo/redo) visible, unlike
  // EXPLORABLE_READONLY -- this is a self-lock, not a public readonly link.
  [EditorModeEnum.LOCKED]: [
    'ITEM_CONTROLS',
    'ZOOM_CONTROLS',
    'TOOL_MENU',
    'MAIN_MENU'
  ],
  [EditorModeEnum.NON_INTERACTIVE]: []
};

const getEditorModeMapping = (editorMode: keyof typeof EditorModeEnum) => {
  const availableUiFeatures = EDITOR_MODE_MAPPING[editorMode];

  return availableUiFeatures;
};

export const UiOverlay = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const contextMenuAnchorRef = useRef<HTMLDivElement>(null);
  const toolMenuRef = useRef<HTMLDivElement>(null);
  const { appPadding } = theme.customVars;
  const spacing = useCallback(
    (multiplier: number) => {
      return parseInt(theme.spacing(multiplier), 10);
    },
    [theme]
  );
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const enableDebugTools = useUiStateStore((state) => {
    return state.enableDebugTools;
  });
  const mode = useUiStateStore((state) => {
    return state.mode;
  });
  const mouse = useUiStateStore((state) => {
    return state.mouse;
  });
  const dialog = useUiStateStore((state) => {
    return state.dialog;
  });
  const editorMode = useUiStateStore((state) => {
    return state.editorMode;
  });
  const availableTools = useMemo(() => {
    return getEditorModeMapping(editorMode);
  }, [editorMode]);
  const rendererEl = useUiStateStore((state) => {
    return state.rendererEl;
  });
  const iconPackManager = useUiStateStore((state) => {
    return state.iconPackManager;
  });
  const mcpManager = useUiStateStore((state) => {
    return state.mcpManager;
  });
  const contextMenu = useUiStateStore((state) => {
    return state.contextMenu;
  });
  const mainMenuPortalTarget = useUiStateStore((state) => {
    return state.mainMenuPortalTarget;
  });
  const historyControlsPortalTarget = useUiStateStore((state) => {
    return state.historyControlsPortalTarget;
  });
  const exportImageButtonPortalTarget = useUiStateStore((state) => {
    return state.exportImageButtonPortalTarget;
  });
  const settingsButtonPortalTarget = useUiStateStore((state) => {
    return state.settingsButtonPortalTarget;
  });
  const exportCompactJsonButtonPortalTarget = useUiStateStore((state) => {
    return state.exportCompactJsonButtonPortalTarget;
  });
  const layersButtonPortalTarget = useUiStateStore((state) => {
    return state.layersButtonPortalTarget;
  });
  const layersPanelOpen = useUiStateStore((state) => {
    return state.layersPanelOpen;
  });
  const toolbarPosition = useUiStateStore((state) => {
    return state.toolbarPosition;
  });
  // LEFT is a vertical toolbar meant for wide desktop viewports -- on a
  // narrow/tall mobile screen it collapses to a small icon cluster floating
  // in the middle of a mostly-empty column. Fall back to TOP without
  // touching the saved preference, so it's still LEFT next time on desktop.
  const effectiveToolbarPosition = isMobile ? 'TOP' : toolbarPosition;
  const itemControls = useUiStateStore((state) => {
    return state.itemControls;
  });

  // LayersPanel itself is only mounted while open, so it can't be the thing
  // that flips layersPanelOpen on -- that effect has to live somewhere always
  // mounted. This is the only trigger now that item selection no longer opens
  // a left-docked panel of its own.
  useEffect(() => {
    if (itemControls) {
      uiStateActions.setLayersPanelOpen(true);
    }
  }, [itemControls, uiStateActions]);

  // Same reason as above: entering a child view surfaces the Layers panel,
  // since its header is now the "back to parent view" control -- there's no
  // separate floating canvas overlay for it.
  const { currentView } = useScene();
  useEffect(() => {
    if (currentView.parentViewId) {
      uiStateActions.setLayersPanelOpen(true);
    }
  }, [currentView.id, currentView.parentViewId, uiStateActions]);
  const isFlat = useUiStateStore((state) => {
    return state.projectionMode === 'FLAT';
  });
  const { size: rendererSize } = useResizeObserver(rendererEl);

  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          width: 0,
          height: 0,
          top: 0,
          left: 0
        }}
      >
        {availableTools.includes('ITEM_CONTROLS') && !isMobile && (
          <Slide direction="left" in={layersPanelOpen} mountOnEnter unmountOnExit>
            <UiElement
              variant="docked"
              sx={{
                position: 'absolute',
                width: '360px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
              style={{
                left: rendererSize.width - 360,
                top: 0,
                height: rendererSize.height
              }}
            >
              <LayersPanel />
            </UiElement>
          </Slide>
        )}

        {/* Mobile: the 360px right-docked panel above can't shrink to fit a
            narrow viewport, so it becomes a bottom sheet instead. Swipe-to-open
            is disabled since the FAB below is the entry point and an edge-swipe
            listener would fight canvas panning; swipe-to-close on the open
            sheet still works. */}
        {availableTools.includes('ITEM_CONTROLS') && isMobile && (
          <SwipeableDrawer
            anchor="bottom"
            disableSwipeToOpen
            open={layersPanelOpen}
            onOpen={() => {
              uiStateActions.setLayersPanelOpen(true);
            }}
            onClose={() => {
              uiStateActions.setLayersPanelOpen(false);
            }}
            PaperProps={{
              sx: {
                height: '80vh',
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3
              }
            }}
          >
            <LayersPanel />
          </SwipeableDrawer>
        )}

        {availableTools.includes('TOOL_MENU') && effectiveToolbarPosition === 'LEFT' && (
          <Box
            ref={toolMenuRef}
            // Deliberately NOT "ff-tool-menu-anchor" -- isenax-app's App.css
            // force-centers that class at the top via `!important` (left:
            // 50vw), which would silently override this left-docked position.
            className="ff-tool-menu-anchor-left"
            sx={{
              position: 'absolute',
              transform: 'translateY(-50%)'
            }}
            style={{
              left: appPadding.x,
              top: rendererSize.height / 2
            }}
          >
            <Stack direction="column" spacing={1}>
              {!historyControlsPortalTarget && <HistoryControls />}
              <ToolMenu />
            </Stack>
          </Box>
        )}

        {availableTools.includes('TOOL_MENU') && effectiveToolbarPosition === 'TOP' && (
          <Box
            ref={toolMenuRef}
            className="ff-tool-menu-anchor"
            sx={{
              position: 'absolute',
              transform: 'translateX(-100%)'
            }}
            style={{
              left: rendererSize.width - appPadding.x,
              top: appPadding.y
            }}
          >
            <Stack direction="row" spacing={1}>
              {!historyControlsPortalTarget && <HistoryControls />}
              <ToolMenu />
            </Stack>
          </Box>
        )}

        {availableTools.includes('TOOL_MENU') &&
          historyControlsPortalTarget &&
          createPortal(<HistoryControls bare />, historyControlsPortalTarget)}

        {availableTools.includes('ZOOM_CONTROLS') && (
          <Box
            sx={{
              position: 'absolute',
              transformOrigin: 'bottom left'
            }}
            style={{
              top: rendererSize.height - appPadding.y * 2,
              left: appPadding.x
            }}
          >
            <ZoomControls />
          </Box>
        )}

        {availableTools.includes('MAIN_MENU') && !mainMenuPortalTarget && (
          <Box
            sx={{
              position: 'absolute'
            }}
            style={{
              top: appPadding.y,
              left: appPadding.x
            }}
          >
            <MainMenu />
          </Box>
        )}

        {availableTools.includes('MAIN_MENU') &&
          mainMenuPortalTarget &&
          createPortal(<MainMenu />, mainMenuPortalTarget)}

        {/* Unlike MainMenu/HistoryControls/HelpButton, these have no default
            floating position — MainMenu already covers the same actions from
            its dropdown, so they only render when a host app opts in with a
            portal target of its own. Skipped on mobile even if a target is
            given: MainMenu's own dropdown is the only entry point there, so a
            standalone icon would just duplicate it. */}
        {availableTools.includes('MAIN_MENU') &&
          !isMobile &&
          exportImageButtonPortalTarget &&
          createPortal(<ExportImageButton />, exportImageButtonPortalTarget)}

        {availableTools.includes('MAIN_MENU') &&
          !isMobile &&
          settingsButtonPortalTarget &&
          createPortal(<SettingsButton />, settingsButtonPortalTarget)}

        {availableTools.includes('MAIN_MENU') &&
          !isMobile &&
          exportCompactJsonButtonPortalTarget &&
          createPortal(<ExportCompactJsonButton />, exportCompactJsonButtonPortalTarget)}

        {/* Gated on ITEM_CONTROLS (not MAIN_MENU like its siblings above) so the
            toggle stays reachable in EXPLORABLE_READONLY too -- read-only viewers
            have no other way to reach item detail now that it lives in here
            instead of the old left-docked panel. */}
        {availableTools.includes('ITEM_CONTROLS') &&
          !isMobile &&
          layersButtonPortalTarget &&
          createPortal(<LayersButton />, layersButtonPortalTarget)}

        {/* Mobile has no toolbar icon for this (see App.tsx) -- a single
            floating button bottom-right of the canvas is the only entry point,
            instead of duplicating it in both the toolbar and here. */}
        {availableTools.includes('ITEM_CONTROLS') && isMobile && (
          <Box
            sx={{ position: 'absolute', transform: 'translateX(-100%)' }}
            style={{
              top: rendererSize.height - appPadding.y * 2,
              left: rendererSize.width - appPadding.x
            }}
          >
            <LayersButton />
          </Box>
        )}

        {enableDebugTools && (
          <UiElement
            sx={{
              position: 'absolute',
              width: 350,
              transform: 'translateY(-100%)'
            }}
            style={{
              maxWidth: `calc(${rendererSize.width} - ${appPadding.x * 2}px)`,
              left: appPadding.x,
              top: rendererSize.height - appPadding.y * 2 - spacing(1)
            }}
          >
            <DebugUtils />
          </UiElement>
        )}
      </Box>

      {mode.type === 'PLACE_ICON' && mode.id && (
        <SceneLayer disableAnimation>
          <DragAndDrop iconId={mode.id} tile={mouse.position.tile} />
        </SceneLayer>
      )}

      {dialog === DialogTypeEnum.EXPORT_IMAGE && (
        <ExportImageDialog
          onClose={() => {
            return uiStateActions.setDialog(null);
          }}
        />
      )}

      {dialog === DialogTypeEnum.HELP && <HelpDialog />}

      {dialog === DialogTypeEnum.SETTINGS && (
        <SettingsDialog
          iconPackManager={iconPackManager || undefined}
          mcpManager={mcpManager || undefined}
        />
      )}

      {/* Show hint tooltips only in editable mode */}
      {editorMode === EditorModeEnum.EDITABLE && (
        <HintStack
          showConnectorHint
          showLazyLoadingWelcome={Boolean(iconPackManager)}
        />
      )}
      {editorMode === EditorModeEnum.EDITABLE && <ConnectorEmptySpaceTooltip />}
      {editorMode === EditorModeEnum.EDITABLE && <ConnectorRerouteTooltip />}
      {editorMode === EditorModeEnum.EDITABLE && <LassoHintTooltip toolMenuRef={toolMenuRef} />}

      <SceneLayer>
        {contextMenu && (
          <Box 
            ref={contextMenuAnchorRef} 
            sx={{
              position: 'absolute',
              left: getTilePosition({ tile: contextMenu.tile, flat: isFlat }).x,
              top: getTilePosition({ tile: contextMenu.tile, flat: isFlat }).y
            }}
          />
        )}
        <ContextMenuManager anchorEl={contextMenu ? contextMenuAnchorRef.current : null} />
      </SceneLayer>
    </>
  );
};
