document.addEventListener("DOMContentLoaded", function() {
    const videoItems = document.querySelectorAll('.video-item iframe');

    // Intersection Observer 설정
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const iframe = entry.target;

            // 유튜브 iframe의 API를 사용하여 영상 제어
            const player = new YT.Player(iframe);

            if (entry.isIntersecting) {
                // 화면에 보이면 영상 재생
                player.playVideo();
            } else {
                // 화면을 벗어나면 영상 멈춤
                player.pauseVideo();
            }
        });
    }, {
        threshold: 0.5 // 50% 이상 보이면 재생
    });

    videoItems.forEach(video => {
        observer.observe(video);
    });
});

// 유튜브 API 로드
function onYouTubeIframeAPIReady() {
    // 유튜브 API 로드를 위한 기본 함수
}
