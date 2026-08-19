import React from 'react';
import { Box, Switch, Typography, Paper, Stack } from '@mui/material';
import {
  IconPlus,
  IconPointer2,
  IconArrowRight,
  IconArrowUp,
  IconArrowLeft,
  IconHandFinger,
  IconArrowsDiagonal
} from '@tabler/icons-react';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useLocale } from 'src/stores/localeStore';

const GRID_BG = {
  backgroundImage:
    'radial-gradient(circle, rgba(128,128,128,0.35) 1px, transparent 1px)',
  backgroundSize: '10px 10px'
};

// Small before/after tile: a focal-point badge (the "+") sitting at some
// position, with a cursor arrow overlapping it -- `badgePos` moves the badge
// to show the cursor "pulling" the zoom focus toward itself.
const ZoomTile = ({
  badgeSize,
  badgePos
}: {
  badgeSize: number;
  badgePos: { top: string; left: string };
}) => (
  <Box
    sx={{
      position: 'relative',
      width: 88,
      height: 88,
      borderRadius: 1.5,
      border: 1,
      borderColor: 'divider',
      overflow: 'hidden',
      ...GRID_BG
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        top: badgePos.top,
        left: badgePos.left,
        transform: 'translate(-50%, -50%)',
        width: badgeSize,
        height: badgeSize,
        borderRadius: '50%',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <IconPlus size={Math.round(badgeSize * 0.55)} />
    </Box>
    <IconPointer2
      size={16}
      style={{
        position: 'absolute',
        top: `calc(${badgePos.top} + ${badgeSize / 2 - 2}px)`,
        left: `calc(${badgePos.left} + ${badgeSize / 2 - 2}px)`
      }}
    />
  </Box>
);

const GestureTile = ({
  illustration,
  header,
  footer
}: {
  illustration: React.ReactNode;
  header: string;
  footer?: string;
}) => (
  <Box sx={{ textAlign: 'center' }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
      {header}
    </Typography>
    <Box
      sx={{
        position: 'relative',
        width: 88,
        height: 88,
        borderRadius: 1.5,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'action.hover'
      }}
    >
      {illustration}
    </Box>
    {footer && (
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {footer}
      </Typography>
    )}
  </Box>
);

// Pan tile: an up/left/right arrow cluster (scroll direction) with a
// scrolling finger reaching up into it from below.
const PanGesture = () => (
  <>
    <IconArrowUp size={14} style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)' }} />
    <IconArrowLeft size={14} style={{ position: 'absolute', top: 24, left: 14 }} />
    <IconArrowRight
      size={14}
      style={{ position: 'absolute', top: 24, right: 14 }}
    />
    <IconHandFinger size={28} style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)' }} />
  </>
);

// Pinch tile: a diagonal expand arrow (zoom) with a finger touching its
// near end, mimicking a two-finger pinch-out gesture.
const PinchGesture = () => (
  <>
    <IconArrowsDiagonal size={22} style={{ position: 'absolute', top: 12, right: 12 }} />
    <IconHandFinger size={26} style={{ position: 'absolute', bottom: 10, left: 12 }} />
  </>
);

export const ZoomSettings = () => {
  const zoomSettings = useUiStateStore((state) => state.zoomSettings);
  const setZoomSettings = useUiStateStore((state) => state.actions.setZoomSettings);
  const locale = useLocale();

  const handleToggle = (setting: keyof typeof zoomSettings) => {
    setZoomSettings({
      ...zoomSettings,
      [setting]: !zoomSettings[setting]
    });
  };

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Switch
                checked={zoomSettings.zoomToCursor}
                onChange={() => handleToggle('zoomToCursor')}
              />
              <Typography variant="body1">{locale.settings.zoom.zoomToCursor}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {locale.settings.zoom.zoomToCursorDesc}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <ZoomTile badgeSize={22} badgePos={{ top: '55%', left: '55%' }} />
            <IconArrowRight size={18} color="var(--mui-palette-text-secondary, #999)" />
            <ZoomTile badgeSize={30} badgePos={{ top: '50%', left: '50%' }} />
          </Stack>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Switch
                checked={zoomSettings.trackpadMode}
                onChange={() => handleToggle('trackpadMode')}
              />
              <Typography variant="body1">{locale.settings.zoom.trackpadMode}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {locale.settings.zoom.trackpadModeDesc}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <GestureTile
              illustration={<PanGesture />}
              header={locale.settings.zoom.whenEnabled}
              footer={locale.settings.zoom.scrollToPan}
            />
            <GestureTile
              illustration={<PinchGesture />}
              header={locale.settings.zoom.gestureZoom}
            />
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};
