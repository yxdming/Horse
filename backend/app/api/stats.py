from fastapi import APIRouter
from app.services.user_service import user_service
from app.services.knowledge_service import knowledge_service
from app.services.vector_service import vector_service
from app.utils.file_handler import file_handler
from datetime import datetime, timedelta


router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    # User statistics
    user_stats = user_service.get_user_stats()

    # Knowledge statistics
    knowledge_stats = knowledge_service.get_knowledge_stats()

    # Vector statistics
    vector_stats = vector_service.get_stats()

    # System storage statistics
    import os
    storage_stats = {}
    for path_name, path in [
        ('data', 'data'),
        ('vectors', 'vectors')
    ]:
        if os.path.exists(path):
            total_size = 0
            for dirpath, dirnames, filenames in os.walk(path):
                for filename in filenames:
                    filepath = os.path.join(dirpath, filename)
                    if os.path.isfile(filepath):
                        total_size += os.path.getsize(filepath)
            storage_stats[path_name] = total_size / (1024 * 1024)  # Convert to MB

    # Q&A statistics (simulated for now)
    qa_stats = {
        'today_qa_count': 42,
        'avg_response_time': 1.5,  # seconds
        'success_rate': 0.95
    }

    return {
        'users': user_stats,
        'knowledge': knowledge_stats,
        'vectors': vector_stats,
        'storage': storage_stats,
        'qa': qa_stats,
        'generated_at': datetime.utcnow().isoformat()
    }


@router.get("/user-growth")
async def get_user_growth(days: int = 30):
    """Get user growth trend"""
    users = user_service.get_all_users()

    # Generate daily user count for the last N days
    growth_data = []
    for i in range(days):
        date = (datetime.utcnow() - timedelta(days=days - i - 1)).strftime('%Y-%m-%d')
        # Count users created before this date
        count = sum(1 for u in users if datetime.fromisoformat(u['created_at']).date() <= datetime.strptime(date, '%Y-%m-%d').date())
        growth_data.append({
            'date': date,
            'count': count
        })

    return growth_data


@router.get("/qa-stats")
async def get_qa_statistics(days: int = 7):
    """Get Q&A statistics"""
    # Simulated Q&A data
    qa_data = []
    for i in range(days):
        date = (datetime.utcnow() - timedelta(days=days - i - 1)).strftime('%Y-%m-%d')
        qa_data.append({
            'date': date,
            'count': 30 + (i % 5) * 10  # Simulated data
        })

    return qa_data


@router.get("/category-distribution")
async def get_category_distribution():
    """Get knowledge base category distribution"""
    knowledge_stats = knowledge_service.get_knowledge_stats()
    distribution = []

    for category, count in knowledge_stats.get('category_distribution', {}).items():
        distribution.append({
            'category': category,
            'count': count
        })

    return distribution
