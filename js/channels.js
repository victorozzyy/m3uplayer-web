// channels.js - Gerenciamento de canais COM OVERLAY E BUSCA
// Versão 3.2 - CORRIGIDO - Cliques funcionando

const ChannelModule = {
    channelList: null,
    messageArea: null,
    messageTimeout: null,
    
    init() {
        console.log('🔧 ChannelModule.init()');
        this.channelList = document.getElementById('channelList');
        this.messageArea = document.getElementById('messageArea');
        
        if (!this.channelList) {
            console.error('❌ channelList não encontrado no DOM');
        }
        
        if (!this.messageArea) {
            console.warn('⚠️ messageArea não encontrado - mensagens não serão exibidas');
        }
        
        // Inicializar SearchModule se disponível (mas não mostrar ainda)
        if (typeof SearchModule !== 'undefined') {
            SearchModule.init();
            console.log('✅ SearchModule inicializado junto com ChannelModule');
        }
        
        console.log('✅ ChannelModule inicializado');
    },
    
    // ========================================
    // 📺 ATUALIZAR LISTA DE CANAIS
    // ========================================
    updateChannelList() {
        try {
            if (!this.channelList) {
                console.error('❌ channelList não disponível');
                return;
            }

            // Usar AppState.currentPlaylist ao invés de AppState.playlist
            const playlist = AppState.currentPlaylist || [];

            if (playlist.length === 0) {
                this.channelList.innerHTML = '<li class="no-channels">🔭 Nenhuma playlist carregada</li>';
                AppState.channelItems = [];
                
                // Esconder SearchModule se não há canais
                if (typeof SearchModule !== 'undefined') {
                    SearchModule.hide();
                }
                return;
            }

            console.log('🔄 Atualizando lista de canais:', playlist.length);
            
            const fragment = document.createDocumentFragment();
            
            // Header com nome da playlist
            if (AppState.currentPlaylistName) {
                const header = document.createElement('li');
                header.textContent = `📂 Playlist: ${AppState.currentPlaylistName}`;
                header.style.cssText = 'color: #00e676; padding: 15px 10px; font-weight: bold; font-size: 1.1em; list-style: none;';
                fragment.appendChild(header);
            }
            
            // Categoria "Todos os Canais"
            const allHeader = this.createCategoryHeader('Todos os Canais', playlist.length);
            fragment.appendChild(allHeader);
            
            // Agrupar por categoria
            const grouped = this.groupByCategory(playlist);
            const sortedGroups = Object.keys(grouped).sort();
            
            sortedGroups.forEach(group => {
                const header = this.createCategoryHeader(group, grouped[group].length);
                fragment.appendChild(header);
            });
            
            // Atualizar DOM
            this.channelList.innerHTML = '';
            this.channelList.appendChild(fragment);
            
            // IMPORTANTE: Adicionar eventos DEPOIS de adicionar ao DOM
            const allCategoryHeader = document.querySelector('.category-header[data-group="Todos os Canais"]');
            if (allCategoryHeader) {
                allCategoryHeader.addEventListener('click', () => {
                    console.log('📺 Clique: Todos os Canais');
                    this.showCategoryOverlay('Todos os Canais', playlist);
                });
            }
            
            sortedGroups.forEach(group => {
                const categoryHeader = document.querySelector(`.category-header[data-group="${group}"]`);
                if (categoryHeader) {
                    categoryHeader.addEventListener('click', () => {
                        console.log('📂 Clique:', group);
                        this.showCategoryOverlay(group, grouped[group]);
                    });
                }
            });
            
            // Atualizar referências
            AppState.channelItems = Array.from(document.querySelectorAll('.category-header'));
            AppState.currentView = 'channels';
            
            // Mostrar SearchModule se disponível
            if (typeof SearchModule !== 'undefined') {
                SearchModule.show();
            }
            
            // Focar primeiro elemento
            setTimeout(() => {
                if (AppState.channelItems.length > 0) {
                    NavigationModule.setFocusElement(AppState.channelItems[0]);
                }
            }, 100);
            
            console.log(`✅ ${AppState.channelItems.length} categorias renderizadas`);
            this.showMessage(`✅ ${playlist.length} canais carregados`, 'success');
            
        } catch (error) {
            console.error('❌ Erro ao atualizar lista de canais:', error);
            this.showMessage('❌ Erro ao atualizar canais', 'error');
        }
    },
    
    // ========================================
    // 📂 CRIAR HEADER DE CATEGORIA
    // ========================================
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
            list-style: none;
        `;
        
        return header;
    },
    
    // ========================================
    // 📂 AGRUPAR POR CATEGORIA
    // ========================================
    groupByCategory(channels) {
        const groups = {};
        
        channels.forEach(channel => {
            const group = channel.group || 'Outros';
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(channel);
        });
        
        return groups;
    },
    
    // ========================================
    // 📺 MOSTRAR OVERLAY DE CATEGORIA (COM VIRTUALIZAÇÃO)
    // ========================================
    showCategoryOverlay(groupName, channels) {
        try {
            console.log(`📺 Abrindo overlay: ${groupName} (${channels.length} canais)`);
            
            // Salvar categoria atual no AppState
            AppState.currentCategory = groupName;
            
            const overlay = this.createOverlayElement();
            const title = document.getElementById('overlayTitle');
            const grid = document.getElementById('overlayChannelGrid');
            
            title.textContent = `📺 ${groupName} (${channels.length} canais)`;
            
            grid.innerHTML = '';
            AppState.overlayChannels = [];
            
            // OTIMIZAÇÃO: Se tem mais de 1000 canais, renderizar apenas os primeiros
            const MAX_INITIAL_RENDER = 1000;
            const channelsToRender = channels.length > MAX_INITIAL_RENDER 
                ? channels.slice(0, MAX_INITIAL_RENDER) 
                : channels;
            
            if (channels.length > MAX_INITIAL_RENDER) {
                console.log(`⚡ Modo virtualizado: renderizando ${MAX_INITIAL_RENDER} de ${channels.length} canais`);
                
                // Adicionar aviso
                const notice = document.createElement('div');
                notice.style.cssText = `
                    padding: 15px;
                    background: #ff9800;
                    color: black;
                    border-radius: 5px;
                    margin-bottom: 10px;
                    font-weight: bold;
                `;
                notice.textContent = `⚡ Lista grande! Mostrando primeiros ${MAX_INITIAL_RENDER} canais. Use a busca (tecla S) para encontrar canais específicos.`;
                grid.appendChild(notice);
            }
            
            channelsToRender.forEach((channel) => {
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
            
            const renderMsg = channels.length > MAX_INITIAL_RENDER 
                ? `${MAX_INITIAL_RENDER} de ${channels.length} canais carregados (use busca para mais)`
                : `${channels.length} canais carregados`;
            
            this.showMessage(`📋 ${groupName}: ${renderMsg}`, 'success');
            
        } catch (error) {
            console.error('Erro ao abrir categoria:', error);
            this.showMessage('❌ Erro ao abrir categoria', 'error');
        }
    },
    
    // ========================================
    // 🎬 CRIAR ITEM DE CANAL
    // ========================================
    createChannelItem(channel) {
        const channelDiv = document.createElement('div');
        channelDiv.className = 'overlay-channel-item';
        channelDiv.tabIndex = 0;
        channelDiv.dataset.url = channel.url;
        channelDiv.dataset.name = channel.name;
        channelDiv.dataset.group = channel.group || 'Outros';
        
        // CORREÇÃO: Encontrar índice no array ATUAL (não no global)
        // Verificar se currentPlaylist é array válido
        let originalIndex = -1;
        if (Array.isArray(AppState.currentPlaylist)) {
            originalIndex = AppState.currentPlaylist.findIndex(ch => ch.url === channel.url);
        }
        channelDiv.dataset.index = originalIndex;
        
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
                Grupo: ${channel.group || 'Outros'}
            </div>
        `;
        
        // CORREÇÃO: Adicionar evento de clique
        channelDiv.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎬 Canal clicado:', channel.name);
            this.openChannel(channel);
        });
        
        // Suporte para tecla Enter/OK do controle remoto
        channelDiv.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🎬 Canal ativado via Enter:', channel.name);
                this.openChannel(channel);
            }
        });
        
        channelDiv.addEventListener('mouseenter', () => {
            channelDiv.style.borderColor = '#6bff6b';
            channelDiv.style.background = '#333';
        });
        
        channelDiv.addEventListener('mouseleave', () => {
            if (!channelDiv.classList.contains('focused')) {
                channelDiv.style.borderColor = '#444';
                channelDiv.style.background = '#2a2a2a';
            }
        });
        
        return channelDiv;
    },
    
    // ========================================
    // 🖼️ CRIAR OVERLAY
    // ========================================
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
            background: rgba(0, 0, 0, 0.95);
            z-index: 1000;
            overflow-y: auto;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        overlay.innerHTML = `
            <div id="overlayContent" style="
                max-width: 1200px;
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
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 12px;
                    max-height: 70vh;
                    overflow-y: auto;
                "></div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Botão fechar - usar addEventListener
        const closeBtn = overlay.querySelector('#overlayCloseBtn');
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('❌ Fechando overlay');
            this.hideOverlay();
        });
        
        // Suporte para Enter no botão fechar
        closeBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                e.stopPropagation();
                this.hideOverlay();
            }
        });
        
        return overlay;
    },
    
    // ========================================
    // ❌ ESCONDER OVERLAY
    // ========================================
    hideOverlay() {
        const overlay = document.getElementById('channelOverlay');
        if (overlay) overlay.style.display = 'none';
        
        AppState.currentView = 'channels';
        AppState.overlayChannels = [];
        AppState.overlayFocusIndex = 0;
        AppState.currentCategory = null;
        
        setTimeout(() => {
            const firstHeader = document.querySelector('.category-header');
            if (firstHeader) {
                NavigationModule.setFocusElement(firstHeader);
            }
        }, 100);
    },
    
    // ========================================
    // 🎯 FOCO NO OVERLAY
    // ========================================
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
    
    // ========================================
    // ⬅️➡️ MOVER FOCO NO OVERLAY
    // ========================================
    moveOverlayFocus(delta) {
        if (!AppState.overlayChannels.length) return;
        
        const newIndex = (AppState.overlayFocusIndex + delta + AppState.overlayChannels.length) % AppState.overlayChannels.length;
        this.setOverlayFocus(newIndex);
    },
    
    // ========================================
    // 🎬 ABRIR CANAL NO PLAYER
    // ========================================
    openChannel(channel) {
        console.log('═══════════════════════════════════════');
        console.log('🎬 ABRINDO CANAL');
        console.log('   Nome:', channel.name);
        console.log('   URL:', channel.url);
        console.log('   Grupo:', channel.group);
        console.log('   AppState.currentPlaylist:', AppState.currentPlaylist);
        console.log('   É array?', Array.isArray(AppState.currentPlaylist));
        console.log('   Length:', AppState.currentPlaylist?.length);
        console.log('═══════════════════════════════════════');
        
        // Verificar se currentPlaylist é válido
        if (!AppState.currentPlaylist) {
            console.error('❌ AppState.currentPlaylist está vazio!');
            this.showMessage('❌ Erro: Playlist não carregada', 'error');
            return;
        }
        
        // Se for objeto indexado, converter para array primeiro
        let playlistArray = AppState.currentPlaylist;
        if (AppState.currentPlaylist.isIndexed) {
            console.log('🔄 Playlist indexada detectada, usando fallback');
            // Fallback: criar array temporário apenas com este canal
            playlistArray = [channel];
        }
        
        const channelIndex = playlistArray.findIndex(ch => ch.url === channel.url);
        console.log('📍 Índice do canal na playlist:', channelIndex);
        
        // Se não encontrou, usar índice 0
        const finalIndex = channelIndex >= 0 ? channelIndex : 0;
        
        // Salvar no AppState ANTES de abrir o player
        AppState.setCurrentChannel(channel, finalIndex);
        
        if (typeof PlayerModule !== 'undefined') {
            console.log('✅ PlayerModule encontrado, abrindo player...');
            PlayerModule.open(channel.url, channel.name, finalIndex);
        } else {
            console.error('❌ PlayerModule não carregado!');
            console.error('   Verifique se player.js foi incluído no HTML');
            this.showMessage('❌ Erro: PlayerModule não disponível', 'error');
        }
    },
    
    // ========================================
    // 🎯 FOCAR NO CANAL (restauração)
    // ========================================
    focusChannel(index) {
        console.log('╔═══════════════════════════════════════╗');
        console.log('🎯 ChannelModule.focusChannel()');
        console.log('   Índice:', index);
        console.log('╚═══════════════════════════════════════╝');
        
        if (index < 0 || index >= AppState.currentPlaylist.length) {
            console.warn('⚠️ Índice inválido:', index);
            return false;
        }
        
        const channel = AppState.currentPlaylist[index];
        if (!channel) {
            console.error('❌ Canal não encontrado');
            return false;
        }
        
        const categoryName = channel.group || 'Outros';
        console.log('📂 Categoria do canal:', categoryName);
        console.log('📺 Canal:', channel.name);
        
        // Agrupar canais por categoria
        const grouped = this.groupByCategory(AppState.currentPlaylist);
        const channelsInCategory = grouped[categoryName] || [];
        
        // Abrir overlay da categoria
        this.showCategoryOverlay(categoryName, channelsInCategory);
        
        // Aguardar renderização e focar no canal
        setTimeout(() => {
            // Encontrar o canal no overlay pelo índice original
            const targetChannelDiv = AppState.overlayChannels.find(div => {
                return parseInt(div.dataset.index) === index;
            });
            
            if (targetChannelDiv) {
                const targetIndex = AppState.overlayChannels.indexOf(targetChannelDiv);
                console.log('✅ Canal encontrado no overlay, índice:', targetIndex);
                
                // Focar com destaque
                this.setOverlayFocus(targetIndex);
                
                // Destaque visual temporário
                targetChannelDiv.style.boxShadow = '0 0 20px #0f0';
                targetChannelDiv.style.transform = 'scale(1.05)';
                
                setTimeout(() => {
                    targetChannelDiv.style.boxShadow = '';
                    targetChannelDiv.style.transform = '';
                }, 2000);
                
                console.log('✅ Foco restaurado no canal:', channel.name);
                return true;
            } else {
                console.warn('⚠️ Canal não encontrado no overlay');
                return false;
            }
        }, 300);
        
        return true;
    },
    
    // ========================================
    // 🔍 FOCAR ÚLTIMO CANAL (compatibilidade)
    // ========================================
    focusLastChannel() {
        const index = AppState.currentChannelIndex;
        console.log('🔍 focusLastChannel() - Índice:', index);
        
        if (index >= 0) {
            return this.focusChannel(index);
        }
        
        return false;
    },
    
    // ========================================
    // 🔄 RESET DA BUSCA
    // ========================================
    resetSearch() {
        if (typeof SearchModule !== 'undefined') {
            SearchModule.hide();
            console.log('🔄 Busca resetada');
        }
    },
    
    // ========================================
    // 💬 MENSAGENS
    // ========================================
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

console.log('✅ ChannelModule carregado (v3.2 - CORRIGIDO - Cliques funcionando)');
