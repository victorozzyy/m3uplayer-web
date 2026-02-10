// playlist-config.js - Configurações de playlists separadas
// Versão 1.0 - Facilita manutenção sem reescrever funções

const PlaylistConfig = {
    // ========================================
    // 📡 PLAYLISTS REMOTAS (GitHub Raw)
    // ========================================
    remotePlaylistsConfig: [
        {
            name: "🏆 Esportes 1",
            description: "Canais esportivos em alta definição",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/esportes.m3u8",
            category: "Esportes"
        },
        {
            name: "🏆 Esportes 2",
            description: "Canais esportivos em alta definição",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_esportes.m3u",
            category: "Esportes"
        },
        {
            name: "🎬 Canais 24 Hs",
            description: "Canais variados de alta qualidade",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_24h.m3u",
            category: "Filmes e Series"
        },
        {
            name: "🎬 Canais",
            description: "Canais variados de alta qualidade",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/canais24h.m3u8",
            category: "Filmes"
        },
        {
            name: "🎬 Filmes1",
            description: "Canais variados de alta qualidade",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_mp4_part1.m3u",
            category: "Mp4"
        },
        {
            name: "🎬 Series1",
            description: "Canais variados de alta qualidade",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/seriesmp4.m3u8",
            category: "Mp4"
        },
        {
            name: "🎬 Filmes e Series",
            description: "Canais variados de alta qualidade",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/filmes-series.m3u8",
            category: "Mp4"
        },
        {
            name: "🎬 Filmes e Series2",
            description: "Canais variados de alta qualidade",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_filmes_series.m3u",
            category: "Filmes e Series"
        },
        {
            name: "🎬 Series2 mp4",
            description: "Big sequencia, series boas.",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists2/series2-mp4.m3u8",
            category: "Mp4"
        },
        {
            name: "🎬 Series3 mp4",
            description: "Rancho, Dexter, Suits, Justfield",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists2/series3-mp4.m3u8",
            category: "Mp4"
        },
        {
            name: "🎬 Filmes2 mp4",
            description: "Canais variados de alta qualidade",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists2/filmes2-mp4.m3u8",
            category: "Mp4"
        },
        {
            name: "🎬 Canais2 mp4",
            description: "Canais variados de alta qualidade",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/canais2.m3u8",
            category: "Mp4"
        },
        {
            name: "🎬 Mp4 1",
            description: "Canais variados de alta qualidade",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_mp4_part1.m3u",
            category: "Mp4"
        },
        {
            name: "🎬 Mp4 2",
            description: "Canais variados de alta qualidade",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_mp4_part2.m3u",
            category: "Mp4"
        },
        {
            name: "🎬 Mp4 3",
            description: "Canais variados de alta qualidade",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_mp4_part3.m3u",
            category: "Filmes"
        },
        {
            name: "🎬 Mp4 4",
            description: "Canais variados de alta qualidade",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_mp4_part4.m3u",
            category: "Filmes"
        },
        {
            name: "🎭 Educativo",
            description: "Canais de séries, filmes e shows",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/educativo.m3u8",
            category: "Pt"
        },
        {
            name: "🎭 Aqueles",
            description: "Canais de séries, filmes e shows",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/aqules.m3u8",
            category: "Pt"
        },
        {
            name: "🎭 Educativo3",
            description: "Canais de séries, filmes e shows",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/new.m3u8",
            category: "Pt"
        },
        {
            name: "🎭 teste",
            description: "Canais de séries, filmes e shows",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/teste.m3u8",
            category: "Pt"
        },
        {
            name: "🎭 Funcional00",
            description: "Canais de séries, filmes e shows",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/teste2.m3u8",
            category: "Pt"
        },
        {
            name: "🎭 Funcional Mp4",
            description: "Canais de séries, filmes e shows",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/putria2.m3u8",
            category: "Pt"
        },
        {
            name: "🎭 Funcional4 Mp4",
            description: "Canais de séries, filmes e shows",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/putria3.m3u8",
            category: "Pt"
        },
        {
            name: "🎭 Funcional Pov Mp4",
            description: "Canais de séries, filmes e shows",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/putria4.m3u8",
            category: "Pt"
        },
        {
            name: "🎭 Funcional3 Mp4",
            description: "Canais de séries, filmes e shows",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/putria.m3u8",
            category: "Pt"
        },
        {
            name: "🎭 NovoPono Instavel",
            description: "Conteúdo seguro para crianças",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists2/novopono.m3u8",
            category: "Pt"
        },
        {
            name: "👶 Desenhos",
            description: "Conteúdo seguro para crianças",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists/playlist_desenhos.m3u",
            category: "Infantil"
        },
        {
            name: "Auto 01",
            description: "Canais de séries, filmes e shows",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists2/listaauto001.m3u",
            category: "Auto Update RAW"
        },
        {
            name: "Auto 02",
            description: "Canais de séries, filmes e shows",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists2/listaauto002.m3u",
            category: "Auto Update RAW"
        },
        {
            name: "Auto 03",
            description: "Canais de séries, filmes e shows",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists2/listaauto003.m3u",
            category: "Auto Update RAW"
        },
        {
            name: "Auto 04",
            description: "Conteúdo seguro para crianças",
            url: "https://raw.githubusercontent.com/victorozzyy/m3uplayer-web/refs/heads/main/playlists2/listaauto004.m3u",
            category: "Auto Update RAW"
        },
    ],

    // ========================================
    // 📁 PLAYLISTS LOCAIS (pasta /playlists/)
    // ========================================
    availablePlaylists: [
        { name: "24Hs", filename: "playlist_24h.m3u" },
        { name: "esportes", filename: "esportes.m3u8" },
        { name: "Mp4", filename: "playlist_mp4_part4.m3u" },
        { name: "fs", filename: "filmes-series.m3u8" },
        { name: "fs2", filename: "playlist_filmes_series.m3u" },
        { name: "pt", filename: "putria3.m3u8" },
        { name: "tv", filename: "tv_channels_994995942_plus.m3u" },
        { name: "tv2", filename: "tv_channels_164485614_plus.m3u" },
        { name: "teste", filename: "test.m3u" }
    ],

    // ========================================
    // 🔥 MINHAS LISTAS (personalizadas com CORS)
    // ========================================
    minhasListasConfig: [
        {
            name: "🔥 Lista 01",
            description: "Lista 04",
            url: "http://xocu.in/get.php?username=994995942&password=y751261z&type=m3u_plus",
            needsCors: true
        },
        {
            name: "🔥 Minha 02",
            description: "Lista 01",
            url: "https://kinder5.live/get.php?username=164485614&password=530298439&type=m3u_plus",
            needsCors: true
        },
        {
            name: "🔥 Minha 03",
            description: "Lista 01",
            url: "http://kinder5.live:80/get.php?username=707434249&password=697551514&type=m3u_plus",
            needsCors: true
        },
        {
            name: "🔥 Lista 04",
            description: "Lista 04",
            url: "http://kinder5.live:80/get.php?username=688306193&password=033189514&type=m3u_plus",
            needsCors: true
        },
        {
            name: "🔥 Minha 05",
            description: "Lista 01",
            url: "http://kinder5.live:80/get.php?username=460757764&password=835992209&type=m3u_plus",
            needsCors: true
        },
        {
            name: "🔥 Minha 06",
            description: "Lista 01",
            url: "http://kinder5.live:80/get.php?username=34211473179&password=88284437124&type=m3u_plus",
            needsCors: true
        },
        {
            name: "🔥 Minha 07",
            description: "Lista 01",
            url: "http://kinder5.live:80/get.php?username=534910100&password=232065201&type=m3u_plus",
            needsCors: true
        },
        {
            name: "🔥 Lista 08",
            description: "Lista 04",
            url: "http://kinder5.live:80/get.php?username=82647069012&password=34033899350&type=m3u_plus",
            needsCors: true
        },
        {
            name: "🔥 Minha 09",
            description: "Lista 01",
            url: "http://kinder5.live:80/get.php?username=661282206&password=318344838&type=m3u_plus",
            needsCors: true
        },
        {
            name: "🔥 Minha 10",
            description: "Lista 01",
            url: "http://kinder5.live:80/get.php?username=094279188&password=062038990&type=m3u_plus",
            needsCors: true
        },
        {
            name: "🔥 Minha 11",
            description: "Lista 02",
            url: "http://kinder5.live:80/get.php?username=23156616732&password=42382360350&type=m3u_plus",
            needsCors: true
        },
        {
            name: "🔥 Anon",
            description: "Lista 01",
            url: "http://felas87dz.icu:80/get.php?username=Anonymous100&password=Hacker100&type=m3u_plus",
            needsCors: true
        },
        {
            name: "🔥 PoAtt",
            description: "Lista 02",
            url: "http://xocu.in/get.php?username=427895596&password=B312H8244k&type=m3u_plus",
            needsCors: true
        },
        {
            name: "🔥 PoAtt2",
            description: "Lista 02",
            url: "http://xocu.in/get.php?username=994995942&password=y751261z&type=m3u_plus",
            needsCors: true
        }
    ],

    // ========================================
    // 🛠️ PROXIES CORS (fallback automático)
    // ========================================
    corsProxies: [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        'https://api.codetabs.com/v1/proxy?quest='
    ]
};

// Log de carregamento
console.log('✅ PlaylistConfig carregado (v1.0)');
console.log(`📊 ${PlaylistConfig.remotePlaylistsConfig.length} playlists remotas`);
console.log(`📁 ${PlaylistConfig.availablePlaylists.length} playlists locais`);
console.log(`🔥 ${PlaylistConfig.minhasListasConfig.length} minhas listas`);

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlaylistConfig;
}