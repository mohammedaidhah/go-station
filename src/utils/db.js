// Database utility for Go Station using IndexedDB (for local caching & fallback) and Supabase (for cloud DB & storage).
// Supports offline fallback: if Supabase config is missing or network goes down, reads from local cache.
import { createClient } from '@supabase/supabase-js';

const DB_NAME = 'GoStationDB';
const DB_VERSION = 1;

let dbInstance = null;

// Get Supabase credentials
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('[DB] Supabase cloud client initialized successfully.');
  } catch (err) {
    console.error('[DB] Error initializing Supabase client:', err);
  }
} else {
  console.log('[DB] Supabase credentials not found. Operating in local IndexedDB mode.');
}

// -----------------------------------------
// DATA MAPPING HELPERS (JS camelCase <-> DB snake_case)
// -----------------------------------------
const mapDbPlaylistToJs = (item) => {
  if (!item) return null;
  return {
    id: Number(item.id),
    title: item.title,
    type: item.type,
    url: item.url,
    duration: item.duration,
    order: item.order,
    scheduleType: item.schedule_type,
    startDateTime: item.start_date_time,
    endDateTime: item.end_date_time,
    createdBy: item.created_by,
    createdAt: item.created_at
  };
};

const mapJsPlaylistToDb = (item) => {
  if (!item) return null;
  const dbItem = {
    title: item.title,
    type: item.type,
    url: item.url,
    duration: item.duration,
    order: item.order,
    schedule_type: item.scheduleType,
    start_date_time: item.startDateTime,
    end_date_time: item.endDateTime,
    created_by: item.createdBy,
    created_at: item.createdAt
  };
  if (item.id !== undefined && item.id !== null) {
    dbItem.id = item.id;
  }
  return dbItem;
};

const mapDbTickerToJs = (item) => {
  if (!item) return null;
  return {
    id: Number(item.id),
    text: item.text,
    scheduleType: item.schedule_type,
    startDateTime: item.start_date_time,
    endDateTime: item.end_date_time,
    createdBy: item.created_by,
    createdAt: item.created_at
  };
};

const mapJsTickerToDb = (item) => {
  if (!item) return null;
  const dbItem = {
    text: item.text,
    schedule_type: item.scheduleType,
    start_date_time: item.startDateTime,
    end_date_time: item.endDateTime,
    created_by: item.createdBy,
    created_at: item.createdAt
  };
  if (item.id !== undefined && item.id !== null) {
    dbItem.id = item.id;
  }
  return dbItem;
};

const mapDbLogToJs = (item) => {
  if (!item) return null;
  return {
    id: Number(item.id),
    timestamp: item.timestamp,
    username: item.username,
    role: item.role,
    actionType: item.action_type,
    entityType: item.entity_type,
    details: item.details
  };
};

const mapJsLogToDb = (item) => {
  if (!item) return null;
  const dbItem = {
    timestamp: item.timestamp,
    username: item.username,
    role: item.role,
    action_type: item.actionType,
    entity_type: item.entityType,
    details: item.details
  };
  if (item.id !== undefined && item.id !== null) {
    dbItem.id = item.id;
  }
  return dbItem;
};

// -----------------------------------------
// LOCAL INDEXEDDB CODE
// -----------------------------------------
function getDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Users store
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'username' });
      }

      // Playlist store
      if (!db.objectStoreNames.contains('playlist')) {
        db.createObjectStore('playlist', { keyPath: 'id', autoIncrement: true });
      }

      // Ticker store
      if (!db.objectStoreNames.contains('ticker')) {
        db.createObjectStore('ticker', { keyPath: 'id', autoIncrement: true });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Activity logs store
      if (!db.objectStoreNames.contains('logs')) {
        const logStore = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
        logStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      
      // Initialize default data locally in IndexedDB
      initializeDefaultData(dbInstance)
        .then(() => resolve(dbInstance))
        .catch(reject);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };
  });
}

async function initializeDefaultData(db) {
  // Add default owner
  const defaultOwner = {
    username: 'admin',
    password: 'admin123',
    role: 'owner',
    createdBy: 'system',
    createdAt: new Date().toISOString()
  };
  await writeTransaction(db, 'users', 'put', defaultOwner);

  // Add default settings
  const defaultSettings = [
    { key: 'stationName', value: 'شركة هلا السعودية للخدمات البترولية' },
    { key: 'stationLogo', value: null },
    { key: 'weatherCity', value: 'Riyadh' },
    { key: 'tickerSpeed', value: 15 },
    { key: 'layoutRotation', value: '90' },
  ];

  for (const setting of defaultSettings) {
    const existing = await readTransaction(db, 'settings', 'get', setting.key);
    if (!existing) {
      await writeTransaction(db, 'settings', 'put', setting);
    }
  }
}

