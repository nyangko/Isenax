import React from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  FormControlLabel,
  Switch,
  Checkbox,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Avatar
} from '@mui/material';
import { IconStack2 } from '@tabler/icons-react';
import { useTranslation } from 'src/stores/localeStore';
import { ICON_PACK_BRAND_LOGOS } from 'src/config/iconPackBrandLogos';

const PACK_BRAND_COLORS: Record<string, string> = {
  aws: '#FF9900',
  gcp: '#4285F4',
  azure: '#0078D4',
  kubernetes: '#326CE5'
};

// Each pack's own logo icon (extracted from its icons[0] entry, see
// iconPackBrandLogos.ts) so the list is scannable by the real mark instead
// of a generic placeholder. Falls back to an initial badge for any pack
// name we don't have a logo for.
const PackBadge = ({ name, displayName }: { name: string; displayName: string }) => {
  const logo = ICON_PACK_BRAND_LOGOS[name];

  return (
    <Avatar
      variant="rounded"
      src={logo}
      sx={{
        width: 32,
        height: 32,
        fontSize: '0.8rem',
        fontWeight: 700,
        bgcolor: logo ? 'background.paper' : (PACK_BRAND_COLORS[name] ?? 'grey.500'),
        border: logo ? 1 : 0,
        borderColor: 'divider',
        '& img': { objectFit: 'contain', p: 0.5 }
      }}
    >
      {displayName.trim().charAt(0).toUpperCase() || '?'}
    </Avatar>
  );
};

export interface IconPackSettingsProps {
  lazyLoadingEnabled: boolean;
  onToggleLazyLoading: (enabled: boolean) => void;
  packInfo: Array<{
    name: string;
    displayName: string;
    loaded: boolean;
    loading: boolean;
    error: string | null;
    iconCount: number;
  }>;
  enabledPacks: string[];
  onTogglePack: (packName: string, enabled: boolean) => void;
}

export const IconPackSettings: React.FC<IconPackSettingsProps> = ({
  lazyLoadingEnabled,
  onToggleLazyLoading,
  packInfo,
  enabledPacks,
  onTogglePack
}) => {
  const { t } = useTranslation();

  const handleLazyLoadingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onToggleLazyLoading(event.target.checked);
  };

  const handlePackToggle = (packName: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onTogglePack(packName, event.target.checked);
  };

  return (
    <Box>
      {/* Lazy Loading Toggle */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <FormControl component="fieldset" fullWidth>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <FormLabel component="legend" sx={{ fontWeight: 600, mb: 0.5 }}>
                {t('settings.iconPacks.lazyLoading')}
              </FormLabel>
              <Typography variant="body2" color="text.secondary">
                {t('settings.iconPacks.lazyLoadingDesc')}
              </Typography>
            </Box>
            <Switch
              checked={lazyLoadingEnabled}
              onChange={handleLazyLoadingChange}
              color="primary"
            />
          </Box>
        </FormControl>
      </Paper>

      {/* Core Isoflow (Always Loaded) */}
      <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'action.hover' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar variant="rounded" sx={{ width: 32, height: 32, bgcolor: 'grey.700' }}>
              <IconStack2 size={18} />
            </Avatar>
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {t('settings.iconPacks.coreIsoflow')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('settings.iconPacks.alwaysEnabled')}
              </Typography>
            </Box>
          </Box>
          <Checkbox checked disabled />
        </Box>
      </Paper>

      {/* Available Icon Packs */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
          {t('settings.iconPacks.availablePacks')}
        </Typography>

        {!lazyLoadingEnabled && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('settings.iconPacks.lazyLoadingDisabledNote')}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {packInfo.map((pack) => (
            <Paper key={pack.name} variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                  <PackBadge name={pack.name} displayName={pack.displayName} />
                  <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {pack.displayName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    {pack.loading && (
                      <>
                        <CircularProgress size={14} />
                        <Typography variant="caption" color="text.secondary">
                          {t('settings.iconPacks.loading')}
                        </Typography>
                      </>
                    )}
                    {pack.loaded && !pack.loading && (
                      <Typography variant="caption" color="success.main">
                        {t('settings.iconPacks.loaded')} • {t('settings.iconPacks.iconCount').replace('{count}', String(pack.iconCount))}
                      </Typography>
                    )}
                    {pack.error && (
                      <Typography variant="caption" color="error">
                        {pack.error}
                      </Typography>
                    )}
                    {!pack.loaded && !pack.loading && !pack.error && (
                      <Typography variant="caption" color="text.secondary">
                        {t('settings.iconPacks.notLoaded')}
                      </Typography>
                    )}
                  </Box>
                  </Box>
                </Box>
                <Checkbox
                  checked={enabledPacks.includes(pack.name) || !lazyLoadingEnabled}
                  onChange={handlePackToggle(pack.name)}
                  disabled={!lazyLoadingEnabled || pack.loading}
                />
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="body2" color="text.secondary">
        {t('settings.iconPacks.note')}
      </Typography>
    </Box>
  );
};
