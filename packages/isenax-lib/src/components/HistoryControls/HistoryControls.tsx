import React, { useCallback } from 'react';
import { Stack, useTheme, useMediaQuery } from '@mui/material';
import { IconArrowBackUp as UndoIcon, IconArrowForwardUp as RedoIcon } from '@tabler/icons-react';
import { IconButton } from 'src/components/IconButton/IconButton';
import { UiElement } from 'src/components/UiElement/UiElement';
import { useHistory } from 'src/hooks/useHistory';
import { useTranslation } from 'src/stores/localeStore';
import { useUiStateStore } from 'src/stores/uiStateStore';

interface Props {
  // A host app portaling this into its own toolbar (see
  // historyControlsPortalTarget) wants undo/redo as two independent buttons
  // matching its surrounding icons -- not grouped inside a shared floating
  // Card, which reads as one merged control even with the Card's own
  // background/border stripped via CSS. The default (grouped Card) is for
  // the un-portaled fallback, which floats over the canvas on its own.
  bare?: boolean;
}

export const HistoryControls = ({ bare = false }: Props) => {
  const { undo, redo, canUndo, canRedo } = useHistory();
  const { t } = useTranslation('mainMenu');
  const toolbarPosition = useUiStateStore((state) => {
    return state.toolbarPosition;
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const effectiveToolbarPosition = isMobile ? 'TOP' : toolbarPosition;

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);

  const buttons = (
    <>
      <IconButton
        name={`${t('undo')} (Ctrl+Z)`}
        Icon={<UndoIcon size={20} />}
        onClick={handleUndo}
        disabled={!canUndo}
      />
      <IconButton
        name={`${t('redo')} (Ctrl+Y)`}
        Icon={<RedoIcon size={20} />}
        onClick={handleRedo}
        disabled={!canRedo}
      />
    </>
  );

  if (bare) return buttons;

  return (
    <UiElement>
      <Stack direction={effectiveToolbarPosition === 'LEFT' ? 'column' : 'row'} spacing={0.5} alignItems="center">
        {buttons}
      </Stack>
    </UiElement>
  );
};
