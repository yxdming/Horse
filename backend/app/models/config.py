from pydantic import BaseModel, Field
from typing import Optional


class QAStrategy(BaseModel):
    """QA Strategy configuration model"""
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2000, ge=100, le=8000)
    top_k: int = Field(default=5, ge=1, le=20)
    similarity_threshold: float = Field(default=0.75, ge=0.0, le=1.0)
    system_prompt: str = Field(default="你是一个专业的AI助手，基于知识库内容回答用户问题。")


class SystemConfig(BaseModel):
    """System configuration model"""
    qa_strategy: QAStrategy


class ConfigUpdate(BaseModel):
    """Configuration update model"""
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    top_k: Optional[int] = None
    similarity_threshold: Optional[float] = None
    system_prompt: Optional[str] = None
