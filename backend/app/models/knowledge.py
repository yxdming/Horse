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
