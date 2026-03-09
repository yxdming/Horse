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


# Memory User Permission Models
class MemoryUserBase(BaseModel):
    """Memory user base model"""
    username: str = Field(..., min_length=1, max_length=50)
    role: str = Field(default="查看者", description="角色：管理员、编辑者、查看者")
    permissions: List[str] = Field(default_factory=list, description="权限列表：创建、编辑、删除、查看、全部")


class MemoryUserCreate(MemoryUserBase):
    """Memory user creation model"""
    pass


class MemoryUserUpdate(BaseModel):
    """Memory user update model"""
    username: Optional[str] = Field(None, min_length=1, max_length=50)
    role: Optional[str] = None
    permissions: Optional[List[str]] = None


class MemoryUser(MemoryUserBase):
    """Memory user complete model"""
    id: str
    memory_count: int = Field(default=0, description="记忆数量")
    last_access: Optional[datetime] = Field(None, description="最后访问时间")
    created_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# Memory Template Models
class MemoryTemplateBase(BaseModel):
    """Memory template base model"""
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)
    category: str = Field(default="默认分类", max_length=50)
    memory_type: str = Field(default="长期记忆", description="默认记忆类型")
    default_importance: int = Field(default=3, ge=1, le=5, description="默认重要性")
    tags: List[str] = Field(default_factory=list, description="默认标签")


class MemoryTemplateCreate(MemoryTemplateBase):
    """Memory template creation model"""
    pass


class MemoryTemplateUpdate(BaseModel):
    """Memory template update model"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=50)
    memory_type: Optional[str] = None
    default_importance: Optional[int] = Field(None, ge=1, le=5)
    tags: Optional[List[str]] = None


class MemoryTemplate(MemoryTemplateBase):
    """Memory template complete model"""
    id: str
    created_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
