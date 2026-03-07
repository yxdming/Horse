from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class DatabaseSourceBase(BaseModel):
    """Database source base model"""
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., description="MySQL, PostgreSQL, Oracle, SQLServer")
    host: str = Field(..., min_length=1)
    port: int = Field(..., ge=1, le=65535)
    database: str = Field(..., min_length=1)
    username: str = Field(..., min_length=1)
    password: Optional[str] = None
    description: Optional[str] = None


class DatabaseSourceCreate(DatabaseSourceBase):
    """Database source creation model"""
    pass


class DatabaseSource(DatabaseSourceBase):
    """Database source complete model"""
    id: str
    status: str = "disconnected"
    table_count: int = 0
    last_sync: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class GlossaryTermBase(BaseModel):
    """Glossary term base model"""
    term: str = Field(..., min_length=1, max_length=50, description="术语，如GMV、DAU")
    definition: str = Field(..., min_length=1, description="定义说明")
    mapping: str = Field(..., min_length=1, description="SQL映射规则")
    category: str = Field(default="销售指标", description="术语分类")
    example: str = Field(..., min_length=1, description="示例问句")


class GlossaryTermCreate(GlossaryTermBase):
    """Glossary term creation model"""
    pass


class GlossaryTerm(GlossaryTermBase):
    """Glossary term complete model"""
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class QuestionHistoryBase(BaseModel):
    """Question history base model"""
    question: str = Field(..., min_length=1)
    sql: str = Field(..., min_length=1)
    result: Optional[str] = None
    duration: int = Field(..., ge=0, description="执行耗时(ms)")
    status: str = Field(..., description="success or error")
    database_name: str = Field(..., min_length=1)
    confidence: Optional[float] = Field(None, ge=0, le=1, description="置信度")


class QuestionHistoryCreate(QuestionHistoryBase):
    """Question history creation model"""
    pass


class QuestionHistory(QuestionHistoryBase):
    """Question history complete model"""
    id: str
    created_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class QuestionRequest(BaseModel):
    """Question request model"""
    question: str = Field(..., min_length=1)
    database_id: str = Field(..., description="数据源ID")


class QuestionResponse(BaseModel):
    """Question response model"""
    sql: str
    explanation: str
    confidence: float = Field(..., ge=0, le=1, description="置信度")
    glossaries: List[str] = []
    estimated_rows: Optional[int] = None
