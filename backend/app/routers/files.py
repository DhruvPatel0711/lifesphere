"""
LifeSphere Backend ?" Authenticated File Retrieval
"""
from fastapi import APIRouter, Depends, Path
from fastapi.responses import FileResponse

from app.dependencies import CurrentUserId
from app.exceptions import UnauthorizedException, NotFoundException
from app.services.file_service import get_file_path
from app.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.medical_record import MedicalRecord

router = APIRouter(prefix="/uploads", tags=["Files"])

@router.get("/{path:path}")
async def get_uploaded_file(
    user_id: CurrentUserId,
    path: str = Path(...), 
    db: AsyncSession = Depends(get_db)
):
    """
    Serve uploaded files with proper authorization.
    """
    # Verify the requested path matches the authenticated user ID for direct ownership
    # Path is usually: {user_id}/{filename}
    parts = path.strip("/").split("/")
    if not parts or parts[0] != user_id:
        # Check if the user is authorized through a MedicalRecord
        # E.g. a family member's record owned by the primary user
        result = await db.execute(
            select(MedicalRecord).where(
                MedicalRecord.file_path == path,
                MedicalRecord.user_id == user_id,
                MedicalRecord.is_deleted == False
            )
        )
        if not result.scalar_one_or_none():
            raise UnauthorizedException("You do not have permission to access this file.")

    full_path = get_file_path(path)
    if not full_path:
        raise NotFoundException("File", path)

    # Determine media type (optional, FileResponse guesses based on extension)
    return FileResponse(full_path)
