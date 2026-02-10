// navigation.js - Sistema de navegação COM OVERLAY E PLAYER
// Versão 3.4 - Fechar app com MediaPlayPause

const NavigationModule = {
    
    KEY_CODES: {
        CHANNEL_UP: [427, 33, 0x1000014, 16777235],
        CHANNEL_DOWN: [428, 34, 0x1000015, 16777236],
        CHANNEL_LIST: [79, 406, 458, 457]
    },

    // Controle de debounce
    lastEvents: {},
    debounceTime: 400,

    // Controle específico para OK
    lastOKTime: 0,
    okDebounceTime: 500,

    shouldIgnoreEvent(keyCode) {
        const now = Date.now();
        const lastTime = this.lastEvents[keyCode] || 0;
        
        if (now - lastTime < this.debounceTime) {
            return true;
        }
        
        this.lastEvents[keyCode] = now;
        return false;
    },

    shouldIgnoreOK() {
        const now = Date.now();
        if (now - this.lastOKTime < this.okDebounceTime) {
            return true;
        }
        this.lastOKTime = now;
        return false;
    },

    isOKKey(e) {
        if (!e) return false;
        return (
            e.key === 'Enter' ||
            e.key === 'NumpadEnter' ||
            e.key === 'OK' ||
            e.key === 'Select' ||
            e.keyCode === 13 ||
            e.keyCode === 65376
        );
    },

    isBackKey(e) {
        if (!e) return false;
        return (
            e.key === 'Backspace' ||
            e.key === 'Back' ||
            e.key === 'Escape' ||
            e.keyCode === 10009 ||
            e.keyCode === 8 ||
            e.keyCode === 27 ||
            e.keyCode === 461
        );
    },

    isArrowKey(e) {
        if (!e) return false;
        const key = e.key || '';
        const code = e.keyCode || 0;
        return (
            key === 'ArrowUp' || key === 'ArrowDown' || 
            key === 'ArrowLeft' || key === 'ArrowRight' ||
            code === 37 || code === 38 || code === 39 || code === 40
        );
    },

    getArrowDirection(e) {
        if (!e) return null;
        const key = e.key || '';
        const code = e.keyCode || 0;
        
        if (key === 'ArrowUp' || code === 38) return 'up';
        if (key === 'ArrowDown' || code === 40) return 'down';
        if (key === 'ArrowLeft' || code === 37) return 'left';
        if (key === 'ArrowRight' || code === 39) return 'right';
        return null;
    },

    isChannelUpKey(e) {
        if (!e) return false;
        const keyName = (e.key || '').toLowerCase();
        if (keyName === 'channelup' || keyName === 'channel+') return true;
        if (this.isArrowKey(e)) return false;
        return this.KEY_CODES.CHANNEL_UP.includes(e.keyCode);
    },

    isChannelDownKey(e) {
        if (!e) return false;
        const keyName = (e.key || '').toLowerCase();
        if (keyName === 'channeldown' || keyName === 'channel-') return true;
        if (this.isArrowKey(e)) return false;
        return this.KEY_CODES.CHANNEL_DOWN.includes(e.keyCode);
    },

    isChannelListKey(e) {
        if (!e) return false;
        const keyName = (e.key || '').toLowerCase().replace(/_/g, '');
        if (keyName === 'channellist' || keyName === 'keychannellist' || keyName === 'guide' || keyName === 'epg') return true;
        if (this.isArrowKey(e) || this.isOKKey(e) || this.isBackKey(e)) return false;
        return this.KEY_CODES.CHANNEL_LIST.includes(e.keyCode);
    },

    // 🆕 Verifica se é tecla para fechar o app
    isExitKey(e) {
        if (!e) return false;
        return (
            e.key === 'MediaPlayPause' ||
            e.keyCode === 10252
        );
    },

    addChannelListKeyCode(code) {
        if ([37, 38, 39, 40, 13, 10009, 8].includes(code)) return;
        if (!this.KEY_CODES.CHANNEL_LIST.includes(code)) {
            this.KEY_CODES.CHANNEL_LIST.push(code);
        }
    },

    addChannelUpKeyCode(code) {
        if ([37, 38, 39, 40].includes(code)) return;
        if (!this.KEY_CODES.CHANNEL_UP.includes(code)) {
            this.KEY_CODES.CHANNEL_UP.push(code);
        }
    },

    addChannelDownKeyCode(code) {
        if ([37, 38, 39, 40].includes(code)) return;
        if (!this.KEY_CODES.CHANNEL_DOWN.includes(code)) {
            this.KEY_CODES.CHANNEL_DOWN.push(code);
        }
    },

    getCurrentView() {
        if (typeof AppState === 'undefined') return 'buttons';
        return AppState.currentView || 'buttons';
    },
    
    setFocusElement(el) {
        if (!el) return;
        if (typeof AppState !== 'undefined' && AppState.returningFromSubcategory) return;
        
        document.querySelectorAll('.focused').forEach(n => n.classList.remove('focused'));
        
        el.classList.add('focused');
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        if (typeof AppState !== 'undefined') {
            AppState.channelItems = this.getVisibleNavigableItems();
            AppState.currentFocusIndex = AppState.channelItems.indexOf(el);
        }
    },
    
    getVisibleNavigableItems() {
        const headers = Array.from(document.querySelectorAll('.category-header'));
        const visibleChannels = Array.from(document.querySelectorAll('ul.category-sublist'))
            .filter(ul => ul.style.display === 'block' || ul.style.display === '')
            .flatMap(ul => Array.from(ul.querySelectorAll('.channel-item')));
        return [...headers, ...visibleChannels];
    },
    
    moveFocus(delta) {
        const currentView = this.getCurrentView();
        
        if (currentView.includes('overlay')) {
            if (typeof ChannelModule !== 'undefined') {
                ChannelModule.moveOverlayFocus(delta);
            }
            return;
        }
        
        if (currentView === 'channels') {
            if (typeof AppState === 'undefined') return;
            AppState.channelItems = Array.from(document.querySelectorAll('.category-header'));
            if (!AppState.channelItems.length) return;
            
            const focused = document.querySelector('.focused') || document.activeElement;
            let currentIndex = AppState.channelItems.indexOf(focused);
            if (currentIndex === -1) currentIndex = 0;
            
            const newIndex = (currentIndex + delta + AppState.channelItems.length) % AppState.channelItems.length;
            this.setFocusElement(AppState.channelItems[newIndex]);
            return;
        }
        
        if (currentView === 'playlists' && AppState?.playlistItems?.length) {
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
        } else if (['remote', 'minhasListas'].includes(currentView) && AppState?.remotePlaylistItems?.length) {
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

    moveHorizontal(direction) {
        const currentView = this.getCurrentView();
        
        if (currentView === 'buttons' || !currentView) {
            const buttons = document.querySelectorAll('.navigable');
            if (!buttons.length) return;
            
            if (typeof AppState === 'undefined') return;
            
            let index = AppState.focusIndex || 0;
            
            if (direction === 'right') {
                index = (index + 1) % buttons.length;
            } else if (direction === 'left') {
                index = (index - 1 + buttons.length) % buttons.length;
            }
            
            AppState.focusIndex = index;
            buttons[index].focus();
            buttons[index].classList.add('focused');
            
            buttons.forEach((btn, i) => {
                if (i !== index) btn.classList.remove('focused');
            });
        }
    },

    handleSortModeChange(direction) {
        if (typeof ChannelModule === 'undefined') return;

        const validViews = ['channels', 'overlay-subcategory', 'overlay-channels', 'overlay-continue-watching', 'overlay-favorites'];
        const currentView = this.getCurrentView();
        
        if (!validViews.some(v => currentView.includes(v))) return;

        if (direction > 0) {
            ChannelModule.nextSortMode();
        } else {
            ChannelModule.prevSortMode();
        }

        ChannelModule.updateOverlaySortButtonDisplay?.();
        
        const mainSortBtn = document.getElementById('sortToggleBtn');
        if (mainSortBtn) {
            ChannelModule.updateSortButtonDisplay?.(mainSortBtn);
        }

        if (currentView.includes('overlay')) {
            ChannelModule.reloadCurrentOverlay?.();
        }
    },

    handleFavoriteToggle() {
        const currentView = this.getCurrentView();
        
        if (!currentView.includes('overlay')) {
            ChannelModule?.showMessage?.('⭐ Navegue até um canal para favoritar', 2000);
            return false;
        }

        if (!AppState?.overlayChannels?.length) return false;

        const focusedEl = AppState.overlayChannels[AppState.overlayFocusIndex];
        if (!focusedEl?.dataset?.url) {
            if (focusedEl?.classList?.contains('subcategory-card') || 
                focusedEl?.classList?.contains('clear-history-btn') ||
                focusedEl?.classList?.contains('clear-favorites-btn')) {
                ChannelModule?.showMessage?.('⭐ Selecione um canal para favoritar', 2000);
            }
            return false;
        }

        let channelName = 'Canal';
        let channelGroup = '';
        
        const nameEl = focusedEl.querySelector('[style*="color:#6bff6b"], [style*="color:#ffd700"], [style*="color:#ff9800"]');
        if (nameEl) {
            channelName = nameEl.textContent.replace('▶️ ', '').replace('⭐ ', '').trim();
            const parts = channelName.split(/MP4|20\d{2}/);
            if (parts[0]) channelName = parts[0].trim();
        }

        const groupEl = focusedEl.querySelector('[style*="color:#aaa"], [style*="color:#888"]');
        if (groupEl) {
            channelGroup = groupEl.textContent.replace('📁 ', '').trim();
        }

        const channel = { url: focusedEl.dataset.url, name: channelName, group: channelGroup };

        if (typeof ChannelModule?.toggleFavorite === 'function') {
            const nowFavorite = ChannelModule.toggleFavorite(channel);
            const favToggle = focusedEl.querySelector('.fav-toggle');
            if (favToggle) {
                favToggle.innerHTML = nowFavorite ? '⭐' : '☆';
                favToggle.style.color = nowFavorite ? '#ffd700' : '#666';
            }
            return true;
        }
        return false;
    },
    
    backToButtons() {
        if (typeof PlaylistModule !== 'undefined' && PlaylistModule.hideAllSelectors) {
            PlaylistModule.hideAllSelectors();
        }
        if (typeof AppState !== 'undefined') {
            AppState.currentView = 'buttons';
            AppState.focusIndex = 0;
        }
        const buttons = document.querySelectorAll('.navigable');
        if (buttons.length) {
            buttons[0].focus();
            buttons[0].classList.add('focused');
        }
    },

    // 🆕 Fechar o aplicativo
    exitApp() {
        console.log('🚪 Fechando aplicativo...');
        
        // Tizen (Samsung)
        try {
            if (typeof tizen !== 'undefined' && tizen.application) {
                tizen.application.getCurrentApplication().exit();
                return;
            }
        } catch (e) {
            console.warn('Tizen exit falhou:', e);
        }
        
        // webOS (LG)
        try {
            if (typeof webOS !== 'undefined' && webOS.platformBack) {
                webOS.platformBack();
                return;
            }
        } catch (e) {}
        
        // Tentar window.close
        try {
            window.close();
        } catch (e) {}
        
        // Fallback
        if (typeof ChannelModule !== 'undefined' && ChannelModule.showMessage) {
            ChannelModule.showMessage('🚪 Use o botão HOME para sair', 3000);
        }
    },

    registerTVRemoteKeys() {
        try {
            if (typeof tizen !== 'undefined' && tizen.tvinputdevice) {
                console.log('📺 Registrando teclas Tizen...');
                
                const keysToRegister = [
                    'ChannelUp', 'ChannelDown', 'ChannelList', 'Guide', 'Info',
                    'MediaPlayPause', 'MediaPlay', 'MediaPause', 'MediaStop',
                    'MediaRewind', 'MediaFastForward', 'Exit', 'Back',
                    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
                ];
                
                keysToRegister.forEach((keyName) => {
                    try {
                        tizen.tvinputdevice.registerKey(keyName);
                    } catch (err) {}
                });
                
                try {
                    const supportedKeys = tizen.tvinputdevice.getSupportedKeys();
                    supportedKeys.forEach(k => {
                        const nameLower = k.name.toLowerCase();
                        if (nameLower.includes('channelup') && k.code !== 38) this.addChannelUpKeyCode(k.code);
                        if (nameLower.includes('channeldown') && k.code !== 40) this.addChannelDownKeyCode(k.code);
                        if (nameLower.includes('channellist') || nameLower.includes('guide')) this.addChannelListKeyCode(k.code);
                    });
                } catch (e) {}
                
                return true;
            }
        } catch (error) {}
        return false;
    },
    
    setupKeyboardControls() {
        const self = this;

        this.registerTVRemoteKeys();

        if (typeof AppState !== 'undefined' && !AppState.currentView) {
            AppState.currentView = 'buttons';
            AppState.focusIndex = 0;
        }

        // ========================================
        // KEYDOWN - Todas as teclas
        // ========================================
        document.addEventListener('keydown', (e) => {
            const keyCode = e.keyCode || 0;
            
            console.log(`🔑 KeyDown: "${e.key}" | code: ${keyCode} | view: ${self.getCurrentView()}`);

            // ========================================
            // 🚪 MEDIAPLAYPAUSE - FECHAR APP
            // ========================================
            if (self.isExitKey(e)) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🚪 MediaPlayPause pressionado - fechando app');
                self.exitApp();
                return;
            }

            // ========================================
            // PLAYER ABERTO - deixar player tratar
            // ========================================
            if (typeof InlinePlayerModule !== 'undefined' && InlinePlayerModule.isOpen()) {
                // Apenas Back fecha o player
                if (self.isBackKey(e)) {
                    e.preventDefault();
                    e.stopPropagation();
                    InlinePlayerModule.close();
                }
                return;
            }

            // ========================================
            // SETAS - Navegação
            // ========================================
            if (self.isArrowKey(e)) {
                e.preventDefault();
                e.stopPropagation();
                
                const direction = self.getArrowDirection(e);
                const currentView = self.getCurrentView();
                
                if (currentView.includes('overlay')) {
                    if (direction === 'down') ChannelModule?.moveOverlayFocus?.(3);
                    else if (direction === 'up') ChannelModule?.moveOverlayFocus?.(-3);
                    else if (direction === 'right') ChannelModule?.moveOverlayFocus?.(1);
                    else if (direction === 'left') ChannelModule?.moveOverlayFocus?.(-1);
                    return;
                }
                
                if (['channels', 'playlists', 'remote', 'minhasListas'].includes(currentView)) {
                    if (direction === 'down') self.moveFocus(1);
                    else if (direction === 'up') self.moveFocus(-1);
                    return;
                }
                
                if (currentView === 'buttons' || !currentView) {
                    if (direction === 'right' || direction === 'left') {
                        self.moveHorizontal(direction);
                    }
                    return;
                }
                
                return;
            }

            // ========================================
            // CHANNEL LIST - FAVORITAR
            // ========================================
            if (self.isChannelListKey(e)) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                if (self.shouldIgnoreEvent(keyCode)) return;
                
                self.handleFavoriteToggle();
                return;
            }

            // ========================================
            // CHANNEL+/-
            // ========================================
            if (self.isChannelUpKey(e)) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                if (self.shouldIgnoreEvent(keyCode)) return;
                
                self.handleSortModeChange(1);
                return;
            }

            if (self.isChannelDownKey(e)) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                if (self.shouldIgnoreEvent(keyCode)) return;
                
                self.handleSortModeChange(-1);
                return;
            }

            // ========================================
            // ENTER / OK
            // ========================================
            if (self.isOKKey(e)) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                if (self.shouldIgnoreOK()) return;
                
                const currentView = self.getCurrentView();
                
                if (currentView.includes('overlay')) {
                    const focusedChannel = AppState?.overlayChannels?.[AppState.overlayFocusIndex];
                    if (focusedChannel) {
                        focusedChannel.click();
                    }
                    return;
                }
                
                const active = document.activeElement;
                const clickableElements = ['channel-item', 'playlist-item', 'remote-playlist-item', 'navigable', 'category-header'];
                
                if (active && clickableElements.some(cls => active.classList?.contains(cls))) {
                    active.click();
                }
                return;
            }

            // ========================================
            // TECLA F - FAVORITAR
            // ========================================
            if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                e.stopImmediatePropagation();
                self.handleFavoriteToggle();
                return;
            }

            // ==============================================
            // ⬅️ BACKSPACE PARA VOLTAR
            // ==============================================
            if (e.key === 'Backspace' || e.keyCode === 10009 || e.key === 'Back') {
                e.preventDefault();
                
                const currentView = AppState.currentView;
                
                // OVERLAY - voltar ou fechar
                if (currentView && currentView.includes('overlay')) {
                    console.log('⬅️ Voltando no overlay');
                    if (typeof ChannelModule !== 'undefined' && ChannelModule.handleOverlayBack) {
                        ChannelModule.handleOverlayBack();
                    }
                    return;
                }
                
                // Playlists, remote, minhasListas
                if (['playlists', 'remote', 'minhasListas'].includes(currentView)) {
                    self.backToButtons();
                    return;
                }
                
                // Channels
                if (currentView === 'channels') {
                    AppState.channelItems.forEach(el => el.classList.remove('focused'));
                    AppState.currentFocusIndex = -1;
                    AppState.currentView = 'buttons';
                    const buttons = document.querySelectorAll('.navigable');
                    if (buttons.length) {
                        AppState.focusIndex = 0;
                        buttons[0].focus();
                    }
                    return;
                }
                
                return;
            }
        }, true);
        
        console.log("✅ Controles configurados (v3.4)");
        console.log("   ⬅️ Voltar: Backspace/Back");
        console.log("   🚪 Fechar app: MediaPlayPause (⏯️)");
        console.log("   ⭐ Favoritar: F ou Channel List");
        console.log("   🔄 Ordenação: Channel+/-");
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationModule;
}

console.log("✅ NavigationModule v3.4 - Fechar com MediaPlayPause");
