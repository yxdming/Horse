from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.user import User, UserCreate, UserUpdate
from app.utils.file_handler import file_handler


class UserService:
    """User business logic service"""

    def __init__(self):
        self.file_handler = file_handler

    def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all users"""
        data = self.file_handler.read_json('users.json', {'users': []})
        return data.get('users', [])

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        users = self.get_all_users()
        for user in users:
            if user['id'] == user_id:
                return user
        return None

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        users = self.get_all_users()
        for user in users:
            if user['email'] == email:
                return user
        return None

    def create_user(self, user_create: UserCreate) -> Dict[str, Any]:
        """Create new user"""
        users = self.get_all_users()

        # Check if email already exists
        if self.get_user_by_email(user_create.email):
            raise ValueError("User with this email already exists")

        # Create new user
        user = User(
            username=user_create.username,
            email=user_create.email,
            role=user_create.role
        )

        users.append(user.dict())
        self.file_handler.write_json('users.json', {'users': users})

        return user.dict()

    def update_user(self, user_id: str, user_update: UserUpdate) -> Optional[Dict[str, Any]]:
        """Update user"""
        users = self.get_all_users()
        for i, user in enumerate(users):
            if user['id'] == user_id:
                # Update fields
                update_data = user_update.dict(exclude_unset=True)
                user.update(update_data)
                user['updated_at'] = datetime.utcnow().isoformat()

                users[i] = user
                self.file_handler.write_json('users.json', {'users': users})
                return user
        return None

    def delete_user(self, user_id: str) -> bool:
        """Delete user"""
        users = self.get_all_users()
        original_length = len(users)
        users = [user for user in users if user['id'] != user_id]

        if len(users) < original_length:
            self.file_handler.write_json('users.json', {'users': users})
            return True
        return False

    def update_last_login(self, user_id: str) -> bool:
        """Update user last login time"""
        users = self.get_all_users()
        for user in users:
            if user['id'] == user_id:
                user['last_login'] = datetime.utcnow().isoformat()
                self.file_handler.write_json('users.json', {'users': users})
                return True
        return False

    def get_user_stats(self) -> Dict[str, Any]:
        """Get user statistics"""
        users = self.get_all_users()
        active_users = [u for u in users if u.get('status') == 'active']

        return {
            'total_users': len(users),
            'active_users': len(active_users),
            'admin_count': len([u for u in users if u.get('role') == 'admin']),
            'user_count': len([u for u in users if u.get('role') == 'user']),
            'readonly_count': len([u for u in users if u.get('role') == 'readonly'])
        }


# Global user service instance
user_service = UserService()
