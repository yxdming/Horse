import json
import os
from pathlib import Path
from typing import Any, Dict, List, TypeVar
from datetime import datetime, timezone

T = TypeVar('T')


class FileHandler:
    """JSON file handler for data persistence"""

    def __init__(self, base_path: str = "data"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(exist_ok=True)

    def _get_file_path(self, filename: str) -> Path:
        """Get full file path"""
        return self.base_path / filename

    def read_json(self, filename: str, default: Any = None) -> Any:
        """Read JSON file with error handling"""
        file_path = self._get_file_path(filename)
        if not file_path.exists():
            return default if default is not None else {}

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            print(f"Error reading {filename}: {e}")
            return default if default is not None else {}

    def write_json(self, filename: str, data: Any) -> bool:
        """Write JSON file with error handling"""
        file_path = self._get_file_path(filename)
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=self._json_serializer)
            return True
        except Exception as e:
            print(f"Error writing {filename}: {e}")
            return False

    def _json_serializer(self, obj: Any) -> Any:
        """Custom JSON serializer for datetime objects"""
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")

    def ensure_data_files(self) -> None:
        """Ensure all required data files exist with initial structure"""
        from app.utils.auth import auth_handler

        # Check if users.json exists and has users
        users_data = self.read_json('users.json', {'users': []})
        if not users_data.get('users'):
            # Create default admin user with hashed password
            default_admin = {
                'id': '1',
                'username': 'admin',
                'email': 'admin@aidp.com',
                'password_hash': auth_handler.get_password_hash('admin'),
                'role': 'admin',
                'status': 'active',
                'created_at': datetime.now(timezone.utc).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat(),
                'last_login': None
            }
            users_data['users'] = [default_admin]
            self.write_json('users.json', users_data)

        default_files = {
            'knowledge.json': {'documents': []},
            'memories.json': {'memories': []},
            'config.json': {
                'qa_strategy': {
                    'temperature': 0.7,
                    'max_tokens': 2000,
                    'top_k': 5,
                    'similarity_threshold': 0.75,
                    'system_prompt': '你是一个专业的AI助手，基于知识库内容回答用户问题。'
                }
            },
            'logs.json': {'logs': []}
        }

        for filename, default_data in default_files.items():
            file_path = self._get_file_path(filename)
            if not file_path.exists():
                self.write_json(filename, default_data)


# Global file handler instance
file_handler = FileHandler()
