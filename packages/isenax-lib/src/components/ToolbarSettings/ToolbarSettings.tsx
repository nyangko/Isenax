import React from 'react';
import { Box, Typography, Paper, Radio, Stack } from '@mui/material';
import {
  IconPointer2,
  IconHandGrab,
  IconSquare,
  IconTextSize,
  IconPencil
} from '@tabler/icons-react';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useTranslation } from 'src/stores/localeStore';
import { ToolbarPositionEnum } from 'src/types';

const TOOL_ICONS = [IconPointer2, IconHandGrab, IconSquare, IconTextSize, IconPencil];

const ToolChip = ({ Icon }: { Icon: React.ComponentType<{ size?: number }> }) => (
  <Box
    sx={{
      width: 22,
      height: 22,
      borderRadius: 0.75,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.paper',
      border: 1,
      borderColor: 'divider'
    }}
  >
    <Icon size={13} />
  </Box>
);

const PositionCard = ({
  selected,
  onSelect,
  label,
  orientation
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  orientation: 'row' | 'column';
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
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
      <Radio checked={selected} size="small" sx={{ p: 0 }} />
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
    </Box>
    <Box
      sx={{
        display: 'flex',
        flexDirection: orientation === 'row' ? 'column' : 'row',
        gap: 0.75
      }}
    >
      <Stack direction={orientation} spacing={0.5} sx={{ alignSelf: orientation === 'row' ? 'center' : 'stretch' }}>
        {TOOL_ICONS.map((Icon, index) => (
          <ToolChip key={index} Icon={Icon} />
        ))}
      </Stack>
      <Box
        sx={{
          flex: 1,
          minHeight: 60,
          borderRadius: 1,
          bgcolor: 'action.hover',
          backgroundImage:
            'linear-gradient(45deg, rgba(128,128,128,0.15) 25%, transparent 25%), linear-gradient(-45deg, rgba(128,128,128,0.15) 25%, transparent 25%)',
          backgroundSize: '8px 8px'
        }}
      />
    </Box>
  </Box>
);

export const ToolbarSettings = () => {
  const toolbarPosition = useUiStateStore((state) => state.toolbarPosition);
  const setToolbarPosition = useUiStateStore((state) => state.actions.setToolbarPosition);
  const { t } = useTranslation();

  return (
    <Box>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {t('settings.toolbar.position')}
        </Typography>

        <Stack direction="row" spacing={1.5} sx={{ mt: 1.5 }}>
          <PositionCard
            selected={toolbarPosition === ToolbarPositionEnum.TOP}
            onSelect={() => setToolbarPosition(ToolbarPositionEnum.TOP)}
            label={t('settings.toolbar.positionTop')}
            orientation="row"
          />
          <PositionCard
            selected={toolbarPosition === ToolbarPositionEnum.LEFT}
            onSelect={() => setToolbarPosition(ToolbarPositionEnum.LEFT)}
            label={t('settings.toolbar.positionLeft')}
            orientation="column"
          />
        </Stack>
      </Paper>
    </Box>
  );
};
