import { Model } from 'isenax/dist/types';

export interface DiagramInfo {
  id: string;
  name: string;
  lastModified: Date;
  size?: number;
}

export interface StorageService {
  isAvailable(): Promise<boolean>;
  listDiagrams(): Promise<DiagramInfo[]>;
  loadDiagram(id: string): Promise<Model>;
  saveDiagram(id: string, data: Model): Promise<void>;
  deleteDiagram(id: string): Promise<void>;
  createDiagram(data: Model): Promise<string>;
}

// Server Storage Implementation
class ServerStorage implements StorageService {
  private baseUrl: string;
  private available: boolean | null = null;
  private availabilityCheckedAt: number | null = null;
  private readonly AVAILABILITY_CACHE_MS = 60000; // Re-check every 60 seconds

  constructor(baseUrl: string = '') {
    // In production (Docker), use relative paths (nginx proxy)
    // In development, use localhost:3001
    const isDevelopment = window.location.hostname === 'localhost' && window.location.port === '3000';
    this.baseUrl = baseUrl || (isDevelopment ? 'http://localhost:3001' : '');
  }

  async isAvailable(): Promise<boolean> {
    // Re-check availability if cache is stale
    const now = Date.now();
    if (this.available !== null &&
        this.availabilityCheckedAt !== null &&
        (now - this.availabilityCheckedAt) < this.AVAILABILITY_CACHE_MS) {
      return this.available;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/storage/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      const data = await response.json();
      this.available = data.enabled;
      this.availabilityCheckedAt = Date.now();
      console.log(`Server storage availability: ${this.available}`);
      return this.available ?? false;
    } catch (error) {
      console.log('Server storage not available:', error);
      this.available = false;
      this.availabilityCheckedAt = Date.now();
      return false;
    }
  }

  async listDiagrams(): Promise<DiagramInfo[]> {
    console.log(`Fetching diagrams from: ${this.baseUrl}/api/diagrams`);
    const response = await fetch(`${this.baseUrl}/api/diagrams`);
    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to list diagrams:', errorText);
      throw new Error(`Failed to list diagrams: ${response.status} ${errorText}`);
    }

    const diagrams = await response.json();
    console.log(`Received ${diagrams.length} diagrams from server:`, diagrams);

