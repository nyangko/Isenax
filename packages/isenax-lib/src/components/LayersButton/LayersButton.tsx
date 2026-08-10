import React from 'react';
import { IconStack2 as LayersIcon } from '@tabler/icons-react';
import { UiElement } from 'src/components/UiElement/UiElement';
import { IconButton } from 'src/components/IconButton/IconButton';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useTranslation } from 'src/stores/localeStore';

export const LayersButton = () => {
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const layersPanelOpen = useUiStateStore((state) => {
    return state.layersPanelOpen;
  });
  const { t } = useTranslation('mainMenu');

  return (
    <UiElement>
      <IconButton
        name={t('layers')}
        Icon={<LayersIcon size={20} />}
        isActive={layersPanelOpen}
        onClick={() => {
          return uiStateActions.setLayersPanelOpen(!layersPanelOpen);
        }}
      />
    </UiElement>
  );
};
