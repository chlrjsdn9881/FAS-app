# FAS Server 수정 파일

이 폴더는 FAS API 서버(Docker: fas_api)에서 수정된 파일들입니다.

## 수정 내용

### 새 파일
- `routers/push_tokens.py` — Expo 푸시 토큰 등록 API (`POST /api/push-tokens`)

### 기존 파일 수정 내용

#### `routers/sensors.py` (수정 부분 발췌: `routers/sensors_push_excerpt.py`)
- `fire_detected` 상태 수신 시 push_tokens 테이블의 모든 토큰으로 Expo 푸시 알림 발송
- 정상(normal) 상태 수신 시 해당 소화기의 활성 알림 자동 해제 + `alert.resolved` SSE 브로드캐스트

#### `main.py`
```python
from routers import push_tokens as push_tokens_router
app.include_router(push_tokens_router.router)
```

## DB 마이그레이션

```sql
CREATE TABLE IF NOT EXISTS push_tokens (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    token VARCHAR(255) NOT NULL UNIQUE,
    admin_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 서버 적용 방법

```bash
docker cp push_tokens.py fas_api:/app/routers/push_tokens.py
docker restart fas_api
```
