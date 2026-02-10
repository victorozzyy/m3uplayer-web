// playlists.js - Gerenciamento de playlists locais, remotas e uploads
// OTIMIZADO PARA SMART TV - SEM LIMITES DE TIMEOUT
// COM TRATAMENTO DE CORS

const PlaylistModule = {
    playlistSelector: null,
    playlistList: null,
    remotePlaylistSelector: null,
    remotePlaylistList: null,
    
    // Lista de proxies CORS públicos (fallback automático)
    corsProxies: [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        'https://api.codetabs.com/v1/proxy?quest='
    ],
    currentProxyIndex: 0,
    
    // Configurações de playlists remotas
    remotePlaylistsConfig: [
        {
        name: "🏆 Esportes 1",
        description: "Canais esportivos em alta definição",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/esportes.m3u8",
        category: "Esportes"
      },{
        name: "🏆 Esportes 2",
        description: "Canais esportivos em alta definição",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_esportes.m3u",
        category: "Esportes"
      },{
        name: "🎬 Canais 24 Hs",
        description: "Canais variados de alta qualidade",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_24h.m3u",
        category: "Filmes e Series"
      },
	  {
        name: "🎬 Canais",
        description: "Canais variados de alta qualidade",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/canais24h.m3u8",
        category: "Filmes"
      },
	  
	  {
        name: "🎬 Filmes1 ",
        description: "Canais variados de alta qualidade",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_mp4_part1.m3u",
        category: "Mp4"
      },
      {
        name: "🎬 Series1 ",
        description: "Canais variados de alta qualidade",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/seriesmp4.m3u8",
        category: "Mp4"
      },
      {
        name: "🎬 Filmes e Series",
        description: "Canais variados de alta qualidade",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/filmes-series.m3u8",
        category: "Mp4"
      },{
        name: "🎬 Filmes e Series2",
        description: "Canais variados de alta qualidade",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_filmes_series.m3u",
        category: "Filmes e Series"
      },
      {
        name: "🎬 Series2 mp4",
        description: "Big sequencia, series boas.",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists2/series2-mp4.m3u8",
        category: "Mp4"
      },{
        name: "🎬 Series3 mp4",
        description: "Rancho, Dexter, Suits, Justfield",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists2/series3-mp4.m3u8",
        category: "Mp4"
      },{
        name: "🎬 Filmes2 mp4",
        description: "Canais variados de alta qualidade",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists2/filmes2-mp4.m3u8",
        category: "Mp4"
      },{
        name: "🎬 Canais2 mp4",
        description: "Canais variados de alta qualidade",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/canais2.m3u8",
        category: "Mp4"
      },
	  {
        name: "🎬 Mp4 1",
        description: "Canais variados de alta qualidade",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_mp4_part1.m3u",
        category: "Mp4"
      },{
        name: "🎬 Mp4 2",
        description: "Canais variados de alta qualidade",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_mp4_part2.m3u",
        category: "Mp4"
      },
	  /* Atualizar essas playlists*/
	  {
        name: "🎬 Mp4 3",
        description: "Canais variados de alta qualidade",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_mp4_part3.m3u",
        category: "Filmes"
      },
	  {
        name: "🎬 Mp4 4",
        description: "Canais variados de alta qualidade",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_mp4_part4.m3u",
        category: "Filmes"
      },
	  
      
      {
        name: "🎭 Educativo",
        description: "Canais de séries, filmes e shows",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/educativo.m3u8",
        category: "Pt"
      },
      {
        name: "🎭 Aqueles",
        description: "Canais de séries, filmes e shows",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/aqules.m3u8",
        category: "Pt"
      },
      {
        name: "🎭 Educativo3",
        description: "Canais de séries, filmes e shows",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/new.m3u8",
        category: "Pt"
      },
      {
        name: "🎭 teste",
        description: "Canais de séries, filmes e shows",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/teste.m3u8",
        category: "Pt"
      },
      {
        name: "🎭 Funcional00",
        description: "Canais de séries, filmes e shows",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/teste2.m3u8",
        category: "Pt"
      },
      {
        name: "🎭 Funcional Mp4",
        description: "Canais de séries, filmes e shows",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/putria2.m3u8",
        category: "Pt"
      },
      {
        name: "🎭 Funcional4 Mp4",
        description: "Canais de séries, filmes e shows",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/putria3.m3u8",
        category: "Pt"
      },
      {
        name: "🎭 Funcional Pov Mp4",
        description: "Canais de séries, filmes e shows",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/putria4.m3u8",
        category: "Pt"
      },
      {
        name: "🎭 Funcional3 Mp4",
        description: "Canais de séries, filmes e shows",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/putria.m3u8",
        category: "Pt"
      },
      {
        name: "🎭 NovoPono Instavel",
        description: "Conteúdo seguro para crianças",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists2/novopono.m3u8",
        category: "Pt"
      },
	  {
        name: "👶 Desenhos",
        description: "Conteúdo seguro para crianças",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_desenhos.m3u",
        category: "Infantil"
      }
    ],
    
     // Playlists locais
    availablePlaylists: [
        { name: "24Hs", filename: "playlist_24h.m3u" },
        { name: "esportes", filename: "esportes.m3u8" },
        { name: "Mp4", filename: "playlist_mp4_part4.m3u" },
		{ name: "fs", filename: "filmes-series.m3u8" },
		{ name: "fs2", filename: "playlist_filmes_series.m3u" },
        { name: "pt", filename: "putria3.m3u8" },
        { name: "tv", filename: "tv_channels_994995942_plus.m3u" },
        { name: "tv2", filename: "tv_channels_164485614_plus.m3u" },
        { name: "teste", filename: "test.m3u" }
    ],
    
    // Minhas Listas (personalizadas) - COM MARCAÇÃO CORS
    minhasListasConfig: [
        
        {
            name: "🔥 Lista 01",
            description: "Lista 04 ",
            url: "https://felas87dz.icu/get.php?username=854191413&password=383942274&type=m3u_plus",
            needsCors: true
        },
		{
            name: "🔥 Minha 02",
            description: "Lista 01 ",
            url: "https://kinder5.live/get.php?username=164485614&password=530298439&type=m3u_plus",
            needsCors: true
        },
		{
            name: "🔥 Minha 03",
            description: "Lista 01 ",
            url: "http://kinder5.live:80/get.php?username=707434249&password=697551514&type=m3u_plus",
            needsCors: true
        },
		{
            name: "🔥 Lista 04",
            description: "Lista 04 ",
            url: "http://kinder5.live:80/get.php?username=688306193&password=033189514&type=m3u_plus",
            needsCors: true
        },
		{
            name: "🔥 Minha 05",
            description: "Lista 01 ",
            url: "http://kinder5.live:80/get.php?username=460757764&password=835992209&type=m3u_plus",
            needsCors: true
        },
		{
            name: "🔥 Minha 06",
            description: "Lista 01 ",
            url: "http://kinder5.live:80/get.php?username=34211473179&password=88284437124&type=m3u_plus",
            needsCors: true
        },
		
		{
            name: "🔥 Minha 07",
            description: "Lista 01 ",
            url: "http://kinder5.live:80/get.php?username=534910100&password=232065201&type=m3u_plus",
            needsCors: true
        },
		{
            name: "🔥 Lista 08",
            description: "Lista 04 ",
            url: "http://kinder5.live:80/get.php?username=82647069012&password=34033899350&type=m3u_plus",
            needsCors: true
        },
		{
            name: "🔥 Minha 09",
            description: "Lista 01 ",
            url: "http://kinder5.live:80/get.php?username=661282206&password=318344838&type=m3u_plus",
            needsCors: true
        },
		{
            name: "🔥 Minha 10",
            description: "Lista 01 ",
            url: "http://kinder5.live:80/get.php?username=094279188&password=062038990&type=m3u_plus",
            needsCors: true
        },
        {
            name: "🔥 Minha 11",
            description: "Lista 02",
            url: "http://kinder5.live:80/get.php?username=23156616732&password=42382360350&type=m3u_plus",
            needsCors: true
        },
		{
            name: "🔥 Anon",
            description: "Lista 01 ",
            url: "http://felas87dz.icu:80/get.php?username=Anonymous100&password=Hacker100&type=m3u_plus",
            needsCors: true
        },
		{
            name: "🔥 PoAtt",
            description: "Lista 02",
            url: "http://xocu.in/get.php?username=427895596&password=B312H8244k&type=m3u_plus",
            needsCors: true
        },
		{
            name: "🔥 PoAtt2",
            description: "Lista 02",
            url: "http://xocu.in/get.php?username=994995942&password=y751261z&type=m3u_plus",
            needsCors: true
        }
    ],
    
    init() {
        this.playlistSelector = document.getElementById('playlistSelector');
        this.playlistList = document.getElementById('playlistList');
        this.remotePlaylistSelector = document.getElementById('remotePlaylistSelector');
        this.remotePlaylistList = document.getElementById('remotePlaylistList');
    },
    
    // 🔧 FUNÇÃO PARA TENTAR FETCH COM PROXY CORS
    async fetchWithCorsProxy(url, options = {}) {
        // Primeiro, tentar sem proxy (pode funcionar em alguns casos)
        try {
            console.log('🔄 Tentando fetch direto:', url);
            const response = await fetch(url, options);
            if (response.ok) {
                console.log('✅ Fetch direto bem-sucedido');
                return response;
            }
        } catch (directError) {
            console.log('⚠️ Fetch direto falhou, tentando com proxy...');
        }
        
        // Tentar com cada proxy na lista
        for (let i = 0; i < this.corsProxies.length; i++) {
            const proxy = this.corsProxies[i];
            const proxiedUrl = proxy + encodeURIComponent(url);
            
            try {
                console.log(`🔄 Tentando proxy ${i + 1}/${this.corsProxies.length}:`, proxy);
                ChannelModule.showMessage(`🔄 Tentando via proxy ${i + 1}...`, 'loading');
                
                const response = await fetch(proxiedUrl, options);
                
                if (response.ok) {
                    console.log(`✅ Sucesso com proxy ${i + 1}`);
                    this.currentProxyIndex = i; // Guardar proxy que funcionou
                    return response;
                }
                
            } catch (error) {
                console.warn(`❌ Proxy ${i + 1} falhou:`, error.message);
            }
        }
        
        // Se todos os proxies falharem, lançar erro
        throw new Error('Todos os proxies CORS falharam. URL pode estar bloqueada ou indisponível.');
    },
    
    // Mostra seletor de Minhas Listas
showMinhasListasSelector() {
    this.hideAllSelectors();
    this.remotePlaylistSelector.style.display = 'block'; // Garantir que está visível
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
    }, 200); // Aumentado de 100 para 200ms
},
    
    // Atualiza lista de Minhas Listas
