const WebSocket = require('ws');
const connection = require('../database/connect/mysql'); // 데이터베이스 연결
let wss;

// 채팅방 ID 생성 함수
function generateChatRoomId(ad_id, influencer_id) {
    if (!ad_id || !influencer_id) {
        console.error('ad_id 또는 influencer_id가 누락되었습니다:', { ad_id, influencer_id });
        return null;
    }
    const sortedIds = [ad_id, influencer_id].sort(); // 알파벳 순으로 정렬
    return `${sortedIds[0]}_${sortedIds[1]}`;
}

// WebSocket 초기화
function initializeWebSocket(server) {
    if (!wss) {
        wss = new WebSocket.Server({ server });

        wss.on('connection', (ws) => {
            console.log('새 클라이언트가 연결되었습니다.');

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);

                    if (data.type === 'newChat') {
                        const { ad_id, influencer_id, initial_message } = data;
                        const chatRoom_id = generateChatRoomId(ad_id, influencer_id);

                        if (!chatRoom_id) {
                            ws.send(JSON.stringify({ error: '채팅방 ID 생성 실패' }));
                            return;
                        }

                        const findChatQuery = `
                            SELECT chatRoom_id FROM chat_room
                            WHERE chatRoom_id = ?
                        `;

                        connection.query(findChatQuery, [chatRoom_id], (err, results) => {
                            if (err) {
                                console.error('채팅방 검색 오류:', err);
                                ws.send(JSON.stringify({ error: '채팅방 검색에 실패했습니다.' }));
                                return;
                            }

                            if (results.length > 0) {
                                console.log(`기존 채팅방을 찾았습니다. ID: ${chatRoom_id}`);
                                ws.send(JSON.stringify({
                                    message: `Chat started: ${initial_message}`,
                                    chatRoom_id: chatRoom_id
                                }));
                            } else {
                                const createChatQuery = `
                                    INSERT INTO chat_room (chatRoom_id, ad_id, influencer_id, created_at)
                                    VALUES (?, ?, ?, CURRENT_DATE)
                                `;

                                connection.query(createChatQuery, [chatRoom_id, ad_id, influencer_id], (err) => {
                                    if (err) {
                                        console.error('채팅방 생성 오류:', err);
                                        ws.send(JSON.stringify({ error: '채팅방 생성에 실패했습니다.' }));
                                        return;
                                    }

                                    console.log(`새로운 채팅방이 생성되었습니다. ID: ${chatRoom_id}`);
                                    ws.send(JSON.stringify({
                                        message: `Chat started: ${initial_message}`,
                                        chatRoom_id: chatRoom_id
                                    }));
                                });
                            }
                        });
                    } else if (data.type === 'chatMessage') {
                        const { chatRoom_id, sender_id, receiver_id, message } = data;

                        if (!chatRoom_id || !sender_id || !receiver_id || !message) {
                            console.error('메시지 데이터가 누락되었습니다:', data);
                            ws.send(JSON.stringify({ error: '메시지 데이터가 올바르지 않습니다.' }));
                            return;
                        }

                        const saveMessageQuery = `
                            INSERT INTO mydb.messages (chatRoom_id, sender_id, receiver_id, content, sent_at)
                            VALUES (?, ?, ?, ?, NOW())
                        `;

                        connection.query(saveMessageQuery, [chatRoom_id, sender_id, receiver_id, message], (err) => {
                            if (err) {
                                console.error('메시지 저장 오류:', err);
                                ws.send(JSON.stringify({ error: '메시지 저장에 실패했습니다.' }));
                                return;
                            }

                            console.log('메시지가 성공적으로 저장되었습니다:', message);
                            ws.send(JSON.stringify({ message: '메시지가 저장되었습니다.' }));
                        });
                    }else if (data.type === 'joinChat') {
                        const { chatRoom_id, message } = data;
                    
                        if (!chatRoom_id) {
                            console.error('채팅방 ID가 누락되었습니다:', data);
                            ws.send(JSON.stringify({ error: '채팅방 ID가 누락되었습니다.' }));
                            return;
                        }
                    
                        console.log(`사용자가 채팅방에 입장했습니다. Chat Room ID: ${chatRoom_id}, Message: ${message}`);
                    
                        // 클라이언트에 확인 응답 전송
                        ws.send(JSON.stringify({
                            type: 'joinChat',
                            chatRoom_id: chatRoom_id,
                            message: '채팅방 입장이 확인되었습니다.'
                        }));
                    } else {
                        console.error('알 수 없는 메시지 유형:', data);
                        ws.send(JSON.stringify({ error: '알 수 없는 메시지 유형입니다.' }));
                    }
                } catch (err) {
                    console.error('메시지 처리 중 예외 발생:', err);
                    ws.send(JSON.stringify({ error: '메시지 처리 중 오류가 발생했습니다.' }));
                }
            });

            ws.on('close', () => {
                console.log('클라이언트 연결이 종료되었습니다.');
            });
        });
    }
    return wss;
}

module.exports = initializeWebSocket;


