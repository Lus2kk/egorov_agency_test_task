var video = document.getElementById('heroVideo');
var playBtn = document.querySelector('.play_video_btn');

if (video) {
  video.removeAttribute('loop');

  video.addEventListener('ended', function () {
    video.pause();
    video.currentTime = video.duration;
  });
}

if (playBtn && video) {
  playBtn.addEventListener('click', function () {
    video.currentTime = 0;
    video.play();
  });
}