    return diagrams.map((d: any) => ({
      ...d,
      lastModified: new Date(d.lastModified)
    }));
  }

  async loadDiagram(id: string): Promise<Model> {
    console.log(`ServerStorage: Loading diagram ${id} from ${this.baseUrl}/api/diagrams/${id}`);
    try {
      const response = await fetch(`${this.baseUrl}/api/diagrams/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ServerStorage: Failed to load diagram ${id}: ${response.status} ${errorText}`);
        throw new Error(`Failed to load diagram: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log(`ServerStorage: Successfully loaded diagram ${id}, items: ${data.items?.length || 0}`);
      return data;
    } catch (error) {
      console.error(`ServerStorage: Error loading diagram ${id}:`, error);
      throw error;
    }
  }

  async saveDiagram(id: string, data: Model): Promise<void> {
    console.log(`ServerStorage: Saving diagram ${id}`);
    try {
      const response = await fetch(`${this.baseUrl}/api/diagrams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(15000) // 15 second timeout for saves
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ServerStorage: Failed to save diagram ${id}: ${response.status} ${errorText}`);
        throw new Error(`Failed to save diagram: ${response.status}`);
      }

      console.log(`ServerStorage: Successfully saved diagram ${id}`);
    } catch (error) {
      console.error(`ServerStorage: Error saving diagram ${id}:`, error);
      throw error;
    }
  }

  async deleteDiagram(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/diagrams/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete diagram');
  }

  async createDiagram(data: Model): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/diagrams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create diagram');
    const result = await response.json();
    return result.id;
  }
}

// IndexedDB record shape: metadata kept alongside the full diagram payload so
// listDiagrams() doesn't need a separately-maintained index.
interface DiagramRecord {
  id: string;
  name: string;
  lastModified: string; // ISO string (IndexedDB structured clone handles Date fine too, but ISO keeps it consistent with ServerStorage's wire format)
  size: number;
  data: Model;
}

const DB_NAME = 'isenax';
const DB_VERSION = 1;
const STORE_NAME = 'diagrams';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then((db) => {
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const request = action(tx.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  });
}

// Local Storage Implementation — IndexedDB-backed, persists across browser
// restarts (unlike sessionStorage) with a much higher quota than localStorage.
class IndexedDBStorage implements StorageService {
  async isAvailable(): Promise<boolean> {
    if (typeof indexedDB === 'undefined') return false;
    try {
      await openDb();
      return true;
    } catch {
      return false;
    }
  }

  async listDiagrams(): Promise<DiagramInfo[]> {
    const records = await runTransaction<DiagramRecord[]>('readonly', (store) => {
      return store.getAll();
    });
    return records.map((r) => ({
      id: r.id,
      name: r.name,
      lastModified: new Date(r.lastModified),
      size: r.size
    }));
  }

  async loadDiagram(id: string): Promise<Model> {
    const record = await runTransaction<DiagramRecord | undefined>('readonly', (store) => {
      return store.get(id);
    });
    if (!record) throw new Error('Diagram not found');
    return record.data;
  }

  async saveDiagram(id: string, data: Model): Promise<void> {
    const record: DiagramRecord = {
      id,
      name: (data as any).name || (data as any).title || 'Untitled Diagram',
      lastModified: new Date().toISOString(),
      size: JSON.stringify(data).length,
      data
    };
    await runTransaction('readwrite', (store) => store.put(record));
  }

  async deleteDiagram(id: string): Promise<void> {
    await runTransaction('readwrite', (store) => store.delete(id));
  }

  async createDiagram(data: Model): Promise<string> {
    const id = `diagram_${Date.now()}`;
    await this.saveDiagram(id, data);
    return id;
  }
}

// Storage Manager — IndexedDB is always the local source of truth (every
// write lands there first and must succeed); the server, when reachable, is
// treated as a best-effort sync target on write and preferred on read. This
// keeps the app fully functional offline or with the optional backend off,
// while transparently syncing across devices when it's on.
class StorageManager implements StorageService {
  private serverStorage: ServerStorage;
  private localStorage: IndexedDBStorage;
  private serverAvailable = false;

  constructor() {
    this.serverStorage = new ServerStorage();
    this.localStorage = new IndexedDBStorage();
  }

  async initialize(): Promise<StorageService> {
    this.serverAvailable = await this.serverStorage.isAvailable();
    console.log(`StorageManager: server sync ${this.serverAvailable ? 'enabled' : 'disabled'}, local storage is IndexedDB`);
    return this;
  }

  isServerStorage(): boolean {
    return this.serverAvailable;
  }

  async isAvailable(): Promise<boolean> {
    return true; // IndexedDB backs every install; the manager is always usable
  }

  async listDiagrams(): Promise<DiagramInfo[]> {
    if (this.serverAvailable) {
      try {
        return await this.serverStorage.listDiagrams();
      } catch (err) {
        console.warn('StorageManager: server list failed, falling back to local', err);
        this.serverAvailable = false;
      }
    }
    return this.localStorage.listDiagrams();
  }

  async loadDiagram(id: string): Promise<Model> {
    if (this.serverAvailable) {
      try {
        const data = await this.serverStorage.loadDiagram(id);
        // Refresh the local cache so this diagram stays available offline.
        this.localStorage.saveDiagram(id, data).catch((err) => {
          console.warn('StorageManager: failed to refresh local cache', err);
        });
        return data;
      } catch (err) {
        console.warn('StorageManager: server load failed, falling back to local', err);
      }
    }
    return this.localStorage.loadDiagram(id);
  }

  async saveDiagram(id: string, data: Model): Promise<void> {
    await this.localStorage.saveDiagram(id, data);
    if (this.serverAvailable) {
      this.serverStorage.saveDiagram(id, data).catch((err) => {
        console.warn('StorageManager: server sync failed, kept locally for next save', err);
      });
    }
  }

  async deleteDiagram(id: string): Promise<void> {
    await this.localStorage.deleteDiagram(id);
    if (this.serverAvailable) {
      this.serverStorage.deleteDiagram(id).catch((err) => {
        console.warn('StorageManager: server delete sync failed', err);
      });
    }
  }

  async createDiagram(data: Model): Promise<string> {
    if (this.serverAvailable) {
      try {
        const id = await this.serverStorage.createDiagram(data);
        this.localStorage.saveDiagram(id, data).catch((err) => {
          console.warn('StorageManager: failed to cache new diagram locally', err);
        });
        return id;
      } catch (err) {
        console.warn('StorageManager: server create failed, creating locally', err);
        this.serverAvailable = false;
      }
    }
    return this.localStorage.createDiagram(data);
  }
}

// Export singleton instance
export const storageManager = new StorageManager();
