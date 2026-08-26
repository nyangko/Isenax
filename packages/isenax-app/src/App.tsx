import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { IconX } from '@tabler/icons-react';
import { Isoflow, MainMenuItem, stripBuiltinIconUrls, compressTextToBlob, readPossiblyGzippedFile } from 'isenax';
import type { IsoflowProps } from 'isenax';
import { flattenCollections } from '@isoflow/isopacks/dist/utils';
import isoflowIsopack from '@isoflow/isopacks/dist/isoflow';
import { useTranslation } from 'react-i18next';
import { DiagramData } from './diagramUtils';
import { StorageManager } from './StorageManager';
import { storageManager, DiagramInfo } from './services/storageService';
import ChangeLanguage from './components/ChangeLanguage';
import {
  NewFileIcon,
  SaveIcon,
  FolderIcon,
  DownloadIcon,
  CloudIcon,
  UploadIcon,
  TrashIcon,
  HistoryIcon,
  LockIcon,
  UnlockIcon
} from './components/ToolbarIcons';
import { HistoryPanel } from './components/HistoryPanel';
import { allLocales } from 'isenax';
import { useIconPackManager, IconPackName } from './services/iconPackManager';
import { useMcpManager } from './services/mcpManager';
import { useDiagramLiveSync } from './services/diagramLiveSync';
import './App.css';
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';

// Load core isoflow icons (always loaded)
const coreIcons = flattenCollections([isoflowIsopack]);

// The diagram currently loaded in the editor. Its full data lives in
// currentModel/diagramData — this only tracks which saved diagram (if any)
// it corresponds to, for save-in-place vs. save-as-new and the title bar.
interface CurrentDiagramRef {
  id: string;
  name: string;
}

// Bump this whenever the History panel's changelog content changes so returning
// users see the "unread" dot again even if they already dismissed the tutorial hints.
const HISTORY_VERSION = 'v1.8.0';
const TUTORIAL_HINT_KEYS = [
  'isenax_import_hint_dismissed',
  'isenax_connector_hint_dismissed',
  'isenax-lazy-loading-welcome-dismissed'
];

// The app's own toolbar already covers "open"/"export as JSON" (via the New/
// Load/Download icons below) and gives "export as compact JSON"/"export as
// image"/"settings" their own icons, so the library's hamburger menu only
// needs to carry what's left: the GitHub/version links and clear canvas.
const MAIN_MENU_OPTIONS: NonNullable<IsoflowProps['mainMenuOptions']> = [
  'ACTION.CLEAR_CANVAS',
  'LINK.DISCORD',
  'LINK.GITHUB',
  'VERSION'
];

// Mobile hides the export-compact-json/export-image/settings toolbar icons
// (see .mobile-hidden in App.css) since there's no room for them — their
// actions come back via the library's own hamburger-menu entries instead.
const MOBILE_MAIN_MENU_OPTIONS: NonNullable<IsoflowProps['mainMenuOptions']> = [
  ...MAIN_MENU_OPTIONS,
  'EXPORT.JSON_COMPACT',
  'EXPORT.PNG',
  'ACTION.SETTINGS'
];

// Diagram data carries built-in icons (loaded fresh from iconPackManager on
// every save/load anyway) alongside genuinely custom uploads. Anywhere we
// persist or re-merge icons, we only want the latter.
const getImportedIcons = (icons: any[] = []) =>
  icons.filter((icon) => icon.collection === 'imported');

const MOBILE_BREAKPOINT_QUERY = '(max-width: 599.95px)';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const onChange = () => {
      setIsMobile(mql.matches);
    };
    mql.addEventListener('change', onChange);
    return () => {
      mql.removeEventListener('change', onChange);
    };
  }, []);

  return isMobile;
};

const hasUnreadHistory = () => {
  if (localStorage.getItem('isenax-history-seen-version') !== HISTORY_VERSION) {
    return true;
  }
  return TUTORIAL_HINT_KEYS.some((key) => {
    return localStorage.getItem(key) !== 'true';
  });
};

const markHistoryAsRead = () => {
  localStorage.setItem('isenax-history-seen-version', HISTORY_VERSION);
  TUTORIAL_HINT_KEYS.forEach((key) => {
    localStorage.setItem(key, 'true');
  });
};

