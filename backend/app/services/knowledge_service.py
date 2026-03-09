from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from uuid import uuid4
from app.models.knowledge import DocumentCreate, DocumentUpdate, SearchResult, DirectoryMapping, DirectoryMappingCreate, DirectoryMappingUpdate
from app.utils.file_handler import file_handler


class KnowledgeService:
    """Knowledge base business logic service"""

    def __init__(self):
        self.file_handler = file_handler

    def get_all_documents(self) -> List[Dict[str, Any]]:
        """Get all documents"""
        data = self.file_handler.read_json('knowledge.json', {'documents': []})
        return data.get('documents', [])

    def get_document_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get document by ID"""
        documents = self.get_all_documents()
        for doc in documents:
            if doc['id'] == doc_id:
                return doc
        return None

    def search_documents(self, query: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search documents by title, content, or tags"""
        documents = self.get_all_documents()
        results = []

        query_lower = query.lower()

        for doc in documents:
            # Filter by category if specified
            if category and doc.get('category') != category:
                continue

            # Search in title and content
            if (query_lower in doc.get('title', '').lower() or
                query_lower in doc.get('content', '').lower() or
                any(query_lower in tag.lower() for tag in doc.get('tags', []))):
                results.append(doc)

        return results

    def create_document(self, doc_create: DocumentCreate) -> Dict[str, Any]:
        """Create new document"""
        documents = self.get_all_documents()

        # Create new document
        from app.models.knowledge import KnowledgeDocument
        document = KnowledgeDocument(
            title=doc_create.title,
            content=doc_create.content,
            category=doc_create.category,
            tags=doc_create.tags
        )

        documents.append(document.dict())
        self.file_handler.write_json('knowledge.json', {'documents': documents})

        return document.dict()

    def update_document(self, doc_id: str, doc_update: DocumentUpdate) -> Optional[Dict[str, Any]]:
        """Update document"""
        documents = self.get_all_documents()
        for i, doc in enumerate(documents):
            if doc['id'] == doc_id:
                # Update fields
                update_data = doc_update.dict(exclude_unset=True)
                doc.update(update_data)
                doc['updated_at'] = datetime.utcnow().isoformat()
                doc['vectorized'] = False  # Mark for re-vectorization

                documents[i] = doc
                self.file_handler.write_json('knowledge.json', {'documents': documents})
                return doc
        return None

    def delete_document(self, doc_id: str) -> bool:
        """Delete document"""
        documents = self.get_all_documents()
        original_length = len(documents)
        documents = [doc for doc in documents if doc['id'] != doc_id]

        if len(documents) < original_length:
            self.file_handler.write_json('knowledge.json', {'documents': documents})
            return True
        return False

    def get_categories(self) -> List[str]:
        """Get all unique categories"""
        documents = self.get_all_documents()
        categories = set(doc.get('category', '未分类') for doc in documents)
        return sorted(list(categories))

    def get_all_tags(self) -> List[str]:
        """Get all unique tags"""
        documents = self.get_all_documents()
        tags = set()
        for doc in documents:
            tags.update(doc.get('tags', []))
        return sorted(list(tags))

    def get_knowledge_stats(self) -> Dict[str, Any]:
        """Get knowledge base statistics"""
        documents = self.get_all_documents()
        vectorized_count = len([d for d in documents if d.get('vectorized', False)])

        # Calculate document count by category
        category_counts = {}
        for doc in documents:
            category = doc.get('category', '未分类')
            category_counts[category] = category_counts.get(category, 0) + 1

        return {
            'total_documents': len(documents),
            'vectorized_documents': vectorized_count,
            'categories': len(self.get_categories()),
            'total_tags': len(self.get_all_tags()),
            'category_distribution': category_counts
        }

    def batch_import(self, documents_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Batch import documents"""
        imported = 0
        failed = 0
        errors = []

        for doc_data in documents_data:
            try:
                doc_create = DocumentCreate(**doc_data)
                self.create_document(doc_create)
                imported += 1
            except Exception as e:
                failed += 1
                errors.append(f"Document '{doc_data.get('title', 'Unknown')}: {str(e)}")

        return {
            'imported': imported,
            'failed': failed,
            'errors': errors
        }

    # ==================== Directory Mapping Management ====================

    def get_all_mappings(self) -> Dict[str, Any]:
        """Get all directory mappings"""
        data = self.file_handler.read_json('directory_mappings.json', {'mappings': []})
        mappings = data.get('mappings', [])

        return {
            'mappings': mappings,
            'total': len(mappings)
        }

    def get_mapping_by_id(self, mapping_id: str) -> Optional[Dict[str, Any]]:
        """Get mapping by ID"""
        data = self.file_handler.read_json('directory_mappings.json', {'mappings': []})
        mappings = data.get('mappings', [])

        for mapping in mappings:
            if mapping['id'] == mapping_id:
                return mapping

        return None

    def create_mapping(self, mapping_create: DirectoryMappingCreate) -> Dict[str, Any]:
        """Create new directory mapping"""
        data = self.file_handler.read_json('directory_mappings.json', {'mappings': []})
        mappings = data.get('mappings', [])

        # Create new mapping
        mapping = DirectoryMapping(
            id=str(uuid4()),
            directory_name=mapping_create.directory_name,
            directory_path=mapping_create.directory_path,
            file_system=mapping_create.file_system,
            operator=mapping_create.operator,
            last_import_time=datetime.now(timezone.utc)
        )

        mappings.append(mapping.dict())
        self.file_handler.write_json('directory_mappings.json', {'mappings': mappings})

        return mapping.dict()

    def update_mapping(self, mapping_id: str, mapping_update: DirectoryMappingUpdate) -> Optional[Dict[str, Any]]:
        """Update directory mapping"""
        data = self.file_handler.read_json('directory_mappings.json', {'mappings': []})
        mappings = data.get('mappings', [])

        for i, mapping in enumerate(mappings):
            if mapping['id'] == mapping_id:
                # Update fields
                update_data = mapping_update.dict(exclude_unset=True)
                mapping.update(update_data)
                mappings[i] = mapping
                self.file_handler.write_json('directory_mappings.json', {'mappings': mappings})
                return mapping

        return None

    def delete_mapping(self, mapping_id: str) -> bool:
        """Delete directory mapping"""
        data = self.file_handler.read_json('directory_mappings.json', {'mappings': []})
        mappings = data.get('mappings', [])
        original_length = len(mappings)
        mappings = [m for m in mappings if m['id'] != mapping_id]

        if len(mappings) < original_length:
            self.file_handler.write_json('directory_mappings.json', {'mappings': mappings})
            return True
        return False


# Global knowledge service instance
knowledge_service = KnowledgeService()
