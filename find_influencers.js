document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("product-form");
    const resultsContainer = document.getElementById("results-container");
    const loadingMessage = document.createElement("p");
    loadingMessage.classList.add("loading");
    loadingMessage.textContent = "요청을 보내고 기다리는 중입니다...";

    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // 폼 제출 방지

        // 입력 데이터 가져오기
        const title = document.getElementById("title").value;
        const description = document.getElementById("description").value;
        const keywords = document.getElementById("keywords").value;

        // 요청 데이터 생성
        const requestData = {
            title: title,
            description: description,
            keywords: keywords
        };

        // 로딩 메시지 표시
        resultsContainer.innerHTML = "";
        resultsContainer.appendChild(loadingMessage);

        try {
            // FastAPI 엔드포인트 호출
            const response = await fetch("http://127.0.0.1:8000/recommend", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`오류: ${response.statusText}`);
            }

            const data = await response.json();

            // 결과 표시
            displayResults(data);

        } catch (error) {
            console.error("데이터 가져오기 오류:", error);
            resultsContainer.innerHTML = `<p class="error">추천 결과를 가져오는 중 오류가 발생했습니다.</p>`;
        }
    });

    async function displayResults(data) {
        resultsContainer.innerHTML = ""; // 기존 결과 초기화

        if (data.length === 0) {
            resultsContainer.innerHTML = "<p>추천 결과가 없습니다.</p>";
            return;
        }

        for (const item of data) {
            const channelInfo = await fetchChannelInfo(item.channelId);
            const channelDiv = document.createElement("div");
            channelDiv.classList.add("result-item");

            channelDiv.innerHTML = `
                <h2>채널 이름: ${channelInfo.title || "알 수 없음"}</h2>
                <img src="${channelInfo.thumbnail || ""}" alt="채널 썸네일" style="width: 100px; height: auto;">
                <p><strong>채널 ID:</strong> <a href="https://www.youtube.com/channel/${item.channelId}" target="_blank">${item.channelId}</a></p>
                <p><strong>배지:</strong> ${item.badges.join(", ")}</p>
                ${item.channelList.length > 0 ? `<p><strong>채널 추천 이유:</strong> ${item.channelList[0].reason} (점수: ${item.channelList[0].score})</p>` : ""}
                ${item.popvidelist.length > 0 ? createVideoListHTML(item.popvidelist, "인기 비디오 리스트") : ""}
                ${item.recentvidelist.length > 0 ? createVideoListHTML(item.recentvidelist, "최근 비디오 리스트") : ""}
                ${item.advidelist.length > 0 ? createVideoListHTML(item.advidelist, "광고 비디오 리스트") : ""}
            `;
            resultsContainer.appendChild(channelDiv);
        }
    }

    function createVideoListHTML(videoList, title) {
        let html = `<h3>${title}:</h3><ul>`;
        videoList.forEach(video => {
            html += `
                <li>
                    <iframe width="560" height="315" src="https://www.youtube.com/embed/${video.videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    <p>비디오 ID: ${video.videoId}, 점수: ${video.score}, 이유: ${video.reason}</p>
                </li>
            `;
        });
        html += "</ul>";
        return html;
    }

    async function fetchChannelInfo(channelId) {
        // FastAPI에서 채널 정보를 가져오는 엔드포인트 호출
        try {
            const response = await fetch(`http://127.0.0.1:8000/channel-info/${channelId}`);
            if (!response.ok) {
                throw new Error(`채널 정보 가져오기 실패: ${channelId}`);
            }
            return await response.json();
        } catch (error) {
            console.error("채널 정보 가져오기 오류:", error);
            return { title: "알 수 없음", thumbnail: "" }; // 기본값 반환
        }
    }
});
