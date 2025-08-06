 // Sistema Universal de Teclas para Smart TVs (Integrado)
        class UniversalTVKeys {
            constructor() {
                this.platform = this.detectPlatform();
                this.keys = this.getKeysForPlatform();
                this.setupEventListeners();
                console.log(`🔧 Plataforma detectada: ${this.platform}`);
            }

            detectPlatform() {
                const userAgent = navigator.userAgent.toLowerCase();
                
                if (typeof tizen !== 'undefined') return 'tizen';
                if (typeof webOS !== 'undefined') return 'webos';
                if (userAgent.includes('googletv') || userAgent.includes('android tv')) return 'androidtv';
                if (userAgent.includes('roku')) return 'roku';
                if (userAgent.includes('silk') && userAgent.includes('tv')) return 'firetv';
                if (userAgent.includes('hbbtv')) return 'hbbtv';
                
                return 'browser';
            }

            getKeysForPlatform() {
                const baseKeys = {
                    LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40,
                    ENTER: 13, RETURN: 8, EXIT: 27, SPACE: 32,
                    HOME: 36, END: 35, PAGE_UP: 33, PAGE_DOWN: 34
                };

                const platformSpecific = {
                    tizen: {
                        RED: 403, GREEN: 404, YELLOW: 405, BLUE: 406,
                        PLAY: 415, PAUSE: 19, STOP: 413,
                        REWIND: 412, FAST_FORWARD: 417, MENU: 18,
                        VOLUME_UP: 447, VOLUME_DOWN: 448, MUTE: 449,
                        CHANNEL_UP: 427, CHANNEL_DOWN: 428
                    },
                    webos: {
                        RED: 403, GREEN: 404, YELLOW: 405, BLUE: 406,
                        PLAY: 415, PAUSE: 19, STOP: 413,
                        REWIND: 412, FAST_FORWARD: 417, MENU: 18,
                        VOLUME_UP: 447, VOLUME_DOWN: 448, MUTE: 449
                    },
                    androidtv: {
                        RED: 183, GREEN: 184, YELLOW: 185, BLUE: 186,
                        PLAY: 126, PAUSE: 127, STOP: 86,
                        REWIND: 89, FAST_FORWARD: 90, MENU: 82,
                        VOLUME_UP: 24, VOLUME_DOWN: 25, MUTE: 164
                    },
                    browser: {}
                };

                return { ...baseKeys, ...(platformSpecific[this.platform] || {}) };
            }

            setupEventListeners() {
                document.addEventListener('keydown', (e) => this.handleKeyPress(e));
                
                if (this.platform === 'tizen') {
                    try {
                        document.addEventListener('tizenhwkey', (e) => {
                            console.log('Tizen hardware key:', e.keyName);
                            this.handleTizenHardwareKey(e);
                        });
                    } catch (e) {
                        console.log('Tizen listeners não disponíveis');
                    }
                }
            }

            handleKeyPress(e) {
                const keyCode = e.keyCode || e.which;
                const keyName = this.getKeyName(keyCode);
                
                if (keyName) {
                    console.log(`[${this.platform}] Tecla: ${keyName} (${keyCode})`);
                    this.onKeyPressed(keyName, keyCode, e);
                }
            }

            handleTizenHardwareKey(e) {
                switch(e.keyName) {
                    case 'back':
                        this.onBackPressed();
                        break;
                    case 'menu':
                        this.onMenuPressed();
                        break;
                }
            }

            getKeyName(keyCode) {
                for (const [name, code] of Object.entries(this.keys)) {
                    if (code === keyCode) return name;
                }
                return null;
            }

            onKeyPressed(keyName, keyCode, event) {
                // Override este método
            }

            onBackPressed() {
                // Override este método
            }

            onMenuPressed() {
                // Override este método
            }

            getPlatformInfo() {
                return {
                    platform: this.platform,
                    hasColorKeys: ['RED', 'GREEN', 'YELLOW', 'BLUE'].every(key => this.keys.hasOwnProperty(key)),
                    hasMediaKeys: ['PLAY', 'PAUSE', 'STOP'].every(key => this.keys.hasOwnProperty(key)),
                    availableKeys: Object.keys(this.keys)
                };
            }
        }

        // Aplicação Principal
        class SmartTVApp {
            constructor() {
                this.tvKeys = new UniversalTVKeys();
                this.currentFocusIndex = 0;
                this.focusableElements = [];
                this.navigationMode = 'main';
                this.currentSiteUrl = '';
                this.currentSiteTitle = '';
                this.isFullscreen = false;
                
                // Lista de canais fixos
                this.FIXED_CHANNELS = [
                    { name: "Warner", url: "https://embedtv-2.icu/warnerchannel" },
                    { name: "Warner²", url: "https://embedcanaistv.com/warner" },
                    { name: "Warner³", url: "https://embedflix.top/tv/player.php?id=warner-channel" },
                    { name: "TNT", url: "https://embedflix.top/tv/player.php?id=tnt" },
                    { name: "Fox", url: "https://embedflix.top/tv/player.php?id=fox" },
                    { name: "ESPN", url: "https://embedflix.top/tv/player.php?id=espn" },
                    { name: "ESPN", url: "https://www.embedtv.net/embed/espn" },
                    { name: "ESPN2", url: "https://embedflix.top/tv/player.php?id=espn-2" },
                    { name: "ESPN3", url: "https://embedflix.top/tv/player.php?id=espn-3" },
                    { name: "ESPN4", url: "https://embedflix.top/tv/player.php?id=espn-4" },
                    { name: "ESPN4²", url: "https://sporturbo.com/player/multi/espn4sd" },
                    { name: "SporTV", url: "https://embedflix.top/tv/player.php?id=sportv" },
                    { name: "SporALT", url: "https://reidoscanais.pro/embed/?id=sportvalternativo" },
                    { name: "SporTV2", url: "https://embedflix.top/tv/player.php?id=sportv-2" },
                    { name: "SporTV3", url: "https://embedflix.top/tv/player.php?id=sportv-3" },
                    { name: "Fox Sports", url: "https://embedflix.top/tv/player.php?id=fox-sports" },
                    { name: "Fox Sports 2", url: "https://embedflix.top/tv/player.php?id=fox-sports-2" },
                    { name: "Premiere", url: "https://embedflix.top/tv/player.php?id=premiere" },
                    { name: "Premiere2", url: "https://embedflix.top/tv/player.php?id=premiere-2" },
                    { name: "Premiere3", url: "https://embedflix.top/tv/player.php?id=premiere-3" },
                    { name: "Premiere4", url: "https://embedflix.top/tv/player.php?id=premiere-4" },
                    { name: "Premiere5", url: "https://embedflix.top/tv/player.php?id=premiere-5" },
                    { name: "Premiere6", url: "https://embedflix.top/tv/player.php?id=premiere-6" },
                    { name: "Prime Video", url: "https://embedflix.top/tv/player.php?id=prime-video-1" },
                    { name: "Prime Video 2", url: "https://embedflix.top/tv/player.php?id=prime-video-2" },
                    { name: "Prime Video 3", url: "https://embedflix.top/tv/player.php?id=prime-video-3" },
                    { name: "Premiere6", url: "https://embedflix.top/tv/player.php?id=premiere-6" },
                    { name: "Premiere6", url: "https://embedflix.top/tv/player.php?id=premiere-6" },
                    { name: "Band Sports", url: "https://embedflix.top/tv/player.php?id=band-sports" },
                    { name: "Combat", url: "https://embedflix.top/tv/player.php?id=combate" },
                    { name: "Space", url: "https://embedflix.top/tv/player.php?id=space" },
                    { name: "Universal", url: "https://embedflix.top/tv/player.php?id=universal-channel" },
                    { name: "FX", url: "https://embedflix.top/tv/player.php?id=fx" },
                    { name: "Paramount", url: "https://embedflix.top/tv/player.php?id=paramount-1" }
                ];
                
                this.setupKeyHandlers();
                this.initialize();
            }

            setupKeyHandlers() {
                this.tvKeys.onKeyPressed = (keyName, keyCode, event) => {
                    this.handleKeyNavigation(keyName, keyCode, event);
                };
                
                this.tvKeys.onBackPressed = () => {
                    this.handleBackNavigation();
                };
                
                this.tvKeys.onMenuPressed = () => {
                    this.showContextMenu();
                };
            }

            initialize() {
                this.showStatus('🚀 Player M3U8 Smart inicializado!');
                console.log('Plataforma:', this.tvKeys.getPlatformInfo());
                
                setTimeout(() => {
                    this.updateFocusableElements();
                    if (this.focusableElements.length > 0) {
                        this.focusElement(0);
                    }
                    this.showColorKeyHelp();
                }, 500);
            }

            handleKeyNavigation(keyName, keyCode, event) {
                event.preventDefault();
                
                switch(keyName) {
                    case 'UP':
                        this.navigateUp();
                        break;
                    case 'DOWN':
                        this.navigateDown();
                        break;
                    case 'LEFT':
                        this.navigateLeft();
                        break;
                    case 'RIGHT':
                        this.navigateRight();
                        break;
                    case 'ENTER':
                        this.activateCurrentElement();
                        break;
                    case 'RETURN':
                    case 'EXIT':
                        this.handleBackNavigation();
                        break;
                    case 'RED':
                        this.handleRedButton();
                        break;
                    case 'GREEN':
                        this.handleGreenButton();
                        break;
                    case 'YELLOW':
                        this.handleYellowButton();
                        break;
                    case 'BLUE':
                        this.handleBlueButton();
                        break;
                    case 'MENU':
                        this.showContextMenu();
                        break;
                }
            }

            updateFocusableElements() {
                // Remove foco anterior
                this.focusableElements.forEach(el => el.classList.remove('focused'));
                
                // Encontra elementos focáveis visíveis
                this.focusableElements = Array.from(document.querySelectorAll('.focusable:not([disabled])'))
                    .filter(el => {
                        const rect = el.getBoundingClientRect();
                        const style = window.getComputedStyle(el);
                        return rect.width > 0 && rect.height > 0 && 
                               style.visibility !== 'hidden' && 
                               style.display !== 'none' &&
                               el.offsetParent !== null;
                    });
                
                // Ajusta índice se necessário
                if (this.currentFocusIndex >= this.focusableElements.length) {
                    this.currentFocusIndex = 0;
                }
                
                console.log(`🎯 ${this.focusableElements.length} elementos focáveis encontrados`);
            }

            navigateUp() {
                if (this.focusableElements.length === 0) return;
                
                const currentElement = this.focusableElements[this.currentFocusIndex];
                if (!currentElement) return;
                
                const currentRect = currentElement.getBoundingClientRect();
                let bestMatch = null;
                let minDistance = Infinity;
                
                // Busca o elemento mais próximo acima
                this.focusableElements.forEach((el, index) => {
                    if (index === this.currentFocusIndex) return;
                    
                    const rect = el.getBoundingClientRect();
                    if (rect.bottom <= currentRect.top) { // Elemento está acima
                        const distance = Math.sqrt(
                            Math.pow(rect.left + rect.width/2 - (currentRect.left + currentRect.width/2), 2) + 
                            Math.pow(rect.bottom - currentRect.top, 2)
                        );
                        
                        if (distance < minDistance) {
                            minDistance = distance;
                            bestMatch = index;
                        }
                    }
                });
                
                // Se não encontrou, vai para o último
                if (bestMatch === null) {
                    bestMatch = this.focusableElements.length - 1;
                }
                
                this.focusElement(bestMatch);
            }

            navigateDown() {
                if (this.focusableElements.length === 0) return;
                
                const currentElement = this.focusableElements[this.currentFocusIndex];
                if (!currentElement) return;
                
                const currentRect = currentElement.getBoundingClientRect();
                let bestMatch = null;
                let minDistance = Infinity;
                
                // Busca o elemento mais próximo abaixo
                this.focusableElements.forEach((el, index) => {
                    if (index === this.currentFocusIndex) return;
                    
                    const rect = el.getBoundingClientRect();
                    if (rect.top >= currentRect.bottom) { // Elemento está abaixo
                        const distance = Math.sqrt(
                            Math.pow(rect.left + rect.width/2 - (currentRect.left + currentRect.width/2), 2) + 
                            Math.pow(rect.top - currentRect.bottom, 2)
                        );
                        
                        if (distance < minDistance) {
                            minDistance = distance;
                            bestMatch = index;
                        }
                    }
                });
                
                // Se não encontrou, vai para o primeiro
                if (bestMatch === null) {
                    bestMatch = 0;
                }
                
                this.focusElement(bestMatch);
            }

            navigateLeft() {
                if (this.focusableElements.length === 0) return;
                
                const currentElement = this.focusableElements[this.currentFocusIndex];
                if (!currentElement) return;
                
                const currentRect = currentElement.getBoundingClientRect();
                let bestMatch = null;
                let minDistance = Infinity;
                
                // Busca o elemento mais próximo à esquerda
                this.focusableElements.forEach((el, index) => {
                    if (index === this.currentFocusIndex) return;
                    
                    const rect = el.getBoundingClientRect();
                    if (rect.right <= currentRect.left) { // Elemento está à esquerda
                        const distance = Math.sqrt(
                            Math.pow(rect.right - currentRect.left, 2) + 
                            Math.pow(rect.top + rect.height/2 - (currentRect.top + currentRect.height/2), 2)
                        );
                        
                        if (distance < minDistance) {
                            minDistance = distance;
                            bestMatch = index;
                        }
                    }
                });
                
                // Se não encontrou, vai para o anterior na mesma linha ou último
                if (bestMatch === null) {
                    bestMatch = this.currentFocusIndex > 0 ? this.currentFocusIndex - 1 : this.focusableElements.length - 1;
                }
                
                this.focusElement(bestMatch);
            }

            navigateRight() {
                if (this.focusableElements.length === 0) return;
                
                const currentElement = this.focusableElements[this.currentFocusIndex];
                if (!currentElement) return;
                
                const currentRect = currentElement.getBoundingClientRect();
                let bestMatch = null;
                let minDistance = Infinity;
                
                // Busca o elemento mais próximo à direita
                this.focusableElements.forEach((el, index) => {
                    if (index === this.currentFocusIndex) return;
                    
                    const rect = el.getBoundingClientRect();
                    if (rect.left >= currentRect.right) { // Elemento está à direita
                        const distance = Math.sqrt(
                            Math.pow(rect.left - currentRect.right, 2) + 
                            Math.pow(rect.top + rect.height/2 - (currentRect.top + currentRect.height/2), 2)
                        );
                        
                        if (distance < minDistance) {
                            minDistance = distance;
                            bestMatch = index;
                        }
                    }
                });
                
                // Se não encontrou, vai para o próximo na sequência ou primeiro
                if (bestMatch === null) {
                    bestMatch = this.currentFocusIndex < this.focusableElements.length - 1 ? this.currentFocusIndex + 1 : 0;
                }
                
                this.focusElement(bestMatch);
            }

            focusElement(index) {
                if (index >= 0 && index < this.focusableElements.length) {
                    // Remove foco anterior
                    this.focusableElements.forEach(el => el.classList.remove('focused'));
                    
                    this.currentFocusIndex = index;
                    const element = this.focusableElements[index];
                    
                    // Adiciona classe de foco
                    element.classList.add('focused');
                    element.focus();
                    
                    // Scroll suave para o elemento
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'center'
                    });
                    
                    this.playFocusSound();
                    
                    const elementText = element.textContent || element.getAttribute('data-index') || 'Elemento';
                    this.showStatus(`🎯 Focado: ${elementText.substring(0, 30)}`);
                }
            }

            activateCurrentElement() {
                const element = this.focusableElements[this.currentFocusIndex];
                if (element) {
                    // Animação de ativação
                    element.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        element.style.transform = '';
                    }, 150);
                    
                    // Ativa o elemento
                    if (element.onclick) {
                        element.onclick();
                    } else {
                        element.click();
                    }
                    
                    this.playActivateSound();
                }
            }

            handleBackNavigation() {
                console.log(`🔙 Navegação de volta - Modo: ${this.navigationMode}`);
                
                switch(this.navigationMode) {
                    case 'external':
                        this.goBackHome();
                        break;
                    case 'channels':
                        this.backToMain();
                        break;
                    case 'main':
                    default:
                        this.closeTizenApp();
                        break;
                }
            }

            // Funções para teclas coloridas
            handleRedButton() {
                if (this.navigationMode === 'external') {
                    this.reloadExternalSite();
                }
                this.showStatus('🔴 Vermelho: Recarregar');
            }

            handleGreenButton() {
                if (this.navigationMode === 'main') {
                    this.showChannelSelection();
                }
                this.showStatus('🟢 Verde: Canais');
            }

            handleYellowButton() {
                if (this.navigationMode === 'external') {
                    this.toggleFullscreenSite();
                } else if (this.navigationMode === 'main') {
                    window.location.href = 'm3u8.html';
                }
                this.showStatus('🟡 Amarelo: M3U8/Tela Cheia');
            }

            handleBlueButton() {
                if (this.navigationMode === 'external') {
                    this.goBackHome();
                } else {
                    this.refreshApp();
                }
                this.showStatus('🔵 Azul: Voltar/Atualizar');
            }

            // Funções da aplicação
            showChannelSelection() {
                this.showStatus('📺 Carregando seleção de canais...');
                this.navigationMode = 'channels';
                
                const mainContainer = document.getElementById('mainContainer');
                
                const channelContainer = document.createElement('div');
                channelContainer.className = 'channel-selection-container';
                channelContainer.innerHTML = `
                    <div class="channel-header">
                        <h2>📺 Escolha um Canal</h2>
                        <button class="control-btn focusable" data-index="0" onclick="app.backToMain()">🏠 Voltar</button>
                    </div>
                    <div class="channel-grid" id="channelGrid"></div>
                    <div style="text-align: center; margin-top: 20px; color: rgba(255,255,255,0.7);">
                        <p>🎮 Use as setas direcionais para navegar • ⭕ OK para selecionar • 🔙 Voltar para menu</p>
                    </div>
                `;
                
                mainContainer.style.display = 'none';
                document.body.appendChild(channelContainer);
                
                const grid = channelContainer.querySelector('#channelGrid');
                this.FIXED_CHANNELS.forEach((channel, index) => {
                    const button = document.createElement('button');
                    button.className = 'btn btn-channel focusable';
                    button.setAttribute('data-index', index + 1);
                    button.innerHTML = `📺 ${channel.name}`;
                    button.onclick = () => this.loadChannel(channel.url, channel.name);
                    grid.appendChild(button);
                });
                
                setTimeout(() => {
                    this.updateFocusableElements();
                    if (this.focusableElements.length > 1) {
                        this.focusElement(1);
                    }
                }, 200);
                
                this.showStatus('✅ Canais carregados! Use as setas para navegar.');
            }

            loadExternalSite(url, title) {
                this.showStatus(`📡 Carregando ${title}...`);
                this.navigationMode = 'external';
                
                this.currentSiteUrl = url;
                this.currentSiteTitle = title;
                
                const container = document.getElementById('externalSiteContainer');
                const frame = document.getElementById('externalSiteFrame');
                const titleElement = document.getElementById('externalSiteTitle');
                const loading = document.getElementById('loadingIndicator');
                const mainContainer = document.getElementById('mainContainer');
                
                loading.style.display = 'block';
                titleElement.textContent = title;
                
                mainContainer.style.display = 'none';
                container.style.display = 'flex';
                
                frame.onload = () => {
                    loading.style.display = 'none';
                    this.showStatus(`✅ ${title} carregado! 🎮 Use teclas coloridas para controlar.`);
                    
                    setTimeout(() => {
                        this.updateFocusableElements();
                        if (this.focusableElements.length > 0) {
                            this.focusElement(0);
                        }
                    }, 500);
                };
                
                frame.onerror = () => {
                    loading.style.display = 'none';
                    this.showStatus(`❌ Erro ao carregar ${title}`);
                };
                
                frame.src = url;
                frame.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
                
                setTimeout(() => {
                    if (loading.style.display !== 'none') {
                        loading.style.display = 'none';
                        this.showStatus(`⚠️ ${title} pode estar carregando lentamente`);
                    }
                }, 10000);
            }

            loadChannel(url, name) {
                this.showStatus(`📺 Carregando ${name}...`);
                this.loadExternalSite(url, `📺 ${name}`);
            }

            reloadExternalSite() {
                if (this.currentSiteUrl) {
                    this.showStatus('🔄 Recarregando site...');
                    const frame = document.getElementById('externalSiteFrame');
                    const loading = document.getElementById('loadingIndicator');
                    
                    loading.style.display = 'block';
                    frame.src = this.currentSiteUrl;
                }
            }

            toggleFullscreenSite() {
                const container = document.getElementById('externalSiteContainer');
                const header = container.querySelector('.external-site-header');
                
                if (!this.isFullscreen) {
                    header.style.display = 'none';
                    this.isFullscreen = true;
                    this.showStatus('⛶ Modo tela cheia ativado');
                } else {
                    header.style.display = 'flex';
                    this.isFullscreen = false;
                    this.showStatus('⛶ Modo tela cheia desativado');
                }
            }

            backToMain() {
                this.navigationMode = 'main';
                
                const channelContainer = document.querySelector('.channel-selection-container');
                
                if (channelContainer) channelContainer.remove();
                
                const mainContainer = document.getElementById('mainContainer');
                mainContainer.style.display = 'flex';
                
                setTimeout(() => {
                    this.updateFocusableElements();
                    if (this.focusableElements.length > 0) {
                        this.focusElement(0);
                    }
                }, 200);
                
                this.showStatus('🏠 Menu principal - Use as setas para navegar');
            }

            goBackHome() {
                this.navigationMode = 'main';
                
                const container = document.getElementById('externalSiteContainer');
                const mainContainer = document.getElementById('mainContainer');
                const frame = document.getElementById('externalSiteFrame');
                
                frame.src = 'about:blank';
                
                container.style.display = 'none';
                mainContainer.style.display = 'flex';
                
                setTimeout(() => {
                    this.updateFocusableElements();
                    if (this.focusableElements.length > 0) {
                        this.focusElement(0);
                    }
                }, 200);
                
                this.showStatus('🏠 Menu principal');
            }

            closeTizenApp() {
                this.showStatus('👋 Fechando aplicativo...');
                
                try {
                    if (typeof tizen !== 'undefined') {
                        tizen.application.getCurrentApplication().exit();
                    } else {
                        window.close();
                    }
                } catch (e) {
                    console.log('Não foi possível fechar o app:', e);
                    history.back();
                }
            }

            refreshApp() {
                this.showStatus('🔄 Atualizando aplicativo...');
                location.reload();
            }

            showContextMenu() {
                const menu = `
                    🎮 CONTROLES DISPONÍVEIS:
                    
                    🔴 Vermelho: Recarregar
                    🟢 Verde: Canais
                    🟡 Amarelo: M3U8/Tela Cheia
                    🔵 Azul: Voltar/Atualizar
                    
                    ⬅️➡️⬆️⬇️ Navegar
                    ⭕ OK/Enter: Selecionar
                    🔙 Voltar: Menu anterior
                `;
                
                this.showStatus(menu);
            }

            showStatus(message) {
                const status = document.getElementById('status');
                status.textContent = message;
                status.className = 'status show';
                
                setTimeout(() => {
                    status.className = 'status';
                }, 3000);
            }

            playFocusSound() {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.value = 800;
                    gainNode.gain.value = 0.05;
                    
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.1);
                } catch (e) {
                    // Silenciosamente falhar se áudio não estiver disponível
                }
            }

            playActivateSound() {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.value = 1200;
                    gainNode.gain.value = 0.1;
                    
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.15);
                } catch (e) {
                    // Silenciosamente falhar se áudio não estiver disponível
                }
            }

            showColorKeyHelp() {
                if (!document.querySelector('.color-key-help')) {
                    const helpDiv = document.createElement('div');
                    helpDiv.className = 'color-key-help';
                    helpDiv.innerHTML = `
                        <div class="color-key">
                            <div class="color-dot red"></div>
                            <span>Recarregar</span>
                        </div>
                        <div class="color-key">
                            <div class="color-dot green"></div>
                            <span>Canais</span>
                        </div>
                        <div class="color-key">
                            <div class="color-dot yellow"></div>
                            <span>M3U8/Tela Cheia</span>
                        </div>
                        <div class="color-key">
                            <div class="color-dot blue"></div>
                            <span>Voltar/Atualizar</span>
                        </div>
                    `;
                    document.body.appendChild(helpDiv);
                    
                    setTimeout(() => {
                        helpDiv.style.opacity = '0.3';
                    }, 10000);
                }
            }
        }

        // Funções globais para compatibilidade com onclick
        let app;

        function showChannelSelection() {
            app.showChannelSelection();
        }

        function loadExternalSite(url, title) {
            app.loadExternalSite(url, title);
        }

        function reloadExternalSite() {
            app.reloadExternalSite();
        }

        function goBackHome() {
            app.goBackHome();
        }

        function toggleFullscreenSite() {
            app.toggleFullscreenSite();
        }

        function closeTizenApp() {
            app.closeTizenApp();
        }

        function refreshApp() {
            app.refreshApp();
        }

        // Inicialização
        document.addEventListener('DOMContentLoaded', function() {
            app = new SmartTVApp();
        });

        // Gerenciamento de memória para TV
        window.addEventListener('beforeunload', function() {
            const frame = document.getElementById('externalSiteFrame');
            if (frame) {
                frame.src = 'about:blank';
            }
        });

        // Listener para mudanças de orientação
        window.addEventListener('orientationchange', function() {
            setTimeout(() => {
                if (app) {
                    app.updateFocusableElements();
                    if (app.focusableElements.length > 0 && app.currentFocusIndex >= 0) {
                        app.focusElement(app.currentFocusIndex);
                    }
                }
            }, 300);
        });

        // Observer para mudanças no DOM
        if (window.MutationObserver) {
            const observer = new MutationObserver(() => {
                if (app) {
                    setTimeout(() => app.updateFocusableElements(), 100);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class', 'disabled']
            });
        }
