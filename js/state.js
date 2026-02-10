// state.js - Gerenciamento centralizado de estado
// Versão 5.3 - Com correções de null checks

const AppState = {
    // Playlist atual
    currentPlaylist: [],
    currentPlaylistName: "",
    currentPlaylistType: "",
    currentPlaylistUrl: "",
    
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
    lastOverlayFocusIndex: -1,
    
    // Categoria e subcategoria atual
    currentCategory: null,
    currentSubcategories: null,
    currentSubcategoryName: null,
    currentSubCategoryIndex: -1,
    
    // Para restaurar após fechar player
    viewBeforePlayer: null,
    categoryBeforePlayer: null,
    subcategoriesBeforePlayer: null,
    
    // Índices para restauração
    lastCategoryIndex: -1,
    lastSubCategoryIndex: -1,
    lastChannelIndex: -1,
    
    // Cache
    cache: new Map(),
    cacheTimestamps: new Map(),
    
    // Arrays de elementos DOM
    channelItems: [],
    playlistItems: [],
    remotePlaylistItems: [],
    overlayChannels: [],
    
    // Índice de playlist grande
    playlistIndex: null,
    
    // Flags
    restoringState: false,
    isPlaying: false,
    returningFromSubcategory: false,
    
    // Continue Assistindo (Histórico)
    watchHistory: [],
    MAX_HISTORY_ITEMS: 20,
    
    // ========================================
    // SALVAR ESTADO ANTES DO PLAYER
    // ========================================
    saveStateBeforePlayer: function() {
        this.viewBeforePlayer = this.currentView;
        this.categoryBeforePlayer = this.currentCategory;
        this.subcategoriesBeforePlayer = this.currentSubcategories;
        
        console.log('💾 Estado salvo antes do player:');
        console.log('   View:', this.viewBeforePlayer);
        console.log('   Categoria:', this.categoryBeforePlayer);
    },
    
    // ========================================
    // RESTAURAR ESTADO APÓS PLAYER
    // ========================================
    restoreStateAfterPlayer: function() {
        if (this.viewBeforePlayer) {
            this.currentView = this.viewBeforePlayer;
        }
        if (this.categoryBeforePlayer) {
            this.currentCategory = this.categoryBeforePlayer;
        }
        if (this.subcategoriesBeforePlayer) {
            this.currentSubcategories = this.subcategoriesBeforePlayer;
        }
        
        console.log('🔄 Estado restaurado após player:');
        console.log('   View:', this.currentView);
        console.log('   Categoria:', this.currentCategory);
        
        // Limpar variáveis temporárias
        this.viewBeforePlayer = null;
        this.categoryBeforePlayer = null;
        this.subcategoriesBeforePlayer = null;
    },
    
    // ========================================
    // MÉTODOS DE PLAYLIST
    // ========================================
    setPlaylist: function(urls, name, type) {
        this.currentPlaylist = urls || [];
        this.currentPlaylistName = name || "";
        this.currentPlaylistType = type || "";
        console.log('📋 Definindo playlist:', name, '(' + (urls ? urls.length : 0) + ' canais)');
    },
    
    setCurrentChannel: function(channel, index) {
        this.currentChannel = channel;
        this.currentChannelIndex = index;
        console.log('📺 Canal selecionado:', channel ? channel.name : 'nenhum', '(índice:', index + ')');
        
        if (channel && channel.group) {
            this.currentCategory = channel.group;
        }
    },
    
    resetChannelPosition: function() {
        this.lastPosition = 0;
    },
    
    // ========================================
    // CACHE DE PLAYLIST
    // ========================================
    cachePlaylist: function(key, data) {
        if (!key || !data) return;
        
        this.cache.set(key, data);
        this.cacheTimestamps.set(key, Date.now());
        console.log('💾 Playlist cacheada:', key, '(' + data.length + ' canais)');
        
        if (this.cache.size > 10) {
            var oldest = [...this.cacheTimestamps.entries()]
                .sort(function(a, b) { return a[1] - b[1]; })[0][0];
            this.cache.delete(oldest);
            this.cacheTimestamps.delete(oldest);
        }
    },
    
    getCachedPlaylist: function(key) {
        if (this.cache.has(key)) {
            this.cacheTimestamps.set(key, Date.now());
            return this.cache.get(key);
        }
        return null;
    },
    
    // ========================================
    // CONTINUE ASSISTINDO - HISTÓRICO
    // ========================================
    loadWatchHistory: function(callback) {
        try {
            var saved = localStorage.getItem('watchHistory');
            if (saved) {
                var parsed = JSON.parse(saved);
                // Filtrar itens inválidos
                this.watchHistory = (parsed || []).filter(function(item) {
                    return item && item.channel && item.channel.url;
                });
                console.log('📂 Histórico carregado do localStorage:', this.watchHistory.length, 'itens');
            } else {
                this.watchHistory = [];
            }
        } catch (e) {
            console.warn('⚠️ Erro ao carregar histórico:', e);
            this.watchHistory = [];
        }
        
        if (callback) callback(this.watchHistory);
    },
    
    saveWatchHistory: function() {
        try {
            localStorage.setItem('watchHistory', JSON.stringify(this.watchHistory || []));
            console.log('💾 Histórico salvo no localStorage');
        } catch (e) {
            console.warn('⚠️ Erro ao salvar histórico:', e);
        }
    },
    
    addToWatchHistory: function(channel, path) {
        // Verificar se channel é válido
        if (!channel || !channel.url) {
            console.warn('⚠️ Canal inválido para histórico:', channel);
            return;
        }
        
        console.log('╔═══════════════════════════════════════╗');
        console.log('📺 Adicionando ao Continue Assistindo');
        console.log('   Canal:', channel.name);
        console.log('╚═══════════════════════════════════════╝');
        
        // Garantir que watchHistory existe
        if (!this.watchHistory) {
            this.watchHistory = [];
        }
        
        // Remover duplicatas (mesmo URL)
        var existingIndex = -1;
        for (var i = 0; i < this.watchHistory.length; i++) {
            var item = this.watchHistory[i];
            if (item && item.channel && item.channel.url === channel.url) {
                existingIndex = i;
                break;
            }
        }
        
        if (existingIndex !== -1) {
            this.watchHistory.splice(existingIndex, 1);
            console.log('   🔄 Removendo duplicata (mesmo URL)');
        }
        
        // Adicionar no início com dados seguros
        this.watchHistory.unshift({
            channel: {
                url: channel.url,
                name: channel.name || 'Canal sem nome',
                group: channel.group || '',
                logo: channel.logo || ''
            },
            path: path || {},
            timestamp: Date.now()
        });
        
        // Limitar tamanho
        if (this.watchHistory.length > this.MAX_HISTORY_ITEMS) {
            this.watchHistory = this.watchHistory.slice(0, this.MAX_HISTORY_ITEMS);
        }
        
        console.log('   ✅ Histórico atualizado:', this.watchHistory.length, 'itens');
        
        this.saveWatchHistory();
    },
    
    getWatchHistory: function() {
        return this.watchHistory || [];
    },
    
    clearWatchHistory: function() {
        this.watchHistory = [];
        this.saveWatchHistory();
        console.log('🗑️ Histórico limpo');
    },
    
    // ========================================
    // RESET DE ESTADO
    // ========================================
    reset: function() {
        console.log('🔄 Resetando estado da aplicação...');
        
        this.currentPlaylist = [];
        this.currentChannel = null;
        this.currentChannelIndex = -1;
        this.lastPosition = 0;
        this.currentView = 'buttons';
        this.focusIndex = 0;
        this.currentFocusIndex = -1;
        this.playlistFocusIndex = -1;
        this.remoteFocusIndex = -1;
        this.overlayFocusIndex = 0;
        this.lastOverlayFocusIndex = -1;
        
        this.currentCategory = null;
        this.currentSubcategories = null;
        this.currentSubcategoryName = null;
        this.currentSubCategoryIndex = -1;
        
        this.viewBeforePlayer = null;
        this.categoryBeforePlayer = null;
        this.subcategoriesBeforePlayer = null;
        
        this.lastCategoryIndex = -1;
        this.lastSubCategoryIndex = -1;
        this.lastChannelIndex = -1;
        
        this.channelItems = [];
        this.playlistItems = [];
        this.remotePlaylistItems = [];
        this.overlayChannels = [];
        
        this.playlistIndex = null;
        
        this.restoringState = false;
        this.isPlaying = false;
        this.returningFromSubcategory = false;
        
        console.log('✅ Estado resetado com sucesso');
    },
    
    resetState: function() {
        this.reset();
    }
};

// ========================================
// DEBUG
// ========================================
window.debugState = function() {
    console.log('╔═══════════════════════════════════════╗');
    console.log('🔍 DEBUG - AppState');
    console.log('╚═══════════════════════════════════════╝');
    console.log('currentView:', AppState.currentView);
    console.log('currentCategory:', AppState.currentCategory);
    console.log('viewBeforePlayer:', AppState.viewBeforePlayer);
    console.log('categoryBeforePlayer:', AppState.categoryBeforePlayer);
    console.log('overlayChannels:', AppState.overlayChannels ? AppState.overlayChannels.length : 0);
    console.log('watchHistory:', AppState.watchHistory ? AppState.watchHistory.length : 0);
    console.log('╚═══════════════════════════════════════╝');
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppState;
}

console.log('✅ AppState carregado (v5.3)');
console.log('📊 Navegação em 3 níveis: Categorias → Subcategorias → Canais');
console.log('🛡️ Sistema de filtros ativo');
console.log('⏯️ Continue Assistindo ativo');
console.log('💡 Digite "debugState()" no console para ver status completo');
