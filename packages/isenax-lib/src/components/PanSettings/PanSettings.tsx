import React from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Slider,
  Paper,
  Divider
} from '@mui/material';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useTranslation } from 'src/stores/localeStore';

const ToggleRow = ({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) => (
  <FormControlLabel
    sx={{ alignItems: 'flex-start', m: 0 }}
    control={<Switch checked={checked} onChange={onChange} sx={{ mt: -0.5 }} />}
    label={
      <Typography variant="body2" sx={{ ml: 0.5 }}>
        {label}
      </Typography>
    }
  />
);

export const PanSettings = () => {
  const panSettings = useUiStateStore((state) => state.panSettings);
  const setPanSettings = useUiStateStore((state) => state.actions.setPanSettings);
  const { t } = useTranslation();

  const handleToggle = (setting: keyof typeof panSettings) => {
    if (typeof panSettings[setting] === 'boolean') {
      setPanSettings({
        ...panSettings,
        [setting]: !panSettings[setting]
      });
    }
  };

  const handleSpeedChange = (value: number) => {
    setPanSettings({
      ...panSettings,
      keyboardPanSpeed: value
    });
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t('settings.pan.mousePanOptions')}
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            columnGap: 3,
            rowGap: 1.5,
            mt: 1
          }}
        >
          <ToggleRow
            checked={panSettings.emptyAreaClickPan}
            onChange={() => handleToggle('emptyAreaClickPan')}
            label={t('settings.pan.emptyAreaClickPan')}
          />
          <ToggleRow
            checked={panSettings.holdToPan}
            onChange={() => handleToggle('holdToPan')}
            label={t('settings.pan.holdToPan')}
          />
          <ToggleRow
            checked={panSettings.middleClickPan}
            onChange={() => handleToggle('middleClickPan')}
            label={t('settings.pan.middleClickPan')}
          />
          <ToggleRow
            checked={panSettings.rightClickPan}
            onChange={() => handleToggle('rightClickPan')}
            label={t('settings.pan.rightClickPan')}
          />
          <ToggleRow
            checked={panSettings.ctrlClickPan}
            onChange={() => handleToggle('ctrlClickPan')}
            label={t('settings.pan.ctrlClickPan')}
          />
          <ToggleRow
            checked={panSettings.altClickPan}
            onChange={() => handleToggle('altClickPan')}
            label={t('settings.pan.altClickPan')}
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t('settings.pan.keyboardPanOptions')}
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
            columnGap: 3,
            rowGap: 1.5,
            mt: 1
          }}
        >
          <ToggleRow
            checked={panSettings.arrowKeysPan}
            onChange={() => handleToggle('arrowKeysPan')}
            label={t('settings.pan.arrowKeys')}
          />
          <ToggleRow
            checked={panSettings.wasdPan}
            onChange={() => handleToggle('wasdPan')}
            label={t('settings.pan.wasdKeys')}
          />
          <ToggleRow
            checked={panSettings.ijklPan}
            onChange={() => handleToggle('ijklPan')}
            label={t('settings.pan.ijklKeys')}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          {t('settings.pan.keyboardPanSpeed')}
        </Typography>

        <Box sx={{ px: 0.5 }}>
          <Slider
            value={panSettings.keyboardPanSpeed}
            onChange={(_, value) => handleSpeedChange(value as number)}
            min={5}
            max={50}
            step={5}
            valueLabelDisplay="auto"
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -1 }}>
            <Typography variant="caption" color="text.secondary">
              {t('settings.pan.speedSlow')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('settings.pan.speedFast')}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        {t('settings.pan.note')}
      </Typography>
    </Box>
  );
};
