import React, { useMemo, useState, useEffect, memo } from 'react';
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
  dimmed?: boolean;
}

// Empty paragraphs/whitespace (e.g. "<p><br></p><p><br></p>") strip to no
// visible text but still render as blank space if treated as real content.
const isMarkdownEmpty = (value?: string) => {
  if (!value) return true;

  return value.replace(/<[^>]*>/g, '').trim().length === 0;
};

export const Node = memo(({ node, order, dimmed = false }: Props) => {
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

  // Quill has no destroy() API (same issue as NodeControls) -- once a
  // description has been expanded, keep its RichTextEditor mounted and just
  // hide it on collapse instead of unmounting, so repeated expand/collapse
  // doesn't leak a Quill instance per toggle.
  const [hasMountedDescription, setHasMountedDescription] = useState(false);
  useEffect(() => {
    if (showDescription) setHasMountedDescription(true);
  }, [showDescription]);

  // If modelItem doesn't exist, don't render the node
  if (!modelItem) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        zIndex: order,
        opacity: dimmed ? 0.3 : 1,
        transition: 'opacity 0.2s ease-in-out'
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
                {hasMountedDescription && (
                  <Box sx={{ maxHeight: 300, overflowY: 'auto', display: showDescription ? 'block' : 'none' }}>
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
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
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
