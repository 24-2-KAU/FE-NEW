async function editProduct(product_id) {
    // 수정 페이지로 이동할 때 product_id를 포함하여 URL로 이동
    window.location.href = `edit_product.html?product_id=${product_id}`;
}

async function deleteProduct(product_id) {
    const confirmDelete = confirm('정말로 이 상품을 삭제하시겠습니까?');
    if (!confirmDelete) return;

    try {
        const response = await fetch(`http://localhost:3000/api/products/${product_id}/delete`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        // 삭제 성공 시 목록에서 상품 제거
        const productList = document.getElementById('productList');
        const productItem = document.getElementById(`product-${product_id}`);
        if (productItem) {
            productList.removeChild(productItem);
        }
        alert('상품이 성공적으로 삭제되었습니다.');
    } catch (error) {
        console.error('상품 삭제 중 에러 발생:', error);
        alert(`상품 삭제에 실패했습니다: ${error.message}`);
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    const ad_id = localStorage.getItem('ad_id');
    if (!ad_id) {
        alert('로그인이 필요합니다.');
        window.location.href = 'advertiser_login.html';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/products/check?ad_id=${ad_id}`);
        
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const result = await response.json();
        const productList = document.getElementById('productList');

        result.products.forEach(product => {
            const li = document.createElement('li');
            li.id = `product-${product.product_id}`; // 각 상품에 고유 ID 부여
            let productPicHTML = '';

            if (product.product_pic) {
                const imageSrc = product.product_pic.startsWith("data:image/")
                    ? product.product_pic
                    : `data:image/png;base64,${product.product_pic}`;

                productPicHTML = `
                    <p><strong>상품 이미지:</strong><br>
                    <img src="${imageSrc}" alt="상품 이미지" style="max-width: 200px; height: auto;"></p>`;
            } else {
                productPicHTML = `<p><strong>상품 이미지:</strong> 이미지가 없습니다.</p>`;
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
        console.error('상품 목록 조회 중 에러 발생:', error);
        alert(`상품 목록을 불러오는데 실패했습니다: ${error.message}`);
    }
});
