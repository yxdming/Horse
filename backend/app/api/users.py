from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.user import UserCreate, UserUpdate, UserResponse
from app.services.user_service import user_service


router = APIRouter()


@router.get("/")
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None
):
    """Get all users with optional filtering"""
    users = user_service.get_all_users()

    # Apply filters
    if search:
        search_lower = search.lower()
        users = [u for u in users if
                 search_lower in u.get('username', '').lower() or
                 search_lower in u.get('email', '').lower()]

    if role:
        users = [u for u in users if u.get('role') == role]

    if status:
        users = [u for u in users if u.get('status') == status]

    # Pagination
    total = len(users)
    users = users[skip:skip + limit]

    return {
        'users': users,
        'total': total,
        'skip': skip,
        'limit': limit
    }


@router.get("/{user_id}")
async def get_user(user_id: str):
    """Get user by ID"""
    user = user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", status_code=201)
async def create_user(user_create: UserCreate):
    """Create new user"""
    try:
        user = user_service.create_user(user_create)
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{user_id}")
async def update_user(user_id: str, user_update: UserUpdate):
    """Update user"""
    user = user_service.update_user(user_id, user_update)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}")
async def delete_user(user_id: str):
    """Delete user"""
    success = user_service.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


@router.post("/{user_id}/login")
async def user_login(user_id: str):
    """Update user last login time"""
    success = user_service.update_last_login(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Login time updated"}
