const jwt = require('jsonwebtoken');
const JWT_SECRET = 'secret_key';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"에서 TOKEN만 추출

  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user; // 인증된 사용자를 요청 객체에 저장
    next(); // 다음 미들웨어로 이동
  });
}

module.exports = authenticateToken;
