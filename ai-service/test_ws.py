import asyncio
import websockets

async def test():
    try:
        async with websockets.connect('ws://localhost:8000/ws/ai/chat') as ws:
            print("Connected!")
            await ws.send('{"type":"auth", "userId": "123", "userRole": "admin"}')
            res = await ws.recv()
            print("Received:", res)
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
