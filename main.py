
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import json

app = FastAPI()

# CORS middleware to allow React frontend on specific IP/port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://192.168.4.4:3000"],  # your React app origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Manage WebSocket connections keyed by deviceId
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket):
        # Accept incoming websocket connection
        await websocket.accept()

    def register_device(self, device_id: str, websocket: WebSocket):
        self.active_connections[device_id] = websocket
        print(f"✅ Registered: {device_id}")

    def disconnect(self, websocket: WebSocket):
        # Remove disconnected websocket from dict
        for device_id, ws in list(self.active_connections.items()):
            if ws == websocket:
                del self.active_connections[device_id]
                print(f"❌ Disconnected: {device_id}")
                break

    async def send_to_device(self, device_id: str, message: str):
        ws = self.active_connections.get(device_id)
        if ws:
            await ws.send_text(message)

    async def broadcast(self, message: str):
        # Send message to all connected devices
        for ws in self.active_connections.values():
            await ws.send_text(message)


manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Expect client to send {"deviceId": "ESP1"} as initial message
        init_msg = await websocket.receive_text()
        data = json.loads(init_msg)
        device_id = data.get("deviceId")

        if not device_id:
            await websocket.close()
            return

        manager.register_device(device_id, websocket)
        await websocket.send_text(f"Connected as {device_id}")

        # Keep connection alive; process incoming messages if needed
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/data")
async def receive_sensor_data(payload: dict):
    """
    Receive JSON sensor data from POST:
    {
      "deviceId": "ESP1",
      "value": 123,
      "timestamp": "2024-06-19T12:34:56"
    }
    Broadcast to all WebSocket clients
    """
    # Broadcast incoming data as JSON string
    await manager.broadcast(json.dumps(payload))
    return {"status": "ok"}
