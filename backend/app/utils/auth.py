from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import secrets


class AuthHandler:
    """Authentication handler for password hashing and token generation"""

    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.secret_key = secrets.token_urlsafe(32)
        self.algorithm = "HS256"

    def get_password_hash(self, password: str) -> str:
        """Hash password"""
        return self.pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password"""
        return self.pwd_context.verify(plain_password, hashed_password)

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        # Simple token implementation
        return secrets.token_urlsafe(32)


# Global auth handler instance
auth_handler = AuthHandler()
