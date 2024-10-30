require("dotenv").config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const app = express();
const port = 3000;

// 데이터베이스 연결
const connection = require('./database/connect/mysql');

// CORS 설정
const corsOptions = {
  origin: 'http://127.0.0.1:5500', // 프론트엔드 도메인
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));

// 세션 설정
app.use(session({
  secret: '1102',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // HTTPS 환경에서는 true로 설정
}));

// 요청 크기 제한 설정
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ extended: true, limit: '1000mb' }));

// bodyParser 설정
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 서빙 설정
app.use(express.static(path.join(__dirname, '../')));  // 루트 디렉토리에서 정적 파일을 서빙

// 라우터 불러오기
const userRoutes = require('./routes/userAdvertiser');
const oauthRoutes = require('./routes/ouath'); // 'ouath.js' 파일 경로 그대로 유지
const productRoutes = require('./routes/products');

// 라우터 사용
app.use(userRoutes);
app.use(productRoutes);
app.use('/', oauthRoutes); // OAuth 라우트를 루트에 연결

// 서버 실행
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
