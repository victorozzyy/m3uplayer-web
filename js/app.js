// app.js - Versão com verificação segura

// 🛡️ Helper para adicionar event listeners com segurança
function safeAddEventListener(elementId, event, callback) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener(event, callback);
        return true;
    }
    console.warn(`⚠️ Elemento "${elementId}" não encontrado`);
    return false;
}

// 🛡️ Helper para querySelector com segurança
function safeQuerySelector(selector, callback) {
    const element = document.querySelector(selector);
    if (element && callback) {
        callback(element);
        return element;
    }
    return element;
}

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

// Configura botões principais COM VERIFICAÇÃO
function setupMainButtons() {
    safeAddEventListener('btnHome', 'click', () => {
        if (confirm('Voltar para a página inicial?')) {
            location.href = 'index.html';
        }
    });
    
    safeAddEventListener('btnMinhasListas', 'click', () => {
        PlaylistModule.showMinhasListasSelector();
    });
    
    safeAddEventListener('btnLoadPlaylist', 'click', () => {
        PlaylistModule.showRemotePlaylistSelector();
    });
    
    safeAddEventListener('btnLocal', 'click', () => {
        PlaylistModule.showPlaylistSelector();
    });
    
    safeAddEventListener('btnUrl', 'click', () => {
        PlaylistModule.loadFromUrl();
    });
    
    safeAddEventListener('btnSingle', 'click', () => {
        PlaylistModule.loadSingleChannel();
    });
    
    safeAddEventListener('btnUpload', 'click', () => {
        PlaylistModule.handleFileUpload();
    });
    
    safeAddEventListener('btnBackFromRemote', 'click', () => {
        NavigationModule.backToButtons();
    });
    
    safeAddEventListener('btnBackFromLocal', 'click', () => {
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
