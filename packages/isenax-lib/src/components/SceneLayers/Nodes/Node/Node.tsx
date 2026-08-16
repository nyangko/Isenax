import React, { useMemo, useState, memo } from 'react';
import { Box, Typography, Stack, IconButton } from '@mui/material';
import { IconChevronDown as ExpandMoreIcon, IconChevronUp as ExpandLessIcon } from '@tabler/icons-react';
import { PROJECTED_TILE_SIZE, DEFAULT_LABEL_HEIGHT } from 'src/config';
import { getTilePosition, CoordsUtils } from 'src/utils';
import { useIcon } from 'src/hooks/useIcon';
import { ViewItem } from 'src/types';
import { useModelItem } from 'src/hooks/useModelItem';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useTranslation } from 'src/stores/localeStore';
import { Label } from 'src/components/Label/Label';
import { RichTextEditor } from 'src/components/RichTextEditor/RichTextEditor';

interface Props {
  node: ViewItem;
  order: number;
}

// Empty paragraphs/whitespace (e.g. "<p><br></p><p><br></p>") strip to no
// visible text but still render as blank space if treated as real content.
const isMarkdownEmpty = (value?: string) => {
  if (!value) return true;

  return value.replace(/<[^>]*>/g, '').trim().length === 0;
};

export const Node = memo(({ node, order }: Props) => {
  const modelItem = useModelItem(node.id);
  const { iconComponent } = useIcon(modelItem?.icon);
  const forceExpandLabels = useUiStateStore((state) => state.expandLabels);
  const editorMode = useUiStateStore((state) => state.editorMode);
  const isFlat = useUiStateStore((state) => state.projectionMode === 'FLAT');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const { t } = useTranslation();

  const labelDisplayMode = node.labelDisplayMode ?? 'ALWAYS';

  // Every node's own visuals have pointer-events: none (see the icon/Label
  // below) -- a single overlay owns all real hit-testing (Cursor.ts), so
  // native onMouseEnter/Leave never fires here. Derive "hovered" the same
  // way the app already tracks cursor position instead.
  const mouseTile = useUiStateStore((state) =>
    labelDisplayMode === 'HOVER' ? state.mouse.position.tile : null
  );
  const isHovered = labelDisplayMode === 'HOVER' && !!mouseTile && CoordsUtils.isEqual(mouseTile, node.tile);
  const showLabel = labelDisplayMode !== 'HIDDEN' && (labelDisplayMode !== 'HOVER' || isHovered);

  const position = useMemo(() => {
    return getTilePosition({
      tile: node.tile,
      origin: 'BOTTOM',
      flat: isFlat
    });
  }, [node.tile, isFlat]);

  const hasDescription = useMemo(() => {
    return !isMarkdownEmpty(modelItem?.description);
  }, [modelItem?.description]);

  // Export mode forces every label open regardless of the user's toggle state
  const showDescription =
    hasDescription &&
    (isDescriptionExpanded ||
      (forceExpandLabels && editorMode === 'NON_INTERACTIVE'));

  // If modelItem doesn't exist, don't render the node
  if (!modelItem) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        zIndex: order
      }}
    >
      <Box
        sx={{ 
          position: 'absolute',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          left: position.x,
          top: position.y - (PROJECTED_TILE_SIZE.height / 2),
        }}
      >
        {showLabel && (modelItem?.name || hasDescription) && (
          <Box>
            <Label
              maxWidth={showDescription ? 375 : 250}
              expandDirection="BOTTOM"
              labelHeight={node.labelHeight ?? DEFAULT_LABEL_HEIGHT}
            >
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {modelItem.name && (
                    <Typography fontWeight={600} sx={{ flex: 1 }}>
                      {modelItem.name}
                    </Typography>
                  )}
                  {hasDescription && editorMode !== 'NON_INTERACTIVE' && (
                    <IconButton
                      size="small"
                      sx={{ p: 0.25, ml: 'auto' }}
                      aria-label={
                        isDescriptionExpanded
                          ? t('itemControls.node.collapseDescription')
                          : t('itemControls.node.expandDescription')
                      }
                      onClick={() => {
                        setIsDescriptionExpanded((expanded) => !expanded);
                      }}
                    >
                      {isDescriptionExpanded ? (
                        <ExpandLessIcon size={20} />
                      ) : (
                        <ExpandMoreIcon size={20} />
                      )}
                    </IconButton>
                  )}
                </Stack>
                {showDescription && (
                  <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    <RichTextEditor value={modelItem.description} readOnly />
                  </Box>
                )}
              </Stack>
            </Label>
          </Box>
        )}
        {iconComponent && (
          <Box
            sx={{
              pointerEvents: 'none',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {node.accentColor && (
              <Box
                sx={{
                  position: 'absolute',
                  width: PROJECTED_TILE_SIZE.width * 0.9,
                  height: PROJECTED_TILE_SIZE.width * 0.9,
                  borderRadius: '50%',
                  bgcolor: node.accentColor,
                  opacity: 0.18,
                  zIndex: -1
                }}
              />
            )}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                filter: node.shadowEnabled
                  ? 'drop-shadow(0 6px 8px rgba(0,0,0,0.35))'
                  : undefined
              }}
            >
              {iconComponent}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
});
