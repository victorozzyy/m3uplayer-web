// playlists-core.js - OTIMIZADO PARA SMART TV
// Versão 3.1 - CORRIGIDO COM TODAS AS FUNÇÕES

const PlaylistModule = {
    playlistSelector: null,
    playlistList: null,
    remotePlaylistSelector: null,
    remotePlaylistList: null,
    currentProxyIndex: 0,
    
    // Configurações de processamento ULTRA-OTIMIZADAS
    CHUNK_SIZE: 50000, // Processar 50.000 canais por vez
    CHUNK_DELAY: 1, // 1ms entre chunks (mínimo possível)
    
    init() {
        console.log('🔧 PlaylistModule.init()');
        this.playlistSelector = document.getElementById('playlistSelector');
        this.playlistList = document.getElementById('playlistList');
        this.remotePlaylistSelector = document.getElementById('remotePlaylistSelector');
        this.remotePlaylistList = document.getElementById('remotePlaylistList');
        
        // Inicializar DocumentsManager
        if (typeof DocumentsManager !== 'undefined') {
            DocumentsManager.init();
        }
        
        console.log('✅ PlaylistModule inicializado');
    },
    
    // ========================================
    // ⚡ PARSER ULTRA-RÁPIDO - PROCESSAMENTO EM BATCH
    // ========================================
    async parsePlaylistAsync(content, onProgress = null) {
        try {
            console.log('⚡ PARSER ULTRA-RÁPIDO INICIADO...');
            const startTime = performance.now();
            
            if (!content || typeof content !== 'string') {
                throw new Error('Conteúdo da playlist inválido');
            }
            
            // Split otimizado - mais rápido que regex
            const lines = content.split('\n');
            const totalLines = lines.length;
            
            console.log(`📊 Total de linhas: ${totalLines.toLocaleString()}`);
            
            if (onProgress) onProgress(5, 'Preparando processamento...');
            
            const parsed = [];
            let chunkCount = 0;
            
            // Processar TUDO em chunks maiores
            for (let i = 0; i < lines.length; i += this.CHUNK_SIZE) {
                const chunk = lines.slice(i, i + this.CHUNK_SIZE);
                const chunkResults = this.processChunkSync(chunk);
                
                parsed.push(...chunkResults);
                chunkCount++;
                
                const progress = Math.floor((i / totalLines) * 90) + 5;
                const channelsFound = parsed.length;
                
                if (onProgress) {
                    onProgress(progress, `⚡ ${channelsFound.toLocaleString()} canais processados`);
                }
                
                // Micro-pausa para UI respirar (apenas 1ms)
                if (chunkCount % 5 === 0) {
                    await new Promise(resolve => setTimeout(resolve, this.CHUNK_DELAY));
                }
            }
            
            const endTime = performance.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);
            
            console.log(`✅ PARSER CONCLUÍDO em ${duration}s`);
            console.log(`📺 ${parsed.length.toLocaleString()} canais encontrados`);
            console.log(`⚡ Velocidade: ${Math.floor(parsed.length / duration).toLocaleString()} canais/segundo`);
            
            if (onProgress) onProgress(100, `✅ ${parsed.length.toLocaleString()} canais prontos!`);
            
            return parsed;
            
        } catch (error) {
            console.error('❌ Erro ao parsear playlist:', error);
            return [];
        }
    },
    
    // ========================================
    // ⚡ PROCESSAR CHUNK SINCRONAMENTE (SEM AWAIT)
    // ========================================
    processChunkSync(lines) {
        const results = [];
        let currentName = '';
        let currentGroup = 'Outros';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (!line) continue;
            
            // Detecção ultra-rápida
            if (line[0] === '#' && line[1] === 'E') { // #EXTINF
                // Extrair group-title
                const groupIdx = line.indexOf('group-title="');
                if (groupIdx !== -1) {
                    const start = groupIdx + 13;
                    const end = line.indexOf('"', start);
                    if (end !== -1) {
                        currentGroup = line.substring(start, end) || 'Outros';
                    }
                }
                
                // Extrair nome (depois da última vírgula)
                const commaIdx = line.lastIndexOf(',');
                if (commaIdx !== -1) {
                    currentName = line.substring(commaIdx + 1).trim();
                }
                
                // Se não tem nome, tentar próxima linha
                if (!currentName && i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    if (nextLine && !nextLine.startsWith('http')) {
                        currentName = nextLine;
                        i++;
                    }
                }
                
                if (!currentName) {
                    currentName = 'Canal Desconhecido';
                }
                
            } else if (line.startsWith('http')) {
                // Validação rápida de URL
                if (line.includes('://')) {
                    results.push({
                        url: line,
                        name: currentName || 'Canal Desconhecido',
                        group: currentGroup || 'Outros'
                    });
                }
                
                // Reset para próximo canal
                currentName = '';
                currentGroup = 'Outros';
            }
        }
        
        return results;
    },
    
    
    
    // ========================================
    // 🔁 RESOLVER PLAYLIST ENCADEADA (RAW → RAW → M3U)
    // ========================================
    async resolveFinalPlaylistUrl(url, maxDepth = 5) {
        console.log('🔁 Resolvendo URL:', url);

        let currentUrl = url;

        for (let depth = 0; depth < maxDepth; depth++) {
            console.log(`🔎 Nível ${depth + 1}:`, currentUrl);

            const response = await fetch(currentUrl, {
                cache: 'no-cache',
                headers: {
                    'Accept': 'text/plain, */*'
                }
            });

            if (!response.ok) {
                throw new Error(`Falha ao acessar: ${currentUrl} (${response.status})`);
            }

            const text = await response.text();

            const upper = text.toUpperCase();

            // 🛑 Se já é uma playlist M3U válida, parar aqui
            if (upper.includes('#EXTM3U') || upper.includes('#EXTINF')) {
                console.log('✅ Conteúdo já é uma playlist válida, usando esta URL:', currentUrl);
                return {
                    finalUrl: currentUrl,
                    content: text
                };
            }

            // Procurar se dentro existe outro link
            const innerUrl = extractFirstPlaylistUrl(text);

            // Se não encontrou outro link, assumir que isto é a playlist final
            if (!innerUrl || !this.isValidUrl(innerUrl)) {
                console.log('ℹ️ Nenhum redirecionamento encontrado, usando conteúdo atual');
                return {
                    finalUrl: currentUrl,
                    content: text
                };
            }

            // 🛑 Não seguir links que parecem ser mídia direta (.ts, .mp4, etc)
            const lower = innerUrl.toLowerCase();
            if (
                lower.endsWith('.ts') ||
                lower.endsWith('.mp4') ||
                lower.endsWith('.mkv') ||
                lower.endsWith('.avi') ||
                lower.endsWith('.mov')
            ) {
                console.warn('⚠️ Redirecionamento aponta para mídia, ignorando e tratando como playlist final:', innerUrl);
                return {
                    finalUrl: currentUrl,
                    content: text
                };
            }

            console.log('➡️ Encontrado redirecionamento para:', innerUrl);
            currentUrl = innerUrl;
            continue;
        }

        throw new Error('❌ Muitos redirecionamentos encadeados (possível loop infinito)');
    },



