from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
import uuid


class User(BaseModel):
    """User data model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    role: str = Field(default="user", pattern="^(admin|user|readonly)$")
    status: str = Field(default="active", pattern="^(active|inactive)$")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None


class UserCreate(BaseModel):
    """User creation model"""
    username: str
    email: EmailStr
    role: str = "user"


class UserUpdate(BaseModel):
    """User update model"""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    status: Optional[str] = None


class UserResponse(BaseModel):
    """User response model"""
    id: str
    username: str
    email: str
    role: str
    status: str
    created_at: datetime
    last_login: Optional[datetime] = None
