// channels.js - Gerenciamento de canais e categorias

const ChannelModule = {
    channelList: null,
    messageArea: null,
    
    init() {
        this.channelList = document.getElementById('channelList');
        this.messageArea = document.getElementById('messageArea');
    },
    
    // Atualiza lista de canais
    updateChannelList() {
        if (!this.channelList) return;
        
        try {
            const fragment = document.createDocumentFragment();
            const playlist = AppState.currentPlaylist;
            
            // Header com nome da playlist
            if (AppState.currentPlaylistName) {
                const header = document.createElement('li');
                header.textContent = `📂 Playlist: ${AppState.currentPlaylistName}`;
                header.style.cssText = 'color: #00e676; padding: 15px 10px; font-weight: bold; font-size: 1.1em;';
                fragment.appendChild(header);
            }
            
            if (playlist.length === 0) {
                const emptyLi = document.createElement('li');
                emptyLi.textContent = 'Nenhum canal disponível';
                emptyLi.style.color = '#ccc';
                fragment.appendChild(emptyLi);
                
                this.channelList.innerHTML = '';
                this.channelList.appendChild(fragment);
                return;
            }
            
            // Categoria "Todos os Canais"
            const allHeader = this.createCategoryHeader('Todos os Canais', playlist.length);
            allHeader.onclick = () => this.showCategoryOverlay('Todos os Canais', playlist);
            fragment.appendChild(allHeader);
            
            // Agrupar por categoria
            const grouped = this.groupByCategory(playlist);
            const sortedGroups = Object.keys(grouped).sort();
            
            sortedGroups.forEach(group => {
                const header = this.createCategoryHeader(group, grouped[group].length);
                header.onclick = () => this.showCategoryOverlay(group, grouped[group]);
                fragment.appendChild(header);
            });
            
            // Atualizar DOM
            this.channelList.innerHTML = '';
            this.channelList.appendChild(fragment);
            
            // Atualizar referências
            AppState.channelItems = Array.from(document.querySelectorAll('.category-header'));
            AppState.currentView = 'channels';
            
            // Focar primeiro elemento
            if (!AppState.restoringState && AppState.channelItems.length > 0) {
                requestAnimationFrame(() => {
                    NavigationModule.setFocusElement(AppState.channelItems[0]);
                });
            }
            
        } catch (error) {
            console.error('Erro ao atualizar lista de canais:', error);
            this.showMessage('❌ Erro ao atualizar canais', 'error');
        }
    },
    
    // Cria header de categoria
    createCategoryHeader(groupName, count) {
        const header = document.createElement('li');
        header.className = 'category-header';
        header.setAttribute('tabindex', '0');
        header.setAttribute('role', 'button');
        header.dataset.group = groupName;
        
        const emoji = groupName === 'Todos os Canais' ? '📺' : '📁';
        const color = groupName === 'Todos os Canais' ? '#ffeb3b' : '#6bff6b';
        
        header.innerHTML = `<strong class="cat-label">${emoji} ${groupName} (${count} canais)</strong>`;
        header.style.cssText = `
            color: ${color};
            padding: 15px 10px;
            border-bottom: 2px solid #333;
            cursor: pointer;
            background: linear-gradient(45deg, #1a1a1a, #2a2a2a);
            border-radius: 5px;
            margin-bottom: 5px;
        `;
        
        return header;
    },
    
    // Agrupa canais por categoria
    groupByCategory(playlist) {
        const grouped = {};
        playlist.forEach(channel => {
            const group = channel.group || 'Outros';
            if (!grouped[group]) grouped[group] = [];
            grouped[group].push(channel);
        });
        return grouped;
    },
    
    // Mostra overlay de categoria
    showCategoryOverlay(groupName, channels) {
        try {
            const overlay = this.createOverlayElement();
            const title = document.getElementById('overlayTitle');
            const grid = document.getElementById('overlayChannelGrid');
            
            title.textContent = `📺 ${groupName} (${channels.length} canais)`;
            
            grid.innerHTML = '';
            AppState.overlayChannels = [];
            
            channels.forEach((channel) => {
                const channelDiv = this.createChannelItem(channel);
                grid.appendChild(channelDiv);
                AppState.overlayChannels.push(channelDiv);
            });
            
            overlay.style.display = 'block';
            AppState.currentView = 'overlay';
            AppState.overlayFocusIndex = 0;
            
            if (AppState.overlayChannels.length > 0) {
                this.setOverlayFocus(0);
            }
            
            this.showMessage(`📋 Categoria ${groupName} aberta com ${channels.length} canais`, 'success');
            
        } catch (error) {
            console.error('Erro ao abrir categoria:', error);
            this.showMessage('❌ Erro ao abrir categoria', 'error');
        }
    },
    
    // Cria elemento de canal
    createChannelItem(channel) {
        const channelDiv = document.createElement('div');
        channelDiv.className = 'overlay-channel-item';
        channelDiv.tabIndex = 0;
        channelDiv.dataset.url = channel.url;
        channelDiv.dataset.name = channel.name;
        channelDiv.style.cssText = `
            background: #2a2a2a;
            border: 2px solid #444;
            border-radius: 8px;
            padding: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
            color: white;
        `;
        
        const isMP4 = channel.url && channel.url.toLowerCase().endsWith('.mp4');
        const mp4Badge = isMP4 ? '<span style="font-size: 0.8em; color: yellow;">(MP4)</span>' : '';
        
        channelDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px; color: #6bff6b;">
                ${channel.name} ${mp4Badge}
            </div>
            <div style="font-size: 0.8em; color: #aaa;">
                Grupo: ${channel.group}
            </div>
        `;
        
        channelDiv.onclick = () => this.openChannel(channel);
        
        channelDiv.onmouseenter = () => {
            channelDiv.style.borderColor = '#6bff6b';
            channelDiv.style.background = '#333';
        };
        
        channelDiv.onmouseleave = () => {
            if (!channelDiv.classList.contains('focused')) {
                channelDiv.style.borderColor = '#444';
                channelDiv.style.background = '#2a2a2a';
            }
        };
        
        return channelDiv;
    },
    
    // Cria overlay de canais
    createOverlayElement() {
        let overlay = document.getElementById('channelOverlay');
        if (overlay) return overlay;
        
        overlay = document.createElement('div');
        overlay.id = 'channelOverlay';
        overlay.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 1000;
            overflow-y: auto;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        overlay.innerHTML = `
            <div id="overlayContent" style="
                max-width: 800px;
                margin: 0 auto;
                background: #1a1a1a;
                border-radius: 10px;
                padding: 20px;
                border: 2px solid #333;
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #333;
                ">
                    <h2 id="overlayTitle" style="color: #6bff6b; margin: 0; font-size: 1.5em;"></h2>
                    <button id="overlayCloseBtn" tabindex="0" style="
                        background: #ff4444;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    ">✕ Fechar</button>
                </div>
                <div id="overlayChannelGrid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 10px;
                    max-height: 60vh;
                    overflow-y: auto;
                "></div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Botão fechar
        overlay.querySelector('#overlayCloseBtn').onclick = () => this.hideOverlay();
        
        return overlay;
    },
    
    // Esconde overlay
    hideOverlay() {
        const overlay = document.getElementById('channelOverlay');
        if (overlay) overlay.style.display = 'none';
        
        AppState.currentView = 'channels';
        AppState.overlayChannels = [];
        AppState.overlayFocusIndex = 0;
        
        setTimeout(() => {
            const firstHeader = document.querySelector('.category-header');
            if (firstHeader) {
                NavigationModule.setFocusElement(firstHeader);
            }
        }, 100);
    },
    
    // Define foco no overlay
    setOverlayFocus(index) {
        if (!AppState.overlayChannels.length) return;
        
        AppState.overlayChannels.forEach(item => {
            item.classList.remove('focused');
            item.style.borderColor = '#444';
            item.style.background = '#2a2a2a';
        });
        
        const focusedItem = AppState.overlayChannels[index];
        focusedItem.classList.add('focused');
        focusedItem.style.borderColor = '#6bff6b';
        focusedItem.style.background = '#333';
        focusedItem.focus();
        focusedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        AppState.overlayFocusIndex = index;
    },
    
    // Move foco no overlay
    moveOverlayFocus(delta) {
        if (!AppState.overlayChannels.length) return;
        
        const newIndex = (AppState.overlayFocusIndex + delta + AppState.overlayChannels.length) % AppState.overlayChannels.length;
        this.setOverlayFocus(newIndex);
    },
    
    // Abre canal no player
    openChannel(channel) {
        const channelIndex = AppState.currentPlaylist.findIndex(ch => ch.url === channel.url);
        
        if (typeof PlayerModule !== 'undefined') {
            PlayerModule.open(channel.url, channel.name, channelIndex);
        } else {
            console.error('PlayerModule não carregado');
        }
    },
    
    // Foca último canal reproduzido
    focusLastChannel() {
        const index = AppState.currentChannelIndex;
        if (index >= 0 && AppState.currentPlaylist[index]) {
            const channel = AppState.currentPlaylist[index];
            const header = Array.from(AppState.channelItems).find(h => h.dataset.group === channel.group);
            
            if (header) {
                NavigationModule.setFocusElement(header);
            }
        }
    },
    
    // Mensagens
    showMessage(text, type = 'info') {
        if (!this.messageArea) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type === 'error' ? 'error-message' : 
                                type === 'loading' ? 'loading' : 'success-message'}`;
        messageDiv.textContent = text;
        
        this.messageArea.innerHTML = '';
        this.messageArea.appendChild(messageDiv);
        
        if (type !== 'loading') {
            setTimeout(() => {
                if (this.messageArea.contains(messageDiv)) {
                    this.messageArea.removeChild(messageDiv);
                }
            }, 5000);
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChannelModule;
}