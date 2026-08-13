import asyncio
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from app.database import AsyncSessionLocal
from app.models.user import User
from app.services.context_service import generate_user_context_txt
from sqlalchemy import select

async def main():
    print("=== TESTING USER CONTEXT .TXT GENERATION ===")
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).limit(1))
        user = res.scalar_one_or_none()
        if not user:
            print("[FAIL] No user found in database.")
            return

        print(f"Generating .txt context for user: {user.email} (ID: {user.id})")
        context_str = await generate_user_context_txt(user.id, db)
        
        print("\n--- GENERATED .TXT CONTEXT FILE CONTENT ---")
        safe_str = context_str.encode('ascii', 'replace').decode('ascii')
        print(safe_str)
        print("------------------------------------------")
        
        file_path = os.path.join(os.path.dirname(__file__), "user_contexts", f"{user.id}.txt")
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            approx_tokens = len(context_str.split()) * 1.3
            print(f"\n[PASS] Context file successfully created at: {file_path}")
            print(f"File Size: {file_size} bytes")
            print(f"Approximate Token Count: ~{int(approx_tokens)} tokens (ultra-dense & efficient!)")
        else:
            print("[FAIL] File was not found on disk.")

if __name__ == "__main__":
    asyncio.run(main())
