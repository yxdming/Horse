from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
import uuid


class KnowledgeDocument(BaseModel):
    """Knowledge document model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    category: str
    tags: List[str] = Field(default_factory=list)
    vectorized: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DocumentCreate(BaseModel):
    """Document creation model"""
    title: str
    content: str
    category: str
    tags: List[str] = Field(default_factory=list)


class DocumentUpdate(BaseModel):
    """Document update model"""
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None


class DocumentResponse(BaseModel):
    """Document response model"""
    id: str
    title: str
    content: str
    category: str
    tags: List[str]
    vectorized: bool
    created_at: datetime
    updated_at: datetime


class SearchResult(BaseModel):
    """Search result model"""
    id: str
    title: str
    content: str
    category: str
    tags: List[str]
    similarity_score: float


# Directory Mapping Models
class DirectoryMappingBase(BaseModel):
    """Directory mapping base model"""
    directory_name: str = Field(..., min_length=1, max_length=200)
    directory_path: str = Field(..., min_length=1, max_length=500)
    file_system: str = Field(default="LOCAL", description="文件系统类型：LOCAL, NFS, S3, HDFS")
    operator: str = Field(default="admin", max_length=50)


class DirectoryMappingCreate(DirectoryMappingBase):
    """Directory mapping creation model"""
    pass


class DirectoryMappingUpdate(BaseModel):
    """Directory mapping update model"""
    directory_name: Optional[str] = Field(None, min_length=1, max_length=200)
    directory_path: Optional[str] = Field(None, min_length=1, max_length=500)
    file_system: Optional[str] = None
    operator: Optional[str] = None


class DirectoryMapping(DirectoryMappingBase):
    """Directory mapping complete model"""
    id: str
    last_import_time: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
