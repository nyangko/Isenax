import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tabs,
  Tab,
  Box
} from '@mui/material';
import { IconX as CloseIcon } from '@tabler/icons-react';
import { useUiStateStore } from 'src/stores/uiStateStore';
import { HotkeySettings } from '../HotkeySettings/HotkeySettings';
import { PanSettings } from '../PanSettings/PanSettings';
import { ZoomSettings } from '../ZoomSettings/ZoomSettings';
import { LabelSettings } from '../LabelSettings/LabelSettings';
import { ConnectorSettings } from '../ConnectorSettings/ConnectorSettings';
import { IconPackSettings } from '../IconPackSettings/IconPackSettings';
import { MCPSettings } from '../MCPSettings/MCPSettings';
import { SkillsSettings } from '../SkillsSettings/SkillsSettings';
import { useTranslation } from 'src/stores/localeStore';
import { clickStopperProps } from 'src/utils';
import { MCPManagerProps } from 'src/types';

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

export const SettingsDialog = ({ iconPackManager, mcpManager }: SettingsDialogProps) => {
  const dialog = useUiStateStore((state) => state.dialog);
  const setDialog = useUiStateStore((state) => state.actions.setDialog);
  const [tabValue, setTabValue] = useState(0);
  const { t } = useTranslation();

  const isOpen = dialog === 'SETTINGS';

  const handleClose = () => {
    setDialog(null);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Array-driven so tab index and content always line up, even as
  // conditional tabs (icon packs, MCP) are added/removed above others.
  type TabDef = { label: string; content: React.ReactNode };
  const tabs: TabDef[] = [
    { label: t('settings.hotkeys.title'), content: <HotkeySettings /> },
    { label: t('settings.pan.title'), content: <PanSettings /> },
    { label: t('settings.zoom.title'), content: <ZoomSettings /> },
    { label: t('settings.labels.title'), content: <LabelSettings /> },
    { label: t('settings.connector.title'), content: <ConnectorSettings /> },
    { label: t('settings.skills.title'), content: <SkillsSettings /> },
    ...(iconPackManager
      ? [
          {
            label: t('settings.iconPacks.title'),
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
      : []),
    ...(mcpManager ? [{ label: t('settings.mcp.title'), content: <MCPSettings mcpManager={mcpManager} /> }] : [])
  ];

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      {...clickStopperProps}
    >
      <DialogTitle>
        {t('mainMenu.settings')}
        <IconButton
          aria-label={t('helpDialog.close')}
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabs.map((tab) => (
            <Tab key={tab.label} label={tab.label} />
          ))}
        </Tabs>

        <Box sx={{ mt: 2 }}>{tabs[tabValue]?.content}</Box>
      </DialogContent>
    </Dialog>
  );
};