import React, { useCallback } from 'react';
import { Stack, Divider } from '@mui/material';
import {
  IconArrowsMove as PanToolIcon,
  IconPointer2 as NearMeIcon,
  IconPlus as AddIcon,
  IconRoute as ConnectorIcon,
  IconShape as CropSquareIcon,
  IconTextSize as TitleIcon,
  IconSelectAll as LassoIcon,
  IconLassoPolygon as FreehandLassoIcon
} from '@tabler/icons-react';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { IconButton } from 'src/components/IconButton/IconButton';
import { UiElement } from 'src/components/UiElement/UiElement';
import { useScene } from 'src/hooks/useScene';
import { TEXTBOX_DEFAULTS } from 'src/config';
import { generateId } from 'src/utils';
import { HOTKEY_PROFILES } from 'src/config/hotkeys';
import { useTranslation } from 'src/stores/localeStore';

export const ToolMenu = () => {
  const { createTextBox } = useScene();
  const { t } = useTranslation();
  const mode = useUiStateStore((state) => {
    return state.mode;
  });
  const uiStateStoreActions = useUiStateStore((state) => {
    return state.actions;
  });
  const mousePosition = useUiStateStore((state) => {
    return state.mouse.position.tile;
  });
  const hotkeyProfile = useUiStateStore((state) => {
    return state.hotkeyProfile;
  });

  const toolbarPosition = useUiStateStore((state) => {
    return state.toolbarPosition;
  });

  const hotkeys = HOTKEY_PROFILES[hotkeyProfile];

  const createTextBoxProxy = useCallback(() => {
    const textBoxId = generateId();

    createTextBox({
      ...TEXTBOX_DEFAULTS,
      id: textBoxId,
      tile: mousePosition
    });

    uiStateStoreActions.setMode({
      type: 'TEXTBOX',
      showCursor: false,
      id: textBoxId
    });
  }, [uiStateStoreActions, createTextBox, mousePosition]);

  return (
    <UiElement>
      <Stack direction={toolbarPosition === 'LEFT' ? 'column' : 'row'} spacing={0.5} alignItems="center">
        {/* Main Tools */}
        <IconButton
          name={`${t('settings.hotkeys.toolSelect')}${hotkeys.select ? ` (${hotkeys.select.toUpperCase()})` : ''}`}
          Icon={<NearMeIcon size={20} />}
          onClick={() => {
            uiStateStoreActions.setMode({
              type: 'CURSOR',
              showCursor: true,
              mousedownItem: null
            });
          }}
          isActive={mode.type === 'CURSOR' || mode.type === 'DRAG_ITEMS'}
        />
        <IconButton
          name={`${t('settings.hotkeys.toolLasso')}${hotkeys.lasso ? ` (${hotkeys.lasso.toUpperCase()})` : ''}`}
          Icon={<LassoIcon size={20} />}
          onClick={() => {
            uiStateStoreActions.setMode({
              type: 'LASSO',
              showCursor: true,
              selection: null,
              isDragging: false
            });
          }}
          isActive={mode.type === 'LASSO'}
        />
        <IconButton
          name={`${t('settings.hotkeys.toolFreehandLasso')}${hotkeys.freehandLasso ? ` (${hotkeys.freehandLasso.toUpperCase()})` : ''}`}
          Icon={<FreehandLassoIcon size={20} />}
          onClick={() => {
            uiStateStoreActions.setMode({
              type: 'FREEHAND_LASSO',
              showCursor: true,
              path: [],
              selection: null,
              isDragging: false
            });
          }}
          isActive={mode.type === 'FREEHAND_LASSO'}
        />
        <IconButton
          name={`${t('settings.hotkeys.toolPan')}${hotkeys.pan ? ` (${hotkeys.pan.toUpperCase()})` : ''}`}
          Icon={<PanToolIcon size={20} />}
          onClick={() => {
            uiStateStoreActions.setMode({
              type: 'PAN',
              showCursor: false
            });

            uiStateStoreActions.setItemControls(null);
          }}
          isActive={mode.type === 'PAN'}
        />
        <IconButton
          name={`${t('settings.hotkeys.toolAddItem')}${hotkeys.addItem ? ` (${hotkeys.addItem.toUpperCase()})` : ''}`}
          Icon={<AddIcon size={20} />}
          onClick={() => {
            uiStateStoreActions.setItemControls({
              type: 'ADD_ITEM'
            });
            uiStateStoreActions.setMode({
              type: 'PLACE_ICON',
              showCursor: true,
              id: null
            });
          }}
          isActive={mode.type === 'PLACE_ICON'}
        />
        <IconButton
          name={`${t('settings.hotkeys.toolRectangle')}${hotkeys.rectangle ? ` (${hotkeys.rectangle.toUpperCase()})` : ''}`}
          Icon={<CropSquareIcon size={20} />}
          onClick={() => {
            uiStateStoreActions.setMode({
              type: 'RECTANGLE.DRAW',
              showCursor: true,
              id: null
            });
          }}
          isActive={mode.type === 'RECTANGLE.DRAW'}
        />
        <IconButton
          name={`${t('settings.hotkeys.toolConnector')}${hotkeys.connector ? ` (${hotkeys.connector.toUpperCase()})` : ''}`}
          Icon={<ConnectorIcon size={20} />}
          onClick={() => {
            uiStateStoreActions.setMode({
              type: 'CONNECTOR',
              id: null,
              showCursor: true
            });
          }}
          isActive={mode.type === 'CONNECTOR'}
        />
        <IconButton
          name={`${t('settings.hotkeys.toolText')}${hotkeys.text ? ` (${hotkeys.text.toUpperCase()})` : ''}`}
          Icon={<TitleIcon size={20} />}
          onClick={createTextBoxProxy}
          isActive={mode.type === 'TEXTBOX'}
        />
      </Stack>
    </UiElement>
  );
};
