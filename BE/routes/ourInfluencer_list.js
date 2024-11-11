const express = require('express');
const router = express.Router();
const connection = require('../database/connect/mysql');

// 인플루언서 데이터를 가져오는 API 라우트 설정
router.get('/api/influencers', (req, res) => {
  console.log('인플루언서 데이터 요청 수신'); // 요청 수신 로그

  const sqlQuery = 'SELECT email, name FROM mydb.user_influencer';
  connection.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('데이터베이스 쿼리 오류:', err); // 데이터베이스 오류 로그
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
    console.log('인플루언서 데이터 쿼리 성공:', results); // 데이터베이스 쿼리 성공 로그
    res.status(200).json(results);
  });
});

module.exports = router;
