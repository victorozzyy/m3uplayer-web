// FilterModule.js - Filtro automático oculto (atualizado para filtrar group/category)

const FilterModule = {
    // Palavras proibidas (tudo minúsculo)
    blockedWords: [
        "porno", "porn",
        "adulto", "adultos", "adult", "adults",
        "+18", "18+", "xxx", "hot"
    ],

    // Extensões que serão aceitas
    allowedExtensions: [
        ".mp4", ".mkv", ".avi", ".mov", ".webm"
    ],

    init() {
        console.log("🛡️ FilterModule inicializado (filtros automáticos ocultos)");
    },

    // Verifica se contém palavra proibida em um texto (null-safe)
    containsBlocked(text) {
        if (!text) return false;
        const lower = String(text).toLowerCase();
        return this.blockedWords.some(w => lower.includes(w));
    },

    // Verifica extensão do arquivo
    isAllowedExtension(url) {
        if (!url) return false;
        const lower = String(url).toLowerCase().split('?')[0].split('#')[0];
        return this.allowedExtensions.some(ext => lower.endsWith(ext));
    },

    // Função principal de filtragem (filtra name, url e group)
    applyFilters(playlist) {
        if (!Array.isArray(playlist) || playlist.length === 0) {
            return playlist;
        }

        console.log(`🛡️ Aplicando filtros automáticos (${playlist.length} canais originais)`);

        const filtered = playlist.filter(ch => {
            const name = ch.name || "";
            const url = ch.url || "";
            const group = ch.group || "";

            // Bloqueio por palavras proibidas no nome, url ou categoria
            if (this.containsBlocked(name)) return false;
            if (this.containsBlocked(url)) return false;
            if (this.containsBlocked(group)) return false;

            // Bloqueio por token "18" com + ou termos como "18 anos"
            const groupLower = String(group).toLowerCase();
            if (/\b18\s*\+?\b/.test(groupLower) || /\b18\s*anos\b/.test(groupLower)) return false;

            // Bloqueio de extensões (aceita só vídeos)
            if (!this.isAllowedExtension(url)) return false;

            return true;
        });

        console.log(`🛡️ Filtros aplicados → ${filtered.length} canais restantes`);
        return filtered;
    }
};

// CommonJS export (se necessário)
if (typeof module !== "undefined" && module.exports) {
    module.exports = FilterModule;
}
