"""Test WebSocket AI chat with correct SUPER_ADMIN role."""
import asyncio
import json
import sys
import io
import websockets

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

async def test_ws_chat():
    uri = "ws://localhost:8000/ws/ai/chat"
    print(f"Connecting to {uri}...")
    
    async with websockets.connect(uri) as ws:
        # Auth with correct role
        await ws.send(json.dumps({
            "type": "auth",
            "userId": "test-admin",
            "userRole": "SUPER_ADMIN"
        }))
        resp = json.loads(await ws.recv())
        print(f"Auth: {resp}")
        
        if resp.get("type") != "ready":
            print("AUTH FAILED!")
            return
        
        # Send chat
        await ws.send(json.dumps({
            "type": "chat",
            "message": "Cong ty co bao nhieu nhan vien?",
            "history": [],
            "sessionId": "test-ws",
            "language": "vi"
        }))
        print("Chat sent, waiting...\n")
        
        full_content = ""
        tools = []
        
        while True:
            try:
                data = json.loads(await asyncio.wait_for(ws.recv(), timeout=120))
                t = data.get("type")
                
                if t == "thinking":
                    print(f"  [THINK] {data.get('step')}")
                elif t == "tool_start":
                    tools.append(data.get("tool"))
                    print(f"  [TOOL] {data.get('tool')}: {data.get('description')}")
                elif t == "tool_result":
                    print(f"  [RESULT] {data.get('status')}")
                elif t == "token":
                    full_content += data.get("content", "")
                elif t == "done":
                    actions = data.get("actions") or []
                    sources = data.get("data_sources") or []
                    print(f"\n{'='*50}")
                    print(f"Tools: {tools}")
                    print(f"Sources: {sources}")
                    print(f"Actions: {len(actions)}")
                    for a in actions:
                        print(f"  {a.get('tool')}: {a.get('status')}")
                    print(f"\n>>> RESPONSE <<<\n{full_content[:1500]}")
                    print(f"\n[OK] Done!")
                    break
                elif t == "error":
                    print(f"  [ERROR] {data.get('error')}")
                    break
            except asyncio.TimeoutError:
                print("[TIMEOUT]")
                break

asyncio.run(test_ws_chat())
