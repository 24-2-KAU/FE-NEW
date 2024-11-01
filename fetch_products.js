document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/products/random')
        .then(response => response.json())
        .then(data => {
            if (data.message === '랜덤 순서로 상품을 조회했습니다.') {
                displayProducts(data.products);
            } else {
                console.error('상품 조회 실패');
            }
        })
        .catch(error => console.error('상품 데이터를 가져오는 중 오류 발생:', error));
});

function displayProducts(products) {
    const productContainer = document.getElementById('product-container');
    productContainer.innerHTML = ''; // 기존 콘텐츠 지우기

    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-item';
        
        const productImage = product.product_pic
            ? `<img src="${product.product_pic}" alt="${product.product_name}" class="product-image" />`
            : `<div class="no-image">이미지 없음</div>`;

        productElement.innerHTML = `
            ${productImage}
            <div class="product-info">
                <h2>${product.product_name}</h2>
                <p><strong>가격:</strong> ${product.product_price}</p>
                <p><strong>예산:</strong> ${product.budget}</p>
                <p><strong>연령대:</strong> ${product.viewer_age}</p>
                <p><strong>성별:</strong> ${product.viewer_gender}</p>
                <p><strong>플랫폼:</strong> ${product.platform}</p>
                <p><strong>해시태그:</strong> ${product.hashtag}</p>
            </div>
        `;

        productContainer.appendChild(productElement);
    });
}
