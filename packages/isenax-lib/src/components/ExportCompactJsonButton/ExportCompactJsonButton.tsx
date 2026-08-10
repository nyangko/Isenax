import React from 'react';
import { IconFileZip as ExportCompactJsonIcon } from '@tabler/icons-react';
import { UiElement } from 'src/components/UiElement/UiElement';
import { IconButton } from 'src/components/IconButton/IconButton';
import { useModelStore } from 'src/stores/modelStore';
import { exportAsCompactJSON } from 'src/utils/exportOptions';
import { modelFromModelStore } from 'src/utils';
import { useTranslation } from 'src/stores/localeStore';

export const ExportCompactJsonButton = () => {
  const model = useModelStore((state) => {
    return modelFromModelStore(state);
  });
  const { t } = useTranslation('mainMenu');

  return (
    <UiElement>
      <IconButton
        name={t('exportCompactJson')}
        Icon={<ExportCompactJsonIcon size={20} />}
        onClick={() => {
          return exportAsCompactJSON(model);
        }}
      />
    </UiElement>
  );
};
