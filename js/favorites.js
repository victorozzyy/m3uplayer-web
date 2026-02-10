// favorites.js - Sistema de Favoritos
// Versão 1.0

var FavoritesModule = {
    
    // Chave para localStorage
    STORAGE_KEY: 'iptv_favorites',
    
    // Lista de favoritos em memória
    favorites: [],
    
    // ========================================
    // 🔧 INICIALIZAÇÃO
    // ========================================
    init: function() {
        this.loadFavorites();
        console.log('⭐ FavoritesModule inicializado');
        console.log('   Favoritos carregados:', this.favorites.length);
    },
    
    // ========================================
    // 💾 CARREGAR FAVORITOS DO STORAGE
    // ========================================
    loadFavorites: function() {
        try {
            var saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                this.favorites = JSON.parse(saved);
                
                // Validar estrutura dos favoritos
                this.favorites = this.favorites.filter(function(fav) {
                    return fav && fav.url && fav.name;
                });
            } else {
                this.favorites = [];
            }
        } catch (e) {
            console.error('❌ Erro ao carregar favoritos:', e);
            this.favorites = [];
        }
        
        return this.favorites;
    },
    
    // ========================================
    // 💾 SALVAR FAVORITOS NO STORAGE
    // ========================================
    saveFavorites: function() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.favorites));
            console.log('💾 Favoritos salvos:', this.favorites.length);
            return true;
        } catch (e) {
            console.error('❌ Erro ao salvar favoritos:', e);
            return false;
        }
    },
    
    // ========================================
    // ⭐ ADICIONAR AOS FAVORITOS
    // ========================================
    add: function(channel, playlistInfo) {
        if (!channel || !channel.url) {
            console.warn('⚠️ Canal inválido para favoritar');
            return false;
        }
        
        // Verificar se já existe
        if (this.isFavorite(channel.url)) {
            console.log('ℹ️ Canal já está nos favoritos');
            return false;
        }
        
        var favorite = {
            url: channel.url,
            name: channel.name || 'Canal sem nome',
            group: channel.group || 'Outros',
            logo: channel.logo || null,
            addedAt: Date.now(),
            playlistName: playlistInfo ? playlistInfo.playlistName : (AppState.currentPlaylistName || ''),
            playlistUrl: playlistInfo ? playlistInfo.playlistUrl : (AppState.currentPlaylistUrl || '')
        };
        
        // Adicionar no início da lista
        this.favorites.unshift(favorite);
        
        // Limitar a 500 favoritos
        if (this.favorites.length > 500) {
            this.favorites = this.favorites.slice(0, 500);
        }
        
        this.saveFavorites();
        
        console.log('⭐ Adicionado aos favoritos:', favorite.name);
        
        // Disparar evento
        this.dispatchEvent('favorite-added', favorite);
        
        return true;
    },
    
    // ========================================
    // ❌ REMOVER DOS FAVORITOS
    // ========================================
    remove: function(url) {
        if (!url) return false;
        
        var initialLength = this.favorites.length;
        
        this.favorites = this.favorites.filter(function(fav) {
            return fav.url !== url;
        });
        
        if (this.favorites.length < initialLength) {
            this.saveFavorites();
            console.log('❌ Removido dos favoritos:', url);
            
            // Disparar evento
            this.dispatchEvent('favorite-removed', { url: url });
            
            return true;
        }
        
        return false;
    },
    
    // ========================================
    // 🔄 ALTERNAR FAVORITO
    // ========================================
    toggle: function(channel, playlistInfo) {
        if (this.isFavorite(channel.url)) {
            this.remove(channel.url);
            return false; // Removido
        } else {
            this.add(channel, playlistInfo);
            return true; // Adicionado
        }
    },
    
    // ========================================
    // ✅ VERIFICAR SE É FAVORITO
    // ========================================
    isFavorite: function(url) {
        if (!url) return false;
        
        return this.favorites.some(function(fav) {
            return fav.url === url;
        });
    },
    
    // ========================================
    // 📋 OBTER TODOS OS FAVORITOS
    // ========================================
    getAll: function() {
        return this.favorites.slice(); // Retorna cópia
    },
    
    // ========================================
    // 📋 OBTER FAVORITOS DA PLAYLIST ATUAL
    // ========================================
    getForCurrentPlaylist: function() {
        var currentUrl = AppState.currentPlaylistUrl || '';
        var currentName = AppState.currentPlaylistName || '';
        
        return this.favorites.filter(function(fav) {
            // Se não tem info de playlist, mostrar para todos
            if (!fav.playlistUrl && !fav.playlistName) return true;
            
            return fav.playlistUrl === currentUrl || fav.playlistName === currentName;
        });
    },
    
    // ========================================
    // 📊 OBTER CONTAGEM
    // ========================================
    getCount: function() {
        return this.favorites.length;
    },
    
    getCountForCurrentPlaylist: function() {
        return this.getForCurrentPlaylist().length;
    },
    
    // ========================================
    // 🗑️ LIMPAR TODOS OS FAVORITOS
    // ========================================
    clearAll: function() {
        this.favorites = [];
        this.saveFavorites();
        console.log('🗑️ Todos os favoritos removidos');
        this.dispatchEvent('favorites-cleared', {});
    },
    
    // ========================================
    // 🔀 REORDENAR FAVORITO
    // ========================================
    moveToTop: function(url) {
        var index = -1;
        for (var i = 0; i < this.favorites.length; i++) {
            if (this.favorites[i].url === url) {
                index = i;
                break;
            }
        }
        
        if (index > 0) {
            var fav = this.favorites.splice(index, 1)[0];
            this.favorites.unshift(fav);
            this.saveFavorites();
            return true;
        }
        
        return false;
    },
    
    // ========================================
    // 📤 EXPORTAR FAVORITOS
    // ========================================
    export: function() {
        return JSON.stringify(this.favorites, null, 2);
    },
    
    // ========================================
    // 📥 IMPORTAR FAVORITOS
    // ========================================
    import: function(jsonString, merge) {
        if (merge === undefined) merge = true;
        
        try {
            var imported = JSON.parse(jsonString);
            
            if (!Array.isArray(imported)) {
                throw new Error('Formato inválido');
            }
            
            // Validar estrutura
            imported = imported.filter(function(fav) {
                return fav && fav.url && fav.name;
            });
            
            if (merge) {
                // Mesclar com existentes (evitar duplicatas)
                var self = this;
                imported.forEach(function(fav) {
                    if (!self.isFavorite(fav.url)) {
                        self.favorites.push(fav);
                    }
                });
            } else {
                // Substituir todos
                this.favorites = imported;
            }
            
            this.saveFavorites();
            console.log('📥 Favoritos importados:', imported.length);
            
            return true;
        } catch (e) {
            console.error('❌ Erro ao importar favoritos:', e);
            return false;
        }
    },
    
    // ========================================
    // 📢 DISPARAR EVENTOS
    // ========================================
    dispatchEvent: function(eventName, detail) {
        try {
            var event = new CustomEvent(eventName, { detail: detail });
            window.dispatchEvent(event);
        } catch (e) {
            console.warn('⚠️ Erro ao disparar evento:', eventName);
        }
    },
    
    // ========================================
    // 🎨 CRIAR ÍCONE DE FAVORITO
    // ========================================
    createFavoriteIcon: function(isFavorited) {
        var span = document.createElement('span');
        span.className = 'favorite-icon';
        span.innerHTML = isFavorited ? '⭐' : '☆';
        span.style.cssText = 'cursor:pointer;font-size:1.2em;margin-left:8px;transition:transform 0.2s;';
        span.title = isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
        
        span.onmouseenter = function() {
            span.style.transform = 'scale(1.3)';
        };
        span.onmouseleave = function() {
            span.style.transform = 'scale(1)';
        };
        
        return span;
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    FavoritesModule.init();
});

console.log('✅ FavoritesModule carregado (v1.0)');
