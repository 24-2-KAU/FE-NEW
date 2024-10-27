const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'secret_key'; // Same secret used for signing the token
const authenticateToken = require('../middleware/autenticationToken'); // Import JWT middleware

// 데이터베이스 연결 파일
const connection = require('../database/connect/mysql');

// 상품 등록 API
// 상품을 올리는 광고주의 id를 가져와서 넣기
router.post('/api/products', async (req, res) => {
  const { product_name, product_price, budget, product_pic, viewer_age, viewer_gender, platform, hashtag, ad_id } = req.body;
  const product_id = Math.floor(Math.random() * 1000); // 랜덤 번호 생성

  console.log('Generated product_id:', product_id);
  console.log('Received product request:', req.body); // 요청 로그 출력

  // 이미지 처리 (base64로 처리)
  const processedProductPic = product_pic && Object.keys(product_pic).length > 0 ? product_pic : null;

  // 데이터베이스 저장
  connection.query(
    'INSERT INTO mydb.products (product_id, product_name, product_price, budget, product_pic, viewer_age, viewer_gender, platform, hashtag, ad_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [product_id, product_name, product_price, budget, processedProductPic, viewer_age, viewer_gender, platform, hashtag, ad_id],
    (err, result) => {
      if (err) {
        console.error('상품 등록 실패:', err);
        return res.status(500).json({ message: '상품 등록에 실패했습니다.' });
      }
      console.log('상품 등록 성공:', product_name);
      return res.status(201).json({ message: '상품 등록 성공' });
    }
  );
});

// 상품 목록 조회 API (광고주 ID로 필터링)
router.get('/api/products/check', async (req, res) => {
  const ad_id = req.query.ad_id; // 요청에서 광고주 ID 가져오기

  console.log('상품 목록 조회 요청 for ad_id:', ad_id);

  if (!ad_id) {
    return res.status(400).json({ message: '광고주 ID가 필요합니다.' });
  }

  connection.query('SELECT * FROM mydb.products WHERE ad_id = ?', [ad_id], (err, results) => {
    if (err) {
      console.error('Failed to retrieve products:', err);
      return res.status(500).json({ message: 'Failed to retrieve products' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No products found for this advertiser' });
    }

    return res.status(200).json({
      message: 'Products retrieved successfully',
      products: results, // 해당 광고주의 상품 목록 반환
    });
  });
});

// 상품 정보 수정 API
router.put('/api/products/:product_id/edit', async (req, res) => {
  const product_id = req.params.product_id;
  const { product_name, product_price, budget, product_pic, viewer_age, viewer_gender, platform, hashtag } = req.body;

  console.log('product_id:', product_id);

  // Update query
  connection.query(
    'UPDATE mydb.products SET product_name = ?, product_price = ?, budget = ?, product_pic = ?, viewer_age = ?, viewer_gender = ?, platform = ?, hashtag = ? WHERE product_id = ?',
    [product_name, product_price, budget, product_pic, viewer_age, viewer_gender, platform, hashtag, product_id],
    (err, result) => {
      if (err) {
        console.error('Failed to update product:', err);
        return res.status(500).json({ message: 'Failed to update product' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // 업데이트 성공 시
      return res.status(200).json({ message: 'Product updated successfully' });
    }
  );
});

// 상품 삭제 API
router.delete('/api/products/:product_id/delete', async (req, res) => {
  const product_id = req.params.product_id;

  console.log('product_id:', product_id);

  connection.query(
    'DELETE FROM mydb.products WHERE product_id = ?',
    [product_id],
    (err, result) => {
      if (err) {
        console.error('Failed to delete product:', err);
        return res.status(500).json({ message: 'Failed to delete product' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // 삭제 성공 시
      return res.status(200).json({ message: 'Product deleted successfully' });
    }
  );
});

module.exports = router;
