from fastapi import FastAPI, Request
import openai
from pinecone import Pinecone, ServerlessSpec
import time
import pandas as pd
import re
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import logging

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 필요한 경우 특정 도메인으로 변경 가능
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 로거 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 현재 요청 처리 상태
is_processing = False



# 상태 엔드포인트 추가
@app.get("/status")
async def get_status():
    return {"processing": is_processing}

### 임베딩 함수
def get_embedding(text, model="text-embedding-ada-002", retries=5, delay=10):
    for attempt in range(retries):
        try:
            logger.info(f"임베딩 생성 시작: {text[:20]}...")
            response = openai.Embedding.create(
                input=[text],
                model=model
            )
            logger.info("임베딩 생성 완료")
            return response['data'][0]['embedding']
        except (openai.error.RateLimitError, openai.error.Timeout):
            logger.warning(f"오류 발생. {delay}초 후 재시도 ({attempt + 1}/{retries})...")
            time.sleep(delay)
    raise Exception("임베딩 생성 실패: 오류가 지속적으로 발생했습니다.")

### 임베딩 cos유사도 검색 top k
def get_similar_channels(query_text, indexname, top_k=5):
    query_embedding = get_embedding(query_text)
    index = pc.Index(indexname)
    results = index.query(vector=query_embedding, top_k=top_k, include_metadata=False)
    videos = [match['id'] for match in results['matches']]
    return videos

# 비디오 gpt로 종합 점수
def get_video_recommendation(video, product_info):
    video_prompt = (
        f"제목: {video['title']}\n"
        f"설명: {video['description'][:250]}\n"
        f"태그: {video['tags'][:250]}\n"
        f"조회수: {video['viewCount']}\n"
        f"좋아요 수: {video['likeCount']}\n"
        f"댓글 수: {video['commentCount']}\n"
    )
    prompt = (
        f"{video_prompt}\n이 비디오가 다음 상품에 적합한 비디오인지,"
        "종합 점수를 매겨주세요. 제목, 설명, 태그, 조회수, 좋아요 수, 댓글 수 등을 모두 반영하여 점수 반영(100점 만점). 이유는 한 문장만 작성. 주어진 형식으로만 답변\n"
        f"광고 상품 정보: {product_info}\n\n"
        "형식: 종합점수: **점, 이유: "
    )
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200
    )
    score_reason = response['choices'][0]['message']['content']

    # 정규식을 사용하여 종합점수와 이유를 추출
    score_match = re.search(r'종합점수:\s*(\d+)점', score_reason)
    reason_match = re.search(r"이유:\s*(.*)", score_reason)

    score = int(score_match.group(1)) if score_match else None
    reason = reason_match.group(1).strip() if reason_match else "이유 없음"

    return {
        'videoId': video['videoId'],
        'channelId': video['channelId'],
        'score': score,
        'reason': reason
    }

# 채널 gpt로 종합 점수
def get_channel_recommendation(channel, product_info):
    channel_prompt = (
        f"채널이름: {channel['channelTitle']}\n"
        f"설명: {channel['channelDescription'][:250]}\n"
        f"키워드: {channel['keywords'][:250]}\n"
        f"평균조회수: {channel['channelTotalView']/channel['channelVideoCount']}\n"
        f"구독자: {channel['channelSubscribers']}\n"
    )
    prompt = (
        f"{channel_prompt}\n인 채널이 다음 상품에 적합한 채널인지,"
        "종합 점수를 매겨주세요. 제목, 설명, 키워드, 평균조회수, 구독자 등을 모두 반영하여 점수 반영(100점 만점). 이유는 한 문장만 작성. 주어진 형식으로만 답변\n"
        f"광고 상품 정보: {product_info}\n\n"
        "형식: 종합점수: **점, 이유: "
    )
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200
    )
    score_reason = response['choices'][0]['message']['content']

    # 정규식을 사용하여 종합점수와 이유를 추출
    score_match = re.search(r'종합점수:\s*(\d+)점', score_reason)
    reason_match = re.search(r"이유:\s*(.*)", score_reason)

    score = int(score_match.group(1)) if score_match else None
    reason = reason_match.group(1).strip() if reason_match else "이유 없음"

    return {
        'channelId': channel['channelId'],
        'score': score,
        'reason': reason
    }

def get_top_15_recommendations(filtered_df, product_info, is_channel=False):
    recommendations = []
    for _, row in filtered_df.iterrows():
        if is_channel:
            recommendation = get_channel_recommendation(row, product_info)
        else:
            recommendation = get_video_recommendation(row, product_info)
        if recommendation['score'] is None:
            recommendation['score'] = 0
        recommendations.append(recommendation)

    # 점수를 기준으로 정렬 후 상위 15개 선택
    recommendations = sorted(recommendations, key=lambda x: x['score'], reverse=True)[:15]
    return recommendations

