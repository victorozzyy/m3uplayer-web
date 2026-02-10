// local-playlist-loader.js - Sistema de indexação para playlists grandes
// ⚠️ ESTE ARQUIVO ESTAVA FALTANDO NO SEU PROJETO!
// Versão 2.1 - Sistema completo de carregamento de playlists locais

const LocalPlaylistLoader = {
    
    // ========================================
    // 📁 CARREGAR E INDEXAR PLAYLIST LOCAL
    // ========================================
    async loadLocalPlaylist(filename) {
        console.log('╔═══════════════════════════════════════╗');
        console.log('📁 LocalPlaylistLoader.loadLocalPlaylist()');
        console.log('   Arquivo:', filename);
        console.log('╚═══════════════════════════════════════╝');
        
        try {
            // Tentar diferentes caminhos
            const possiblePaths = [
                `/playlists/${filename}`,
                `playlists/${filename}`,
                filename
            ];
            
            let response = null;
            let usedPath = null;
            
            for (const path of possiblePaths) {
                try {
                    console.log('🔍 Tentando:', path);
                    const r = await fetch(path);
                    if (r.ok) {
                        response = r;
                        usedPath = path;
                        console.log('✅ Encontrado em:', path);
                        break;
                    }
                } catch (e) {
                    console.log('❌ Falhou:', path);
                }
            }
            
            if (!response || !response.ok) {
                throw new Error(`Arquivo não encontrado: ${filename}`);
            }
            
            const content = await response.text();
            console.log('📄 Arquivo carregado:', content.length, 'caracteres');
            
            // Criar índice
            const index = this.createIndex(content, filename);
            console.log('✅ Índice criado:', index.totalChannels, 'canais');
            
            return index;
            
        } catch (error) {
            console.error('❌ Erro ao carregar playlist:', error);
            throw error;
        }
    },
    
    // ========================================
    // 🔍 CRIAR ÍNDICE (RÁPIDO - SEM CARREGAR TUDO)
    // ========================================
    createIndex(content, filename = null) {
        console.log('🔍 Criando índice da playlist...');
        const startTime = performance.now();
        
        const lines = content.split('\n');
        const index = {
            categories: {},  // { categoryName: { start: lineNum, end: lineNum, count: N } }
            lines: lines,
            totalChannels: 0,
            filename: filename
        };
        
        let currentCategory = 'Outros';
        let categoryChannels = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Detectar início de canal
            if (line.startsWith('#EXTINF')) {
                // Extrair categoria do group-title
                const groupMatch = line.match(/group-title="([^"]+)"/);
                const newCategory = groupMatch ? groupMatch[1] : 'Outros';
                
                // Se mudou de categoria, salvar estatísticas
                if (newCategory !== currentCategory) {
                    // Salvar categoria anterior
                    if (categoryChannels.length > 0) {
                        if (!index.categories[currentCategory]) {
                            index.categories[currentCategory] = {
                                start: categoryChannels[0],
                                end: categoryChannels[categoryChannels.length - 1],
                                count: categoryChannels.length
                            };
                        }
                    }
                    
                    // Nova categoria
                    currentCategory = newCategory;
                    categoryChannels = [i];
                } else {
                    categoryChannels.push(i);
                }
                
                index.totalChannels++;
            }
        }
        
        // Salvar última categoria
        if (categoryChannels.length > 0) {
            index.categories[currentCategory] = {
                start: categoryChannels[0],
                end: categoryChannels[categoryChannels.length - 1],
                count: categoryChannels.length
            };
        }
        
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(`✅ Índice criado em ${duration}s`);
        console.log(`📊 Total: ${index.totalChannels} canais em ${Object.keys(index.categories).length} categorias`);
        
        return index;
    },
    
    // ========================================
    // 📋 OBTER LISTA DE CATEGORIAS
    // ========================================
    getCategories(index) {
        const categories = Object.keys(index.categories).map(name => ({
            name,
            count: index.categories[name].count
        }));
        
        // Ordenar por nome
        return categories.sort((a, b) => a.name.localeCompare(b.name));
    },
    
    // ========================================
    // 📺 CARREGAR CANAIS DE UMA CATEGORIA (LAZY LOADING)
    // ========================================
    getCategoryChannels(index, categoryName, limit = 1000) {
        console.log('╔═══════════════════════════════════════╗');
        console.log('📺 LocalPlaylistLoader.getCategoryChannels()');
        console.log('   Categoria:', categoryName);
        console.log('   Limite:', limit);
        console.log('╚═══════════════════════════════════════╝');
        
        const category = index.categories[categoryName];
        
        if (!category) {
            console.warn('⚠️ Categoria não encontrada:', categoryName);
            return [];
        }
        
        const startLine = category.start;
        const endLine = category.end;
        
        console.log(`📊 Processando linhas ${startLine} até ${endLine}`);
        
        const channels = [];
        let currentName = '';
        let currentGroup = categoryName;
        
        for (let i = startLine; i <= endLine && i < index.lines.length && channels.length < limit; i++) {
            const line = index.lines[i].trim();
            
            if (line.startsWith('#EXTINF')) {
                // Extrair nome do canal
                const commaIdx = line.lastIndexOf(',');
                if (commaIdx !== -1) {
                    currentName = line.substring(commaIdx + 1).trim();
                }
                
                // Extrair grupo
                const groupMatch = line.match(/group-title="([^"]+)"/);
                if (groupMatch) {
                    currentGroup = groupMatch[1];
                }
                
            } else if (line.startsWith('http')) {
                // Linha de URL
                if (currentName && line.includes('://')) {
                    channels.push({
                        url: line,
                        name: currentName || 'Canal Desconhecido',
                        group: currentGroup
                    });
                }
                currentName = '';
            }
        }
        
        console.log(`✅ ${channels.length} canais carregados da categoria "${categoryName}"`);
        return channels;
    },
    
    // ========================================
    // 🌍 CARREGAR TODOS OS CANAIS (COM LIMITE)
    // ========================================
    getAllChannels(index, limit = 5000) {
        console.log('╔═══════════════════════════════════════╗');
        console.log('🌍 LocalPlaylistLoader.getAllChannels()');
        console.log('   Limite:', limit);
        console.log('╚═══════════════════════════════════════╝');
        
        const channels = [];
        let currentName = '';
        let currentGroup = 'Outros';
        
        for (let i = 0; i < index.lines.length && channels.length < limit; i++) {
            const line = index.lines[i].trim();
            
            if (line.startsWith('#EXTINF')) {
                // Extrair grupo
                const groupMatch = line.match(/group-title="([^"]+)"/);
                if (groupMatch) {
                    currentGroup = groupMatch[1];
                }
                
                // Extrair nome
                const commaIdx = line.lastIndexOf(',');
                if (commaIdx !== -1) {
                    currentName = line.substring(commaIdx + 1).trim();
                }
                
            } else if (line.startsWith('http')) {
                if (currentName && line.includes('://')) {
                    channels.push({
                        url: line,
                        name: currentName || 'Canal Desconhecido',
                        group: currentGroup
                    });
                }
                currentName = '';
            }
        }
        
        console.log(`✅ ${channels.length} canais carregados (todos)`);
        return channels;
    },
    
    // ========================================
    // 🔍 BUSCAR CANAIS POR NOME
    // ========================================
    searchChannels(index, query, limit = 100) {
        console.log('🔍 Buscando:', query);
        
        const lowerQuery = query.toLowerCase();
        const results = [];
        
        let currentName = '';
        let currentGroup = 'Outros';
        let currentUrl = '';
        
        for (let i = 0; i < index.lines.length && results.length < limit; i++) {
            const line = index.lines[i].trim();
            
            if (line.startsWith('#EXTINF')) {
                // Extrair grupo
                const groupMatch = line.match(/group-title="([^"]+)"/);
                if (groupMatch) {
                    currentGroup = groupMatch[1];
                }
                
                // Extrair nome
                const commaIdx = line.lastIndexOf(',');
                if (commaIdx !== -1) {
                    currentName = line.substring(commaIdx + 1).trim();
                }
                
            } else if (line.startsWith('http')) {
                currentUrl = line;
                
                // Verificar se o nome contém a query
                if (currentName.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        url: currentUrl,
                        name: currentName,
                        group: currentGroup
                    });
                }
                
                currentName = '';
                currentUrl = '';
            }
        }
        
        console.log(`✅ ${results.length} resultados encontrados para "${query}"`);
        return results;
    },
    
    // ========================================
    // 📊 ESTATÍSTICAS DO ÍNDICE
    // ========================================
    getStats(index) {
        const stats = {
            totalChannels: index.totalChannels,
            totalCategories: Object.keys(index.categories).length,
            filename: index.filename,
            categories: Object.entries(index.categories).map(([name, data]) => ({
                name,
                count: data.count
            })).sort((a, b) => b.count - a.count) // Ordenar por quantidade
        };
        
        return stats;
    }
};

