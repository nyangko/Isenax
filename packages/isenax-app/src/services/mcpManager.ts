import { useState, useEffect, useCallback, useMemo } from 'react';

// Mirrors ServerStorage's baseUrl resolution in storageService.ts: relative
// paths in production (nginx proxy), localhost:3001 in dev.
const isDevelopment = window.location.hostname === 'localhost' && window.location.port === '3000';
const BASE_URL = isDevelopment ? 'http://localhost:3001' : '';

interface McpStatusResponse {
  available: boolean;
  enabled: boolean;
  url: string | null;
  token: string | null;
}

interface McpEnableResponse {
  enabled: boolean;
  url: string;
  token: string;
}

export const useMcpManager = () => {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/api/mcp/status`, { signal: AbortSignal.timeout(5000) })
      .then((res) => res.json())
      .then((data: McpStatusResponse) => {
        setAvailable(data.available);
        setEnabled(data.enabled);
        setUrl(data.enabled ? `${BASE_URL}${data.url}` : null);
        setToken(data.enabled ? data.token : null);
      })
      .catch(() => setAvailable(false));
  }, []);

  const onToggle = useCallback(async (nextEnabled: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/mcp/${nextEnabled ? 'enable' : 'disable'}`, {
        method: 'POST',
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) throw new Error(`MCP ${nextEnabled ? 'enable' : 'disable'} failed: ${res.status}`);

      if (nextEnabled) {
        const data: McpEnableResponse = await res.json();
        setEnabled(true);
        setUrl(`${BASE_URL}${data.url}`);
        setToken(data.token);
      } else {
        setEnabled(false);
        setUrl(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Failed to toggle MCP server:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Isoflow re-pushes this into its store via useLayoutEffect keyed on
  // object identity — an unmemoized literal here would re-fire that effect,
  // and thus this hook's own setState calls, every render.
  return useMemo(
    () => ({ available, enabled, url, token, loading, onToggle }),
    [available, enabled, url, token, loading, onToggle]
  );
};
