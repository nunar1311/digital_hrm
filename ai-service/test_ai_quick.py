"""Quick test to verify AI service is working end-to-end."""
import requests
import json
import sys
import io

# Fix Windows encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# =============================================
# Test 1: Health check
# =============================================
print("=" * 50)
print("TEST 1: Health Check")
print("=" * 50)
r = requests.get("http://localhost:8000/health")
health = r.json()
print(f"Status: {health['status']}")
print(f"Provider: {health['default_provider']}")
print(f"Model: {health['default_model']}")
print(f"DB: {health['database']['status']}")
print(f"Redis: {health['redis']['status']}")
print()

# =============================================
# Test 2: Direct AI chat via REST
# =============================================
print("=" * 50)
print("TEST 2: Smart Chat (REST API)")
print("=" * 50)

url = "http://localhost:8000/api/ai/smart-chat"
headers = {
    "Content-Type": "application/json",
    "x-internal-api-key": "D1i5RunfSxtjcED88JwVWmzJv4xIGVGoHFS37hXsrWU",
    "x-user-id": "test-user",
    "x-user-role": "ADMIN",
}
payload = {
    "message": "Hien tai cong ty co bao nhieu nhan vien?",
    "history": [],
    "sessionId": "test-session",
    "language": "vi",
}

print(f"Sending request to {url}...")
try:
    r = requests.post(url, json=payload, headers=headers, timeout=90)
    print(f"HTTP Status: {r.status_code}")
    data = r.json()

    if r.status_code == 200:
        content = data.get("content") or data.get("reply") or ""
        actions = data.get("actions") or []
        data_sources = data.get("data_sources") or []
        
        print(f"\nData sources used: {data_sources}")
        print(f"Actions executed: {len(actions)}")
        
        for act in actions:
            print(f"  - Tool: {act.get('tool')} | Status: {act.get('status')} | {act.get('description', '')[:60]}")
        
        if content:
            print(f"\n>>> AI RESPONSE <<<")
            print(content[:1000])
        else:
            print(f"Full response: {json.dumps(data, ensure_ascii=False, indent=2)[:1000]}")
            
        print(f"\n[SUCCESS] AI is working!")
    else:
        print(f"Error: {json.dumps(data, ensure_ascii=False, indent=2)[:500]}")

except Exception as e:
    print(f"Error: {e}")

print()
print("=" * 50)
print("DONE")
print("=" * 50)
