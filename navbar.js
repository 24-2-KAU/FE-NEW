document.addEventListener("DOMContentLoaded", function () {
    // 로그인 상태 확인
    const ad_id = localStorage.getItem('ad_id');  // 로컬 스토리지에서 ad_id 가져옴
    if (!ad_id) {
        alert('로그인이 필요합니다.');
        window.location.href = 'advertiser_login.html';  // 로그인 페이지로 리디렉션
    } else {
        console.log("Logged in with ad_id:", ad_id);  // 디버깅 용도, ad_id 확인
    }

    // 현재 페이지를 식별하기 위해 body의 data-page 속성 사용
    const pageName = document.body.dataset.page;

    const navHTML = `
    <div class="nav-container">
        <button class="nav-button ${pageName === 'home' ? 'active' : ''}" onclick="location.href='/advertiser_home.html'">홈</button>
        <button class="nav-button ${pageName === 'findInfluencers' ? 'active' : ''}" onclick="location.href='/find_influencers.html'">인플루언서 찾기</button>
        <button class="nav-button ${pageName === 'uploadProduct' ? 'active' : ''}" onclick="location.href='/upload_product.html'">상품 올리기</button>
        <button class="nav-button ${pageName === 'messenger' ? 'active' : ''}" onclick="location.href='/chatting/advertiser_messenger.html'">연락중인 메신저</button>
        <button class="nav-button ${pageName === 'myPage' ? 'active' : ''}" onclick="location.href='/my_page.html'">마이페이지</button>
        <button class="nav-button ${pageName === 'notifications' ? 'active' : ''}" onclick="location.href='/notifications.html'">알림</button>
        <button class="nav-button ${pageName === 'influencerList' ? 'active' : ''}" onclick="location.href='/influencer_list.html'">가입된 인플루언서 목록</button>
        <button class="nav-button ${pageName === 'main' ? 'active' : ''}" onclick="location.href='/index.html'">메인</button>
        <button class="nav-button" id="logoutButton">로그아웃</button>
    </div>`;
    
    document.body.insertAdjacentHTML('afterbegin', navHTML);

    // 로그아웃 버튼 클릭 이벤트 처리
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('ad_id');  // 로컬 스토리지에서 광고주 ID 삭제
        window.location.href = 'advertiser_login.html';  // 로그인 페이지로 이동
    });
});
