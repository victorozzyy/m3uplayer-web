// documents-manager.js - Gerenciador de arquivos usando Tizen Filesystem
// Salva playlists grandes em /opt/usr/home/owner/content/Documents/

const DocumentsManager = {
    
    // Diretório base para salvar playlists
    DOCUMENTS_PATH: 'documents',
    PLAYLIST_FOLDER: 'M3U8Player_Playlists',
    
    // Cache em memória (para fallback)
    memoryCache: new Map(),
    
    // Estado de inicialização
    isInitialized: false,
    isTizenAvailable: false,
    
    /**
     * Inicializa o módulo e verifica disponibilidade do Tizen
     */
    init() {
        console.log('╔═══════════════════════════════════════╗');
        console.log('📂 DocumentsManager.init()');
        console.log('╚═══════════════════════════════════════╝');
        
        // Verificar se Tizen está disponível
        this.isTizenAvailable = typeof tizen !== 'undefined' && 
                                typeof tizen.filesystem !== 'undefined';
        
        if (this.isTizenAvailable) {
            console.log('✅ Tizen Filesystem disponível');
            this.ensurePlaylistFolder();
        } else {
            console.warn('⚠️ Tizen não disponível - usando cache de memória');
        }
        
        this.isInitialized = true;
        console.log('✅ DocumentsManager inicializado');
    },
    
    /**
     * Garante que a pasta de playlists existe
     */
    ensurePlaylistFolder() {
        if (!this.isTizenAvailable) return;
        
        try {
            tizen.filesystem.resolve(
                this.DOCUMENTS_PATH,
                (dir) => {
                    // Tentar criar pasta se não existir
                    try {
                        dir.createDirectory(this.PLAYLIST_FOLDER);
                        console.log('✅ Pasta de playlists criada');
                    } catch (e) {
                        // Pasta já existe, tudo bem
                        console.log('📁 Pasta de playlists já existe');
                    }
                },
                (error) => {
                    console.error('❌ Erro ao acessar documents:', error);
                }
            );
        } catch (error) {
            console.error('❌ Erro ao criar pasta:', error);
        }
    },
    
    /**
     * Gera nome de arquivo seguro
     */
    sanitizeFilename(name) {
        return name
            .replace(/[^a-z0-9_-]/gi, '_')
            .replace(/_+/g, '_')
            .substring(0, 100);
    },
    
    /**
     * Salva playlist em arquivo
     */
    async savePlaylist(playlistName, playlistData, onProgress = null) {
        console.log('╔═══════════════════════════════════════╗');
        console.log('💾 DocumentsManager.savePlaylist()');
        console.log('   Nome:', playlistName);
        console.log('   Canais:', playlistData.length);
        console.log('╚═══════════════════════════════════════╝');
        
        if (!this.isInitialized) this.init();
        
        // Se Tizen não disponível, usar memória
        if (!this.isTizenAvailable) {
            console.log('⚠️ Salvando em memória (Tizen indisponível)');
            this.memoryCache.set(playlistName, {
                data: playlistData,
                timestamp: Date.now()
            });
            return { success: true, location: 'memory' };
        }
        
        return new Promise((resolve) => {
            try {
                const filename = this.sanitizeFilename(playlistName) + '.json';
                const filepath = `${this.DOCUMENTS_PATH}/${this.PLAYLIST_FOLDER}/${filename}`;
                
                // Converter para JSON
                const jsonData = JSON.stringify({
                    name: playlistName,
                    data: playlistData,
                    timestamp: Date.now(),
                    version: '1.0'
                });
                
                if (onProgress) onProgress(25, 'Preparando dados...');
                
                tizen.filesystem.resolve(
                    this.DOCUMENTS_PATH,
                    (documentsDir) => {
                        if (onProgress) onProgress(50, 'Acessando pasta...');
                        
                        documentsDir.resolve(
                            this.PLAYLIST_FOLDER,
                            (playlistDir) => {
                                if (onProgress) onProgress(75, 'Salvando arquivo...');
                                
                                // Criar ou sobrescrever arquivo
                                const file = playlistDir.createFile(filename);
                                
                                if (file) {
                                    file.openStream(
                                        'w',
                                        (fileStream) => {
                                            fileStream.write(jsonData);
                                            fileStream.close();
                                            
                                            if (onProgress) onProgress(100, 'Concluído!');
                                            
                                            console.log('✅ Playlist salva:', filepath);
                                            resolve({
                                                success: true,
                                                location: 'documents',
                                                path: filepath,
                                                size: jsonData.length
                                            });
                                        },
                                        (error) => {
                                            console.error('❌ Erro ao abrir stream:', error);
                                            resolve({ success: false, error: error.message });
                                        }
                                    );
                                } else {
                                    console.error('❌ Não foi possível criar arquivo');
                                    resolve({ success: false, error: 'Falha ao criar arquivo' });
                                }
                            },
                            (error) => {
                                console.error('❌ Erro ao acessar pasta de playlists:', error);
                                // Tentar criar pasta novamente
                                this.ensurePlaylistFolder();
                                resolve({ success: false, error: error.message });
                            }
                        );
                    },
                    (error) => {
                        console.error('❌ Erro ao acessar documents:', error);
                        resolve({ success: false, error: error.message });
                    }
                );
                
            } catch (error) {
                console.error('❌ Erro ao salvar playlist:', error);
                resolve({ success: false, error: error.message });
            }
        });
    },
    
    /**
     * Carrega playlist de arquivo
     */
    async loadPlaylist(playlistName) {
        console.log('╔═══════════════════════════════════════╗');
        console.log('📂 DocumentsManager.loadPlaylist()');
        console.log('   Nome:', playlistName);
        console.log('╚═══════════════════════════════════════╝');
        
        if (!this.isInitialized) this.init();
        
        // Verificar cache de memória primeiro
        if (this.memoryCache.has(playlistName)) {
            console.log('✅ Carregando da memória');
            const cached = this.memoryCache.get(playlistName);
            return {
                success: true,
                data: cached.data,
                location: 'memory'
            };
        }
        
        // Se Tizen não disponível
        if (!this.isTizenAvailable) {
            console.log('⚠️ Tizen indisponível e playlist não está em memória');
            return { success: false, error: 'Playlist não encontrada' };
        }
        
        return new Promise((resolve) => {
            try {
                const filename = this.sanitizeFilename(playlistName) + '.json';
                const filepath = `${this.DOCUMENTS_PATH}/${this.PLAYLIST_FOLDER}/${filename}`;
                
                tizen.filesystem.resolve(
                    filepath,
                    (file) => {
                        file.openStream(
                            'r',
                            (fileStream) => {
                                const content = fileStream.read(file.fileSize);
                                fileStream.close();
                                
                                try {
                                    const parsed = JSON.parse(content);
                                    
                                    console.log('✅ Playlist carregada:', parsed.name);
                                    console.log('   Canais:', parsed.data.length);
                                    console.log('   Timestamp:', new Date(parsed.timestamp).toLocaleString());
                                    
                                    resolve({
                                        success: true,
                                        data: parsed.data,
                                        name: parsed.name,
                                        timestamp: parsed.timestamp,
                                        location: 'documents'
                                    });
                                    
                                } catch (parseError) {
                                    console.error('❌ Erro ao parsear JSON:', parseError);
                                    resolve({ success: false, error: 'Arquivo corrompido' });
                                }
                            },
                            (error) => {
                                console.error('❌ Erro ao ler arquivo:', error);
                                resolve({ success: false, error: error.message });
                            }
                        );
                    },
                    (error) => {
                        console.error('❌ Playlist não encontrada:', filename);
                        resolve({ success: false, error: 'Playlist não encontrada' });
                    }
                );
                
            } catch (error) {
                console.error('❌ Erro ao carregar playlist:', error);
                resolve({ success: false, error: error.message });
            }
        });
    },
    
    /**
     * Lista todas as playlists salvas
     */
    async listPlaylists() {
        console.log('📋 DocumentsManager.listPlaylists()');
        
        if (!this.isInitialized) this.init();
        
        // Se Tizen não disponível, retornar cache de memória
        if (!this.isTizenAvailable) {
            const memoryList = Array.from(this.memoryCache.entries()).map(([name, data]) => ({
                name: name,
                timestamp: data.timestamp,
                channels: data.data.length,
                location: 'memory'
            }));
            console.log(`📦 ${memoryList.length} playlists na memória`);
            return { success: true, playlists: memoryList };
        }
        
        return new Promise((resolve) => {
            try {
                const folderPath = `${this.DOCUMENTS_PATH}/${this.PLAYLIST_FOLDER}`;
                
                tizen.filesystem.resolve(
                    folderPath,
                    (playlistDir) => {
                        playlistDir.listFiles(
                            (files) => {
                                const playlists = files
                                    .filter(f => f.name.endsWith('.json'))
                                    .map(f => ({
                                        name: f.name.replace('.json', ''),
                                        size: f.fileSize,
                                        modified: f.modified,
                                        location: 'documents'
                                    }));
                                
                                console.log(`✅ ${playlists.length} playlists encontradas`);
                                resolve({ success: true, playlists: playlists });
                            },
                            (error) => {
                                console.error('❌ Erro ao listar arquivos:', error);
                                resolve({ success: false, error: error.message });
                            }
                        );
                    },
                    (error) => {
                        console.error('❌ Pasta não encontrada:', error);
                        resolve({ success: true, playlists: [] });
                    }
                );
                
            } catch (error) {
                console.error('❌ Erro ao listar playlists:', error);
                resolve({ success: false, error: error.message });
            }
        });
    },
    
    /**
     * Exclui uma playlist
     */
    async deletePlaylist(playlistName) {
        console.log('╔═══════════════════════════════════════╗');
        console.log('🗑️ DocumentsManager.deletePlaylist()');
        console.log('   Nome:', playlistName);
        console.log('╚═══════════════════════════════════════╝');
        
        if (!this.isInitialized) this.init();
        
        // Remover da memória
        if (this.memoryCache.has(playlistName)) {
            this.memoryCache.delete(playlistName);
            console.log('✅ Removido da memória');
        }
        
        // Se Tizen não disponível
        if (!this.isTizenAvailable) {
            return { success: true, location: 'memory' };
        }
        
        return new Promise((resolve) => {
            try {
                const filename = this.sanitizeFilename(playlistName) + '.json';
                const filepath = `${this.DOCUMENTS_PATH}/${this.PLAYLIST_FOLDER}/${filename}`;
                
                tizen.filesystem.resolve(
                    filepath,
                    (file) => {
                        file.parent.deleteFile(
                            file.fullPath,
                            () => {
                                console.log('✅ Playlist excluída:', filename);
                                resolve({ success: true, location: 'documents' });
                            },
                            (error) => {
                                console.error('❌ Erro ao excluir arquivo:', error);
                                resolve({ success: false, error: error.message });
                            }
                        );
                    },
                    (error) => {
                        console.error('❌ Arquivo não encontrado:', filename);
                        resolve({ success: false, error: 'Arquivo não encontrado' });
                    }
                );
                
            } catch (error) {
                console.error('❌ Erro ao excluir playlist:', error);
                resolve({ success: false, error: error.message });
            }
        });
    },
    
    /**
     * Verifica espaço disponível
     */
    async checkAvailableSpace() {
        if (!this.isTizenAvailable) {
            return { success: true, space: 'unlimited (memory)' };
        }
        
        return new Promise((resolve) => {
            try {
                tizen.filesystem.resolve(
                    this.DOCUMENTS_PATH,
                    (dir) => {
                        const availableSize = dir.availableSize || 0;
                        const totalSize = dir.totalSize || 0;
                        
                        console.log('💾 Espaço disponível:', (availableSize / 1024 / 1024).toFixed(2), 'MB');
                        console.log('💿 Espaço total:', (totalSize / 1024 / 1024).toFixed(2), 'MB');
                        
                        resolve({
                            success: true,
                            available: availableSize,
                            total: totalSize,
                            availableMB: (availableSize / 1024 / 1024).toFixed(2),
                            totalMB: (totalSize / 1024 / 1024).toFixed(2)
                        });
                    },
                    (error) => {
                        console.error('❌ Erro ao verificar espaço:', error);
                        resolve({ success: false, error: error.message });
                    }
                );
            } catch (error) {
                console.error('❌ Erro ao verificar espaço:', error);
                resolve({ success: false, error: error.message });
            }
        });
    }
};

// Log de carregamento
console.log('✅ DocumentsManager carregado (v1.0)');

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentsManager;
}
