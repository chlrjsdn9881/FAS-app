# FAS API 서버 routers/sensors.py 중 푸시 발송·알림 자동 해제 부분 발췌
# (2026-09-14 fas_api 컨테이너 기준. 나머지 sensors.py는 팀 코드라 포함하지 않음)


# --- sensor_update() 안: 화재 감지 시 푸시 발송 ---
    if body.status == "fire_detected":
        asyncio.create_task(_send_fire_push(db))


# --- sensor_update() 안: 정상 복귀 시 활성 알림 자동 해제 ---
    resolved_alerts = []
    if body.status == "normal":
        active_alerts = db.query(Alert).filter(
            Alert.extinguisher_id == e.extinguisher_id,
            Alert.status == "active",
        ).all()
        for ra in active_alerts:
            ra.status = "resolved"
            resolved_alerts.append(ra)

    db.commit()
    # ...

# --- sensor_update() 안: 해제된 알림을 SSE로 전송 ---
    for ra in resolved_alerts:
        db.refresh(ra)
        await broadcaster.publish({
            "type": "alert.resolved",
            "alert": {
                "id":              f"AL-{ra.alert_id:03d}",
                "extinguisher_id": ra.extinguisher_id,
                "status":          ra.status,
            },
        })


async def _send_fire_push(db):
    """fire_detected 시 등록된 모든 푸시 토큰으로 Expo 푸시 알림 발송."""
    import httpx
    from sqlalchemy import text
    rows = db.execute(text("SELECT token FROM push_tokens")).fetchall()
    if not rows:
        return
    messages = [
        {"to": r[0], "channelId": "fire-alert",
         "title": "🔥 화재 감지!", "body": "소화기 센서에서 화재가 감지되었습니다. 앱을 열어 대피 경로를 확인하세요.",
         "sound": "default", "priority": "high"}
        for r in rows
    ]
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post("https://exp.host/--/api/v2/push/send", json=messages)
        print(f"[Push] 화재 알림 발송: {len(messages)}건, 응답: {resp.text[:200]}")
    except Exception as e:
        print(f"[Push] 발송 실패: {e}")
