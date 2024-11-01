document.addEventListener("DOMContentLoaded", async () => {
    const ad_id = localStorage.getItem('ad_id');
    let chatRoom_id = null; // 전역 변수로 chatRoom_id 설정

    if (!ad_id) {
        alert('로그인이 필요합니다. 광고주 ID를 찾을 수 없습니다.');
        window.location.href = '/advertiser_login.html';
        return;
    }

    // 광고주 채팅방 목록 불러오기
    async function loadChatRooms() {
        try {
            const response = await fetch(`http://localhost:3000/api/chat/advertiser`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ad_id })
            });
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            const chatRooms = data.chatRooms;
            console.log('Chat Rooms:', chatRooms); // 채팅방 목록 확인 로그
            displayChatRooms(chatRooms);
        } catch (error) {
            console.error('채팅방 목록 불러오기 오류:', error);
        }
    }

    function displayChatRooms(chatRooms) {
        const chatRoomContainer = document.getElementById('chatRoomContainer');
        chatRoomContainer.innerHTML = '';
        
        chatRooms.forEach(room => {
            const roomElement = document.createElement('button');
            roomElement.textContent = `인플루언서 ID: ${room.influencer_id}`;
            roomElement.onclick = () => {
                selectChatRoom(room.chatRoom_id);
                console.log('Button clicked for Chat Room ID:', room.chatRoom_id); // 클릭 시 chatRoom_id 확인 로그
            };
            chatRoomContainer.appendChild(roomElement);
        });
    }

    async function selectChatRoom(id) {
        chatRoom_id = id; // chatRoom_id 설정
        console.log('Selected Chat Room ID:', chatRoom_id); // 선택된 chatRoom_id 확인 로그
        await loadMessages();
    }

    async function loadMessages() {
        try {
            const response = await fetch(`http://localhost:3000/api/chat/messages/${chatRoom_id}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            displayMessages(data.messages); 
        } catch (error) {
            console.error('메시지 로딩 중 오류:', error);
        }
    }

    function displayMessages(messages) {
        const messageContainer = document.getElementById('messageContainer');
        messageContainer.innerHTML = '';
        messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.classList.add(msg.sender_id === ad_id ? 'sent' : 'received');
            messageElement.innerText = msg.content;
            messageContainer.appendChild(messageElement);
        });
    }

    async function sendMessage() {
        const content = document.getElementById('messageInput').value.trim();
        console.log('Attempting to send message:', content, 'Chat Room ID:', chatRoom_id); // sendMessage 호출 로그

        if (!content || !chatRoom_id) {
            console.warn('Invalid chatRoom_id or empty message content:', { chatRoom_id, content });
            return alert('메시지를 입력하세요.');
        }

        try {
            await fetch('http://localhost:3000/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatRoom_id, sender_id: ad_id, receiver_id: "인플루언서 ID", content })
            });
            document.getElementById('messageInput').value = '';
            loadMessages();
        } catch (error) {
            console.error('메시지 전송 중 오류:', error);
        }
    }

    loadChatRooms();
    window.sendMessage = sendMessage;
});
