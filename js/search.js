// ======================================================
// search.js - Busca integrada visível (v3.0)
// ======================================================
// - Botão de busca aparece dentro do #channelList
// - Método público SearchModule.show() adicionado
// - Compatível com ChannelModule.updateChannelList()
// - Todos os logs preservados
// ======================================================

const SearchModule = {
  channelContainer: null,
  searchListItem: null,
  overlayChannels: [],
  overlayFocusIndex: 0,
  isVisible: false,

  // ======================================================
  // 🔧 Inicialização
  // ======================================================
  // ======================================================
// 🔧 Inicialização simples (sem exibir botão automaticamente)
// ======================================================
init() {
  console.log('✅ SearchModule inicializado');
  this.channelContainer = document.getElementById('channelList');

  // Apenas prepara o módulo, sem criar o botão agora
  // O botão será inserido quando a lista for carregada
},


  // ======================================================
  // 👁️ Método público chamado pelo ChannelModule
  // ======================================================
  show() {
    try {
      this.channelContainer = document.getElementById('channelList');
      if (!this.channelContainer) {
        console.warn('⚠️ Container #channelList não encontrado para inserir busca');
        return;
      }

      // Remove botão duplicado (caso renderize novamente)
      const oldSearch = document.getElementById('searchCategoryItem');
      if (oldSearch && oldSearch.parentElement !== this.channelContainer) {
        console.log('🧹 Removendo botão de busca antigo fora do container');
        oldSearch.remove();
      }

      // Evita duplicar
      if (this.channelContainer.querySelector('#searchCategoryItem')) {
        console.log('ℹ️ Botão de busca já presente na lista');
        this.isVisible = true;
        return;
      }

      // Cria o botão
      const li = document.createElement('li');
      li.id = 'searchCategoryItem';
      li.className = 'category-header navigable search-category';
      li.tabIndex = 0;
      li.setAttribute('role', 'button');
      li.innerHTML = `<span>🔍 Buscar Canais</span>`;

      // Estilo visual (idêntico ao original)
      li.style.cssText = `
        color: rgb(0,230,118);
        padding: 15px 10px;
        cursor: pointer;
        background: linear-gradient(45deg, rgb(26,26,26), rgb(42,42,42));
        border-radius: 5px;
        margin-bottom: 5px;
        border: 2px solid transparent;
        transition: 0.3s;
        display: flex;
        align-items: center;
        gap: 10px;
      `;

      // Foco visual
      li.addEventListener('focus', () => {
        li.style.borderColor = '#00e676';
        li.style.background = 'linear-gradient(45deg, #1a3a1a, #0a2a0a)';
        li.style.boxShadow = '0 0 15px rgba(0, 230, 118, 0.3)';
      });

      li.addEventListener('blur', () => {
        li.style.borderColor = 'transparent';
        li.style.background = 'linear-gradient(45deg, #1a1a1a, #2a2a2a)';
        li.style.boxShadow = 'none';
      });

      // Ação ao clicar
      li.addEventListener('click', () => this.openSearchDialog());
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
          e.preventDefault();
          this.openSearchDialog();
        }
      });

      // Adiciona o botão no topo da lista
      this.channelContainer.prepend(li);
      this.searchListItem = li;
      this.isVisible = true;

      console.log('✅ Botão de busca integrado à lista de canais (#channelList)');
    } catch (error) {
      console.error('❌ Erro ao exibir busca:', error);
    }
  },

  // ======================================================
  // 🚫 Oculta o botão (se necessário)
  // ======================================================
  hide() {
    const li = document.getElementById('searchCategoryItem');
    if (li) li.remove();
    this.isVisible = false;
    console.log('🔒 Botão de busca ocultado');
  },

  // ======================================================
  // ⌨️ Diálogo de busca simples
  // ======================================================
  openSearchDialog() {
    console.log('⌨️ Abrindo diálogo de busca...');
    const query = prompt('🔍 Digite o nome do canal, categoria ou descrição:');
    if (!query || !query.trim()) {
      console.warn('❌ Busca vazia ou cancelada');
      return;
    }
    this.performSearch(query.trim());
  },

  // ======================================================
  // 🔍 Executa a busca
  // ======================================================
  performSearch(query) {
    if (!AppState.currentPlaylist || AppState.currentPlaylist.length === 0) {
      if (typeof ChannelModule !== 'undefined')
        ChannelModule.showMessage('❌ Nenhuma playlist carregada', 'error');
      return;
    }

    console.log('🔍 Buscando por:', query);
    const normalized = query.toLowerCase();

    const filtered = AppState.currentPlaylist.filter(ch => {
      const name = (ch.name || '').toLowerCase();
      const group = (ch.group || '').toLowerCase();
      const desc = (ch.description || '').toLowerCase();
      return name.includes(normalized) || group.includes(normalized) || desc.includes(normalized);
    });

    if (filtered.length === 0) {
      if (typeof ChannelModule !== 'undefined')
        ChannelModule.showMessage(`❌ Nenhum canal encontrado para "${query}"`, 'error');
      return;
    }

    this.showSearchOverlay(query, filtered);

    if (typeof ChannelModule !== 'undefined')
      ChannelModule.showMessage(`🔍 ${filtered.length} canal${filtered.length !== 1 ? 'is' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`, 'success');
  },

  // ======================================================
  // 📺 Exibe overlay de resultados
  // ======================================================
  showSearchOverlay(query, channels) {
    console.log(`📺 Exibindo overlay de busca: "${query}" (${channels.length} resultados)`);

    const overlay = this.createOverlayElement();
    const title = document.getElementById('searchOverlayTitle');
    const grid = document.getElementById('searchOverlayChannelGrid');

    title.textContent = `🔍 Resultados para "${query}" (${channels.length})`;
    grid.innerHTML = '';
    this.overlayChannels = [];

    channels.forEach((channel, index) => {
      const div = this.createChannelCard(channel, index);
      grid.appendChild(div);
      this.overlayChannels.push(div);
    });

    overlay.style.display = 'block';
    this.overlayFocusIndex = 0;

    if (this.overlayChannels.length > 0) {
      setTimeout(() => this.overlayChannels[0].focus(), 100);
    }
  },

  // ======================================================
  // 🎴 Cria card de canal
  // ======================================================
  createChannelCard(channel, index) {
    const div = document.createElement('div');
    div.className = 'search-channel-item navigable';
    div.tabIndex = 0;
    div.dataset.url = channel.url;
    div.dataset.name = channel.name;
    div.dataset.index = index;

    div.style.cssText = `
      background: #2a2a2a;
      border: 3px solid #444;
      border-radius: 10px;
      padding: 15px;
      cursor: pointer;
      color: white;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    div.innerHTML = `
      <div style="font-weight:bold; font-size:1.1em; color:#6bff6b;">${channel.name}</div>
      <div style="font-size:0.85em; color:#aaa;">📁 ${channel.group || 'Outros'}</div>
    `;

    div.addEventListener('focus', () => {
      div.style.borderColor = '#00e676';
      div.style.background = '#1a3a1a';
      div.style.transform = 'scale(1.05)';
    });

    div.addEventListener('blur', () => {
      div.style.borderColor = '#444';
      div.style.background = '#2a2a2a';
      div.style.transform = 'scale(1)';
    });

    div.addEventListener('click', () => this.openChannel(channel));
    div.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.keyCode === 13) this.openChannel(channel);
      else if (e.key === 'Escape' || e.keyCode === 10009) this.hideOverlay();
    });

    return div;
  },

  // ======================================================
  // 🎬 Abre canal selecionado
  // ======================================================
  openChannel(channel) {
    console.log('🎬 Abrindo canal via busca:', channel.name);
    const index = AppState.currentPlaylist.findIndex(ch => ch.url === channel.url);
    AppState.setCurrentChannel(channel, index);
    if (typeof PlayerModule !== 'undefined') {
      PlayerModule.open(channel.url, channel.name, index);
    }
  },

  // ======================================================
  // 🧱 Cria overlay (único)
  // ======================================================
  createOverlayElement() {
    let overlay = document.getElementById('searchOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'searchOverlay';
    overlay.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      z-index: 2000;
      overflow-y: auto;
      padding: 20px;
    `;

    overlay.innerHTML = `
      <div style="
        max-width: 1400px;
        margin: 0 auto;
        background: #1a1a1a;
        border-radius: 15px;
        padding: 25px;
        border: 3px solid #00e676;
      ">
        <h2 id="searchOverlayTitle" style="color: #00e676; margin-bottom: 20px;"></h2>
        <button id="searchOverlayCloseBtn" style="
          background: #ff4444;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
        ">✕ Fechar</button>
        <div id="searchOverlayChannelGrid" style="
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 15px;
        "></div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.querySelector('#searchOverlayCloseBtn').onclick = () => this.hideOverlay();
    return overlay;
  },

  // ======================================================
  // 🔒 Fecha overlay
  // ======================================================
  hideOverlay() {
    const overlay = document.getElementById('searchOverlay');
    if (overlay) overlay.style.display = 'none';
    this.overlayChannels = [];
    if (this.searchListItem) setTimeout(() => this.searchListItem.focus(), 100);
    console.log('🔒 Overlay de busca fechado');
  }
};
// ======================================================
// 👀 OBSERVADOR AUTOMÁTICO DE MUDANÇAS NA LISTA
// ======================================================
// Garante que o botão "Buscar Canais" reapareça sempre
// após atualizações dinâmicas do ChannelModule.
SearchModule.observeListChanges = function () {
  try {
    const listContainer = document.getElementById('channelList');
    if (!listContainer) {
      console.warn('⚠️ Não foi possível iniciar observador da lista (#channelList não encontrado)');
      return;
    }

    // Evita múltiplos observers
    if (SearchModule._observer) {
      SearchModule._observer.disconnect();
      console.log('♻️ Reiniciando observador de lista');
    }

    // Cria observador de mutações
    SearchModule._observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // Quando a lista é recriada, reinserir o botão
          if (!document.getElementById('searchCategoryItem')) {
            console.log('🔁 Lista alterada — reinserindo botão de busca');
            setTimeout(() => SearchModule.show(), 150);
          }
        }
      }
    });

    // Configura observação de mudanças no conteúdo da lista
    SearchModule._observer.observe(listContainer, {
      childList: true,
      subtree: false
    });

    console.log('👁️ Observador de mudanças da lista ativado');
  } catch (err) {
    console.error('❌ Erro ao iniciar observador de lista:', err);
  }
};

// ======================================================
// 🔄 Inicializa automaticamente após o DOM carregar
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (typeof SearchModule !== 'undefined') SearchModule.init();
  }, 400);
});

console.log('✅ SearchModule carregado (Busca visível dentro da lista, v3.0)');
