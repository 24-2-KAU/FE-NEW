const express = require('express');
const router = express.Router();
const connection = require('../database/connect/mysql');


router.get('/api/chat/chatroom', (req, res) => {
    const { userId, friendId } = req.query;

    if (!userId || !friendId) {
        console.error('userId 또는 friendId가 제공되지 않았습니다:', { userId, friendId });
        return res.status(400).json({ error: 'userId 또는 friendId가 제공되지 않았습니다.' });
    }

    const query = `
        SELECT chatRoom_id
        FROM mydb.chat_room
        WHERE (ad_id = ? AND influencer_id = ?)
        OR (ad_id = ? AND influencer_id = ?)
    `;

    connection.query(query, [userId, friendId, friendId, userId], (err, results) => {
        if (err) {
            console.error('채팅방 조회 실패:', err);
            return res.status(500).json({ error: '채팅방 조회 중 오류 발생' });
        }

        if (results.length > 0) {
            console.log('조회된 chatRoomId:', results[0].chatRoom_id);
            return res.status(200).json({ chatRoomId: results[0].chatRoom_id });
        } else {
            console.log('채팅방을 찾을 수 없습니다.');
            return res.status(404).json({ error: '채팅방을 찾을 수 없습니다.' });
        }
    });
});




// 광고주의 채팅방 목록 가져오기
router.post('/api/chat/advertiser', (req, res) => {
    const { ad_id } = req.body;

    if (!ad_id) {
        return res.status(400).json({ message: '광고주 ID가 필요합니다.' });
    }

    connection.query(
        'SELECT chatRoom_id, influencer_id, created_at FROM mydb.chat_room WHERE ad_id = ?',
        [ad_id],
        (err, results) => {
            if (err) {
                console.error('채팅방 목록 조회 실패:', err);
                return res.status(500).json({ message: '채팅방 목록 조회 실패' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: '해당 광고주에 대한 채팅방이 없습니다.' });
            }

            return res.status(200).json({
                message: '채팅방을 성공적으로 조회했습니다.',
                chatRooms: results,
            });
        }
    );
});

// 인플루언서의 채팅방 목록 가져오기
router.get('/api/chat/influencer/:influencer_id', (req, res) => {
    const { influencer_id } = req.params;

    connection.query(
        'SELECT chatRoom_id, ad_id, created_at FROM mydb.chat_room WHERE influencer_id = ?',
        [influencer_id],
        (err, results) => {
            if (err) {
                console.error('채팅방 목록 조회 실패:', err);
                return res.status(500).json({ message: '채팅방 목록 조회 실패' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: '해당 인플루언서에 대한 채팅방이 없습니다.' });
            }

            return res.status(200).json({
                message: '채팅방을 성공적으로 조회했습니다.',
                chatRooms: results,
            });
        }
    );
});

router.get('/api/chat/:chatRoomId/messages', (req, res) => {
    const chatRoomId = req.params.chatRoomId;
    console.log('메시지 요청 chatRoomId:', chatRoomId);

    if (!chatRoomId) {
        console.error('chatRoomId가 제공되지 않았습니다.');
        return res.status(400).json({ error: 'chatRoomId가 제공되지 않았습니다.' });
    }

    console.log('chat.js - 요청된 chatRoomId:', chatRoomId);

    const query = `
        SELECT sender_id, receiver_id, content, sent_at
        FROM mydb.messages
        WHERE chatRoom_id = ?
        ORDER BY sent_at ASC
    `;

    connection.query(query, [chatRoomId], (err, results) => {
        if (err) {
            console.error('메시지 조회 실패:', err);
            return res.status(500).json({ error: '메시지 조회 중 오류 발생' });
        }

        res.status(200).json({ messages: results });
    });
});

// 채팅방 삭제
router.delete('/api/chat/room/:chatRoom_id', (req, res) => {
    const { chatRoom_id } = req.params;
    console.log("채팅방 삭제")
    connection.query(
        'DELETE FROM mydb.chat_room WHERE chatRoom_id = ?',
        [chatRoom_id],
        (err, result) => {
            if (err) {
                console.error('채팅방 삭제 실패:', err);
                return res.status(500).json({ message: '채팅방 삭제 실패' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: '채팅방을 찾을 수 없습니다.' });
            }

            return res.status(200).json({ message: '채팅방이 성공적으로 삭제되었습니다.' });
        }
    );
});

// 이전 대화 목록 가져오기 (친구 목록)
router.get('/api/chat/friends', (req, res) => {
    const userId = req.query.userId;  // 현재 로그인한 사용자 ID
    console.log('친구 목록 요청 userId:', userId);
    // 사용자가 참여한 모든 채팅방을 조회하고, 상대방 ID를 가져옴
    connection.query(
        `SELECT 
            chatRoom_id,
            CASE 
                WHEN ad_id = ? THEN influencer_id 
                ELSE ad_id 
            END AS friend_id
        FROM chat_room
        WHERE ad_id = ? OR influencer_id = ?`,
        [userId, userId, userId],
        (err, results) => {
            if (err) {
                console.error('친구 목록 조회 실패:', err);
                return res.status(500).json({ message: '친구 목록 조회 실패' });
            }

            return res.status(200).json({ friends: results });
        }
    );
});

module.exports = router;