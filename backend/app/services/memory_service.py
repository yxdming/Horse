from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from uuid import uuid4
from app.models.memory import Memory, MemoryCreate, MemoryUpdate, MemorySearchParams, MemoryUser, MemoryUserCreate, MemoryUserUpdate
from app.utils.file_handler import file_handler


class MemoryService:
    """Memory business logic service"""

    def __init__(self):
        self.file_handler = file_handler

    def get_all_memories(self, params: MemorySearchParams) -> Dict[str, Any]:
        """Get memories with filtering and pagination"""
        data = self.file_handler.read_json('memories.json', {'memories': []})
        memories = data.get('memories', [])

        # Apply filters
        if params.category:
            memories = [m for m in memories if m.get('category') == params.category]

        if params.memory_type:
            memories = [m for m in memories if m.get('memory_type') == params.memory_type]

        if params.min_importance:
            memories = [m for m in memories if m.get('importance', 0) >= params.min_importance]

        if params.search:
            search_lower = params.search.lower()
            memories = [
                m for m in memories
                if search_lower in m.get('title', '').lower() or
                   search_lower in m.get('content', '').lower() or
                   any(search_lower in tag.lower() for tag in m.get('tags', []))
            ]

        # Sort by importance (descending) and created_at (descending)
        memories.sort(key=lambda x: (
            -x.get('importance', 0),
            x.get('created_at', '')
        ))

        # Pagination
        total = len(memories)
        start = params.skip
        end = start + params.limit
        paginated_memories = memories[start:end]

        return {
            'memories': paginated_memories,
            'total': total
        }

    def get_memory_by_id(self, memory_id: str) -> Optional[Dict[str, Any]]:
        """Get memory by ID"""
        data = self.file_handler.read_json('memories.json', {'memories': []})
        memories = data.get('memories', [])

        for memory in memories:
            if memory['id'] == memory_id:
                # Increment access count
                memory['access_count'] = memory.get('access_count', 0) + 1
                memory['last_accessed'] = datetime.now(timezone.utc).isoformat()

                # Save updated memory
                for i, m in enumerate(memories):
                    if m['id'] == memory_id:
                        memories[i] = memory
                        break

                self.file_handler.write_json('memories.json', {'memories': memories})
                return memory

        return None

    def create_memory(self, memory_create: MemoryCreate) -> Dict[str, Any]:
        """Create new memory"""
        data = self.file_handler.read_json('memories.json', {'memories': []})
        memories = data.get('memories', [])

        # Create new memory
        memory = Memory(
            id=str(uuid4()),
            title=memory_create.title,
            content=memory_create.content,
            category=memory_create.category,
            tags=memory_create.tags,
            importance=memory_create.importance,
            memory_type=memory_create.memory_type,
            vectorized=False,
            created_at=datetime.now(timezone.utc),
            access_count=0
        )

        memories.append(memory.dict())
        self.file_handler.write_json('memories.json', {'memories': memories})

        return memory.dict()

    def update_memory(self, memory_id: str, memory_update: MemoryUpdate) -> Optional[Dict[str, Any]]:
        """Update memory"""
        data = self.file_handler.read_json('memories.json', {'memories': []})
        memories = data.get('memories', [])

        for i, memory in enumerate(memories):
            if memory['id'] == memory_id:
                # Update fields
                update_data = memory_update.dict(exclude_unset=True)
                memory.update(update_data)
                memory['updated_at'] = datetime.now(timezone.utc).isoformat()

                memories[i] = memory
                self.file_handler.write_json('memories.json', {'memories': memories})
                return memory

        return None

    def delete_memory(self, memory_id: str) -> bool:
        """Delete memory"""
        data = self.file_handler.read_json('memories.json', {'memories': []})
        memories = data.get('memories', [])
        original_length = len(memories)
        memories = [m for m in memories if m['id'] != memory_id]

        if len(memories) < original_length:
            self.file_handler.write_json('memories.json', {'memories': memories})
            return True
        return False

    def get_categories(self) -> List[str]:
        """Get all unique categories"""
        data = self.file_handler.read_json('memories.json', {'memories': []})
        memories = data.get('memories', [])
        categories = list(set(m.get('category', '默认分类') for m in memories))
        return sorted(categories)

    def get_memory_types(self) -> List[str]:
        """Get all unique memory types"""
        return ['长期记忆', '短期记忆', '工作记忆']

    def get_memory_stats(self) -> Dict[str, Any]:
        """Get memory statistics"""
        data = self.file_handler.read_json('memories.json', {'memories': []})
        memories = data.get('memories', [])

        total = len(memories)
        vectorized = len([m for m in memories if m.get('vectorized', False)])
        by_type = {}
        by_category = {}

        for memory in memories:
            # Count by type
            memory_type = memory.get('memory_type', '长期记忆')
            by_type[memory_type] = by_type.get(memory_type, 0) + 1

            # Count by category
            category = memory.get('category', '默认分类')
            by_category[category] = by_category.get(category, 0) + 1

        # Average importance
        importances = [m.get('importance', 3) for m in memories]
        avg_importance = sum(importances) / len(importances) if importances else 0

        # Total access count
        total_access = sum(m.get('access_count', 0) for m in memories)

        return {
            'total_memories': total,
            'vectorized_memories': vectorized,
            'by_type': by_type,
            'by_category': by_category,
            'avg_importance': round(avg_importance, 2),
            'total_access': total_access,
            'most_accessed': sorted(memories, key=lambda x: x.get('access_count', 0), reverse=True)[:5]
        }

    # ==================== Memory User Permission Management ====================

    def get_all_memory_users(self) -> Dict[str, Any]:
        """Get all memory users with permissions"""
        data = self.file_handler.read_json('memory_users.json', {'users': []})
        users = data.get('users', [])

        return {
            'users': users,
            'total': len(users)
        }

    def get_memory_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get memory user by ID"""
        data = self.file_handler.read_json('memory_users.json', {'users': []})
        users = data.get('users', [])

        for user in users:
            if user['id'] == user_id:
                return user

        return None

    def create_memory_user(self, user_create: MemoryUserCreate) -> Dict[str, Any]:
        """Create new memory user"""
        data = self.file_handler.read_json('memory_users.json', {'users': []})
        users = data.get('users', [])

        # Check if username already exists
        for user in users:
            if user['username'] == user_create.username:
                raise ValueError(f"用户 '{user_create.username}' 已存在")

        # Create new user
        user = MemoryUser(
            id=str(uuid4()),
            username=user_create.username,
            role=user_create.role,
            permissions=user_create.permissions,
            memory_count=0,
            last_access=None,
            created_at=datetime.now(timezone.utc)
        )

        users.append(user.dict())
        self.file_handler.write_json('memory_users.json', {'users': users})

        return user.dict()

    def update_memory_user(self, user_id: str, user_update: MemoryUserUpdate) -> Optional[Dict[str, Any]]:
        """Update memory user"""
        data = self.file_handler.read_json('memory_users.json', {'users': []})
        users = data.get('users', [])

        for i, user in enumerate(users):
            if user['id'] == user_id:
                # Update fields
                update_data = user_update.dict(exclude_unset=True)

                # Check if username is being changed and if it already exists
                if 'username' in update_data:
                    for other_user in users:
                        if other_user['id'] != user_id and other_user['username'] == update_data['username']:
                            raise ValueError(f"用户名 '{update_data['username']}' 已被使用")

                user.update(update_data)
                users[i] = user
                self.file_handler.write_json('memory_users.json', {'users': users})
                return user

        return None

    def delete_memory_user(self, user_id: str) -> bool:
        """Delete memory user"""
        data = self.file_handler.read_json('memory_users.json', {'users': []})
        users = data.get('users', [])
        original_length = len(users)
        users = [u for u in users if u['id'] != user_id]

        if len(users) < original_length:
            self.file_handler.write_json('memory_users.json', {'users': users})
            return True
        return False


# Global memory service instance
memory_service = MemoryService()
