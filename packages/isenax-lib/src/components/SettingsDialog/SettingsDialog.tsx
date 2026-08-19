import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button
} from '@mui/material';
import {
  IconX as CloseIcon,
  IconSearch as SearchIcon,
  IconRestore as ResetIcon,
  IconKeyboard as HotkeysIcon,
  IconArrowsMove as PanIcon,
  IconZoomIn as ZoomIcon,
  IconTag as LabelsIcon,
  IconRoute as ConnectorIcon,
  IconLayoutNavbar as ToolbarIcon,
  IconPhoto as IconPacksIcon,
  IconPlugConnected as MCPIcon
} from '@tabler/icons-react';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { HotkeySettings } from '../HotkeySettings/HotkeySettings';
import { PanSettings } from '../PanSettings/PanSettings';
import { ZoomSettings } from '../ZoomSettings/ZoomSettings';
import { LabelSettings } from '../LabelSettings/LabelSettings';
import { ConnectorSettings } from '../ConnectorSettings/ConnectorSettings';
import { ToolbarSettings } from '../ToolbarSettings/ToolbarSettings';
import { IconPackSettings } from '../IconPackSettings/IconPackSettings';
import { MCPSettings } from '../MCPSettings/MCPSettings';
import { useTranslation } from 'src/stores/localeStore';
import { clickStopperProps } from 'src/utils';
import { MCPManagerProps, ConnectorInteractionMode, ToolbarPositionEnum } from 'src/types';
import { DEFAULT_HOTKEY_PROFILE, HotkeyProfile } from 'src/config/hotkeys';
import { DEFAULT_PAN_SETTINGS, PanSettings as PanSettingsType } from 'src/config/panSettings';
import { DEFAULT_ZOOM_SETTINGS, ZoomSettings as ZoomSettingsType } from 'src/config/zoomSettings';
import { DEFAULT_LABEL_SETTINGS, LabelSettings as LabelSettingsType } from 'src/config/labelSettings';

export interface SettingsDialogProps {
  iconPackManager?: {
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
  };
  mcpManager?: MCPManagerProps;
}

// Snapshot of every store-backed setting the dialog can revert on Cancel.
// Icon-pack/MCP toggles are excluded -- they trigger real side effects
// (loading a pack, starting/stopping the MCP server) that shouldn't be
// silently undone by a settings-dialog Cancel.
interface SettingsSnapshot {
  hotkeyProfile: HotkeyProfile;
  panSettings: PanSettingsType;
  zoomSettings: ZoomSettingsType;
  labelSettings: LabelSettingsType;
  connectorInteractionMode: ConnectorInteractionMode;
  connectorAnimationEnabled: boolean;
  connectorAnimationSpeed: number;
  toolbarPosition: keyof typeof ToolbarPositionEnum;
}

