document.addEventListener("DOMContentLoaded", function () {
    const pageName = document.body.dataset.page; // 현재 페이지를 식별하기 위해 body의 data-page 속성 사용

    const email = localStorage.getItem('email');  // 로컬 스토리지에서 ad_id 가져옴
    if (!email) {
        alert('로그인이 필요합니다.');
        window.location.href = 'influencer_login.html';  // 로그인 페이지로 리디렉션
    } else {
        console.log("Logged in with ad_id:", email);  // 디버깅 용도, ad_id 확인
    }
    
    const navHTML = `
    <div class="nav-container">
        <button class="nav-button ${pageName === 'home' ? 'active' : ''}" onclick="location.href='influencer_home.html'">홈</button>
        <button class="nav-button ${pageName === 'customizedContent' ? 'active' : ''}" onclick="location.href='customized_content.html'">맞춤컨텐츠</button>
        <button class="nav-button ${pageName === 'messenger' ? 'active' : ''}" onclick="location.href='influencer_messenger.html'">연락중인 메신저</button>
        <button class="nav-button ${pageName === 'myPage' ? 'active' : ''}" onclick="location.href='influencer_my_page.html'">마이페이지</button>
        <button class="nav-button ${pageName === 'notifications' ? 'active' : ''}" onclick="location.href='influencer_notifications.html'">알림</button>
        <button class="nav-button ${pageName === 'main' ? 'active' : ''}" onclick="location.href='index.html'">메인</button>
        <button class="nav-button" id="logoutButton">로그아웃</button>
    </div>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', navHTML);

    // 로그아웃 버튼 클릭 이벤트 처리
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('email');  // 로컬 스토리지에서 광고주 ID 삭제
        window.location.href = 'influencer_login.html';  // 로그인 페이지로 이동
    });
});
