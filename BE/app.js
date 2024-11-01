require("dotenv").config();
const express = require('express');
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
  origin: 'http://127.0.0.1:5500',
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));

// 세션 설정
app.use(session({
  secret: '1102',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// 요청 크기 제한 설정
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ extended: true, limit: '1000mb' }));

// bodyParser 설정
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 서빙 설정
app.use(express.static(path.join(__dirname, '../')));

// 라우터 불러오기
const userRoutes = require('./routes/userAdvertiser');
const oauthRoutes = require('./routes/ouath');
const productRoutes = require('./routes/products');
const chatRoutes = require('./routes/chat');

// 라우터 사용
app.use(userRoutes);
app.use(productRoutes);
app.use('/', oauthRoutes);
app.use('/', chatRoutes);

// 서버 실행
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