export const SettingsDialog = ({ iconPackManager, mcpManager }: SettingsDialogProps) => {
  const dialog = useUiStateStore((state) => state.dialog);
  const setDialog = useUiStateStore((state) => state.actions.setDialog);
  const uiStateActions = useUiStateStore((state) => state.actions);
  const hotkeyProfile = useUiStateStore((state) => state.hotkeyProfile);
  const panSettings = useUiStateStore((state) => state.panSettings);
  const zoomSettings = useUiStateStore((state) => state.zoomSettings);
  const labelSettings = useUiStateStore((state) => state.labelSettings);
  const connectorInteractionMode = useUiStateStore((state) => state.connectorInteractionMode);
  const connectorAnimationEnabled = useUiStateStore((state) => state.connectorAnimationEnabled);
  const connectorAnimationSpeed = useUiStateStore((state) => state.connectorAnimationSpeed);
  const toolbarPosition = useUiStateStore((state) => state.toolbarPosition);

  const [sectionId, setSectionId] = useState('hotkeys');
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const snapshotRef = useRef<SettingsSnapshot | null>(null);
  const { t } = useTranslation();

  const isOpen = dialog === 'SETTINGS';

  // Snapshot every revertible setting the moment the dialog opens, so
  // Cancel can restore exactly this state regardless of what changed while
  // it was open.
  useEffect(() => {
    if (isOpen) {
      snapshotRef.current = {
        hotkeyProfile,
        panSettings,
        zoomSettings,
        labelSettings,
        connectorInteractionMode,
        connectorAnimationEnabled,
        connectorAnimationSpeed,
        toolbarPosition
      };
      setQuery('');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const discardChanges = () => {
    const snapshot = snapshotRef.current;
    if (!snapshot) return;

    uiStateActions.setHotkeyProfile(snapshot.hotkeyProfile);
    uiStateActions.setPanSettings(snapshot.panSettings);
    uiStateActions.setZoomSettings(snapshot.zoomSettings);
    uiStateActions.setLabelSettings(snapshot.labelSettings);
    uiStateActions.setConnectorInteractionMode(snapshot.connectorInteractionMode);
    uiStateActions.setConnectorAnimationEnabled(snapshot.connectorAnimationEnabled);
    uiStateActions.setConnectorAnimationSpeed(snapshot.connectorAnimationSpeed);
    uiStateActions.setToolbarPosition(snapshot.toolbarPosition);
  };

  const handleCancel = () => {
    discardChanges();
    setDialog(null);
  };

  const handleSave = () => {
    setDialog(null);
  };

  type SectionDef = {
    id: string;
    icon: React.ReactNode;
    titleKey: string;
    descriptionKey?: string;
    content: React.ReactNode;
    onReset?: () => void;
  };
  type GroupDef = { labelKey: string; items: SectionDef[] };

  const groups: GroupDef[] = [
    {
      labelKey: 'settings.shell.groupTasks',
      items: [
        {
          id: 'hotkeys',
          icon: <HotkeysIcon size={18} />,
          titleKey: 'settings.hotkeys.title',
          content: <HotkeySettings />,
          onReset: () => uiStateActions.setHotkeyProfile(DEFAULT_HOTKEY_PROFILE)
        },
        {
          id: 'pan',
          icon: <PanIcon size={18} />,
          titleKey: 'settings.pan.title',
          content: <PanSettings />,
          onReset: () => uiStateActions.setPanSettings(DEFAULT_PAN_SETTINGS)
        },
        {
          id: 'zoom',
          icon: <ZoomIcon size={18} />,
          titleKey: 'settings.zoom.title',
          descriptionKey: 'settings.zoom.description',
          content: <ZoomSettings />,
          onReset: () => uiStateActions.setZoomSettings(DEFAULT_ZOOM_SETTINGS)
        }
      ]
    },
    {
      labelKey: 'settings.shell.groupDisplay',
      items: [
        {
          id: 'labels',
          icon: <LabelsIcon size={18} />,
          titleKey: 'settings.labels.title',
          descriptionKey: 'settings.labels.description',
          content: <LabelSettings />,
          onReset: () => uiStateActions.setLabelSettings(DEFAULT_LABEL_SETTINGS)
        },
        {
          id: 'connector',
          icon: <ConnectorIcon size={18} />,
          titleKey: 'settings.connector.title',
          content: <ConnectorSettings />,
          onReset: () => {
            uiStateActions.setConnectorInteractionMode('click');
            uiStateActions.setConnectorAnimationEnabled(true);
            uiStateActions.setConnectorAnimationSpeed(220);
          }
        },
        {
          id: 'toolbar',
          icon: <ToolbarIcon size={18} />,
          titleKey: 'settings.toolbar.title',
          descriptionKey: 'settings.toolbar.description',
          content: <ToolbarSettings />,
          onReset: () => uiStateActions.setToolbarPosition('TOP')
        }
      ]
    },
    {
      labelKey: 'settings.shell.groupResources',
      items: iconPackManager
        ? [
            {
              id: 'iconPacks',
              icon: <IconPacksIcon size={18} />,
              titleKey: 'settings.iconPacks.title',
              content: (
                <IconPackSettings
                  lazyLoadingEnabled={iconPackManager.lazyLoadingEnabled}
                  onToggleLazyLoading={iconPackManager.onToggleLazyLoading}
                  packInfo={iconPackManager.packInfo}
                  enabledPacks={iconPackManager.enabledPacks}
                  onTogglePack={iconPackManager.onTogglePack}
                />
              )
            }
          ]
        : []
    },
    {
      labelKey: 'settings.shell.groupExtensions',
      items: mcpManager
        ? [
            {
              id: 'mcp',
              icon: <MCPIcon size={18} />,
              titleKey: 'settings.mcp.title',
              descriptionKey: 'settings.mcp.description',
              content: <MCPSettings mcpManager={mcpManager} />
            }
          ]
        : []
    }
  ].filter((group) => group.items.length > 0);

  const allSections = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const activeSection = allSections.find((section) => section.id === sectionId) ?? allSections[0];

  const normalizedQuery = query.trim().toLowerCase();
  const filteredGroups = normalizedQuery
    ? groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            t(item.titleKey as Parameters<typeof t>[0]).toLowerCase().includes(normalizedQuery)
          )
        }))
        .filter((group) => group.items.length > 0)
    : groups;

  useEffect(() => {
    if (!isOpen) return;
    if (allSections.length > 0 && !allSections.some((section) => section.id === sectionId)) {
      setSectionId(allSections[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, allSections.length]);

  const handleDialogClose = () => {
    handleCancel();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleDialogClose}
      maxWidth={false}
      fullWidth
      {...clickStopperProps}
      PaperProps={{ sx: { width: 800, maxWidth: 800, height: '82vh', maxHeight: 640 } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', p: 3, pb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {t('mainMenu.settings')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('settings.shell.subtitle')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            inputRef={searchRef}
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('settings.shell.searchPlaceholder')}
            sx={{ width: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon size={16} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    ⌘K
                  </Typography>
                </InputAdornment>
              )
            }}
          />
          <IconButton aria-label={t('helpDialog.close')} onClick={handleDialogClose}>
            <CloseIcon size={20} />
          </IconButton>
        </Box>
      </Box>

      <DialogContent dividers sx={{ display: 'flex', p: 0, overflow: 'hidden' }}>
        <Box
          sx={{
            width: 180,
            flexShrink: 0,
            borderRight: 1,
            borderColor: 'divider',
            overflowY: 'auto',
            p: 1.5
          }}
        >
          {filteredGroups.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
              {t('settings.shell.searchNoResults').replace('{query}', query)}
            </Typography>
          )}
          {filteredGroups.map((group, groupIndex) => (
            <Box key={group.labelKey} sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ px: 1.5, display: 'block', fontWeight: 600, mt: groupIndex > 0 ? 1 : 0 }}
              >
                {t(group.labelKey as Parameters<typeof t>[0])}
              </Typography>
              <List dense disablePadding>
                {group.items.map((item) => (
                  <ListItemButton
                    key={item.id}
                    selected={activeSection?.id === item.id}
                    onClick={() => setSectionId(item.id)}
                    sx={{ borderRadius: 1.5, mx: 0.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={t(item.titleKey as Parameters<typeof t>[0])}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          ))}
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          {activeSection && (
            <>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t(activeSection.titleKey as Parameters<typeof t>[0])}
              </Typography>
              {activeSection.descriptionKey && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
                  {t(activeSection.descriptionKey as Parameters<typeof t>[0])}
                </Typography>
              )}
              {!activeSection.descriptionKey && <Box sx={{ mb: 2.5 }} />}
              {activeSection.content}
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        {activeSection?.onReset ? (
          <Button
            startIcon={<ResetIcon size={16} />}
            onClick={activeSection.onReset}
            color="inherit"
          >
            {t('settings.shell.resetDefaults')}
          </Button>
        ) : (
          <Box />
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleCancel} color="inherit">
            {t('settings.shell.cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained">
            {t('settings.shell.save')}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
