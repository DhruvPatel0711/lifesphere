"""
LifeSphere Backend — Family & Vaccination Schemas
"""

from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class FamilyMemberCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    relation: str = Field(..., pattern="^(father|mother|spouse|child|sibling|grandparent|other)$")
    age: int = Field(..., ge=0, le=150)
    blood_type: str = "O+"
    avatar: str = "👤"
    conditions: List[str] = Field(default_factory=list)
    medications: List[str] = Field(default_factory=list)


class FamilyMemberUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    relation: Optional[str] = None
    age: Optional[int] = Field(None, ge=0, le=150)
    blood_type: Optional[str] = None
    avatar: Optional[str] = None
    conditions: Optional[List[str]] = None
    medications: Optional[List[str]] = None


class FamilyMemberResponse(BaseModel):
    id: str
    user_id: str
    name: str
    relation: str
    age: int
    blood_type: str
    avatar: str
    conditions: List[str]
    medications: List[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VaccinationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    date: date
    person: str = "Self"
    family_member_id: Optional[str] = None
    next_due: Optional[date] = None
    status: str = Field(default="completed", pattern="^(completed|pending)$")


class VaccinationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    date: Optional[date] = None
    person: Optional[str] = None
    family_member_id: Optional[str] = None
    next_due: Optional[date] = None
    status: Optional[str] = Field(None, pattern="^(completed|pending)$")


class VaccinationResponse(BaseModel):
    id: str
    user_id: str
    family_member_id: Optional[str] = None
    name: str
    date: date
    next_due: Optional[date] = None
    status: str
    person: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
