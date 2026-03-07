from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.models.memory import Memory, MemoryCreate, MemoryUpdate, MemorySearchParams
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


@router.get("/{memory_id}", response_model=dict)
async def get_memory(memory_id: str):
    """Get memory by ID"""
    memory = memory_service.get_memory_by_id(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    return memory


@router.post("/", response_model=dict)
async def create_memory(memory_create: MemoryCreate):
    """Create new memory"""
    try:
        return memory_service.create_memory(memory_create)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


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