function readTransaction(db, storeName, operation, key = null) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    let request;

    if (operation === 'get') {
      request = store.get(key);
    } else if (operation === 'getAll') {
      request = store.getAll();
    } else {
      reject(new Error(`Invalid read operation: ${operation}`));
      return;
    }

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function writeTransaction(db, storeName, operation, value, key = null) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    let request;

    if (operation === 'put') {
      request = store.put(value);
    } else if (operation === 'delete') {
      request = store.delete(key || value);
    } else if (operation === 'clear') {
      request = store.clear();
    } else {
      reject(new Error(`Invalid write operation: ${operation}`));
      return;
    }

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// -----------------------------------------
// EXPORTED DATABASE INTERFACE
// -----------------------------------------
export const db = {
  // Users Management
  async getUsers() {
    if (supabase) {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data;
    }
    const d = await getDB();
    return readTransaction(d, 'users', 'getAll');
  },
  
  async getUser(username) {
    if (supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('username', username).maybeSingle();
      if (error) throw error;
      return data;
    }
    const d = await getDB();
    return readTransaction(d, 'users', 'get', username);
  },

  async saveUser(user) {
    if (supabase) {
      const { error } = await supabase.from('users').upsert(user);
      if (error) throw error;
      return user.username;
    }
    const d = await getDB();
    return writeTransaction(d, 'users', 'put', user);
  },

  async deleteUser(username) {
    if (supabase) {
      const { error } = await supabase.from('users').delete().eq('username', username);
      if (error) throw error;
      return username;
    }
    const d = await getDB();
    return writeTransaction(d, 'users', 'delete', username);
  },

  // Playlist Management
  async getPlaylist() {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('playlist').select('*').order('order', { ascending: true });
        if (error) throw error;
        
        const jsItems = data.map(mapDbPlaylistToJs);
        // Sync local cache in background
        try {
          const d = await getDB();
          await writeTransaction(d, 'playlist', 'clear');
          for (const item of jsItems) {
            await writeTransaction(d, 'playlist', 'put', item);
          }
        } catch (e) {
          console.warn('[DB] Local cache update failed:', e);
        }
        return jsItems;
      } catch (err) {
        console.error('[DB] Supabase error, falling back to local cache:', err);
      }
    }
    const d = await getDB();
    const items = await readTransaction(d, 'playlist', 'getAll');
    return items.sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  async getPlaylistItem(id) {
    if (supabase) {
      const { data, error } = await supabase.from('playlist').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return mapDbPlaylistToJs(data);
    }
    const d = await getDB();
    return readTransaction(d, 'playlist', 'get', id);
  },

  async savePlaylistItem(item) {
    if (!item.createdAt) {
      item.createdAt = new Date().toISOString();
    }
    if (item.order === undefined) {
      const current = await this.getPlaylist();
      item.order = current.length > 0 ? Math.max(...current.map(i => i.order || 0)) + 1 : 0;
    }

    if (supabase) {
      const dbItem = mapJsPlaylistToDb(item);
      const { data, error } = await supabase.from('playlist').upsert(dbItem).select();
      if (error) throw error;
      
      const jsItem = mapDbPlaylistToJs(data[0]);
      // Sync local cache
      try {
        const d = await getDB();
        await writeTransaction(d, 'playlist', 'put', jsItem);
      } catch (e) {
        console.warn('[DB] Local cache update failed:', e);
      }
      return jsItem.id;
    }

    const d = await getDB();
    return writeTransaction(d, 'playlist', 'put', item);
  },

  async deletePlaylistItem(id) {
    if (supabase) {
      const { error } = await supabase.from('playlist').delete().eq('id', id);
      if (error) throw error;
      
      try {
        const d = await getDB();
        await writeTransaction(d, 'playlist', 'delete', id);
      } catch (e) {
        console.warn('[DB] Local cache update failed:', e);
      }
      return id;
    }
    const d = await getDB();
    return writeTransaction(d, 'playlist', 'delete', id);
  },

  async updatePlaylistOrder(reorderedItems) {
    if (supabase) {
      const updates = reorderedItems.map((item, index) => {
        item.order = index;
        return mapJsPlaylistToDb(item);
      });
      
      for (const dbItem of updates) {
        const { error } = await supabase.from('playlist').upsert(dbItem);
        if (error) throw error;
      }
      
      try {
        const d = await getDB();
        const transaction = d.transaction(['playlist'], 'readwrite');
        const store = transaction.objectStore('playlist');
        reorderedItems.forEach((item) => {
          store.put(item);
        });
      } catch (e) {
        console.warn('[DB] Local cache update failed:', e);
      }
      return;
    }

    const d = await getDB();
    const transaction = d.transaction(['playlist'], 'readwrite');
    const store = transaction.objectStore('playlist');
    
    return new Promise((resolve, reject) => {
      reorderedItems.forEach((item, index) => {
        item.order = index;
        store.put(item);
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // Ticker Management
  async getTickerItems() {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('ticker_items').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        
        const jsItems = data.map(mapDbTickerToJs);
        try {
          const d = await getDB();
          await writeTransaction(d, 'ticker', 'clear');
          for (const item of jsItems) {
            await writeTransaction(d, 'ticker', 'put', item);
          }
        } catch (e) {
          console.warn('[DB] Local cache update failed:', e);
        }
        return jsItems;
      } catch (err) {
        console.error('[DB] Supabase error, falling back to local ticker cache:', err);
      }
    }
    const d = await getDB();
    return readTransaction(d, 'ticker', 'getAll');
  },

  async saveTickerItem(item) {
    if (!item.createdAt) {
      item.createdAt = new Date().toISOString();
    }

    if (supabase) {
      const dbItem = mapJsTickerToDb(item);
      const { data, error } = await supabase.from('ticker_items').upsert(dbItem).select();
      if (error) throw error;
      
      const jsItem = mapDbTickerToJs(data[0]);
      try {
        const d = await getDB();
        await writeTransaction(d, 'ticker', 'put', jsItem);
      } catch (e) {
        console.warn('[DB] Local cache update failed:', e);
      }
      return jsItem.id;
    }

    const d = await getDB();
    return writeTransaction(d, 'ticker', 'put', item);
  },

  async deleteTickerItem(id) {
    if (supabase) {
      const { error } = await supabase.from('ticker_items').delete().eq('id', id);
      if (error) throw error;
      
      try {
        const d = await getDB();
        await writeTransaction(d, 'ticker', 'delete', id);
      } catch (e) {
        console.warn('[DB] Local cache update failed:', e);
      }
      return id;
    }
    const d = await getDB();
    return writeTransaction(d, 'ticker', 'delete', id);
  },

  // Settings Management
  async getSettings() {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('settings').select('*');
        if (error) throw error;
        
        const settingsObj = {};
        data.forEach(item => {
          settingsObj[item.key] = item.value;
        });
        
        try {
          const d = await getDB();
          for (const item of data) {
            await writeTransaction(d, 'settings', 'put', item);
          }
        } catch (e) {
          console.warn('[DB] Local settings cache update failed:', e);
        }
        return settingsObj;
      } catch (err) {
        console.error('[DB] Supabase error, falling back to local settings cache:', err);
      }
    }

    const d = await getDB();
    const list = await readTransaction(d, 'settings', 'getAll');
    const settingsObj = {};
    list.forEach(item => {
      settingsObj[item.key] = item.value;
    });
    return settingsObj;
  },

  async saveSetting(key, value) {
    if (supabase) {
      const { error } = await supabase.from('settings').upsert({ key, value });
      if (error) throw error;
      
      try {
        const d = await getDB();
        await writeTransaction(d, 'settings', 'put', { key, value });
      } catch (e) {
        console.warn('[DB] Local settings cache update failed:', e);
      }
      return;
    }

    const d = await getDB();
    return writeTransaction(d, 'settings', 'put', { key, value });
  },

  // Logs / Activity Recording
  async getLogs() {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('logs').select('*').order('timestamp', { ascending: false });
        if (error) throw error;
        return data.map(mapDbLogToJs);
      } catch (err) {
        console.error('[DB] Supabase error, falling back to local logs cache:', err);
      }
    }

    const d = await getDB();
    const logs = await readTransaction(d, 'logs', 'getAll');
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  async addLog(username, role, actionType, entityType, details) {
    const log = {
      timestamp: new Date().toISOString(),
      username,
      role,
      actionType,
      entityType,
      details
    };

    if (supabase) {
      try {
        const dbLog = mapJsLogToDb(log);
        const { error } = await supabase.from('logs').insert(dbLog);
        if (error) console.error('[DB] Failed to save log in Supabase:', error);
      } catch (err) {
        console.error('[DB] Supabase log insert error:', err);
      }
      
      try {
        const d = await getDB();
        await writeTransaction(d, 'logs', 'put', log);
      } catch (e) {
        console.warn('[DB] Local log cache update failed:', e);
      }
      return;
    }

    const d = await getDB();
    return writeTransaction(d, 'logs', 'put', log);
  },

  async clearLogs() {
    if (supabase) {
      const { error } = await supabase.from('logs').delete().neq('id', 0);
      if (error) throw error;
      
      try {
        const d = await getDB();
        await writeTransaction(d, 'logs', 'clear');
      } catch (e) {
        console.warn('[DB] Local logs cache clear failed:', e);
      }
      return;
    }

    const d = await getDB();
    return writeTransaction(d, 'logs', 'clear');
  },

  // -----------------------------------------
  // SUPABASE CLOUD FILE UPLOADS
  // -----------------------------------------
  async uploadMedia(file) {
    if (supabase) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);
          
        return publicUrl;
      } catch (err) {
        console.error('[DB] Supabase Storage upload error:', err);
        throw err;
      }
    }
    
    // Local fallback: convert to Base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }
};
