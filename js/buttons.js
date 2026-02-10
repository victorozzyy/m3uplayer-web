// navigation.js - Sistema de navegação COM OVERLAY

const NavigationModule = {
    
    // Verifica se é tecla OK/Enter
    isOKKey(e) {
        return e && (
            e.key === 'Enter' ||
            e.key === 'NumpadEnter' ||
            e.key === 'OK' ||
            e.key === 'Select' ||
            e.keyCode === 13 ||
            e.which === 13 ||
            e.keyCode === 65376
        );
    },
    
    // Define foco em elemento
    setFocusElement(el) {
        if (!el) return;
        
        document.querySelectorAll('.focused').forEach(n => n.classList.remove('focused'));
        
        el.classList.add('focused');
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        AppState.channelItems = this.getVisibleNavigableItems();
        AppState.currentFocusIndex = AppState.channelItems.indexOf(el);
        
        console.log(`✅ Foco: ${el.textContent?.substring(0, 50)} (${AppState.currentFocusIndex})`);
    },
    
    // Obtém itens navegáveis visíveis
    getVisibleNavigableItems() {
        const headers = Array.from(document.querySelectorAll('.category-header'));
        const visibleChannels = Array.from(document.querySelectorAll('ul.category-sublist'))
            .filter(ul => ul.style.display === 'block' || ul.style.display === '')
            .flatMap(ul => Array.from(ul.querySelectorAll('.channel-item')));
        
        return [...headers, ...visibleChannels];
    },
    
    // Move foco
    moveFocus(delta) {
        // OVERLAY tem prioridade
        if (AppState.currentView === 'overlay') {
            ChannelModule.moveOverlayFocus(delta);
            return;
        }
        
        if (AppState.currentView === 'channels') {
            AppState.channelItems = Array.from(document.querySelectorAll('.category-header'));
            
            if (!AppState.channelItems.length) return;
            
            const focused = document.querySelector('.focused') || document.activeElement;
            let currentIndex = AppState.channelItems.indexOf(focused);
            
            if (currentIndex === -1) currentIndex = 0;
            
            const newIndex = (currentIndex + delta + AppState.channelItems.length) % AppState.channelItems.length;
            this.setFocusElement(AppState.channelItems[newIndex]);
            return;
        }
        
        if (AppState.currentView === 'playlists' && AppState.playlistItems.length) {
            if (AppState.playlistFocusIndex >= 0) {
                AppState.playlistItems[AppState.playlistFocusIndex]?.classList.remove('focused');
            }
            AppState.playlistFocusIndex = (AppState.playlistFocusIndex + delta + AppState.playlistItems.length) % AppState.playlistItems.length;
            const item = AppState.playlistItems[AppState.playlistFocusIndex];
            if (item) {
                item.focus();
                item.classList.add('focused');
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } else if (['remote', 'minhasListas'].includes(AppState.currentView) && AppState.remotePlaylistItems.length) {
            if (AppState.remoteFocusIndex >= 0) {
                AppState.remotePlaylistItems[AppState.remoteFocusIndex]?.classList.remove('focused');
            }
            AppState.remoteFocusIndex = (AppState.remoteFocusIndex + delta + AppState.remotePlaylistItems.length) % AppState.remotePlaylistItems.length;
            const item = AppState.remotePlaylistItems[AppState.remoteFocusIndex];
            if (item) {
                item.focus();
                item.classList.add('focused');
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    },
    
    // Volta aos botões principais
    backToButtons() {
        PlaylistModule.hideAllSelectors();
        AppState.currentView = 'buttons';
        const buttons = document.querySelectorAll('.navigable');
        if (buttons.length) {
            AppState.focusIndex = 0;
            buttons[0].focus();
        }
    },
    
    // Configura controles de teclado
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            console.log(`🎮 Tecla: ${e.key} | View: ${AppState.currentView}`);
            
            // Controles do overlay de canais
            if (AppState.currentView === 'overlay') {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    ChannelModule.moveOverlayFocus(1);
                    return;
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    ChannelModule.moveOverlayFocus(-1);
                    return;
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    ChannelModule.moveOverlayFocus(4); // Grid 4 colunas
                    return;
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    ChannelModule.moveOverlayFocus(-4); // Grid 4 colunas
                    return;
                } else if (this.isOKKey(e)) {
                    e.preventDefault();
                    const focusedChannel = AppState.overlayChannels[AppState.overlayFocusIndex];
                    if (focusedChannel) {
                        console.log('🎯 Clicando no canal focado');
                        focusedChannel.click();
                    }
                    return;
                } else if (e.key === 'Backspace' || e.key === 'Escape' || e.keyCode === 10009) {
                    e.preventDefault();
                    console.log('❌ Fechando overlay');
                    ChannelModule.hideOverlay();
                    return;
                }
            }
            
            // Navegação vertical nas listas (incluindo minhasListas)
            if (['channels', 'playlists', 'remote', 'minhasListas'].includes(AppState.currentView)) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.moveFocus(1);
                    return;
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.moveFocus(-1);
                    return;
                }
            }
            
            // Enter para ativar elementos
            if (this.isOKKey(e)) {
                e.preventDefault();
                const active = document.activeElement;
                
                const clickableElements = [
                    'channel-item', 'playlist-item', 'remote-playlist-item', 
                    'navigable', 'category-header'
                ];
                
                if (clickableElements.some(className => active?.classList.contains(className))) {
                    console.log('🖱️ Clicando no elemento ativo');
                    active.click();
                }
                return;
            }
            
            // Backspace para voltar
            if (e.key === 'Backspace' || e.keyCode === 10009) {
                e.preventDefault();
                if (['playlists', 'remote', 'minhasListas'].includes(AppState.currentView)) {
                    this.backToButtons();
                } else if (AppState.currentView === 'channels') {
                    AppState.channelItems.forEach(el => el.classList.remove('focused'));
                    AppState.currentFocusIndex = -1;
                    AppState.currentView = 'buttons';
                    const buttons = document.querySelectorAll('.navigable');
                    if (buttons.length) {
                        AppState.focusIndex = 0;
                        buttons[0].focus();
                    }
                }
                return;
            }
        });
        
        // Navegação horizontal nos botões
        document.addEventListener('keydown', (e) => {
            if (AppState.currentView === 'buttons' && ['ArrowRight', 'ArrowLeft'].includes(e.key)) {
                e.preventDefault();
                const buttons = document.querySelectorAll('.navigable');
                if (e.key === 'ArrowRight') {
                    AppState.focusIndex = (AppState.focusIndex + 1) % buttons.length;
                } else {
                    AppState.focusIndex = (AppState.focusIndex - 1 + buttons.length) % buttons.length;
                }
                buttons[AppState.focusIndex].focus();
            }
        });
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationModule;
}
