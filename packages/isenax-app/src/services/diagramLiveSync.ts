import { useEffect, useRef } from 'react';

// Mirrors storageService.ts's/mcpManager.ts's baseUrl resolution: relative
// paths in production (nginx proxy), localhost:3001 in dev.
const isDevelopment = window.location.hostname === 'localhost' && window.location.port === '3000';
const BASE_URL = isDevelopment ? 'http://localhost:3001' : '';

// Subscribes to the backend's diagram-change SSE stream (native EventSource,
// auto-reconnects). Two event types:
// - 'start': an MCP tool call targeting the open diagram just began (fired
//   before validation/write) — onRemoteActivity, for immediate feedback.
// - 'changed': the diagram's file on disk actually changed — onRemoteChange,
//   to reload it.
// Both are only meaningful once a diagram has a server-assigned id; a
// never-saved local diagram has nothing external writers could target.
export const useDiagramLiveSync = (
  serverStorageAvailable: boolean,
  currentDiagramId: string | undefined,
  hasUnsavedChanges: boolean,
  onRemoteChange: (id: string) => void,
  onRemoteActivity?: (id: string) => void
) => {
  const stateRef = useRef({ currentDiagramId, hasUnsavedChanges, onRemoteChange, onRemoteActivity });
  stateRef.current = { currentDiagramId, hasUnsavedChanges, onRemoteChange, onRemoteActivity };

  useEffect(() => {
    if (!serverStorageAvailable) return undefined;

    const source = new EventSource(`${BASE_URL}/api/diagrams/stream`);
    source.onmessage = (event) => {
      try {
        const { type, id } = JSON.parse(event.data);
        const { currentDiagramId: openId, hasUnsavedChanges: dirty, onRemoteChange: onChange, onRemoteActivity: onActivity } =
          stateRef.current;
        if (!id || id !== openId) return;

        if (type === 'start') {
          onActivity?.(id);
          return;
        }
        // Don't clobber in-progress edits — the user's own save already
        // triggers this same event, so skip while there's unsaved work.
        if (!dirty) onChange(id);
      } catch {
        // Ignore malformed/keep-alive frames.
      }
    };

    return () => source.close();
  }, [serverStorageAvailable]);
};
