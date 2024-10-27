document.getElementById('productForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = {};

    const encodeImageToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                const result = reader.result;
                if (result && result.startsWith("data:image/")) {
                    resolve(result); // 이미지 전체 Base64 문자열 포함
                } else {
                    reject("이미지 인코딩 실패: Base64 데이터가 유효하지 않습니다.");
                }
            };
            reader.onerror = (error) => {
                console.error('이미지 인코딩 에러:', error);
                reject(error);
            };
        });
    };

    for (const [key, value] of formData.entries()) {
        if (key === 'product_pic' && value instanceof File) {
            try {
                const base64Image = await encodeImageToBase64(value);
                data.product_pic = base64Image; // 전체 Base64 데이터 추가
            } catch (error) {
                alert('이미지 인코딩에 실패했습니다.');
                return;
            }
        } else {
            data[key] = value;
        }
    }

    const ad_id = localStorage.getItem('ad_id');
    if (ad_id) {
        data.ad_id = ad_id;
    } else {
        alert('로그인이 필요합니다. 광고주 ID를 찾을 수 없습니다.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        document.getElementById('message').textContent = result.message;
    } catch (error) {
        document.getElementById('message').textContent = error.message;
    }
});
