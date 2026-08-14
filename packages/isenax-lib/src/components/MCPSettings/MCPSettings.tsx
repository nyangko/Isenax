import React, { useState } from 'react';
import {
  Box,
  Paper,
  Switch,
  FormControl,
  FormLabel,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { IconCopy as CopyIcon, IconCheck as CheckIcon } from '@tabler/icons-react';
import { MCPManagerProps } from 'src/types';
import { useTranslation } from 'src/stores/localeStore';

export interface MCPSettingsProps {
  mcpManager: MCPManagerProps;
}

const useCopy = (value: string) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return { copied, handleCopy };
};

const CopyField = ({ label, value }: { label: string; value: string }) => {
  const { t } = useTranslation();
  const { copied, handleCopy } = useCopy(value);

  return (
    <TextField
      label={label}
      value={value}
      size="small"
      fullWidth
      InputProps={{
        readOnly: true,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={handleCopy} size="small" title={t('settings.mcp.copy')}>
              {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
            </IconButton>
          </InputAdornment>
        )
      }}
      sx={{ mt: 1 }}
    />
  );
};

const CopyConfigBlock = ({ url, token }: { url: string; token: string }) => {
  const { t } = useTranslation();
  const config = JSON.stringify(
    { mcpServers: { isenax: { url, headers: { Authorization: `Bearer ${token}` } } } },
    null,
    2
  );
  const { copied, handleCopy } = useCopy(config);

  return (
    <Box sx={{ mt: 2, position: 'relative' }}>
      <Typography variant="caption" color="text.secondary">
        {t('settings.mcp.clientConfig')}
      </Typography>
      <TextField
        value={config}
        size="small"
        fullWidth
        multiline
        minRows={6}
        InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
        sx={{ mt: 0.5 }}
      />
      <IconButton
        onClick={handleCopy}
        size="small"
        title={t('settings.mcp.copy')}
        sx={{ position: 'absolute', top: 28, right: 8 }}
      >
        {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
      </IconButton>
    </Box>
  );
};

export const MCPSettings: React.FC<MCPSettingsProps> = ({ mcpManager }) => {
  const { t } = useTranslation();
  const { available, enabled, url, token, loading, onToggle } = mcpManager;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('settings.mcp.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {t('settings.mcp.description')}
      </Typography>

      {!available && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t('settings.mcp.unavailable')}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
        <FormControl component="fieldset" fullWidth>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <FormLabel component="legend" sx={{ fontWeight: 600 }}>
              {t('settings.mcp.enable')}
            </FormLabel>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Switch
                checked={enabled}
                disabled={!available}
                onChange={(e) => onToggle(e.target.checked)}
                color="primary"
              />
            )}
          </Box>
        </FormControl>

        {enabled && url && token && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="success.main">
              {t('settings.mcp.available')}
            </Typography>
            <CopyField label={t('settings.mcp.url')} value={url} />
            <CopyField label={t('settings.mcp.token')} value={token} />
            <CopyConfigBlock url={url} token={token} />
          </Box>
        )}
      </Paper>
    </Box>
  );
};
