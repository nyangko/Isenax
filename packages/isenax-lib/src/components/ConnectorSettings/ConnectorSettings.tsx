import React from 'react';
import {
  Box,
  FormControlLabel,
  Radio,
  Switch,
  Slider,
  Typography,
  Paper,
  Stack
} from '@mui/material';
import { IconCube, IconArrowRight, IconPointer2 } from '@tabler/icons-react';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useTranslation } from 'src/stores/localeStore';

const ModeCard = ({
  selected,
  onSelect,
  title,
  description,
  illustration
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  illustration: React.ReactNode;
}) => (
  <Box
    onClick={onSelect}
    sx={{
      flex: 1,
      border: 1,
      borderColor: selected ? 'primary.main' : 'divider',
      borderRadius: 2,
      p: 1.5,
      cursor: 'pointer',
      bgcolor: selected ? 'action.selected' : 'transparent'
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
      <Radio checked={selected} size="small" sx={{ p: 0, mt: '2px' }} />
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </Box>
    <Box
      sx={{
        mt: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        py: 1.5,
        borderRadius: 1,
        bgcolor: 'action.hover'
      }}
    >
      {illustration}
    </Box>
  </Box>
);

export const ConnectorSettings = () => {
  const connectorInteractionMode = useUiStateStore((state) => state.connectorInteractionMode);
  const setConnectorInteractionMode = useUiStateStore((state) => state.actions.setConnectorInteractionMode);
  const connectorAnimationEnabled = useUiStateStore((state) => state.connectorAnimationEnabled);
  const setConnectorAnimationEnabled = useUiStateStore((state) => state.actions.setConnectorAnimationEnabled);
  const connectorAnimationSpeed = useUiStateStore((state) => state.connectorAnimationSpeed);
  const setConnectorAnimationSpeed = useUiStateStore((state) => state.actions.setConnectorAnimationSpeed);
  const { t } = useTranslation();

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
          {t('settings.connector.connectionMode')}
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <ModeCard
            selected={connectorInteractionMode === 'click'}
            onSelect={() => setConnectorInteractionMode('click')}
            title={t('settings.connector.clickMode')}
            description={t('settings.connector.clickModeDesc')}
            illustration={
              <>
                <IconCube size={20} />
                <Box sx={{ width: 28, height: 2, bgcolor: 'primary.main' }} />
                <IconArrowRight size={14} color="var(--mui-palette-primary-main, #1976d2)" />
                <Box sx={{ width: 28, height: 2, bgcolor: 'primary.main' }} />
                <IconCube size={20} />
              </>
            }
          />
          <ModeCard
            selected={connectorInteractionMode === 'drag'}
            onSelect={() => setConnectorInteractionMode('drag')}
            title={t('settings.connector.dragMode')}
            description={t('settings.connector.dragModeDesc')}
            illustration={
              <>
                <IconCube size={20} />
                <Box
                  sx={{
                    width: 40,
                    height: 0,
                    borderTop: '2px dashed',
                    borderColor: 'primary.main'
                  }}
                />
                <Box sx={{ position: 'relative' }}>
                  <IconCube size={20} />
                  <IconPointer2
                    size={13}
                    style={{ position: 'absolute', bottom: -6, right: -6 }}
                  />
                </Box>
              </>
            }
          />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={connectorAnimationEnabled}
              onChange={(event) => {
                return setConnectorAnimationEnabled(event.target.checked);
              }}
            />
          }
          label={
            <Box>
              <Typography variant="body1">{t('settings.connector.animation')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('settings.connector.animationDesc')}
              </Typography>
            </Box>
          }
        />
        {connectorAnimationEnabled && (
          <Box sx={{ mt: 2, px: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {`${t('settings.connector.animationSpeed')} (${connectorAnimationSpeed})`}
            </Typography>
            <Slider
              min={50}
              max={500}
              step={10}
              value={connectorAnimationSpeed}
              valueLabelDisplay="auto"
              onChange={(event, newSpeed) => {
                setConnectorAnimationSpeed(newSpeed as number);
              }}
            />
          </Box>
        )}
      </Paper>

      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 1,
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5
        }}
      >
        <IconCube size={28} />
        <Box sx={{ position: 'relative', width: 96, height: 2 }}>
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'primary.main', opacity: 0.35 }} />
          {connectorAnimationEnabled && (
            <Box
              sx={{
                position: 'absolute',
                top: -2.5,
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                animation: `isenax-connector-flow ${Math.max(0.4, connectorAnimationSpeed / 250)}s linear infinite`,
                '@keyframes isenax-connector-flow': {
                  '0%': { left: 0 },
                  '100%': { left: 'calc(100% - 6px)' }
                }
              }}
            />
          )}
        </Box>
        <IconCube size={28} />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('settings.connector.note')}
      </Typography>
    </Box>
  );
};
