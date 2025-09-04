document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById("player");
    const channelList = document.getElementById("channelList");
    const playlistSelector = document.getElementById("playlistSelector");
    const playlistList = document.getElementById("playlistList");
    const remotePlaylistSelector = document.getElementById("remotePlaylistSelector");
    const remotePlaylistList = document.getElementById("remotePlaylistList");
    const messageArea = document.getElementById("messageArea");
    
    let playlistUrls = [];
    let channelItems = [];
    let playlistItems = [];
    let remotePlaylistItems = [];
    let currentFocusIndex = -1;
    let playlistFocusIndex = -1;
    let remoteFocusIndex = -1;
    let focusIndex = 0;
    let currentView = 'buttons'; // 'buttons', 'playlists', 'channels', 'remote'

    // Lista de playlists remotas - VOCÊ PODE ADICIONAR MAIS AQUI
    const remotePlaylistsConfig = [
      {
        name: "🎬 Canais 24 Hs",
        description: "Canais variados de alta qualidade",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/canais24h.m3u8",
        category: "Filmes e Series"
      },
	  {
        name: "🎬 TV Misto",
        description: "Canais variados de alta qualidade",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/tvmisto.m3u8",
        category: "Filmes e Series"
      },
      {
        name: "🎬 TV Misto 2",
        description: "Canais variados de alta qualidade",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/otra.m3u8",
        category: "Filmes e Series"
      },
		{
        name: "🎬 TV Misto32",
        description: "Canais variados de alta qualidade",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/canais1.m3u8",
        category: "Filmes e Series"
      },
      {
        name: "🎬 Filmes e Series",
        description: "Canais variados de alta qualidade",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/filmes-series.m3u8",
        category: "Filmes e Series"
      },
      {
        name: "🎬 Filmes mp4",
        description: "Canais variados de alta qualidade",
        url: "https://gist.githubusercontent.com/BrasilChannel/77d80bf7b68011726d2a34ca9c6ad219/raw/c973a6df2aec707f6f37a1403464e7560d1343d2/Canais%2520Full",
        category: "Filmes e Series"
      },{
        name: "🎬 Filmes2 mp4",
        description: "Canais variados de alta qualidade",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/canais2.m3u8",
        category: "Filmes"
      },
      {
        name: "🏆 Esportes HD",
        description: "Canais esportivos em alta definição",
        url: "https://raw.githubusercontent.com/exemplo/repo/main/esportes.m3u8",
        category: "Esportes"
      },
      {
        name: "🎭 Educativo",
        description: "Canais de séries, filmes e shows",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/educativo.m3u8",
        category: "Entretenimento"
      },
      {
        name: "🎭 Educativo2",
        description: "Canais de séries, filmes e shows",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/aqules.m3u8",
        category: "Entretenimento"
      },
      {
        name: "🎭 Educativo3",
        description: "Canais de séries, filmes e shows",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/new.m3u8",
        category: "Entretenimento"
      },
      {
        name: "🎭 teste",
        description: "Canais de séries, filmes e shows",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/teste.m3u8",
        category: "Entretenimento"
      },
      {
        name: "🎭 teste2",
        description: "Canais de séries, filmes e shows",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/teste2.m3u8",
        category: "Entretenimento"
      },
      {
        name: "🎭 Ptria2",
        description: "Canais de séries, filmes e shows",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/putria2.m3u8",
        category: "Entretenimento"
      },
      {
        name: "🎭 Ptria3",
        description: "Canais de séries, filmes e shows",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/putria3.m3u8",
        category: "Entretenimento"
      },
      {
        name: "🎭 PtriaMp4",
        description: "Canais de séries, filmes e shows",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/putria4.m3u8",
        category: "Entretenimento"
      },
      {
        name: "🎭 Ptria",
        description: "Canais de séries, filmes e shows",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/putria.m3u8",
        category: "Entretenimento"
      },
      {
        name: "👶 Infantil",
        description: "Conteúdo seguro para crianças",
        url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists2/novopono.m3u8",
        category: "Infantil"
      }
    ];

    // Função para mostrar mensagens
    function showMessage(text, type = 'info') {
      const messageDiv = document.createElement('div');
      messageDiv.className = type === 'error' ? 'error-message' : 
                            type === 'loading' ? 'loading' : 'success-message';
      messageDiv.textContent = text;
      messageArea.innerHTML = '';
      messageArea.appendChild(messageDiv);
      
      if (type !== 'loading') {
        setTimeout(() => {
          messageArea.innerHTML = '';
        }, 5000);
      }
    }

    // Mostrar seletor de playlists remotas
    function showRemotePlaylistSelector() {
      hideAllSelectors();
      remotePlaylistSelector.style.display = "block";
      updateRemotePlaylistList();
      currentView = 'remote';
      focusFirstRemotePlaylist();
    }

    // Atualizar lista de playlists remotas
    function updateRemotePlaylistList() {
      remotePlaylistList.innerHTML = "";
      
      // Agrupar por categoria
      const categories = [...new Set(remotePlaylistsConfig.map(p => p.category))];
      
      categories.forEach(category => {
        // Cabeçalho da categoria
        const categoryHeader = document.createElement("li");
        categoryHeader.innerHTML = `<strong>📂 ${category}</strong>`;
        categoryHeader.style.color = "#6bff6b";
        categoryHeader.style.padding = "10px 0 5px 0";
        categoryHeader.style.borderBottom = "1px solid #333";
        remotePlaylistList.appendChild(categoryHeader);
        
        // Playlists da categoria
        const categoryPlaylists = remotePlaylistsConfig.filter(p => p.category === category);
        categoryPlaylists.forEach((playlist, idx) => {
          const li = document.createElement("li");
          li.innerHTML = `
            <div style="margin-bottom: 5px;">
              <strong>${playlist.name}</strong>
            </div>
            <div style="font-size: 0.9em; color: #ccc; margin-left: 10px;">
              ${playlist.description}
            </div>
          `;
          li.setAttribute("tabindex", "0");
          li.classList.add("remote-playlist-item");
          li.dataset.url = playlist.url;
          li.dataset.name = playlist.name;
          li.onclick = () => loadRemotePlaylist(playlist.url, playlist.name);
          remotePlaylistList.appendChild(li);
        });
      });
      
      remotePlaylistItems = Array.from(document.querySelectorAll(".remote-playlist-item"));
      showMessage(`📡 ${remotePlaylistsConfig.length} playlists remotas disponíveis`, 'success');
    }

    // Carregar playlist remota
    function loadRemotePlaylist(url, name) {
      showMessage(`🔄 Carregando ${name}...`, 'loading');
      
      fetch(url)
        .then(resp => { 
          if (!resp.ok) throw new Error(`Falha ao carregar ${name} (${resp.status})`); 
          return resp.text(); 
        })
        .then(data => {
          playlistUrls = parsePlaylist(data);
          updateChannelList();
          hideAllSelectors();
          focusFirstChannel();
          showMessage(`✅ ${name} carregada com ${playlistUrls.length} canais`, 'success');
        })
        .catch(err => {
          showMessage(`❌ Erro ao carregar ${name}: ${err.message}`, 'error');
        });
    }

    // Detectar playlists disponíveis na pasta local do WGT
    async function detectAvailablePlaylists() {
      showMessage("🔍 Verificando playlists disponíveis...", 'loading');
      const detectedPlaylists = [];
      
      for (const playlist of availablePlaylists) {
        try {
          // Tenta fazer uma requisição HEAD para cada arquivo
          const response = await fetch(`playlists/${playlist.filename}`, { 
            method: 'HEAD',
            cache: 'no-cache'
          });
          
          if (response.ok) {
            detectedPlaylists.push({
              ...playlist,
              available: true,
              size: response.headers.get('content-length') || 'Desconhecido'
            });
          } else {
            detectedPlaylists.push({
              ...playlist,
              available: false
            });
          }
        } catch (error) {
          detectedPlaylists.push({
            ...playlist,
            available: false
          });
        }
      }
      
      return detectedPlaylists;
    }

    async function showPlaylistSelector() {
      hideAllSelectors();
      playlistSelector.style.display = "block";
      
      // Mostrar loading
      playlistList.innerHTML = "<li class='loading'>🔄 Detectando playlists disponíveis...</li>";
      
      try {
        const detectedPlaylists = await detectAvailablePlaylists();
        updatePlaylistList(detectedPlaylists);
      } catch (error) {
        // Se der erro na detecção, mostrar lista básica
        updatePlaylistList(availablePlaylists.map(p => ({...p, available: false})));
        showMessage("⚠️ Erro ao detectar playlists, mostrando lista completa", 'error');
      }
      
      currentView = 'playlists';
      focusFirstPlaylist();
    }

    function hideAllSelectors() {
      playlistSelector.style.display = "none";
      remotePlaylistSelector.style.display = "none";
      hideChannelFocus();
    }

    function backToButtons() {
      hideAllSelectors();
      currentView = 'buttons';
      const buttons = Array.from(document.querySelectorAll(".navigable"));
      if (buttons.length) {
        focusIndex = 0;
        buttons[0].focus();
      }
    }

    function updatePlaylistList(playlists) {
      playlistList.innerHTML = "";
      
      // Adicionar opção para input manual
      const manualLi = document.createElement("li");
      manualLi.textContent = "✏️ Digite nome do arquivo manualmente";
      manualLi.setAttribute("tabindex", "0");
      manualLi.classList.add("playlist-item", "manual-input");
      manualLi.onclick = () => {
        const filename = prompt("Digite o nome do arquivo da playlist (ex: minha-playlist.m3u8):");
        if (filename) {
          loadPlaylistFromFile(filename);
        }
      };
      playlistList.appendChild(manualLi);
      
      // Separar playlists disponíveis e indisponíveis
      const availablePlaylist = playlists.filter(p => p.available);
      const unavailablePlaylist = playlists.filter(p => !p.available);
      
      // Mostrar playlists disponíveis primeiro
      if (availablePlaylist.length > 0) {
        const headerLi = document.createElement("li");
        headerLi.innerHTML = "<strong>📂 Disponíveis:</strong>";
        headerLi.style.color = "#6bff6b";
        headerLi.style.padding = "5px 0";
        playlistList.appendChild(headerLi);
        
        availablePlaylist.forEach((playlist, idx) => {
          const li = document.createElement("li");
          li.textContent = `✅ ${playlist.name} (${playlist.filename})`;
          li.setAttribute("tabindex", "0");
          li.dataset.filename = playlist.filename;
          li.classList.add("playlist-item", "available-playlist");
          li.onclick = () => loadPlaylistFromFile(playlist.filename);
          playlistList.appendChild(li);
        });
      }
      
      // Mostrar playlists indisponíveis
      if (unavailablePlaylist.length > 0) {
        const headerLi = document.createElement("li");
        headerLi.innerHTML = "<strong>📁 Indisponíveis:</strong>";
        headerLi.style.color = "#ff6b6b";
        headerLi.style.padding = "5px 0";
        playlistList.appendChild(headerLi);
        
        unavailablePlaylist.forEach((playlist, idx) => {
          const li = document.createElement("li");
          li.textContent = `❌ ${playlist.name} (${playlist.filename})`;
          li.setAttribute("tabindex", "0");
          li.dataset.filename = playlist.filename;
          li.classList.add("playlist-item", "unavailable-playlist");
          li.onclick = () => {
            if (confirm(`Arquivo ${playlist.filename} não encontrado. Tentar carregar mesmo assim?`)) {
              loadPlaylistFromFile(playlist.filename);
            }
          };
          playlistList.appendChild(li);
        });
      }
      
      playlistItems = Array.from(document.querySelectorAll(".playlist-item"));
      
      // Mostrar resultado da detecção
      const totalAvailable = availablePlaylist.length;
      const totalFiles = playlists.length;
      showMessage(`📊 ${totalAvailable} de ${totalFiles} playlists encontradas`, 'success');
    }

    function loadPlaylistFromFile(filename) {
      showMessage(`🔄 Carregando ${filename}...`, 'loading');
      
      // Carrega arquivo da pasta playlists/ dentro do WGT
      fetch("playlists/" + filename, {
        cache: 'no-cache'
      })
        .then(resp => { 
          if (!resp.ok) {
            throw new Error(`Playlist ${filename} não encontrada (${resp.status})`); 
          }
          return resp.text(); 
        })
        .then(data => {
          playlistUrls = parsePlaylist(data);
          updateChannelList();
          hideAllSelectors();
          focusFirstChannel();
          showMessage(`✅ ${filename} carregada com ${playlistUrls.length} canais`, 'success');
        })
        .catch(err => {
          showMessage(`❌ Erro ao carregar ${filename}: ${err.message}`, 'error');
          console.error("Erro detalhado:", err);
        });
    }

    function loadFromUrl() {
      const url = prompt("Digite a URL da playlist (.m3u8):");
      if (!url) return;
      
      showMessage("🔄 Carregando playlist de URL...", 'loading');
      
      fetch(url)
        .then(resp => { 
          if (!resp.ok) throw new Error(`URL inválida (${resp.status}).`); 
          return resp.text(); 
        })
        .then(data => {
          playlistUrls = parsePlaylist(data);
          updateChannelList();
          hideAllSelectors();
          focusFirstChannel();
          showMessage(`✅ Playlist carregada com ${playlistUrls.length} canais`, 'success');
        })
        .catch(err => {
          showMessage(`❌ Erro ao carregar playlist: ${err.message}`, 'error');
        });
    }

    function loadSingleChannel() {
      const url = prompt("Digite a URL do canal (.m3u8 ou .mp4):");
      if (!url) return;
      playlistUrls = [{ url, name: "Canal Único" }];
      updateChannelList();
      hideAllSelectors();
      focusFirstChannel();
      showMessage("✅ Canal único carregado", 'success');
    }

    function parsePlaylist(content) {
      const lines = content.split(/\r?\n/);
      const parsed = [];
      let currentName = "";
      
      lines.forEach(line => {
        line = line.trim();
        if (line.startsWith("#EXTINF")) {
          const groupMatch = line.match(/group-title="([^"]+)"/);
          const afterComma = line.split(",").pop().trim();
          currentName = groupMatch ? `${groupMatch[1]} - ${afterComma}` : afterComma || "Canal Desconhecido";
        } else if (line.startsWith("http")) {
          parsed.push({ url: line, name: currentName || "Canal Desconhecido" });
          currentName = "";
        }
      });
      
      return parsed;
    }

    function updateChannelList() {
      channelList.innerHTML = "";
      if (playlistUrls.length === 0) {
        channelList.innerHTML = "<li style='color: #ccc;'>Nenhum canal disponível</li>";
        return;
      }
      
      playlistUrls.forEach(({ url, name }, idx) => {
        const li = document.createElement("li");
        li.textContent = name || `Canal ${idx + 1}`;
        li.setAttribute("tabindex", "0");
        li.dataset.url = url;
        li.classList.add("channel-item");
        li.onclick = () => playStream(url, name);
        channelList.appendChild(li);
      });
      
      channelItems = Array.from(document.querySelectorAll(".channel-item"));
      currentView = 'channels';
    }

    function playStream(url, name = '') {
      channelItems.forEach(el => el.classList.remove("focused"));
      playlistItems.forEach(el => el.classList.remove("focused"));
      remotePlaylistItems.forEach(el => el.classList.remove("focused"));
      video.style.display = "block";
      
      showMessage(`🎬 Reproduzindo: ${name}`, 'success');
      
      if (url.endsWith(".mp4")) {
        video.src = url;
        video.load();
        video.play().catch(err => {
          showMessage(`❌ Erro ao reproduzir: ${err.message}`, 'error');
        });
      } else if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: false,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(err => {
            showMessage(`❌ Erro ao reproduzir: ${err.message}`, 'error');
          });
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            showMessage(`❌ Erro fatal no stream: ${data.type}`, 'error');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener("loadedmetadata", () => {
          video.play().catch(err => {
            showMessage(`❌ Erro ao reproduzir: ${err.message}`, 'error');
          });
        });
      } else {
        showMessage("❌ Formato não suportado pelo navegador", 'error');
        return;
      }
      
      openFullscreen(video);
    }

    function openFullscreen(elem) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    }

    function focusFirstChannel() {
      setTimeout(() => {
        if (channelItems.length) {
          currentFocusIndex = 0;
          channelItems[0].focus();
          channelItems[0].classList.add("focused");
          currentView = 'channels';
        }
      }, 300);
    }

    function focusFirstPlaylist() {
      setTimeout(() => {
        if (playlistItems.length) {
          playlistFocusIndex = 0;
          playlistItems[0].focus();
          playlistItems[0].classList.add("focused");
        }
      }, 100);
    }

    function focusFirstRemotePlaylist() {
      setTimeout(() => {
        if (remotePlaylistItems.length) {
          remoteFocusIndex = 0;
          remotePlaylistItems[0].focus();
          remotePlaylistItems[0].classList.add("focused");
        }
      }, 100);
    }

    function hideChannelFocus() {
      channelItems.forEach(el => el.classList.remove("focused"));
      currentFocusIndex = -1;
    }

    function moveFocus(delta) {
      if (currentView === 'channels' && channelItems.length) {
        if (currentFocusIndex >= 0) {
          channelItems[currentFocusIndex]?.classList.remove("focused");
        }
        currentFocusIndex = (currentFocusIndex + delta + channelItems.length) % channelItems.length;
        const item = channelItems[currentFocusIndex];
        item.focus();
        item.classList.add("focused");
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (currentView === 'playlists' && playlistItems.length) {
        if (playlistFocusIndex >= 0) {
          playlistItems[playlistFocusIndex]?.classList.remove("focused");
        }
        playlistFocusIndex = (playlistFocusIndex + delta + playlistItems.length) % playlistItems.length;
        const item = playlistItems[playlistFocusIndex];
        item.focus();
        item.classList.add("focused");
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (currentView === 'remote' && remotePlaylistItems.length) {
        if (remoteFocusIndex >= 0) {
          remotePlaylistItems[remoteFocusIndex]?.classList.remove("focused");
        }
        remoteFocusIndex = (remoteFocusIndex + delta + remotePlaylistItems.length) % remotePlaylistItems.length;
        const item = remotePlaylistItems[remoteFocusIndex];
        item.focus();
        item.classList.add("focused");
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    // Controles de teclado
    document.addEventListener("keydown", e => {
      const isPlayerVisible = video.style.display === "block";

      // Navegação vertical nas listas
      if (!isPlayerVisible && (currentView === 'channels' || currentView === 'playlists' || currentView === 'remote')) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          moveFocus(1);
        }
        else if (e.key === "ArrowUp") {
          e.preventDefault();
          moveFocus(-1);
        }
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const active = document.activeElement;
        if (active.classList.contains("channel-item") || 
            active.classList.contains("playlist-item") || 
            active.classList.contains("remote-playlist-item") ||
            active.classList.contains("navigable")) {
          active.click();
        }
      }

      if (e.key === "Backspace" || e.keyCode === 10009) {
        e.preventDefault();
        if (isPlayerVisible) {
          video.pause();
          video.style.display = "none";
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
          if (currentView === 'channels' && channelItems.length) {
            focusFirstChannel();
          }
        } else if (currentView === 'playlists' || currentView === 'remote') {
          backToButtons();
        } else if (currentView === 'channels') {
          hideChannelFocus();
          currentView = 'buttons';
          const buttons = Array.from(document.querySelectorAll(".navigable"));
          if (buttons.length) {
            focusIndex = 0;
            buttons[0].focus();
          }
        }
      }
    });

    const buttons = Array.from(document.querySelectorAll(".navigable"));
    if (buttons.length) buttons[focusIndex].focus();

    // Navegação horizontal nos botões
    document.addEventListener("keydown", e => {
      if (currentView === 'buttons' && ["ArrowRight","ArrowLeft"].includes(e.key)) {
        e.preventDefault();
        focusIndex = e.key === "ArrowRight"
          ? (focusIndex + 1) % buttons.length
          : (focusIndex - 1 + buttons.length) % buttons.length;
        buttons[focusIndex].focus();
      }
    });

    // Event listeners dos botões
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

    // Mensagem inicial
    showMessage("💡 Selecione uma opção acima para começar", 'success');
  });