updateMinhasListasList() {
    try {
        if (!this.remotePlaylistList) {
            console.error('❌ remotePlaylistList não encontrado');
            return;
        }

        const fragment = document.createDocumentFragment();
        
        const header = document.createElement('li');
        header.innerHTML = '<strong>🔥 Suas Listas Fixas:</strong>';
        header.className = 'section-header';
        header.style.cssText = 'color: #6bff6b; padding: 10px 0; list-style: none;';
        fragment.appendChild(header);
        
        this.minhasListasConfig.forEach((playlist, index) => {
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
                console.log('🔥 Carregando:', playlist.name);
                this.loadRemotePlaylist(playlist.url, playlist.name, playlist.needsCors);
            });
            
            fragment.appendChild(li);
        });
        
        this.remotePlaylistList.innerHTML = '';
        this.remotePlaylistList.appendChild(fragment);
        
        AppState.remotePlaylistItems = Array.from(document.querySelectorAll('.remote-playlist-item'));
        
        console.log(`✅ ${this.minhasListasConfig.length} listas carregadas`);
        ChannelModule.showMessage(`🔥 ${this.minhasListasConfig.length} listas fixas disponíveis`, 'success');
        
    } catch (error) {
        console.error('❌ Erro ao atualizar Minhas Listas:', error);
        ChannelModule.showMessage('❌ Erro ao carregar Minhas Listas', 'error');
    }
},
    
    // Mostra seletor de playlists remotas
    showRemotePlaylistSelector() {
        this.hideAllSelectors();
        this.remotePlaylistSelector.style.display = 'block';
        this.updateRemotePlaylistList();
        AppState.currentView = 'remote';
        
        setTimeout(() => this.focusFirstRemotePlaylist(), 100);
    },
    
    // Atualiza lista de playlists remotas
    updateRemotePlaylistList() {
        try {
            const fragment = document.createDocumentFragment();
            
            // Agrupar por categoria
            const categories = [...new Set(this.remotePlaylistsConfig.map(p => p.category))];
            
            categories.forEach(category => {
                // Header da categoria
                const categoryHeader = document.createElement('li');
                categoryHeader.innerHTML = `<strong>📂 ${category}</strong>`;
                categoryHeader.className = 'category-header-remote';
                categoryHeader.style.cssText = 'color: #6bff6b; padding: 10px 0 5px 0; border-bottom: 1px solid #333;';
                fragment.appendChild(categoryHeader);
                
                // Playlists da categoria
                const categoryPlaylists = this.remotePlaylistsConfig.filter(p => p.category === category);
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
                    
                    li.onclick = () => this.loadRemotePlaylist(playlist.url, playlist.name, false);
                    fragment.appendChild(li);
                });
            });
            
            this.remotePlaylistList.innerHTML = '';
            this.remotePlaylistList.appendChild(fragment);
            
            AppState.remotePlaylistItems = Array.from(document.querySelectorAll('.remote-playlist-item'));
            ChannelModule.showMessage(`📡 ${this.remotePlaylistsConfig.length} playlists remotas disponíveis`, 'success');
            
        } catch (error) {
            console.error('Erro ao atualizar playlists remotas:', error);
            ChannelModule.showMessage('❌ Erro ao carregar playlists remotas', 'error');
        }
    },
    
    // Carrega playlist remota - COM SUPORTE CORS
