document.addEventListener("DOMContentLoaded", () => {
    console.log('인플루언서 데이터 요청 시작');

    fetch('http://127.0.0.1:3000/api/influencers')
        .then(response => response.json())
        .then(data => {
            console.log('인플루언서 데이터 성공적으로 로드:', data);

            const influencerList = document.getElementById('influencerList');
            influencerList.innerHTML = '';

            data.forEach(influencer => {
                const influencerItem = document.createElement('div');
                influencerItem.classList.add('influencer-item');
                influencerItem.innerHTML = `
                    <h3>${influencer.name}</h3>
                    <p>Email: ${influencer.email}</p>
                    <button class="chat-button" data-email="${influencer.email}">채팅하기</button>
                `;
                influencerList.appendChild(influencerItem);
            });

            // "채팅하기" 버튼 클릭 이벤트 리스너 추가
            document.querySelectorAll('.chat-button').forEach(button => {
                button.addEventListener('click', (event) => {
                    const email = event.target.getAttribute('data-email');
                    openChatRoom(email);
                });
            });
        })
        .catch(error => {
            console.error('데이터를 불러오는 중 오류 발생:', error);
            document.getElementById('influencerList').innerHTML = '<p>데이터를 불러오지 못했습니다.</p>';
        });
});

function openChatRoom(email) {
    const chatRoomId = `room_${email}`;
    localStorage.setItem('chatRoomId', chatRoomId); // 로컬 저장소에 채팅방 ID 저장
    window.location.href = './chat.html'; // 채팅방 페이지로 이동
}
