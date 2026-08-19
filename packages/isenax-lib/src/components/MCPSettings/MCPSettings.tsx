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
  CircularProgress,
  Chip,
  Stack
} from '@mui/material';
import { IconCopy as CopyIcon, IconCheck as CheckIcon, IconTool } from '@tabler/icons-react';
import { MCPManagerProps } from 'src/types';
import { useTranslation } from 'src/stores/localeStore';

export interface MCPSettingsProps {
  mcpManager: MCPManagerProps;
}

// Mirrors the tools registered in packages/isenax-mcp/src/server.js -- these
// are what a connected AI agent can actually call. Names/descriptions
// intentionally stay in English: they're the literal MCP tool identifiers
// and protocol docs an agent reads, same as the raw JSON in the client-config
// block below.
const MCP_TOOLS = [
  { id: 'list_diagrams', description: 'List all stored diagrams (id, title, last modified, size).' },
  { id: 'get_diagram', description: 'Fetch a full diagram model by id.' },
  { id: 'create_diagram', description: 'Create a new diagram from a model JSON object.' },
  { id: 'update_diagram', description: 'Replace an existing diagram with a new model (full replace).' },
  { id: 'update_diagram_patch', description: 'Partially update a diagram, merging only the fields that changed.' },
  { id: 'delete_diagram', description: 'Delete a diagram by id.' }
];

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
      {!available && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('settings.mcp.unavailable')}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 2 }}>
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

      {available && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            {t('settings.mcp.availableTools')}
          </Typography>
          <Stack spacing={1}>
            {MCP_TOOLS.map((tool) => (
              <Paper key={tool.id} variant="outlined" sx={{ p: 1.5, opacity: enabled ? 1 : 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconTool size={16} />
                  <Chip label={tool.id} size="small" sx={{ fontFamily: 'monospace', fontWeight: 600 }} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  {tool.description}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};
