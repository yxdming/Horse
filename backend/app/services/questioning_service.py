from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from uuid import uuid4
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
from app.utils.file_handler import file_handler


class QuestioningService:
    """Questioning (BI Text-to-SQL) business logic service"""

    def __init__(self):
        self.file_handler = file_handler

    # ==================== Database Source Management ====================
    def get_all_databases(self) -> List[Dict[str, Any]]:
        """Get all database sources"""
        data = self.file_handler.read_json('databases.json', {'databases': []})
        return data.get('databases', [])

    def get_database_by_id(self, db_id: str) -> Optional[Dict[str, Any]]:
        """Get database by ID"""
        databases = self.get_all_databases()
        for db in databases:
            if db['id'] == db_id:
                return db
        return None

    def create_database(self, db_create: DatabaseSourceCreate) -> Dict[str, Any]:
        """Create new database source"""
        data = self.file_handler.read_json('databases.json', {'databases': []})
        databases = data.get('databases', [])

        db = DatabaseSource(
            id=str(uuid4()),
            **db_create.dict(),
            status='disconnected',
            table_count=0,
            created_at=datetime.now(timezone.utc)
        )

        databases.append(db.dict())
        self.file_handler.write_json('databases.json', {'databases': databases})

        return db.dict()

    def update_database(self, db_id: str, db_update: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update database source"""
        data = self.file_handler.read_json('databases.json', {'databases': []})
        databases = data.get('databases', [])

        for i, db in enumerate(databases):
            if db['id'] == db_id:
                db.update(db_update)
                db['updated_at'] = datetime.now(timezone.utc).isoformat()
                databases[i] = db
                self.file_handler.write_json('databases.json', {'databases': databases})
                return db
        return None

    def delete_database(self, db_id: str) -> bool:
        """Delete database source"""
        data = self.file_handler.read_json('databases.json', {'databases': []})
        databases = data.get('databases', [])
        original_length = len(databases)
        databases = [db for db in databases if db['id'] != db_id]

        if len(databases) < original_length:
            self.file_handler.write_json('databases.json', {'databases': databases})
            return True
        return False

    def test_connection(self, db_id: str) -> Dict[str, Any]:
        """Test database connection"""
        # Simulate connection test
        db = self.get_database_by_id(db_id)
        if not db:
            return {'success': False, 'message': '数据库不存在'}

        # Simulate test delay
        import time
        time.sleep(1)

        # Update status to connected
        self.update_database(db_id, {'status': 'connected', 'last_sync': datetime.now(timezone.utc).isoformat()})

        return {
            'success': True,
            'message': '连接成功',
            'status': 'connected',
            'last_sync': datetime.now(timezone.utc).isoformat()
        }

    # ==================== Glossary Management ====================
    def get_all_glossaries(self) -> List[Dict[str, Any]]:
        """Get all glossary terms"""
        data = self.file_handler.read_json('glossaries.json', {'glossaries': []})
        return data.get('glossaries', [])

    def create_glossary(self, glossary_create: GlossaryTermCreate) -> Dict[str, Any]:
        """Create new glossary term"""
        data = self.file_handler.read_json('glossaries.json', {'glossaries': []})
        glossaries = data.get('glossaries', [])

        glossary = GlossaryTerm(
            id=str(uuid4()),
            **glossary_create.dict(),
            created_at=datetime.now(timezone.utc)
        )

        glossaries.append(glossary.dict())
        self.file_handler.write_json('glossaries.json', {'glossaries': glossaries})

        return glossary.dict()

    def update_glossary(self, term_id: str, term_update: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update glossary term"""
        data = self.file_handler.read_json('glossaries.json', {'glossaries': []})
        glossaries = data.get('glossaries', [])

        for i, term in enumerate(glossaries):
            if term['id'] == term_id:
                term.update(term_update)
                term['updated_at'] = datetime.now(timezone.utc).isoformat()
                glossaries[i] = term
                self.file_handler.write_json('glossaries.json', {'glossaries': glossaries})
                return term
        return None

    def delete_glossary(self, term_id: str) -> bool:
        """Delete glossary term"""
        data = self.file_handler.read_json('glossaries.json', {'glossaries': []})
        glossaries = data.get('glossaries', [])
        original_length = len(glossaries)
        glossaries = [g for g in glossaries if g['id'] != term_id]

        if len(glossaries) < original_length:
            self.file_handler.write_json('glossaries.json', {'glossaries': glossaries})
            return True
        return False

    def search_glossaries(self, keyword: str) -> List[Dict[str, Any]]:
        """Search glossary terms by keyword"""
        glossaries = self.get_all_glossaries()
        keyword_lower = keyword.lower()
        return [
            g for g in glossaries
            if keyword_lower in g['term'].lower() or
               keyword_lower in g['definition'].lower() or
               keyword_lower in g.get('example', '').lower()
        ]

    # ==================== Question History ====================
    def get_question_histories(self, skip: int = 0, limit: int = 10) -> Dict[str, Any]:
        """Get question histories with pagination"""
        data = self.file_handler.read_json('question_history.json', {'histories': []})
        histories = data.get('histories', [])

        # Sort by created_at descending
        histories.sort(key=lambda x: x.get('created_at', ''), reverse=True)

        total = len(histories)
        start = skip
        end = start + limit
        paginated_histories = histories[start:end]

        return {
            'histories': paginated_histories,
            'total': total
        }

    def create_question_history(self, history_create: QuestionHistoryCreate) -> Dict[str, Any]:
        """Create question history record"""
        data = self.file_handler.read_json('question_history.json', {'histories': []})
        histories = data.get('histories', [])

        history = QuestionHistory(
            id=str(uuid4()),
            **history_create.dict(),
            created_at=datetime.now(timezone.utc)
        )

        histories.append(history.dict())
        self.file_handler.write_json('question_history.json', {'histories': histories})

        return history.dict()

    def get_question_stats(self) -> Dict[str, Any]:
        """Get question statistics"""
        data = self.file_handler.read_json('question_history.json', {'histories': []})
        histories = data.get('histories', [])

        total = len(histories)
        success_count = len([h for h in histories if h.get('status') == 'success'])
        error_count = len([h for h in histories if h.get('status') == 'error'])
        avg_duration = sum(h.get('duration', 0) for h in histories) / total if total > 0 else 0
        avg_confidence = sum(h.get('confidence', 0) for h in histories if h.get('confidence')) / total if total > 0 else 0

        return {
            'total_questions': total,
            'success_count': success_count,
            'error_count': error_count,
            'success_rate': success_count / total if total > 0 else 0,
            'avg_duration': round(avg_duration, 2),
            'avg_confidence': round(avg_confidence, 2)
        }

    # ==================== Question Processing ====================
    def process_question(self, request: QuestionRequest) -> QuestionResponse:
        """Process natural language question and generate SQL"""
        # Simulate NLP processing
        import time
        time.sleep(1)

        question_lower = request.question.lower()
        glossaries = self.get_all_glossaries()

        # Find matched glossaries
        matched_glossaries = []
        for g in glossaries:
            if g['term'].lower() in question_lower or g['definition'].lower() in question_lower:
                matched_glossaries.append(g['term'])

        # Generate mock SQL based on question
        sql = self._generate_sql(request.question)

        # Generate explanation
        explanation = self._generate_explanation(request.question, matched_glossaries)

        # Calculate confidence
        confidence = 0.85 + (len(matched_glossaries) * 0.03)
        confidence = min(confidence, 0.98)

        return QuestionResponse(
            sql=sql,
            explanation=explanation,
            confidence=confidence,
            glossaries=matched_glossaries,
            estimated_rows=100
        )

    def _generate_sql(self, question: str) -> str:
        """Generate SQL from question (simplified mock)"""
        # This is a simplified mock implementation
        # In production, this would use NLP models or LLMs

        question_lower = question.lower()

        if '销售' in question and ('本月' in question or '月' in question):
            return '''SELECT
  SUM(amount) as total_sales,
  COUNT(*) as order_count
FROM sales
WHERE MONTH(created_at) = MONTH(CURRENT_DATE)
  AND YEAR(created_at) = YEAR(CURRENT_DATE)'''

        elif 'top' in question_lower and '产品' in question:
            return '''SELECT
  product_name,
  SUM(amount) as total_sales,
  COUNT(*) as order_count
FROM sales
GROUP BY product_name
ORDER BY total_sales DESC
LIMIT 10'''

        elif '用户' in question and ('增长' in question or '趋势' in question):
            return '''SELECT
  DATE(created_at) as date,
  COUNT(*) as new_users
FROM users
WHERE DATE(created_at) >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC'''

        elif 'gmv' in question_lower or '成交额' in question:
            return '''SELECT
  SUM(amount) as gmv,
  COUNT(*) as order_count
FROM sales
WHERE DATE(created_at) >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)'''

        else:
            return '''SELECT
  *
FROM sales
LIMIT 100'''

    def _generate_explanation(self, question: str, glossaries: List[str]) -> str:
        """Generate explanation for the SQL"""
        explanation_parts = [
            f"理解意图：{question}",
            "识别关键词："
        ]

        # Extract key concepts
        if '销售' in question:
            explanation_parts.append("- 销售数据（sales表）")
        if '本月' in question or '月' in question:
            explanation_parts.append("- 时间范围：本月")
        if 'top' in question.lower():
            explanation_parts.append("- 排序和限制：Top N")

        if glossaries:
            explanation_parts.append(f"- 识别术语：{', '.join(glossaries)}")

        explanation_parts.append("生成SQL：基于语义理解自动生成")

        return '\n'.join(explanation_parts)


# Global questioning service instance
questioning_service = QuestioningService()
