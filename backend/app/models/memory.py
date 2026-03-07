from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class MemoryBase(BaseModel):
    """Memory base model"""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    category: str = Field(default="默认分类", max_length=50)
    tags: List[str] = Field(default_factory=list)
    importance: int = Field(default=3, ge=1, le=5)  # 1-5重要性级别
    memory_type: str = Field(default="长期记忆", description="记忆类型：长期记忆、短期记忆、工作记忆")


class MemoryCreate(MemoryBase):
    """Memory creation model"""
    pass


class MemoryUpdate(BaseModel):
    """Memory update model"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]] = None
    importance: Optional[int] = Field(None, ge=1, le=5)
    memory_type: Optional[str] = None
    vectorized: Optional[bool] = None


class Memory(MemoryBase):
    """Memory complete model"""
    id: str
    vectorized: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    access_count: int = Field(default=0, description="访问次数")
    last_accessed: Optional[datetime] = Field(None, description="最后访问时间")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class MemorySearchParams(BaseModel):
    """Memory search parameters"""
    skip: int = 0
    limit: int = 10
    category: Optional[str] = None
    memory_type: Optional[str] = None
    search: Optional[str] = None
    min_importance: Optional[int] = Field(None, ge=1, le=5)
