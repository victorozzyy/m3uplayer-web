// state.js - Gerenciamento centralizado de estado (sem localStorage)

const AppState = {
    // Playlist atual
    currentPlaylist: [],
    currentPlaylistName: "",
    currentPlaylistType: "",
    
    // Canal atual
    currentChannel: null,
    currentChannelIndex: -1,
    lastPosition: 0,
    
    // Navegação
    currentView: 'buttons',
    focusIndex: 0,
    currentFocusIndex: -1,
    playlistFocusIndex: -1,
    remoteFocusIndex: -1,
    overlayFocusIndex: 0,
    
    // Cache
    cache: new Map(),
    cacheTimestamps: new Map(),
    
    // Arrays de elementos DOM
    channelItems: [],
    playlistItems: [],
    remotePlaylistItems: [],
    overlayChannels: [],
    
    // Flags
    restoringState: false,
    isPlaying: false,
    
    // Métodos
    setPlaylist(urls, name, type) {
        this.currentPlaylist = urls;
        this.currentPlaylistName = name;
        this.currentPlaylistType = type;
    },
    
    setCurrentChannel(channel, index) {
        this.currentChannel = channel;
        this.currentChannelIndex = index;
    },
    
    resetChannelPosition() {
        this.lastPosition = 0;
    },
    
    cachePlaylist(key, data) {
        this.cache.set(key, data);
        this.cacheTimestamps.set(key, Date.now());
        
        // Limita cache a 10 entradas
        if (this.cache.size > 10) {
            const oldest = [...this.cacheTimestamps.entries()]
                .sort(([,a], [,b]) => a - b)[0][0];
            this.cache.delete(oldest);
            this.cacheTimestamps.delete(oldest);
        }
    },
    
    getCachedPlaylist(key) {
        if (this.cache.has(key)) {
            this.cacheTimestamps.set(key, Date.now());
            return this.cache.get(key);
        }
        return null;
    },
    
    reset() {
        this.currentPlaylist = [];
        this.currentChannel = null;
        this.currentChannelIndex = -1;
        this.lastPosition = 0;
        this.currentView = 'buttons';
        this.focusIndex = 0;
    }
};

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppState;
}
