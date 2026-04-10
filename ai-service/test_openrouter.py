"""Test kết nối Vitexa Gateway (gate.vitexa.app)"""
import httpx
import asyncio

API_KEY = "cpa_b389cc299de1ccd0b6bb8c5c64a0a445f903b713f939fbccb839eb017697771e"
BASE_URL = "https://gate.vitexa.app/v1"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}


async def test_models():
    print("=== Test: Lay danh sach models ===")
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{BASE_URL}/models", headers=HEADERS)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            models = data.get("data", [])
            print(f"Total models: {len(models)}")
            for m in models:
                print(f"  - {m['id']} (owned_by: {m.get('owned_by', 'N/A')})")
        else:
            print(f"Error: {r.text}")


async def test_chat(model_id: str):
    print(f"\n=== Test: Chat voi {model_id} ===")
    payload = {
        "model": model_id,
        "messages": [
            {"role": "system", "content": "Ban la tro ly AI cho he thong quan ly nhan su."},
            {"role": "user", "content": "Xin chao! Hay gioi thieu ban la ai?"}
        ],
        "max_tokens": 200,
        "temperature": 0.7,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{BASE_URL}/chat/completions", headers=HEADERS, json=payload)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            choice = data["choices"][0]
            content = choice["message"].get("content") or "(no content)"
            usage = data.get("usage", {})
            print(f"Response: {content}")
            print(f"Finish reason: {choice.get('finish_reason')}")
            print(f"Tokens: prompt={usage.get('prompt_tokens')}, completion={usage.get('completion_tokens')}, total={usage.get('total_tokens')}")
        else:
            print(f"Error: {r.text}")


async def main():
    await test_models()
    await test_chat("gpt-5.3-codex")
    await test_chat("gpt-5.4-mini")
    print("\n=== DONE ===")


if __name__ == "__main__":
    asyncio.run(main())
