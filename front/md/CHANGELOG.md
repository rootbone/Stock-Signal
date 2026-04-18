# 2026-04 최신 개발 로그

## 완료

### 시스템
- Next.js 14 App Router 구축
- Prisma + PostgreSQL 연결 완료
- Service Layer 분리 완료

### 데이터 파이프라인
- 종목 적재 API 구현
- 이벤트 적재 API 구현
- 추천 생성 API 구현

### AI
- OpenAI LLM 분석 연동
- JSON 응답 구조화 완료

### UI
- Header / Footer 완료
- 홈 화면 완성
- 추천 리스트 화면 완성
- 상세 페이지 1차 구현 완료

---

## 수정 이력

### 추천 엔진
- 이벤트 타입 가중치 추가
- 최신성 가중치 추가
- confidence 계산 추가

### Theme
- hydration 문제 수정 진행
- next-themes 제거 검토

### 상세 페이지
- notFound 과다 사용 제거 중
- DB 직접 조회 방식으로 변경 진행

---

## 발견된 문제

### 상세 페이지
- /stocks/[symbol] 404 발생 이력 있음

### 차트
- Recommendation 히스토리 부족

### 데이터
- Event.stockId 연결 여부 점검 필요

---

## 현재 안정 버전 기준

- 홈 화면 정상
- 추천 리스트 정상
- API 대부분 정상
- 상세 페이지 보강 필요