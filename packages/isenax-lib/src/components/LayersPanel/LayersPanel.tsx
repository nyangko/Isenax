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
  Stack,
  Button
} from '@mui/material';
import {
  IconX as CloseIcon,
  IconChevronDown as ChevronDownIcon,
  IconSearch as SearchIcon,
  IconEye as EyeIcon,
  IconEyeOff as EyeOffIcon,
  IconLock as LockIcon,
  IconLockOpen as LockOpenIcon,
  IconSquare as BoundaryIcon,
  IconTypography as LabelIcon
} from '@tabler/icons-react';
import { useScene } from 'src/hooks/useScene';
import { useModelItem } from 'src/hooks/useModelItem';
import { useModelStore } from 'src/stores/modelStore';
import { useIcon } from 'src/hooks/useIcon';
import { useConnector } from 'src/hooks/useConnector';
import { useTextBox } from 'src/hooks/useTextBox';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useTranslation } from 'src/stores/localeStore';
import { getConnectorLabels, getItemById, isWithinBounds } from 'src/utils';
import { ItemControlsManager } from 'src/components/ItemControls/ItemControlsManager';
import { ViewItem, Rectangle as RectangleType } from 'src/types';

type TabValue = 'LIST' | 'DETAIL';
type StructureTab = 'STRUCTURE' | 'CONNECTIONS';
type TypeFilter = 'ALL' | 'NODE' | 'CONNECTOR' | 'RECTANGLE' | 'TEXTBOX';

interface RowProps {
  isSelected: boolean;
  onSelect: () => void;
}