### 원격 DB가 아직이여서 일단 이렇게 함.
df_pop = pd.read_csv('./gpt_popVideo.csv').fillna('')
df_add = pd.read_csv('./gpt_addVideo.csv').fillna('')
df_rec = pd.read_csv('./gpt_recentVideo.csv').fillna('')
df_channel = pd.read_csv('./gpt_channel.csv').fillna('')

class ProductRequest(BaseModel):
    title: str
    description: str
    keywords: str

class RecommendationResponse(BaseModel):
    channelId: str
    badges: list
    popvidelist: list
    recentvidelist: list
    advidelist: list

# 엔드포인트
@app.post("/recommend")
async def recommend_videos(product: ProductRequest):
    global is_processing
    if is_processing:
        return {"status": "현재 다른 요청을 처리 중입니다. 잠시 후 다시 시도해 주세요."}

    is_processing = True
    logger.info(f"요청 수신: {product.title}, {product.description}, {product.keywords}")

    try:
        product_info = f"{product.title} {product.description} {product.keywords}"
        product_info_gpt = f"상품 이름: {product.title}, 상품 설명: {product.description}, 상품 키워드: {product.keywords}"

        # 유사도 검색
        similar_channels = get_similar_channels(product_info, indexname="channel", top_k=45)
        similar_pop_videos = get_similar_channels(product_info, indexname="popvideo", top_k=75)
        similar_recent_videos = get_similar_channels(product_info, indexname="recentvideo", top_k=75)
        similar_ad_videos = get_similar_channels(product_info, indexname="addvideo", top_k=75)

        # DataFrame 필터링
        filtered_channels = df_channel[df_channel['channelId'].isin(similar_channels)]
        filtered_pop_videos = df_pop[df_pop['videoId'].isin(similar_pop_videos)]
        filtered_recent_videos = df_rec[df_rec['videoId'].isin(similar_recent_videos)]
        filtered_ad_videos = df_add[df_add['videoId'].isin(similar_ad_videos)]

        # 추천 계산
        channel_recommendations = get_top_15_recommendations(filtered_channels, product_info_gpt, is_channel=True)
        pop_video_recommendations = get_top_15_recommendations(filtered_pop_videos, product_info_gpt)
        recent_video_recommendations = get_top_15_recommendations(filtered_recent_videos, product_info_gpt)
        ad_video_recommendations = get_top_15_recommendations(filtered_ad_videos, product_info_gpt)

        # 모든 추천 결과를 하나의 집합으로 통합하여 중복된 channelId 제거
        all_channel_ids = set(
            [channel['channelId'] for channel in channel_recommendations] +
            [video['channelId'] for video in pop_video_recommendations] +
            [video['channelId'] for video in recent_video_recommendations] +
            [video['channelId'] for video in ad_video_recommendations]
        )

        response_data = []

        # 각 채널 ID에 대해 badge 및 비디오 리스트 확인
        for channel_id in all_channel_ids:
            badges = []
            channellist = []
            popvidelist = []
            recentvidelist = []
            advidelist = []

            # 해당 channelId가 있는 경우 각 리스트에 추가
            for channel in channel_recommendations:
                if channel['channelId'] == channel_id:
                    badges.append('channel')
                    channellist.append({'score': channel['score'], 'reason': channel['reason']})

            for video in pop_video_recommendations:
                if video['channelId'] == channel_id:
                    popvidelist.append({'videoId': video['videoId'], 'score': video['score'], 'reason': video['reason']})

            for video in recent_video_recommendations:
                if video['channelId'] == channel_id:
                    recentvidelist.append({'videoId': video['videoId'], 'score': video['score'], 'reason': video['reason']})

            for video in ad_video_recommendations:
                if video['channelId'] == channel_id:
                    advidelist.append({'videoId': video['videoId'], 'score': video['score'], 'reason': video['reason']})

            if popvidelist:
                badges.append('popvid')
            if recentvidelist:
                badges.append('recentvid')
            if advidelist:
                badges.append('advid')

            if badges:
                response_data.append({
                    "channelId": channel_id,
                    "badges": badges,
                    "channelList": channellist,
                    "popvidelist": popvidelist,
                    "recentvidelist": recentvidelist,
                    "advidelist": advidelist,
                })

        sorted_response_data = sorted(response_data, key=lambda x: len(x["badges"]), reverse=True)
        logger.info("요청 처리 완료")
        return sorted_response_data

    finally:
        is_processing = False

@app.get("/channel-info/{channel_id}")
async def get_channel_info(channel_id: str):
    channel_data = df_channel[df_channel['channelId'] == channel_id]
    if channel_data.empty:
        return {"title": "알 수 없음", "thumbnail": ""}

    channel_info = channel_data.iloc[0]
    return {
        "title": channel_info.get('channelTitle', '알 수 없음'),
        "thumbnail": channel_info.get('channelThumbnail', '')
    }
