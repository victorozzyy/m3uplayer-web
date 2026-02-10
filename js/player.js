// player.js - MODIFICADO para usar InlinePlayerModule quando disponível
// Versão 2.0 - Integrado com overlay

const PlayerModule = {
    
    // ========================================
    // 🎬 ABRIR PLAYER
    // ========================================
    open(url, name, channelIndex) {
        console.log('╔═══════════════════════════════════════╗');
        console.log('🎬 PlayerModule.open()');
        console.log('   Nome:', name);
        console.log('   URL:', url);
        console.log('   Índice:', channelIndex);
        console.log('   Playlist:', AppState.currentPlaylistName);
        console.log('   Tipo:', AppState.currentPlaylistType);
        console.log('╚═══════════════════════════════════════╝');
        
        // 🎯 ESTRATÉGIA 1: Usar InlinePlayerModule se disponível (PREFERIDO)
        if (typeof InlinePlayerModule !== 'undefined') {
            console.log('✅ Usando InlinePlayerModule (overlay)');
            InlinePlayerModule.open(url, name, channelIndex);
            return;
        }
        
        // 🎯 ESTRATÉGIA 2: Redirecionar para player.html (FALLBACK)
        console.log('⚠️ InlinePlayerModule não disponível');
        console.log('🔄 Redirecionando para player.html...');
        
        // Salvar contexto da playlist ANTES de redirecionar
        if (typeof StateManager !== 'undefined') {
            const playlistName = AppState.currentPlaylistName || 'Playlist';
            const playlistType = AppState.currentPlaylistType || 'local';
            const category = AppState.currentCategory || 'Todos os Canais';
            
            console.log('💾 Salvando contexto da playlist...');
            StateManager.savePlaylistContext(playlistName, playlistType, category);
            
            console.log('💾 Salvando estado do player...');
            StateManager.savePlayerState(url, name, channelIndex, playlistName);
        }
        
        // Construir URL do player
        const playerUrl = `player.html?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}&index=${channelIndex}`;
        
        console.log('🔗 URL do player:', playerUrl);
        
        // Redirecionar
        window.location.href = playerUrl;
    },
    
    // ========================================
    // 📊 DIAGNÓSTICO
    // ========================================
    diagnose() {
        console.log('╔═══════════════════════════════════════╗');
        console.log('🔍 DIAGNÓSTICO DO PLAYER MODULE');
        console.log('╚═══════════════════════════════════════╝');
        
        console.log('InlinePlayerModule disponível?', typeof InlinePlayerModule !== 'undefined');
        console.log('StateManager disponível?', typeof StateManager !== 'undefined');
        console.log('AppState.currentPlaylistName:', AppState.currentPlaylistName);
        console.log('AppState.currentPlaylistType:', AppState.currentPlaylistType);
        console.log('AppState.currentCategory:', AppState.currentCategory);
        
        console.log('╚═══════════════════════════════════════╝');
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerModule;
}

console.log('✅ PlayerModule carregado (v2.0 - Integrado com InlinePlayer)');
