from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.models.memory import Memory, MemoryCreate, MemoryUpdate, MemorySearchParams, MemoryUserCreate, MemoryUserUpdate
from app.services.memory_service import memory_service

router = APIRouter()


@router.get("/", response_model=dict)
async def get_memories(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    category: Optional[str] = None,
    memory_type: Optional[str] = None,
    search: Optional[str] = None,
    min_importance: Optional[int] = Query(None, ge=1, le=5)
):
    """Get memories with filtering and pagination"""
    params = MemorySearchParams(
        skip=skip,
        limit=limit,
        category=category,
        memory_type=memory_type,
        search=search,
        min_importance=min_importance
    )
    return memory_service.get_all_memories(params)


@router.get("/categories/list", response_model=dict)
async def get_categories():
    """Get all memory categories"""
    categories = memory_service.get_categories()
    return {"categories": categories}


@router.get("/types/list", response_model=dict)
async def get_memory_types():
    """Get all memory types"""
    types = memory_service.get_memory_types()
    return {"types": types}


@router.get("/stats/summary", response_model=dict)
async def get_memory_stats():
    """Get memory statistics"""
    return memory_service.get_memory_stats()


@router.post("/", response_model=dict)
async def create_memory(memory_create: MemoryCreate):
    """Create new memory"""
    try:
        return memory_service.create_memory(memory_create)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{memory_id}", response_model=dict)
async def get_memory(memory_id: str):
    """Get memory by ID"""
    memory = memory_service.get_memory_by_id(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    return memory


@router.put("/{memory_id}", response_model=dict)
async def update_memory(memory_id: str, memory_update: MemoryUpdate):
    """Update memory"""
    memory = memory_service.update_memory(memory_id, memory_update)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    return memory


@router.delete("/{memory_id}")
async def delete_memory(memory_id: str):
    """Delete memory"""
    success = memory_service.delete_memory(memory_id)
    if not success:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"message": "Memory deleted successfully"}


# ==================== Memory User Permission Management ====================

@router.get("/users/list", response_model=dict)
async def get_memory_users():
    """Get all memory users with permissions"""
    return memory_service.get_all_memory_users()


@router.get("/users/{user_id}", response_model=dict)
async def get_memory_user(user_id: str):
    """Get memory user by ID"""
    user = memory_service.get_memory_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/users/", response_model=dict)
async def create_memory_user(user_create: MemoryUserCreate):
    """Create new memory user"""
    try:
        return memory_service.create_memory_user(user_create)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/{user_id}", response_model=dict)
async def update_memory_user(user_id: str, user_update: MemoryUserUpdate):
    """Update memory user"""
    try:
        user = memory_service.update_memory_user(user_id, user_update)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{user_id}")
async def delete_memory_user(user_id: str):
    """Delete memory user"""
    success = memory_service.delete_memory_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}
