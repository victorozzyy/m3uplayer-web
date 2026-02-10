const IndexedDBModule = {
    db: null,
    dbName: 'M3UPlayerDB',
    version: 1,
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB inicializado');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('playlists')) {
                    const store = db.createObjectStore('playlists', { keyPath: 'id' });
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                console.log('📊 IndexedDB estrutura criada');
            };
        });
    },
    
    async savePlaylist(id, name, channels) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['playlists'], 'readwrite');
            const store = transaction.objectStore('playlists');
            
            const data = {
                id,
                name,
                channels,
                timestamp: Date.now(),
                size: JSON.stringify(channels).length
            };
            
            const request = store.put(data);
            
            request.onsuccess = () => {
                console.log(`💾 Playlist salva no IndexedDB: ${name} (${channels.length} canais)`);
                resolve();
            };
            
            request.onerror = () => reject(request.error);
        });
    },
    
    async loadPlaylist(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['playlists'], 'readonly');
            const store = transaction.objectStore('playlists');
            const request = store.get(id);
            
            request.onsuccess = () => {
                const result = request.result;
                if (result) {
                    console.log(`📦 Playlist carregada do IndexedDB: ${result.name}`);
                    resolve(result.channels);
                } else {
                    resolve(null);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    },
    
    async listPlaylists() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['playlists'], 'readonly');
            const store = transaction.objectStore('playlists');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const playlists = request.result.map(p => ({
                    id: p.id,
                    name: p.name,
                    channelCount: p.channels.length,
                    timestamp: p.timestamp,
                    size: p.size
                }));
                resolve(playlists);
            };
            
            request.onerror = () => reject(request.error);
        });
    },
    
    async deletePlaylist(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['playlists'], 'readwrite');
            const store = transaction.objectStore('playlists');
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log(`🗑️ Playlist deletada: ${id}`);
                resolve();
            };
            
            request.onerror = () => reject(request.error);
        });
    },
    
    async checkStorageQuota() {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            const used = (estimate.usage / (1024 * 1024)).toFixed(2);
            const quota = (estimate.quota / (1024 * 1024)).toFixed(2);
            const percent = ((estimate.usage / estimate.quota) * 100).toFixed(1);
            
            console.log(`💾 Armazenamento: ${used}MB / ${quota}MB (${percent}%)`);
            return estimate;
        }
        return null;
    }
};
