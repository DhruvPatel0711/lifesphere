import asyncio
from app.database import AsyncSessionLocal
from app.models.user import User
from sqlalchemy import update

async def verify():
    async with AsyncSessionLocal() as db:
        await db.execute(update(User).values(is_verified=True))
        await db.commit()
        print("[OK] Set is_verified=True for all users in DB!")

if __name__ == "__main__":
    asyncio.run(verify())
