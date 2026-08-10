import React from 'react';
import { IconSettings as SettingsIcon } from '@tabler/icons-react';
import { UiElement } from 'src/components/UiElement/UiElement';
import { IconButton } from 'src/components/IconButton/IconButton';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { DialogTypeEnum } from 'src/types/ui';
import { useTranslation } from 'src/stores/localeStore';

export const SettingsButton = () => {
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const { t } = useTranslation('mainMenu');

  return (
    <UiElement>
      <IconButton
        name={t('settings')}
        Icon={<SettingsIcon size={20} />}
        onClick={() => {
          return uiStateActions.setDialog(DialogTypeEnum.SETTINGS);
        }}
      />
    </UiElement>
  );
};
