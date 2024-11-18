let ws; // WebSocket 인스턴스
let reconnectTimeout = 5000; // 재연결 간격 (밀리초)
let reconnectAttempts = 0;

// WebSocket 초기화 함수
export function initializeWebSocket(chatRoomId) {
    if (!chatRoomId || chatRoomId === "generated_chatRoomId") {
        console.error("유효하지 않은 Chat Room ID:", chatRoomId);
        return null;
    }
    const wsUrl = `ws://localhost:3000?chatRoomId=${chatRoomId}`;
    const ws = new WebSocket(wsUrl);
    //ws = new WebSocket('ws://localhost:3000'); // WebSocket 서버 URL

    ws.onopen = () => {
        console.log(`WebSocket 연결이 열렸습니다. Chat Room ID: ${chatRoomId}`);
        reconnectAttempts = 0;

        const payload = {
            type: 'joinChat',
            chatRoom_id: chatRoomId, // 서버와 일치하도록 변경
            message: '사용자가 채팅방에 입장했습니다.'
        };

        console.log('채팅방 입장 메시지 전송:', JSON.stringify(payload));
        ws.send(JSON.stringify(payload));
    };

    ws.onerror = (error) => {
        console.error('WebSocket 오류 발생:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket 연결이 종료되었습니다.');
        if (reconnectAttempts < 5) {
            reconnectAttempts++;
            console.log('WebSocket 재연결 시도 중...');
            setTimeout(() => initializeWebSocket(chatRoomId), reconnectTimeout);
        } else {
            console.error('WebSocket 재연결 실패');
        }
    };

    return ws;
}

// 메시지 전송 함수
export function sendMessage(chatRoomId, message, receiveId) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error("WebSocket 연결 상태가 열려 있지 않습니다.");
        alert("WebSocket 연결이 끊어졌습니다. 다시 연결해 주세요.");
        return;
    }

    const senderId = localStorage.getItem('email') || localStorage.getItem('ad_id');
    if (!senderId) {
        console.error("sender_id가 null입니다. localStorage에 'email' 또는 'ad_id'가 설정되어 있는지 확인하세요.");
        alert("로그인 정보가 유효하지 않습니다. 다시 로그인해주세요.");
        return;
    }

    const payload = {
        type: 'chatMessage',
        sender_id: senderId, // email 또는 ad_id 사용
        chatRoom_id: chatRoomId,
        receiver_id: receiveId,
        message: message
    };

    ws.send(JSON.stringify(payload));
    console.log(`메시지 전송: ${JSON.stringify(payload)}`);
}

// WebSocket 메시지 수신 처리
export function onReceiveMessage(callback) {
    if (!ws) {
        console.error('WebSocket 연결이 초기화되지 않았습니다.');
        return;
    }
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
    
            if (!data.type) {
                console.warn('알 수 없는 메시지 유형:', data);
                return;
            }
    
            switch (data.type) {
                case 'chatMessage':
                    displayMessage({
                        sender_id: data.sender_id,
                        content: data.message,
                        sent_at: data.sent_at || new Date().toLocaleTimeString(),
                    });
                    break;
    
                case 'info':
                    console.log(`정보 메시지: ${data.message}`);
                    break;
    
                default:
                    console.warn('알 수 없는 메시지 유형:', data);
            }
        } catch (error) {
            console.error('WebSocket 메시지 처리 중 오류:', error, '수신된 데이터:', event.data);
        }
    };
    
}
export function joinChatRoom(chatRoomId) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        initializeWebSocket(chatRoomId);
    }

    document.getElementById('sendButton').addEventListener('click', () => {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        const receiveId = extractReceiveIdFromChatRoom(chatRoomId);

        if (!message) {
            alert("메시지를 입력하세요!");
            return;
        }

        if (!receiveId) {
            console.error("수신자 ID가 누락되었습니다.");
            return;
        }

        sendMessage(chatRoomId, message, receiveId);
        messageInput.value = ''; // 입력 필드 초기화
    });
}

export function closeWebSocket() {
    if (ws) {
        ws.close();
        console.log('WebSocket 연결이 종료되었습니다.');
        ws = null;
    } else {
        console.warn('종료할 WebSocket 연결이 없습니다.');
    }
}


function extractReceiveIdFromChatRoom(chatRoomId) {
    const userId = localStorage.getItem('email');
    const ids = chatRoomId.split('_');
    return ids[0] === userId ? ids[1] : ids[0];
}




// // 메시지를 화면에 표시하는 함수
// function displayMessage(sender, message, time) {
//     const messageContainer = document.getElementById('messageContainer');
//     const messageElement = document.createElement('div');
//     messageElement.classList.add('message');
//     messageElement.innerHTML = `
//         <strong>${sender}</strong> <span>${time}</span>
//         <p>${message}</p>
//     `;
//     messageContainer.appendChild(messageElement);
//     messageContainer.scrollTop = messageContainer.scrollHeight; // 스크롤을 맨 아래로
// }

// export function joinChatRoom(chatRoomId) {
//     if (!ws || ws.readyState !== WebSocket.OPEN) {
//         initializeWebSocket(chatRoomId);
//     }

//     document.getElementById('sendButton').addEventListener('click', () => {
//         const messageInput = document.getElementById('messageInput');
//         const message = messageInput.value.trim();

//         if (!message) {
//             alert("메시지를 입력하세요.");
//             return;
//         }

//         sendMessage(chatRoomId, message);
//         messageInput.value = ''; // 입력 필드 초기화
//     });
// }

