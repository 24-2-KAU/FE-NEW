document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const product_id = urlParams.get("product_id");

    if (product_id) {
        try {
            const response = await fetch(`http://localhost:3000/api/products/${product_id}`);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            
            const product = await response.json();

            // 입력 필드에 상품 데이터 미리 채우기
            document.getElementById("product_name").value = product.product_name;
            document.getElementById("product_price").value = product.product_price;
            document.getElementById("budget").value = product.budget;
            document.getElementById("viewer_age").value = product.viewer_age;
            document.getElementById("viewer_gender").value = product.viewer_gender;
            document.getElementById("platform").value = product.platform;
            document.getElementById("hashtag").value = product.hashtag;

            if (product.product_pic) {
                const imgPreview = document.createElement("img");
                imgPreview.src = `data:image/jpeg;base64,${product.product_pic}`; // 데이터 URL 포맷에 맞게
                imgPreview.style.maxWidth = "200px";
                imgPreview.alt = "기존 이미지 미리보기";
                document.getElementById("product_pic").parentNode.appendChild(imgPreview);
            }
        } catch (error) {
            alert(`상품 정보를 불러오는 중 오류가 발생했습니다: ${error.message}`);
        }
    }

    // 수정 폼 제출 처리
    document.getElementById("editProductForm").addEventListener("submit", async (event) => {
        event.preventDefault(); // 기본 제출 동작 방지

        const productPicFile = document.getElementById("product_pic").files[0];
        const data = {};

        // 기존 입력 필드의 값을 data 객체에 추가
        data.product_name = document.getElementById("product_name").value;
        data.product_price = document.getElementById("product_price").value;
        data.budget = document.getElementById("budget").value;
        data.viewer_age = document.getElementById("viewer_age").value;
        data.viewer_gender = document.getElementById("viewer_gender").value;
        data.platform = document.getElementById("platform").value;
        data.hashtag = document.getElementById("hashtag").value;

        if (productPicFile) {
            try {
                const base64ProductPic = await encodeImageToBase64(productPicFile); // Base64로 변환
                data.product_pic = base64ProductPic; // 변환된 이미지를 data 객체에 추가
            } catch (error) {
                alert('이미지 인코딩에 실패했습니다.');
                return;
            }
        }

        const product_id = urlParams.get("product_id");

        // 상품 수정 요청
        await updateProduct(product_id, data);
    });
});

// 이미지 파일을 Base64로 변환하는 함수
const encodeImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const result = reader.result;
            if (result && result.startsWith("data:image/")) {
                resolve(result); // 전체 Base64 문자열 반환
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

// 상품 수정 요청 함수
async function updateProduct(product_id, data) {
    try {
        const response = await fetch(`http://localhost:3000/api/products/${product_id}/edit`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json', // JSON 데이터 전송
            },
            body: JSON.stringify(data), // data 객체를 JSON 문자열로 변환하여 전송
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const result = await response.json();
        alert(result.message);
        // 수정 후 마이페이지로 리다이렉트
        window.location.href = 'my_page.html';
    } catch (error) {
        alert(`수정 실패: ${error.message}`);
    }
}