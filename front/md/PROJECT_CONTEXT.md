# 📌 프로젝트명
Stock Signal

# 🎯 서비스 목적
공시 / 뉴스 / 이벤트 데이터를 수집하고 점수화하여  
AI가 투자 참고용 추천 종목을 제공하는 웹 플랫폼

핵심 컨셉:

Event-driven AI Stock Recommendation

---

# 🧱 기술 스택

## Frontend
- Next.js 14 App Router
- React
- TypeScript
- Tailwind CSS
- Recharts

## Backend
- Next.js Route Handlers
- Service Layer Architecture

## Database
- PostgreSQL
- Prisma ORM

## AI
- OpenAI API
- Structured JSON Response

---

# 🧠 핵심 도메인

## Stock
종목 마스터 데이터

- id
- symbol
- name
- market
- sector
- createdAt

## Event
뉴스 / 공시 / 계약 / 실적 이벤트

- id
- stockId
- title
- summary
- eventType
- sourceType
- sourceName
- score
- publishedAt
- isNoise
- rawJson

## Recommendation

- id
- stockId
- targetDate
- totalScore
- confidence
- reason
- risk
- evidence(Json)
- createdAt

---

# 🔄 시스템 흐름

1. 종목 적재
2. 이벤트 수집
3. 이벤트 정규화
4. 이벤트 점수 계산
5. 추천 종목 생성
6. LLM 분석 생성
7. UI 제공

---

# 📊 추천 점수 계산 구조

finalScore =
baseScore × eventTypeWeight × sourceWeight × freshnessWeight

## 이벤트 타입 가중치

- CONTRACT = 1.8
- EARNINGS = 1.2
- PARTNERSHIP = 1.25
- PRODUCT = 1.1
- DISCLOSURE = 1.0

## 소스 가중치

- DART = 1.2
- NEWS = 1.0
- BASIC_INFO = 0.6

## 시간 가중치

- 1일 = 1.3
- 3일 = 1.15
- 7일 = 1.0
- 14일 = 0.8
- 30일 = 0.5

---

# 🤖 AI 분석 구조

- summary
- positives[]
- risks[]

---

# 🖥️ 페이지 구조

## /
- 대표 추천 종목
- 추천 리스트
- 점수 카드
- 요약 통계

## /recommendations
- 전체 추천 종목 리스트

## /stocks/[symbol]
- 종목 상세
- AI 분석
- 최근 이벤트
- 점수 차트

---

# 🎨 UI 방향성

- 데이터 중심 UI
- 컴팩트 카드형 디자인
- 다크모드
- 모바일 대응

---

# ⚠️ 현재 이슈

- 상세 페이지 안정화 필요
- 차트 데이터 연결 점검 필요
- mock 데이터 기반
- 추천 정확도 개선 필요

---

# 🚀 향후 확장

- 실시간 뉴스 API
- 알림 시스템
- 개인화 추천
- Flutter 앱 출시