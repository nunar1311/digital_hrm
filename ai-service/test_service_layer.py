"""Test service layer integration with Vitexa Gateway"""
import asyncio, sys
sys.path.insert(0, '.')

from app.services.openrouter_service import OpenRouterService


async def main():
    svc = OpenRouterService(api_key="")
    print("Service enabled:", svc.enabled)
    print("Base URL:", svc.base_url)

    # Test list_models
    models_res = await svc.list_models()
    print("Models count:", len(models_res.get("models", [])))
    for m in models_res.get("models", []):
        print(f"  {m['id']}")

    # Test chat_completion
    res = await svc.chat_completion(
        system_prompt="You are an HR assistant.",
        user_message="List 3 key HR metrics briefly.",
    )
    print("\nChat success:", res["success"])
    print("Content:", (res.get("content") or "-")[:200])
    print("Usage:", res.get("usage"))


asyncio.run(main())
