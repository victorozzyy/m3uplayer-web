// player.js - Módulo do player integrado (AVPlay + HLS.js + HTML5)

const PlayerModule = {
    avplay: null,
    hls: null,
    videoElement: null,
    duration: 0,
    hideTimer: null,
    advanceTimer: null,
    advanceStart: 0,
    overlay: null,
    useNativePlayer: false,
    controlButtons: [],
    currentButtonIndex: 0,
    
    // Cria overlay do player
    createOverlay() {
        if (this.overlay) return this.overlay;
        
        this.overlay = document.createElement('div');
        this.overlay.id = 'playerOverlay';
        this.overlay.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: black;
            z-index: 10000;
        `;
        
        this.overlay.innerHTML = `
            <video id="videoPlayer" style="width: 100%; height: 100%; background: black;"></video>
            
            <div id="controls" style="
                position: fixed;
                bottom: 60px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 15px;
                background: rgba(0,0,0,0.6);
                padding: 12px 24px;
                border-radius: 12px;
                transition: opacity 0.5s ease;
            ">
                <button id="prevBtn" class="player-control" tabindex="-1" style="font-size: 18px; padding: 10px 20px; background: #222; color: white; border: 2px solid transparent; border-radius: 6px; cursor: pointer; transition: all 0.2s;">⮜ Anterior</button>
                <button id="rewBtn" class="player-control" tabindex="-1" style="font-size: 18px; padding: 10px 20px; background: #222; color: white; border: 2px solid transparent; border-radius: 6px; cursor: pointer; transition: all 0.2s;">⪪ -10s</button>
                <button id="playPauseBtn" class="player-control" tabindex="-1" style="font-size: 18px; padding: 10px 20px; background: #222; color: white; border: 2px solid transparent; border-radius: 6px; cursor: pointer; transition: all 0.2s;">▶️ Play</button>
                <button id="fwdBtn" class="player-control" tabindex="-1" style="font-size: 18px; padding: 10px 20px; background: #222; color: white; border: 2px solid transparent; border-radius: 6px; cursor: pointer; transition: all 0.2s;">⩩ +10s</button>
                <button id="nextBtn" class="player-control" tabindex="-1" style="font-size: 18px; padding: 10px 20px; background: #222; color: white; border: 2px solid transparent; border-radius: 6px; cursor: pointer; transition: all 0.2s;">⮞ Próximo</button>
                <button id="reloadBtn" class="player-control" tabindex="-1" style="font-size: 18px; padding: 10px 20px; background: #222; color: white; border: 2px solid transparent; border-radius: 6px; cursor: pointer; transition: all 0.2s;">🔄 Recarregar</button>
                <button id="closeBtn" class="player-control" tabindex="-1" style="font-size: 18px; padding: 10px 20px; background: #c00; color: white; border: 2px solid transparent; border-radius: 6px; cursor: pointer; transition: all 0.2s;">✖ Fechar</button>
            </div>
            
            <div id="progress-container" style="
                position: fixed;
                bottom: 15px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                align-items: center;
                gap: 10px;
                width: 80%;
                transition: opacity 0.5s ease;
            ">
                <span id="timeLabel" style="font-size: 14px; color: white; font-variant-numeric: tabular-nums;">00:00 / 00:00</span>
                <input type="range" id="progressBar" value="0" min="0" max="100" style="flex: 1; height: 8px;">
            </div>
            
            <div id="channelTitle" style="
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.6);
                color: #fff;
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 20px;
                transition: opacity 0.5s ease;
            "></div>
            
            <div id="clockDisplay" style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0,0,0,0.6);
                color: #fff;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 18px;
                font-family: monospace;
                transition: opacity 0.5s ease;
            "></div>
        `;
        
        document.body.appendChild(this.overlay);
        this.videoElement = this.overlay.querySelector('#videoPlayer');
        this.setupPlayerControls();
        return this.overlay;
    },
    
    // Define foco no botão especificado
    setButtonFocus(index) {
        // Remove foco de todos os botões
        this.controlButtons.forEach(btn => {
            btn.style.border = '2px solid transparent';
            btn.style.background = btn.id === 'closeBtn' ? '#c00' : '#222';
            btn.style.transform = 'scale(1)';
        });
        
        // Aplica foco no botão atual
        if (this.controlButtons[index]) {
            const btn = this.controlButtons[index];
            btn.style.border = '2px solid #00ff00';
            btn.style.background = btn.id === 'closeBtn' ? '#e00' : '#333';
            btn.style.transform = 'scale(1.05)';
            this.currentButtonIndex = index;
        }
    },
    
    // Navega entre os botões
    navigateButtons(direction) {
        const newIndex = this.currentButtonIndex + direction;
        if (newIndex >= 0 && newIndex < this.controlButtons.length) {
            this.setButtonFocus(newIndex);
        }
    },
    
    // Configura controles do player
    setupPlayerControls() {
        const controls = this.overlay.querySelector('#controls');
        const progressBar = this.overlay.querySelector('#progressBar');
        
        // Armazena referência dos botões
        this.controlButtons = Array.from(controls.querySelectorAll('.player-control'));
        
        // Botões
        this.overlay.querySelector('#playPauseBtn').onclick = () => this.togglePlayPause();
        this.overlay.querySelector('#prevBtn').onclick = () => this.switchChannel(-1);
        this.overlay.querySelector('#nextBtn').onclick = () => this.switchChannel(1);
        this.overlay.querySelector('#rewBtn').onclick = () => this.seek(-10000);
        this.overlay.querySelector('#fwdBtn').onclick = () => this.seek(10000);
        this.overlay.querySelector('#reloadBtn').onclick = () => this.reload();
        this.overlay.querySelector('#closeBtn').onclick = () => this.close();
        
        // Progress bar
        progressBar.addEventListener('input', () => {
            if (this.useNativePlayer && this.videoElement) {
                const pos = (progressBar.value / 100) * this.videoElement.duration;
                this.videoElement.currentTime = pos;
            } else if (this.duration > 0 && this.avplay) {
                const pos = (progressBar.value / 100) * this.duration;
                this.avplay.seekTo(pos);
            }
        });
        
        // Atualização de progresso para player nativo
        if (this.videoElement) {
            this.videoElement.addEventListener('timeupdate', () => {
                if (this.useNativePlayer) {
                    const progressBar = this.overlay.querySelector('#progressBar');
                    const timeLabel = this.overlay.querySelector('#timeLabel');
                    
                    if (this.videoElement.duration) {
                        progressBar.value = (this.videoElement.currentTime / this.videoElement.duration) * 100;
                        timeLabel.textContent = `${this.formatTime(this.videoElement.currentTime * 1000)} / ${this.formatTime(this.videoElement.duration * 1000)}`;
                    }
                }
            });
            
            this.videoElement.addEventListener('ended', () => {
                console.log('🔄 Vídeo terminou');
                const currentChannel = AppState.currentPlaylist[AppState.currentChannelIndex];
                if (currentChannel && /\.(mp4|mkv|avi|mov|wmv|flv)$/i.test(currentChannel.url)) {
                    console.log('▶️ Arquivo de vídeo, indo para próximo canal...');
                    this.switchChannel(1);
                }
            });
        }
        
        // Mostrar controles ao mover mouse
        this.overlay.addEventListener('mousemove', () => this.showControls());
        this.overlay.addEventListener('click', () => this.showControls());
        
        // Teclado
        document.addEventListener('keydown', (e) => {
            if (this.overlay.style.display !== 'block') return;
            
            if (e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 10009) {
                e.preventDefault();
                this.close();
            } else if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                // Executa ação do botão focado
                if (this.controlButtons[this.currentButtonIndex]) {
                    this.controlButtons[this.currentButtonIndex].click();
                } else {
                    this.togglePlayPause();
                }
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.navigateButtons(-1);
                this.showControls();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.navigateButtons(1);
                this.showControls();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.seek(-10000);
                this.showControls();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.seek(10000);
                this.showControls();
            } else if (e.keyCode === 427 || e.key === 'ChannelUp') {
                e.preventDefault();
                this.switchChannel(1);
            } else if (e.keyCode === 428 || e.key === 'ChannelDown') {
                e.preventDefault();
                this.switchChannel(-1);
            }
        });
        
        // Relógio
        setInterval(() => this.updateClock(), 1000);
        this.updateClock();
    },
    
    // Abre canal no player
    open(url, name, channelIndex) {
        if (!this.overlay) this.createOverlay();
        
        AppState.setCurrentChannel({ url, name }, channelIndex);
        AppState.resetChannelPosition();
        
        this.overlay.style.display = 'block';
        this.overlay.querySelector('#channelTitle').textContent = `📺 ${name}`;
        
        // Define foco inicial no botão Play/Pause (índice 2)
        setTimeout(() => {
            this.currentButtonIndex = 2; // Play/Pause é o 3º botão (índice 2)
            this.setButtonFocus(this.currentButtonIndex);
        }, 300);
        
        // Detectar tipo de player
        if (window.webapis && webapis.avplay) {
            console.log('🎮 Usando AVPlay (Samsung Tizen)');
            this.useNativePlayer = false;
            this.initAVPlay(url);
        } else {
            console.log('🌐 Usando HLS.js/HTML5 Video');
            this.useNativePlayer = true;
            this.initHLSPlayer(url);
        }
        
        this.showControls();
    },
    
    // Inicializa HLS.js ou HTML5 Video
    initHLSPlayer(url) {
        try {
            // Limpar player anterior
            if (this.hls) {
                this.hls.destroy();
                this.hls = null;
            }
            
            this.videoElement.pause();
            this.videoElement.src = '';
            
            if (url.includes('.m3u8')) {
                // Usar HLS.js para streams
                if (window.Hls && Hls.isSupported()) {
                    console.log('📺 Usando HLS.js');
                    this.hls = new Hls({
                        enableWorker: true,
                        lowLatencyMode: false,
                        backBufferLength: 90
                    });
                    
                    this.hls.loadSource(url);
                    this.hls.attachMedia(this.videoElement);
                    
                    this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        console.log('✅ Manifest carregado');
                        this.play();
                    });
                    
                    this.hls.on(Hls.Events.ERROR, (event, data) => {
                        console.error('❌ Erro HLS:', data);
                        if (data.fatal) {
                            switch(data.type) {
                                case Hls.ErrorTypes.NETWORK_ERROR:
                                    console.log('🔄 Tentando recuperar erro de rede...');
                                    this.hls.startLoad();
                                    break;
                                case Hls.ErrorTypes.MEDIA_ERROR:
                                    console.log('🔄 Tentando recuperar erro de mídia...');
                                    this.hls.recoverMediaError();
                                    break;
                                default:
                                    console.error('❌ Erro fatal, não pode recuperar');
                                    break;
                            }
                        }
                    });
                } else if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                    // Safari nativo
                    console.log('🍎 Usando player nativo Safari');
                    this.videoElement.src = url;
                    this.play();
                } else {
                    console.error('❌ HLS.js não suportado');
                    alert('Seu navegador não suporta reprodução HLS. Use Chrome, Edge ou Safari.');
                }
            } else {
                // MP4 ou outros formatos
                console.log('🎬 Usando HTML5 Video para MP4');
                this.videoElement.src = url;
                this.play();
            }
            
        } catch (error) {
            console.error('Erro ao inicializar player HLS:', error);
        }
    },
    
    // Inicializa AVPlay (Samsung Tizen)
    initAVPlay(url) {
        if (!window.webapis || !webapis.avplay) {
            console.warn('AVPlay não disponível');
            return;
        }
        
        try {
            if (this.avplay) {
                this.avplay.stop();
                this.avplay.close();
            }
            
            this.avplay = webapis.avplay;
            this.avplay.open(url);
            this.avplay.setDisplayRect(0, 0, 1920, 1080);
            
            this.avplay.setListener({
                onstreamcompleted: () => {
                    console.log('🔄 Stream completado');
                    if (/\.(mp4|mkv|avi|mov|wmv|flv)$/i.test(url)) {
                        this.switchChannel(1);
                    }
                },
                onerror: (err) => console.error('Erro AVPlay:', err)
            });
            
            this.avplay.prepareAsync(() => {
                this.duration = this.avplay.getDuration();
                this.play();
                this.updateProgress();
            }, err => console.error('Erro ao preparar:', err));
            
        } catch (error) {
            console.error('Erro ao inicializar player:', error);
        }
    },
    
    // Controles básicos
    play() {
        if (this.useNativePlayer && this.videoElement) {
            this.videoElement.play().then(() => {
                AppState.isPlaying = true;
                this.overlay.querySelector('#playPauseBtn').textContent = '⏸ Pause';
            }).catch(err => {
                console.error('Erro ao reproduzir:', err);
            });
        } else if (this.avplay) {
            this.avplay.play();
            AppState.isPlaying = true;
            this.overlay.querySelector('#playPauseBtn').textContent = '⏸ Pause';
        }
    },
    
    pause() {
        if (this.useNativePlayer && this.videoElement) {
            this.videoElement.pause();
            AppState.isPlaying = false;
            AppState.lastPosition = this.videoElement.currentTime * 1000;
            this.overlay.querySelector('#playPauseBtn').textContent = '▶️ Play';
        } else if (this.avplay) {
            this.avplay.pause();
            AppState.isPlaying = false;
            AppState.lastPosition = this.avplay.getCurrentTime();
            this.overlay.querySelector('#playPauseBtn').textContent = '▶️ Play';
        }
    },
    
    togglePlayPause() {
        AppState.isPlaying ? this.pause() : this.play();
    },
    
    seek(offset) {
        if (this.useNativePlayer && this.videoElement) {
            try {
                const currentTime = this.videoElement.currentTime;
                this.videoElement.currentTime = Math.max(0, currentTime + (offset / 1000));
            } catch (e) {
                console.error('Erro ao buscar:', e);
            }
        } else if (this.avplay) {
            try {
                const pos = this.avplay.getCurrentTime();
                this.avplay.seekTo(Math.max(0, pos + offset));
            } catch (e) {
                console.error('Erro ao buscar:', e);
            }
        }
    },
    
    reload() {
        if (!AppState.currentChannel) return;
        
        if (this.useNativePlayer && this.videoElement) {
            AppState.lastPosition = this.videoElement.currentTime * 1000;
            this.initHLSPlayer(AppState.currentChannel.url);
        } else if (this.avplay) {
            AppState.lastPosition = this.avplay.getCurrentTime();
            this.initAVPlay(AppState.currentChannel.url);
        }
    },
    
    close() {
        if (this.useNativePlayer) {
            if (this.hls) {
                this.hls.destroy();
                this.hls = null;
            }
            if (this.videoElement) {
                AppState.lastPosition = this.videoElement.currentTime * 1000;
                this.videoElement.pause();
                this.videoElement.src = '';
            }
        } else if (this.avplay) {
            try {
                AppState.lastPosition = this.avplay.getCurrentTime();
                this.avplay.stop();
                this.avplay.close();
            } catch (e) {
                console.error('Erro ao fechar:', e);
            }
        }
        
        this.overlay.style.display = 'none';
        AppState.isPlaying = false;
        
        // Retorna foco para lista de canais
        if (typeof ChannelModule !== 'undefined') {
            ChannelModule.focusLastChannel();
        }
    },
    
    // Troca de canal
    switchChannel(offset) {
        const playlist = AppState.currentPlaylist;
        if (!playlist.length) return;
        
        let idx = AppState.currentChannelIndex;
        if (idx < 0) idx = 0;
        
        idx = (idx + offset + playlist.length) % playlist.length;
        const nextChannel = playlist[idx];
        
        if (!nextChannel || !nextChannel.url) return;
        
        this.close();
        this.open(nextChannel.url, nextChannel.name, idx);
    },
    
    // Atualiza barra de progresso (apenas para AVPlay)
    updateProgress() {
        if (this.overlay.style.display !== 'block' || this.useNativePlayer) return;
        
        try {
            const pos = this.avplay?.getCurrentTime() || 0;
            const progressBar = this.overlay.querySelector('#progressBar');
            const timeLabel = this.overlay.querySelector('#timeLabel');
            
            if (this.duration > 0) {
                progressBar.value = (pos / this.duration) * 100;
                timeLabel.textContent = `${this.formatTime(pos)} / ${this.formatTime(this.duration)}`;
            }
        } catch (e) {}
        
        requestAnimationFrame(() => this.updateProgress());
    },
    
    // Mostra controles
    showControls() {
        const controls = this.overlay.querySelector('#controls');
        const progressContainer = this.overlay.querySelector('#progress-container');
        const channelTitle = this.overlay.querySelector('#channelTitle');
        const clock = this.overlay.querySelector('#clockDisplay');
        
        controls.style.opacity = '1';
        progressContainer.style.opacity = '1';
        channelTitle.style.opacity = '1';
        clock.style.opacity = '1';
        
        clearTimeout(this.hideTimer);
        this.hideTimer = setTimeout(() => {
            controls.style.opacity = '0';
            progressContainer.style.opacity = '0';
            channelTitle.style.opacity = '0';
            clock.style.opacity = '0';
        }, 4000);
    },
    
    // Utilitários
    formatTime(ms) {
        const sec = Math.floor(ms / 1000);
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    },
    
    updateClock() {
        const clock = this.overlay?.querySelector('#clockDisplay');
        if (!clock) return;
        
        const now = new Date();
        const h = now.getHours().toString().padStart(2, '0');
        const m = now.getMinutes().toString().padStart(2, '0');
        const s = now.getSeconds().toString().padStart(2, '0');
        clock.textContent = `${h}:${m}:${s}`;
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerModule;
}
