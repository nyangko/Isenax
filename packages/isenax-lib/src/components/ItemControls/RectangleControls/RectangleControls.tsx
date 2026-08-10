import React, { useState } from 'react';
import { Box, IconButton as MUIIconButton, FormControlLabel, Switch, Typography } from '@mui/material';
import { useRectangle } from 'src/hooks/useRectangle';
import { ColorSelector } from 'src/components/ColorSelector/ColorSelector';
import { ColorPicker } from 'src/components/ColorSelector/ColorPicker';
import { CustomColorInput } from 'src/components/ColorSelector/CustomColorInput';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useScene } from 'src/hooks/useScene';
import { IconX as CloseIcon } from '@tabler/icons-react';
import { useTranslation } from 'src/stores/localeStore';
import { ControlsContainer } from '../components/ControlsContainer';
import { Section } from '../components/Section';
import { DeleteButton } from '../components/DeleteButton';

interface Props {
  id: string;
  embedded?: boolean;
}

export const RectangleControls = ({ id, embedded }: Props) => {
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const rectangle = useRectangle(id);
  const { updateRectangle, deleteRectangle } = useScene();
  const [useCustomColor, setUseCustomColor] = useState(!!rectangle?.customColor);
  const isReadOnly = useUiStateStore((state) => state.editorMode !== 'EDITABLE');
  const { t } = useTranslation();

  // If rectangle doesn't exist, return null
  if (!rectangle) {
    return null;
  }

  const content = (
      <Box sx={{ position: 'relative' }}>
        {/* Close button */}
        {!embedded && (
          <MUIIconButton
            aria-label={t('itemControls.close')}
            onClick={() => {
              return uiStateActions.setItemControls(null);
            }}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 2
            }}
            size="small"
          >
            <CloseIcon size={20} />
          </MUIIconButton>
        )}
        <Section title={t('itemControls.color')}>
          <FormControlLabel
            control={
              <Switch
                checked={useCustomColor}
                onChange={(e) => {
                  setUseCustomColor(e.target.checked);
                  if (!e.target.checked) {
                    updateRectangle(rectangle.id, { customColor: '' });
                  }
                }}
                disabled={isReadOnly}
              />
            }
            label={t('itemControls.useCustomColor')}
            sx={{ mb: 2 }}
          />
          {useCustomColor ? (
            <CustomColorInput
              value={rectangle.customColor || '#000000'}
              onChange={(color) => {
                updateRectangle(rectangle.id, { customColor: color });
              }}
              disabled={isReadOnly}
            />
          ) : (
            <ColorSelector
              onChange={(color) => {
                updateRectangle(rectangle.id, { color, customColor: '' });
              }}
              activeColor={rectangle.color}
              disabled={isReadOnly}
            />
          )}
        </Section>
        <Section>
          <Box>
            <DeleteButton
              onClick={() => {
                uiStateActions.setItemControls(null);
                deleteRectangle(rectangle.id);
              }}
            />
          </Box>
        </Section>
      </Box>
  );

  if (embedded) {
    return content;
  }

  return <ControlsContainer>{content}</ControlsContainer>;
};
