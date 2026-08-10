import React, { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  Box,
  Chip,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton as MUIIconButton,
  Switch,
  Collapse
} from '@mui/material';
import {
  IconX as CloseIcon,
  IconGripVertical as DragIndicatorIcon,
  IconArrowRight as DirectionIcon
} from '@tabler/icons-react';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useConnector } from 'src/hooks/useConnector';
import { useColor } from 'src/hooks/useColor';
import { useModelItem } from 'src/hooks/useModelItem';
import { useScene } from 'src/hooks/useScene';
import { useTranslation } from 'src/stores/localeStore';
import { getConnectorLabels } from 'src/utils';
import { ControlsContainer } from '../components/ControlsContainer';
import { ConnectorControls } from './ConnectorControls';
import { ConnectorGroupControls as ConnectorGroupControlsType } from 'src/types';

interface ConnectorPickerRowProps {
  connectorId: string;
  index: number;
  isFocused: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  isReadOnly: boolean;
  onToggleFocus: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDragEnd: () => void;
  registerRowEl: (id: string, el: HTMLDivElement | null) => void;
}

const ConnectorPickerRow = memo(function ConnectorPickerRow({
  connectorId,
  index,
  isFocused,
  isDragging,
  isDropTarget,
  isReadOnly,
  onToggleFocus,
  onDragStart,
  onDragOver,
  onDragEnd,
  registerRowEl
}: ConnectorPickerRowProps) {
  const connector = useConnector(connectorId);
  const colorData = useColor(connector?.color);
  const { updateConnector } = useScene();
  const labels = connector ? getConnectorLabels(connector) : [];
  const { t } = useTranslation();

  const anchors = connector?.anchors ?? [];
  const startItem = useModelItem(anchors[0]?.ref.item ?? '');
  const endItem = useModelItem(anchors[anchors.length - 1]?.ref.item ?? '');
  const direction =
    startItem?.name && endItem?.name
      ? { start: startItem.name, end: endItem.name }
      : null;

  const setRowEl = useCallback(
    (el: HTMLDivElement | null) => registerRowEl(connectorId, el),
    [connectorId, registerRowEl]
  );

  const displayColor = connector?.customColor || colorData?.value || '#9e9e9e';
  const primaryText =
    connector?.name ||
    labels[0]?.text ||
    t('itemControls.connector.connectorFallbackName').replace(
      '{number}',
      String(index + 1)
    );
  const styleLabel =
    connector?.style === 'DASHED'
      ? t('itemControls.connector.styleDashed')
      : connector?.style === 'DOTTED'
        ? t('itemControls.connector.styleDotted')
        : t('itemControls.connector.styleSolid');

  const handleClick = useCallback(() => {
    onToggleFocus(connectorId);
  }, [connectorId, onToggleFocus]);

  return (
    <Box
      ref={setRowEl}
      draggable={!isReadOnly}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(connectorId);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(connectorId);
      }}
      onDragEnd={onDragEnd}
      onDrop={(e) => e.preventDefault()}
      sx={{
        opacity: isDragging ? 0.4 : 1,
        borderTop: '2px solid',
        borderTopColor: isDropTarget ? 'primary.main' : 'transparent'
      }}
    >
      <ListItemButton
        onClick={handleClick}
        sx={{
          borderLeft: isFocused ? '2px solid' : '2px solid transparent',
          borderLeftColor: isFocused ? 'primary.main' : 'transparent',
          pl: 0.5
        }}
      >
        <Box
          component="span"
          sx={{ display: 'inline-flex', color: 'text.disabled', cursor: 'grab', mr: 0.5 }}
        >
          <DragIndicatorIcon size={20} />
        </Box>
        <ListItemIcon sx={{ minWidth: 32 }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: displayColor
            }}
          />
        </ListItemIcon>
        <ListItemText
          primary={primaryText}
          secondary={
            <Box>
              {direction && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mb: 0.25 }}>
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{ maxWidth: '40%' }}
                  >
                    {direction.start}
                  </Typography>
                  <DirectionIcon size={12} style={{ flexShrink: 0, opacity: 0.6 }} />
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{ maxWidth: '40%' }}
                  >
                    {direction.end}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                <Typography component="span" variant="caption" color="text.secondary">
                  {styleLabel}
                </Typography>
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${t('itemControls.connector.width')} ${connector?.width ?? 0}`}
                  sx={{ height: 16, '& .MuiChip-label': { px: 0.75, fontSize: '0.65rem' } }}
                />
                {labels.length > 0 && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={t('itemControls.connector.labelCountChip').replace(
                      '{count}',
                      String(labels.length)
                    )}
                    sx={{ height: 16, '& .MuiChip-label': { px: 0.75, fontSize: '0.65rem' } }}
                  />
                )}
              </Box>
            </Box>
          }
          primaryTypographyProps={{ variant: 'body2', noWrap: true }}
          secondaryTypographyProps={{ component: 'div' }}
        />
        <Switch
          size="small"
          checked={connector?.preventOverlap !== false}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (!connector) return;
            updateConnector(connector.id, {
              preventOverlap: e.target.checked
            });
          }}
          disabled={isReadOnly}
        />
      </ListItemButton>
      <Collapse in={isFocused} timeout="auto" unmountOnExit>
        <Box sx={{ pl: 2, pr: 1, pb: 1 }}>
          <ConnectorControls id={connectorId} embedded />
        </Box>
      </Collapse>
    </Box>
  );
});

interface Props {
  controls: ConnectorGroupControlsType;
  embedded?: boolean;
}

export const ConnectorGroupControls = memo(function ConnectorGroupControls({
  controls,
  embedded
}: Props) {
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const isReadOnly = useUiStateStore((state) => state.editorMode !== 'EDITABLE');
  const { reorderConnectors } = useScene();
  const { t } = useTranslation();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const rowElsRef = useRef(new Map<string, HTMLDivElement>());
  const prevRectsRef = useRef<Map<string, DOMRect> | null>(null);

  const registerRowEl = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      rowElsRef.current.set(id, el);
    } else {
      rowElsRef.current.delete(id);
    }
  }, []);

  // FLIP: rows swap identically (same labels/colors) with only 2 items, so a
  // reorder is invisible unless we animate it. Measuring the old position and
  // animating a transform back to 0 keeps the rows live and interactive
  // (unlike document.startViewTransition(), which hides the real elements
  // while its snapshot animates). This only runs on drop (see handleDragEnd)
  // rather than on every dragover: reordering the DOM live, mid-drag, moves
  // the dragged row's own element, and browsers implicitly end a native drag
  // when its source element is relocated in the DOM — so the drag would die
  // after the first hop.
  useLayoutEffect(() => {
    const prevRects = prevRectsRef.current;
    if (!prevRects) return;
    prevRectsRef.current = null;

    rowElsRef.current.forEach((el, id) => {
      const prevRect = prevRects.get(id);
      if (!prevRect) return;
      const deltaY = prevRect.top - el.getBoundingClientRect().top;
      if (!deltaY) return;

      el.style.transition = 'none';
      el.style.transform = `translateY(${deltaY}px)`;
      el.getBoundingClientRect(); // force reflow so the transition below applies
      requestAnimationFrame(() => {
        el.style.transition = 'transform 200ms ease';
        el.style.transform = '';
      });
    });
  }, [controls.ids]);

  const handleClose = useCallback(() => {
    uiStateActions.setItemControls(null);
  }, [uiStateActions]);

  const handleToggleFocus = useCallback(
    (id: string) => {
      const newFocusedId = controls.focusedId === id ? null : id;
      uiStateActions.setItemControls({ ...controls, focusedId: newFocusedId });
    },
    [controls, uiStateActions]
  );

  const handleDragStart = useCallback((id: string) => {
    setDraggedId(id);
    setDropTargetId(null);
  }, []);

  // Only tracks which row you're hovering over (for the insertion-line cue
  // below); doesn't touch controls.ids. See the FLIP comment above for why
  // reordering live, per dragover, isn't safe here.
  const handleDragOver = useCallback(
    (overId: string) => {
      if (!draggedId || draggedId === overId) return;
      setDropTargetId(overId);
    },
    [draggedId]
  );

  const handleDragEnd = useCallback(() => {
    const fromId = draggedId;
    const toId = dropTargetId;
    setDraggedId(null);
    setDropTargetId(null);
    if (!fromId || !toId || fromId === toId) return;

    const fromIndex = controls.ids.indexOf(fromId);
    const toIndex = controls.ids.indexOf(toId);
    if (fromIndex === -1 || toIndex === -1) return;

    const newIds = [...controls.ids];
    newIds.splice(fromIndex, 1);
    newIds.splice(toIndex, 0, fromId);

    const rects = new Map<string, DOMRect>();
    rowElsRef.current.forEach((el, id) => rects.set(id, el.getBoundingClientRect()));
    prevRectsRef.current = rects;

    uiStateActions.setItemControls({ ...controls, ids: newIds });
    reorderConnectors(newIds);
  }, [controls, draggedId, dropTargetId, reorderConnectors, uiStateActions]);

  if (controls.ids.length === 1) {
    return <ConnectorControls id={controls.ids[0]} embedded={embedded} />;
  }

  const list = (
    <List dense disablePadding>
      {controls.ids.map((id, index) => (
        <ConnectorPickerRow
          key={id}
          connectorId={id}
          index={index}
          isFocused={controls.focusedId === id}
          isDragging={draggedId === id}
          isDropTarget={dropTargetId === id}
          isReadOnly={isReadOnly}
          onToggleFocus={handleToggleFocus}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          registerRowEl={registerRowEl}
        />
      ))}
    </List>
  );

  if (embedded) {
    return list;
  }

  return (
    <ControlsContainer
      header={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            pt: 2,
            pb: 1
          }}
        >
          <Typography variant="subtitle2" color="text.primary">
            {t('itemControls.connector.connectorsCount').replace(
              '{count}',
              String(controls.ids.length)
            )}
          </Typography>
          <MUIIconButton
            size="small"
            aria-label={t('itemControls.close')}
            onClick={handleClose}
          >
            <CloseIcon size={20} />
          </MUIIconButton>
        </Box>
      }
    >
      {list}
    </ControlsContainer>
  );
});
