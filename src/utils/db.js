// Database utility for Go Station using IndexedDB and LocalStorage.
// It stores settings, users (Owner/Editors), playlist items (including large files like images/videos),
// ticker items, and logs (سجل العمليات).

const DB_NAME = 'GoStationDB';
const DB_VERSION = 1;

let dbInstance = null;

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

      // Playlist store (media elements)
      if (!db.objectStoreNames.contains('playlist')) {
        db.createObjectStore('playlist', { keyPath: 'id', autoIncrement: true });
      }

      // Ticker store (bottom ticker text elements)
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
      
      // Initialize default data (like default owner account if not exists)
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

// Seed default owner account and settings if they do not exist
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
    { key: 'stationLogo', value: null }, // Base64 or Object URL
    { key: 'weatherCity', value: 'Riyadh' }, // City for weather
    { key: 'tickerSpeed', value: 15 }, // seconds for full scroll
    { key: 'layoutRotation', value: '90' }, // Default to '90' degrees portrait stand
  ];

  for (const setting of defaultSettings) {
    const existing = await readTransaction(db, 'settings', 'get', setting.key);
    if (!existing) {
      await writeTransaction(db, 'settings', 'put', setting);
    } else if (setting.key === 'layoutRotation' && existing.value === '0') {
      // Force change default to vertical (90 degrees)
      await writeTransaction(db, 'settings', 'put', setting);
    }
  }
}

// Transaction Helpers
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

// API Export
export const db = {
  // Users Management
  async getUsers() {
    const d = await getDB();
    return readTransaction(d, 'users', 'getAll');
  },
  
  async getUser(username) {
    const d = await getDB();
    return readTransaction(d, 'users', 'get', username);
  },

  async saveUser(user) {
    const d = await getDB();
    return writeTransaction(d, 'users', 'put', user);
  },

  async deleteUser(username) {
    const d = await getDB();
    return writeTransaction(d, 'users', 'delete', username);
  },

  // Playlist Management
  async getPlaylist() {
    const d = await getDB();
    const items = await readTransaction(d, 'playlist', 'getAll');
    // Sort items by order position
    return items.sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  async getPlaylistItem(id) {
    const d = await getDB();
    return readTransaction(d, 'playlist', 'get', id);
  },

  async savePlaylistItem(item) {
    const d = await getDB();
    if (!item.createdAt) {
      item.createdAt = new Date().toISOString();
    }
    // Set auto-incrementing order if not provided
    if (item.order === undefined) {
      const current = await this.getPlaylist();
      item.order = current.length > 0 ? Math.max(...current.map(i => i.order || 0)) + 1 : 0;
    }
    return writeTransaction(d, 'playlist', 'put', item);
  },

  async deletePlaylistItem(id) {
    const d = await getDB();
    return writeTransaction(d, 'playlist', 'delete', id);
  },

  async updatePlaylistOrder(reorderedItems) {
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
    const d = await getDB();
    return readTransaction(d, 'ticker', 'getAll');
  },

  async saveTickerItem(item) {
    const d = await getDB();
    if (!item.createdAt) {
      item.createdAt = new Date().toISOString();
    }
    return writeTransaction(d, 'ticker', 'put', item);
  },

  async deleteTickerItem(id) {
    const d = await getDB();
    return writeTransaction(d, 'ticker', 'delete', id);
  },

  // Settings Management
  async getSettings() {
    const d = await getDB();
    const list = await readTransaction(d, 'settings', 'getAll');
    const settingsObj = {};
    list.forEach(item => {
      settingsObj[item.key] = item.value;
    });
    return settingsObj;
  },

  async saveSetting(key, value) {
    const d = await getDB();
    return writeTransaction(d, 'settings', 'put', { key, value });
  },

  // Logs / Activity Recording
  async getLogs() {
    const d = await getDB();
    const logs = await readTransaction(d, 'logs', 'getAll');
    // Sort descending (newest first)
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  async addLog(username, role, actionType, entityType, details) {
    const d = await getDB();
    const log = {
      timestamp: new Date().toISOString(),
      username,
      role,
      actionType, // ADD, EDIT, DELETE, LOGIN, SETTINGS, LOGOUT
      entityType, // PLAYLIST, TICKER, SETTINGS, USER
      details
    };
    return writeTransaction(d, 'logs', 'put', log);
  },

  async clearLogs() {
    const d = await getDB();
    return writeTransaction(d, 'logs', 'clear');
  }
};
