"""
ESP32 노드 시뮬레이터 (실제 하드웨어 없이 테스트용)
실행: python test_node_sim.py
"""

import asyncio
import json
import random
import websockets

SERVER = "ws://localhost:8000"

async def simulate_node(node_id: str, fire_after: float = None):
    uri = f"{SERVER}/ws/node/{node_id}"
    async with websockets.connect(uri) as ws:
        print(f"[노드 {node_id}] 연결됨")
        elapsed = 0
        while True:
            fire = fire_after is not None and elapsed >= fire_after
            payload = {
                "node_id": node_id,
                "fire": fire,
                "temp": round(random.uniform(20, 35 if not fire else 80), 1),
                "humidity": round(random.uniform(40, 60), 1),
            }
            await ws.send(json.dumps(payload))
            status = "🔥 화재!" if fire else "정상"
            print(f"[노드 {node_id}] {status} 전송")
            await asyncio.sleep(5)
            elapsed += 5

async def main():
    print("ESP32 시뮬레이터 시작")
    print("  - 노드 1~4: 정상 유지")
    print("  - 노드 7: 15초 후 화재 감지 시뮬레이션")
    print()

    await asyncio.gather(
        simulate_node("1"),
        simulate_node("2"),
        simulate_node("3"),
        simulate_node("4"),
        simulate_node("7", fire_after=15),
    )

if __name__ == "__main__":
    asyncio.run(main())
