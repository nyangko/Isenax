import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Box, Stack, Button, Chip, Typography, Divider, IconButton as MUIIconButton } from '@mui/material';
import {
  IconChevronRight as ChevronRightIcon,
  IconChevronLeft as ChevronLeftIcon,
  IconCopyPlus as DuplicateIcon,
  IconX as CloseIcon,
  IconArrowDown as InputIcon,
  IconArrowUp as OutputIcon
} from '@tabler/icons-react';
import { useIconCategories } from 'src/hooks/useIconCategories';
import { useIcon } from 'src/hooks/useIcon';
import { useScene } from 'src/hooks/useScene';
import { useViewItem } from 'src/hooks/useViewItem';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useModelStore } from 'src/stores/modelStore';
import { useModelItem } from 'src/hooks/useModelItem';
import { useTranslation } from 'src/stores/localeStore';
import { getItemById, isWithinBounds } from 'src/utils';
import { zoneBounds, zoneBoundsForLabels } from 'src/components/LayersPanel/LayersPanel';
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
  const modelItems = useModelStore((state) => state.items);
  const { t } = useTranslation();

  const connectorCount = useMemo(() => {
    return scene.connectors.filter((connector) =>
      connector.anchors.some((anchor) => anchor.ref?.item === id)
    ).length;
  }, [scene.connectors, id]);

  // Smaller zones claim first, same tie-break LayersPanel uses for its own
  // zone grouping, so a nested zone's name wins over its containing one.
  const zoneName = useMemo(() => {
    const containingZones = scene.rectangles
      .filter((rectangle) => viewItem && isWithinBounds(viewItem.tile, zoneBounds(rectangle)))
      .sort((a, b) => {
        const area = (r: typeof a) => Math.abs(r.to.x - r.from.x) * Math.abs(r.to.y - r.from.y);
        return area(a) - area(b);
      });
    const zone = containingZones[0];
    if (!zone) return null;

    const labelTextBox = scene.textBoxes.find((textBox) =>
      isWithinBounds(textBox.tile, zoneBoundsForLabels(zone))
    );
    return labelTextBox?.content || null;
  }, [scene.rectangles, scene.textBoxes, viewItem]);

  // A connector's first anchor is its source (this node's output) and its
  // last anchor the target (this node's input) -- same start->end convention
  // the arrowhead direction already follows (getConnectorDirectionIcon).
  const connections = useMemo(() => {
    const inputs: string[] = [];
    const outputs: string[] = [];

    scene.connectors.forEach((connector) => {
      if (connector.anchors.length < 2) return;
      const first = connector.anchors[0];
      const last = connector.anchors[connector.anchors.length - 1];

      if (first.ref?.item === id && last.ref?.item) {
        const name = getItemById(modelItems, last.ref.item)?.value.name;
        if (name) outputs.push(name);
      }
      if (last.ref?.item === id && first.ref?.item) {
        const name = getItemById(modelItems, first.ref.item)?.value.name;
        if (name) inputs.push(name);
      }
    });

    return { inputs, outputs };
  }, [scene.connectors, modelItems, id]);

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
          {mode === 'CHANGE_ICON' ? (
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}
            >
              <Box component="img" src={icon.url} sx={{ width: 48, height: 48, flexShrink: 0 }} />
              <Button
                startIcon={<ChevronLeftIcon size={16} />}
                onClick={() => onSwitchMode('SETTINGS')}
                variant="text"
                size="small"
              >
                {t('itemControls.node.backToSettings')}
              </Button>
            </Stack>
          ) : (
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box component="img" src={icon.url} sx={{ width: 56, height: 56, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={600} noWrap>
                    {modelItem.name || t('itemControls.node.untitled')}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                        flexShrink: 0
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {t('itemControls.node.selectedBadge')}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                {zoneName && <Chip size="small" label={zoneName} />}
                <Chip
                  size="small"
                  label={`${t('itemControls.node.connectionsChip')} ${connectorCount}`}
                />
                <Chip size="small" label={t('itemControls.node.typeNode')} />
              </Stack>
              <Button
                fullWidth
                variant="contained"
                startIcon={<ChevronRightIcon size={16} />}
                onClick={() => onSwitchMode('CHANGE_ICON')}
                disabled={isReadOnly}
                sx={{ mt: 1.5 }}
              >
                {t('itemControls.node.updateIcon')}
              </Button>
            </Box>
          )}
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
      {mode === 'SETTINGS' && (connections.inputs.length > 0 || connections.outputs.length > 0) && (
        <>
          <Divider sx={{ mx: 3, mt: 2 }} />
          <Section sx={{ pb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {t('itemControls.node.connectionSummary')}
            </Typography>
          </Section>
          <Section sx={{ pt: 0 }}>
            <Stack direction="row" spacing={1.5}>
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 1.5
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                  <InputIcon size={14} color="#1976d2" />
                  <Typography variant="caption" fontWeight={600}>
                    {t('itemControls.node.connectionInput')} {connections.inputs.length}
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  {connections.inputs.map((name, index) => (
                    <Typography key={`${name}-${index}`} variant="body2" noWrap>
                      {name}
                    </Typography>
                  ))}
                </Stack>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 1.5
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                  <OutputIcon size={14} color="#1976d2" />
                  <Typography variant="caption" fontWeight={600}>
                    {t('itemControls.node.connectionOutput')} {connections.outputs.length}
                  </Typography>
                </Stack>
                <Stack spacing={0.5}>
                  {connections.outputs.map((name, index) => (
                    <Typography key={`${name}-${index}`} variant="body2" noWrap>
                      {name}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Section>
        </>
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
