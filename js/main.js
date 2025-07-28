
function play() {
  const url = document.getElementById('playlist-url').value;
  const video = document.getElementById('player');
  if (url) {
    video.src = url;
  } else {
    alert("Informe uma URL de playlist .m3u8");
  }
}
