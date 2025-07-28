function carregarPlaylist() {
    const urlInput = document.getElementById('playlist-url').value.trim();
    const fileInput = document.getElementById('playlist-file').files[0];
    const output = document.getElementById('output');

    if (urlInput) {
        output.textContent = 'Reproduzindo da URL:\n' + urlInput;
        return;
    }

    if (fileInput) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const content = e.target.result;
            const urls = parseM3U(content);
            if (urls.length > 0) {
                output.textContent = 'Primeiro link do arquivo:\n' + urls[0];
            } else {
                output.textContent = 'Nenhum link válido encontrado no arquivo.';
            }
        };
        reader.readAsText(fileInput);
        return;
    }

    output.textContent = 'Informe uma URL ou selecione um arquivo.';
}

function parseM3U(text) {
    const lines = text.split(/\r?\n/);
    return lines.filter(line => line && !line.startsWith('#') && (line.startsWith('http://') || line.startsWith('https://')));
}
