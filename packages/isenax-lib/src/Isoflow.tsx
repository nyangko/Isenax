import React, { useEffect, useLayoutEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Box } from '@mui/material';
import { theme } from 'src/styles/theme';
import { IsoflowProps } from 'src/types';
import { setWindowCursor } from 'src/utils';
import { useModelStore, ModelProvider, useModelStoreApi } from 'src/stores/modelStore';
import { SceneProvider } from 'src/stores/sceneStore';
import { LocaleProvider } from 'src/stores/localeStore';
import { GlobalStyles } from 'src/styles/GlobalStyles';
import { Renderer } from 'src/components/Renderer/Renderer';
import { UiOverlay } from 'src/components/UiOverlay/UiOverlay';
import { UiStateProvider, useUiStateStore } from 'src/stores/uiStateStore';
import { INITIAL_DATA, MAIN_MENU_OPTIONS } from 'src/config';
import { useInitialDataManager } from 'src/hooks/useInitialDataManager';
import enUS from 'src/i18n/en-US';

const App = ({
  initialData,
  mainMenuOptions = MAIN_MENU_OPTIONS,
  width = '100%',
  height = '100%',
  onModelUpdated,
  enableDebugTools = false,
  editorMode = 'EDITABLE',
  projectionMode,
  renderer,
  locale = enUS,
  iconPackManager,
  mainMenuPortalTarget,
  historyControlsPortalTarget,
  helpButtonPortalTarget,
  exportImageButtonPortalTarget,
  settingsButtonPortalTarget,
  exportCompactJsonButtonPortalTarget,
  layersButtonPortalTarget,
}: IsoflowProps) => {
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const initialDataManager = useInitialDataManager();
  const modelStoreApi = useModelStoreApi();

  const { load } = initialDataManager;

  useEffect(() => {
    load({ ...INITIAL_DATA, ...initialData });
  }, [initialData, load]);

  useEffect(() => {
    uiStateActions.setEditorMode(editorMode);
    uiStateActions.setMainMenuOptions(mainMenuOptions);
  }, [editorMode, uiStateActions, mainMenuOptions]);

  // Uncontrolled unless the host app passes an explicit value — otherwise the
  // built-in toggle button drives this and a sync effect here would fight it.
  useEffect(() => {
    if (projectionMode !== undefined) {
      uiStateActions.setProjectionMode(projectionMode);
    }
  }, [projectionMode, uiStateActions]);

  useEffect(() => {
    return () => {
      setWindowCursor('default');
    };
  }, []);

  useEffect(() => {
    if (!initialDataManager.isReady || !onModelUpdated) return;
    const model = modelStoreApi.getState()
    onModelUpdated(model);
  }, [modelStoreApi.getState(), initialDataManager.isReady, onModelUpdated]);

  useEffect(() => {
    uiStateActions.setEnableDebugTools(enableDebugTools);
  }, [enableDebugTools, uiStateActions]);

  useEffect(() => {
    uiStateActions.setMainMenuPortalTarget(mainMenuPortalTarget ?? null);
  }, [mainMenuPortalTarget, uiStateActions]);

  useEffect(() => {
    uiStateActions.setHistoryControlsPortalTarget(historyControlsPortalTarget ?? null);
  }, [historyControlsPortalTarget, uiStateActions]);

  useEffect(() => {
    uiStateActions.setHelpButtonPortalTarget(helpButtonPortalTarget ?? null);
  }, [helpButtonPortalTarget, uiStateActions]);

  useEffect(() => {
    uiStateActions.setExportImageButtonPortalTarget(exportImageButtonPortalTarget ?? null);
  }, [exportImageButtonPortalTarget, uiStateActions]);

  useEffect(() => {
    uiStateActions.setSettingsButtonPortalTarget(settingsButtonPortalTarget ?? null);
  }, [settingsButtonPortalTarget, uiStateActions]);

  useEffect(() => {
    uiStateActions.setExportCompactJsonButtonPortalTarget(exportCompactJsonButtonPortalTarget ?? null);
  }, [exportCompactJsonButtonPortalTarget, uiStateActions]);

  useEffect(() => {
    uiStateActions.setLayersButtonPortalTarget(layersButtonPortalTarget ?? null);
  }, [layersButtonPortalTarget, uiStateActions]);

  useEffect(() => {
    if (renderer?.expandLabels !== undefined) {
      uiStateActions.setExpandLabels(renderer.expandLabels);
    }
  }, [renderer?.expandLabels, uiStateActions]);

  // Use useLayoutEffect to set iconPackManager synchronously before paint
  // This prevents a race condition where the Settings dialog could open
  // before iconPackManager is set in the store (causing the Icon Pack tab to be hidden)
  useLayoutEffect(() => {
    uiStateActions.setIconPackManager(iconPackManager || null);
  }, [iconPackManager, uiStateActions]);

  if (!initialDataManager.isReady) return null;

  return (
    <>
      <GlobalStyles />
      <Box
        sx={{
          width,
          height,
          position: 'relative',
          overflow: 'hidden',
          transform: 'translateZ(0)'
        }}
      >
        <Renderer {...renderer} />
        <UiOverlay />
      </Box>
    </>
  );
};

export const Isoflow = (props: IsoflowProps) => {
  return (
    <ThemeProvider theme={theme}>
      <LocaleProvider locale={props.locale || enUS}>
        <ModelProvider>
          <SceneProvider>
            <UiStateProvider>
              <App {...props} />
            </UiStateProvider>
          </SceneProvider>
        </ModelProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
};

const useIsoflow = () => {
  const rendererEl = useUiStateStore((state) => {
    return state.rendererEl;
  });

  const ModelActions = useModelStore((state) => {
    return state.actions;
  });

  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });

  return {
    Model: ModelActions,
    uiState: uiStateActions,
    rendererEl
  };
};

export { useIsoflow };
export * from 'src/standaloneExports';
export default Isoflow;
