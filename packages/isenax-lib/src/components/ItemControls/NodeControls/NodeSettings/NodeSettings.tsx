import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Slider,
  Box,
  Stack,
  TextField,
  Typography,
  InputAdornment,
  Tooltip,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  IconButton as MUIIconButton
} from '@mui/material';
import {
  IconMinus,
  IconPlus,
  IconHelpCircle,
  IconCheck
} from '@tabler/icons-react';
import { ModelItem, ViewItem } from 'src/types';
import { RichTextEditor } from 'src/components/RichTextEditor/RichTextEditor';
import { useModelItem } from 'src/hooks/useModelItem';
import { useModelStore } from 'src/stores/modelStore';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { useTranslation } from 'src/stores/localeStore';
import { Section } from '../../components/Section';

export type NodeUpdates = {
  model: Partial<ModelItem>;
  view: Partial<ViewItem>;
};

const NAME_MAX_LENGTH = 50;

interface SteppedSliderProps {
  label: string;
  help: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

// Slider + numeric stepper for the label height / icon size controls — lets
// users drag for a rough value or type/step to an exact one, with the
// min/max range always visible instead of implied by the slider alone.
const SteppedSlider = ({
  label,
  help,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  disabled
}: SteppedSliderProps) => {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  return (
    <Stack direction="row" alignItems="flex-start" spacing={2}>
      <Box sx={{ flex: 1 }}>
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            {label}
          </Typography>
          <Tooltip title={help}>
            <IconHelpCircle size={16} style={{ opacity: 0.6 }} />
          </Tooltip>
        </Stack>
        <Slider
          marks
          step={step}
          min={min}
          max={max}
          value={value}
          onChange={(e, newValue) => onChange(newValue as number)}
          disabled={disabled}
        />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            {min}{unit}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {max}{unit}
          </Typography>
        </Stack>
      </Box>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ pt: 3.5 }}>
        <MUIIconButton size="small" onClick={() => onChange(clamp(value - step))} disabled={disabled}>
          <IconMinus size={14} />
        </MUIIconButton>
        <TextField
          size="small"
          type="number"
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange(clamp(n));
          }}
          InputProps={{
            endAdornment: <InputAdornment position="end">{unit}</InputAdornment>
          }}
          sx={{ width: 90 }}
          disabled={disabled}
        />
        <MUIIconButton size="small" onClick={() => onChange(clamp(value + step))} disabled={disabled}>
          <IconPlus size={14} />
        </MUIIconButton>
      </Stack>
    </Stack>
  );
};

interface Props {
  node: ViewItem;
  onModelItemUpdated: (updates: Partial<ModelItem>) => void;
  onViewItemUpdated: (updates: Partial<ViewItem>) => void;
}

export const NodeSettings = ({
  node,
  onModelItemUpdated,
  onViewItemUpdated
}: Props) => {
  const modelItem = useModelItem(node.id);
  const modelActions = useModelStore((state) => state.actions);
  const icons = useModelStore((state) => state.icons);
  const isReadOnly = useUiStateStore((state) => state.editorMode !== 'EDITABLE');
  const { t } = useTranslation();

  // Local state for smooth slider interaction
  const currentIcon = icons.find(icon => icon.id === modelItem?.icon);
  const [localScale, setLocalScale] = useState(currentIcon?.scale || 0.7);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Update local scale when icon changes
  useEffect(() => {
    setLocalScale(currentIcon?.scale || 0.7);
  }, [currentIcon?.scale]);

  // Debounced update to store
  const updateIconScale = useCallback((scale: number) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const updatedIcons = icons.map(icon =>
        icon.id === modelItem?.icon
          ? { ...icon, scale }
          : icon
      );
      modelActions.set({ icons: updatedIcons });
    }, 100); // 100ms debounce
  }, [icons, modelItem?.icon, modelActions]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  if (!modelItem) {
    return null;
  }

  const nameLength = modelItem.name.length;
  const isNameValid = nameLength > 0 && nameLength <= NAME_MAX_LENGTH;

  return (
    <>
      <Section sx={{ pb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {t('itemControls.node.basicInfoSection')}
        </Typography>
      </Section>
      <Section sx={{ pt: 0 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              textTransform="uppercase"
              sx={{ mb: 1 }}
            >
              {t('itemControls.node.name')}
            </Typography>
            <TextField
              fullWidth
              value={modelItem.name}
              onChange={(e) => {
                const text = e.target.value.slice(0, NAME_MAX_LENGTH);
                if (modelItem.name !== text) onModelItemUpdated({ name: text });
              }}
              disabled={isReadOnly}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Typography variant="caption" color="text.secondary">
                        {nameLength} / {NAME_MAX_LENGTH}
                      </Typography>
                      {isNameValid && <IconCheck size={16} color="#2e7d32" />}
                    </Stack>
                  </InputAdornment>
                )
              }}
            />
          </Box>
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              textTransform="uppercase"
              sx={{ mb: 1 }}
            >
              {t('itemControls.node.description')}
            </Typography>
            <RichTextEditor
              value={modelItem.description}
              onChange={(text) => {
                if (modelItem.description !== text)
                  onModelItemUpdated({ description: text });
              }}
              readOnly={isReadOnly}
            />
          </Box>
        </Stack>
      </Section>

      <Divider sx={{ mx: 3, mt: 2 }} />

      <Section sx={{ pb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {t('itemControls.node.appearanceSection')}
        </Typography>
      </Section>
      <Section sx={{ pt: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {t('itemControls.node.appearanceSectionDescription')}
        </Typography>
        <Stack spacing={2.5}>
          {modelItem.name && (
            <SteppedSlider
              label={t('itemControls.node.labelHeight')}
              help={t('itemControls.node.labelHeightHelp')}
              value={node.labelHeight ?? 80}
              min={60}
              max={280}
              step={20}
              unit="px"
              onChange={(labelHeight) => onViewItemUpdated({ labelHeight })}
              disabled={isReadOnly}
            />
          )}
          <SteppedSlider
            label={t('itemControls.node.iconSize')}
            help={t('itemControls.node.iconSizeHelp')}
            value={Math.round(localScale * 100)}
            min={30}
            max={150}
            step={10}
            unit="%"
            onChange={(pct) => {
              const scale = pct / 100;
              setLocalScale(scale);
              updateIconScale(scale);
            }}
            disabled={isReadOnly}
          />

          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
              {t('itemControls.node.labelDisplayMode')}
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={node.labelDisplayMode ?? 'ALWAYS'}
              onChange={(_e, value) => {
                if (value) onViewItemUpdated({ labelDisplayMode: value });
              }}
              disabled={isReadOnly}
            >
              <ToggleButton value="ALWAYS">
                {t('itemControls.node.labelDisplayAlways')}
              </ToggleButton>
              <ToggleButton value="HOVER">
                {t('itemControls.node.labelDisplayHover')}
              </ToggleButton>
              <ToggleButton value="HIDDEN">
                {t('itemControls.node.labelDisplayHidden')}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

        </Stack>
      </Section>
    </>
  );
};
