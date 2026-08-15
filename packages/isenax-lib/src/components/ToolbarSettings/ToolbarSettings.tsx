import React from 'react';
import {
  Box,
  Typography,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useTranslation } from 'src/stores/localeStore';
import { ToolbarPositionEnum } from 'src/types';

export const ToolbarSettings = () => {
  const toolbarPosition = useUiStateStore((state) => state.toolbarPosition);
  const setToolbarPosition = useUiStateStore((state) => state.actions.setToolbarPosition);
  const { t } = useTranslation();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('settings.toolbar.title')}
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t('settings.toolbar.position')}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {t('settings.toolbar.description')}
        </Typography>

        <RadioGroup
          value={toolbarPosition}
          onChange={(e) => {
            setToolbarPosition(e.target.value as keyof typeof ToolbarPositionEnum);
          }}
        >
          <FormControlLabel
            value={ToolbarPositionEnum.TOP}
            control={<Radio />}
            label={t('settings.toolbar.positionTop')}
          />
          <FormControlLabel
            value={ToolbarPositionEnum.LEFT}
            control={<Radio />}
            label={t('settings.toolbar.positionLeft')}
          />
        </RadioGroup>
      </Paper>
    </Box>
  );
};
