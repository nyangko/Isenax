import React from 'react';
import { Box, Paper, Switch, Typography, Button, Alert } from '@mui/material';
import { IconPlayerPlay as RunIcon } from '@tabler/icons-react';
import { useTranslation } from 'src/stores/localeStore';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useScene } from 'src/hooks/useScene';

// A skill is just an id + a run function operating on the current view via
// useScene(). One entry today (auto-arrange) — extract a registry/interface
// when a second one actually needs it, not before.
const AUTO_ARRANGE_SKILL_ID = 'auto-arrange';

// ponytail: each moved item is its own undo step (useScene#updateViewItem
// pushes history per call) rather than one combined step. Batch into a
// single history entry if auto-arrange needs a one-shot undo later.
const runAutoArrange = (
  items: Array<{ id: string; tile: { x: number; y: number } }>,
  updateViewItem: (id: string, updates: { tile: { x: number; y: number } }) => void
) => {
  const spacing = 2;
  const cols = Math.max(1, Math.ceil(Math.sqrt(items.length)));

  items.forEach((item, index) => {
    const tile = {
      x: (index % cols) * spacing,
      y: Math.floor(index / cols) * spacing
    };
    updateViewItem(item.id, { tile });
  });
};

export const SkillsSettings: React.FC = () => {
  const { t } = useTranslation();
  const enabledSkills = useUiStateStore((state) => state.enabledSkills);
  const setEnabledSkills = useUiStateStore((state) => state.actions.setEnabledSkills);
  const currentViewId = useUiStateStore((state) => state.view);
  const { items, updateViewItem } = useScene();

  const isAutoArrangeEnabled = enabledSkills.includes(AUTO_ARRANGE_SKILL_ID);

  const handleToggle = (checked: boolean) => {
    setEnabledSkills(
      checked
        ? [...enabledSkills, AUTO_ARRANGE_SKILL_ID]
        : enabledSkills.filter((id) => id !== AUTO_ARRANGE_SKILL_ID)
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('settings.skills.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {t('settings.skills.description')}
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {t('settings.skills.autoArrangeName')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings.skills.autoArrangeDescription')}
            </Typography>
          </Box>
          <Switch checked={isAutoArrangeEnabled} onChange={(e) => handleToggle(e.target.checked)} color="primary" />
        </Box>

        {isAutoArrangeEnabled && (
          <Box sx={{ mt: 2 }}>
            {currentViewId ? (
              <Button
                variant="outlined"
                size="small"
                startIcon={<RunIcon size={16} />}
                onClick={() => runAutoArrange(items, updateViewItem)}
                disabled={items.length === 0}
              >
                {t('settings.skills.run')}
              </Button>
            ) : (
              <Alert severity="info">{t('settings.skills.noView')}</Alert>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};
