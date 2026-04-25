"""
AI Service Runner - Chạy mà không cần --reload để tránh lỗi multiprocessing trên Windows
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Run the main module
if __name__ == "__main__":
    from app.main import app, settings
    import uvicorn
    
    print("=" * 60)
    print("Digital HRM AI Service")
    print("=" * 60)
    print(f"Server: http://{settings.service_host}:{settings.service_port}")
    print(f"Docs:   http://{settings.service_host}:{settings.service_port}/docs")
    print(f"Health: http://{settings.service_host}:{settings.service_port}/health")
    print("=" * 60)
    print("Starting without reload (Windows compatible)...")
    print()
    
    uvicorn.run(
        "app.main:app",
        host=settings.service_host,
        port=settings.service_port,
        reload=True,
        log_level=settings.log_level.lower(),
    )
