// playlist-loader-local.js - CORRIGIDO
// Salvar filename no AppState para restauração

const PlaylistModuleLocal = {
    
    // Carregar playlist local otimizada
    async loadLocalPlaylistOptimized(filename, displayName) {
        try {
            console.log('⚡ MODO OTIMIZADO: Carregando', filename);
            
            ChannelModule.showMessage(`⏳ Indexando ${displayName}...`, 'loading');
            
            // Criar índice (rápido)
            const index = await LocalPlaylistLoader.loadLocalPlaylist(filename);
            
            // Pegar apenas categorias (sem carregar todos os canais)
            const categories = LocalPlaylistLoader.getCategories(index);
            
            console.log(`✅ ${categories.length} categorias indexadas`);
            
            // 🔒 CORREÇÃO: Salvar TODOS os metadados necessários
            AppState.playlistIndex = index;
            AppState.currentPlaylistName = displayName; // ✅ Nome de exibição
            AppState.playlistType = 'local'; // ✅ Tipo
            AppState.currentPlaylistType = 'local'; // ✅ Redundância
            AppState.playlistMode = 'indexed';
            
            console.log('╔═══════════════════════════════════════╗');
            console.log('💾 APPSTATE APÓS CARREGAR');
            console.log('   currentPlaylistName:', AppState.currentPlaylistName);
            console.log('   currentPlaylistType:', AppState.currentPlaylistType);
            console.log('   playlistMode:', AppState.playlistMode);
            console.log('╚═══════════════════════════════════════╝');
            
            // IMPORTANTE: Criar array VAZIO mas com metadados
            AppState.currentPlaylist = [];
            AppState.currentPlaylist._isIndexed = true;
            AppState.currentPlaylist._index = index;
            AppState.currentPlaylist._filename = filename; // ✅ CRÍTICO: Salvar filename!
            
            console.log('✅ Filename salvo em currentPlaylist._filename:', filename);
            
            // Atualizar UI com categorias
            this.updateChannelListFromIndex(categories, index);
            
            ChannelModule.showMessage(
                `✅ ${displayName} pronta! ${index.totalChannels.toLocaleString()} canais em ${categories.length} categorias`,
                'success'
            );
            
        } catch (error) {
            console.error('❌ Erro ao carregar playlist local:', error);
            ChannelModule.showMessage(`❌ Erro: ${error.message}`, 'error');
        }
    },
    
    // Atualizar UI apenas com categorias
    updateChannelListFromIndex(categories, index) {
        const channelList = document.getElementById('channelList');
        if (!channelList) return;
        
        const fragment = document.createDocumentFragment();
        
        // Header
        const header = document.createElement('li');
        header.textContent = `📂 ${AppState.currentPlaylistName} (${index.totalChannels.toLocaleString()} canais)`;
        header.style.cssText = 'color: #00e676; padding: 15px 10px; font-weight: bold; font-size: 1.1em; list-style: none;';
        fragment.appendChild(header);
        
        // Categoria "Todos"
        const allHeader = this.createCategoryHeader('Todos os Canais', index.totalChannels);
        fragment.appendChild(allHeader);
        
        // Outras categorias
        categories.forEach(cat => {
            const catHeader = this.createCategoryHeader(cat.name, cat.count);
            fragment.appendChild(catHeader);
        });
        
        channelList.innerHTML = '';
        channelList.appendChild(fragment);
        
        // Adicionar eventos DEPOIS
        const allCat = document.querySelector('.category-header[data-group="Todos os Canais"]');
        if (allCat) {
            allCat.addEventListener('click', () => {
                this.showCategoryFromIndex('Todos os Canais', index);
            });
        }
        
        categories.forEach(cat => {
            const catElement = document.querySelector(`.category-header[data-group="${cat.name}"]`);
            if (catElement) {
                catElement.addEventListener('click', () => {
                    this.showCategoryFromIndex(cat.name, index);
                });
            }
        });
        
        AppState.channelItems = Array.from(document.querySelectorAll('.category-header'));
        AppState.currentView = 'channels';
        
        // Focar primeiro item
        setTimeout(() => {
            if (AppState.channelItems.length > 0) {
                NavigationModule.setFocusElement(AppState.channelItems[0]);
            }
        }, 100);
    },
    
    createCategoryHeader(name, count) {
        const header = document.createElement('li');
        header.className = 'category-header';
        header.setAttribute('tabindex', '0');
        header.dataset.group = name;
        
        const emoji = name === 'Todos os Canais' ? '📺' : '📁';
        const color = name === 'Todos os Canais' ? '#ffeb3b' : '#6bff6b';
        
        header.innerHTML = `<strong>${emoji} ${name} (${count.toLocaleString()} canais)</strong>`;
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
    
    // Mostrar categoria do índice (lazy load)
    showCategoryFromIndex(categoryName, index) {
        console.log('📂 Abrindo categoria indexada:', categoryName);
        
        const channels = categoryName === 'Todos os Canais'
            ? LocalPlaylistLoader.getAllChannels(index, 1000)
            : LocalPlaylistLoader.getCategoryChannels(index, categoryName, 1000);
        
        // CORREÇÃO: Salvar currentPlaylist como array REAL de canais
        // para que findIndex funcione no openChannel
        AppState.currentPlaylist = channels;
        
        // ✅ IMPORTANTE: Preservar os metadados (especialmente filename)
        const filename = AppState.currentPlaylist._filename || index.filename;
        if (filename) {
            AppState.currentPlaylist._filename = filename;
            console.log('✅ Filename preservado:', filename);
        }
        
        AppState.currentCategory = categoryName; // ✅ Salvar categoria atual
        
        console.log('╔═══════════════════════════════════════╗');
        console.log('📂 CATEGORIA ABERTA');
        console.log('   Categoria:', categoryName);
        console.log('   Canais:', channels.length);
        console.log('   currentCategory:', AppState.currentCategory);
        console.log('   _filename:', AppState.currentPlaylist._filename);
        console.log('╚═══════════════════════════════════════╝');
        
        // Usar ChannelModule normal para mostrar overlay
        ChannelModule.showCategoryOverlay(categoryName, channels);
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlaylistModuleLocal;
}

console.log('✅ PlaylistModuleLocal carregado (v1.2 - CORRIGIDO com filename)');