// ========================================
// 🧪 FUNÇÃO DE TESTE
// ========================================
window.testLocalPlaylistLoader = async () => {
    console.log('╔═══════════════════════════════════════╗');
    console.log('🧪 TESTE DO LOCAL PLAYLIST LOADER');
    console.log('╚═══════════════════════════════════════╝');
    
    try {
        // Verificar se PlaylistConfig existe
        if (typeof PlaylistConfig === 'undefined') {
            console.error('❌ PlaylistConfig não encontrado!');
            return;
        }
        
        // Pegar primeira playlist disponível
        const testPlaylist = PlaylistConfig.availablePlaylists?.[0];
        
        if (!testPlaylist) {
            console.error('❌ Nenhuma playlist disponível em PlaylistConfig.availablePlaylists');
            return;
        }
        
        console.log('📁 Testando com:', testPlaylist.filename);
        
        // Carregar e indexar
        const index = await LocalPlaylistLoader.loadLocalPlaylist(testPlaylist.filename);
        
        // Mostrar estatísticas
        const stats = LocalPlaylistLoader.getStats(index);
        console.log('📊 Estatísticas:', stats);
        
        // Testar carregamento de categoria
        if (stats.categories.length > 0) {
            const firstCategory = stats.categories[0];
            console.log(`\n📺 Testando categoria: ${firstCategory.name}`);
            
            const channels = LocalPlaylistLoader.getCategoryChannels(
                index, 
                firstCategory.name, 
                10
            );
            
            console.log('✅ Primeiros 10 canais:', channels);
        }
        
        console.log('\n╚═══════════════════════════════════════╝');
        console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
        
    } catch (error) {
        console.error('❌ ERRO NO TESTE:', error);
        console.error('Stack:', error.stack);
    }
};

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalPlaylistLoader;
}

console.log('✅ LocalPlaylistLoader carregado (v2.1 - SISTEMA COMPLETO)');