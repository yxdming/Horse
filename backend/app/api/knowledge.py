from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.knowledge import DocumentCreate, DocumentUpdate
from app.services.knowledge_service import knowledge_service
from app.services.vector_service import vector_service


router = APIRouter()


@router.get("/")
async def get_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    category: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all documents with optional filtering"""
    if search:
        documents = knowledge_service.search_documents(search, category)
    else:
        documents = knowledge_service.get_all_documents()

        if category:
            documents = [d for d in documents if d.get('category') == category]

    total = len(documents)
    documents = documents[skip:skip + limit]

    return {
        'documents': documents,
        'total': total,
        'skip': skip,
        'limit': limit
    }


@router.get("/categories")
async def get_categories():
    """Get all document categories"""
    categories = knowledge_service.get_categories()
    return {'categories': categories}


@router.get("/tags")
async def get_tags():
    """Get all document tags"""
    tags = knowledge_service.get_all_tags()
    return {'tags': tags}


@router.get("/{doc_id}")
async def get_document(doc_id: str):
    """Get document by ID"""
    document = knowledge_service.get_document_by_id(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.post("/", status_code=201)
async def create_document(doc_create: DocumentCreate):
    """Create new document"""
    document = knowledge_service.create_document(doc_create)

    # Automatically vectorize the document
    vector_service.add_document(
        document['id'],
        document['title'],
        document['content'],
        {'category': document['category']}
    )

    # Update vectorized flag
    documents = knowledge_service.get_all_documents()
    for i, doc in enumerate(documents):
        if doc['id'] == document['id']:
            documents[i]['vectorized'] = True
            break

    return document


@router.put("/{doc_id}")
async def update_document(doc_id: str, doc_update: DocumentUpdate):
    """Update document"""
    document = knowledge_service.update_document(doc_id, doc_update)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Update vector index
    vector_service.update_document(
        doc_id,
        document['title'],
        document['content'],
        {'category': document['category']}
    )

    # Update vectorized flag
    documents = knowledge_service.get_all_documents()
    for i, doc in enumerate(documents):
        if doc['id'] == doc_id:
            documents[i]['vectorized'] = True
            break

    return document


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    """Delete document"""
    success = knowledge_service.delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove from vector store
    vector_service.delete_document(doc_id)

    return {"message": "Document deleted successfully"}


@router.post("/search/semantic")
async def semantic_search(
    query: str = Query(..., min_length=1),
    top_k: int = Query(5, ge=1, le=20),
    category: Optional[str] = None
):
    """Semantic search using vector embeddings"""
    filters = {'category': category} if category else None
    results = vector_service.search_similar(query, top_k, filters)

    return {
        'query': query,
        'results': results,
        'count': len(results)
    }


@router.post("/batch/import")
async def batch_import(documents: List[dict]):
    """Batch import documents"""
    result = knowledge_service.batch_import(documents)

    # Vectorize all imported documents
    for doc_data in documents:
        doc = knowledge_service.get_document_by_id(doc_data.get('title', ''))
        if doc:
            vector_service.add_document(
                doc['id'],
                doc['title'],
                doc['content'],
                {'category': doc.get('category', '')}
            )

    return result


@router.post("/vectors/rebuild")
async def rebuild_vector_index():
    """Rebuild entire vector index"""
    result = vector_service.rebuild_index()
    return result
