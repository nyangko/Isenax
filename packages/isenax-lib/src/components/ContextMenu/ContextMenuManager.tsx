import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IconCopy as ContentCopyIcon,
  IconClipboardText as ContentPasteIcon,
  IconCopyPlus as DuplicateIcon,
  IconPlus as AddNodeIcon,
  IconRectangle as AddRectangleIcon,
  IconRoute as AddConnectorIcon,
  IconPencil as EditIcon,
  IconTrash as DeleteIcon,
  IconStack as ChildViewIcon
} from '@tabler/icons-react';
import { useUiStateStore, useUiStateStoreApi } from 'src/stores/uiStateStore';
import { generateId, findNearestUnoccupiedTile, getItemById } from 'src/utils';
import { useScene } from 'src/hooks/useScene';
import { useView } from 'src/hooks/useView';
import { useModelStore } from 'src/stores/modelStore';
import { VIEW_ITEM_DEFAULTS } from 'src/config';
import { useTranslation } from 'src/stores/localeStore';
import { Connector as ConnectorI, Coords } from 'src/types';
import { ContextMenu } from './ContextMenu';

interface Props {
  anchorEl?: HTMLElement | null;
}

export const ContextMenuManager = ({ anchorEl }: Props) => {
  const scene = useScene();
  const { t } = useTranslation('contextMenu');
  const model = useModelStore((state) => {
    return state;
  });
  const contextMenu = useUiStateStore((state) => {
    return state.contextMenu;
  });
  const uiStateActions = useUiStateStore((state) => {
    return state.actions;
  });
  const uiStateApi = useUiStateStoreApi();
  const { changeView } = useView();

  const [ menuItemsBeforeClosing, setMenuItemsBeforeClosing ] = useState<
    { label?: string; onClick?: () => void; Icon?: React.ReactNode; shortcut?: string; isDivider?: boolean }[]
  >([{ label: '', onClick:() => {} }]);

  const onClose = useCallback(() => {
    uiStateActions.setContextMenu(null);
  }, [uiStateActions]);

  // Shared by the empty-space menu and the connector menu (right-clicking a
  // connector should let you drop a node at that spot too).
  const buildAddNodeItem = useCallback((tile: Coords) => ({
    label: t('addNode'),
    Icon: <AddNodeIcon size={20} />,
    onClick: () => {
      if (model.icons.length > 0) {
        const modelItemId = generateId();
        const firstIcon = model.icons[0];
        const targetTile = findNearestUnoccupiedTile(tile, scene) || tile;

        scene.placeIcon({
          modelItem: {
            id: modelItemId,
            name: 'Untitled',
            icon: firstIcon.id
          },
          viewItem: {
            ...VIEW_ITEM_DEFAULTS,
            id: modelItemId,
            tile: targetTile
          }
        });
      }
      onClose();
    }
  }), [model.icons, scene, onClose, t]);

  const menuItems = useMemo(() => {
    if (!contextMenu) return menuItemsBeforeClosing;
    const uiState = uiStateApi.getState();

    if (contextMenu.type === 'SELECTION') {
      return [
        {
          label: t('copySelection'),
          Icon: <ContentCopyIcon size={20} />,
          shortcut: 'Ctrl+C',
          onClick: () => {
            scene.copyObjectsToClipboard(uiState);
            onClose();
          }
        },
        {
          label: t('deleteSelection'),
          Icon: <DeleteIcon size={20} />,
          onClick: () => {
            scene.deleteObjects(uiState);
            onClose();
          }
        }
      ]
    } else if (contextMenu.type === 'ITEM' && contextMenu.item?.type === 'CONNECTOR') {
      // No "copy" option here — copying a connector on its own (detached from
      // the nodes it links) isn't a meaningful operation, unlike nodes/
      // rectangles/text. This case used to fall through to whatever menu was
      // shown previously (e.g. a stale "Copy Node"); now it's handled directly.
      const connectorId = contextMenu.item.id;

      return [
        {
          label: t('addConnector'),
          Icon: <AddConnectorIcon size={20} />,
          onClick: () => {
            const newConnector: ConnectorI = {
              id: generateId(),
              color: scene.colors[0].id,
              anchors: [
                { id: generateId(), ref: { tile: contextMenu.tile } },
                { id: generateId(), ref: { tile: contextMenu.tile } }
              ]
            };

            scene.createConnector(newConnector);

            uiStateActions.setMode({
              type: 'CONNECTOR',
              showCursor: true,
              id: newConnector.id,
              startAnchor: { tile: contextMenu.tile },
              isConnecting: true
            });

            onClose();
          }
        },
        buildAddNodeItem(contextMenu.tile),
        { isDivider: true },
        {
          label: t('editConnector'),
          Icon: <EditIcon size={20} />,
          onClick: () => {
            uiStateActions.setItemControls({ type: 'CONNECTOR', id: connectorId });
            onClose();
          }
        },
        {
          label: t('deleteConnector'),
          Icon: <DeleteIcon size={20} />,
          onClick: () => {
            scene.deleteConnector(connectorId);
            onClose();
          }
        },
        // Several connector paths can cross the same tile — when that's the
        // case, offer group actions instead of only acting on whichever one
        // getItemAtTile happened to pick.
        ...(contextMenu.groupIds ? [
          {
            label: t('editConnectorsHere').replace('{count}', String(contextMenu.groupIds.length)),
            Icon: <EditIcon size={20} />,
            onClick: () => {
              uiStateActions.setItemControls({
                type: 'CONNECTOR_GROUP',
                ids: contextMenu.groupIds!,
                focusedId: null
              });
              onClose();
            }
          },
          {
            label: t('deleteConnectorsHere').replace('{count}', String(contextMenu.groupIds.length)),
            Icon: <DeleteIcon size={20} />,
            onClick: () => {
              const ids = contextMenu.groupIds!;
              scene.transaction(() => {
                ids.forEach((id) => scene.deleteConnector(id));
              });
              onClose();
            }
          }
        ] : [])
      ];
    } else if (contextMenu.type === 'ITEM' && contextMenu.item) {
      const { type } = contextMenu.item;
      const copyLabel =
        type === 'ITEM' ? t('copyNode') :
        type === 'RECTANGLE' ? t('copyRectangle') :
        type === 'TEXTBOX' ? t('copyText') :
        undefined;
      const duplicateLabel =
        type === 'ITEM' ? t('duplicateNode') :
        type === 'RECTANGLE' ? t('duplicateRectangle') :
        type === 'TEXTBOX' ? t('duplicateText') :
        undefined;

        if (!copyLabel) return menuItemsBeforeClosing;

      const itemMenuItems: { label?: string; onClick?: () => void; Icon?: React.ReactNode; shortcut?: string; isDivider?: boolean }[] = [];

      const editItem =
        type === 'ITEM' ? {
          label: t('editNode'),
          Icon: <EditIcon size={20} />,
          onClick: () => {
            uiStateActions.setItemControls({ type: 'ITEM', id: contextMenu.item!.id });
            onClose();
          }
        } :
        type === 'RECTANGLE' ? {
          label: t('editRectangle'),
          Icon: <EditIcon size={20} />,
          onClick: () => {
            uiStateActions.setItemControls({ type: 'RECTANGLE', id: contextMenu.item!.id });
            onClose();
          }
        } :
        type === 'TEXTBOX' ? {
          label: t('editText'),
          Icon: <EditIcon size={20} />,
          onClick: () => {
            uiStateActions.setItemControls({ type: 'TEXTBOX', id: contextMenu.item!.id });
            onClose();
          }
        } :
        undefined;

      const viewItem =
        type === 'ITEM'
          ? getItemById(scene.items, contextMenu.item.id)?.value
          : undefined;

      const deleteItem =
        // Anchor items mark "this view is the detail of that item" and can't
        // be deleted -- hide the option entirely rather than show it and no-op.
        type === 'ITEM' && !viewItem?.anchor ? {
          label: t('deleteNode'),
          Icon: <DeleteIcon size={20} />,
          onClick: () => {
            uiStateActions.setItemControls(null);
            scene.deleteViewItem(contextMenu.item!.id);
            onClose();
          }
        } :
        type === 'RECTANGLE' ? {
          label: t('deleteRectangle'),
          Icon: <DeleteIcon size={20} />,
          onClick: () => {
            uiStateActions.setItemControls(null);
            scene.deleteRectangle(contextMenu.item!.id);
            onClose();
          }
        } :
        type === 'TEXTBOX' ? {
          label: t('deleteText'),
          Icon: <DeleteIcon size={20} />,
          onClick: () => {
            uiStateActions.setItemControls(null);
            scene.deleteTextBox(contextMenu.item!.id);
            onClose();
          }
        } :
        undefined;

      if (type === 'ITEM') {
        const nodeId = contextMenu.item.id;
        const modelItem = getItemById(model.items, nodeId)?.value;

        if (modelItem) {
          itemMenuItems.push({
            label: modelItem.childViewId ? t('openChildView') : t('createChildView'),
            Icon: <ChildViewIcon size={20} />,
            onClick: () => {
              if (modelItem.childViewId) {
                changeView(modelItem.childViewId, model);
                onClose();
                return;
              }

              try {
                const viewName = t('childViewName').replace('{name}', modelItem.name);
                const result = scene.createChildView(nodeId, viewName);
                if (result) changeView(result.newViewId, result.state.model);
              } catch (error) {
                // Circular reference (item already anchors an ancestor view) --
                // no toast/alert system in the app yet, so this is the minimal
                // safe fallback until one exists.
                console.warn(error);
              }
              onClose();
            }
          });
          itemMenuItems.push({ isDivider: true });
        }

        // Add Connector is the most common thing to do from a node, so it
        // leads the menu, set off from the edit/copy/duplicate/delete actions below.
        itemMenuItems.push({
          label: t('addConnector'),
          Icon: <AddConnectorIcon size={20} />,
          onClick: () => {
            const newConnector: ConnectorI = {
              id: generateId(),
              color: scene.colors[0].id,
              anchors: [
                { id: generateId(), ref: { item: nodeId } },
                { id: generateId(), ref: { item: nodeId } }
              ]
            };

            scene.createConnector(newConnector);

            uiStateActions.setMode({
              type: 'CONNECTOR',
              showCursor: true,
              id: newConnector.id,
              startAnchor: { itemId: nodeId },
              isConnecting: true
            });

            onClose();
          }
        });
        itemMenuItems.push({ isDivider: true });
      }

      if (editItem) itemMenuItems.push(editItem);

      itemMenuItems.push({
        label: copyLabel,
        Icon: <ContentCopyIcon size={20} />,
        shortcut: 'Ctrl+C',
        onClick: () => {
          const uiState = uiStateApi.getState();
          scene.copyObjectsToClipboard(uiState, contextMenu.item);
          onClose();
        }
      });

      if (duplicateLabel) {
        itemMenuItems.push({
          label: duplicateLabel,
          Icon: <DuplicateIcon size={20} />,
          onClick: () => {
            if (!contextMenu.item) return;
            scene.duplicateItem(contextMenu.item, scene);
            onClose();
          }
        });
      }

      if (deleteItem) itemMenuItems.push(deleteItem);

      return itemMenuItems;
    }
    return [
      buildAddNodeItem(contextMenu.tile),
      {
        label: t('addRectangle'),
        Icon: <AddRectangleIcon size={20} />,
        onClick: () => {
          if (!contextMenu) return;
          if (model.colors.length > 0) {
            scene.createRectangle({
              id: generateId(),
              color: model.colors[0].id,
              from: contextMenu.tile,
              to: contextMenu.tile
            });
          }
          onClose();
        }
      },
      ...(uiState.isAnythingCopied ? [{
        label: t('paste'),
        Icon: <ContentPasteIcon size={20} />,
        shortcut: 'Ctrl+V',
        onClick: () => {
          scene.pasteObjectsFromClipboard(uiState, scene);
          onClose();
        }
      }] : [])
    ]
  },
  // Depend on the whole object (a fresh reference every setContextMenu call) so the
  // menu's onClick closures always capture the *current* right-click tile — depending
  // only on `type`/`item` let repeated EMPTY-space right-clicks reuse a stale `tile`
  // from whichever click first transitioned the menu into that type.
  [contextMenu]);

  useEffect(() => setMenuItemsBeforeClosing(menuItems), [menuItems]);

  return (
    <ContextMenu
      anchorEl={anchorEl}
      onClose={onClose}
      menuItems={menuItems}
    />
  );
};