// ========================================
    // 📡 CARREGAR PLAYLIST REMOTA (OTIMIZADO)
    // ========================================
    loadRemotePlaylist: async function (url, name, needsCors = false) {
        try {
            if (!this.isValidUrl(url)) {
                throw new Error('URL da playlist inválida');
            }
            
            // Verificar cache primeiro
            const cached = AppState.getCachedPlaylist(url);
            if (cached) {
                console.log('📦 Usando playlist em cache:', name);
                this.setPlaylist(cached, name, 'remote');
                return;
            }
            
            // Mostrar progresso inicial
            this.showProgressMessage(name, 0, 'Conectando...');
            
            let response;
            
            // Se precisa de CORS, usar proxy
            if (needsCors) {
                console.log('🔧 Usando proxy CORS para:', url);
                response = await this.fetchWithCorsProxy(url, { 
                    cache: 'no-cache',
                    headers: {
                        'Accept': 'application/x-mpegURL, text/plain, */*'
                    }
                });
            } else {
                // Fetch normal com timeout de 30s
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);
                
                try {
                    response = await fetch(url, { 
                        cache: 'no-cache',
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/x-mpegURL, text/plain, */*'
                        }
                    });
                    clearTimeout(timeoutId);
                } catch (fetchError) {
                    clearTimeout(timeoutId);
                    if (fetchError.name === 'AbortError') {
                        throw new Error('Timeout: requisição levou mais de 30 segundos');
                    }
                    throw fetchError;
                }
            }
            
            if (!response.ok) {
                throw new Error(`Falha ao carregar ${name} (${response.status})`);
            }
            
            this.showProgressMessage(name, 30, 'Baixando dados...');
            
            
            // 🔁 Resolver possível playlist encadeada (RAW que aponta para outra RAW ou M3U)
            this.showProgressMessage(name, 20, 'Resolvendo redirecionamentos...');

            const resolved = await this.resolveFinalPlaylistUrl(url);

            const finalUrl = resolved.finalUrl;
            const data = resolved.content;

            console.log('🎯 URL FINAL USADA:', finalUrl);

            
            this.showProgressMessage(name, 50, 'Processando canais...');
            
            // Parser assíncrono com progresso
            const parsedPlaylist = await this.parsePlaylistAsync(data, (progress, message) => {
                const adjustedProgress = 50 + (progress / 2); // 50-100%
                this.showProgressMessage(name, adjustedProgress, message);
            });
            
            if (parsedPlaylist.length === 0) {
                throw new Error('Playlist vazia ou formato inválido');
            }
            
            // Salvar no cache
            AppState.cachePlaylist(finalUrl, parsedPlaylist);
            
            // Salvar no filesystem de forma assíncrona (não bloquear)
            if (typeof DocumentsManager !== 'undefined') {
                console.log('💾 Salvando playlist no filesystem (em background)...');
                DocumentsManager.savePlaylist(name, parsedPlaylist).then(result => {
                    if (result.success) {
                        console.log('✅ Playlist salva no filesystem:', result.location);
                    }
                }).catch(err => {
                    console.warn('⚠️ Erro ao salvar no filesystem:', err);
                });
            }
            
            this.setPlaylist(parsedPlaylist, name, 'remote');
            
        } catch (error) {
            console.error('❌ Erro ao carregar playlist remota:', error);
            
            let errorMsg = `❌ Erro: ${error.message}`;
            
            if (error.message.includes('CORS') || error.message.includes('proxy')) {
                errorMsg += '\n💡 Tente usar proxy CORS ou hospede em servidor com CORS';
            } else if (error.message.includes('Timeout')) {
                errorMsg += '\n💡 Servidor muito lento. Tente novamente.';
            }
            
            ChannelModule.showMessage(errorMsg, 'error');
        }
    },
    
    // ========================================
    // 📊 MOSTRAR PROGRESSO VISUAL
    // ========================================
    showProgressMessage(playlistName, percent, message) {
        const fullMessage = `📄 ${playlistName}: ${Math.floor(percent)}% - ${message}`;
        
        if (typeof ChannelModule !== 'undefined' && ChannelModule.showMessage) {
            ChannelModule.showMessage(fullMessage, 'loading');
        }
        
        console.log(fullMessage);
    },
    
    // ========================================
    // 🔧 CORS PROXY HANDLER
    // ========================================
    async fetchWithCorsProxy(url, options = {}) {
        // Tentar fetch direto primeiro
        try {
            console.log('📄 Tentando fetch direto:', url);
            const response = await fetch(url, options);
            if (response.ok) {
                console.log('✅ Fetch direto bem-sucedido');
                return response;
            }
        } catch (directError) {
            console.log('⚠️ Fetch direto falhou, tentando com proxy...');
        }
        
        // Tentar com cada proxy
        const proxies = PlaylistConfig.corsProxies;
        for (let i = 0; i < proxies.length; i++) {
            const proxy = proxies[i];
            const proxiedUrl = proxy + encodeURIComponent(url);
            
            try {
                console.log(`📄 Tentando proxy ${i + 1}/${proxies.length}:`, proxy);
                ChannelModule.showMessage(`📄 Tentando via proxy ${i + 1}...`, 'loading');
                
                const response = await fetch(proxiedUrl, options);
                
                if (response.ok) {
                    console.log(`✅ Sucesso com proxy ${i + 1}`);
                    this.currentProxyIndex = i;
                    return response;
                }
                
            } catch (error) {
                console.warn(`❌ Proxy ${i + 1} falhou:`, error.message);
            }
        }
        
        throw new Error('Todos os proxies CORS falharam. URL pode estar bloqueada.');
    },
    
    // ========================================
    // 📥 MINHAS LISTAS
    // ========================================
    showMinhasListasSelector() {
        console.log('📥 showMinhasListasSelector()');
        this.hideAllSelectors();
        this.remotePlaylistSelector.style.display = 'block';
        this.updateMinhasListasList();
        AppState.currentView = 'minhasListas';
        
        setTimeout(() => {
            AppState.remotePlaylistItems = Array.from(document.querySelectorAll('.remote-playlist-item'));
            if (AppState.remotePlaylistItems.length > 0) {
                AppState.remoteFocusIndex = 0;
                const firstItem = AppState.remotePlaylistItems[0];
                if (firstItem) {
                    firstItem.focus();
                    firstItem.classList.add('focused');
                }
            }
        }, 200);
    },
    
    updateMinhasListasList() {
        try {
            if (!this.remotePlaylistList) {
                console.error('❌ remotePlaylistList não encontrado');
                return;
            }

            const fragment = document.createDocumentFragment();
            const config = PlaylistConfig.minhasListasConfig;
            
            const header = document.createElement('li');
            header.innerHTML = '<strong>📥 Suas Listas Fixas:</strong>';
            header.className = 'section-header';
            header.style.cssText = 'color: #6bff6b; padding: 10px 0; list-style: none;';
            fragment.appendChild(header);
            
            config.forEach((playlist, index) => {
                const li = document.createElement('li');
                li.className = 'remote-playlist-item';
                li.setAttribute('tabindex', '0');
                li.dataset.url = playlist.url;
                li.dataset.name = playlist.name;
                li.dataset.needsCors = playlist.needsCors || 'false';
                li.dataset.index = index;
                
                li.innerHTML = `
                    <div style="margin-bottom: 5px;">
                        <strong>${playlist.name}</strong>
                    </div>
                    <div style="font-size: 0.9em; color: #ccc; margin-left: 10px;">
                        ${playlist.description}
                    </div>
                `;
                
                li.addEventListener('click', () => {
                    console.log('📥 Carregando:', playlist.name);
                    this.loadRemotePlaylist(playlist.url, playlist.name, playlist.needsCors);
                });
                
                fragment.appendChild(li);
            });
            
            this.remotePlaylistList.innerHTML = '';
            this.remotePlaylistList.appendChild(fragment);
            
            AppState.remotePlaylistItems = Array.from(document.querySelectorAll('.remote-playlist-item'));
            
            console.log(`✅ ${config.length} listas carregadas`);
            ChannelModule.showMessage(`📥 ${config.length} listas fixas disponíveis`, 'success');
            
        } catch (error) {
            console.error('❌ Erro ao atualizar Minhas Listas:', error);
            ChannelModule.showMessage('❌ Erro ao carregar Minhas Listas', 'error');
        }
    },
    
    // ========================================
    // 📡 PLAYLISTS REMOTAS
    // ========================================
    showRemotePlaylistSelector() {
        console.log('📡 showRemotePlaylistSelector()');
        this.hideAllSelectors();
        this.remotePlaylistSelector.style.display = 'block';
        this.updateRemotePlaylistList();
        AppState.currentView = 'remote';
        
        setTimeout(() => this.focusFirstRemotePlaylist(), 100);
    },
    
    updateRemotePlaylistList() {
        try {
            const fragment = document.createDocumentFragment();
            const config = PlaylistConfig.remotePlaylistsConfig;
            
            const categories = [...new Set(config.map(p => p.category))];
            
            categories.forEach(category => {
                const categoryHeader = document.createElement('li');
                categoryHeader.innerHTML = `<strong>📂 ${category}</strong>`;
                categoryHeader.className = 'category-header-remote';
                categoryHeader.style.cssText = 'color: #6bff6b; padding: 10px 0 5px 0; border-bottom: 1px solid #333;';
                fragment.appendChild(categoryHeader);
                
                const categoryPlaylists = config.filter(p => p.category === category);
                categoryPlaylists.forEach(playlist => {
                    const li = document.createElement('li');
                    li.className = 'remote-playlist-item';
                    li.setAttribute('tabindex', '0');
                    li.dataset.url = playlist.url;
                    li.dataset.name = playlist.name;
                    
                    li.innerHTML = `
                        <div style="margin-bottom: 5px;">
                            <strong>${playlist.name}</strong>
                        </div>
                        <div style="font-size: 0.9em; color: #ccc; margin-left: 10px;">
                            ${playlist.description}
                        </div>
                    `;
                    
                    li.addEventListener('click', () => {
                        console.log('📡 Carregando:', playlist.name);
                        this.loadRemotePlaylist(playlist.url, playlist.name, false);
                    });
                    
                    fragment.appendChild(li);
                });
            });
            
            this.remotePlaylistList.innerHTML = '';
            this.remotePlaylistList.appendChild(fragment);
            
            AppState.remotePlaylistItems = Array.from(document.querySelectorAll('.remote-playlist-item'));
            ChannelModule.showMessage(`📡 ${config.length} playlists remotas disponíveis`, 'success');
            
        } catch (error) {
            console.error('Erro ao atualizar playlists remotas:', error);
            ChannelModule.showMessage('❌ Erro ao carregar playlists remotas', 'error');
        }
    },
    
    // ========================================
    // 📁 PLAYLISTS LOCAIS
    // ========================================
    showPlaylistSelector() {
        console.log('📁 showPlaylistSelector()');
        this.hideAllSelectors();
        
        if (!this.playlistSelector) {
            console.error('❌ playlistSelector não encontrado');
            return;
        }
        
        this.playlistSelector.style.display = 'block';
        this.updatePlaylistList();
        AppState.currentView = 'playlists';
        
        setTimeout(() => this.focusFirstPlaylist(), 100);
    },
    
    updatePlaylistList() {
        try {
            if (!this.playlistList) {
                console.error('❌ playlistList não encontrado');
                return;
            }

            const fragment = document.createDocumentFragment();
            
            // Header
            const header = document.createElement('li');
            header.innerHTML = '<strong>📁 Playlists Locais</strong>';
            header.className = 'section-header';
            header.style.cssText = 'color: #6bff6b; padding: 10px 0; list-style: none;';
            fragment.appendChild(header);
            
            // Playlists do app (otimizadas)
            const localPlaylists = PlaylistConfig.availablePlaylists || [];
            localPlaylists.forEach(playlist => {
                const li = document.createElement('li');
                li.className = 'playlist-item';
                li.setAttribute('tabindex', '0');
                li.innerHTML = `
                    <div style="padding: 10px; cursor: pointer;">
                        <strong>📦 ${playlist.name}</strong>
                        <div style="font-size: 0.9em; color: #ccc;">
                            Arquivo local: ${playlist.filename}
                        </div>
                    </div>
                `;
                li.addEventListener('click', () => {
                    console.log('📦 Carregando playlist local:', playlist.name);
                    // Usar sistema otimizado
                    if (typeof PlaylistModuleLocal !== 'undefined') {
                        PlaylistModuleLocal.loadLocalPlaylistOptimized(
                            playlist.filename, 
                            playlist.name
                        );
                    } else {
                        console.warn('⚠️ PlaylistModuleLocal não disponível, usando modo normal');
                        this.loadLocalPlaylistNormal(playlist.filename, playlist.name);
                    }
                });
                fragment.appendChild(li);
            });
            
            // Separador
            if (localPlaylists.length > 0) {
                const separator = document.createElement('li');
                separator.style.cssText = 'border-top: 1px solid #333; margin: 10px 0;';
                fragment.appendChild(separator);
            }
            
            // Opção: Carregar do dispositivo
            const uploadItem = document.createElement('li');
            uploadItem.className = 'playlist-item';
            uploadItem.setAttribute('tabindex', '0');
            uploadItem.innerHTML = `
                <div style="padding: 10px; cursor: pointer;">
                    <strong>📤 Carregar do dispositivo</strong>
                    <div style="font-size: 0.9em; color: #ccc;">Selecione um arquivo .m3u ou .m3u8</div>
                </div>
            `;
            uploadItem.addEventListener('click', () => {
                console.log('📤 Upload clicked');
                this.triggerFileUpload();
            });
            fragment.appendChild(uploadItem);
            
            // Opção: Carregar de URL
            const urlItem = document.createElement('li');
            urlItem.className = 'playlist-item';
            urlItem.setAttribute('tabindex', '0');
            urlItem.innerHTML = `
                <div style="padding: 10px; cursor: pointer;">
                    <strong>🔗 Carregar de URL</strong>
                    <div style="font-size: 0.9em; color: #ccc;">Digite o endereço de uma playlist</div>
                </div>
            `;
            urlItem.addEventListener('click', () => {
                console.log('🔗 URL clicked');
                this.loadFromUrl();
            });
            fragment.appendChild(urlItem);
            
            this.playlistList.innerHTML = '';
            this.playlistList.appendChild(fragment);
            
            AppState.playlistItems = Array.from(document.querySelectorAll('.playlist-item'));
            console.log(`✅ ${AppState.playlistItems.length} opções de playlist local carregadas`);
            
        } catch (error) {
            console.error('❌ Erro ao atualizar lista de playlists locais:', error);
        }
    },
    
    // Fallback para modo normal
    async loadLocalPlaylistNormal(filename, displayName) {
        try {
            const response = await fetch(`/playlists/${filename}`);
            if (!response.ok) {
                throw new Error(`Arquivo não encontrado: ${filename}`);
            }
            
            const content = await response.text();
            const parsed = await this.parsePlaylistAsync(content);
            
            this.setPlaylist(parsed, displayName, 'local');
        } catch (error) {
            console.error('❌ Erro:', error);
            ChannelModule.showMessage(`❌ ${error.message}`, 'error');
        }
    },
    
    triggerFileUpload() {
        console.log('📤 triggerFileUpload()');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.m3u,.m3u8';
        input.onchange = (e) => this.handleFileUpload(e);
        input.click();
    },
    
    async handleFileUpload(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;
            
            console.log('📄 Arquivo selecionado:', file.name);
            ChannelModule.showMessage(`⏳ Carregando ${file.name}...`, 'loading');
            
            const content = await file.text();
            
            const parsed = await this.parsePlaylistAsync(content, (progress, message) => {
                this.showProgressMessage(file.name, progress, message);
            });
            
            if (parsed.length === 0) {
                throw new Error('Nenhum canal encontrado no arquivo');
            }
            
            this.setPlaylist(parsed, file.name, 'local');
            
        } catch (error) {
            console.error('❌ Erro ao carregar arquivo:', error);
            ChannelModule.showMessage(`❌ Erro: ${error.message}`, 'error');
        }
    },
    
    async loadFromUrl() {
        console.log('🔗 loadFromUrl()');
        const url = prompt('Digite a URL da playlist:');
        if (!url) return;
        
        try {
            if (!this.isValidUrl(url)) {
                throw new Error('URL inválida');
            }
            
            await this.loadRemotePlaylist(url, 'Playlist URL', false);
            
        } catch (error) {
            console.error('❌ Erro ao carregar URL:', error);
            ChannelModule.showMessage(`❌ ${error.message}`, 'error');
        }
    },
    
    // ========================================
    // 🎯 HELPERS
    // ========================================
    setPlaylist(urls, name, type) {
        console.log('🎯 setPlaylist:', name, 'com', urls.length, 'canais');
        AppState.setPlaylist(urls, name, type);
        ChannelModule.updateChannelList();
        this.hideAllSelectors();
        
        setTimeout(() => {
            if (AppState.channelItems.length > 0) {
                NavigationModule.setFocusElement(AppState.channelItems[0]);
            }
        }, 100);
        
        ChannelModule.showMessage(`✅ ${name} carregada com ${urls.length} canais`, 'success');
    },
    
    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    },
    
    hideAllSelectors() {
        if (this.playlistSelector) this.playlistSelector.style.display = 'none';
        if (this.remotePlaylistSelector) this.remotePlaylistSelector.style.display = 'none';
    },
    
    focusFirstPlaylist() {
        setTimeout(() => {
            if (AppState.playlistItems && AppState.playlistItems.length) {
                AppState.playlistFocusIndex = 0;
                const firstItem = AppState.playlistItems[0];
                firstItem.focus();
                firstItem.classList.add('focused');
            }
        }, 100);
    },
    
    focusFirstRemotePlaylist() {
        setTimeout(() => {
            if (AppState.remotePlaylistItems && AppState.remotePlaylistItems.length) {
                AppState.remoteFocusIndex = 0;
                const firstItem = AppState.remotePlaylistItems[0];
                firstItem.focus();
                firstItem.classList.add('focused');
            }
        }, 100);
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlaylistModule;
}

console.log('✅ PlaylistModule carregado (v3.1 - CORRIGIDO E OTIMIZADO)');

// ======================================================
// 🔁 HELPER GLOBAL (TIZEN-SAFE)
// ======================================================
function extractFirstPlaylistUrl(content) {
    if (!content || typeof content !== 'string') return null;

    var lines = content.split('\n');
    for (var i = 0; i < lines.length; i++) {
        var trimmed = lines[i].trim();
        if (
            trimmed.indexOf('http://') === 0 ||
            trimmed.indexOf('https://') === 0
        ) {
            return trimmed;
        }
    }
    return null;
}
