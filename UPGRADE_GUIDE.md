# 向量检索升级指南

本文档说明如何从JSON文件打桩版本升级到真实的向量数据库（ChromaDB）。

## 当前状态

✅ **当前实现**: 使用JSON文件存储向量数据，基于哈希算法生成模拟向量
- ✅ 优点：无需额外依赖，启动快速，适合开发测试
- ❌ 缺点：检索精度有限，不支持真实的语义理解

## 升级步骤

### 1. 安装依赖

在 `backend/requirements.txt` 中添加：

```txt
chromadb==0.4.22
sentence-transformers==2.2.2
numpy==1.24.3
```

然后安装依赖：

```bash
cd backend
pip install -r requirements.txt
```

### 2. 修改向量服务

编辑 `backend/app/services/vector_service.py`，替换 `VectorService` 类实现：

#### 替换初始化方法

```python
def __init__(self):
    import chromadb
    from sentence_transformers import SentenceTransformer

    self.vector_db_path = Path("vectors")
    self.vector_db_path.mkdir(exist_ok=True)

    # Initialize ChromaDB
    self.client = chromadb.PersistentClient(
        path=str(self.vector_db_path)
    )

    # Initialize sentence transformer model
    self.model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

    # Get or create collection
    self.collection = self.client.get_or_create_collection(
        name="knowledge_base",
        metadata={"hnsw:space": "cosine"}
    )
```

#### 替换向量化方法

```python
def _vectorize_text(self, text: str) -> List[float]:
    """Convert text to vector embedding"""
    return self.model.encode(text).tolist()
```

#### 替换添加文档方法

```python
def add_document(self, doc_id: str, title: str, content: str, metadata: Dict[str, Any] = None) -> bool:
    """Add document to vector store"""
    try:
        # Combine title and content for better semantic representation
        text = f"{title}. {content}"

        # Generate embedding
        embedding = self._vectorize_text(text)

        # Prepare metadata
        doc_metadata = {
            'doc_id': doc_id,
            'title': title,
            **(metadata or {})
        }

        # Add to collection
        self.collection.add(
            embeddings=[embedding],
            documents=[text],
            ids=[doc_id],
            metadatas=[doc_metadata]
        )

        return True
    except Exception as e:
        print(f"Error adding document to vector store: {e}")
        return False
```

#### 替换搜索方法

```python
def search_similar(
    self,
    query: str,
    n_results: int = 5,
    filters: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """Search for similar documents"""
    try:
        # Generate query embedding
        query_embedding = self._vectorize_text(query)

        # Prepare where clause for filtering
        where_clause = filters if filters else None

        # Search in collection
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_clause
        )

        # Format results
        formatted_results = []
        if results['ids'] and results['ids'][0]:
            for i, doc_id in enumerate(results['ids'][0]):
                formatted_results.append({
                    'id': doc_id,
                    'title': results['metadatas'][0][i].get('title', ''),
                    'content': results['documents'][0][i] if results['documents'] else '',
                    'similarity_score': 1 - results['distances'][0][i] if results['distances'] else 0.0,
                    'metadata': results['metadatas'][0][i] if results['metadatas'] else {}
                })

        return formatted_results
    except Exception as e:
        print(f"Error searching vector store: {e}")
        return []
```

### 3. 重建向量索引

升级后需要重建向量索引：

```bash
# 启动后端
cd backend
python run.py
```

然后通过API或前端界面执行"重建索引"操作，或者使用API：

```bash
curl -X POST http://localhost:8000/api/knowledge/vectors/rebuild
```

## 性能对比

| 特性 | JSON打桩版本 | ChromaDB版本 |
|------|-------------|-------------|
| 启动时间 | <1秒 | 3-5秒（首次加载模型） |
| 内存占用 | ~50MB | ~500MB |
| 检索精度 | 哈希相似（低） | 语义相似（高） |
| 并发支持 | 受限于文件IO | 高性能并发 |
| 数据持久化 | JSON文件 | ChromaDB本地存储 |
| 适用场景 | 开发测试 | 生产环境 |

## 模型选择

`sentence-transformers` 支持多种模型，可以根据需求选择：

### 中文优化模型
```python
# 更好的中文支持
model = SentenceTransformer('shibing624/text2vec-base-chinese')
```

### 多语言模型
```python
# 多语言支持
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
```

### 英文模型
```python
# 仅英文
model = SentenceTransformer('all-MiniLM-L6-v2')
```

## 注意事项

1. **首次运行**: sentence-transformers 会自动下载模型文件（~100MB），需要网络连接
2. **内存要求**: ChromaDB + sentence-transformers 需要至少1GB可用内存
3. **存储空间**: 向量数据库会随着文档数量增长，预留足够空间
4. **备份数据**: 升级前请备份 `backend/data/` 目录

## 回滚方案

如果需要回滚到JSON版本：

1. 恢复 `requirements.txt`（移除chromadb等依赖）
2. 恢复 `vector_service.py` 的JSON实现
3. 重新安装依赖：`pip install -r requirements.txt`
4. 重启服务

## 技术支持

如有问题，请参考：
- ChromaDB文档: https://docs.trychroma.com/
- sentence-transformers文档: https://www.sbert.net/
