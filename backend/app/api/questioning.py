from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.models.questioning import (
    DatabaseSource,
    DatabaseSourceCreate,
    GlossaryTerm,
    GlossaryTermCreate,
    QuestionHistory,
    QuestionHistoryCreate,
    QuestionRequest,
    QuestionResponse
)
from app.services.questioning_service import questioning_service

router = APIRouter()


# ==================== Database Source Management ====================
@router.get("/databases/", response_model=dict)
async def get_databases():
    """Get all database sources"""
    databases = questioning_service.get_all_databases()
    return {"databases": databases}


@router.post("/databases/", response_model=dict)
async def create_database(db_create: DatabaseSourceCreate):
    """Create new database source"""
    try:
        return questioning_service.create_database(db_create)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/databases/{db_id}", response_model=dict)
async def update_database(db_id: str, db_update: dict):
    """Update database source"""
    db = questioning_service.update_database(db_id, db_update)
    if not db:
        raise HTTPException(status_code=404, detail="Database not found")
    return db


@router.delete("/databases/{db_id}")
async def delete_database(db_id: str):
    """Delete database source"""
    success = questioning_service.delete_database(db_id)
    if not success:
        raise HTTPException(status_code=404, detail="Database not found")
    return {"message": "Database deleted successfully"}


@router.post("/databases/{db_id}/test", response_model=dict)
async def test_database_connection(db_id: str):
    """Test database connection"""
    return questioning_service.test_connection(db_id)


# ==================== Glossary Management ====================
@router.get("/glossaries/search/{keyword}", response_model=dict)
async def search_glossaries(keyword: str):
    """Search glossary terms by keyword"""
    glossaries = questioning_service.search_glossaries(keyword)
    return {"glossaries": glossaries}


@router.get("/glossaries/", response_model=dict)
async def get_glossaries():
    """Get all glossary terms"""
    glossaries = questioning_service.get_all_glossaries()
    return {"glossaries": glossaries}


@router.post("/glossaries/", response_model=dict)
async def create_glossary(glossary_create: GlossaryTermCreate):
    """Create new glossary term"""
    try:
        return questioning_service.create_glossary(glossary_create)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/glossaries/{term_id}", response_model=dict)
async def update_glossary(term_id: str, term_update: dict):
    """Update glossary term"""
    term = questioning_service.update_glossary(term_id, term_update)
    if not term:
        raise HTTPException(status_code=404, detail="Glossary term not found")
    return term


@router.delete("/glossaries/{term_id}")
async def delete_glossary(term_id: str):
    """Delete glossary term"""
    success = questioning_service.delete_glossary(term_id)
    if not success:
        raise HTTPException(status_code=404, detail="Glossary term not found")
    return {"message": "Glossary term deleted successfully"}


# ==================== Question History ====================
@router.get("/history/stats", response_model=dict)
async def get_question_stats():
    """Get question statistics"""
    return questioning_service.get_question_stats()


@router.get("/history/", response_model=dict)
async def get_question_histories(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
):
    """Get question histories with pagination"""
    return questioning_service.get_question_histories(skip, limit)


@router.post("/history/", response_model=dict)
async def create_question_history(history_create: QuestionHistoryCreate):
    """Create question history record"""
    try:
        return questioning_service.create_question_history(history_create)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== Question Processing ====================
@router.post("/ask", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    """Process natural language question and generate SQL"""
    try:
        # Verify database exists
        db = questioning_service.get_database_by_id(request.database_id)
        if not db:
            raise HTTPException(status_code=404, detail="Database not found")

        # Process question
        result = questioning_service.process_question(request)

        # Save to history
        questioning_service.create_question_history(QuestionHistoryCreate(
            question=request.question,
            sql=result.sql,
            result=None,
            duration=120,
            status='success',
            database_name=db['name'],
            confidence=result.confidence
        ))

        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== Statistics ====================
@router.get("/stats/dashboard", response_model=dict)
async def get_dashboard_stats():
    """Get questioning dashboard statistics"""
    db_stats = {
        'total_databases': len(questioning_service.get_all_databases()),
        'connected_databases': len([db for db in questioning_service.get_all_databases() if db.get('status') == 'connected']),
    }

    glossary_stats = {
        'total_glossaries': len(questioning_service.get_all_glossaries()),
    }

    question_stats = questioning_service.get_question_stats()

    return {
        'databases': db_stats,
        'glossaries': glossary_stats,
        'questions': question_stats
    }
