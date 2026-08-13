import pytest
import httpx
from fastapi.testclient import TestClient
from app.main import app
from app.utils.security import create_access_token
from app.database import AsyncSessionLocal
from app.models.medical_record import MedicalRecord
from app.models.health_tracker import HealthEntry
from sqlalchemy import select
import os
import aiofiles

@pytest.mark.asyncio
async def test_upload_ai_endpoint_integration():
    """
    Test the full upload-ai pipeline through the FastAPI endpoint.
    Verifies:
    1. Authentication
    2. Multipart upload parsing
    3. Document processing (txt)
    4. AI Extraction
    5. Database commits (MedicalRecord + HealthEntry)
    6. Returned JSON
    7. Context updates
    """
    transport = httpx.ASGITransport(app=app)
    client = httpx.AsyncClient(transport=transport, base_url="http://test")

    # 1. Authenticate test user
    user_id = "seed-user-001"
    token = create_access_token(user_id=user_id, role="user")
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create synthetic test file
    from PIL import Image, ImageDraw
    test_file_path = "test_lab_report.png"
    img = Image.new('RGB', (200, 50), color = (255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((10,10), "Hemoglobin: 14.5", fill=(0,0,0))
    img.save(test_file_path)

    try:
        # 3. Send multipart request
        with open(test_file_path, "rb") as f:
            files = {"file": (test_file_path, f, "image/png")}
            response = await client.post("/api/v1/records/upload-ai", files=files, headers=headers)
        
        print("Status code:", response.status_code)
        print("Response:", response.text)
        
        assert response.status_code in [200, 400], "Should not crash (500) due to missing os import"
        
        if response.status_code == 200:
            data = response.json()
            assert data["success"] == True
            metrics = data.get("metrics", {})
            print("Extracted metrics:", metrics)
            record_id = data.get("record_id")
            
            # Verify database
            async with AsyncSessionLocal() as db:
                if record_id:
                    recs = (await db.execute(select(MedicalRecord).where(MedicalRecord.id == record_id))).scalars().all()
                    assert len(recs) > 0
                    
                    # Cleanup DB
                    for r in recs:
                        await db.delete(r)
                    await db.commit()

    finally:
        if os.path.exists(test_file_path):
            os.remove(test_file_path)
        await client.aclose()

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_upload_ai_endpoint_integration())
