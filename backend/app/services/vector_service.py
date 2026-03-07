import os
import json
import hashlib
from typing import List, Dict, Any, Optional
from pathlib import Path
from app.utils.file_handler import file_handler


class VectorService:
    """Vector storage and similarity search service (JSON file based)"""

    def __init__(self):
        self.vector_file = Path("data/vectors.json")
        self.vector_file.parent.mkdir(exist_ok=True)

        # Load or initialize vector data
        self.vectors = self._load_vectors()

    def _load_vectors(self) -> Dict[str, Any]:
        """Load vectors from JSON file"""
        if self.vector_file.exists():
            data = file_handler.read_json('vectors.json', {'vectors': {}, 'documents': {}})
            return data
        return {'vectors': {}, 'documents': {}}

    def _save_vectors(self) -> bool:
        """Save vectors to JSON file"""
        return file_handler.write_json('vectors.json', self.vectors)

    def _generate_vector_id(self, text: str) -> str:
        """Generate a simple hash-based vector ID (mock embedding)"""
        # Use hash to generate a consistent pseudo-random vector
        hash_obj = hashlib.md5(text.encode())
        hash_hex = hash_obj.hexdigest()

        # Convert hash to a simple mock vector (10 dimensions)
        vector = []
        for i in range(0, len(hash_hex), 2):
            # Convert hex pair to float between -1 and 1
            val = int(hash_hex[i:i+2], 16) / 255.0 * 2 - 1
            vector.append(val)

        return vector[:10]  # Return 10-dimensional vector

    def add_document(self, doc_id: str, title: str, content: str, metadata: Dict[str, Any] = None) -> bool:
        """Add document to vector store"""
        try:
            # Combine title and content for better semantic representation
            text = f"{title}. {content}"

            # Generate mock vector
            vector = self._generate_vector_id(text)

            # Prepare metadata
            doc_metadata = {
                'doc_id': doc_id,
                'title': title,
                'content': content,
                **(metadata or {})
            }

            # Store in JSON
            self.vectors['vectors'][doc_id] = vector
            self.vectors['documents'][doc_id] = doc_metadata
            self._save_vectors()

            return True
        except Exception as e:
            print(f"Error adding document to vector store: {e}")
            return False

    def search_similar(
        self,
        query: str,
        n_results: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar documents (mock implementation)"""
        try:
            # Generate mock query vector
            query_vector = self._generate_vector_id(query)

            # Calculate similarity with all documents
            results = []
            for doc_id, doc_vector in self.vectors['vectors'].items():
                # Apply filters if provided
                if filters:
                    doc_metadata = self.vectors['documents'].get(doc_id, {})
                    match = True
                    for key, value in filters.items():
                        if doc_metadata.get(key) != value:
                            match = False
                            break
                    if not match:
                        continue

                # Calculate simple cosine similarity
                similarity = self._cosine_similarity(query_vector, doc_vector)

                results.append({
                    'id': doc_id,
                    'title': self.vectors['documents'][doc_id].get('title', ''),
                    'content': self.vectors['documents'][doc_id].get('content', ''),
                    'similarity_score': similarity,
                    'metadata': self.vectors['documents'].get(doc_id, {})
                })

            # Sort by similarity and return top results
            results.sort(key=lambda x: x['similarity_score'], reverse=True)
            return results[:n_results]
        except Exception as e:
            print(f"Error searching vector store: {e}")
            return []

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        try:
            import math
            dot_product = sum(a * b for a, b in zip(vec1, vec2))
            magnitude1 = math.sqrt(sum(a * a for a in vec1))
            magnitude2 = math.sqrt(sum(b * b for b in vec2))

            if magnitude1 == 0 or magnitude2 == 0:
                return 0.0

            return dot_product / (magnitude1 * magnitude2)
        except:
            return 0.5  # Return default similarity on error

    def delete_document(self, doc_id: str) -> bool:
        """Delete document from vector store"""
        try:
            if doc_id in self.vectors['vectors']:
                del self.vectors['vectors'][doc_id]
            if doc_id in self.vectors['documents']:
                del self.vectors['documents'][doc_id]
            self._save_vectors()
            return True
        except Exception as e:
            print(f"Error deleting document from vector store: {e}")
            return False

    def update_document(self, doc_id: str, title: str, content: str, metadata: Dict[str, Any] = None) -> bool:
        """Update document in vector store"""
        try:
            # Delete old version
            self.delete_document(doc_id)

            # Add new version
            return self.add_document(doc_id, title, content, metadata)
        except Exception as e:
            print(f"Error updating document in vector store: {e}")
            return False

    def rebuild_index(self) -> Dict[str, Any]:
        """Rebuild entire vector index from knowledge base"""
        try:
            # Clear existing data
            self.vectors = {'vectors': {}, 'documents': {}}

            # Load all documents
            documents = knowledge_service.get_all_documents()

            vectorized = 0
            failed = 0

            for doc in documents:
                if self.add_document(
                    doc['id'],
                    doc['title'],
                    doc['content'],
                    {'category': doc.get('category', ''), 'tags': ','.join(doc.get('tags', []))}
                ):
                    vectorized += 1
                else:
                    failed += 1

            return {
                'total': len(documents),
                'vectorized': vectorized,
                'failed': failed
            }
        except Exception as e:
            print(f"Error rebuilding index: {e}")
            return {'total': 0, 'vectorized': 0, 'failed': 0, 'error': str(e)}

    def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics"""
        try:
            count = len(self.vectors['vectors'])
            return {
                'total_vectors': count,
                'collection_name': 'knowledge_base_json'
            }
        except Exception as e:
            print(f"Error getting vector stats: {e}")
            return {'total_vectors': 0, 'error': str(e)}


# Import here to avoid circular dependency
from app.services.knowledge_service import knowledge_service

# Global vector service instance
vector_service = VectorService()
