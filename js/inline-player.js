// inline-player.js – Versão 4.0 - COMUNICAÇÃO BIDIRECIONAL COMPLETA

const InlinePlayerModule = {

    overlay: null,
    iframe: null,
    currentPlaylist: [],
    currentIndex: 0,
    isPlayerReady: false,
    
    // Estado da tela antes de abrir player
    previousView: null,
    previousCategory: null,

    init() {
        console.log("🎬 InlinePlayerModule v4.0 inicializado");
        this.createOverlay();
        this.setupMessageListener();
    },

    // ============================================================
    // CRIAR OVERLAY + IFRAME
    // ============================================================
    createOverlay() {
        if (document.getElementById("inlinePlayerOverlay")) {
            console.log("⚠️ Overlay já existe, reutilizando");
            this.overlay = document.getElementById("inlinePlayerOverlay");
            this.iframe = document.getElementById("inlinePlayerFrame");
            return;
        }

        const overlay = document.createElement("div");
        overlay.id = "inlinePlayerOverlay";
        overlay.style.cssText = `
            display: none;
            position: fixed;
            inset: 0;
            background: black;
            z-index: 9999;
        `;

        const iframe = document.createElement("iframe");
        iframe.id = "inlinePlayerFrame";
        iframe.allow = "autoplay; fullscreen";
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            background: black;
        `;

        overlay.appendChild(iframe);
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.iframe = iframe;

        console.log("✅ Overlay + iframe criados");
    },

    // ============================================================
    // ABRIR PLAYER
    // ============================================================
    open(url, name, index) {
        console.log("╔═══════════════════════════════════════╗");
        console.log("📺 InlinePlayerModule.open()");
        console.log("   URL:", url);
        console.log("   Nome:", name);
        console.log("   Índice:", index);
        console.log("╚═══════════════════════════════════════╝");

        // 💾 Salvar estado atual
        this.previousView = AppState.currentView;
        this.previousCategory = AppState.currentCategory;
        
        console.log("💾 Estado salvo:");
        console.log("   View anterior:", this.previousView);
        console.log("   Categoria anterior:", this.previousCategory);

        // 🔥 CRÍTICO: Copiar playlist do AppState
        this.currentPlaylist = AppState.currentPlaylist || [];
        this.currentIndex = index;
        this.isPlayerReady = false;

        console.log("📋 Playlist copiada:", this.currentPlaylist.length, "canais");

        // Salvar contexto completo no StateManager
        this.savePlayerContext(url, name, index);

        // Construir URL do player
        const iframeURL = `player.html?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}&index=${index}`;

        console.log("🔗 URL do iframe:", iframeURL);

        // Carregar player
        this.iframe.src = iframeURL;
        this.overlay.style.display = "block";

        console.log("⏳ Aguardando player ficar pronto...");

        // Aguardar carregamento do iframe e enviar playlist
        this.iframe.onload = () => {
            console.log("✅ Iframe carregado");
            setTimeout(() => {
                this.sendPlaylistToPlayer();
            }, 500);
        };

        console.log("▶ Player overlay aberto");
    },

    // ============================================================
    // 💾 SALVAR CONTEXTO COMPLETO
    // ============================================================
    savePlayerContext(url, name, index) {
        try {
            console.log("💾 Salvando contexto do player...");
            
            // Salvar no StateManager
            if (typeof StateManager !== 'undefined') {
                StateManager.savePlayerState(
                    url,
                    name,
                    index,
                    AppState.currentPlaylistName
                );
                
                StateManager.savePlaylistContext(
                    AppState.currentPlaylistName,
                    AppState.currentPlaylistType,
                    AppState.currentCategory
                );
            }

            console.log("✅ Contexto salvo");

        } catch (e) {
            console.error("❌ Erro ao salvar contexto:", e);
        }
    },

    // ============================================================
    // 📤 ENVIAR PLAYLIST PARA O PLAYER
    // ============================================================
    sendPlaylistToPlayer() {
        if (!this.iframe || !this.iframe.contentWindow) {
            console.warn("⚠️ Iframe não disponível");
            return;
        }

        try {
            console.log("╔═══════════════════════════════════════╗");
            console.log("📤 Enviando playlist para player");
            console.log("   Total de canais:", this.currentPlaylist.length);
            console.log("   Índice atual:", this.currentIndex);
            console.log("╚═══════════════════════════════════════╝");

            const message = {
                type: "playlist-data",
                playlist: this.currentPlaylist,
                currentIndex: this.currentIndex
            };

            this.iframe.contentWindow.postMessage(message, "*");
            console.log("✅ Playlist enviada");

        } catch (e) {
            console.error("❌ Erro ao enviar playlist:", e);
        }
    },

    // ============================================================
    // 📨 RECEBER MENSAGENS DO PLAYER
    // ============================================================
    setupMessageListener() {
        window.addEventListener("message", (event) => {
            const msg = event.data;

            if (!msg || !msg.type) return;

            console.log("╔═══════════════════════════════════════╗");
            console.log("📨 Mensagem recebida do player:", msg.type);
            console.log("╚═══════════════════════════════════════╝");

            switch (msg.type) {
                case "request-playlist":
                    console.log("📋 Player solicitou playlist");
                    this.sendPlaylistToPlayer();
                    break;

                case "switch-channel":
                    console.log("🔄 Player solicitou troca de canal, delta:", msg.delta);
                    this.handleChannelSwitch(msg.delta);
                    break;

                case "close":
                    console.log("❌ Player solicitou fechamento");
                    this.close();
                    break;

                default:
                    console.log("ℹ️ Mensagem desconhecida:", msg.type);
            }
        });

        console.log("📡 Listener de mensagens configurado");
    },

    // ============================================================
    // 🔄 TROCAR CANAL (NAVEGAÇÃO UP/DOWN)
    // ============================================================
    handleChannelSwitch(delta) {
        console.log("╔═══════════════════════════════════════╗");
        console.log("🔄 InlinePlayerModule.handleChannelSwitch()");
        console.log("   Delta:", delta);
        console.log("   Índice atual:", this.currentIndex);
        console.log("   Playlist length:", this.currentPlaylist.length);
        console.log("╚═══════════════════════════════════════╝");

        if (!this.currentPlaylist || this.currentPlaylist.length === 0) {
            console.warn("⚠️ Playlist vazia, não pode trocar canal");
            return;
        }

        // Calcular novo índice (circular)
        const newIndex = (this.currentIndex + delta + this.currentPlaylist.length) % this.currentPlaylist.length;
        const newChannel = this.currentPlaylist[newIndex];

        console.log("📺 Novo canal:");
        console.log("   Índice:", newIndex);
        console.log("   Nome:", newChannel.name);
        console.log("   URL:", newChannel.url);

        // Atualizar índice local
        this.currentIndex = newIndex;

        // Enviar comando para o player trocar de canal
        this.sendPlayCommand(newChannel.url, newChannel.name, newIndex);

        console.log("✅ Comando de troca enviado");
    },

    // ============================================================
    // ▶️ ENVIAR COMANDO PARA TOCAR CANAL
    // ============================================================
    sendPlayCommand(url, name, index) {
        if (!this.iframe || !this.iframe.contentWindow) {
            console.warn("⚠️ Iframe não disponível");
            return;
        }

        try {
            console.log("╔═══════════════════════════════════════╗");
            console.log("▶️ Enviando comando play-channel");
            console.log("   URL:", url);
            console.log("   Nome:", name);
            console.log("   Índice:", index);
            console.log("╚═══════════════════════════════════════╝");

            const message = {
                type: "play-channel",
                url: url,
                name: name,
                index: index
            };

            this.iframe.contentWindow.postMessage(message, "*");
            console.log("✅ Comando enviado");

        } catch (e) {
            console.error("❌ Erro ao enviar comando:", e);
        }
    },

    // ============================================================
    // ❌ FECHAR PLAYER (RESTAURAR OVERLAY)
    // ============================================================
    close() {
        console.log("╔═══════════════════════════════════════╗");
        console.log("❌ InlinePlayerModule.close()");
        console.log("╚═══════════════════════════════════════╝");

        // Fechar overlay do player
        this.overlay.style.display = "none";
        
        // Limpar iframe (para de tocar)
        this.iframe.src = "about:blank";
        
        this.isPlayerReady = false;

        // 🔔 Apenas notificar que o player fechou
        window.dispatchEvent(new CustomEvent("player-closed"));

        console.log("✅ Player fechado (evento disparado)");
    },

    // ============================================================
    // 📺 REABRIR OVERLAY DA CATEGORIA
    // ============================================================
    reopenCategoryOverlay() {
        console.log("╔═══════════════════════════════════════╗");
        console.log("📺 Reabrindo overlay da categoria");
        console.log("   Categoria:", this.previousCategory);
        console.log("╚═══════════════════════════════════════╝");
        
        if (typeof ChannelModule === 'undefined') {
            console.error("❌ ChannelModule não disponível");
            return;
        }

        // Se a playlist ainda está no AppState, usar ela
        if (!AppState.currentPlaylist || AppState.currentPlaylist.length === 0) {
            console.warn("⚠️ Playlist vazia, voltando para lista principal");
            this.restoreToChannelsList();
            return;
        }

        // Agrupar por categoria
        const grouped = ChannelModule.groupByCategory(AppState.currentPlaylist);
        
        let categoryChannels;
        if (this.previousCategory === 'Todos os Canais') {
            categoryChannels = AppState.currentPlaylist;
        } else {
            categoryChannels = grouped[this.previousCategory] || [];
        }

        if (categoryChannels.length === 0) {
            console.warn("⚠️ Categoria vazia, voltando para lista principal");
            this.restoreToChannelsList();
            return;
        }

        console.log("✅ Reabrindo categoria com", categoryChannels.length, "canais");

        // Reabrir overlay
        ChannelModule.showCategoryOverlay(this.previousCategory, categoryChannels);

        // Focar no canal que estava assistindo
        setTimeout(() => {
            const currentChannel = AppState.currentPlaylist[this.currentIndex];
            if (currentChannel) {
                const channelIndex = categoryChannels.findIndex(ch => 
                    ch.url === currentChannel.url
                );

                if (channelIndex >= 0) {
                    console.log("🎯 Focando no canal:", channelIndex);
                    ChannelModule.setOverlayFocus(channelIndex);
                }
            }
        }, 200);
    },

    // ============================================================
    // 📋 RESTAURAR LISTA DE CANAIS
    // ============================================================
    restoreToChannelsList() {
        console.log("📋 Restaurando lista de canais...");
        
        AppState.currentView = 'channels';
        
        // Atualizar lista de canais
        if (typeof ChannelModule !== 'undefined' && ChannelModule.updateChannelList) {
            ChannelModule.updateChannelList();
        }
        
        // Focar na primeira categoria
        setTimeout(() => {
            const firstCategory = document.querySelector('.category-header');
            if (firstCategory) {
                firstCategory.focus();
                firstCategory.classList.add('focused');
            }
        }, 200);
    },

    // ============================================================
    // UTILITÁRIOS
    // ============================================================
    isOpen() {
        return this.overlay && this.overlay.style.display !== "none";
    },

    getCurrentChannel() {
        if (!this.currentPlaylist || this.currentIndex < 0) return null;
        return this.currentPlaylist[this.currentIndex];
    },

    // 📊 DEBUG
    debug() {
        console.log("╔═══════════════════════════════════════╗");
        console.log("🔍 InlinePlayerModule DEBUG");
        console.log("╚═══════════════════════════════════════╝");
        console.log("isPlayerReady:", this.isPlayerReady);
        console.log("currentIndex:", this.currentIndex);
        console.log("currentPlaylist.length:", this.currentPlaylist.length);
        console.log("previousView:", this.previousView);
        console.log("previousCategory:", this.previousCategory);
        console.log("╚═══════════════════════════════════════╝");
    }
};

// Auto-init
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => InlinePlayerModule.init());
} else {
    InlinePlayerModule.init();
}

// Atalho para debug
window.debugPlayer = () => InlinePlayerModule.debug();

console.log("✅ InlinePlayerModule v4.0 carregado (COMUNICAÇÃO BIDIRECIONAL COMPLETA)");
