// 페이지 내 모든 카드 요소를 선택하여 비디오 재생 및 정지 이벤트 처리
const cards = document.querySelectorAll('.card'); // 모든 카드 요소 선택
cards.forEach(card => {
    const video = card.querySelector('.card-video'); // 각 카드 내의 비디오 요소 선택
    card.addEventListener('mouseenter', () => {
        video.style.display = 'block'; // 비디오 요소를 보이게 설정
        video.play(); // 비디오 재생 시작
    });
    card.addEventListener('mouseleave', () => {
        video.pause(); // 비디오 일시정지
        video.currentTime = 0; // 비디오 재생 위치를 처음으로 돌림
        video.style.display = 'none'; // 비디오 요소를 다시 숨김
    });
});

// 페이지 내 각 카드 클릭 시 이동 이벤트 처리
document.getElementById('advertiserCard').addEventListener('click', function() {
    window.location.href = 'advertiser_login.html'; // 광고주 로그인 페이지로 이동
});

document.getElementById('influencerCard').addEventListener('click', function() {
    window.location.href = 'influencer_login.html'; // 인플루언서 로그인 페이지로 이동
});

document.getElementById('userCard').addEventListener('click', function() {
    // 일반 사용자 로그인 페이지로 이동 (원하는 URL로 대체 가능)
    alert('일반 사용자 페이지로 이동하는 기능을 추가해주세요.');
});
