// state-manager.js - Gerenciador de estado entre páginas
// VERSÃO COMPLETA E CORRIGIDA - v2.0

const StateManager = {
    
    // Chaves do localStorage
    KEYS: {
        PLAYER_STATE: 'playerState',
        RETURN_FLAG: 'returningFromPlayer',
        RETURN_URL: 'playerReturnUrl',
        RETURN_VIEW: 'playerReturnView',
        PLAYLIST_CONTEXT: 'playlistContext',
        CATEGORY_CONTEXT: 'categoryContext'
    },
    
    // ==========================================
    // SALVAR ESTADO DO PLAYER
    // ==========================================
    savePlayerState(url, name, channelIndex, playlist) {
        console.log('═══════════════════════════════════════');
        console.log('💾 StateManager.savePlayerState()');
        console.log('═══════════════════════════════════════');
        console.log('URL:', url);
        console.log('Nome:', name);
        console.log('Índice:', channelIndex);
        console.log('Playlist:', playlist?.length || 0, 'canais');
        
        try {
            const state = {
                url,
                name,
                channelIndex: channelIndex >= 0 ? channelIndex : 0,
                playlist: playlist || [],
                timestamp: Date.now(),
                version: '2.0'
            };
            
            localStorage.setItem(this.KEYS.PLAYER_STATE, JSON.stringify(state));
            
            const currentUrl = window.location.href;
            sessionStorage.setItem(this.KEYS.RETURN_URL, currentUrl);
            
            console.log('✅ Estado salvo com sucesso');
            console.log('   - Timestamp:', state.timestamp);
            console.log('   - URL origem:', currentUrl);
            console.log('═══════════════════════════════════════');
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao salvar estado:', error);
            console.error('Stack:', error.stack);
            console.log('═══════════════════════════════════════');
            return false;
        }
    },
    
    // ==========================================
    // CARREGAR ESTADO DO PLAYER
    // ==========================================
    loadPlayerState() {
        console.log('📖 StateManager.loadPlayerState()');
        
        try {
            const stateJson = localStorage.getItem(this.KEYS.PLAYER_STATE);
            
            if (!stateJson) {
                console.warn('⚠️ Nenhum estado encontrado');
                return null;
            }
            
            const state = JSON.parse(stateJson);
            
            console.log('✅ Estado carregado:');
            console.log('   - Nome:', state.name);
            console.log('   - Índice:', state.channelIndex);
            console.log('   - Playlist:', state.playlist?.length || 0);
            console.log('   - Timestamp:', state.timestamp);
            
            return state;
            
        } catch (error) {
            console.error('❌ Erro ao carregar estado:', error);
            return null;
        }
    },
    
    // ==========================================
    // SALVAR CONTEXTO DA PLAYLIST
    // ==========================================
    savePlaylistContext(playlistName, playlistType, categoryName) {
        console.log('═══════════════════════════════════════');
        console.log('💾 StateManager.savePlaylistContext()');
        console.log('═══════════════════════════════════════');
        console.log('Playlist:', playlistName);
        console.log('Tipo:', playlistType);
        console.log('Categoria:', categoryName);
        
        try {
            const context = {
                playlistName: playlistName || '',
                playlistType: playlistType || 'unknown',
                categoryName: categoryName || null,
                timestamp: Date.now()
            };
            
            localStorage.setItem(this.KEYS.PLAYLIST_CONTEXT, JSON.stringify(context));
            
            console.log('✅ Contexto da playlist salvo');
            console.log('═══════════════════════════════════════');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao salvar contexto:', error);
            console.log('═══════════════════════════════════════');
            return false;
        }
    },
    
    // ==========================================
    // CARREGAR CONTEXTO DA PLAYLIST
    // ==========================================
    loadPlaylistContext() {
        console.log('📖 StateManager.loadPlaylistContext()');
        
        try {
            const contextJson = localStorage.getItem(this.KEYS.PLAYLIST_CONTEXT);
            
            if (!contextJson) {
                console.warn('⚠️ Nenhum contexto de playlist encontrado');
                return null;
            }
            
            const context = JSON.parse(contextJson);
            
            console.log('✅ Contexto carregado:');
            console.log('   - Playlist:', context.playlistName);
            console.log('   - Tipo:', context.playlistType);
            console.log('   - Categoria:', context.categoryName);
            
            return context;
            
        } catch (error) {
            console.error('❌ Erro ao carregar contexto:', error);
            return null;
        }
    },
    
    // ==========================================
    // MARCAR RETORNO DO PLAYER
    // ==========================================
    markReturnFromPlayer() {
        console.log('🔙 StateManager.markReturnFromPlayer()');
        
        try {
            sessionStorage.setItem(this.KEYS.RETURN_FLAG, 'true');
            console.log('✅ Flag de retorno definida');
            return true;
        } catch (error) {
            console.error('❌ Erro ao marcar retorno:', error);
            return false;
        }
    },
    
    // ==========================================
    // VERIFICAR SE ESTÁ RETORNANDO
    // ==========================================
    isReturningFromPlayer() {
        const flag = sessionStorage.getItem(this.KEYS.RETURN_FLAG);
        const isReturning = flag === 'true';
        
        if (isReturning) {
            console.log('✅ Flag de retorno detectada');
            sessionStorage.removeItem(this.KEYS.RETURN_FLAG);
        }
        
        return isReturning;
    },
    
    // ==========================================
    // OBTER URL DE RETORNO
    // ==========================================
    getReturnUrl() {
        const savedUrl = sessionStorage.getItem(this.KEYS.RETURN_URL);
        
        if (savedUrl && savedUrl !== 'null' && savedUrl !== 'undefined') {
            console.log('📍 URL de retorno encontrada:', savedUrl);
            return savedUrl;
        }
        
        console.log('📍 Usando fallback: index.html');
        return 'index.html';
    },
    
    // ==========================================
    // RESTAURAR PARA APPSTATE
    // ==========================================
    restoreToAppState(AppState) {
        console.log('═══════════════════════════════════════');
        console.log('🔄 StateManager.restoreToAppState()');
        console.log('═══════════════════════════════════════');
        
        if (!AppState) {
            console.error('❌ AppState não fornecido');
            return null;
        }
        
        const state = this.loadPlayerState();
        
        if (!state) {
            console.warn('⚠️ Sem estado para restaurar');
            console.log('═══════════════════════════════════════');
            return null;
        }
        
        try {
            AppState.currentPlaylist = state.playlist || [];
            AppState.currentChannelIndex = state.channelIndex || 0;
            AppState.currentPlaylistName = state.name || 'Playlist';
            AppState.currentView = 'channels';
            
            console.log('✅ Estado restaurado no AppState:');
            console.log('   - Playlist:', AppState.currentPlaylist.length);
            console.log('   - Índice:', AppState.currentChannelIndex);
            console.log('   - Nome:', AppState.currentPlaylistName);
            console.log('   - View:', AppState.currentView);
            console.log('═══════════════════════════════════════');
            
            return state;
            
        } catch (error) {
            console.error('❌ Erro ao restaurar estado:', error);
            console.log('═══════════════════════════════════════');
            return null;
        }
    },
    
    // ==========================================
    // ATUALIZAR ÍNDICE DO CANAL
    // ==========================================
    updateChannelIndex(newIndex) {
        console.log('🔄 StateManager.updateChannelIndex():', newIndex);
        
        try {
            const state = this.loadPlayerState();
            
            if (!state) {
                console.warn('⚠️ Nenhum estado para atualizar');
                return false;
            }
            
            state.channelIndex = newIndex;
            state.timestamp = Date.now();
            
            localStorage.setItem(this.KEYS.PLAYER_STATE, JSON.stringify(state));
            
            console.log('✅ Índice atualizado para:', newIndex);
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao atualizar índice:', error);
            return false;
        }
    },
    
    // ==========================================
    // LIMPAR ESTADO
    // ==========================================
    clearState() {
        console.log('🗑️ StateManager.clearState()');
        
        try {
            localStorage.removeItem(this.KEYS.PLAYER_STATE);
            localStorage.removeItem(this.KEYS.PLAYLIST_CONTEXT);
            sessionStorage.removeItem(this.KEYS.RETURN_FLAG);
            sessionStorage.removeItem(this.KEYS.RETURN_URL);
            sessionStorage.removeItem(this.KEYS.RETURN_VIEW);
            
            console.log('✅ Estado limpo');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao limpar estado:', error);
            return false;
        }
    },
    
    // ==========================================
    // DIAGNÓSTICO
    // ==========================================
    checkStorageSpace() {
        console.log('📊 Verificando espaço de armazenamento...');
        
        try {
            let totalSize = 0;
            
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    const size = localStorage[key].length + key.length;
                    totalSize += size;
                    
                    if (key.includes('player') || key.includes('State') || key.includes('playlist')) {
                        console.log(`   - ${key}: ${(size / 1024).toFixed(2)} KB`);
                    }
                }
            }
            
            console.log(`📦 Total usado: ${(totalSize / 1024).toFixed(2)} KB`);
            console.log(`📊 Limite típico: ~5-10 MB`);
            
            const percentUsed = (totalSize / (5 * 1024 * 1024)) * 100;
            console.log(`📈 Uso estimado: ${percentUsed.toFixed(2)}%`);
            
            if (percentUsed > 80) {
                console.warn('⚠️ Armazenamento quase cheio!');
            }
            
        } catch (error) {
            console.error('❌ Erro ao verificar armazenamento:', error);
        }
    }
};

// Log de carregamento
console.log('✅ StateManager carregado (v2.0)');

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}
