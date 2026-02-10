// state-manager.js - Gerenciamento de estado SEM salvar playlist completa
// Versão 3.1 - COM savePlaylistContext

const StateManager = {
    
    // ========================================
    // 💾 SALVAR CONTEXTO DA PLAYLIST (NOVA FUNÇÃO)
    // ========================================
    savePlaylistContext(playlistName, playlistType, category) {
        try {
            console.log('═══════════════════════════════════════');
            console.log('💾 StateManager.savePlaylistContext()');
            console.log('   Playlist:', playlistName);
            console.log('   Tipo:', playlistType);
            console.log('   Categoria:', category);
            console.log('═══════════════════════════════════════');
            
            // Salvar contexto mínimo no sessionStorage
            const context = {
                playlistName,
                playlistType,
                category,
                timestamp: Date.now()
            };
            
            const contextJson = JSON.stringify(context);
            sessionStorage.setItem('playlistContext', contextJson);
            
            // Salvar também no AppState
            AppState.currentPlaylistName = playlistName;
            AppState.currentPlaylistType = playlistType;
            AppState.currentCategory = category;
            
            console.log('✅ Contexto da playlist salvo');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao salvar contexto da playlist:', error);
            return false;
        }
    },
    
    // ========================================
    // 🔄 RESTAURAR CONTEXTO DA PLAYLIST
    // ========================================
    restorePlaylistContext() {
        try {
            const contextJson = sessionStorage.getItem('playlistContext');
            
            if (!contextJson) {
                console.log('ℹ️ Nenhum contexto de playlist salvo');
                return null;
            }
            
            const context = JSON.parse(contextJson);
            console.log('🔄 Contexto restaurado:', context);
            
            return context;
            
        } catch (error) {
            console.error('❌ Erro ao restaurar contexto:', error);
            return null;
        }
    },
    
    // ========================================
    // 💾 SALVAR ESTADO DO PLAYER (OTIMIZADO)
    // ========================================
    savePlayerState(channelUrl, channelName, channelIndex, playlistName) {
        try {
            console.log('╔═══════════════════════════════════════╗');
            console.log('💾 StateManager.savePlayerState()');
            console.log('   Canal:', channelName);
            console.log('   Índice:', channelIndex);
            console.log('   Playlist:', playlistName);
            console.log('╚═══════════════════════════════════════╝');
            
            // ⚠️ CRÍTICO: NÃO SALVAR A PLAYLIST COMPLETA
            // Salvar apenas METADADOS mínimos
            const minimalState = {
                url: channelUrl,
                name: channelName,
                index: channelIndex,
                playlistName: playlistName,
                timestamp: Date.now(),
                // NÃO incluir: playlist, currentPlaylist, ou arrays grandes
            };
            
            // Converter para JSON e verificar tamanho
            const stateJson = JSON.stringify(minimalState);
            const sizeKB = (stateJson.length / 1024).toFixed(2);
            
            console.log(`📊 Tamanho do estado: ${sizeKB} KB`);
            
            // Limite de segurança: 50KB
            if (stateJson.length > 50 * 1024) {
                console.warn('⚠️ Estado muito grande, salvando versão reduzida');
                // Salvar apenas o essencial
                const ultraMinimal = {
                    url: channelUrl,
                    name: channelName,
                    index: channelIndex,
                    timestamp: Date.now()
                };
                sessionStorage.setItem('playerState', JSON.stringify(ultraMinimal));
            } else {
                sessionStorage.setItem('playerState', stateJson);
            }
            
            // Marcar que estamos indo para o player
            sessionStorage.setItem('returningFromPlayer', 'true');
            sessionStorage.setItem('playerOriginUrl', window.location.href);
            
            console.log('✅ Estado salvo com sucesso');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao salvar estado:', error);
            console.error('Stack:', error.stack);
            
            // Fallback: salvar apenas o mínimo absoluto
            try {
                const emergencyState = {
                    index: channelIndex,
                    name: channelName,
                    timestamp: Date.now()
                };
                sessionStorage.setItem('playerState', JSON.stringify(emergencyState));
                sessionStorage.setItem('returningFromPlayer', 'true');
                console.log('⚠️ Estado de emergência salvo (dados mínimos)');
            } catch (e) {
                console.error('❌ Falha total ao salvar estado:', e);
                // Limpar sessionStorage corrupto
                this.clearCorruptedStorage();
            }
            
            return false;
        }
    },
    
    // ========================================
    // 🔄 RESTAURAR ESTADO DO PLAYER
    // ========================================
    restorePlayerState() {
        try {
            console.log('╔═══════════════════════════════════════╗');
            console.log('🔄 StateManager.restorePlayerState()');
            console.log('╚═══════════════════════════════════════╝');
            
            const stateJson = sessionStorage.getItem('playerState');
            
            if (!stateJson) {
                console.log('ℹ️ Nenhum estado salvo');
                return null;
            }
            
            const state = JSON.parse(stateJson);
            
            console.log('📦 Estado restaurado:');
            console.log('   Nome:', state.name);
            console.log('   Índice:', state.index);
            console.log('   Playlist:', state.playlistName || 'N/A');
            
            return state;
            
        } catch (error) {
            console.error('❌ Erro ao restaurar estado:', error);
            this.clearCorruptedStorage();
            return null;
        }
    },
    
    // ========================================
    // 🔙 VERIFICAR RETORNO DO PLAYER
    // ========================================
    isReturningFromPlayer() {
        const flag = sessionStorage.getItem('returningFromPlayer');
        const originUrl = sessionStorage.getItem('playerOriginUrl');
        const currentUrl = window.location.href;
        
        // Verificar se está voltando E se a URL está correta
        const isReturning = flag === 'true' && 
                           originUrl && 
                           (currentUrl === originUrl || currentUrl.includes('index.html'));
        
        if (isReturning) {
            console.log('🔙 Detectado retorno do player');
        }
        
        return isReturning;
    },
    
    // ========================================
    // 🔄 RESTAURAR PARA AppState (OTIMIZADO)
    // ========================================
    restoreToAppState(AppState) {
        try {
            const state = this.restorePlayerState();
            
            if (!state) {
                console.log('ℹ️ Nenhum estado para restaurar');
                return null;
            }
            
            // ⚠️ IMPORTANTE: Playlist já está carregada no AppState
            // Apenas restaurar o índice do canal
            if (state.index !== undefined && AppState.currentPlaylist) {
                AppState.currentChannelIndex = state.index;
                
                const channel = AppState.currentPlaylist[state.index];
                if (channel) {
                    AppState.currentChannel = channel;
                    console.log('✅ Canal restaurado:', channel.name);
                }
            }
            
            // Limpar flags de retorno
            this.clearReturnFlags();
            
            return state;
            
        } catch (error) {
            console.error('❌ Erro ao restaurar para AppState:', error);
            this.clearReturnFlags();
            return null;
        }
    },
    
    // ========================================
    // 🧹 LIMPAR FLAGS DE RETORNO
    // ========================================
    clearReturnFlags() {
        sessionStorage.removeItem('returningFromPlayer');
        sessionStorage.removeItem('playerOriginUrl');
        // NÃO remover playerState (pode ser útil para debug)
        console.log('🧹 Flags de retorno limpas');
    },
    
    // ========================================
    // 🗑️ LIMPAR STORAGE CORROMPIDO
    // ========================================
    clearCorruptedStorage() {
        console.warn('🗑️ Limpando sessionStorage corrompido');
        try {
            sessionStorage.removeItem('playerState');
            sessionStorage.removeItem('returningFromPlayer');
            sessionStorage.removeItem('playerOriginUrl');
            sessionStorage.removeItem('playlistContext');
        } catch (e) {
            console.error('❌ Erro ao limpar storage:', e);
            // Última tentativa: limpar tudo
            try {
                sessionStorage.clear();
            } catch (e2) {
                console.error('❌ Falha crítica no sessionStorage');
            }
        }
    },
    
    // ========================================
    // 📊 DIAGNÓSTICO DE ESTADO
    // ========================================
    diagnose() {
        console.log('╔═══════════════════════════════════════╗');
        console.log('🔍 DIAGNÓSTICO DO STATE MANAGER');
        console.log('╚═══════════════════════════════════════╝');
        
        try {
            const state = sessionStorage.getItem('playerState');
            const context = sessionStorage.getItem('playlistContext');
            const returning = sessionStorage.getItem('returningFromPlayer');
            const origin = sessionStorage.getItem('playerOriginUrl');
            
            console.log('playerState:', state ? 'presente' : 'ausente');
            if (state) {
                const parsed = JSON.parse(state);
                console.log('  - Tamanho:', (state.length / 1024).toFixed(2), 'KB');
                console.log('  - Campos:', Object.keys(parsed));
            }
            
            console.log('playlistContext:', context ? 'presente' : 'ausente');
            if (context) {
                const parsed = JSON.parse(context);
                console.log('  - Conteúdo:', parsed);
            }
            
            console.log('returningFromPlayer:', returning);
            console.log('playerOriginUrl:', origin);
            
            // Verificar quota disponível
            this.checkStorageQuota();
            
        } catch (error) {
            console.error('❌ Erro no diagnóstico:', error);
        }
        
        console.log('╚═══════════════════════════════════════╝');
    },
    
    // ========================================
    // 💾 VERIFICAR QUOTA DE STORAGE
    // ========================================
    checkStorageQuota() {
        try {
            // Tentar calcular uso aproximado
            let totalSize = 0;
            for (let key in sessionStorage) {
                if (sessionStorage.hasOwnProperty(key)) {
                    totalSize += sessionStorage[key].length + key.length;
                }
            }
            
            const usedKB = (totalSize / 1024).toFixed(2);
            console.log(`📊 sessionStorage usado: ${usedKB} KB`);
            
            // Limite típico é 5-10MB
            const limitMB = 5;
            const percentUsed = ((totalSize / (limitMB * 1024 * 1024)) * 100).toFixed(1);
            console.log(`📊 Uso aproximado: ${percentUsed}%`);
            
            if (percentUsed > 80) {
                console.warn('⚠️ sessionStorage quase cheio!');
            }
            
        } catch (error) {
            console.warn('⚠️ Não foi possível verificar quota:', error);
        }
    }
};

// ========================================
// 🔧 ATALHO PARA DEBUG
// ========================================
window.debugStateManager = () => StateManager.diagnose();

// Log de carregamento
console.log('✅ StateManager carregado (v3.1 - COM savePlaylistContext)');

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}