function App() {
  // Get base path from PUBLIC_URL, ensure no trailing slash for React Router
  const publicUrl = process.env.PUBLIC_URL || '';
  // React Router basename should not have trailing slash
  const basename = publicUrl ? (publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl) : '/';

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/display/:readonlyDiagramId" element={<EditorPage />} />
        <Route path="/edit/:editableDiagramId" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

function EditorPage() {
  // Initialize icon pack manager with core icons
  const iconPackManager = useIconPackManager(coreIcons);
  const mcpManager = useMcpManager();
  const isMobile = useIsMobile();
  const { readonlyDiagramId, editableDiagramId } = useParams<{
    readonlyDiagramId: string;
    editableDiagramId: string;
  }>();

  const [diagrams, setDiagrams] = useState<DiagramInfo[]>([]);
  const [currentDiagram, setCurrentDiagram] = useState<CurrentDiagramRef | null>(
    null
  );
  const [diagramName, setDiagramName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [mainMenuSlot, setMainMenuSlot] = useState<HTMLDivElement | null>(
    null
  );
  const [historyControlsSlot, setHistoryControlsSlot] =
    useState<HTMLDivElement | null>(null);
  const [helpButtonSlot, setHelpButtonSlot] =
    useState<HTMLDivElement | null>(null);
  const [exportImageButtonSlot, setExportImageButtonSlot] =
    useState<HTMLDivElement | null>(null);
  const [settingsButtonSlot, setSettingsButtonSlot] =
    useState<HTMLDivElement | null>(null);
  const [exportCompactJsonButtonSlot, setExportCompactJsonButtonSlot] =
    useState<HTMLDivElement | null>(null);
  const [layersButtonSlot, setLayersButtonSlot] =
    useState<HTMLDivElement | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  // Position is captured at click time (button's own bounding rect) because the
  // menu is portaled to document.body — it can't rely on CSS position:absolute
  // relative to its wrapper once it's rendered outside the scrolling dialog.
  const [shareMenu, setShareMenu] = useState<{
    id: string;
    top: number;
    left: number;
  } | null>(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [isHistoryUnread, setIsHistoryUnread] = useState(hasUnreadHistory);
  const [isenaxKey, setIsenaxKey] = useState(0); // Key to force re-render of Isenax
  const [currentModel, setCurrentModel] = useState<DiagramData | null>(null); // Store current model state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Isoflow echoes the freshly-loaded model back through onModelUpdated right
  // after (re)mounting; that echo isn't a user edit and shouldn't mark the
  // diagram dirty, so skip the first onModelUpdated call after each (re)load.
  const skipNextModelUpdateRef = useRef(true);
  const [showStorageManager, setShowStorageManager] = useState(false);
  const [serverStorageAvailable, setServerStorageAvailable] = useState(false);
  // Distinguishes an SSE echo of our own save from an actually-external
  // change (e.g. an MCP-driven edit), so we don't immediately reload what we
  // just wrote ourselves.
  const lastLocalSaveRef = useRef<{ id: string; at: number }>({ id: '', at: 0 });
  const [mcpSyncing, setMcpSyncing] = useState(false);
  const mcpSyncingSinceRef = useRef<number | null>(null);
  const isReadonlyUrl =
    window.location.pathname.startsWith('/display/') && readonlyDiagramId;
  const isEditableUrl =
    window.location.pathname.startsWith('/edit/') && editableDiagramId;

  // Lets the current user lock their own diagram against accidental edits —
  // separate from the URL-driven readonly mode above, and per-diagram so it
  // survives switching between saved diagrams. Purely a local UI guard: with
  // no account/auth system yet, it isn't enforced against other viewers.
  const [lockedDiagramIds, setLockedDiagramIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('isenax-locked-diagrams') || '[]');
    } catch {
      return [];
    }
  });
  // Diagrams that haven't been saved yet have no id to key the lock by — track
  // that case as plain session state so the toggle still works pre-save, then
  // fold it into lockedDiagramIds once the diagram gets its first id (below).
  const [unsavedDiagramLocked, setUnsavedDiagramLocked] = useState(false);
  const isDiagramLocked = currentDiagram
    ? lockedDiagramIds.includes(currentDiagram.id)
    : unsavedDiagramLocked;
  const toggleDiagramLock = () => {
    if (!currentDiagram) {
      setUnsavedDiagramLocked((prev) => !prev);
      return;
    }
    setLockedDiagramIds((prev) => {
      const next = prev.includes(currentDiagram.id)
        ? prev.filter((id) => {
            return id !== currentDiagram.id;
          })
        : [...prev, currentDiagram.id];
      localStorage.setItem('isenax-locked-diagrams', JSON.stringify(next));
      return next;
    });
  };

  // Initialize with empty diagram data
  // Create default colors for connectors
  const defaultColors = [
    { id: 'blue', value: '#A7C7E7' },
    { id: 'green', value: '#B5EAD7' },
    { id: 'red', value: '#FFB3BA' },
    { id: 'orange', value: '#FFDAC1' },
    { id: 'purple', value: '#C7B8EA' },
    { id: 'black', value: '#6B7280' },
    { id: 'gray', value: '#C9CCD1' }
  ];

  const [diagramData, setDiagramData] = useState<DiagramData>(() => {
    // Initialize with last opened data if available
    const lastOpenedData = localStorage.getItem('isenax-last-opened-data');
    if (lastOpenedData) {
      try {
        const data = JSON.parse(lastOpenedData);
        const importedIcons = getImportedIcons(data.icons);
        const mergedIcons = [...coreIcons, ...importedIcons];
        return {
          ...data,
          icons: mergedIcons,
          colors: data.colors?.length ? data.colors : defaultColors,
          fitToScreen: data.fitToScreen !== false
        };
      } catch (e) {
        console.error('Failed to load last opened data:', e);
      }
    }

    // Default state if no saved data
    return {
      title: 'Untitled Diagram',
      icons: coreIcons,
      colors: defaultColors,
      items: [],
      views: [],
      fitToScreen: true
    };
  });

  // Initialize storage (server sync availability + the saved-diagrams list)
  useEffect(() => {
    (async () => {
      await storageManager.initialize();
      setServerStorageAvailable(storageManager.isServerStorage());

      const list = await storageManager.listDiagrams();
      setDiagrams(list);

      // The last-opened diagram's content is already loaded via the
      // diagramData state initializer (from the 'isenax-last-opened-data'
      // cache); this just re-attaches its id/name if it's one of ours.
      const lastOpenedId = localStorage.getItem('isenax-last-opened');
      if (lastOpenedId) {
        const lastDiagram = list.find((d) => {
          return d.id === lastOpenedId;
        });
        if (lastDiagram) {
          setCurrentDiagram({ id: lastDiagram.id, name: lastDiagram.name });
          setDiagramName(lastDiagram.name);
          setCurrentModel(diagramData);
        }
      }
    })().catch(console.error);
  }, []);

  // If the URL names a shared diagram (view-only /display/ or editable
  // /edit/), load it on mount — needs server storage since the recipient's
  // browser has no local copy of someone else's diagram.
  useEffect(() => {
    if ((!isReadonlyUrl && !isEditableUrl) || !serverStorageAvailable) return;
    const sharedId = isReadonlyUrl ? readonlyDiagramId : editableDiagramId;
    if (!sharedId) return;
    loadDiagram(sharedId, true).catch(() => {
      alert(t('dialog.readOnly.failed'));
      window.location.href = '/';
    });
  }, [readonlyDiagramId, editableDiagramId, serverStorageAvailable]);

  // Update diagramData when loaded icons change
  useEffect(() => {
    setDiagramData((prev) => {
      return {
        ...prev,
        icons: [...iconPackManager.loadedIcons, ...getImportedIcons(prev.icons)]
      };
    });
  }, [iconPackManager.loadedIcons]);

  const saveDiagram = async () => {
    if (!diagramName.trim()) {
      alert(t('alert.enterDiagramName'));
      return;
    }

    // Check if a diagram with this name already exists (excluding current)
    const existingDiagram = diagrams.find((d) => {
      return d.name === diagramName.trim() && d.id !== currentDiagram?.id;
    });

    if (existingDiagram) {
      const confirmOverwrite = window.confirm(
        t('alert.diagramExists', { name: diagramName })
      );
      if (!confirmOverwrite) {
        return;
      }
    }

    // Construct save data - include only imported icons
    const importedIcons = getImportedIcons(currentModel?.icons || diagramData.icons);

    const savedData = {
      title: diagramName,
      name: diagramName,
      icons: importedIcons, // Save only imported icons with diagram
      colors: currentModel?.colors || diagramData.colors || [],
      items: currentModel?.items || diagramData.items || [],
      views: currentModel?.views || diagramData.views || [],
      fitToScreen: true
    };

    const targetId = currentDiagram?.id || existingDiagram?.id;
    const storage = storageManager;

    try {
      if (targetId) {
        await storage.saveDiagram(targetId, savedData);
      }
    } catch (e) {
      console.error('Failed to save diagram:', e);
      alert(t('alert.storageFull'));
      return;
    }

    let savedId = targetId;
    if (!savedId) {
      try {
        savedId = await storage.createDiagram(savedData);
      } catch (e) {
        console.error('Failed to save diagram:', e);
        alert(t('alert.storageFull'));
        return;
      }
    }

    if (unsavedDiagramLocked) {
      setLockedDiagramIds((prev) => {
        const next = [...prev, savedId];
        localStorage.setItem('isenax-locked-diagrams', JSON.stringify(next));
        return next;
      });
      setUnsavedDiagramLocked(false);
    }
    lastLocalSaveRef.current = { id: savedId, at: Date.now() };
    setCurrentDiagram({ id: savedId, name: diagramName });
    setShowSaveDialog(false);
    setHasUnsavedChanges(false);
    setDiagrams(await storage.listDiagrams());

    // Save as last opened
    try {
      localStorage.setItem('isenax-last-opened', savedId);
      localStorage.setItem(
        'isenax-last-opened-data',
        JSON.stringify(savedData)
      );
    } catch (e) {
      console.error('Failed to save diagram:', e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert(t('alert.storageFull'));
        setShowStorageManager(true);
      }
    }
  };

  // Silently assigns the current diagram a server-side id if it doesn't
  // have one yet — no dialog, no name prompt. Used to make an in-progress,
  // never-saved diagram addressable the moment MCP is turned on, since an
  // AI agent can only read/write diagrams that exist in server storage.
  const ensureCurrentDiagramSaved = async (): Promise<string> => {
    if (currentDiagram) return currentDiagram.id;

    const name = diagramName.trim() || currentModel?.title || 'Untitled Diagram';
    const importedIcons = getImportedIcons(currentModel?.icons || diagramData.icons);
    const savedData = {
      title: name,
      name,
      icons: importedIcons,
      colors: currentModel?.colors || diagramData.colors || [],
      items: currentModel?.items || diagramData.items || [],
      views: currentModel?.views || diagramData.views || [],
      fitToScreen: true
    };

    const storage = storageManager;
    const id = await storage.createDiagram(savedData);

    lastLocalSaveRef.current = { id, at: Date.now() };
    setCurrentDiagram({ id, name });
    setDiagramName(name);
    setHasUnsavedChanges(false);
    setDiagrams(await storage.listDiagrams());
    return id;
  };

  const handleMcpToggle = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        try {
          await ensureCurrentDiagramSaved();
        } catch (e) {
          console.error('Failed to auto-save diagram before enabling MCP:', e);
          alert(t('alert.storageFull'));
          return;
        }
      }
      mcpManager.onToggle(enabled);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mcpManager]
  );

  const loadDiagram = async (id: string, skipUnsavedCheck = false) => {
    if (
      !skipUnsavedCheck &&
      hasUnsavedChanges &&
      !window.confirm(t('alert.unsavedChanges'))
    ) {
      return;
    }

    const data: any = await storageManager.loadDiagram(id);
    const cached = diagrams.find((d) => {
      return d.id === id;
    });
    // Prefer the freshly-fetched data over the (possibly stale, e.g. after
    // an external MCP edit) cached list entry — data.title is always set.
    const name = data.name || data.title || cached?.name || 'Untitled Diagram';

    // Auto-detect and load required icon packs
    await iconPackManager.loadPacksForDiagram(data.items || []);

    // Merge imported icons with loaded icon set
    const importedIcons = getImportedIcons(data.icons);
    const mergedIcons = [...iconPackManager.loadedIcons, ...importedIcons];
    const dataWithIcons = {
      ...data,
      icons: mergedIcons
    };

    setCurrentDiagram({ id, name });
    setDiagramName(name);
    setDiagramData(dataWithIcons);
    setCurrentModel(dataWithIcons);
    setIsenaxKey((prev) => {
      return prev + 1;
    }); // Force re-render of Isenax
    setShowLoadDialog(false);
    setShareMenu(null);
    setHasUnsavedChanges(false);

    // Save as last opened (without icons) — the cold-start reader above
    // only reads collection==='imported' entries back out anyway and
    // rebuilds everything else from iconPackManager, so caching the
    // merged built-in-pack icons here would be pure localStorage waste.
    try {
      localStorage.setItem('isenax-last-opened', id);
      localStorage.setItem(
        'isenax-last-opened-data',
        JSON.stringify({ ...data, icons: importedIcons })
      );
    } catch (e) {
      console.error('Failed to save last opened:', e);
    }
  };

  // MCP's on/off switch lives on the backend, not per-tab — so if it's
  // already on when this tab loads (or a new blank diagram is started while
  // it's on), the toggle's own onChange never fires and the earlier
  // enable-time auto-save never runs. Re-check on every change to either
  // side instead of only at the moment of flipping the switch.
  useEffect(() => {
    if (mcpManager.enabled && !currentDiagram) {
      ensureCurrentDiagramSaved().catch((e) => {
        console.error('Failed to auto-attach current diagram to MCP:', e);
      });
    }
  }, [mcpManager.enabled, currentDiagram]);

  // An MCP-driven (or any other client's) edit to the diagram currently open
  // in this tab reloads it live, via the backend's SSE stream — skipped
  // while the user has unsaved local edits, or if the change is just an
  // echo of our own save.
  useDiagramLiveSync(
    serverStorageAvailable,
    currentDiagram?.id,
    hasUnsavedChanges,
    async (id) => {
      const { id: lastId, at } = lastLocalSaveRef.current;
      if (id === lastId && Date.now() - at < 2000) return;
      // 'start' (below) usually already showed the indicator — measure the
      // minimum-visible-time from whichever came first, not just from here.
      const startedAt = mcpSyncingSinceRef.current ?? Date.now();
      setMcpSyncing(true);
      await loadDiagram(id, true);
      setTimeout(() => {
        setMcpSyncing(false);
        mcpSyncingSinceRef.current = null;
      }, Math.max(0, 600 - (Date.now() - startedAt)));
    },
    () => {
      // Fires the instant the MCP call starts (before it's even validated
      // or written) — immediate feedback, well before the file-change event
      // above would otherwise be the first sign anything happened.
      mcpSyncingSinceRef.current = mcpSyncingSinceRef.current ?? Date.now();
      setMcpSyncing(true);
    }
  );

  const commitTitleEdit = () => {
    setIsEditingTitle(false);
    const trimmed = diagramName.trim();

    if (!trimmed) {
      setDiagramName(currentDiagram?.name || '');
      return;
    }

    if (currentDiagram && currentDiagram.name !== trimmed) {
      setDiagrams((prev) => {
        return prev.map((d) => {
          return d.id === currentDiagram.id
            ? { ...d, name: trimmed, lastModified: new Date() }
            : d;
        });
      });
      setCurrentDiagram({ id: currentDiagram.id, name: trimmed });
      // The new title is persisted by the next save/auto-save.
      setHasUnsavedChanges(true);
    } else {
      setDiagramName(trimmed);
    }
  };

  const loadFromFile = () => {
    setShowLoadMenu(false);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,.gz,application/json,application/gzip';
    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (
        hasUnsavedChanges &&
        !window.confirm(t('alert.unsavedChanges'))
      ) {
        return;
      }

      try {
        const text = await readPossiblyGzippedFile(file);
        const raw = JSON.parse(text);

        await iconPackManager.loadPacksForDiagram(raw.items || []);

        const importedIcons = getImportedIcons(raw.icons);
        const mergedIcons = [...iconPackManager.loadedIcons, ...importedIcons];

        const loaded: DiagramData = {
          ...raw,
          icons: mergedIcons,
          colors: raw.colors?.length ? raw.colors : defaultColors,
          fitToScreen: raw.fitToScreen !== false
        };

        setCurrentDiagram(null);
        setDiagramName(raw.title || file.name.replace(/(\.json)?\.gz$|\.json$/i, ''));
        setDiagramData(loaded);
        setCurrentModel(loaded);
        setIsenaxKey((prev) => {
          return prev + 1;
        });
        setHasUnsavedChanges(true);
        localStorage.removeItem('isenax-last-opened');
        localStorage.removeItem('isenax-last-opened-data');
      } catch (err) {
        alert(t('dialog.readOnly.failed'));
      }
    };
    fileInput.click();
  };

  const deleteDiagram = async (id: string) => {
    if (window.confirm(t('alert.confirmDelete'))) {
      try {
        await storageManager.deleteDiagram(id);
      } catch (e) {
        console.error('Failed to delete diagram:', e);
      }
      setDiagrams(
        diagrams.filter((d) => {
          return d.id !== id;
        })
      );
      if (currentDiagram?.id === id) {
        setCurrentDiagram(null);
        setDiagramName('');
      }
    }
  };

  const newDiagram = () => {
    const message = hasUnsavedChanges
      ? t('alert.unsavedChangesExport')
      : t('alert.createNewDiagram');

    if (window.confirm(message)) {
      const emptyDiagram: DiagramData = {
        title: 'Untitled Diagram',
        icons: iconPackManager.loadedIcons, // Use currently loaded icons
        colors: defaultColors,
        items: [],
        views: [],
        fitToScreen: true
      };
      setCurrentDiagram(null);
      setDiagramName('');
      setDiagramData(emptyDiagram);
      setCurrentModel(emptyDiagram); // Reset current model too
      setIsenaxKey((prev) => {
        return prev + 1;
      }); // Force re-render of Isenax
      setHasUnsavedChanges(false);

      // Clear last opened
      localStorage.removeItem('isenax-last-opened');
      localStorage.removeItem('isenax-last-opened-data');
    }
  };

  const handleModelUpdated = useCallback((model: any) => {
    // Store the current model state whenever it updates
    // The model from Isoflow contains the COMPLETE state including all icons

    // Simply store the complete model as-is since it has everything
    const updatedModel = {
      title: model.title || diagramName || 'Untitled',
      icons: model.icons || [], // This already includes ALL icons (default + imported)
      colors: model.colors || defaultColors,
      items: model.items || [],
      views: model.views || [],
      fitToScreen: true
    };

    setCurrentModel(updatedModel);
    setDiagramData(updatedModel);

    if (skipNextModelUpdateRef.current) {
      // This call is Isoflow echoing back the data it was just given to
      // load, not something the user changed.
      skipNextModelUpdateRef.current = false;
    } else if (!isReadonlyUrl) {
      setHasUnsavedChanges(true);
    }
  }, [isReadonlyUrl]);

  const exportDiagram = async () => {
    // Use the most recent model data - prefer currentModel as it gets updated by handleModelUpdated
    const modelToExport = currentModel || diagramData;

    // Get ALL icons from the current model (which includes both default and imported)
    const allModelIcons = modelToExport.icons || [];

    // For safety, also check diagramData for any imported icons not in currentModel
    const diagramImportedIcons = getImportedIcons(diagramData.icons);

    // Create a map to deduplicate icons by ID, preferring the ones from currentModel
    const iconMap = new Map();

    // First add all icons from the model (includes defaults + imported)
    allModelIcons.forEach((icon) => {
      iconMap.set(icon.id, icon);
    });

    // Then add any imported icons from diagramData that might be missing
    diagramImportedIcons.forEach((icon) => {
      if (!iconMap.has(icon.id)) {
        iconMap.set(icon.id, icon);
      }
    });

    // Get all unique icons
    const allIcons = Array.from(iconMap.values());

    // Built-in icons (aws/gcp/azure/kubernetes/isoflow packs) are the same
    // base64 blob every time — drop it here, isenax-lib's loader (and this
    // app's own loadFromFile/loadDiagram, via iconPackManager) restores it
    // from the bundled packs by id on import.
    const exportableIcons = stripBuiltinIconUrls(allIcons);

    const exportData = {
      title: diagramName || modelToExport.title || 'Exported Diagram',
      icons: exportableIcons, // Include ALL icons (default + imported) for portability
      colors: modelToExport.colors || [],
      items: modelToExport.items || [],
      views: modelToExport.views || [],
      fitToScreen: true
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = await compressTextToBlob(jsonString, 'application/gzip');

    // Create a blob and download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const exportTimestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
    a.download = `${diagramName || 'diagram'}-${exportTimestamp}.json.gz`;
    a.click();
    URL.revokeObjectURL(url);

    setShowExportDialog(false);
    setHasUnsavedChanges(false); // Mark as saved after export
  };

  const handleCopyShareLink = (id: string, mode: 'view' | 'edit' = 'view') => {
    const shareUrl = `${window.location.origin}/${mode === 'edit' ? 'edit' : 'display'}/${id}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        alert(t('alert.shareLinkCopied', { url: shareUrl }));
      })
      .catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        try {
          if (textArea.parentNode === document.body) {
            document.body.removeChild(textArea);
          }
        } catch (err) {
          console.warn('Failed to remove temporary textarea:', err);
        }
        alert(t('alert.shareLinkCopied', { url: shareUrl }));
      });
  };

  // i18n
  const { t, i18n } = useTranslation('app');
  
  // Get locale with fallback to en-US if not found
  const currentLocale = allLocales[i18n.language as keyof typeof allLocales] || allLocales['en-US'];

  // Isoflow is remounted (via its `key`) whenever isenaxKey or the language
  // changes, so the next onModelUpdated call will be a fresh load echo again.
  useEffect(() => {
    skipNextModelUpdateRef.current = true;
  }, [isenaxKey, i18n.language]);

  // Auto-save functionality
  useEffect(() => {
    if (!currentModel || !hasUnsavedChanges || !currentDiagram) return;

    const autoSaveTimer = setTimeout(async () => {
      // Include imported icons in auto-save
      const importedIcons = getImportedIcons(currentModel?.icons || diagramData.icons);

      const savedData = {
        title: diagramName || currentDiagram.name,
        name: diagramName || currentDiagram.name,
        icons: importedIcons, // Save imported icons in auto-save
        colors: currentModel.colors || [],
        items: currentModel.items || [],
        views: currentModel.views || [],
        fitToScreen: true
      };

      try {
        await storageManager.saveDiagram(currentDiagram.id, savedData);
        lastLocalSaveRef.current = { id: currentDiagram.id, at: Date.now() };
        setDiagrams((prevDiagrams) => {
          return prevDiagrams.map((d) => {
            return d.id === currentDiagram.id
              ? { ...d, name: savedData.name, lastModified: new Date() }
              : d;
          });
        });
      } catch (e) {
        console.error('Auto-save failed:', e);
        alert(t('alert.autoSaveFailed'));
        return;
      }

      // Keep the cold-start restore cache in sync too.
      try {
        localStorage.setItem(
          'isenax-last-opened-data',
          JSON.stringify(savedData)
        );
      } catch (e) {
        console.error('Failed to update last-opened cache:', e);
      }
      setHasUnsavedChanges(false);
    }, 5000); // Auto-save after 5 seconds of changes

    return () => {
      return clearTimeout(autoSaveTimer);
    };
  }, [currentModel, hasUnsavedChanges, currentDiagram, diagramName]);

  // Warn before closing if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = t('alert.beforeUnload');
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      return window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S for Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();

        // Quick save if current diagram exists and has unsaved changes
        if (currentDiagram && hasUnsavedChanges) {
          saveDiagram();
        } else {
          // Otherwise show save dialog
          setShowSaveDialog(true);
        }
      }

      // Ctrl+O or Cmd+O for Open/Load
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        setShowLoadDialog(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      return window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentDiagram, hasUnsavedChanges]);

  // While any app-level dialog/popup is open, the canvas underneath shouldn't
  // still respond to drags/clicks — flip the renderer fully non-interactive
  // rather than patching pointer checks into every interaction mode.
  // showLoadMenu is excluded: it's a small anchored dropdown with its own
  // full-screen backdrop (closes on outside click), not a modal blocking the
  // canvas -- forcing editorMode to NON_INTERACTIVE for it also hid the main
  // menu/toolbar/zoom controls (everything, since that mode's UI mapping is
  // empty) just for opening the load dropdown.
  const isAnyDialogOpen =
    showSaveDialog ||
    showLoadDialog ||
    showExportDialog ||
    showHistoryPanel ||
    showStorageManager;

  // Isoflow's iconPackManager prop feeds a useLayoutEffect keyed on reference
  // identity — an inline object literal here would be a new reference every
  // render and re-fire that effect (and the resulting store update) forever.
  const isoflowIconPackManager = useMemo(() => {
    return {
      lazyLoadingEnabled: iconPackManager.lazyLoadingEnabled,
      onToggleLazyLoading: iconPackManager.toggleLazyLoading,
      packInfo: Object.values(iconPackManager.packInfo),
      enabledPacks: iconPackManager.enabledPacks,
      onTogglePack: (packName: string, enabled: boolean) => {
        iconPackManager.togglePack(packName as IconPackName, enabled);
      }
    };
  }, [
    iconPackManager.lazyLoadingEnabled,
    iconPackManager.toggleLazyLoading,
    iconPackManager.packInfo,
    iconPackManager.enabledPacks,
    iconPackManager.togglePack
  ]);

  // Same reference-identity trap as iconPackManager above — {...mcpManager,
  // onToggle: handleMcpToggle} inline in JSX built a new object every render,
  // re-firing Isoflow's effect and eventually hitting React's nested-update
  // ceiling ("Maximum update depth exceeded").
  const isoflowMcpManager = useMemo(() => {
    return { ...mcpManager, onToggle: handleMcpToggle };
  }, [mcpManager, handleMcpToggle]);

  // Mobile hides the New/Load/Export/History toolbar buttons (see
  // .mobile-hidden in App.css) since there's no room for them in a single
  // row — their actions come back as rows in the main menu instead, so
  // there's still exactly one menu rather than a second overflow menu.
  // ponytail: rebuilt inline each render rather than memoized, since
  // newDiagram/loadFromFile aren't stable references either; upgrade both
  // together with useCallback if this ever shows up as a real perf cost.
  const renderMobileMenuExtras = (closeMenu: () => void) => {
    return (
      <>
        <MainMenuItem
          onClick={() => {
            newDiagram();
            closeMenu();
          }}
          Icon={<NewFileIcon />}
        >
          {t('nav.newDiagram')}
        </MainMenuItem>
        <MainMenuItem
          onClick={() => {
            setShowLoadDialog(true);
            closeMenu();
          }}
          Icon={<FolderIcon />}
        >
          {t('nav.loadSessionOnly')}
        </MainMenuItem>
        <MainMenuItem
          onClick={() => {
            loadFromFile();
            closeMenu();
          }}
          Icon={<UploadIcon />}
        >
          {t('nav.importFile')}
        </MainMenuItem>
        <MainMenuItem
          onClick={() => {
            setShowExportDialog(true);
            closeMenu();
          }}
          Icon={<DownloadIcon />}
        >
          {t('nav.exportFile')}
        </MainMenuItem>
        <MainMenuItem
          onClick={() => {
            setShowHistoryPanel(true);
            markHistoryAsRead();
            setIsHistoryUnread(false);
            closeMenu();
          }}
          Icon={<HistoryIcon />}
        >
          {t('history.title')}
        </MainMenuItem>
      </>
    );
  };

  return (
    <div className="App">
      <div className="icon-toolbar">
        <div className="main-menu-slot" ref={setMainMenuSlot} />
        {!isReadonlyUrl ? (
          <>
            <button
              className={`icon-btn${isDiagramLocked ? ' icon-btn--active' : ''}`}
              onClick={toggleDiagramLock}
              aria-label={t(isDiagramLocked ? 'nav.unlockDiagram' : 'nav.lockDiagram')}
              data-tooltip={t(isDiagramLocked ? 'nav.unlockDiagram' : 'nav.lockDiagram')}
            >
              {isDiagramLocked ? <LockIcon /> : <UnlockIcon />}
            </button>
            {isEditingTitle ? (
              <input
                className="diagram-title-input"
                value={diagramName}
                autoFocus
                onFocus={(e) => {
                  return e.currentTarget.select();
                }}
                onChange={(e) => {
                  return setDiagramName(e.target.value);
                }}
                onBlur={commitTitleEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  } else if (e.key === 'Escape') {
                    setDiagramName(currentDiagram?.name || '');
                    setIsEditingTitle(false);
                  }
                }}
              />
            ) : (
              <span
                className="diagram-badge"
                title={`${t('status.clickToRename')}`}
                onClick={() => {
                  if (!currentDiagram && !diagramName) {
                    setDiagramName(t('status.untitled'));
                  }
                  setIsEditingTitle(true);
                }}
              >
                {currentDiagram
                  ? currentDiagram.name
                  : diagramName || t('status.untitled')}
                {hasUnsavedChanges && (
                  <span className="unsaved-dot" title={t('status.modified')} />
                )}
              </span>
            )}
            <div className="history-controls-slot" ref={setHistoryControlsSlot} />
            <button
              className="icon-btn mobile-hidden"
              onClick={newDiagram}
              aria-label={t('nav.newDiagram')}
              data-tooltip={t('nav.newDiagram')}
            >
              <NewFileIcon />
            </button>
            <button
              className="icon-btn"
              onClick={() => {
                if (currentDiagram && hasUnsavedChanges) {
                  saveDiagram();
                } else {
                  setShowSaveDialog(true);
                }
              }}
              aria-label={t('nav.saveSessionOnly')}
              data-tooltip={t('nav.saveSessionOnly')}
            >
              <SaveIcon />
            </button>
            <div className="load-menu-wrapper mobile-hidden">
              <button
                className="icon-btn"
                onClick={() => {
                  return setShowLoadMenu((prev) => {
                    return !prev;
                  });
                }}
                aria-label={t('nav.loadSessionOnly')}
                data-tooltip={t('nav.loadSessionOnly')}
              >
                <FolderIcon />
              </button>
              {showLoadMenu && (
                <>
                  <div
                    className="load-menu-backdrop"
                    onClick={() => {
                      return setShowLoadMenu(false);
                    }}
                  />
                  <div className="load-menu">
                    <button
                      onClick={() => {
                        setShowLoadMenu(false);
                        setShowLoadDialog(true);
                      }}
                    >
                      <FolderIcon />
                      {t('nav.loadSessionOnly')}
                    </button>
                    <button onClick={loadFromFile}>
                      <UploadIcon />
                      {t('nav.importFile')}
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              className="icon-btn mobile-hidden"
              onClick={() => {
                return setShowExportDialog(true);
              }}
              aria-label={t('nav.exportFile')}
              data-tooltip={t('nav.exportFile')}
            >
              <DownloadIcon />
            </button>
            <div className="export-compact-json-button-slot" ref={setExportCompactJsonButtonSlot} />
            <div className="export-image-button-slot" ref={setExportImageButtonSlot} />
            <div className="settings-button-slot" ref={setSettingsButtonSlot} />
            <div className="layers-button-slot" ref={setLayersButtonSlot} />
          </>
        ) : (
          <span className="diagram-badge" title={t('dialog.readOnly.mode')}>
            👁️ {t('dialog.readOnly.mode')}
          </span>
        )}
        <ChangeLanguage />
        <div className="history-btn-wrapper mobile-hidden">
          <button
            className="icon-btn"
            onClick={() => {
              setShowHistoryPanel(true);
              markHistoryAsRead();
              setIsHistoryUnread(false);
            }}
            aria-label={t('history.title')}
            data-tooltip={t('history.title')}
          >
            <HistoryIcon />
          </button>
          {isHistoryUnread && <span className="history-unread-dot" />}
        </div>
        <div className="help-button-slot" ref={setHelpButtonSlot} />
      </div>

      <div className="isenax-container">
        <Isoflow
          key={`${isenaxKey}-${i18n.language}`}
          initialData={diagramData}
          onModelUpdated={handleModelUpdated}
          editorMode={
            isAnyDialogOpen
              ? 'NON_INTERACTIVE'
              : isReadonlyUrl
                ? 'EXPLORABLE_READONLY'
                : isDiagramLocked
                  ? 'LOCKED'
                  : 'EDITABLE'
          }
          locale={currentLocale}
          mainMenuOptions={isMobile ? MOBILE_MAIN_MENU_OPTIONS : MAIN_MENU_OPTIONS}
          mainMenuExtraItems={
            isMobile && !isReadonlyUrl ? renderMobileMenuExtras : undefined
          }
          mainMenuPortalTarget={mainMenuSlot}
          historyControlsPortalTarget={historyControlsSlot}
          helpButtonPortalTarget={helpButtonSlot}
          exportImageButtonPortalTarget={exportImageButtonSlot}
          settingsButtonPortalTarget={settingsButtonSlot}
          exportCompactJsonButtonPortalTarget={exportCompactJsonButtonSlot}
          layersButtonPortalTarget={layersButtonSlot}
          iconPackManager={isoflowIconPackManager}
          mcpManager={isoflowMcpManager}
        />
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>
              {t('dialog.save.title')}
              <button
                type="button"
                className="dialog-close-btn"
                onClick={() => {
                  return setShowSaveDialog(false);
                }}
                aria-label={t('dialog.save.btnCancel')}
              >
                <IconX size={18} />
              </button>
            </h2>
            <div
              className={`dialog-note ${serverStorageAvailable ? 'dialog-note--success' : 'dialog-note--warning'}`}
            >
              <strong className="dialog-note-title">
                <span className="dialog-note-icon">
                  {serverStorageAvailable ? <CloudIcon /> : '💾'}
                </span>
                {serverStorageAvailable
                  ? t('dialog.load.storageServer')
                  : t('dialog.load.storageLocal')}
              </strong>
              <p>
                {serverStorageAvailable
                  ? t('dialog.load.storageServerNote')
                  : t('dialog.save.warningMessage')}
              </p>
            </div>
            <input
              type="text"
              placeholder={t('dialog.save.placeholder')}
              value={diagramName}
              onChange={(e) => {
                return setDiagramName(e.target.value);
              }}
              onKeyDown={(e) => {
                return e.key === 'Enter' && saveDiagram();
              }}
              autoFocus
            />
            <div className="dialog-buttons">
              <button onClick={saveDiagram}>{t('dialog.save.btnSave')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>
              {t('dialog.load.title')}
              <button
                type="button"
                className="dialog-close-btn"
                onClick={() => {
                  setShowLoadDialog(false);
                  setShareMenu(null);
                }}
                aria-label={t('dialog.load.btnClose')}
              >
                <IconX size={18} />
              </button>
            </h2>
            <div
              className={`dialog-note ${serverStorageAvailable ? 'dialog-note--success' : 'dialog-note--warning'}`}
            >
              <strong className="dialog-note-title">
                <span className="dialog-note-icon">
                  {serverStorageAvailable ? <CloudIcon /> : '💾'}
                </span>
                {serverStorageAvailable
                  ? t('dialog.load.storageServer')
                  : t('dialog.load.storageLocal')}
              </strong>
              <p>
                {serverStorageAvailable
                  ? t('dialog.load.storageServerNote')
                  : t('dialog.load.noteMessage')}
              </p>
            </div>
            <div className="diagram-list">
              {diagrams.length === 0 ? (
                <p>{t('dialog.load.noSavedDiagrams')}</p>
              ) : (
                diagrams.map((diagram) => {
                  return (
                    <div key={diagram.id} className="diagram-item">
                      <div className="diagram-item-info">
                        <NewFileIcon />
                        <div>
                          <strong>{diagram.name}</strong>
                          <br />
                          <small>
                            {t('dialog.load.updated')}:{' '}
                            {diagram.lastModified.toLocaleString()}
                          </small>
                        </div>
                      </div>
                      <div className="diagram-actions">
                        <button
                          onClick={() => {
                            return loadDiagram(diagram.id, false);
                          }}
                        >
                          <FolderIcon />
                          {t('dialog.load.btnLoad')}
                        </button>
                        {serverStorageAvailable && (
                          <div className="load-menu-wrapper">
                            <button
                              className="share"
                              onClick={(e) => {
                                if (shareMenu?.id === diagram.id) {
                                  setShareMenu(null);
                                  return;
                                }
                                const rect = e.currentTarget.getBoundingClientRect();
                                setShareMenu({
                                  id: diagram.id,
                                  top: rect.bottom + 4,
                                  left: rect.left
                                });
                              }}
                              title={t('dialog.load.btnShare')}
                            >
                              {t('dialog.load.btnShare')}
                            </button>
                            {shareMenu?.id === diagram.id &&
                              createPortal(
                                <>
                                  <div
                                    className="load-menu-backdrop"
                                    // Portaled to document.body, so it sits outside the
                                    // Load dialog's own .dialog-overlay (z-index 1000) —
                                    // needs to be above that or clicks on it never reach
                                    // this backdrop to close the menu.
                                    style={{ zIndex: 1010 }}
                                    onClick={() => {
                                      return setShareMenu(null);
                                    }}
                                  />
                                  <div
                                    className="load-menu"
                                    style={{
                                      position: 'fixed',
                                      top: shareMenu.top,
                                      left: shareMenu.left,
                                      zIndex: 1011
                                    }}
                                  >
                                    <button
                                      onClick={() => {
                                        setShareMenu(null);
                                        handleCopyShareLink(diagram.id, 'view');
                                      }}
                                    >
                                      {t('dialog.load.btnShareView')}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setShareMenu(null);
                                        handleCopyShareLink(diagram.id, 'edit');
                                      }}
                                    >
                                      {t('dialog.load.btnShareEdit')}
                                    </button>
                                  </div>
                                </>,
                                document.body
                              )}
                          </div>
                        )}
                        <button
                          onClick={() => {
                            return deleteDiagram(diagram.id);
                          }}
                        >
                          <TrashIcon />
                          {t('dialog.load.btnDelete')}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>
              {t('dialog.export.title')}
              <button
                type="button"
                className="dialog-close-btn"
                onClick={() => {
                  return setShowExportDialog(false);
                }}
                aria-label={t('dialog.export.btnCancel')}
              >
                <IconX size={18} />
              </button>
            </h2>
            <div className="dialog-note dialog-note--success">
              <strong className="dialog-note-title">
                <span className="dialog-note-icon">✅</span>
                {t('dialog.export.recommendedTitle')}
              </strong>
              <p>{t('dialog.export.recommendedMessage')}</p>
              <p>{t('dialog.export.noteMessage')}</p>
            </div>
            <div className="dialog-buttons">
              <button onClick={exportDiagram}>
                {t('dialog.export.btnDownload')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storage Manager */}
      {showStorageManager && (
        <StorageManager
          onClose={() => {
            return setShowStorageManager(false);
          }}
        />
      )}

      {/* History Panel */}
      {showHistoryPanel && (
        <HistoryPanel
          locale={currentLocale}
          onClose={() => {
            return setShowHistoryPanel(false);
          }}
        />
      )}

      {mcpSyncing && (
        <div className="mcp-syncing-indicator">
          <span className="mcp-syncing-spinner" />
          {t('status.mcpSyncing')}
        </div>
      )}
    </div>
  );
}

export default App;
