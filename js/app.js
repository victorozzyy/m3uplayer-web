// app.js - Inicialização e configuração principal

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 M3U8 Player inicializado - Versão modular sem localStorage');
    
    // Inicializar módulos
    ChannelModule.init();
    PlaylistModule.init();
    
    // Configurar event listeners dos botões principais
    setupMainButtons();
    
    // Configurar navegação por teclado
    NavigationModule.setupKeyboardControls();
    
    // Foco inicial nos botões
    const buttons = document.querySelectorAll('.navigable');
    if (buttons.length) {
        buttons[AppState.focusIndex].focus();
    }
    
    // Inicialização limpa
    AppState.reset();
    ChannelModule.updateChannelList();
    ChannelModule.showMessage('💡 Selecione uma opção acima para começar', 'success');
});

// Configura botões principais
function setupMainButtons() {
    // Botão Home
    document.getElementById('btnHome').addEventListener('click', () => {
        if (confirm('Voltar para a página inicial?')) {
            location.href = 'index.html';
        }
    });
    
    // Botão Minhas Listas (NOVO)
    document.getElementById('btnMinhasListas').addEventListener('click', () => {
        PlaylistModule.showMinhasListasSelector();
    });
    
    // Botão Playlists Remotas
    document.getElementById('btnLoadPlaylist').addEventListener('click', () => {
        PlaylistModule.showRemotePlaylistSelector();
    });
    
    // Botão Playlists Locais
    document.getElementById('btnLocal').addEventListener('click', () => {
        PlaylistModule.showPlaylistSelector();
    });
    
    // Botão URL
    document.getElementById('btnUrl').addEventListener('click', () => {
        PlaylistModule.loadFromUrl();
    });
    
    // Botão Canal Único
    document.getElementById('btnSingle').addEventListener('click', () => {
        PlaylistModule.loadSingleChannel();
    });
    
    // Botão Upload (NOVO)
    document.getElementById('btnUpload').addEventListener('click', () => {
        PlaylistModule.handleFileUpload();
    });
    
    // Botões de voltar
    document.getElementById('btnBackFromRemote').addEventListener('click', () => {
        NavigationModule.backToButtons();
    });
    
    document.getElementById('btnBackFromLocal').addEventListener('click', () => {
        NavigationModule.backToButtons();
    });
}

// Utilitário de debounce
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}