async loadRemotePlaylist(url, name, needsCors = false) {
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
        
        ChannelModule.showMessage(`📄 Carregando ${name}... Aguarde (pode levar até 30s)`, 'loading');
        
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
        
        ChannelModule.showMessage(`⏳ Processando dados de ${name}...`, 'loading');
        
        const data = await response.text();
        const parsedPlaylist = this.parsePlaylist(data);
        
        if (parsedPlaylist.length === 0) {
            throw new Error('Playlist vazia ou formato inválido');
        }
        
        // Salvar no cache
        AppState.cachePlaylist(url, parsedPlaylist);
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
    
	
    // Mostra seletor de playlists locais
    async showPlaylistSelector() {
        this.hideAllSelectors();
        this.playlistSelector.style.display = 'block';
        
        this.playlistList.innerHTML = '<li class="loading">📄 Detectando playlists disponíveis...</li>';
        
        try {
            const detectedPlaylists = await this.detectAvailablePlaylists();
            this.updatePlaylistList(detectedPlaylists);
        } catch (error) {
            this.updatePlaylistList(this.availablePlaylists.map(p => ({ ...p, available: false })));
            ChannelModule.showMessage('⚠️ Erro ao detectar playlists', 'error');
        }
        
        AppState.currentView = 'playlists';
        setTimeout(() => this.focusFirstPlaylist(), 100);
    },
    
    // Detecta playlists disponíveis - TIMEOUT AUMENTADO
    async detectAvailablePlaylists() {
        ChannelModule.showMessage('🔍 Verificando playlists disponíveis...', 'loading');
        
        try {
            const promises = this.availablePlaylists.map(async playlist => {
                try {
                    // Timeout aumentado para 30 segundos
                    const response = await fetch(`playlists/${playlist.filename}`, { 
                        method: 'HEAD',
                        cache: 'no-cache',
                        signal: AbortSignal.timeout(30000)
                    });
                    
                    return {
                        ...playlist,
                        available: response.ok,
                        size: response.headers.get('content-length') || 'Desconhecido'
                    };
                } catch (error) {
                    return { ...playlist, available: false };
                }
            });
            
            const results = await Promise.allSettled(promises);
            return results.map(result => 
                result.status === 'fulfilled' ? result.value : 
                { ...this.availablePlaylists[results.indexOf(result)], available: false }
            );
            
        } catch (error) {
            console.error('Erro ao detectar playlists:', error);
            return this.availablePlaylists.map(p => ({ ...p, available: false }));
        }
    },
    
    // Atualiza lista de playlists locais
    updatePlaylistList(playlists) {
        try {
            const fragment = document.createDocumentFragment();
            
            // Opção manual
            const manualLi = document.createElement('li');
            manualLi.textContent = '✏️ Digite nome do arquivo manualmente';
            manualLi.className = 'playlist-item manual-input';
            manualLi.setAttribute('tabindex', '0');
            manualLi.onclick = () => {
                const filename = prompt('Digite o nome do arquivo da playlist (ex: minha-playlist.m3u8):');
                if (filename?.trim()) {
                    this.loadPlaylistFromFile(filename.trim());
                }
            };
            fragment.appendChild(manualLi);
            
            const availablePlaylist = playlists.filter(p => p.available);
            const unavailablePlaylist = playlists.filter(p => !p.available);
            
            // Playlists disponíveis
            if (availablePlaylist.length > 0) {
                const headerLi = document.createElement('li');
                headerLi.innerHTML = '<strong>📂 Disponíveis:</strong>';
                headerLi.className = 'section-header';
                headerLi.style.cssText = 'color: #6bff6b; padding: 5px 0;';
                fragment.appendChild(headerLi);
                
                availablePlaylist.forEach(playlist => {
                    const li = document.createElement('li');
                    li.textContent = `✅ ${playlist.name} (${playlist.filename})`;
                    li.className = 'playlist-item available-playlist';
                    li.setAttribute('tabindex', '0');
                    li.dataset.filename = playlist.filename;
                    li.onclick = () => this.loadPlaylistFromFile(playlist.filename);
                    fragment.appendChild(li);
                });
            }
            
            // Playlists indisponíveis
            if (unavailablePlaylist.length > 0) {
                const headerLi = document.createElement('li');
                headerLi.innerHTML = '<strong>🔒 Indisponíveis:</strong>';
                headerLi.className = 'section-header';
                headerLi.style.cssText = 'color: #ff6b6b; padding: 5px 0;';
                fragment.appendChild(headerLi);
                
                unavailablePlaylist.forEach(playlist => {
                    const li = document.createElement('li');
                    li.textContent = `❌ ${playlist.name} (${playlist.filename})`;
                    li.className = 'playlist-item unavailable-playlist';
                    li.setAttribute('tabindex', '0');
                    li.dataset.filename = playlist.filename;
                    li.onclick = () => {
                        if (confirm(`Arquivo ${playlist.filename} não encontrado. Tentar carregar mesmo assim?`)) {
                            this.loadPlaylistFromFile(playlist.filename);
                        }
                    };
                    fragment.appendChild(li);
                });
            }
            
            this.playlistList.innerHTML = '';
            this.playlistList.appendChild(fragment);
            
            AppState.playlistItems = Array.from(document.querySelectorAll('.playlist-item'));
            
            const totalAvailable = availablePlaylist.length;
            const totalFiles = playlists.length;
            ChannelModule.showMessage(`📊 ${totalAvailable} de ${totalFiles} playlists encontradas`, 'success');
            
        } catch (error) {
            console.error('Erro ao atualizar lista de playlists:', error);
            ChannelModule.showMessage('❌ Erro ao atualizar lista', 'error');
        }
    },
    
    // Carrega playlist de arquivo local - TIMEOUT AUMENTADO
    async loadPlaylistFromFile(filename) {
        try {
            if (!filename) {
                throw new Error('Nome do arquivo não fornecido');
            }
            
            const cacheKey = `local_${filename}`;
            const cached = AppState.getCachedPlaylist(cacheKey);
            
            if (cached) {
                console.log('📦 Usando playlist local em cache:', filename);
                this.setPlaylist(cached, filename, 'local');
                return;
            }
            
            ChannelModule.showMessage(`📄 Carregando ${filename}...`, 'loading');
            
            // Timeout aumentado para 30 segundos
            const response = await fetch(`playlists/${filename}`, {
                cache: 'no-cache',
                signal: AbortSignal.timeout(30000)
            });
            
            if (!response.ok) {
                throw new Error(`Playlist ${filename} não encontrada (${response.status})`);
            }
            
            const data = await response.text();
            const parsedPlaylist = this.parsePlaylist(data);
            
            if (parsedPlaylist.length === 0) {
                throw new Error('Playlist vazia ou formato inválido');
            }
            
            AppState.cachePlaylist(cacheKey, parsedPlaylist);
            this.setPlaylist(parsedPlaylist, filename, 'local');
            
        } catch (error) {
            console.error('Erro ao carregar playlist local:', error);
            ChannelModule.showMessage(`❌ Erro: ${error.message}`, 'error');
        }
    },
    
    // Carrega de URL - COM SUPORTE CORS
    async loadFromUrl() {
        try {
            const url = prompt('Digite a URL da playlist (.m3u8):');
            if (!url?.trim()) return;
            
            const trimmedUrl = url.trim();
            if (!this.isValidUrl(trimmedUrl)) {
                throw new Error('URL inválida. Use http:// ou https://');
            }
            
            const cached = AppState.getCachedPlaylist(trimmedUrl);
            if (cached) {
                console.log('📦 Usando playlist de URL em cache');
                this.setPlaylist(cached, `URL: ${trimmedUrl}`, 'url');
                return;
            }
            
            ChannelModule.showMessage('📄 Carregando playlist de URL... Aguarde...', 'loading');
            
            // Perguntar se precisa de proxy CORS
            const needsCors = confirm('Esta URL está bloqueada por CORS?\n\nClique OK se a URL der erro de CORS\nClique Cancelar para tentar carregamento direto');
            
            let response;
            
            if (needsCors) {
                response = await this.fetchWithCorsProxy(trimmedUrl);
            } else {
                response = await fetch(trimmedUrl);
            }
            
            if (!response.ok) {
                throw new Error(`URL inválida (${response.status})`);
            }
            
            const data = await response.text();
            const parsedPlaylist = this.parsePlaylist(data);
            
            if (parsedPlaylist.length === 0) {
                throw new Error('Playlist vazia ou formato inválido');
            }
            
            AppState.cachePlaylist(trimmedUrl, parsedPlaylist);
            this.setPlaylist(parsedPlaylist, `URL: ${trimmedUrl}`, 'url');
            
        } catch (error) {
            console.error('Erro ao carregar por URL:', error);
            ChannelModule.showMessage(`❌ Erro: ${error.message}`, 'error');
        }
    },
    
    // Canal único
    loadSingleChannel() {
        try {
            const url = prompt('Digite a URL do canal (.m3u8 ou .mp4):');
            if (!url?.trim()) return;
            
            const trimmedUrl = url.trim();
            if (!this.isValidUrl(trimmedUrl)) {
                throw new Error('URL inválida. Use http:// ou https://');
            }
            
            const playlist = [{ url: trimmedUrl, name: 'Canal Único', group: 'Único' }];
            this.setPlaylist(playlist, 'Canal Único', 'single');
            
        } catch (error) {
            console.error('Erro ao carregar canal único:', error);
            ChannelModule.showMessage(`❌ Erro: ${error.message}`, 'error');
        }
    },
    
    // Upload de arquivo
    handleFileUpload() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.m3u,.m3u8';
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                ChannelModule.showMessage(`📤 Carregando ${file.name}...`, 'loading');
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const content = event.target.result;
                        const parsedPlaylist = this.parsePlaylist(content);
                        
                        if (parsedPlaylist.length > 0) {
                            this.setPlaylist(parsedPlaylist, file.name, 'upload');
                            ChannelModule.showMessage(`✅ ${file.name} carregada (${parsedPlaylist.length} canais)`, 'success');
                        } else {
                            throw new Error('Nenhum canal válido encontrado');
                        }
                    } catch (error) {
                        console.error('Erro ao processar arquivo:', error);
                        ChannelModule.showMessage(`❌ Erro ao processar ${file.name}`, 'error');
                    }
                };
                
                reader.onerror = () => {
                    ChannelModule.showMessage(`❌ Erro ao ler arquivo ${file.name}`, 'error');
                };
                
                reader.readAsText(file);
            };
            
            input.click();
            
        } catch (error) {
            console.error('Erro no upload:', error);
            ChannelModule.showMessage('❌ Erro ao abrir seletor de arquivo', 'error');
        }
    },
    
    // Define playlist ativa
    setPlaylist(urls, name, type) {
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
    
    // Parser de playlist
    
// USB Playlist Scan (Tizen Filesystem API)
async scanUSBPlaylists() {
    try {
        if (typeof tizen === 'undefined' || !tizen.filesystem) {
            ChannelModule.showMessage('❌ Tizen filesystem não disponível', 'error');
            return;
        }

        tizen.filesystem.resolve('removable', (removable) => {
            removable.listFiles((files) => {
                const m3u = files.filter(f => f.name.endsWith('.m3u') || f.name.endsWith('.m3u8'));
                if (m3u.length === 0) {
                    ChannelModule.showMessage('❌ Nenhuma playlist encontrada no USB', 'error');
                    return;
                }

                const file = m3u[0];
                file.readAsText((content) => {
                    const parsed = this.parsePlaylist(content);
                    this.setPlaylist(parsed, file.name, 'usb');
                });
            });
        });
    } catch (e) {
        console.error(e);
        ChannelModule.showMessage('Erro ao ler pendrive', 'error');
    }
},

    parsePlaylist(content) {
        try {
            if (!content || typeof content !== 'string') {
                throw new Error('Conteúdo da playlist inválido');
            }
            
            const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line);
            const parsed = [];
            let currentName = '';
            let currentGroup = 'Outros';
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                if (line.startsWith('#EXTINF')) {
                    const groupMatch = line.match(/group-title="([^"]+)"/i);
                    currentGroup = groupMatch ? groupMatch[1].trim() : 'Outros';
                    
                    const commaIndex = line.lastIndexOf(',');
                    if (commaIndex !== -1) {
                        currentName = line.substring(commaIndex + 1).trim();
                    }
                    
                    if (!currentName && i + 1 < lines.length && !lines[i + 1].startsWith('http')) {
                        currentName = lines[i + 1];
                        i++;
                    }
                    
                    if (!currentName) {
                        currentName = 'Canal Desconhecido';
                    }
                } else if (line.startsWith('http')) {
                    if (this.isValidUrl(line)) {
                        parsed.push({
                            url: line,
                            name: currentName || 'Canal Desconhecido',
                            group: currentGroup || 'Outros'
                        });
                    }
                    
                    currentName = '';
                    currentGroup = 'Outros';
                }
            }
            
            console.log(`📋 Playlist parseada: ${parsed.length} canais encontrados`);
            return parsed;
            
        } catch (error) {
            console.error('Erro ao parsear playlist:', error);
            return [];
        }
    },
    
    // Utilitários
    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    },
    
    hideAllSelectors() {
        this.playlistSelector.style.display = 'none';
        this.remotePlaylistSelector.style.display = 'none';
    },
    
    focusFirstPlaylist() {
        setTimeout(() => {
            if (AppState.playlistItems.length) {
                AppState.playlistFocusIndex = 0;
                const firstItem = AppState.playlistItems[0];
                firstItem.focus();
                firstItem.classList.add('focused');
            }
        }, 100);
    },
    
    focusFirstRemotePlaylist() {
        setTimeout(() => {
            if (AppState.remotePlaylistItems.length) {
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

console.log('✅ PlaylistModule carregado (v3.0 - com suporte CORS)');
