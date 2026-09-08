"""
POST /api/vision/infer  —  ESP32-CAM 이미지 수신 → YOLOv8n 추론 → sensors/update 호출

[팀원 통합 방법]
1. pip install ultralytics httpx pillow

2. main.py에 아래 추가:
       import os
       from fastapi.staticfiles import StaticFiles
       from vision_router import router as vision_router

       os.makedirs("snapshots", exist_ok=True)
       app.mount("/snapshots", StaticFiles(directory="snapshots"), name="snapshots")
       app.include_router(vision_router)

3. 서버 재시작 — 첫 실행 시 yolov8n.pt (~6MB) 자동 다운로드

[ESP32-CAM에서 호출하는 방법]
POST http://<서버IP>:8000/api/vision/infer
Content-Type: multipart/form-data
  - extinguisher_id: int   (소화기 DB ID)
  - image: JPEG 파일

[스냅샷 조회]
GET http://<서버IP>:8000/snapshots/ext_<extinguisher_id>.jpg
→ 웹페이지에서 이 URL로 최신 스냅샷 표시 가능
"""

import os
import io
from fastapi import APIRouter, UploadFile, File, Form
import httpx

router = APIRouter(prefix="/api/vision", tags=["vision"])

SNAPSHOTS_DIR = "snapshots"
SERVER_BASE_URL = "http://168.131.224.195:8000"  # 서버 공인 IP

# 모델 첫 요청 시 로드 (이후 메모리 유지)
_model = None

def _get_model():
    global _model
    if _model is None:
        from ultralytics import YOLO
        _model = YOLO("yolov8n.pt")
    return _model


CONFIDENCE_THRESHOLD = 0.45
CENTER_RATIO = 0.5  # 이미지 중앙 50% 영역만 장애물 판정


def _save_snapshot(image_bytes: bytes, extinguisher_id: int) -> str:
    """이미지를 snapshots/ext_{id}.jpg 로 저장 (항상 덮어씀 — 최신 1장 유지)"""
    os.makedirs(SNAPSHOTS_DIR, exist_ok=True)
    filename = f"ext_{extinguisher_id}.jpg"
    path = os.path.join(SNAPSHOTS_DIR, filename)
    with open(path, "wb") as f:
        f.write(image_bytes)
    return f"{SERVER_BASE_URL}/snapshots/{filename}"


def _detect_obstacle(image_bytes: bytes):
    """
    이미지에서 소화기 앞 장애물 감지.
    반환: (detected_class | None, confidence)
    """
    from PIL import Image

    model = _get_model()
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    w, h = img.size

    cx1 = w * (1 - CENTER_RATIO) / 2
    cx2 = w * (1 + CENTER_RATIO) / 2
    cy1 = h * (1 - CENTER_RATIO) / 2
    cy2 = h * (1 + CENTER_RATIO) / 2

    results = model(img, verbose=False)[0]

    best_class = None
    best_conf = 0.0

    for box in results.boxes:
        conf = float(box.conf[0])
        if conf < CONFIDENCE_THRESHOLD:
            continue
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        if x2 > cx1 and x1 < cx2 and y2 > cy1 and y1 < cy2:
            if conf > best_conf:
                best_conf = conf
                best_class = results.names[int(box.cls[0])]

    return best_class, best_conf


@router.post("/infer")
async def vision_infer(
    extinguisher_id: int = Form(...),
    image: UploadFile = File(...),
):
    """
    ESP32-CAM이 주기적으로 호출.
    이미지 저장 + 추론 후 /api/sensors/update 에 결과 전달.
    """
    image_bytes = await image.read()

    # 스냅샷 저장 (최신 1장 덮어쓰기)
    snapshot_url = _save_snapshot(image_bytes, extinguisher_id)

    detected_class, confidence = _detect_obstacle(image_bytes)
    is_obstacle = detected_class is not None

    sensor_payload = {
        "extinguisher_id": extinguisher_id,
        "status": "obstacle" if is_obstacle else "normal",
        "snapshot_url": snapshot_url,
        "vision": {
            "detected_class": detected_class,
            "confidence_score": round(confidence, 4) if detected_class else None,
            "model_version": "yolov8n",
        },
    }

    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        await client.post("/api/sensors/update", json=sensor_payload, timeout=10.0)

    return {
        "extinguisher_id": extinguisher_id,
        "obstacle_detected": is_obstacle,
        "detected_class": detected_class,
        "confidence": round(confidence, 4) if detected_class else None,
        "snapshot_url": snapshot_url,
    }