// Eye/lock toggles shared by every row type. Session-only state (see
// uiStateStore) -- hidden actually stops the item rendering on canvas, but
// locked is visual-only for now (not yet enforced against canvas
// clicks/drags, see the store's comment for why).
const LayerRowActions = ({ id }: { id: string }) => {
  const hiddenLayerIds = useUiStateStore((state) => state.hiddenLayerIds);
  const lockedLayerIds = useUiStateStore((state) => state.lockedLayerIds);
  const uiStateActions = useUiStateStore((state) => state.actions);
  const isHidden = hiddenLayerIds.includes(id);
  const isLocked = lockedLayerIds.includes(id);

  return (
    <Stack
      direction="row"
      spacing={0}
      onClick={(e) => {
        e.stopPropagation();
      }}
      sx={{ flexShrink: 0 }}
    >
      <MUIIconButton
        size="small"
        onClick={() => {
          uiStateActions.toggleLayerHidden(id);
        }}
      >
        {isHidden ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
      </MUIIconButton>
      <MUIIconButton
        size="small"
        onClick={() => {
          uiStateActions.toggleLayerLocked(id);
        }}
      >
        {isLocked ? <LockIcon size={16} /> : <LockOpenIcon size={16} />}
      </MUIIconButton>
    </Stack>
  );
};

const NodeRow = ({
  id,
  connectorCount,
  isSelected,
  onSelect
}: RowProps & { id: string; connectorCount: number }) => {
  const modelItem = useModelItem(id);
  const { icon } = useIcon(modelItem?.icon);
  if (!modelItem) return null;

  return (
    <ListItemButton selected={isSelected} onClick={onSelect} dense sx={{ pr: 0.5 }}>
      <ListItemIcon sx={{ minWidth: 28 }}>
        <Box
          component="img"
          src={icon.url}
          alt=""
          sx={{ width: 20, height: 20, objectFit: 'contain' }}
        />
      </ListItemIcon>
      <ListItemText primary={modelItem.name} primaryTypographyProps={{ noWrap: true }} />
      <Typography variant="caption" color="text.disabled" sx={{ mr: 0.5, flexShrink: 0 }}>
        · {connectorCount}
      </Typography>
      <LayerRowActions id={id} />
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

// The zone's own boundary (rectangle) and label (textbox), shown as their
// own selectable rows nested under the zone header -- the header itself is
// a virtual grouping, not a real item, so the rectangle/textbox still need
// their own row to be selected/toggled individually.
const BoundaryRow = ({
  id,
  zoneName,
  isSelected,
  onSelect
}: RowProps & { id: string; zoneName: string }) => {
  const { t } = useTranslation('layersPanel');
  return (
    <ListItemButton selected={isSelected} onClick={onSelect} dense sx={{ pr: 0.5 }}>
      <ListItemIcon sx={{ minWidth: 28 }}>
        <BoundaryIcon size={16} />
      </ListItemIcon>
      <ListItemText
        primary={`${t('boundaryRowPrefix')} (${zoneName})`}
        primaryTypographyProps={{ noWrap: true, color: 'text.secondary' }}
      />
      <LayerRowActions id={id} />
    </ListItemButton>
  );
};

const ZoneLabelRow = ({
  id,
  zoneName,
  isSelected,
  onSelect
}: RowProps & { id: string; zoneName: string }) => {
  const { t } = useTranslation('layersPanel');
  return (
    <ListItemButton selected={isSelected} onClick={onSelect} dense sx={{ pr: 0.5 }}>
      <ListItemIcon sx={{ minWidth: 28 }}>
        <LabelIcon size={16} />
      </ListItemIcon>
      <ListItemText
        primary={`${t('labelRowPrefix')} (${zoneName})`}
        primaryTypographyProps={{ noWrap: true, color: 'text.secondary' }}
      />
      <LayerRowActions id={id} />
    </ListItemButton>
  );
};

const TextBoxRow = ({ id, isSelected, onSelect }: RowProps & { id: string }) => {
  const textBox = useTextBox(id);
  if (!textBox) return null;

  return (
    <ListItemButton selected={isSelected} onClick={onSelect} dense sx={{ pr: 0.5 }}>
      <ListItemText primary={textBox.content} primaryTypographyProps={{ noWrap: true }} />
      <LayerRowActions id={id} />
    </ListItemButton>
  );
};

interface GroupSectionProps {
  title: string;
  count: number;
  color?: string;
  actionsId?: string;
  // While the user is searching, force every matching group open so results
  // aren't hidden behind a collapse state they set before they started typing.
  forceExpanded?: boolean;
  children: React.ReactNode;
}

const GroupSection = ({ title, count, color, actionsId, forceExpanded, children }: GroupSectionProps) => {
  const [localExpanded, setLocalExpanded] = useState(true);
  const expanded = forceExpanded || localExpanded;

  if (count === 0) return null;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          pr: 0.5
        }}
      >
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
            flex: 1,
            minWidth: 0,
            py: 1,
            px: 1.5
          }}
        >
          <ChevronDownIcon
            size={14}
            style={{
              flexShrink: 0,
              transform: expanded ? undefined : 'rotate(-90deg)',
              transition: 'transform 150ms ease'
            }}
          />
          {color && (
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '2px',
                bgcolor: color,
                border: '1px solid rgba(0,0,0,0.2)',
                flexShrink: 0
              }}
            />
          )}
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.4 }}
          >
            {title} · {count}
          </Typography>
        </Box>
        {actionsId && <LayerRowActions id={actionsId} />}
      </Box>
      <Collapse in={expanded}>
        <List dense disablePadding>
          {children}
        </List>
      </Collapse>
    </Box>
  );
};

interface Zone {
  rectangle: RectangleType;
  index: number;
  name: string;
  color: string;
  nodeItems: ViewItem[];
  textBoxId?: string;
}

// Exported so other item-detail panels (e.g. NodeControls' summary card) can
// derive "which zone is this node in" without duplicating the containment math.
export const zoneBounds = (rectangle: RectangleType) => [rectangle.from, rectangle.to];

// Zone labels are routinely placed just outside their rectangle's edge for
// readability (see the isenax-diagram skill's "hard-won specifics" -- e.g. a
// label at y=-4.8 next to a zone edge at y=-5), so a strict containment
// check misses the exact case it's meant to catch. Pad the bounds generously
// for label matching only; node items still use the exact rectangle bounds.
const LABEL_ZONE_TOLERANCE = 1;
export const zoneBoundsForLabels = (rectangle: RectangleType) => {
  const { from, to } = rectangle;
  const lowX = Math.min(from.x, to.x) - LABEL_ZONE_TOLERANCE;
  const highX = Math.max(from.x, to.x) + LABEL_ZONE_TOLERANCE;
  const lowY = Math.min(from.y, to.y) - LABEL_ZONE_TOLERANCE;
  const highY = Math.max(from.y, to.y) + LABEL_ZONE_TOLERANCE;
  return [
    { x: lowX, y: lowY },
    { x: highX, y: highY }
  ];
};

