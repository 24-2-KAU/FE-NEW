require("dotenv").config();
const express = require('express');
const axios = require('axios');
const router = express.Router();
// app.use(express.json());

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET =  process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_LOGIN_REDIRECT_URI =  process.env.GOOGLE_LOGIN_REDIRECT_URI;
const GOOGLE_SIGNUP_REDIRECT_URI =  process.env.GOOGLE_SIGNUP_REDIRECT_URI;
const GOOGLE_USERINFO_URL =  process.env.GOOGLE_USERINFO_URL;
const GOOGLE_TOKEN_URL =  process.env.GOOGLE_TOKEN_URL;
// GOOGLE_ANALYTICS_URL=https://youtubeanalytics.googleapis.com/v2/reports
const connection  = require('../database/connect/mysql');


// 그냥 버튼
router.get('/', (req, res) => {
    res.send(`
        <h1>OAuth</h1>
        <a href="/login">Log in</a>
        <a href="/signup">Sign up</a>
    `);
});

// 구글 로그인 화면을 가져오기 위한 url
// 나중에 프론트에서 날려줘야되나?
router.get('/login', (req, res) => {
    let url = 'https://accounts.google.com/o/oauth2/v2/auth';
    url += `?client_id=${GOOGLE_CLIENT_ID}`
    url += `&redirect_uri=${GOOGLE_LOGIN_REDIRECT_URI}`
    url += '&response_type=code'
    url += '&scope=email profile'    
    res.redirect(url);
    console.log(url);
});

// 구글 로그인 화면을 가져오기 위한 url    
router.get('/signup', (req, res) => {
    let url = 'https://accounts.google.com/o/oauth2/v2/auth';
    url += `?client_id=${GOOGLE_CLIENT_ID}`
    url += `&redirect_uri=${GOOGLE_SIGNUP_REDIRECT_URI}`
    url += '&response_type=code'
    url += '&scope=email profile https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube.readonly '
    res.redirect(url);
});


router.get('/login/redirect', async (req, res) => {
    // const { code } = req.query;
    const code = req.query.code;// POST 요청의 body에서 code를 가져옴
    console.log(`Authorization Code: ${code}`);

    try {
        // Google OAuth 토큰 요청
        const tokenResponse = await axios.post(GOOGLE_TOKEN_URL, {
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: GOOGLE_LOGIN_REDIRECT_URI,
            grant_type: 'authorization_code',

        });
        
        const accessToken = tokenResponse.data.access_token;
        console.log(`Access Token: ${accessToken}`);

        //구글 사용자 정보 가져오기
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
                // 로그인 성공
                console.log('로그인 성공:', email);
                //window.location.href = 'inf_home.html'; // 홈 화면으로 이동
                return res.send('<h1>로그인 성공!</h1>');
            } else {
                // 회원정보가 없을 경우
                console.log('회원 정보가 없습니다:', email);
                return res.send('<h1>회원 정보가 없습니다. 회원가입을 진행하세요.</h1>');
            }
        });

    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).json({ error: '로그인 처리 중 오류 발생' });
    }
});

// 회원가입
router.get('/signup/redirect', async (req, res) => {
    const code = req.query.code;
    console.log(`code: ${code}`);

    try {
        // Google OAuth 토큰 요청
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
        // 구글에서 가져온 사용자 정보를 변수 안에 넣기
        const { email, id: influencer_id, name} = userInfoResponse.data;

        // MySQL에서 이미 가입된 이메일인지 확인
        connection.query('SELECT * FROM mydb.user_influencer WHERE email = ?', [email], (err, results) => {
            if (err) {
                console.error('DB 조회 오류:', err);
                return res.status(500).send('DB 조회 중 오류 발생');
            }

            if (results.length > 0) {
                // 이미 회원가입된 사용자
                console.log('이미 회원가입된 사용자:', email);
                return res.send(`
                    <h1>이미 회원가입이 되었습니다.</h1>
                    <a href="/">처음 화면으로 이동</a>
                `);
            } else {
                // 새 사용자 등록
                connection.query('INSERT INTO mydb.user_influencer (influencer_id, email, name) VALUES (?, ?, ?)',
                    [influencer_id, email, name],
                    (err, result) => {
                        if (err) {
                            console.error('DB 저장 오류:', err);
                            return res.status(500).send('회원가입 중 오류 발생');
                        }
                        console.log('새 사용자 등록 성공:', email);
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