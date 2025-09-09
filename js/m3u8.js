document.addEventListener("DOMContentLoaded", () => {
    
    // Helper: trata tecla OK/Enter de controles remotos (Tizen, WebOS, etc.)
    function isOKKey(e) {
        // valores comuns em TVs: 'Enter', 'OK', 'Select', 'NumpadEnter', keyCode 13, 65376
        return e && (
            e.key === "Enter" ||
            e.key === "NumpadEnter" ||
            e.key === "OK" ||
            e.key === "Select" ||
            e.keyCode === 13 ||
            e.which === 13 ||
            e.keyCode === 65376
        );
    }
    const video = document.getElementById("player");
    const channelList = document.getElementById("channelList");
    const playlistSelector = document.getElementById("playlistSelector");
    const playlistList = document.getElementById("playlistList");
    const remotePlaylistSelector = document.getElementById("remotePlaylistSelector");
    const remotePlaylistList = document.getElementById("remotePlaylistList");
    const messageArea = document.getElementById("messageArea");
    
    let lastPlayedChannelIndex = -1;
    let playlistUrls = [];
    let channelItems = [];
    let playlistItems = [];
    let remotePlaylistItems = [];
    let currentFocusIndex = -1;
    let playlistFocusIndex = -1;
    let remoteFocusIndex = -1;
    let focusIndex = 0;
    let currentView = 'buttons';
    let overlayChannels = [];
    let overlayFocusIndex = 0;
let restoringState = false; // evita que updateChannelList roube o foco durante restauração

    // Lista de playlists remotas
    const remotePlaylistsConfig = [
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
	  /* Atualizar essas playlists
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
	  */
      
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
    ];

    // Lista de playlists locais
    const availablePlaylists = [
      { name: "24 Hs", filename: "playlist_24h.m3u" },
      { name: "TV Misto", filename: "tvmisto.m3u8" },
      { name: "Filmes e Series", filename: "filmes-series.m3u8" },
      { name: "Filmes mp4 ", filename: "filmes.m3u8" },
      { name: "Esportes", filename: "esportes.m3u8" },
      { name: "Variedades", filename: "variedades.m3u8" },
      { name: "Educativo", filename: "teste.m3u8" },
      { name: "EducativoT", filename: "teste2.m3u8" },
      { name: "Top", filename: "new.m3u8" },
      { name: "Novo", filename: "novopono.m3u8" }
    ];

    // MELHORIA 1: Cache para melhor performance
    const cache = {
        playlists: new Map(),
        lastAccessed: new Map()
    };

    // MELHORIA 2: Debounce para navegação mais fluida
    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // MELHORIA 3: Tratamento de erros mais robusto
    function handleError(error, context = 'Operação') {
        console.error(`[${context}] Erro:`, error);
        const userMessage = error.message || 'Erro desconhecido';
        showMessage(`⌐ ${context}: ${userMessage}`, 'error');
    }

    // MELHORIA 4: Validação de URL mais rigorosa
    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    }

    // Função para debug do foco (otimizada)
    function debugFocus(context) {
        if (console.debug) {
            console.debug(`[${context}]`, {
                lastPlayedChannelIndex,
                currentFocusIndex,
                channelItemsLength: channelItems.length,
                currentView,
                activeElement: document.activeElement?.textContent?.substring(0, 50)
            });
        }
    }

    // MELHORIA 5: Navegação com categorias recolhíveis otimizada
    function getVisibleNavigableItems() {
    const headers = Array.from(document.querySelectorAll(".category-header"));
    
    const visibleChannels = Array.from(document.querySelectorAll("ul.category-sublist"))
        .filter(ul => ul.style.display === "block" || ul.style.display === "")
        .flatMap(ul => Array.from(ul.querySelectorAll(".channel-item")));
    
    const allItems = [...headers, ...visibleChannels];
    
    console.log(`Itens navegáveis: ${allItems.length} (${headers.length} headers, ${visibleChannels.length} canais)`);
    
    return allItems;
}

    function setFocusElement(el) {
    if (!el) return;
    
    // Remove foco anterior de todos os elementos
    document.querySelectorAll(".focused").forEach(n => n.classList.remove("focused"));
    
    // Aplica novo foco
    el.classList.add("focused");
    el.focus();
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Atualiza índice atual
    channelItems = getVisibleNavigableItems();
    currentFocusIndex = channelItems.indexOf(el);
    
    console.log(`Foco aplicado em: ${el.textContent?.substring(0, 50)} (índice: ${currentFocusIndex})`);
}

// CORREÇÃO 3: Função toggleCategory melhorada
function toggleCategory(headerEl, subListEl, focusFirstChannel = false) {
    const isOpen = subListEl.style.display === "block";
    
    // Toggle visibility
    subListEl.style.display = isOpen ? "none" : "block";
    headerEl.setAttribute("aria-expanded", (!isOpen).toString());

    // Atualiza ícone
    const label = headerEl.querySelector(".cat-label");
    if (label) {
        const groupName = headerEl.dataset.group;
        label.textContent = (isOpen ? "► " : "▼ ") + groupName;
    }

    // CRÍTICO: Recalcular itens navegáveis após mudança
    setTimeout(() => {
        channelItems = getVisibleNavigableItems();
        
        if (!isOpen) { // Abrindo categoria
            if (focusFirstChannel) {
                const firstChannel = subListEl.querySelector(".channel-item");
                if (firstChannel) {
                    setFocusElement(firstChannel);
                } else {
                    setFocusElement(headerEl);
                }
            } else {
                setFocusElement(headerEl);
            }
        } else { // Fechando categoria
            // Se estava focado em um canal da categoria fechada, voltar para header
            const focusedElement = document.querySelector('.focused');
            if (focusedElement && subListEl.contains(focusedElement)) {
                setFocusElement(headerEl);
            }
        }
    }, 10); // Pequeno delay para garantir atualização do DOM
}

    // NOVA FUNCIONALIDADE: Overlay para mostrar canais por categoria
    function createOverlayElement() {
        let overlay = document.getElementById("channelOverlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "channelOverlay";
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

            const content = document.createElement("div");
            content.id = "overlayContent";
            content.style.cssText = `
                max-width: 800px;
                margin: 0 auto;
                background: #1a1a1a;
                border-radius: 10px;
                padding: 20px;
                border: 2px solid #333;
            `;

            const header = document.createElement("div");
            header.id = "overlayHeader";
            header.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #333;
            `;

            const title = document.createElement("h2");
            title.id = "overlayTitle";
            title.style.cssText = "color: #6bff6b; margin: 0; font-size: 1.5em;";

            const closeBtn = document.createElement("button");
            closeBtn.className = "overlay-close";
closeBtn.tabIndex = 0;

			closeBtn.textContent = "✕ Fechar";
            closeBtn.style.cssText = `
                background: #ff4444;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            `;
            closeBtn.onclick = hideCategoryOverlay;
            closeBtn.onkeydown = (e) => { if (isOKKey(e)) { e.preventDefault(); hideCategoryOverlay(); } };

            const channelGrid = document.createElement("div");
            channelGrid.id = "overlayChannelGrid";
            channelGrid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 10px;
                max-height: 60vh;
                overflow-y: auto;
            `;

            header.appendChild(title);
            header.appendChild(closeBtn);
            content.appendChild(header);
            content.appendChild(channelGrid);
            overlay.appendChild(content);
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    function showCategoryOverlay(groupName, channels) {
        try {
            const overlay = createOverlayElement();
            const title = document.getElementById("overlayTitle");
            const grid = document.getElementById("overlayChannelGrid");

            title.textContent = `📺 ${groupName} (${channels.length} canais)`;
            
            // Limpar grid
            grid.innerHTML = "";
            overlayChannels = [];

            // Adicionar canais
            channels.forEach((channel, index) => {
                const channelDiv = document.createElement("div");
                channelDiv.className = "overlay-channel-item";
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

                channelDiv.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 5px; color: #6bff6b;">
        ${channel.name} ${channel.url && channel.url.toLowerCase().endsWith(".mp4") 
            ? `<span style="font-size: 0.8em; color: yellow;">(MP4)</span>` 
            : ""}
    </div>
    <div style="font-size: 0.8em; color: #aaa;">
        Grupo: ${channel.group}
    </div>
`;


                // Eventos
                channelDiv.onclick = () => {
                    const channelIndex = playlistUrls.findIndex(ch => ch.url === channel.url);
                    openChannelInPlayer(channel.url, channel.name, channelIndex);
                };

                channelDiv.onmouseenter = () => {
                    channelDiv.style.borderColor = "#6bff6b";
                    channelDiv.style.background = "#333";
                };

                channelDiv.onmouseleave = () => {
                    if (!channelDiv.classList.contains("focused")) {
                        channelDiv.style.borderColor = "#444";
                        channelDiv.style.background = "#2a2a2a";
                    }
                };

                grid.appendChild(channelDiv);
                overlayChannels.push(channelDiv);
            });

            // Mostrar overlay
            overlay.style.display = "block";
            currentView = 'overlay';
            overlayFocusIndex = 0;

            // Focar primeiro item
            if (overlayChannels.length > 0) {
                setOverlayFocus(0);
            }

            // Fechar com ESC
            const escHandler = (e) => {
                if (e.key === "Escape") {
                    hideCategoryOverlay();
                    document.removeEventListener("keydown", escHandler);
                }
            };
            document.addEventListener("keydown", escHandler);

            showMessage(`📋 Categoria ${groupName} aberta com ${channels.length} canais`, 'success');

        } catch (error) {
            handleError(error, 'Abertura de categoria');
        }
    }

    function hideCategoryOverlay() {
        const overlay = document.getElementById("channelOverlay");
        if (overlay) {
            overlay.style.display = "none";
        }
        currentView = 'channels';
        overlayChannels = [];
        overlayFocusIndex = 0;
        
        // Voltar foco para lista de categorias
        setTimeout(() => {
            const firstHeader = document.querySelector('.category-header');
            if (firstHeader) {
                setFocusElement(firstHeader);
            }
        }, 100);
    }

    function setOverlayFocus(index) {
        if (!overlayChannels.length) return;
        
        // Remove foco anterior
        overlayChannels.forEach(item => {
            item.classList.remove("focused");
            item.style.borderColor = "#444";
            item.style.background = "#2a2a2a";
        });

        // Aplica novo foco
        const focusedItem = overlayChannels[index];
        focusedItem.classList.add("focused");
        focusedItem.style.borderColor = "#6bff6b";
        focusedItem.style.background = "#333";
        focusedItem.focus();
        focusedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        overlayFocusIndex = index;
    }

    function moveOverlayFocus(delta) {
        if (!overlayChannels.length) return;
        
        const newIndex = (overlayFocusIndex + delta + overlayChannels.length) % overlayChannels.length;
        setOverlayFocus(newIndex);
    }

    // MELHORIA 6: Sistema de cache para playlists
    function cachePlaylist(key, data) {
        cache.playlists.set(key, data);
        cache.lastAccessed.set(key, Date.now());
        
        // Limpa cache antigo (máximo 10 playlists)
        if (cache.playlists.size > 10) {
            const oldest = [...cache.lastAccessed.entries()]
                .sort(([,a], [,b]) => a - b)[0][0];
            cache.playlists.delete(oldest);
            cache.lastAccessed.delete(oldest);
        }
    }

    function getCachedPlaylist(key) {
        if (cache.playlists.has(key)) {
            cache.lastAccessed.set(key, Date.now());
            return cache.playlists.get(key);
        }
        return null;
    }

    // Função para salvar estado da playlist (melhorada)
    function savePlaylistState(playlistData, playlistName, playlistType) {
        try {
            const playlistState = {
                urls: playlistData,
                name: playlistName,
                type: playlistType,
                timestamp: Date.now(),
                version: "1.1" // Para futuras migrações
            };
            localStorage.setItem('savedPlaylistState', JSON.stringify(playlistState));
        } catch (error) {
            handleError(error, 'Salvamento de playlist');
        }
    }

    // MELHORIA 7: Função principal otimizada para abrir no player
    function openChannelInPlayer(url, name, channelIndex = -1) {
    
	// Salva o grupo atual para retorno
    if (typeof currentGroup !== "undefined" && currentGroup) {
        localStorage.setItem("lastOverlayGroup", currentGroup);
    } else {
        localStorage.setItem("lastOverlayGroup", "Todos os Canais");
    }

        try {
            if (!isValidUrl(url)) {
                throw new Error('URL do canal inválida');
            }

            console.log(`🎯 Abrindo canal: ${name}`, { url, channelIndex });
            
            // Salvar o índice do canal atual
            if (channelIndex >= 0) {
                lastPlayedChannelIndex = channelIndex;
            } else {
                lastPlayedChannelIndex = channelItems.findIndex(item => item.dataset.url === url);
            }
            
            // Preparar dados do canal
            const channelData = {
                url,
                name,
                channelIndex: lastPlayedChannelIndex,
                playlist: playlistUrls,
                timestamp: Date.now(),
                version: "1.1"
            };
            
            localStorage.setItem('currentChannel', JSON.stringify(channelData));
            
            // Salvar estado da playlist
            if (playlistUrls.length > 0) {
                savePlaylistState(playlistUrls, "Playlist Atual", "current");
            }
            
            showMessage(`🔄 Abrindo ${name} no player...`, 'loading');
            
            // Redirecionar para o player
            const playerUrl = `player.html?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}&index=${lastPlayedChannelIndex}`;
            window.location.href = playerUrl;
            
        } catch (error) {
            handleError(error, 'Abertura do canal');
        }
    }

    // MELHORIA 8: Sistema de mensagens melhorado
    function showMessage(text, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type === 'error' ? 'error-message' : 
                                type === 'loading' ? 'loading' : 'success-message'}`;
        messageDiv.textContent = text;
        messageDiv.setAttribute('role', 'status');
        messageDiv.setAttribute('aria-live', 'polite');
        
        messageArea.innerHTML = '';
        messageArea.appendChild(messageDiv);
        
        if (type !== 'loading') {
            setTimeout(() => {
                if (messageArea.contains(messageDiv)) {
                    messageArea.removeChild(messageDiv);
                }
            }, 5000);
        }
    }

function focusLastPlayedChannelInOverlay() {
    if (lastPlayedChannelIndex >= 0 && playlistUrls[lastPlayedChannelIndex]) {
        const lastChannel = playlistUrls[lastPlayedChannelIndex];
        const group = lastChannel.group;
        const channelsInGroup = playlistUrls.filter(c => c.group === group);

        // Abre overlay da categoria
        showCategoryOverlay(group, channelsInGroup);

        // Garantir que o foco só será aplicado após o DOM renderizar
        requestAnimationFrame(() => {
            const targetChannelElement = overlayChannels.find(
                el => el.dataset.url === lastChannel.url
            );
            if (targetChannelElement) {
                setOverlayFocus(overlayChannels.indexOf(targetChannelElement));
                console.log(`🎯 Retorno com foco no último canal: ${lastChannel.name}`);
            }
        });
    }
}




    // Função para verificar retorno do player (otimizada)
    function checkReturnFromPlayer() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const returnFromPlayer = urlParams.get('return');
        const raw = localStorage.getItem('currentChannel');

        if (returnFromPlayer === 'true' && raw) {
            const currentChannelData = JSON.parse(raw);

            if (typeof currentChannelData.channelIndex === 'number') {
                lastPlayedChannelIndex = currentChannelData.channelIndex;
            }
            return restorePlaylistState(currentChannelData);
        }
    } catch (error) {
        handleError(error, 'Verificação de retorno');
    }
    return false;
}


    // Função para restaurar estado da playlist (melhorada)
    function restorePlaylistState(currentChannelData) {
    try {
        const saved = localStorage.getItem('savedPlaylistState');
        if (!saved) return false;

        const playlistState = JSON.parse(saved);
        if (!playlistState.urls || !Array.isArray(playlistState.urls)) {
            throw new Error('Dados de playlist inválidos');
        }

        restoringState = true; // evita foco automático em headers

        playlistUrls = playlistState.urls;
        updateChannelList();
        hideAllSelectors();

        // Descobrir corretamente o último canal: por índice ou por URL
        let idx = (typeof lastPlayedChannelIndex === 'number') ? lastPlayedChannelIndex : -1;
        let lastUrl = currentChannelData?.url;

        if (idx < 0 || idx >= playlistUrls.length) {
            if (lastUrl) {
                idx = playlistUrls.findIndex(c => c.url === lastUrl);
            }
        }

        if (idx >= 0) {
            lastPlayedChannelIndex = idx;
            const lastChannel = playlistUrls[idx];
            const group = lastChannel.group;
            const channelsInGroup = playlistUrls.filter(c => c.group === group);

            // Abre o overlay da categoria correta
            showCategoryOverlay(group, channelsInGroup);

            // Foca o canal correto após a pintura do overlay
            requestAnimationFrame(() => {
                const el = overlayChannels.find(n => n.dataset.url === lastChannel.url);
                if (el) {
                    setOverlayFocus(overlayChannels.indexOf(el));
                } else {
                    // fallback: foca header da categoria
                    const header = Array.from(document.querySelectorAll('.category-header'))
                        .find(h => h.dataset.group === group);
                    if (header) setFocusElement(header);
                }
            });
        } else {
            // fallback total: não achou o canal; só foca na lista
            focusChannel();
        }

        showMessage(`✅ Playlist "${playlistState.name}" restaurada - Canal anterior pré-selecionado`, 'success');
        return true;

    } catch (error) {
        handleError(error, 'Restauração de playlist');
        localStorage.removeItem('savedPlaylistState');
        return false;
    } finally {
        restoringState = false;
    }
}



    // MELHORIA 9: Mostrar seletor de playlists remotas otimizado
    function showRemotePlaylistSelector() {
        hideAllSelectors();
        remotePlaylistSelector.style.display = "block";
        updateRemotePlaylistList();
        currentView = 'remote';
        
        setTimeout(() => focusFirstRemotePlaylist(), 100);
    }

    // Função para atualizar lista de playlists remotas (otimizada)
    function updateRemotePlaylistList() {
        try {
            const fragment = document.createDocumentFragment();
    // Adicionar categoria 'Todos os Canais' no topo
    const allHeader = document.createElement("li");
    allHeader.className = "category-header";
    allHeader.setAttribute("tabindex", "0");
    allHeader.setAttribute("role", "button");
    allHeader.setAttribute("aria-expanded", "false");
    allHeader.dataset.group = "Todos os Canais";
    allHeader.innerHTML = `<strong class="cat-label">📺 Todos os Canais (${playlistUrls.length})</strong>`;
    allHeader.style.cssText = "color: #ffeb3b; padding: 15px 10px; border-bottom: 2px solid #333; cursor: pointer; background: linear-gradient(45deg, #333, #555); border-radius: 5px; margin-bottom: 5px;";
    allHeader.onclick = () => showCategoryOverlay("Todos os Canais", playlistUrls);
    fragment.appendChild(allHeader);
        
    // Agrupar por categoria
            const categories = [...new Set(remotePlaylistsConfig.map(p => p.category))];
            
            categories.forEach(category => {
                // Header da categoria
                const categoryHeader = document.createElement("li");
                categoryHeader.innerHTML = `<strong>📂 ${category}</strong>`;
                categoryHeader.className = "category-header-remote";
                categoryHeader.style.cssText = "color: #6bff6b; padding: 10px 0 5px 0; border-bottom: 1px solid #333;";
                fragment.appendChild(categoryHeader);
                
                // Playlists da categoria
                const categoryPlaylists = remotePlaylistsConfig.filter(p => p.category === category);
                categoryPlaylists.forEach(playlist => {
                    const li = document.createElement("li");
                    li.className = "remote-playlist-item";
                    li.setAttribute("tabindex", "0");
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
                    
                    li.onclick = () => loadRemotePlaylist(playlist.url, playlist.name);
                    fragment.appendChild(li);
                });
            });
            
            remotePlaylistList.innerHTML = "";
            remotePlaylistList.appendChild(fragment);
            
            remotePlaylistItems = Array.from(document.querySelectorAll(".remote-playlist-item"));
            showMessage(`📡 ${remotePlaylistsConfig.length} playlists remotas disponíveis`, 'success');
            
        } catch (error) {
            handleError(error, 'Atualização de playlists remotas');
        }
    }

    // MELHORIA 10: Carregamento de playlist remota com cache e timeout
    async function loadRemotePlaylist(url, name) {
        try {
            if (!isValidUrl(url)) {
                throw new Error('URL da playlist inválida');
            }

            // Verificar cache
            const cached = getCachedPlaylist(url);
            if (cached) {
                console.log('📦 Usando playlist em cache:', name);
                playlistUrls = cached;
                playlistUrls.forEach((c, i) => c.tempId = i);
                savePlaylistState(playlistUrls, name, 'remote');
                updateChannelList();
                hideAllSelectors();
                focusChannel();
                showMessage(`✅ ${name} carregada do cache com ${playlistUrls.length} canais`, 'success');
                return;
            }

            showMessage(`🔄 Carregando ${name}...`, 'loading');
            
            // Fetch com timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
            
            const response = await fetch(url, { 
                signal: controller.signal,
                cache: 'no-cache'
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Falha ao carregar ${name} (${response.status})`);
            }
            
            const data = await response.text();
            const parsedPlaylist = parsePlaylist(data);
            
            if (parsedPlaylist.length === 0) {
                throw new Error('Playlist vazia ou formato inválido');
            }
            
            // Salvar no cache
            cachePlaylist(url, parsedPlaylist);
            
            playlistUrls = parsedPlaylist;
            playlistUrls.forEach((c, i) => c.tempId = i);
            savePlaylistState(playlistUrls, name, 'remote');
            updateChannelList();
            hideAllSelectors();
            focusChannel();
            showMessage(`✅ ${name} carregada com ${playlistUrls.length} canais`, 'success');
            
        } catch (error) {
            if (error.name === 'AbortError') {
                handleError(new Error('Timeout ao carregar playlist'), `Carregamento de ${name}`);
            } else {
                handleError(error, `Carregamento de ${name}`);
            }
        }
    }

    // MELHORIA 11: Detecção de playlists com Promise.allSettled
    async function detectAvailablePlaylists() {
        showMessage("🔍 Verificando playlists disponíveis...", 'loading');
        
        try {
            const promises = availablePlaylists.map(async playlist => {
                try {
                    const response = await fetch(`playlists/${playlist.filename}`, { 
                        method: 'HEAD',
                        cache: 'no-cache',
                        signal: AbortSignal.timeout(5000) // 5s timeout
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
                { ...availablePlaylists[results.indexOf(result)], available: false }
            );
            
        } catch (error) {
            handleError(error, 'Detecção de playlists');
            return availablePlaylists.map(p => ({ ...p, available: false }));
        }
    }

    // Função para mostrar seletor de playlists (otimizada)
    async function showPlaylistSelector() {
        hideAllSelectors();
        playlistSelector.style.display = "block";
        
        playlistList.innerHTML = "<li class='loading'>🔄 Detectando playlists disponíveis...</li>";
        
        try {
            const detectedPlaylists = await detectAvailablePlaylists();
            updatePlaylistList(detectedPlaylists);
        } catch (error) {
            updatePlaylistList(availablePlaylists.map(p => ({ ...p, available: false })));
            showMessage("⚠️ Erro ao detectar playlists", 'error');
        }
        
        currentView = 'playlists';
        setTimeout(() => focusFirstPlaylist(), 100);
    }

    // Funções auxiliares (mantidas com pequenas otimizações)
    function hideAllSelectors() {
        playlistSelector.style.display = "none";
        remotePlaylistSelector.style.display = "none";
        hideChannelFocus();
    }

    function backToButtons() {
        hideAllSelectors();
        currentView = 'buttons';
        const buttons = document.querySelectorAll(".navigable");
        if (buttons.length) {
            focusIndex = 0;
            buttons[0].focus();
        }
    }

    function updatePlaylistList(playlists) {
        try {
            const fragment = document.createDocumentFragment();
    // Adicionar categoria 'Todos os Canais' no topo
    const allHeader = document.createElement("li");
    allHeader.className = "category-header";
    allHeader.setAttribute("tabindex", "0");
    allHeader.setAttribute("role", "button");
    allHeader.setAttribute("aria-expanded", "false");
    allHeader.dataset.group = "Todos os Canais";
    allHeader.innerHTML = `<strong class="cat-label">📺 Todos os Canais (${playlistUrls.length})</strong>`;
    allHeader.style.cssText = "color: #ffeb3b; padding: 15px 10px; border-bottom: 2px solid #333; cursor: pointer; background: linear-gradient(45deg, #333, #555); border-radius: 5px; margin-bottom: 5px;";
    allHeader.onclick = () => showCategoryOverlay("Todos os Canais", playlistUrls);
    fragment.appendChild(allHeader);

            
            // Opção manual
            const manualLi = document.createElement("li");
            manualLi.textContent = "✏️ Digite nome do arquivo manualmente";
            manualLi.className = "playlist-item manual-input";
            manualLi.setAttribute("tabindex", "0");
            manualLi.onclick = () => {
                const filename = prompt("Digite o nome do arquivo da playlist (ex: minha-playlist.m3u8):");
                if (filename?.trim()) {
                    loadPlaylistFromFile(filename.trim());
                }
            };
            fragment.appendChild(manualLi);
            
            const availablePlaylist = playlists.filter(p => p.available);
            const unavailablePlaylist = playlists.filter(p => !p.available);
            
            // Playlists disponíveis
            if (availablePlaylist.length > 0) {
                const headerLi = document.createElement("li");
                headerLi.innerHTML = "<strong>📂 Disponíveis:</strong>";
                headerLi.className = "section-header";
                headerLi.style.cssText = "color: #6bff6b; padding: 5px 0;";
                fragment.appendChild(headerLi);
                
                availablePlaylist.forEach(playlist => {
                    const li = document.createElement("li");
                    li.textContent = `✅ ${playlist.name} (${playlist.filename})`;
                    li.className = "playlist-item available-playlist";
                    li.setAttribute("tabindex", "0");
                    li.dataset.filename = playlist.filename;
                    li.onclick = () => loadPlaylistFromFile(playlist.filename);
                    fragment.appendChild(li);
                });
            }
            
            // Playlists indisponíveis
            if (unavailablePlaylist.length > 0) {
                const headerLi = document.createElement("li");
                headerLi.innerHTML = "<strong>🔒 Indisponíveis:</strong>";
                headerLi.className = "section-header";
                headerLi.style.cssText = "color: #ff6b6b; padding: 5px 0;";
                fragment.appendChild(headerLi);
                
                unavailablePlaylist.forEach(playlist => {
                    const li = document.createElement("li");
                    li.textContent = `❌ ${playlist.name} (${playlist.filename})`;
                    li.className = "playlist-item unavailable-playlist";
                    li.setAttribute("tabindex", "0");
                    li.dataset.filename = playlist.filename;
                    li.onclick = () => {
                        if (confirm(`Arquivo ${playlist.filename} não encontrado. Tentar carregar mesmo assim?`)) {
                            loadPlaylistFromFile(playlist.filename);
                        }
                    };
                    fragment.appendChild(li);
                });
            }
            
            playlistList.innerHTML = "";
            playlistList.appendChild(fragment);
            
            playlistItems = Array.from(document.querySelectorAll(".playlist-item"));
            
            const totalAvailable = availablePlaylist.length;
            const totalFiles = playlists.length;
            showMessage(`📊 ${totalAvailable} de ${totalFiles} playlists encontradas`, 'success');
            
        } catch (error) {
            handleError(error, 'Atualização da lista de playlists');
        }
    }

    // MELHORIA 12: Carregamento de playlist local com cache
    async function loadPlaylistFromFile(filename) {
        try {
            if (!filename) {
                throw new Error('Nome do arquivo não fornecido');
            }

            const cacheKey = `local_${filename}`;
            const cached = getCachedPlaylist(cacheKey);
            
            if (cached) {
                console.log('📦 Usando playlist local em cache:', filename);
                playlistUrls = cached;
                playlistUrls.forEach((c, i) => c.tempId = i);
                savePlaylistState(playlistUrls, filename, 'local');
                updateChannelList();
                hideAllSelectors();
                focusChannel();
                showMessage(`✅ ${filename} carregada do cache com ${playlistUrls.length} canais`, 'success');
                return;
            }

            showMessage(`🔄 Carregando ${filename}...`, 'loading');
            
            const response = await fetch(`playlists/${filename}`, {
                cache: 'no-cache',
                signal: AbortSignal.timeout(8000)
            });
            
            if (!response.ok) {
                throw new Error(`Playlist ${filename} não encontrada (${response.status})`);
            }
            
            const data = await response.text();
            const parsedPlaylist = parsePlaylist(data);
            
            if (parsedPlaylist.length === 0) {
                throw new Error('Playlist vazia ou formato inválido');
            }
            
            // Salvar no cache
            cachePlaylist(cacheKey, parsedPlaylist);
            
            playlistUrls = parsedPlaylist;
            playlistUrls.forEach((c, i) => c.tempId = i);
            savePlaylistState(playlistUrls, filename, 'local');
            updateChannelList();
            hideAllSelectors();
            focusChannel();
            showMessage(`✅ ${filename} carregada com ${playlistUrls.length} canais`, 'success');
            
        } catch (error) {
            handleError(error, `Carregamento de ${filename}`);
        }
    }

    async function loadFromUrl() {
        try {
            const url = prompt("Digite a URL da playlist (.m3u8):");
            if (!url?.trim()) return;
            
            const trimmedUrl = url.trim();
            if (!isValidUrl(trimmedUrl)) {
                throw new Error('URL inválida. Use http:// ou https://');
            }

            // Verificar cache
            const cached = getCachedPlaylist(trimmedUrl);
            if (cached) {
                console.log('📦 Usando playlist de URL em cache');
                playlistUrls = cached;
                playlistUrls.forEach((c, i) => c.tempId = i);
                savePlaylistState(playlistUrls, `URL: ${trimmedUrl}`, 'url');
                updateChannelList();
                hideAllSelectors();
                focusChannel();
                showMessage(`✅ Playlist carregada do cache com ${playlistUrls.length} canais`, 'success');
                return;
            }

            showMessage("🔄 Carregando playlist de URL...", 'loading');
            
            const response = await fetch(trimmedUrl, {
                signal: AbortSignal.timeout(10000)
            });
            
            if (!response.ok) {
                throw new Error(`URL inválida (${response.status})`);
            }
            
            const data = await response.text();
            const parsedPlaylist = parsePlaylist(data);
            
            if (parsedPlaylist.length === 0) {
                throw new Error('Playlist vazia ou formato inválido');
            }
            
            // Salvar no cache
            cachePlaylist(trimmedUrl, parsedPlaylist);
            
            playlistUrls = parsedPlaylist;
            playlistUrls.forEach((c, i) => c.tempId = i);
            savePlaylistState(playlistUrls, `URL: ${trimmedUrl}`, 'url');
            updateChannelList();
            hideAllSelectors();
            focusChannel();
            showMessage(`✅ Playlist carregada com ${playlistUrls.length} canais`, 'success');
            
        } catch (error) {
            handleError(error, 'Carregamento por URL');
        }
    }

    function loadSingleChannel() {
        try {
            const url = prompt("Digite a URL do canal (.m3u8 ou .mp4):");
            if (!url?.trim()) return;
            
            const trimmedUrl = url.trim();
            if (!isValidUrl(trimmedUrl)) {
                throw new Error('URL inválida. Use http:// ou https://');
            }
            
            playlistUrls = [{ url: trimmedUrl, name: "Canal Único", group: "Único" }];
            savePlaylistState(playlistUrls, "Canal Único", 'single');
            updateChannelList();
            hideAllSelectors();
            focusChannel();
            showMessage("✅ Canal único carregado", 'success');
            
        } catch (error) {
            handleError(error, 'Canal único');
        }
    }

    // MELHORIA 13: Parser de playlist otimizado com melhor tratamento de dados
    function parsePlaylist(content) {
        try {
            if (!content || typeof content !== 'string') {
                throw new Error('Conteúdo da playlist inválido');
            }

            const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line);
            const parsed = [];
            let currentName = "";
            let currentGroup = "Outros";

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                if (line.startsWith("#EXTINF")) {
                    // Extrair group-title
                    const groupMatch = line.match(/group-title="([^"]+)"/i);
                    currentGroup = groupMatch ? groupMatch[1].trim() : "Outros";
                    
                    // Extrair nome do canal (após a vírgula)
                    const commaIndex = line.lastIndexOf(",");
                    if (commaIndex !== -1) {
                        currentName = line.substring(commaIndex + 1).trim();
                    }
                    
                    // Se nome vazio, usar próxima linha se não for URL
                    if (!currentName && i + 1 < lines.length && !lines[i + 1].startsWith("http")) {
                        currentName = lines[i + 1];
                        i++; // Pular próxima linha
                    }
                    
                    if (!currentName) {
                        currentName = "Canal Desconhecido";
                    }
                } else if (line.startsWith("http")) {
                    // Validar URL
                    if (isValidUrl(line)) {
                        parsed.push({
                            url: line,
                            name: currentName || "Canal Desconhecido",
                            group: currentGroup || "Outros"
                        });
                    }
                    
                    // Reset para próximo canal
                    currentName = "";
                    currentGroup = "Outros";
                }
            }

            console.log(`📋 Playlist parseada: ${parsed.length} canais encontrados`);
            // Atribui IDs temporários para navegação
    parsed.forEach((c, i) => c.tempId = i);
    return parsed;
            
        } catch (error) {
            handleError(error, 'Parser de playlist');
            return [];
        }
    }

    // MELHORIA 14: Função de atualização de lista de canais otimizada com DocumentFragment e overlay
    function updateChannelList() {
        try {
			
            const fragment = document.createDocumentFragment();
			// Mostrar nome da playlist atual no topo
const savedState = JSON.parse(localStorage.getItem('savedPlaylistState') || "{}");
if (savedState.name) {
    const playlistHeader = document.createElement("li");
    playlistHeader.textContent = `📂 Playlist: ${savedState.name}`;
    playlistHeader.style.cssText = "color: #00e676; padding: 15px 10px; font-weight: bold; font-size: 1.1em;";
    fragment.appendChild(playlistHeader);
}

    // Adicionar categoria 'Todos os Canais' no topo
    const allHeader = document.createElement("li");
    allHeader.className = "category-header";
    allHeader.setAttribute("tabindex", "0");
    allHeader.setAttribute("role", "button");
    allHeader.setAttribute("aria-expanded", "false");
    allHeader.dataset.group = "Todos os Canais";
    allHeader.innerHTML = `<strong class="cat-label">📺 Todos os Canais (${playlistUrls.length})</strong>`;
    allHeader.style.cssText = "color: #ffeb3b; padding: 15px 10px; border-bottom: 2px solid #333; cursor: pointer; background: linear-gradient(45deg, #333, #555); border-radius: 5px; margin-bottom: 5px;";
    allHeader.onclick = () => showCategoryOverlay("Todos os Canais", playlistUrls);
    fragment.appendChild(allHeader);

            
            
            if (playlistUrls.length === 0) {
                const emptyLi = document.createElement("li");
                emptyLi.textContent = "Nenhum canal disponível";
                emptyLi.style.color = "#ccc";
                fragment.appendChild(emptyLi);
                
                channelList.innerHTML = "";
                channelList.appendChild(fragment);
                return;
            }

            // Agrupar por categoria
            const grouped = {};
            playlistUrls.forEach(channel => {
                const group = channel.group || "Outros";
                if (!grouped[group]) grouped[group] = [];
                grouped[group].push(channel);
            });

            // Ordenar grupos alfabeticamente
            const sortedGroups = Object.keys(grouped).sort();

            sortedGroups.forEach(group => {
                // Cabeçalho da categoria
                const header = document.createElement("li");
                header.className = "category-header";
                header.setAttribute("tabindex", "0");
                header.setAttribute("role", "button");
                header.setAttribute("aria-expanded", "false");
                header.dataset.group = group;
                header.innerHTML = `<strong class="cat-label">📺 ${group} (${grouped[group].length} canais)</strong>`;
                header.style.cssText = "color: #6bff6b; padding: 15px 10px; border-bottom: 2px solid #333; cursor: pointer; background: linear-gradient(45deg, #1a1a1a, #2a2a2a); border-radius: 5px; margin-bottom: 5px;";

                // Ao clicar no header, mostrar overlay com canais da categoria
                header.onclick = () => showCategoryOverlay(group, grouped[group]);

                fragment.appendChild(header);
            });

            // Atualizar DOM de uma vez
            channelList.innerHTML = "";
            channelList.appendChild(fragment);

            // Atualizar referências
            channelItems = Array.from(document.querySelectorAll(".category-header"));
            currentView = 'channels';

            // Focar no primeiro elemento
            if (!restoringState) {    requestAnimationFrame(() => {
        const firstElement = channelItems[0];
        if (firstElement) setFocusElement(firstElement);
    });
}


            debugFocus('updateChannelList');
            
        } catch (error) {
            handleError(error, 'Atualização da lista de canais');
        }
    }

    const debouncedFocusChannel = debounce((index = 0) => {
        if (!channelItems.length) {
            channelItems = Array.from(document.querySelectorAll(".category-header"));
        }
        
        if (!channelItems.length) return;
        
        try {
            let targetIndex = index;
            
            // Se há um canal previamente reproduzido, tentar focar na categoria correspondente
            if (lastPlayedChannelIndex >= 0 && playlistUrls[lastPlayedChannelIndex]) {
                const lastChannel = playlistUrls[lastPlayedChannelIndex];
                const categoryHeader = Array.from(channelItems).find(header => 
                    header.dataset.group === lastChannel.group
                );
                
                if (categoryHeader) {
                    targetIndex = channelItems.indexOf(categoryHeader);
                }
            }
            
            // Garantir que o índice está dentro dos limites
            targetIndex = Math.max(0, Math.min(targetIndex, channelItems.length - 1));
            
            currentFocusIndex = targetIndex;
            currentView = 'channels';
            
            // Aplicar foco
            setFocusElement(channelItems[currentFocusIndex]);
            
            if (lastPlayedChannelIndex >= 0 && playlistUrls[lastPlayedChannelIndex]) {
                showMessage(`Voltando à categoria: ${playlistUrls[lastPlayedChannelIndex].group}`, 'info');
            }
            
            debugFocus('focusChannel');
            
        } catch (error) {
            handleError(error, 'Foco no canal');
        }
    }, 100);

    function focusChannel(index = 0) {
        debouncedFocusChannel(index);
    }

    function focusFirstPlaylist() {
        setTimeout(() => {
            if (playlistItems.length) {
                playlistFocusIndex = 0;
                const firstItem = playlistItems[0];
                firstItem.focus();
                firstItem.classList.add("focused");
            }
        }, 100);
    }

    function focusFirstRemotePlaylist() {
        setTimeout(() => {
            if (remotePlaylistItems.length) {
                remoteFocusIndex = 0;
                const firstItem = remotePlaylistItems[0];
                firstItem.focus();
                firstItem.classList.add("focused");
            }
        }, 100);
    }

    function hideChannelFocus() {
        channelItems.forEach(el => el.classList.remove("focused"));
        currentFocusIndex = -1;
    }

    // MELHORIA 16: Sistema de navegação otimizado
    const debouncedMoveFocus = debounce((delta) => {
        if (currentView === 'overlay') {
            moveOverlayFocus(delta);
            return;
        }
        
        if (currentView === 'channels') {
            // Sempre recalcular itens visíveis
            channelItems = Array.from(document.querySelectorAll(".category-header"));
            
            if (!channelItems.length) return;

            // Encontrar elemento ativo atual
            const focused = document.querySelector('.focused') || document.activeElement;
            let currentIndex = channelItems.indexOf(focused);
            
            // Se não encontrou elemento ativo, usar primeiro item
            if (currentIndex === -1) {
                currentIndex = 0;
            }

            // Calcular novo índice
            const newIndex = (currentIndex + delta + channelItems.length) % channelItems.length;
            
            // Aplicar foco
            setFocusElement(channelItems[newIndex]);
            return;
        }

        // Navegação em outras views (mantido igual)
        if (currentView === 'playlists' && playlistItems.length) {
            if (playlistFocusIndex >= 0) {
                playlistItems[playlistFocusIndex]?.classList.remove("focused");
            }
            playlistFocusIndex = (playlistFocusIndex + delta + playlistItems.length) % playlistItems.length;
            const item = playlistItems[playlistFocusIndex];
            if (item) {
                item.focus();
                item.classList.add("focused");
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } else if (currentView === 'remote' && remotePlaylistItems.length) {
            if (remoteFocusIndex >= 0) {
                remotePlaylistItems[remoteFocusIndex]?.classList.remove("focused");
            }
            remoteFocusIndex = (remoteFocusIndex + delta + remotePlaylistItems.length) % remotePlaylistItems.length;
            const item = remotePlaylistItems[remoteFocusIndex];
            if (item) {
                item.focus();
                item.classList.add("focused");
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, 50);

    function moveFocus(delta) {
        debouncedMoveFocus(delta);
    }

    // MELHORIA 17: Sistema de controles de teclado otimizado e mais responsivo
    function setupKeyboardControls() {
        document.addEventListener("keydown", (e) => {
            console.log(`Tecla pressionada: ${e.key}, View atual: ${currentView}`);
            
            // Modo de busca (overlay de input)
            if (currentView === 'search') {
                if (isOKKey(e)) {
                    e.preventDefault();
                    const input = document.getElementById("searchInputField");
                    if (input) performChannelSearch((input.value || "").trim());
                    return;
                } else if (e.key === "Backspace" || e.key === "Escape" || e.keyCode === 10009) {
                    e.preventDefault();
                    hideSearchOverlay();
                    return;
                }
            }

            
            // Controles específicos para overlay
            if (currentView === 'overlay') {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    moveOverlayFocus(1);
                    return;
                }
                else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    moveOverlayFocus(-1);
                    return;
                }
                else if (e.key === "ArrowRight") {
                    e.preventDefault();
                    moveOverlayFocus(4); // Pular uma linha no grid
                    return;
                }
                else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    moveOverlayFocus(-4); // Voltar uma linha no grid
                    return;
                }
                else if (isOKKey(e)) {
                    e.preventDefault();
                    const focusedChannel = overlayChannels[overlayFocusIndex];
                    if (focusedChannel) {
                        focusedChannel.click();
                    }
                    return;
                }
                else if (e.key === "Backspace" || e.key === "Escape" || e.keyCode === 10009) {
    e.preventDefault();
    hideCategoryOverlay();
    return;
}

            }
            
            // Navegação vertical nas listas
            if (['channels', 'playlists', 'remote'].includes(currentView)) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    moveFocus(1);
                    return;
                }
                else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    moveFocus(-1);
                    return;
                }
            }

            // Enter para ativar elementos
            if (isOKKey(e)) {
                e.preventDefault();
                const active = document.activeElement;
                
                const clickableElements = [
                    'channel-item', 'playlist-item', 'remote-playlist-item', 
                    'navigable', 'category-header'
                ];
                
                if (clickableElements.some(className => active?.classList.contains(className))) {
                    active.click();
                }
                return;
            }

            // Backspace para voltar
            if (e.key === "Backspace" || e.keyCode === 10009) {
                e.preventDefault();
                if (['playlists', 'remote'].includes(currentView)) {
                    backToButtons();
                } else if (currentView === 'channels') {
                    hideChannelFocus();
                    currentView = 'buttons';
                    const buttons = document.querySelectorAll(".navigable");
                    if (buttons.length) {
                        focusIndex = 0;
                        buttons[0].focus();
                    }
                }
                return;
            }
        });

        // Navegação horizontal nos botões
        document.addEventListener("keydown", (e) => {
            if (currentView === 'buttons' && ["ArrowRight", "ArrowLeft"].includes(e.key)) {
                e.preventDefault();
                const buttons = document.querySelectorAll(".navigable");
                if (e.key === "ArrowRight") {
                    focusIndex = (focusIndex + 1) % buttons.length;
                } else {
                    focusIndex = (focusIndex - 1 + buttons.length) % buttons.length;
                }
                buttons[focusIndex].focus();
            }
        });
    }

    // MELHORIA 18: Event listeners otimizados
    function setupEventListeners() {
        // Botões principais
        document.getElementById("btnHome").addEventListener("click", () => {
            if (confirm("Voltar para a página inicial?")) {
                location.href = "index.html";
            }
        });
        
        document.getElementById("btnLoadPlaylist").addEventListener("click", showRemotePlaylistSelector);
        document.getElementById("btnLocal").addEventListener("click", showPlaylistSelector);
        document.getElementById("btnUrl").addEventListener("click", loadFromUrl);
        document.getElementById("btnSingle").addEventListener("click", loadSingleChannel);
        
        // Botões de voltar
        document.getElementById("btnBackFromRemote").addEventListener("click", backToButtons);
        document.getElementById("btnBackFromLocal").addEventListener("click", backToButtons);
    }

    // MELHORIA 19: Inicialização otimizada e mais robusta
    

