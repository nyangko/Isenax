import React, { useState, useCallback, useEffect } from 'react';
import { Box, Stack, Button, Typography, Divider, IconButton as MUIIconButton } from '@mui/material';
import {
  IconChevronRight as ChevronRightIcon,
  IconChevronLeft as ChevronLeftIcon,
  IconCopyPlus as DuplicateIcon,
  IconX as CloseIcon
} from '@tabler/icons-react';
import { useIconCategories } from 'src/hooks/useIconCategories';
import { useIcon } from 'src/hooks/useIcon';
import { useScene } from 'src/hooks/useScene';
import { useViewItem } from 'src/hooks/useViewItem';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useModelItem } from 'src/hooks/useModelItem';
import { useTranslation } from 'src/stores/localeStore';
import { ControlsContainer } from '../components/ControlsContainer';
import { DeleteButton } from '../components/DeleteButton';
import { Icons } from '../IconSelectionControls/Icons';
import { NodeSettings } from './NodeSettings/NodeSettings';
import { Section } from '../components/Section';
import { QuickIconSelector } from './QuickIconSelector';

interface Props {
  id: string;
  embedded?: boolean;
}

const ModeOptions = {
  SETTINGS: 'SETTINGS',
  CHANGE_ICON: 'CHANGE_ICON'
} as const;

type Mode = keyof typeof ModeOptions;

export const NodeControls = ({ id, embedded }: Props) => {
  const [mode, setMode] = useState<Mode>('SETTINGS');
  const scene = useScene();
  const { updateModelItem, updateViewItem, deleteViewItem, duplicateItem } = scene;
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const isReadOnly = useUiStateStore((state) => state.editorMode !== 'EDITABLE');
  const viewItem = useViewItem(id);
  const modelItem = useModelItem(id);
  const { iconCategories } = useIconCategories();
  const { icon } = useIcon(modelItem?.icon || '');
  const { t } = useTranslation();

  const onSwitchMode = useCallback((newMode: Mode) => {
    setMode(newMode);
  }, []);

  // Listen for quick icon change event (triggered by 'i' hotkey)
  useEffect(() => {
    const handleQuickIconChange = () => {
      setMode('CHANGE_ICON');
    };

    window.addEventListener('quickIconChange', handleQuickIconChange);
    return () => {
      window.removeEventListener('quickIconChange', handleQuickIconChange);
    };
  }, []);

  // If items don't exist, return null (component will unmount)
  if (!viewItem || !modelItem) {
    return null;
  }

  return (
    <ControlsContainer
      footer={
        <Stack direction="row" spacing={1}>
          <DeleteButton
            onClick={() => {
              uiStateActions.setItemControls(null);
              deleteViewItem(viewItem.id);
            }}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<DuplicateIcon size={20} />}
            onClick={() => {
              duplicateItem({ type: 'ITEM', id: viewItem.id }, scene);
            }}
            disabled={isReadOnly}
          >
            {t('common.duplicate')}
          </Button>
        </Stack>
      }
    >
      <Box
        sx={{
          bgcolor: (theme) => {
            return theme.customVars.customPalette.diagramBg;
          },
          position: 'relative'
        }}
      >
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
        {!embedded && mode === 'SETTINGS' && (
          <>
            <Section sx={{ pb: 2 }}>
              <Typography variant="h6">
                {t('itemControls.node.editLabelTitle')}
              </Typography>
            </Section>
            <Divider />
          </>
        )}
        <Section sx={{ py: 2 }}>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            justifyContent="space-between"
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 1.5
            }}
          >
            <Box
              component="img"
              src={icon.url}
              sx={{ width: 48, height: 48, flexShrink: 0 }}
            />
            {mode === 'SETTINGS' && (
              <>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {t('itemControls.node.iconLabel')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('itemControls.node.iconChangeDescription')}
                  </Typography>
                </Box>
                <Button
                  endIcon={<ChevronRightIcon size={16} />}
                  onClick={() => {
                    onSwitchMode('CHANGE_ICON');
                  }}
                  variant="text"
                  size="small"
                  disabled={isReadOnly}
                >
                  {t('itemControls.node.updateIcon')}
                </Button>
              </>
            )}
            {mode === 'CHANGE_ICON' && (
              <Button
                startIcon={<ChevronLeftIcon size={16} />}
                onClick={() => {
                  onSwitchMode('SETTINGS');
                }}
                variant="text"
                size="small"
              >
                {t('itemControls.node.backToSettings')}
              </Button>
            )}
          </Stack>
        </Section>
      </Box>
      {mode === 'SETTINGS' && (
        <NodeSettings
          key={viewItem.id}
          node={viewItem}
          onModelItemUpdated={(updates) => {
            updateModelItem(viewItem.id, updates);
          }}
          onViewItemUpdated={(updates) => {
            updateViewItem(viewItem.id, updates);
          }}
        />
      )}
      {mode === 'CHANGE_ICON' && (
        <QuickIconSelector
          currentIconId={modelItem.icon}
          onIconSelected={(_icon) => {
            updateModelItem(viewItem.id, { icon: _icon.id });
          }}
          onClose={() => {
            onSwitchMode('SETTINGS');
          }}
        />
      )}
    </ControlsContainer>
  );
};
