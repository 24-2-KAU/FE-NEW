import { initializeWebSocket, closeWebSocket, sendMessage as socketSendMessage, onReceiveMessage } from './socketClient.js';

let currentWebSocket = null; // 현재 WebSocket 연결 상태 추적

document.addEventListener("DOMContentLoaded", () => {
    const email = localStorage.getItem('email');
    if (!email) {
        alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
        return;
    }

    loadFriendList(); // 친구 목록 로드

    const sendButton = document.getElementById('sendButton');
    if (sendButton) {
        sendButton.addEventListener('click', () => {
            const chatRoomId = getChatRoomIdFromURL();
            if (!chatRoomId) {
                alert("채팅방이 선택되지 않았습니다.");
                return;
            }
            handleSendMessage(chatRoomId);
        });
    }
});


function loadFriendList() {
    const userId = localStorage.getItem('email');
    fetch(`/api/chat/friends?userId=${userId}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error('친구 목록을 가져오는 데 실패했습니다.');
            }
            return response.json();
        })
        .then((data) => {
            const friendListContainer = document.getElementById('friendListContainer');
            friendListContainer.innerHTML = '';

            data.friends.forEach((friend) => {
                const friendItem = document.createElement('li');
                friendItem.textContent = friend.friend_id;

                friendItem.addEventListener('click', () => {
                    handleFriendClick(friend.friend_id);
                });

                friendListContainer.appendChild(friendItem);
            });
        })
        .catch((error) => {
            console.error('친구 목록 로드 중 오류:', error);
        });
}


function handleFriendClick(friendId) {
    const userId = localStorage.getItem('email');

    // 채팅방 ID 요청
    fetch(`/api/chat/chatroom?userId=${userId}&friendId=${friendId}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error('채팅방 정보를 가져오는 데 실패했습니다.');
            }
            return response.json();
        })
        .then((data) => {
            const chatRoomId = data.chatRoomId;

            if (!chatRoomId) {
                alert('채팅방을 찾을 수 없습니다.');
                return;
            }

            // 기존 WebSocket 연결 닫기
            if (currentWebSocket) {
                closeWebSocket();
                currentWebSocket = null;
            }

            // 새로운 WebSocket 연결 초기화
            currentWebSocket = initializeWebSocket(chatRoomId);

            // URL 업데이트
            window.history.pushState({}, '', `/chatting/influencer_messenger.html?chatRoomId=${chatRoomId}`);

            // 채팅 메시지 로드
            loadChatMessages(chatRoomId);

            // 메시지 수신 처리
            onReceiveMessage((data) => {
                if (data.type === 'chatMessage') {
                    displayMessage({
                        sender_id: data.sender_id,
                        content: data.message,
                        sent_at: data.sent_at || new Date().toLocaleTimeString(),
                    });
                } else {
                    console.warn('알 수 없는 메시지 유형:', data);
                }
            });
        })
        .catch((error) => {
            console.error('채팅방 이동 중 오류:', error);
        });
}




function getChatRoomIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('chatRoomId');
}

function handleSendMessage(chatRoomId) {
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    const senderId = localStorage.getItem('email');
    const receiveId = extractReceiveIdFromChatRoom(chatRoomId);

    if (!content) {
        alert("메시지를 입력하세요.");
        return;
    }

    if (!chatRoomId || !senderId || !receiveId) {
        alert("필수 데이터(chatRoomId, senderId 또는 receiveId)가 누락되었습니다.");
        console.error("누락된 데이터:", { chatRoomId, senderId, receiveId });
        return;
    }

    socketSendMessage(chatRoomId, content, receiveId);

    displayMessage({
        sender_id: senderId,
        content: content,
        sent_at: new Date().toLocaleTimeString(),
    });

    messageInput.value = ''; // 입력 필드 초기화
}

function extractReceiveIdFromChatRoom(chatRoomId) {
    const userId = localStorage.getItem('email');
    if (!chatRoomId || !userId) return null;

    const ids = chatRoomId.split('_');
    return ids[0] === userId ? ids[1] : ids[0];
}

function loadChatMessages(chatRoomId) {
    fetch(`/api/chat/${chatRoomId}/messages`)
        .then((response) => {
            if (!response.ok) {
                throw new Error('채팅 메시지를 가져오는 데 실패했습니다.');
            }
            return response.json();
        })
        .then((data) => {
            const messages = data.messages || [];
            const messageContainer = document.getElementById('messageContainer');
            messageContainer.innerHTML = '';

            messages.forEach((message) => {
                displayMessage(message);
            });
        })
        .catch((error) => {
            console.error('채팅 메시지 로드 중 오류:', error);
        });
}

function displayMessage(message) {
    const messageContainer = document.getElementById('messageContainer');
    const messageElement = document.createElement('div');
    messageElement.classList.add(message.sender_id === localStorage.getItem('email') ? 'sent' : 'received');
    messageElement.innerHTML = `
        <div class="message-content">${message.content}</div>
        <div class="message-time">${message.sent_at}</div>
    `;
    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}
