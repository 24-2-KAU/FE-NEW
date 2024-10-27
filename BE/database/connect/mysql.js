const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'database-1.crksao0eifvg.ap-southeast-2.rds.amazonaws.com',       // MySQL 서버 주소
  user: 'admin',            // MySQL 사용자
  password: 'ektjtakfn', // MySQL 비밀번호
  database: 'mydb',
  port : 3306,  // 사용할 데이터베이스 이름
});


connection.connect((err) => {
  if (err) {
      console.error('MySQL 연결 실패:', err);
      return;
  }
  console.log('MySQL에 성공적으로 연결되었습니다.');
});

module.exports = connection;