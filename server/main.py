"""
화재 대피 시스템 — 라즈베리 파이 FastAPI 서버
ESP32 노드 데이터 수신 + 관리자 웹 대시보드 서빙

실행: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
의존성: pip install fastapi uvicorn websockets
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="화재 대피 관리 서버")

# ── 전역 상태 (DB 없이 메모리 관리) ──────────────────────────────
node_states: Dict[str, str] = {str(i): "disconnected" for i in range(1, 11)}
node_last_seen: Dict[str, datetime] = {}
event_log: List[dict] = []
alarm_active: bool = False
admin_clients: List[WebSocket] = []


# ── 유틸 ─────────────────────────────────────────────────────────
def now_str() -> str:
    return datetime.now().strftime("%H:%M:%S")


def add_log(message: str, level: str = "info") -> dict:
    entry = {"time": now_str(), "message": message, "level": level}
    event_log.append(entry)
    if len(event_log) > 200:
        event_log.pop(0)
    return entry


async def broadcast(data: dict):
    dead = []
    for ws in admin_clients:
        try:
            await ws.send_json(data)
        except Exception:
            dead.append(ws)
    for ws in dead:
        if ws in admin_clients:
            admin_clients.remove(ws)


# ── ESP32 노드 WebSocket ─────────────────────────────────────────
@app.websocket("/ws/node/{node_id}")
async def node_ws(websocket: WebSocket, node_id: str):
    await websocket.accept()

    node_states[node_id] = "normal"
    node_last_seen[node_id] = datetime.now()
    log = add_log(f"{node_id}번 노드 연결됨", "info")
    await broadcast({"type": "node_update", "node_id": node_id, "state": "normal", "log": log})

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            node_last_seen[node_id] = datetime.now()

            fire_detected = bool(data.get("fire", False))
            current = node_states.get(node_id)

            if fire_detected and current != "fire":
                node_states[node_id] = "fire"
                log = add_log(f"{node_id}번 구역 화재 감지!", "fire")
                await broadcast({
                    "type": "node_update",
                    "node_id": node_id,
                    "state": "fire",
                    "log": log,
                    "trigger_alarm": True,
                })

            elif not fire_detected and current == "fire":
                node_states[node_id] = "normal"
                log = add_log(f"{node_id}번 노드 정상 복귀", "info")
                await broadcast({"type": "node_update", "node_id": node_id, "state": "normal", "log": log})

    except WebSocketDisconnect:
        node_states[node_id] = "disconnected"
        log = add_log(f"{node_id}번 노드 통신 끊김", "warn")
        await broadcast({"type": "node_update", "node_id": node_id, "state": "disconnected", "log": log})

    except Exception as e:
        node_states[node_id] = "disconnected"
        log = add_log(f"{node_id}번 노드 오류: {str(e)}", "warn")
        await broadcast({"type": "node_update", "node_id": node_id, "state": "disconnected", "log": log})


# ── 관리자 WebSocket ─────────────────────────────────────────────
@app.websocket("/ws/admin")
async def admin_ws(websocket: WebSocket):
    await websocket.accept()
    admin_clients.append(websocket)

    # 접속 즉시 현재 전체 상태 전송
    await websocket.send_json({
        "type": "init",
        "nodes": node_states,
        "logs": event_log[-30:],
        "alarm": alarm_active,
    })

    try:
        while True:
            # 클라이언트 연결 유지 (ping)
            await asyncio.wait_for(websocket.receive_text(), timeout=30)
    except (WebSocketDisconnect, asyncio.TimeoutError):
        pass
    except Exception:
        pass
    finally:
        if websocket in admin_clients:
            admin_clients.remove(websocket)


# ── 알람 REST API ─────────────────────────────────────────────────
@app.post("/alarm/trigger")
async def trigger_alarm():
    global alarm_active
    alarm_active = True
    log = add_log("관리자 수동 긴급 대피 알람 발동!", "alarm")
    await broadcast({"type": "alarm", "active": True, "log": log})
    return {"status": "triggered"}


@app.post("/alarm/reset")
async def reset_alarm():
    global alarm_active
    alarm_active = False
    log = add_log("알람 해제됨", "info")
    await broadcast({"type": "alarm", "active": False, "log": log})
    return {"status": "reset"}


@app.get("/status")
async def status():
    return {"nodes": node_states, "alarm": alarm_active, "log_count": len(event_log)}


# ── 노드 타임아웃 감시 (30초 무응답 → disconnected) ──────────────
async def watchdog():
    while True:
        await asyncio.sleep(10)
        now = datetime.now()
        for node_id, last in list(node_last_seen.items()):
            elapsed = (now - last).total_seconds()
            if elapsed > 30 and node_states.get(node_id) == "normal":
                node_states[node_id] = "disconnected"
                log = add_log(f"{node_id}번 노드 응답 없음 (타임아웃)", "warn")
                await broadcast({
                    "type": "node_update",
                    "node_id": node_id,
                    "state": "disconnected",
                    "log": log,
                })


@app.on_event("startup")
async def startup():
    asyncio.create_task(watchdog())
    add_log("서버 시작됨", "info")


# ── 정적 파일 (관리자 웹페이지) ──────────────────────────────────
app.mount("/", StaticFiles(directory="static", html=True), name="static")
