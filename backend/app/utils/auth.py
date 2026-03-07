from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Optional
import secrets


class AuthHandler:
    """Authentication handler for password hashing and token generation"""

    def __init__(self):
        # Use bcrypt with rounds=12 for better security
        self.pwd_context = CryptContext(
            schemes=["bcrypt"],
            deprecated="auto",
            bcrypt__rounds=12
        )
        self.secret_key = secrets.token_urlsafe(32)
        self.algorithm = "HS256"

    def get_password_hash(self, password: str) -> str:
        """Hash password"""
        # Ensure password is string and truncate if necessary (bcrypt max 72 bytes)
        if not isinstance(password, str):
            password = str(password)
        # Truncate to 72 bytes if necessary
        password_bytes = password.encode('utf-8')
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
            password = password_bytes.decode('utf-8', errors='ignore')
        return self.pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password"""
        if not isinstance(plain_password, str):
            plain_password = str(plain_password)
        # Truncate to 72 bytes if necessary to match hash behavior
        password_bytes = plain_password.encode('utf-8')
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
            plain_password = password_bytes.decode('utf-8', errors='ignore')
        return self.pwd_context.verify(plain_password, hashed_password)

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        # Simple token implementation
        return secrets.token_urlsafe(32)


# Global auth handler instance
auth_handler = AuthHandler()
