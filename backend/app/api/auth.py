from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import timedelta
from app.services.user_service import user_service
from app.utils.auth import auth_handler


router = APIRouter()


class LoginRequest(BaseModel):
    """Login request model"""
    username: str
    password: str


class LoginResponse(BaseModel):
    """Login response model"""
    access_token: str
    token_type: str
    user: dict


@router.post("/login", response_model=LoginResponse)
async def login(login_request: LoginRequest):
    """Authenticate user and return access token"""
    # Authenticate user
    user = user_service.authenticate_user(login_request.username, login_request.password)

    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    # Check if user is active
    if user.get('status') != 'active':
        raise HTTPException(status_code=403, detail="账户已被禁用")

    # Update last login time
    user_service.update_last_login(user['id'])

    # Create access token
    access_token = auth_handler.create_access_token(
        data={"sub": user['username']},
        expires_delta=timedelta(hours=24)
    )

    # Return user info (excluding sensitive data)
    user_response = {
        'id': user['id'],
        'username': user['username'],
        'email': user.get('email', ''),
        'role': user.get('role', 'user'),
        'status': user.get('status', 'active'),
        'loginTime': user.get('last_login')
    }

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )


@router.get("/me")
async def get_current_user(token: str):
    """Get current user info from token"""
    # Simple token validation (in production, use proper JWT validation)
    users = user_service.get_all_users()
    # For now, just return first user as placeholder
    # In real implementation, decode token and get user
    if users:
        user = users[0]
        return {
            'id': user['id'],
            'username': user['username'],
            'email': user.get('email', ''),
            'role': user.get('role', 'user')
        }
    raise HTTPException(status_code=404, detail="User not found")
