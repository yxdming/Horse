from fastapi import APIRouter, HTTPException
from app.models.config import SystemConfig, ConfigUpdate
from app.utils.file_handler import file_handler


router = APIRouter()


@router.get("/")
async def get_config():
    """Get current system configuration"""
    data = file_handler.read_json('config.json', {})
    return data


@router.get("/qa-strategy")
async def get_qa_strategy():
    """Get Q&A strategy configuration"""
    data = file_handler.read_json('config.json', {})
    return data.get('qa_strategy', {})


@router.put("/qa-strategy")
async def update_qa_strategy(config_update: ConfigUpdate):
    """Update Q&A strategy configuration"""
    # Read current config
    data = file_handler.read_json('config.json', {})
    qa_strategy = data.get('qa_strategy', {})

    # Update with new values
    update_data = config_update.dict(exclude_unset=True)
    qa_strategy.update(update_data)

    # Validate ranges
    if qa_strategy.get('temperature', 0) < 0 or qa_strategy.get('temperature', 0) > 2:
        raise HTTPException(status_code=400, detail="Temperature must be between 0 and 2")

    if qa_strategy.get('max_tokens', 0) < 100 or qa_strategy.get('max_tokens', 0) > 8000:
        raise HTTPException(status_code=400, detail="Max tokens must be between 100 and 8000")

    if qa_strategy.get('top_k', 0) < 1 or qa_strategy.get('top_k', 0) > 20:
        raise HTTPException(status_code=400, detail="Top K must be between 1 and 20")

    if qa_strategy.get('similarity_threshold', 0) < 0 or qa_strategy.get('similarity_threshold', 0) > 1:
        raise HTTPException(status_code=400, detail="Similarity threshold must be between 0 and 1")

    # Save updated config
    data['qa_strategy'] = qa_strategy
    success = file_handler.write_json('config.json', data)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to save configuration")

    return qa_strategy


@router.post("/qa-strategy/reset")
async def reset_qa_strategy():
    """Reset Q&A strategy to default values"""
    default_strategy = {
        'temperature': 0.7,
        'max_tokens': 2000,
        'top_k': 5,
        'similarity_threshold': 0.75,
        'system_prompt': '你是一个专业的AI助手，基于知识库内容回答用户问题。'
    }

    data = file_handler.read_json('config.json', {})
    data['qa_strategy'] = default_strategy
    success = file_handler.write_json('config.json', data)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to reset configuration")

    return default_strategy
