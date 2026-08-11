import React, { useEffect, useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  IconButton as MUIIconButton,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse
} from '@mui/material';
import { IconX as CloseIcon, IconChevronDown as ChevronDownIcon } from '@tabler/icons-react';
import { useScene } from 'src/hooks/useScene';
import { useModelItem } from 'src/hooks/useModelItem';
import { useConnector } from 'src/hooks/useConnector';
import { useRectangle } from 'src/hooks/useRectangle';
import { useTextBox } from 'src/hooks/useTextBox';
import { useColor } from 'src/hooks/useColor';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useTranslation } from 'src/stores/localeStore';
import { getConnectorLabels } from 'src/utils';
import { ItemControlsManager } from 'src/components/ItemControls/ItemControlsManager';

type TabValue = 'LIST' | 'DETAIL';

interface RowProps {
  isSelected: boolean;
  onSelect: () => void;
}

const NodeRow = ({ id, isSelected, onSelect }: RowProps & { id: string }) => {
  const modelItem = useModelItem(id);
  if (!modelItem) return null;

  return (
    <ListItemButton selected={isSelected} onClick={onSelect} dense>
      <ListItemText primary={modelItem.name} primaryTypographyProps={{ noWrap: true }} />
    </ListItemButton>
  );
};

const ConnectorRow = ({
  id,
  index,
  isSelected,
  onSelect
}: RowProps & { id: string; index: number }) => {
  const connector = useConnector(id);
  const anchors = connector?.anchors ?? [];
  const startItem = useModelItem(anchors[0]?.ref.item ?? '');
  const endItem = useModelItem(anchors[anchors.length - 1]?.ref.item ?? '');
  const { t } = useTranslation();

  if (!connector) return null;

  const labels = getConnectorLabels(connector);
  const primaryText =
    connector.name ||
    labels[0]?.text ||
    t('itemControls.connector.connectorFallbackName').replace('{number}', String(index + 1));
  const secondaryText =
    startItem?.name && endItem?.name ? `${startItem.name} → ${endItem.name}` : undefined;

  return (
    <ListItemButton selected={isSelected} onClick={onSelect} dense>
      <ListItemText
        primary={primaryText}
        secondary={secondaryText}
        primaryTypographyProps={{ noWrap: true }}
        secondaryTypographyProps={{ noWrap: true }}
      />
    </ListItemButton>
  );
};

const RectangleRow = ({
  id,
  index,
  isSelected,
  onSelect
}: RowProps & { id: string; index: number }) => {
  const rectangle = useRectangle(id);
  const colorData = useColor(rectangle?.color);
  const { t } = useTranslation('layersPanel');

  if (!rectangle) return null;

  const displayColor = rectangle.customColor || colorData?.value || '#9e9e9e';

  return (
    <ListItemButton selected={isSelected} onClick={onSelect} dense>
      <ListItemIcon sx={{ minWidth: 32 }}>
        <Box
          sx={{
            width: 14,
            height: 14,
            borderRadius: '3px',
            bgcolor: displayColor,
            border: '1px solid rgba(0,0,0,0.2)'
          }}
        />
      </ListItemIcon>
      <ListItemText
        primary={t('rectangleFallbackName').replace('{number}', String(index + 1))}
      />
    </ListItemButton>
  );
};

const TextBoxRow = ({ id, isSelected, onSelect }: RowProps & { id: string }) => {
  const textBox = useTextBox(id);
  if (!textBox) return null;

  return (
    <ListItemButton selected={isSelected} onClick={onSelect} dense>
      <ListItemText primary={textBox.content} primaryTypographyProps={{ noWrap: true }} />
    </ListItemButton>
  );
};

interface GroupSectionProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

const GroupSection = ({ title, count, children }: GroupSectionProps) => {
  const [expanded, setExpanded] = useState(true);

  if (count === 0) return null;

  return (
    <Box>
      <Box
        component="button"
        onClick={() => {
          setExpanded((prev) => !prev);
        }}
        sx={{
          all: 'unset',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          width: '100%',
          py: 1,
          px: 1.5
        }}
      >
        <ChevronDownIcon
          size={14}
          style={{
            transform: expanded ? undefined : 'rotate(-90deg)',
            transition: 'transform 150ms ease'
          }}
        />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.4 }}
        >
          {title} · {count}
        </Typography>
      </Box>
      <Collapse in={expanded}>
        <List dense disablePadding>
          {children}
        </List>
      </Collapse>
    </Box>
  );
};