// [REMOVIDO SISTEMA DE BUSCA ANTIGO]







// === SISTEMA DE BUSCA DE CANAIS (SMART TV FRIENDLY) ===







// === BUSCA: Overlay com campo de texto (focável) ===


function hideSearchOverlay() {
    const overlay = document.getElementById("searchOverlay");
    if (overlay) overlay.style.display = "none";
    currentView = 'channels';
    // Retorna foco ao botão de busca (se existir)
    const trigger = document.querySelector(".category-header.search-trigger");
    if (trigger) setFocusElement(trigger);
}


function initialize() {
    // Verifica se há overlay salvo na URL
    const params = new URLSearchParams(window.location.search);
    const paramOverlay = params.get("overlay");
    if (paramOverlay && typeof grouped !== "undefined" && grouped[paramOverlay]) {
        showCategoryOverlay(paramOverlay, grouped[paramOverlay]);
    }

        try {
            console.log("🚀 M3U8 Player inicializado com melhorias e overlay de categorias");
            
            // Setup dos controles e listeners
            setupKeyboardControls();
            setupEventListeners();
            
            // Foco inicial nos botões
            const buttons = document.querySelectorAll(".navigable");
            if (buttons.length) {
                buttons[focusIndex].focus();
            }
            
            // Verificar se está voltando do player
            if (!checkReturnFromPlayer()) {
                // Inicialização limpa
                playlistUrls = [];
                lastPlayedChannelIndex = -1;
                channelItems = [];
                updateChannelList();
                showMessage("💡 Selecione uma opção acima para começar", 'success');
                console.log("🔄 Inicialização limpa - nenhuma playlist pré-carregada");
            } else {
                console.log("🔄 Playlist restaurada após retorno do player");
            }
            
            debugFocus('Inicialização');
            
        } catch (error) {
            handleError(error, 'Inicialização');
        }
    }

    // Executar inicialização
    initialize();
});
