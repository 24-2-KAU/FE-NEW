document.getElementById('productForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // 기본 제출 동작 방지

    // 폼 데이터 수집
    const formData = new FormData(event.target);
    const data = {}; // JSON 데이터로 변환할 객체

    // 이미지를 Base64로 인코딩하는 함수
    const encodeImageToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                console.log('Base64로 인코딩된 이미지:', reader.result); // 인코딩된 데이터 확인
                resolve(reader.result); 
            };
            reader.onerror = (error) => {
                console.error('이미지 인코딩 에러:', error);
                reject(error);
            };
        });
    };

    // FormData의 각 필드 값을 객체로 변환
    for (const [key, value] of formData.entries()) {
        if (key === 'product_pic' && value instanceof File) {
            // 이미지를 base64로 인코딩하여 처리
            try {
                const base64Image = await encodeImageToBase64(value);
                data.product_pic = base64Image; // base64 이미지 데이터를 JSON에 추가
            } catch (error) {
                console.error('이미지 인코딩 실패:', error);
                alert('이미지 인코딩에 실패했습니다.');
                return;
            }
        } else {
            data[key] = value;
        }
    }

    // localStorage에서 ad_id를 가져와 추가
    const ad_id = localStorage.getItem('ad_id');
    if (ad_id) {
        data.ad_id = ad_id; // 광고주 ID를 JSON 데이터에 추가
    } else {
        alert('로그인이 필요합니다. 광고주 ID를 찾을 수 없습니다.');
        return; // 광고주 ID가 없으면 요청을 보내지 않음
    }

    try {
        const response = await fetch('http://localhost:3000/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // JSON 데이터를 전송할 때 필요한 헤더
            },
            body: JSON.stringify(data), // 데이터를 JSON 문자열로 변환하여 전송
        });

        if (!response.ok) {
            throw new Error('상품 등록에 실패했습니다.');
        }

        const result = await response.json();
        console.log('서버 응답:', result); // 서버 응답 확인
        document.getElementById('message').textContent = result.message; // 성공 메시지 표시
    } catch (error) {
        console.error('상품 등록 에러:', error); // 에러 로그 출력
        document.getElementById('message').textContent = error.message; // 에러 메시지 표시
    }
});
