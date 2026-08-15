import React, { useEffect, useMemo, useState } from 'react';
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
  Collapse,
  TextField,
  InputAdornment,
  Chip,
  Stack
} from '@mui/material';
import {
  IconX as CloseIcon,
  IconChevronDown as ChevronDownIcon,
  IconSearch as SearchIcon
} from '@tabler/icons-react';
import { useScene } from 'src/hooks/useScene';
import { useModelItem } from 'src/hooks/useModelItem';
import { useModelStore } from 'src/stores/modelStore';
import { useIcon } from 'src/hooks/useIcon';
import { useConnector } from 'src/hooks/useConnector';
import { useRectangle } from 'src/hooks/useRectangle';
import { useTextBox } from 'src/hooks/useTextBox';
import { useColor } from 'src/hooks/useColor';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useTranslation } from 'src/stores/localeStore';
import { getConnectorLabels, getItemById } from 'src/utils';
import { ItemControlsManager } from 'src/components/ItemControls/ItemControlsManager';

type TabValue = 'LIST' | 'DETAIL';
type TypeFilter = 'ALL' | 'NODE' | 'CONNECTOR' | 'RECTANGLE' | 'TEXTBOX';

interface RowProps {
  isSelected: boolean;
  onSelect: () => void;
}

const NodeRow = ({ id, isSelected, onSelect }: RowProps & { id: string }) => {
  const modelItem = useModelItem(id);
  const { icon } = useIcon(modelItem?.icon);
  if (!modelItem) return null;

  return (
    <ListItemButton selected={isSelected} onClick={onSelect} dense>
      <ListItemIcon sx={{ minWidth: 28 }}>
        <Box
          component="img"
          src={icon.url}
          alt=""
          sx={{ width: 20, height: 20, objectFit: 'contain' }}
        />
      </ListItemIcon>
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
  // While the user is searching, force every matching group open so results
  // aren't hidden behind a collapse state they set before they started typing.
  forceExpanded?: boolean;
  children: React.ReactNode;
}

const GroupSection = ({ title, count, forceExpanded, children }: GroupSectionProps) => {
  const [localExpanded, setLocalExpanded] = useState(true);
  const expanded = forceExpanded || localExpanded;

  if (count === 0) return null;

  return (
    <Box>
      <Box
        component="button"
        onClick={() => {
          setLocalExpanded((prev) => !prev);
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
  const modelItems = useModelStore((state) => state.items);
  const itemControls = useUiStateStore((state) => {
    return state.itemControls;
  });
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const { t } = useTranslation('layersPanel');
  const [activeTab, setActiveTab] = useState<TabValue>('LIST');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');

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

  // Same "does this row's display text match?" logic the rows themselves use
  // to render a primary label -- kept in the parent (rather than filtering
  // post-render) so a group can be hidden entirely when nothing in it matches.
  const query = search.trim().toLowerCase();
  const matches = (text: string) => !query || text.toLowerCase().includes(query);

  const filteredItems = useMemo(() => {
    if (typeFilter !== 'ALL' && typeFilter !== 'NODE') return [];
    return items.filter((item) => {
      const name = getItemById(modelItems, item.id)?.value.name ?? '';
      return matches(name);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, modelItems, typeFilter, query]);

  const filteredConnectors = useMemo(() => {
    if (typeFilter !== 'ALL' && typeFilter !== 'CONNECTOR') return [];
    return connectors
      .map((connector, index) => ({ connector, index }))
      .filter(({ connector, index }) => {
        const labels = getConnectorLabels(connector);
        const name =
          connector.name ||
          labels[0]?.text ||
          t('groupConnectors') + ' ' + (index + 1);
        return matches(name);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectors, typeFilter, query]);

  const filteredRectangles = useMemo(() => {
    if (typeFilter !== 'ALL' && typeFilter !== 'RECTANGLE') return [];
    return rectangles
      .map((rectangle, index) => ({ rectangle, index }))
      .filter(({ index }) => {
        return matches(t('rectangleFallbackName').replace('{number}', String(index + 1)));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rectangles, typeFilter, query]);

  const filteredTextBoxes = useMemo(() => {
    if (typeFilter !== 'ALL' && typeFilter !== 'TEXTBOX') return [];
    return textBoxes.filter((textBox) => matches(textBox.content));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textBoxes, typeFilter, query]);

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

      {activeTab === 'LIST' && totalCount > 0 && (
        <Box sx={{ px: 1.5, pt: 1.5, pb: 1, flexShrink: 0 }}>
          <TextField
            size="small"
            fullWidth
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon size={16} />
                </InputAdornment>
              )
            }}
          />
          <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 0.75 }}>
            {(
              [
                ['ALL', t('filterAll')],
                ['NODE', t('groupNodes')],
                ['CONNECTOR', t('groupConnectors')],
                ['RECTANGLE', t('groupRectangles')],
                ['TEXTBOX', t('groupTextBoxes')]
              ] as [TypeFilter, string][]
            ).map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                size="small"
                color={typeFilter === value ? 'primary' : 'default'}
                variant={typeFilter === value ? 'filled' : 'outlined'}
                onClick={() => {
                  setTypeFilter(value);
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'LIST' &&
          (totalCount === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {t('emptyCanvas')}
              </Typography>
            </Box>
          ) : filteredItems.length +
              filteredConnectors.length +
              filteredRectangles.length +
              filteredTextBoxes.length ===
            0 ? (
            <Box sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {t('noSearchResults').replace('{query}', search.trim())}
              </Typography>
            </Box>
          ) : (
            <>
              <GroupSection title={t('groupNodes')} count={filteredItems.length} forceExpanded={!!query}>
                {filteredItems.map((item) => (
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
              <GroupSection
                title={t('groupConnectors')}
                count={filteredConnectors.length}
                forceExpanded={!!query}
              >
                {filteredConnectors.map(({ connector, index }) => (
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
              <GroupSection
                title={t('groupRectangles')}
                count={filteredRectangles.length}
                forceExpanded={!!query}
              >
                {filteredRectangles.map(({ rectangle, index }) => (
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
              <GroupSection
                title={t('groupTextBoxes')}
                count={filteredTextBoxes.length}
                forceExpanded={!!query}
              >
                {filteredTextBoxes.map((textBox) => (
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