export const LayersPanel = () => {
  const { items, connectors, rectangles, textBoxes } = useScene();
  const itemControls = useUiStateStore((state) => {
    return state.itemControls;
  });
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const { t } = useTranslation('layersPanel');
  const [activeTab, setActiveTab] = useState<TabValue>('LIST');

  // Clicking an item (canvas or list) always routes through setItemControls --
  // jump to the Edit tab and make sure the panel is actually visible so the
  // form is never set behind a closed/collapsed panel.
  useEffect(() => {
    if (itemControls) {
      setActiveTab('DETAIL');
      uiStateActions.setLayersPanelOpen(true);
    } else {
      setActiveTab('LIST');
    }
  }, [itemControls, uiStateActions]);

  const totalCount = items.length + connectors.length + rectangles.length + textBoxes.length;

  const isNodeSelected = (id: string) => {
    return itemControls?.type === 'ITEM' && itemControls.id === id;
  };
  const isConnectorSelected = (id: string) => {
    return (
      (itemControls?.type === 'CONNECTOR' && itemControls.id === id) ||
      (itemControls?.type === 'CONNECTOR_GROUP' && itemControls.ids.includes(id))
    );
  };
  const isRectangleSelected = (id: string) => {
    return itemControls?.type === 'RECTANGLE' && itemControls.id === id;
  };
  const isTextBoxSelected = (id: string) => {
    return itemControls?.type === 'TEXTBOX' && itemControls.id === id;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0
        }}
      >
        <Typography variant="subtitle2" color="text.primary">
          {t('title')} · {totalCount}
        </Typography>
        <MUIIconButton
          size="small"
          aria-label={t('title')}
          data-testid="layers-panel-close"
          onClick={() => {
            uiStateActions.setLayersPanelOpen(false);
          }}
        >
          <CloseIcon size={18} />
        </MUIIconButton>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_e, value: TabValue) => {
          setActiveTab(value);
        }}
        variant="fullWidth"
        sx={{ minHeight: 36, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}
      >
        <Tab value="LIST" label={t('tabLayers')} sx={{ minHeight: 36 }} />
        <Tab value="DETAIL" label={t('tabEdit')} sx={{ minHeight: 36 }} disabled={!itemControls} />
      </Tabs>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'LIST' &&
          (totalCount === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {t('emptyCanvas')}
              </Typography>
            </Box>
          ) : (
            <>
              <GroupSection title={t('groupNodes')} count={items.length}>
                {items.map((item) => (
                  <NodeRow
                    key={item.id}
                    id={item.id}
                    isSelected={isNodeSelected(item.id)}
                    onSelect={() => {
                      uiStateActions.setItemControls({ type: 'ITEM', id: item.id });
                    }}
                  />
                ))}
              </GroupSection>
              <GroupSection title={t('groupConnectors')} count={connectors.length}>
                {connectors.map((connector, index) => (
                  <ConnectorRow
                    key={connector.id}
                    id={connector.id}
                    index={index}
                    isSelected={isConnectorSelected(connector.id)}
                    onSelect={() => {
                      uiStateActions.setItemControls({
                        type: 'CONNECTOR_GROUP',
                        ids: [connector.id],
                        focusedId: connector.id
                      });
                    }}
                  />
                ))}
              </GroupSection>
              <GroupSection title={t('groupRectangles')} count={rectangles.length}>
                {rectangles.map((rectangle, index) => (
                  <RectangleRow
                    key={rectangle.id}
                    id={rectangle.id}
                    index={index}
                    isSelected={isRectangleSelected(rectangle.id)}
                    onSelect={() => {
                      uiStateActions.setItemControls({ type: 'RECTANGLE', id: rectangle.id });
                    }}
                  />
                ))}
              </GroupSection>
              <GroupSection title={t('groupTextBoxes')} count={textBoxes.length}>
                {textBoxes.map((textBox) => (
                  <TextBoxRow
                    key={textBox.id}
                    id={textBox.id}
                    isSelected={isTextBoxSelected(textBox.id)}
                    onSelect={() => {
                      uiStateActions.setItemControls({ type: 'TEXTBOX', id: textBox.id });
                    }}
                  />
                ))}
              </GroupSection>
            </>
          ))}

        {activeTab === 'DETAIL' &&
          (itemControls ? (
            <ItemControlsManager embedded />
          ) : (
            <Box sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {t('emptyDetail')}
              </Typography>
            </Box>
          ))}
      </Box>
    </Box>
  );
};
