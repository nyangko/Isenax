import React, { useState, useCallback, useMemo } from 'react';
import { Menu, Typography, Divider, Card } from '@mui/material';
import {
  IconMenu2 as MenuIcon,
  IconBrandGithub as GitHubIcon,
  IconFileCode as ExportJsonIcon,
  IconPhoto as ExportImageIcon,
  IconFolderOpen as FolderOpenIcon,
  IconTrash as DeleteOutlineIcon,
  IconSettings as SettingsIcon
} from '@tabler/icons-react';
import { UiElement } from 'src/components/UiElement/UiElement';
import { IconButton } from 'src/components/IconButton/IconButton';
import { useUiStateStore } from 'src/stores/uiStateStore';
import {
  exportAsJSON,
  exportAsCompactJSON,
  transformFromCompactFormat
} from 'src/utils/exportOptions';
import { modelFromModelStore } from 'src/utils';
import { useInitialDataManager } from 'src/hooks/useInitialDataManager';
import { useModelStore } from 'src/stores/modelStore';
import { useHistory } from 'src/hooks/useHistory';
import { DialogTypeEnum } from 'src/types/ui';
import { MenuItem } from './MenuItem';
import { useTranslation } from 'src/stores/localeStore';

export const MainMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const model = useModelStore((state) => {
    return modelFromModelStore(state);
  });
  const isMainMenuOpen = useUiStateStore((state) => {
    return state.isMainMenuOpen;
  });
  const mainMenuOptions = useUiStateStore((state) => {
    return state.mainMenuOptions;
  });
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const initialDataManager = useInitialDataManager();
  const { clearHistory } = useHistory();

  const { t } = useTranslation('mainMenu');

  const onToggleMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
      uiStateActions.setIsMainMenuOpen(true);
    },
    [uiStateActions]
  );

  const gotoUrl = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

  const { load } = initialDataManager;

  const onOpenModel = useCallback(async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';

    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];

      if (!file) {
        throw new Error('No file selected');
      }

      const fileReader = new FileReader();

      fileReader.onload = async (e) => {
        const rawData = JSON.parse(e.target?.result as string);
        let modelData = rawData;

        // Check format and transform if needed
        if (rawData._?.f === 'compact') {
          modelData = transformFromCompactFormat(rawData);
        }

        load(modelData);
        clearHistory(); // Clear history when loading new model
      };
      fileReader.readAsText(file);

      uiStateActions.resetUiState();
    };

    await fileInput.click();
    uiStateActions.setIsMainMenuOpen(false);
  }, [uiStateActions, load, clearHistory]);

  const onExportAsJSON = useCallback(async () => {
    exportAsJSON(model);
    uiStateActions.setIsMainMenuOpen(false);
  }, [model, uiStateActions]);

  const onExportAsCompactJSON = useCallback(async () => {
    exportAsCompactJSON(model);
    uiStateActions.setIsMainMenuOpen(false);
  }, [model, uiStateActions]);

  const onExportAsImage = useCallback(() => {
    uiStateActions.setIsMainMenuOpen(false);
    uiStateActions.setDialog(DialogTypeEnum.EXPORT_IMAGE);
  }, [uiStateActions]);

  const { clear } = initialDataManager;

  const onClearCanvas = useCallback(() => {
    uiStateActions.setIsMainMenuOpen(false);
    if (!window.confirm(t('clearCanvasConfirm'))) return;

    clear();
    clearHistory(); // Clear history when clearing canvas
  }, [uiStateActions, clear, clearHistory, t]);

  const onOpenSettings = useCallback(() => {
    uiStateActions.setIsMainMenuOpen(false);
    uiStateActions.setDialog(DialogTypeEnum.SETTINGS);
  }, [uiStateActions]);




  const sectionVisibility = useMemo(() => {
    return {
      links: Boolean(
        mainMenuOptions.find((opt) => {
          return opt.includes('LINK');
        })
      ),
      version: Boolean(mainMenuOptions.includes('VERSION'))
    };
  }, [mainMenuOptions]);

  if (mainMenuOptions.length === 0) {
    return null;
  }

  // Built as a list of present-or-absent sections (rather than a fixed chain of
  // <Divider />s) so a divider only ever sits between two sections that both
  // actually rendered -- otherwise excluding e.g. ACTION.SETTINGS via
  // mainMenuOptions leaves two dividers back to back with nothing between them.
  const sections = [
    mainMenuOptions.includes('ACTION.CLEAR_CANVAS') && (
      <MenuItem key="clear-canvas" onClick={onClearCanvas} Icon={<DeleteOutlineIcon size={20} />} danger>
        {t('clearCanvas')}
      </MenuItem>
    ),
    (mainMenuOptions.includes('ACTION.OPEN') ||
      mainMenuOptions.includes('EXPORT.JSON') ||
      mainMenuOptions.includes('EXPORT.JSON_COMPACT') ||
      mainMenuOptions.includes('EXPORT.PNG')) && (
      <React.Fragment key="file-actions">
        {mainMenuOptions.includes('ACTION.OPEN') && (
          <MenuItem onClick={onOpenModel} Icon={<FolderOpenIcon size={20} />}>
            {t('open')}
          </MenuItem>
        )}
        {mainMenuOptions.includes('EXPORT.JSON') && (
          <MenuItem onClick={onExportAsJSON} Icon={<ExportJsonIcon size={20} />}>
            {t('exportJson')}
          </MenuItem>
        )}
        {mainMenuOptions.includes('EXPORT.JSON_COMPACT') && (
          <MenuItem onClick={onExportAsCompactJSON} Icon={<ExportJsonIcon size={20} />}>
            {t('exportCompactJson')}
          </MenuItem>
        )}
        {mainMenuOptions.includes('EXPORT.PNG') && (
          <MenuItem onClick={onExportAsImage} Icon={<ExportImageIcon size={20} />}>
            {t('exportImage')}
          </MenuItem>
        )}
      </React.Fragment>
    ),
    mainMenuOptions.includes('ACTION.SETTINGS') && (
      <MenuItem key="settings" onClick={onOpenSettings} Icon={<SettingsIcon size={20} />}>
        {t('settings')}
      </MenuItem>
    ),
    sectionVisibility.links && mainMenuOptions.includes('LINK.GITHUB') && (
      <MenuItem
        key="github"
        onClick={() => {
          return gotoUrl(`${REPOSITORY_URL}`);
        }}
        Icon={<GitHubIcon size={20} />}
      >
        {t('gitHub')}
      </MenuItem>
    ),
    sectionVisibility.version && (
      <MenuItem key="version">
        <Typography variant="body2" color="text.secondary">
          Isenax v{PACKAGE_VERSION}
        </Typography>
      </MenuItem>
    )
  ].filter(Boolean);

  return (
    <UiElement>
      <IconButton
        Icon={<MenuIcon size={20} />}
        name="Main menu"
        onClick={onToggleMenu}
        isActive={isMainMenuOpen}
      />

      <Menu
        anchorEl={anchorEl}
        open={isMainMenuOpen}
        onClose={() => {
          uiStateActions.setIsMainMenuOpen(false);
        }}
        elevation={0}
        sx={{
          mt: 2
        }}
        MenuListProps={{
          sx: {
            minWidth: '250px',
            py: 0
          }
        }}
      >
        <Card sx={{ py: 1 }}>
          {sections.map((section, index) => {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <React.Fragment key={index}>
                {index > 0 && <Divider />}
                {section}
              </React.Fragment>
            );
          })}
        </Card>
      </Menu>
    </UiElement>
  );
};
