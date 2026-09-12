import React from 'react';
import { createPortal } from 'react-dom';
import {
  IconPlus as ZoomInIcon,
  IconMinus as ZoomOutIcon,
  IconMaximize as FitToScreenIcon,
  IconMap as MinimapIcon,
  IconHelpCircle as HelpIcon
} from '@tabler/icons-react';
import { Stack, Box, Typography, Divider } from '@mui/material';
import { toPx } from 'src/utils';
import { UiElement } from 'src/components/UiElement/UiElement';
import { IconButton } from 'src/components/IconButton/IconButton';
import { ProjectionToggle } from 'src/components/ProjectionToggle/ProjectionToggle';
import { MAX_ZOOM, MIN_ZOOM } from 'src/config';
import { HOTKEY_PROFILES } from 'src/config/hotkeys';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useDiagramUtils } from 'src/hooks/useDiagramUtils';
import { useMinimapAvailable } from 'src/components/Minimap/Minimap';
import { DialogTypeEnum } from 'src/types/ui';

export const ZoomControls = () => {
  const uiStateStoreActions = useUiStateStore((state) => {
    return state.actions;
  });
  const zoom = useUiStateStore((state) => {
    return state.zoom;
  });
  const helpButtonPortalTarget = useUiStateStore((state) => {
    return state.helpButtonPortalTarget;
  });
  const showMinimap = useUiStateStore((state) => {
    return state.showMinimap;
  });
  const minimapHotkey = useUiStateStore((state) => {
    return HOTKEY_PROFILES[state.hotkeyProfile].minimap;
  });
  const minimapAvailable = useMinimapAvailable();
  const { fitToView } = useDiagramUtils();

  const helpButton = (
    <UiElement>
      <IconButton
        name="Help (F1)"
        Icon={<HelpIcon size={20} />}
        onClick={() => {
          return uiStateStoreActions.setDialog(DialogTypeEnum.HELP);
        }}
      />
    </UiElement>
  );

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <UiElement>
        <Stack direction="row">
          <IconButton
            name="Zoom out"
            Icon={<ZoomOutIcon size={20} />}
            onClick={uiStateStoreActions.decrementZoom}
            disabled={zoom <= MIN_ZOOM}
          />
          <Divider orientation="vertical" flexItem />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minWidth: toPx(60)
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {Math.ceil(zoom * 100)}%
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <IconButton
            name="Zoom in"
            Icon={<ZoomInIcon size={20} />}
            onClick={uiStateStoreActions.incrementZoom}
            disabled={zoom >= MAX_ZOOM}
          />
        </Stack>
      </UiElement>
      <UiElement>
        <IconButton
          name="Fit to screen"
          Icon={<FitToScreenIcon size={20} />}
          onClick={fitToView}
        />
      </UiElement>
      {minimapAvailable && (
        <UiElement>
          <IconButton
            name={minimapHotkey ? `Minimap (${minimapHotkey.toUpperCase()})` : 'Minimap'}
            Icon={<MinimapIcon size={20} />}
            isActive={showMinimap}
            onClick={() => {
              return uiStateStoreActions.setShowMinimap(!showMinimap);
            }}
          />
        </UiElement>
      )}
      <ProjectionToggle />
      {!helpButtonPortalTarget && helpButton}
      {helpButtonPortalTarget && createPortal(helpButton, helpButtonPortalTarget)}
    </Stack>
  );
};
