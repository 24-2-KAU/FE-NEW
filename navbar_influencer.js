document.addEventListener("DOMContentLoaded", function () {
    const pageName = document.body.dataset.page; // 현재 페이지를 식별하기 위해 body의 data-page 속성 사용

    const navHTML = `
    <div class="nav-container">
        <button class="nav-button ${pageName === 'home' ? 'active' : ''}" onclick="location.href='influencer_home.html'">홈</button>
        <button class="nav-button ${pageName === 'customizedContent' ? 'active' : ''}" onclick="location.href='customized_content.html'">맞춤컨텐츠</button>
        <button class="nav-button ${pageName === 'messenger' ? 'active' : ''}" onclick="location.href='influencer_messenger.html'">연락중인 메신저</button>
        <button class="nav-button ${pageName === 'myPage' ? 'active' : ''}" onclick="location.href='influencer_my_page.html'">마이페이지</button>
        <button class="nav-button ${pageName === 'notifications' ? 'active' : ''}" onclick="location.href='influencer_notifications.html'">알림</button>
    </div>`;
    document.body.insertAdjacentHTML('afterbegin', navHTML);
});
