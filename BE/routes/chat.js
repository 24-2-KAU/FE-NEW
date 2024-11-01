const express = require('express');
const router = express.Router();
const connection = require('../database/connect/mysql');

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

// 특정 채팅방에서 메시지 가져오기
router.get('/api/chat/messages/:chatRoom_id', (req, res) => {
    const { chatRoom_id } = req.params;

    connection.query(
        'SELECT * FROM mydb.messages WHERE chatRoom_id = ? ORDER BY sent_at',
        [chatRoom_id],
        (err, results) => {
            if (err) {
                console.error('메시지 조회 실패:', err);
                return res.status(500).json({ message: '메시지 조회 실패' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: '해당 채팅방에 메시지가 없습니다.' });
            }

            return res.status(200).json({
                message: '메시지를 성공적으로 조회했습니다.',
                messages: results,
            });
        }
    );
});

// 메시지 전송
router.post('/api/chat/send', (req, res) => {
    const { chatRoom_id, sender_id, receiver_id, content } = req.body;
    const sent_at = new Date();
    const read_status = 0;

    connection.query(
        'INSERT INTO mydb.messages (chatRoom_id, sender_id, receiver_id, content, sent_at, read_status) VALUES (?, ?, ?, ?, ?, ?)',
        [chatRoom_id, sender_id, receiver_id, content, sent_at, read_status],
        (err, result) => {
            if (err) {
                console.error('메시지 전송 실패:', err);
                return res.status(500).json({ message: '메시지 전송 실패' });
            }

            return res.status(201).json({ message: '메시지 전송 성공' });
        }
    );
});

// 채팅방 생성 API (새 채팅방 생성 시 초기 메시지 추가)
router.post('/api/chat/room/create', (req, res) => {
    const { ad_id, influencer_id, initial_message } = req.body;
    const created_at = new Date();

    if (!ad_id || !influencer_id) {
        return res.status(400).json({ message: '광고주 ID와 인플루언서 ID가 필요합니다.' });
    }

    // 새로운 채팅방 생성
    connection.query(
        'INSERT INTO mydb.chat_room (ad_id, influencer_id, created_at) VALUES (?, ?, ?)',
        [ad_id, influencer_id, created_at],
        (err, result) => {
            if (err) {
                console.error('채팅방 생성 실패:', err);
                return res.status(500).json({ message: '채팅방 생성 실패' });
            }

            const chatRoom_id = result.insertId;

            // 초기 메시지 추가
            connection.query(
                'INSERT INTO mydb.messages (chatRoom_id, sender_id, receiver_id, content, sent_at, read_status) VALUES (?, ?, ?, ?, ?, ?)',
                [chatRoom_id, influencer_id, ad_id, initial_message, new Date(), 0],
                (err, messageResult) => {
                    if (err) {
                        console.error('환영 메시지 생성 실패:', err);
                        return res.status(500).json({ message: '채팅방은 생성되었으나, 초기 메시지 추가에 실패했습니다.' });
                    }

                    return res.status(201).json({
                        message: '채팅방이 성공적으로 생성되었습니다.',
                        chatRoom_id: chatRoom_id,
                    });
                }
            );
        }
    );
});

// 채팅방 삭제
router.delete('/api/chat/room/:chatRoom_id', (req, res) => {
    const { chatRoom_id } = req.params;

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

module.exports = router;
