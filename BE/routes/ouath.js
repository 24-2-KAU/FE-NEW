const express = require('express');
const axios = require('axios');
const router = express.Router();
const connection = require('../database/connect/mysql');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_LOGIN_REDIRECT_URI = process.env.GOOGLE_LOGIN_REDIRECT_URI;
const GOOGLE_SIGNUP_REDIRECT_URI = process.env.GOOGLE_SIGNUP_REDIRECT_URI;
const GOOGLE_USERINFO_URL = process.env.GOOGLE_USERINFO_URL;
const GOOGLE_TOKEN_URL = process.env.GOOGLE_TOKEN_URL;

// 메인 페이지
router.get('/', (req, res) => {
    res.send(`
        <h1>OAuth</h1>
        <a href="/login">Log in</a>
        <a href="/signup">Sign up</a>
    `);
});

// 구글 로그인 화면을 가져오기 위한 URL
router.get('/login', (req, res) => {
    let url = 'https://accounts.google.com/o/oauth2/v2/auth';
    url += `?client_id=${GOOGLE_CLIENT_ID}`;
    url += `&redirect_uri=${GOOGLE_LOGIN_REDIRECT_URI}`;
    url += '&response_type=code';
    url += '&scope=email profile';
    res.redirect(url);
});

// 구글 회원가입 화면을 가져오기 위한 URL
router.get('/signup', (req, res) => {
    let url = 'https://accounts.google.com/o/oauth2/v2/auth';
    url += `?client_id=${GOOGLE_CLIENT_ID}`;
    url += `&redirect_uri=${GOOGLE_SIGNUP_REDIRECT_URI}`;
    url += '&response_type=code';
    url += '&scope=email profile';
    res.redirect(url);
});

// 로그인 리디렉션 처리
router.get('/login/redirect', async (req, res) => {
    const code = req.query.code;

    try {
        const tokenResponse = await axios.post(GOOGLE_TOKEN_URL, {
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: GOOGLE_LOGIN_REDIRECT_URI,
            grant_type: 'authorization_code',
        });

        const accessToken = tokenResponse.data.access_token;

        // 구글 사용자 정보 가져오기
        const userInfoResponse = await axios.get(GOOGLE_USERINFO_URL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const { email } = userInfoResponse.data;

        // MySQL에서 해당 이메일 확인
        connection.query('SELECT * FROM mydb.user_influencer WHERE email = ?', [email], (err, results) => {
            if (err) {
                console.error('DB 조회 오류:', err);
                return res.status(500).send('DB 조회 중 오류 발생');
            }

            if (results.length > 0) {
                console.log('로그인 성공:', email);
                return res.send('<h1>로그인 성공!</h1>');
            } else {
                console.log('회원 정보가 없습니다:', email);
                return res.send('<h1>회원 정보가 없습니다. 회원가입을 진행하세요.</h1>');
            }
        });

    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).json({ error: '로그인 처리 중 오류 발생' });
    }
});

// 회원가입 리디렉션 처리
router.get('/signup/redirect', async (req, res) => {
    const code = req.query.code;

    try {
        const tokenResponse = await axios.post(GOOGLE_TOKEN_URL, {
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: GOOGLE_SIGNUP_REDIRECT_URI,
            grant_type: 'authorization_code',
        });

        const accessToken = tokenResponse.data.access_token;

        // Google 사용자 정보 가져오기
        const userInfoResponse = await axios.get(GOOGLE_USERINFO_URL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const { email, name } = userInfoResponse.data;

        // MySQL에서 이미 가입된 이메일인지 확인
        connection.query('SELECT * FROM mydb.user_influencer WHERE email = ?', [email], (err, results) => {
            if (err) {
                console.error('DB 조회 오류:', err);
                return res.status(500).send('DB 조회 중 오류 발생');
            }

            if (results.length > 0) {
                console.log('이미 회원가입된 사용자:', email);
                return res.send(`
                    <h1>이미 회원가입이 되었습니다.</h1>
                    <a href="/">처음 화면으로 이동</a>
                `);
            } else {
                // 새 사용자 등록
                connection.query('INSERT INTO mydb.user_influencer (influencer_id, email, name) VALUES (?, ?, ?)',
                    [email, email, name],
                    (err, result) => {
                        if (err) {
                            console.error('DB 저장 오류:', err);
                            return res.status(500).send('회원가입 중 오류 발생');
                        }
                        console.log('새 사용자 등록 성공:', email);
                        return res.send('<h1>회원가입 성공!</h1>');
                    }
                );
            }
        });

    } catch (error) {
        console.error('Error during signup:', error.message);
        res.status(500).json({ error: '회원가입 처리 중 오류 발생' });
    }
});

module.exports = router;
