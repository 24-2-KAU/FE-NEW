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
    </div>
    <p>Logged in as: ${email}</p>`;
    
    document.body.insertAdjacentHTML('afterbegin', navHTML);
});
