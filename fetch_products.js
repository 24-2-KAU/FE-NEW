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
                <p><strong>광고주 ID:</strong> ${product.ad_id}</p>
                <p><strong>가격:</strong> ${product.product_price}</p>
                <p><strong>예산:</strong> ${product.budget}</p>
                <p><strong>연령대:</strong> ${product.viewer_age}</p>
                <p><strong>성별:</strong> ${product.viewer_gender}</p>
                <p><strong>플랫폼:</strong> ${product.platform}</p>
                <p><strong>해시태그:</strong> ${product.hashtag}</p>
                <button class="chat-button" onclick="startChat('${product.ad_id}', '${product.product_name}')">채팅하기</button>
            </div>
        `;

        productContainer.appendChild(productElement);
    });
}

let ws; // WebSocket 인스턴스를 전역으로 유지

async function startChat(ad_id, productName) {
    const influencer_id = localStorage.getItem('email');
    if (!influencer_id) {
        alert('로그인이 필요합니다.');
        return;
    }

    // WebSocket 연결이 이미 열려 있으면 새로운 연결을 만들지 않음
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        ws = new WebSocket('ws://localhost:3000');

        ws.onopen = () => {
            console.log('WebSocket 연결이 열렸습니다.');
            // 연결이 열린 후에만 메시지를 전송
            ws.send(JSON.stringify({
                type: 'newChat',
                ad_id: ad_id,
                influencer_id: influencer_id,
                initial_message: `${influencer_id}님이 '${productName}'에 대해 대화를 시작하고자 합니다.`
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.message.startsWith('Chat started')) {
                alert('채팅방으로 이동합니다.');
                window.location.href = `/chatting/influencer_messenger.html?chatRoomId=${data.chatRoom_id || 'generated_chatRoomId'}`;
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            alert('채팅방 생성에 실패했습니다.');
        };
    } else {
        // 이미 WebSocket이 열려 있는 경우 바로 메시지 전송
        ws.send(JSON.stringify({
            type: 'newChat',
            ad_id: ad_id,
            influencer_id: influencer_id,
            initial_message: `${influencer_id}님이 '${productName}'에 대해 대화를 시작하고자 합니다.`
        }));
    }
}

