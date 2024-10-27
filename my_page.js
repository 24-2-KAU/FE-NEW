document.addEventListener("DOMContentLoaded", async function () {
    const ad_id = localStorage.getItem('ad_id'); // 로컬 스토리지에서 광고주 ID 가져오기
    if (!ad_id) {
        alert('로그인이 필요합니다.');
        window.location.href = 'advertiser_login.html';
        return;
    }

    try {
        // 광고주의 상품 목록을 가져옴 (ad_id를 쿼리로 전달)
        const response = await fetch(`http://localhost:3000/api/products/check?ad_id=${ad_id}`);
        
        if (!response.ok) {
            console.error(`HTTP Error: ${response.status} - ${response.statusText}`);
            throw new Error(`상품 목록 조회 실패 (Status Code: ${response.status})`);
        }

        const result = await response.json();
        const productList = document.getElementById('productList');

        result.products.forEach(product => {
            const li = document.createElement('li');
            let productPicHTML = '';

            // product_pic이 Buffer 객체인지 확인 (Node.js에서 Buffer로 전송된 경우)
            if (product.product_pic && product.product_pic.data) {
                // Buffer 데이터를 Base64로 변환
                const base64String = btoa(
                    new Uint8Array(product.product_pic.data)
                    .reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
                
                const imageSrc = `data:image/jpeg;base64,${base64String}`;
                productPicHTML = `
                    <p><strong>상품 이미지:</strong><br>
                    <img src="${imageSrc}" alt="상품 이미지" style="max-width: 200px; height: auto;"></p>`;
            } else {
                console.warn('product_pic가 없거나 유효한 이미지가 아닙니다:', product.product_pic); // 디버깅 로그
            }

            li.innerHTML = `
                <p><strong>상품 이름:</strong> ${product.product_name}</p>
                <p><strong>상품 가격:</strong> ${product.product_price}</p>
                <p><strong>광고 예산:</strong> ${product.budget}</p>
                <p><strong>타겟 시청자 연령:</strong> ${product.viewer_age}</p>
                <p><strong>타겟 시청자 성별:</strong> ${product.viewer_gender}</p>
                <p><strong>플랫폼:</strong> ${product.platform}</p>
                <p><strong>해시태그:</strong> ${product.hashtag}</p>
                ${productPicHTML}
                <button onclick="editProduct(${product.product_id})">수정</button>
                <button onclick="deleteProduct(${product.product_id})">삭제</button>
            `;
            productList.appendChild(li);
        });
    } catch (error) {
        console.error('상품 목록 조회 중 에러 발생:', error.message);
        alert(`상품 목록을 불러오는데 실패했습니다: ${error.message}`);
    }
});
