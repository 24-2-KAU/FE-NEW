const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();

// 데이터베이스 연결 파일
const connection = require('../database/connect/mysql');

// 회원가입
router.post("/api/users/signup", async (req, res) => {
    const { ad_id, email, password, company_id, company_name, phone, profile_picture } = req.body;

    console.log('Received signup request:', req.body); // 요청 로그 출력

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed password:', hashedPassword);  // 해싱된 비밀번호 출력

    // DB에 데이터 저장
    connection.query('SELECT * FROM user_advertiser WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('DB 조회 오류:', err);
        }

        if (results.length > 0) {
            // 이미 회원가입된 사용자
            console.log('이미 회원가입된 사용자:', email);
            return res.status(409).json({ message: 'Email already registered' });
        } else {
            // 새 사용자 등록
            connection.query(
                'INSERT INTO mydb.user_advertiser (ad_id, email, password, company_id, company_name, phone, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [ad_id, email, hashedPassword, company_id, company_name, phone, profile_picture],
                (err, result) => {
                    if (err) {
                        console.error('회원가입 실패:', err);
                        return res.status(500).json({ message: 'Signup failed' });
                    }
                    console.log('회원가입 성공:', email);
                    return res.status(201).json({ message: 'Signup successful' });
                }
            );
        }
    });
});

// 로그인
router.post('/api/users/login', async (req, res) => {
    const { ad_id, password } = req.body;  // ad_id로 변경
    console.log('Received login request:', { ad_id, password });

    try {
        // 데이터베이스에서 사용자 조회 (ad_id로)
        const [results] = await connection.promise().query('SELECT * FROM mydb.user_advertiser WHERE ad_id = ?', [ad_id]);

        if (results.length > 0) {
            const user = results[0]; // 조회된 사용자 정보

            // 입력된 비밀번호와 DB의 비밀번호 비교
            const validPassword = await bcrypt.compare(password, user.password);
            console.log('Password comparison result:', validPassword);  // 비교 결과 출력

            if (validPassword) {
                // 세션에 사용자 정보 저장
                req.session.user = { ad_id: user.ad_id };
                console.log('로그인 성공:', ad_id);

                // 로그인 성공 시 `ad_id`를 응답에 포함
                return res.status(200).json({ message: 'Login success!', ad_id: user.ad_id });
            } else {
                console.log('비밀번호 불일치:', ad_id);
                return res.status(401).json({ message: 'Incorrect password' });
            }
        } else {
            console.log('회원 정보가 없습니다:', ad_id);
            return res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error('로그인 처리 오류:', err);
        return res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = router;