export const LayersPanel = () => {
  const { items, connectors, rectangles, textBoxes, colors } = useScene();
  const modelItems = useModelStore((state) => state.items);
  const itemControls = useUiStateStore((state) => {
    return state.itemControls;
  });
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const { t } = useTranslation('layersPanel');
  const [activeTab, setActiveTab] = useState<TabValue>('LIST');
  const [structureTab, setStructureTab] = useState<StructureTab>('STRUCTURE');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');

  // Selecting an item (canvas or list) makes sure the panel is visible, but
  // no longer force-switches to the Edit tab -- the bottom summary bar shows
  // the selection inline, and the Edit tab is an explicit choice (the
  // Properties button below) rather than something clicking an item jumps to.
  useEffect(() => {
    if (itemControls) {
      uiStateActions.setLayersPanelOpen(true);
    }
  }, [itemControls, uiStateActions]);

  const totalCount = items.length + connectors.length + rectangles.length + textBoxes.length;

  // Same "does this row's display text match?" logic the rows themselves use
  // to render a primary label -- kept in the parent (rather than filtering
  // post-render) so a group can be hidden entirely when nothing in it matches.
  const query = search.trim().toLowerCase();
  const matches = (text: string) => !query || text.toLowerCase().includes(query);

  const connectorCountByItemId = useMemo(() => {
    const counts = new Map<string, number>();
    connectors.forEach((connector) => {
      connector.anchors.forEach((anchor) => {
        const itemId = anchor.ref?.item;
        if (itemId) counts.set(itemId, (counts.get(itemId) ?? 0) + 1);
      });
    });
    return counts;
  }, [connectors]);

  // Groups nodes/textboxes by which zone (rectangle) their tile falls
  // inside, for the Structure tab -- smaller rectangles claim first so a
  // zone nested inside a larger one isn't shadowed by it. A zone's display
  // name borrows its own label textbox's content when it has one (matching
  // how zones are actually named in practice, e.g. "서비스 메시"), falling
  // back to "Area N" otherwise. Items/textboxes outside every rectangle
  // land in the Ungrouped bucket below instead of being dropped.
  const { zones, ungroupedItems, ungroupedTextBoxes } = useMemo(() => {
    const zoneList: Zone[] = rectangles.map((rectangle, index) => ({
      rectangle,
      index,
      name: t('rectangleFallbackName').replace('{number}', String(index + 1)),
      color: rectangle.customColor || getItemById(colors, rectangle.color ?? '')?.value.value || '#9e9e9e',
      nodeItems: []
    }));
    const byArea = [...zoneList].sort((a, b) => {
      const areaOf = (z: Zone) =>
        Math.abs(z.rectangle.to.x - z.rectangle.from.x) * Math.abs(z.rectangle.to.y - z.rectangle.from.y);
      return areaOf(a) - areaOf(b);
    });

    const claimedItemIds = new Set<string>();
    items.forEach((item) => {
      const zone = byArea.find((z) => isWithinBounds(item.tile, zoneBounds(z.rectangle)));
      if (zone) {
        zone.nodeItems.push(item);
        claimedItemIds.add(item.id);
      }
    });

    const claimedTextBoxIds = new Set<string>();
    textBoxes.forEach((textBox) => {
      const zone = byArea.find(
        (z) => !z.textBoxId && isWithinBounds(textBox.tile, zoneBoundsForLabels(z.rectangle))
      );
      if (zone) {
        zone.textBoxId = textBox.id;
        claimedTextBoxIds.add(textBox.id);
      }
    });

    zoneList.forEach((zone) => {
      if (zone.textBoxId) {
        const labelTextBox = getItemById(textBoxes, zone.textBoxId)?.value;
        if (labelTextBox?.content) zone.name = labelTextBox.content;
      }
    });

    return {
      zones: zoneList,
      ungroupedItems: items.filter((item) => !claimedItemIds.has(item.id)),
      ungroupedTextBoxes: textBoxes.filter((textBox) => !claimedTextBoxIds.has(textBox.id))
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rectangles, items, textBoxes, colors, t]);

  const filteredConnectors = useMemo(() => {
    if (typeFilter !== 'ALL' && typeFilter !== 'CONNECTOR') return [];
    return connectors
      .map((connector, index) => ({ connector, index }))
      .filter(({ connector, index }) => {
        const labels = getConnectorLabels(connector);
        const name = connector.name || labels[0]?.text || t('groupConnectors') + ' ' + (index + 1);
        return matches(name);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectors, typeFilter, query]);

  const nodeName = (id: string) => getItemById(modelItems, id)?.value.name ?? '';

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

  const structureMatchCount =
    zones.reduce((sum, zone) => {
      const nodeMatches = (typeFilter === 'ALL' || typeFilter === 'NODE') ? zone.nodeItems.filter((i) => matches(nodeName(i.id))).length : 0;
      const boundaryMatches = (typeFilter === 'ALL' || typeFilter === 'RECTANGLE') && matches(zone.name) ? 1 : 0;
      const labelMatches = zone.textBoxId && (typeFilter === 'ALL' || typeFilter === 'TEXTBOX') ? 1 : 0;
      return sum + nodeMatches + boundaryMatches + labelMatches;
    }, 0) +
    ((typeFilter === 'ALL' || typeFilter === 'NODE') ? ungroupedItems.filter((i) => matches(nodeName(i.id))).length : 0) +
    ((typeFilter === 'ALL' || typeFilter === 'TEXTBOX') ? ungroupedTextBoxes.filter((tb) => matches(tb.content)).length : 0);

  const visibleResultCount = structureTab === 'STRUCTURE' ? structureMatchCount : filteredConnectors.length;

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
                  if (value === 'CONNECTOR') setStructureTab('CONNECTIONS');
                  else if (structureTab === 'CONNECTIONS') setStructureTab('STRUCTURE');
                }}
              />
            ))}
          </Stack>
          <Tabs
            value={structureTab}
            onChange={(_e, value: StructureTab) => {
              setStructureTab(value);
            }}
            variant="fullWidth"
            sx={{ minHeight: 32, mt: 1 }}
          >
            <Tab value="STRUCTURE" label={t('subTabStructure')} sx={{ minHeight: 32, py: 0.5 }} />
            <Tab value="CONNECTIONS" label={t('subTabConnections')} sx={{ minHeight: 32, py: 0.5 }} />
          </Tabs>
        </Box>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {activeTab === 'LIST' &&
          (totalCount === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {t('emptyCanvas')}
              </Typography>
            </Box>
          ) : visibleResultCount === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {t('noSearchResults').replace('{query}', search.trim())}
              </Typography>
            </Box>
          ) : structureTab === 'STRUCTURE' ? (
            <>
              {zones.map((zone) => {
                const visibleNodes =
                  typeFilter === 'ALL' || typeFilter === 'NODE'
                    ? zone.nodeItems.filter((item) => matches(nodeName(item.id)))
                    : [];
                const showBoundary =
                  (typeFilter === 'ALL' || typeFilter === 'RECTANGLE') && matches(zone.name);
                const showLabel =
                  !!zone.textBoxId && (typeFilter === 'ALL' || typeFilter === 'TEXTBOX');
                const rowCount = visibleNodes.length + (showBoundary ? 1 : 0) + (showLabel ? 1 : 0);

                return (
                  <GroupSection
                    key={zone.rectangle.id}
                    title={zone.name}
                    count={rowCount}
                    color={zone.color}
                    actionsId={zone.rectangle.id}
                    forceExpanded={!!query}
                  >
                    {visibleNodes.map((item) => (
                      <NodeRow
                        key={item.id}
                        id={item.id}
                        connectorCount={connectorCountByItemId.get(item.id) ?? 0}
                        isSelected={isNodeSelected(item.id)}
                        onSelect={() => {
                          uiStateActions.setItemControls({ type: 'ITEM', id: item.id });
                        }}
                      />
                    ))}
                    {showBoundary && (
                      <BoundaryRow
                        id={zone.rectangle.id}
                        zoneName={zone.name}
                        isSelected={isRectangleSelected(zone.rectangle.id)}
                        onSelect={() => {
                          uiStateActions.setItemControls({ type: 'RECTANGLE', id: zone.rectangle.id });
                        }}
                      />
                    )}
                    {showLabel && zone.textBoxId && (
                      <ZoneLabelRow
                        id={zone.textBoxId}
                        zoneName={zone.name}
                        isSelected={isTextBoxSelected(zone.textBoxId)}
                        onSelect={() => {
                          uiStateActions.setItemControls({ type: 'TEXTBOX', id: zone.textBoxId as string });
                        }}
                      />
                    )}
                  </GroupSection>
                );
              })}

              {(() => {
                const visibleUngroupedItems =
                  typeFilter === 'ALL' || typeFilter === 'NODE'
                    ? ungroupedItems.filter((item) => matches(nodeName(item.id)))
                    : [];
                const visibleUngroupedTextBoxes =
                  typeFilter === 'ALL' || typeFilter === 'TEXTBOX'
                    ? ungroupedTextBoxes.filter((tb) => matches(tb.content))
                    : [];
                const count = visibleUngroupedItems.length + visibleUngroupedTextBoxes.length;

                return (
                  <GroupSection title={t('ungrouped')} count={count} forceExpanded={!!query}>
                    {visibleUngroupedItems.map((item) => (
                      <NodeRow
                        key={item.id}
                        id={item.id}
                        connectorCount={connectorCountByItemId.get(item.id) ?? 0}
                        isSelected={isNodeSelected(item.id)}
                        onSelect={() => {
                          uiStateActions.setItemControls({ type: 'ITEM', id: item.id });
                        }}
                      />
                    ))}
                    {visibleUngroupedTextBoxes.map((textBox) => (
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
                );
              })()}
            </>
          ) : (
            <GroupSection title={t('groupConnectors')} count={filteredConnectors.length} forceExpanded>
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

      {activeTab === 'LIST' && itemControls?.type === 'ITEM' && (
        <SelectionSummaryBar
          itemId={itemControls.id}
          connectorCount={connectorCountByItemId.get(itemControls.id) ?? 0}
          zoneName={zones.find((z) => z.nodeItems.some((i) => i.id === itemControls.id))?.name}
          onOpenProperties={() => {
            setActiveTab('DETAIL');
          }}
        />
      )}
    </Box>
  );
};

// Always-visible summary for the current selection, pinned under the list --
// clicking Properties is what actually opens the full edit form now (see the
// removed auto-switch-to-Edit effect above).
const SelectionSummaryBar = ({
  itemId,
  connectorCount,
  zoneName,
  onOpenProperties
}: {
  itemId: string;
  connectorCount: number;
  zoneName?: string;
  onOpenProperties: () => void;
}) => {
  const modelItem = useModelItem(itemId);
  const { icon } = useIcon(modelItem?.icon);
  const { t } = useTranslation('layersPanel');
  if (!modelItem) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider',
        flexShrink: 0
      }}
    >
      <Box component="img" src={icon.url} alt="" sx={{ width: 28, height: 28, objectFit: 'contain' }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {modelItem.name}
        </Typography>
        <Stack direction="row" spacing={1.5} sx={{ mt: 0.25 }}>
          <Typography variant="caption" color="text.secondary">
            {t('summaryConnectorCount')}: {connectorCount}
          </Typography>
          {zoneName && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {t('summaryZone')}: {zoneName}
            </Typography>
          )}
        </Stack>
      </Box>
      <Button size="small" variant="outlined" onClick={onOpenProperties} sx={{ flexShrink: 0 }}>
        {t('summaryOpenProperties')}
      </Button>
    </Box>
  );
};
