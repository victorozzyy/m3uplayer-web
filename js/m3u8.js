document.addEventListener("DOMContentLoaded", () => {
    
    // Helper: trata tecla OK/Enter de controles remotos
    function isOKKey(e) {
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
    
    // VARIÁVEIS GLOBAIS (substituindo localStorage)
    let currentPlaylist = {
        urls: [],
        name: "",
        type: "",
        currentIndex: -1,
        lastPosition: 0
    };
    
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
    let restoringState = false;

    // PLAYER OVERLAY VARIABLES
    let playerOverlay = null;
    let avplay = null;
    let isPlaying = false;
    let hideTimer = null;
    let duration = 0;
    let advanceTimer = null;
    let advanceStart = 0;

    // Lista de playlists remotas
    const remotePlaylistsConfig = [
      {name: "🏆 Esportes 1", description: "Canais esportivos em alta definição", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/esportes.m3u8", category: "Esportes"},
      {name: "🏆 Esportes 2", description: "Canais esportivos em alta definição", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_esportes.m3u", category: "Esportes"},
      {name: "🎬 Canais 24 Hs", description: "Canais variados de alta qualidade", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_24h.m3u", category: "Filmes e Series"},
      {name: "🎬 Canais", description: "Canais variados de alta qualidade", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/canais24h.m3u8", category: "Filmes"},
      {name: "🎬 Filmes1 ", description: "Canais variados de alta qualidade", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_mp4_part1.m3u", category: "Mp4"},
      {name: "🎬 Series1 ", description: "Canais variados de alta qualidade", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/seriesmp4.m3u8", category: "Mp4"},
      {name: "🎬 Filmes e Series", description: "Canais variados de alta qualidade", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/filmes-series.m3u8", category: "Mp4"},
      {name: "🎬 Filmes e Series2", description: "Canais variados de alta qualidade", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_filmes_series.m3u", category: "Filmes e Series"},
      {name: "🎬 Series2 mp4", description: "Big sequencia, series boas.", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists2/series2-mp4.m3u8", category: "Mp4"},
      {name: "🎬 Series3 mp4", description: "Rancho, Dexter, Suits, Justfield", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists2/series3-mp4.m3u8", category: "Mp4"},
      {name: "🎬 Filmes2 mp4", description: "Canais variados de alta qualidade", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists2/filmes2-mp4.m3u8", category: "Mp4"},
      {name: "🎬 Canais2 mp4", description: "Canais variados de alta qualidade", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/canais2.m3u8", category: "Mp4"},
      {name: "🎬 Mp4 1", description: "Canais variados de alta qualidade", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_mp4_part1.m3u", category: "Mp4"},
      {name: "🎬 Mp4 2", description: "Canais variados de alta qualidade", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_mp4_part2.m3u", category: "Mp4"},
      {name: "🎬 Mp4 3", description: "Canais variados de alta qualidade", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_mp4_part3.m3u", category: "Filmes"},
      {name: "🎬 Mp4 4", description: "Canais variados de alta qualidade", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_mp4_part4.m3u", category: "Filmes"},
      {name: "🎭 Educativo", description: "Canais de séries, filmes e shows", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/educativo.m3u8", category: "Pt"},
      {name: "🎭 Aqueles", description: "Canais de séries, filmes e shows", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/aqules.m3u8", category: "Pt"},
      {name: "🎭 Educativo3", description: "Canais de séries, filmes e shows", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/new.m3u8", category: "Pt"},
      {name: "🎭 teste", description: "Canais de séries, filmes e shows", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/teste.m3u8", category: "Pt"},
      {name: "🎭 Funcional00", description: "Canais de séries, filmes e shows", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/teste2.m3u8", category: "Pt"},
      {name: "🎭 Funcional Mp4", description: "Canais de séries, filmes e shows", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/putria2.m3u8", category: "Pt"},
      {name: "🎭 Funcional4 Mp4", description: "Canais de séries, filmes e shows", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/putria3.m3u8", category: "Pt"},
      {name: "🎭 Funcional Pov Mp4", description: "Canais de séries, filmes e shows", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/putria4.m3u8", category: "Pt"},
      {name: "🎭 Funcional3 Mp4", description: "Canais de séries, filmes e shows", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/putria.m3u8", category: "Pt"},
      {name: "🎭 NovoPono Instavel", description: "Conteúdo seguro para crianças", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists2/novopono.m3u8", category: "Pt"},
      {name: "👶 Desenhos", description: "Conteúdo seguro para crianças", url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_desenhos.m3u", category: "Infantil"}
    ];

    const availablePlaylists = [
      {name: "24 Hs", filename: "playlist_24h.m3u"},
      {name: "TV Misto", filename: "tvmisto.m3u8"},
      {name: "Filmes e Series", filename: "filmes-series.m3u8"},
      {name: "Filmes mp4 ", filename: "filmes.m3u8"},
      {name: "Esportes", filename: "esportes.m3u8"},
      {name: "Variedades", filename: "variedades.m3u8"},
      {name: "Educativo", filename: "teste.m3u8"},
      {name: "EducativoT", filename: "teste2.m3u8"},
      {name: "Top", filename: "new.m3u8"},
      {name: "Novo", filename: "novopono.m3u8"}
    ];

    const cache = {
        playlists: new Map(),
        lastAccessed: new Map()
    };

    // ========== FUNÇÕES AUXILIARES ==========

    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    function handleError(error, context = 'Operação') {
        console.error(`[${context}] Erro:`, error);
        const userMessage = error.message || 'Erro desconhecido';
        showMessage(`❌ ${context}: ${userMessage}`, 'error');
    }

    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (e) {
            return false;
        }
    }

    function debugFocus(context) {
        if (console.debug) {
            console.debug(`[${context}]`, {
                currentFocusIndex,
                channelItemsLength: channelItems.length,
                currentView,
                activeElement: document.activeElement?.textContent?.substring(0, 50)
            });
        }
    }

    function getVisibleNavigableItems() {
        const headers = Array.from(document.querySelectorAll(".category-header"));
        const visibleChannels = Array.from(document.querySelectorAll("ul.category-sublist"))
            .filter(ul => ul.style.display === "block" || ul.style.display === "")
            .flatMap(ul => Array.from(ul.querySelectorAll(".channel-item")));
        
        return [...headers, ...visibleChannels];
    }

    function setFocusElement(el) {
        if (!el) return;
        
        document.querySelectorAll(".focused").forEach(n => n.classList.remove("focused"));
        
        el.classList.add("focused");
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        channelItems = getVisibleNavigableItems();
        currentFocusIndex = channelItems.indexOf(el);
    }

    // ========== MESSAGES ==========

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

    // ========== PLAYER OVERLAY FUNCTIONS ==========

    function formatTime(ms) {
        const sec = Math.floor(ms / 1000);
        const m = Math.floor(sec / 60).toString().padStart(2, "0");
        const s = (sec % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }

    function createPlayerOverlay() {
        if (playerOverlay) return playerOverlay;

        playerOverlay = document.createElement("div");
        playerOverlay.id = "playerOverlay";
        playerOverlay.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: black;
            z-index: 10000;
        `;

        playerOverlay.innerHTML = `
            <div id="playerControls" style="
                position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%);
                display: flex; gap: 15px;
                background: rgba(0,0,0,0.6); padding: 12px 24px; border-radius: 12px;
                transition: opacity 0.5s ease;">
                <button id="playerPrev" style="font-size: 18px; padding: 10px 20px; background: #222; color: white; border: none; border-radius: 6px; cursor: pointer;">⏮ Anterior</button>
                <button id="playerRew" style="font-size: 18px; padding: 10px 20px; background: #222; color: white; border: none; border-radius: 6px; cursor: pointer;">⏪ -10s</button>
                <button id="playerPlayPause" autofocus style="font-size: 18px; padding: 10px 20px; background: #222; color: white; border: none; border-radius: 6px; cursor: pointer;">▶️ Play</button>
                <button id="playerFwd" style="font-size: 18px; padding: 10px 20px; background: #222; color: white; border: none; border-radius: 6px; cursor: pointer;">⏩ +10s</button>
                <button id="playerAdvanceHold" style="font-size: 18px; padding: 10px 20px; background: #222; color: white; border: none; border-radius: 6px; cursor: pointer;">⏩⏳ Avançar</button>
                <button id="playerNext" style="font-size: 18px; padding: 10px 20px; background: #222; color: white; border: none; border-radius: 6px; cursor: pointer;">⏭ Próximo</button>
                <button id="playerReload" style="font-size: 18px; padding: 10px 20px; background: #222; color: white; border: none; border-radius: 6px; cursor: pointer;">🔄 Recarregar</button>
                <button id="playerFullscreen" style="font-size: 18px; padding: 10px 20px; background: #222; color: white; border: none; border-radius: 6px; cursor: pointer;">🖵 Tela Cheia</button>
                <button id="playerClose" style="font-size: 18px; padding: 10px 20px; background: #ff4444; color: white; border: none; border-radius: 6px; cursor: pointer;">❌ Fechar</button>
            </div>
            <div id="playerProgressContainer" style="
                position: fixed; bottom: 15px; left: 50%; transform: translateX(-50%);
                display: flex; align-items: center; gap: 10px; width: 80%;
                opacity: 1; transition: opacity 0.5s ease;">
                <span id="playerTime" style="font-size: 14px; color: white; font-variant-numeric: tabular-nums;">00:00 / 00:00</span>
                <input type="range" id="playerProgress" value="0" min="0" max="100" style="flex: 1; height: 8px;">
            </div>
            <div id="playerChannelTitle" style="
                position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
                background: rgba(0,0,0,0.6); color: #fff; padding: 10px 20px;
                border-radius: 8px; font-size: 20px; transition: opacity 0.5s ease;">
            </div>
            <div id="playerClock" style="
                position: fixed; top: 20px; right: 20px;
                background: rgba(0,0,0,0.6); color: #fff;
                padding: 8px 16px; border-radius: 8px;
                font-size: 18px; font-family: monospace;
                transition: opacity 0.5s ease;">
            </div>
        `;

        document.body.appendChild(playerOverlay);
        setupPlayerEvents();
        return playerOverlay;
    }

    function setupPlayerEvents() {
        document.getElementById("playerPlayPause").addEventListener("click", togglePlayPause);
        document.getElementById("playerRew").addEventListener("click", () => seek(-10000));
        document.getElementById("playerFwd").addEventListener("click", () => seek(10000));
        document.getElementById("playerReload").addEventListener("click", reloadPlayer);
        document.getElementById("playerFullscreen").addEventListener("click", toggleFullscreen);
        document.getElementById("playerPrev").addEventListener("click", () => switchChannel(-1));
        document.getElementById("playerNext").addEventListener("click", () => switchChannel(1));
        document.getElementById("playerClose").addEventListener("click", closePlayer);

        const advanceBtn = document.getElementById("playerAdvanceHold");
        const start = (e) => { e.preventDefault(); startAdvanceHold(); };
        const stop = (e) => { e.preventDefault(); stopAdvanceHold(); };
        advanceBtn.addEventListener("mousedown", start);
        advanceBtn.addEventListener("touchstart", start, { passive: true });
        ["mouseup","mouseleave","touchend","touchcancel","blur"].forEach(ev => 
            advanceBtn.addEventListener(ev, stop));
        advanceBtn.addEventListener("keydown", (e) => { 
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startAdvanceHold(); } 
        });
        advanceBtn.addEventListener("keyup", (e) => { 
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stopAdvanceHold(); } 
        });

        const progress = document.getElementById("playerProgress");
        progress.addEventListener("input", () => {
            if (duration > 0 && avplay) {
                const pos = (progress.value / 100) * duration;
                avplay.seekTo(pos);
            }
        });

        document.addEventListener("keydown", handlePlayerKeyboard);
    }

    function handlePlayerKeyboard(e) {
        if (currentView !== 'player') return;

        showPlayerControls();

        if (e.key === "Backspace" || e.keyCode === 10009) {
            e.preventDefault();
            closePlayer();
            return;
        }

        if (e.keyCode === 427 || e.key === "ChannelUp") {
            e.preventDefault();
            switchChannel(1);
        }
        if (e.keyCode === 428 || e.key === "ChannelDown") {
            e.preventDefault();
            switchChannel(-1);
        }

        const controls = document.getElementById("playerControls");
        const allButtons = Array.from(controls.querySelectorAll("button"));
        const progress = document.getElementById("playerProgress");
        const allFocusables = [...allButtons, progress];
        const focused = document.activeElement;
        const idx = allFocusables.indexOf(focused);

        if (e.key === "ArrowRight" && idx >= 0) {
            (allFocusables[idx + 1] || allFocusables[0]).focus();
            e.preventDefault();
        }
        if (e.key === "ArrowLeft" && idx >= 0) {
            (allFocusables[idx - 1] || allFocusables[allFocusables.length - 1]).focus();
            e.preventDefault();
        }
        if (e.key === "Enter" && idx >= 0 && focused.tagName === "BUTTON") {
            focused.click();
            e.preventDefault();
        }
    }

    function showPlayerControls() {
        const controls = document.getElementById("playerControls");
        const progressContainer = document.getElementById("playerProgressContainer");
        const channelTitle = document.getElementById("playerChannelTitle");
        const clock = document.getElementById("playerClock");

        if (controls) controls.style.opacity = "1";
        if (progressContainer) progressContainer.style.opacity = "1";
        if (channelTitle) channelTitle.style.opacity = "1";
        if (clock) clock.style.opacity = "1";

        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            if (controls) controls.style.opacity = "0";
            if (progressContainer) progressContainer.style.opacity = "0";
            if (channelTitle) channelTitle.style.opacity = "0";
            if (clock) clock.style.opacity = "0";
        }, 4000);
    }

    function updateClock() {
        const clock = document.getElementById("playerClock");
        if (!clock) return;
        const now = new Date();
        const h = now.getHours().toString().padStart(2, "0");
        const m = now.getMinutes().toString().padStart(2, "0");
        const s = now.getSeconds().toString().padStart(2, "0");
        clock.textContent = `${h}:${m}:${s}`;
    }

    function initPlayer(streamUrl, channelName, channelIndex) {
        if (!streamUrl) {
            alert("Nenhuma URL");
            return;
        }

        currentPlaylist.currentIndex = channelIndex;
        currentPlaylist.lastPosition = 0;

        const channelTitle = document.getElementById("playerChannelTitle");
        if (channelTitle) {
            channelTitle.textContent = `📺 ${channelName}`;
        }

        setInterval(updateClock, 1000);
        updateClock();

        if (!window.webapis || !webapis.avplay) {
            console.warn("Simulação: AVPlay não existe aqui.");
            showMessage("⚠️ AVPlay não disponível (apenas em TVs Samsung)", "error");
            return;
        }

        avplay = webapis.avplay;
        avplay.open(streamUrl);
        avplay.setDisplayRect(0, 0, 1920, 1080);

        avplay.setListener({
            onstreamcompleted: () => {
                console.log("🔄 Canal terminou.");
                const currentChannel = playlistUrls[currentPlaylist.currentIndex];
                if (currentChannel && /\.(mp4|mkv|avi|mov|wmv|flv)$/i.test(currentChannel.url)) {
                    console.log("▶️ Arquivo de vídeo, indo para próximo canal...");
                    switchChannel(1);
                }
            },
            onerror: (err) => console.error("Erro AVPlay:", err)
        });

        avplay.prepareAsync(() => {
            duration = avplay.getDuration();
            play();
            updateProgress();
        }, err => console.error("Erro ao preparar:", err));
    }

    function play() {
        if (!avplay) return;
        avplay.play();
        isPlaying = true;
        const btn = document.getElementById("playerPlayPause");
        if (btn) btn.innerText = "⏸ Pause";
    }

    function pause() {
        if (!avplay) return;
        avplay.pause();
        isPlaying = false;
        currentPlaylist.lastPosition = avplay.getCurrentTime();
        const btn = document.getElementById("playerPlayPause");
        if (btn) btn.innerText = "▶️ Play";
    }

    function togglePlayPause() {
        isPlaying ? pause() : play();
    }

    function seek(offset) {
        if (!avplay) return;
        try {
            const pos = avplay.getCurrentTime();
            avplay.seekTo(Math.max(0, pos + offset));
        } catch(e) {
            console.error("Erro ao buscar:", e);
        }
    }

    function reloadPlayer() {
        if (!avplay) return;
        currentPlaylist.lastPosition = avplay.getCurrentTime();
        avplay.stop();
        avplay.close();
        const currentChannel = playlistUrls[currentPlaylist.currentIndex];
        if (currentChannel) {
            initPlayer(currentChannel.url, currentChannel.name, currentPlaylist.currentIndex);
        }
    }

    function toggleFullscreen() {
        const elem = document.documentElement;
        if (!document.fullscreenElement) {
            if (elem.requestFullscreen) elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
    }

    function updateProgress() {
        if (currentView !== 'player') return;
        
        try {
            if (avplay) {
                const pos = avplay.getCurrentTime();
                if (duration > 0) {
                    const progress = document.getElementById("playerProgress");
                    const timeLabel = document.getElementById("playerTime");
                    if (progress) progress.value = (pos / duration) * 100;
                    if (timeLabel) timeLabel.textContent = `${formatTime(pos)} / ${formatTime(duration)}`;
                }
            }
        } catch(e) {
            console.error("Erro ao atualizar progresso:", e);
        }
        requestAnimationFrame(updateProgress);
    }

    function switchChannel(offset) {
        if (playlistUrls.length === 0) return;

        let idx = currentPlaylist.currentIndex;
        if (idx < 0) idx = 0;

        const total = playlistUrls.length;
        idx = (idx + offset + total) % total;

        const nextCh = playlistUrls[idx];
        if (!nextCh || !nextCh.url) {
            console.warn("Item inválido:", nextCh);
            return;
        }

        currentPlaylist.currentIndex = idx;
        currentPlaylist.lastPosition = 0;

        if (avplay) {
            try {
                avplay.stop();
                avplay.close();
            } catch(e) {
                console.error("Erro ao fechar player:", e);
            }
        }

        initPlayer(nextCh.url, nextCh.name, idx);
    }

    function startAdvanceHold() {
        stopAdvanceHold();
        advanceStart = Date.now();
        advanceTimer = setInterval(() => {
            const held = Date.now() - advanceStart;
            let step;
            if (held < 1000) step = 5000;
            else if (held < 3000) step = 10000;
            else if (held < 6000) step = 20000;
            else if (held < 10000) step = 30000;
            else step = 60000;
            seek(step);
        }, 400);
    }

    function stopAdvanceHold() {
        if (advanceTimer) {
            clearInterval(advanceTimer);
            advanceTimer = null;
        }
    }

    function closePlayer() {
        if (avplay) {
            try {
                avplay.stop();
                avplay.close();
            } catch(e) {
                console.error("Erro ao fechar player:", e);
            }
        }

        if (playerOverlay) {
            playerOverlay.style.display = "none";
        }

        currentView = 'channels';
        isPlaying = false;
        avplay = null;

        setTimeout(() => {
            const firstHeader = document.querySelector('.category-header');
            if (firstHeader) {
                setFocusElement(firstHeader);
            }
        }, 100);
    }

    function openChannelInPlayer(url, name, channelIndex = -1) {
        try {
            if (!isValidUrl(url)) {
                throw new Error('URL do canal inválida');
            }

            console.log(`🎯 Abrindo canal: ${name}`, { url, channelIndex });
            
            if (channelIndex >= 0) {
                currentPlaylist.url = url;
            currentPlaylist.name = name;

            showMessage(`🔄 Abrindo ${name} no player...`, 'loading');
            
            createPlayerOverlay();
            playerOverlay.style.display = "block";
            currentView = 'player';

            hideCategoryOverlay();

            initPlayer(url, name, currentPlaylist.currentIndex);
            
        } catch (error) {
            handleError(error, 'Abertura do canal');
        }
    }

    // ========== CATEGORY OVERLAY ==========

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
            
            grid.innerHTML = "";
            overlayChannels = [];

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

            overlay.style.display = "block";
            currentView = 'overlay';
            overlayFocusIndex = 0;

            if (overlayChannels.length > 0) {
                setOverlayFocus(0);
            }

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
        
        setTimeout(() => {
            const firstHeader = document.querySelector('.category-header');
            if (firstHeader) {
                setFocusElement(firstHeader);
            }
        }, 100);
    }

    function setOverlayFocus(index) {
        if (!overlayChannels.length) return;
        
        overlayChannels.forEach(item => {
            item.classList.remove("focused");
            item.style.borderColor = "#444";
            item.style.background = "#2a2a2a";
        });

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

    // ========== CACHE SYSTEM ==========

    function cachePlaylist(key, data) {
        cache.playlists.set(key, data);
        cache.lastAccessed.set(key, Date.now());
        
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

    // ========== REMOTE PLAYLISTS ==========

    function showRemotePlaylistSelector() {
        hideAllSelectors();
        remotePlaylistSelector.style.display = "block";
        updateRemotePlaylistList();
        currentView = 'remote';
        
        setTimeout(() => focusFirstRemotePlaylist(), 100);
    }

    function updateRemotePlaylistList() {
        try {
            const fragment = document.createDocumentFragment();
            
            const allHeader = document.createElement("li");
            allHeader.className = "category-header";
            allHeader.setAttribute("tabindex", "0");
            allHeader.setAttribute("role", "button");
            allHeader.setAttribute("aria-expanded", "false");
            allHeader.dataset.group = "Todos os Canais";
            allHeader.innerHTML = `<strong class="cat-label">📺 Todos os Canais (${playlistUrls.length})</strong>`;
            allHeader.style.cssText = "color: #ffeb3b; padding: 15px 10px; border-bottom: 2px solid #333; cursor: pointer; background: linear-gradient(45deg, #333, #555); border-radius: 5px; margin-bottom: 5px;";
            allHeader.onclick = () => showCategoryOverlay("Todos os Canais", playlistUrls);
            if (playlistUrls.length > 0) {
                fragment.appendChild(allHeader);
            }
        
            const categories = [...new Set(remotePlaylistsConfig.map(p => p.category))];
            
            categories.forEach(category => {
                const categoryHeader = document.createElement("li");
                categoryHeader.innerHTML = `<strong>📂 ${category}</strong>`;
                categoryHeader.className = "category-header-remote";
                categoryHeader.style.cssText = "color: #6bff6b; padding: 10px 0 5px 0; border-bottom: 1px solid #333;";
                fragment.appendChild(categoryHeader);
                
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

    async function loadRemotePlaylist(url, name) {
        try {
            if (!isValidUrl(url)) {
                throw new Error('URL da playlist inválida');
            }

            const cached = getCachedPlaylist(url);
            if (cached) {
                console.log('📦 Usando playlist em cache:', name);
                playlistUrls = cached;
                playlistUrls.forEach((c, i) => c.tempId = i);
                currentPlaylist.urls = playlistUrls;
                currentPlaylist.name = name;
                currentPlaylist.type = 'remote';
                updateChannelList();
                hideAllSelectors();
                focusChannel();
                showMessage(`✅ ${name} carregada do cache com ${playlistUrls.length} canais`, 'success');
                return;
            }

            showMessage(`🔄 Carregando ${name}...`, 'loading');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
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
            
            cachePlaylist(url, parsedPlaylist);
            
            playlistUrls = parsedPlaylist;
            playlistUrls.forEach((c, i) => c.tempId = i);
            currentPlaylist.urls = playlistUrls;
            currentPlaylist.name = name;
            currentPlaylist.type = 'remote';
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

    // ========== LOCAL PLAYLISTS ==========

    async function detectAvailablePlaylists() {
        showMessage("🔍 Verificando playlists disponíveis...", 'loading');
        
        try {
            const promises = availablePlaylists.map(async playlist => {
                try {
                    const response = await fetch(`playlists/${playlist.filename}`, { 
                        method: 'HEAD',
                        cache: 'no-cache',
                        signal: AbortSignal.timeout(5000)
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
            
            if (playlistUrls.length > 0) {
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
            }
            
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
                currentPlaylist.urls = playlistUrls;
                currentPlaylist.name = filename;
                currentPlaylist.type = 'local';
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
            
            cachePlaylist(cacheKey, parsedPlaylist);
            
            playlistUrls = parsedPlaylist;
            playlistUrls.forEach((c, i) => c.tempId = i);
            currentPlaylist.urls = playlistUrls;
            currentPlaylist.name = filename;
            currentPlaylist.type = 'local';
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

            const cached = getCachedPlaylist(trimmedUrl);
            if (cached) {
                console.log('📦 Usando playlist de URL em cache');
                playlistUrls = cached;
                playlistUrls.forEach((c, i) => c.tempId = i);
                currentPlaylist.urls = playlistUrls;
                currentPlaylist.name = `URL: ${trimmedUrl}`;
                currentPlaylist.type = 'url';
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
            
            cachePlaylist(trimmedUrl, parsedPlaylist);
            
            playlistUrls = parsedPlaylist;
            playlistUrls.forEach((c, i) => c.tempId = i);
            currentPlaylist.urls = playlistUrls;
            currentPlaylist.name = `URL: ${trimmedUrl}`;
            currentPlaylist.type = 'url';
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
            currentPlaylist.urls = playlistUrls;
            currentPlaylist.name = "Canal Único";
            currentPlaylist.type = 'single';
            updateChannelList();
            hideAllSelectors();
            focusChannel();
            showMessage("✅ Canal único carregado", 'success');
            
        } catch (error) {
            handleError(error, 'Canal único');
        }
    }

    // ========== PLAYLIST PARSER ==========

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
                    const groupMatch = line.match(/group-title="([^"]+)"/i);
                    currentGroup = groupMatch ? groupMatch[1].trim() : "Outros";
                    
                    const commaIndex = line.lastIndexOf(",");
                    if (commaIndex !== -1) {
                        currentName = line.substring(commaIndex + 1).trim();
                    }
                    
                    if (!currentName && i + 1 < lines.length && !lines[i + 1].startsWith("http")) {
                        currentName = lines[i + 1];
                        i++;
                    }
                    
                    if (!currentName) {
                        currentName = "Canal Desconhecido";
                    }
                } else if (line.startsWith("http")) {
                    if (isValidUrl(line)) {
                        parsed.push({
                            url: line,
                            name: currentName || "Canal Desconhecido",
                            group: currentGroup || "Outros"
                        });
                    }
                    
                    currentName = "";
                    currentGroup = "Outros";
                }
            }

            console.log(`📋 Playlist parseada: ${parsed.length} canais encontrados`);
            parsed.forEach((c, i) => c.tempId = i);
            return parsed;
            
        } catch (error) {
            handleError(error, 'Parser de playlist');
            return [];
        }
    }

    // ========== CHANNEL LIST UPDATE ==========

    function updateChannelList() {
        try {
            const fragment = document.createDocumentFragment();
            
            if (currentPlaylist.name) {
                const playlistHeader = document.createElement("li");
                playlistHeader.textContent = `📂 Playlist: ${currentPlaylist.name}`;
                playlistHeader.style.cssText = "color: #00e676; padding: 15px 10px; font-weight: bold; font-size: 1.1em;";
                fragment.appendChild(playlistHeader);
            }

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

            const grouped = {};
            playlistUrls.forEach(channel => {
                const group = channel.group || "Outros";
                if (!grouped[group]) grouped[group] = [];
                grouped[group].push(channel);
            });

            const sortedGroups = Object.keys(grouped).sort();

            sortedGroups.forEach(group => {
                const header = document.createElement("li");
                header.className = "category-header";
                header.setAttribute("tabindex", "0");
                header.setAttribute("role", "button");
                header.setAttribute("aria-expanded", "false");
                header.dataset.group = group;
                header.innerHTML = `<strong class="cat-label">📺 ${group} (${grouped[group].length} canais)</strong>`;
                header.style.cssText = "color: #6bff6b; padding: 15px 10px; border-bottom: 2px solid #333; cursor: pointer; background: linear-gradient(45deg, #1a1a1a, #2a2a2a); border-radius: 5px; margin-bottom: 5px;";

                header.onclick = () => showCategoryOverlay(group, grouped[group]);

                fragment.appendChild(header);
            });

            channelList.innerHTML = "";
            channelList.appendChild(fragment);

            channelItems = Array.from(document.querySelectorAll(".category-header"));
            currentView = 'channels';

            if (!restoringState) {
                requestAnimationFrame(() => {
                    const firstElement = channelItems[0];
                    if (firstElement) setFocusElement(firstElement);
                });
            }

            debugFocus('updateChannelList');
            
        } catch (error) {
            handleError(error, 'Atualização da lista de canais');
        }
    }

    // ========== FOCUS FUNCTIONS ==========

    const debouncedFocusChannel = debounce((index = 0) => {
        if (!channelItems.length) {
            channelItems = Array.from(document.querySelectorAll(".category-header"));
        }
        
        if (!channelItems.length) return;
        
        try {
            let targetIndex = Math.max(0, Math.min(index, channelItems.length - 1));
            
            currentFocusIndex = targetIndex;
            currentView = 'channels';
            
            setFocusElement(channelItems[currentFocusIndex]);
            
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

    // ========== NAVIGATION ==========

    const debouncedMoveFocus = debounce((delta) => {
        if (currentView === 'overlay') {
            moveOverlayFocus(delta);
            return;
        }
        
        if (currentView === 'channels') {
            channelItems = Array.from(document.querySelectorAll(".category-header"));
            
            if (!channelItems.length) return;

            const focused = document.querySelector('.focused') || document.activeElement;
            let currentIndex = channelItems.indexOf(focused);
            
            if (currentIndex === -1) {
                currentIndex = 0;
            }

            const newIndex = (currentIndex + delta + channelItems.length) % channelItems.length;
            
            setFocusElement(channelItems[newIndex]);
            return;
        }

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

    // ========== KEYBOARD CONTROLS ==========

    function setupKeyboardControls() {
        document.addEventListener("keydown", (e) => {
            console.log(`Tecla pressionada: ${e.key}, View atual: ${currentView}`);
            
            if (currentView === 'player') {
                return;
            }

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
                    moveOverlayFocus(4);
                    return;
                }
                else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    moveOverlayFocus(-4);
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

    // ========== EVENT LISTENERS ==========

    function setupEventListeners() {
        document.getElementById("btnHome").addEventListener("click", () => {
            if (confirm("Voltar para a página inicial?")) {
                location.href = "index.html";
            }
        });
        
        document.getElementById("btnLoadPlaylist").addEventListener("click", showRemotePlaylistSelector);
        document.getElementById("btnLocal").addEventListener("click", showPlaylistSelector);
        document.getElementById("btnUrl").addEventListener("click", loadFromUrl);
        document.getElementById("btnSingle").addEventListener("click", loadSingleChannel);
        
        document.getElementById("btnBackFromRemote").addEventListener("click", backToButtons);
        document.getElementById("btnBackFromLocal").addEventListener("click", backToButtons);
    }

    // ========== INITIALIZATION ==========

    function initialize() {
        try {
            console.log("🚀 M3U8 Player inicializado (sem localStorage + Player Overlay integrado)");
            
            setupKeyboardControls();
            setupEventListeners();
            
            const buttons = document.querySelectorAll(".navigable");
            if (buttons.length) {
                buttons[focusIndex].focus();
            }
            
            playlistUrls = [];
            currentPlaylist.currentIndex = -1;
            channelItems = [];
            updateChannelList();
            showMessage("💡 Selecione uma opção acima para começar", 'success');
            console.log("🔄 Inicialização limpa - nenhuma playlist pré-carregada");
            
            debugFocus('Inicialização');
            
        } catch (error) {
            handleError(error, 'Inicialização');
        }
    }

    initialize();
});currentIndex = channelIndex;
            } else {
                currentPlaylist.currentIndex = playlistUrls.findIndex(ch => ch.url === url);
            }
            
            currentPlaylist.
