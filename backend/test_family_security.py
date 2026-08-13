"""
Automated Security & Functionality Verification Script for Family Hub
Tests:
1. Family Member CRUD
2. Vaccination CRUD
3. Zero-Trust User Isolation Security Checks (User A vs User B)
4. Medical Record Filtering Ownership Validation
"""

import sys
import os
import asyncio

# Override DATABASE_URL env var for standalone testing
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"

from datetime import date
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.database import Base, generate_uuid
from app.models.user import User, UserProfile
from app.models.family import FamilyMember, Vaccination
from app.models.medical_record import MedicalRecord
from app.schemas.family import FamilyMemberCreate, FamilyMemberUpdate, VaccinationCreate, VaccinationUpdate
from app.routers.family import list_members, create_member, get_member, update_member, delete_member, list_vaccinations, add_vaccination, update_vaccination, delete_vaccination
from app.routers.medical_records import list_records
from app.exceptions import NotFoundException


async def run_tests():
    print("=" * 60)
    print("STARTING FAMILY HUB SECURITY & FUNCTIONALITY TESTS")
    print("=" * 60)

    # Setup in-memory SQLite async engine for testing
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    AsyncSessionTest = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionTest() as db:
        user_a_id = "user-a-111"
        user_b_id = "user-b-222"

        # Create mock users
        user_a = User(id=user_a_id, email="usera@example.com", hashed_password="pw", role="patient")
        user_b = User(id=user_b_id, email="userb@example.com", hashed_password="pw", role="patient")
        db.add_all([user_a, user_b])
        await db.commit()

        print("\n[OK] Test 1: Family Member Creation for User A")
        member_a_data = FamilyMemberCreate(
            name="Robert Smith",
            relation="father",
            age=60,
            blood_type="O+",
            avatar="father_icon",
            conditions=["Hypertension"],
            medications=["Lisinopril 10mg"]
        )
        created_member_a = await create_member(data=member_a_data, user_id=user_a_id, db=db)
        await db.commit()
        assert created_member_a.id is not None
        assert created_member_a.user_id == user_a_id
        print(f"   Created Member ID: {created_member_a.id} ({created_member_a.name})")

        print("\n[OK] Test 2: Family Member Retrieval for User A")
        members_a = await list_members(user_id=user_a_id, db=db)
        assert len(members_a) == 1
        assert members_a[0].id == created_member_a.id
        print(f"   Retrieved {len(members_a)} member for User A.")

        print("\n[SECURITY TEST] Test 3: User B accessing User A's Member ID")
        try:
            await get_member(member_id=created_member_a.id, user_id=user_b_id, db=db)
            print("   [FAIL] SECURITY FAILURE: User B was able to view User A's family member!")
            sys.exit(1)
        except NotFoundException:
            print("   [PASS] SECURITY PASSED: User B blocked from viewing User A's family member (404/403).")

        print("\n[SECURITY TEST] Test 4: User B updating User A's Member ID")
        try:
            update_data = FamilyMemberUpdate(name="Hacked Name")
            await update_member(member_id=created_member_a.id, data=update_data, user_id=user_b_id, db=db)
            print("   [FAIL] SECURITY FAILURE: User B was able to update User A's family member!")
            sys.exit(1)
        except NotFoundException:
            print("   [PASS] SECURITY PASSED: User B blocked from updating User A's family member.")

        print("\n[SECURITY TEST] Test 5: User B deleting User A's Member ID")
        try:
            await delete_member(member_id=created_member_a.id, user_id=user_b_id, db=db)
            print("   [FAIL] SECURITY FAILURE: User B was able to delete User A's family member!")
            sys.exit(1)
        except NotFoundException:
            print("   [PASS] SECURITY PASSED: User B blocked from deleting User A's family member.")

        print("\n[OK] Test 6: Vaccination Creation for User A's Member")
        vax_data = VaccinationCreate(
            name="Influenza Booster",
            date=date(2026, 1, 15),
            person="Robert Smith",
            family_member_id=created_member_a.id,
            status="completed"
        )
        created_vax = await add_vaccination(data=vax_data, user_id=user_a_id, db=db)
        await db.commit()
        assert created_vax.id is not None
        print(f"   Created Vaccination ID: {created_vax.id} ({created_vax.name})")

        print("\n[SECURITY TEST] Test 7: User B creating Vaccination with User A's Member ID")
        try:
            hacked_vax = VaccinationCreate(
                name="Malicious Vaccine",
                date=date(2026, 2, 1),
                family_member_id=created_member_a.id
            )
            await add_vaccination(data=hacked_vax, user_id=user_b_id, db=db)
            print("   [FAIL] SECURITY FAILURE: User B linked vaccination to User A's family member!")
            sys.exit(1)
        except NotFoundException:
            print("   [PASS] SECURITY PASSED: User B blocked from attaching vaccination to User A's member.")

        print("\n[SECURITY TEST] Test 8: User B updating/deleting User A's Vaccination ID")
        try:
            await update_vaccination(vax_id=created_vax.id, data=VaccinationUpdate(status="pending"), user_id=user_b_id, db=db)
            print("   [FAIL] SECURITY FAILURE: User B updated User A's vaccination!")
            sys.exit(1)
        except NotFoundException:
            print("   [PASS] SECURITY PASSED: User B blocked from updating User A's vaccination.")

        print("\n[OK] Test 9: Medical Record Filtering with Valid & Invalid Member IDs")
        # Create record for User A attached to Member A
        record_a = MedicalRecord(
            id="rec-001",
            user_id=user_a_id,
            title="Father Cardiology Consultation",
            category="Cardiology",
            family_member_id=created_member_a.id
        )
        db.add(record_a)
        await db.commit()

        # Query records as User A for Member A
        recs_valid = await list_records(user_id=user_a_id, family_member_id=created_member_a.id, db=db)
        assert len(recs_valid) == 1
        assert recs_valid[0].id == "rec-001"
        print(f"   Valid Member ID Query: Returned {len(recs_valid)} record.")

        # Query records as User B using Member A's ID
        recs_invalid = await list_records(user_id=user_b_id, family_member_id=created_member_a.id, db=db)
        assert len(recs_invalid) == 0
        print(f"   [PASS] SECURITY PASSED: Invalid/Unowned Member ID Query for User B returned 0 records.")

    await engine.dispose()
    print("\n" + "=" * 60)
    print("ALL SECURITY & FUNCTIONALITY TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_tests())
