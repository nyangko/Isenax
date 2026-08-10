import React from 'react';
import { ProjectionOrientationEnum } from 'src/types';
import {
  Box,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  IconButton as MUIIconButton
} from '@mui/material';
import { IconTextSize as TextRotationNoneIcon, IconX as CloseIcon } from '@tabler/icons-react';
import { useTextBox } from 'src/hooks/useTextBox';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { getIsoProjectionCss } from 'src/utils';
import { useScene } from 'src/hooks/useScene';
import { useTranslation } from 'src/stores/localeStore';
import { ControlsContainer } from '../components/ControlsContainer';
import { Section } from '../components/Section';
import { DeleteButton } from '../components/DeleteButton';

interface Props {
  id: string;
  embedded?: boolean;
}

export const TextBoxControls = ({ id, embedded }: Props) => {
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const textBox = useTextBox(id);
  const { updateTextBox, deleteTextBox } = useScene();
  const isReadOnly = useUiStateStore((state) => state.editorMode !== 'EDITABLE');
  const { t } = useTranslation();

  // If textBox doesn't exist, return null
  if (!textBox) {
    return null;
  }

  const content = (
      <Box sx={{ position: 'relative', paddingTop: embedded ? 0 : '24px' }}>
        {/* Close button */}
        {!embedded && (
          <MUIIconButton
            aria-label={t('textBoxControls.close')}
            onClick={() => {
              return uiStateActions.setItemControls(null);
            }}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 2
            }}
            size="small"
          >
            <CloseIcon size={20} />
          </MUIIconButton>
        )}
        <Section title={t('textBoxControls.enterText')}>
          <TextField
            value={textBox.content}
            onChange={(e) => {
              updateTextBox(textBox.id, { content: e.target.value as string });
            }}
            disabled={isReadOnly}
          />
        </Section>
        <Section title={t('textBoxControls.textSize')}>
          <Slider
            marks
            step={0.3}
            min={0.3}
            max={0.9}
            value={textBox.fontSize}
            onChange={(e, newSize) => {
              updateTextBox(textBox.id, { fontSize: newSize as number });
            }}
            disabled={isReadOnly}
          />
        </Section>
        <Section title={t('textBoxControls.alignment')}>
          <ToggleButtonGroup
            value={textBox.orientation}
            exclusive
            onChange={(e, orientation) => {
              if (textBox.orientation === orientation || orientation === null)
                return;

              updateTextBox(textBox.id, { orientation });
            }}
            disabled={isReadOnly}
          >
            <ToggleButton value={ProjectionOrientationEnum.X}>
              <TextRotationNoneIcon size={20} style={{ transform: getIsoProjectionCss() }} />
            </ToggleButton>
            <ToggleButton value={ProjectionOrientationEnum.Y}>
              <TextRotationNoneIcon
                style={{
                  transform: `scale(-1, 1) ${getIsoProjectionCss()} scale(-1, 1)`
                }}
              />
            </ToggleButton>
          </ToggleButtonGroup>
        </Section>
        <Section>
          <Box>
            <DeleteButton
              onClick={() => {
                uiStateActions.setItemControls(null);
                deleteTextBox(textBox.id);
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
