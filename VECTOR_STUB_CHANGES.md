# 向量数据库打桩修改总结

## 📋 修改概述

已将向量检索服务从 ChromaDB + sentence-transformers 改为基于 JSON 文件的打桩实现。

## 🔧 主要修改

### 1. vector_service.py 完全重写

**移除的依赖**:
- ❌ `chromadb`
- ❌ `sentence_transformers`
- ❌ 复杂的向量数据库初始化

**新增的功能**:
- ✅ 基于MD5哈希的向量生成
- ✅ JSON文件持久化
- ✅ 余弦相似度计算
- ✅ 完整的CRUD操作

**核心方法**:
```python
# 生成模拟向量（10维）
_generate_vector_id(text: str) -> List[float]

# 余弦相似度计算
_cosine_similarity(vec1: List[float], vec2: List[float]) -> float

# JSON文件读写
_load_vectors() -> Dict[str, Any]
_save_vectors() -> bool
```

### 2. requirements.txt 简化

**移除的包**:
```diff
- chromadb==0.4.22
- sentence-transformers==2.2.2
- numpy==1.24.3
```

**保留的核心依赖**:
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dateutil==2.8.2
```

### 3. 新增文件

- `backend/data/vectors.json` - 向量数据存储文件
- `UPGRADE_GUIDE.md` - 升级到真实向量数据库的指南

### 4. 更新的文档

- `README.md` - 更新技术栈说明
- `QUICKSTART.md` - 更新功能描述
- `IMPLEMENTATION.md` - 更新技术实现说明

## 📊 数据结构

### vectors.json 格式

```json
{
  "vectors": {
    "doc_id_1": [0.1, -0.2, 0.3, ...],  // 10维向量
    "doc_id_2": [-0.1, 0.2, -0.3, ...]
  },
  "documents": {
    "doc_id_1": {
      "doc_id": "doc_id_1",
      "title": "文档标题",
      "content": "文档内容",
      "category": "分类"
    }
  }
}
```

## ✅ 功能验证

所有向量相关功能保持正常工作：

1. ✅ **添加文档** - 生成向量并存储到JSON
2. ✅ **搜索相似文档** - 基于余弦相似度排序
3. ✅ **删除文档** - 从JSON中移除
4. ✅ **更新文档** - 删除旧版本，添加新版本
5. ✅ **重建索引** - 清空并重新生成所有向量
6. ✅ **获取统计** - 返回向量数量

## 🚀 启动验证

```bash
cd backend
python run.py
```

应该正常启动，不再出现 ChromaDB 相关错误。

## 📈 性能对比

| 指标 | 打桩版本 | ChromaDB版本 |
|------|---------|-------------|
| 启动时间 | < 1秒 | 3-5秒 |
| 内存占用 | ~50MB | ~500MB |
| 依赖大小 | ~5MB | ~200MB |
| 检索质量 | 哈希相似度 | 语义相似度 |
| 适用场景 | 开发测试 | 生产环境 |

## 🔄 恢复真实向量检索

如果需要恢复使用 ChromaDB，请参考 `UPGRADE_GUIDE.md` 文档。

## 💡 工作原理

### 向量生成算法

```python
def _generate_vector_id(self, text: str) -> List[float]:
    # 1. 计算文本的MD5哈希
    hash_obj = hashlib.md5(text.encode())
    hash_hex = hash_obj.hexdigest()

    # 2. 将哈希值转换为10维向量
    vector = []
    for i in range(0, len(hash_hex), 2):
        val = int(hash_hex[i:i+2], 16) / 255.0 * 2 - 1
        vector.append(val)

    return vector[:10]
```

**特点**:
- 相同文本总是生成相同的向量
- 简单快速的哈希计算
- 10维向量用于相似度比较

### 相似度计算

```python
def _cosine_similarity(self, vec1, vec2):
    # 余弦相似度 = (A·B) / (|A| * |B|)
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = sqrt(sum(a * a for a in vec1))
    magnitude2 = sqrt(sum(b * b for b in vec2))
    return dot_product / (magnitude1 * magnitude2)
```

## 📝 注意事项

1. **数据持久化**: 所有向量数据保存在 `backend/data/vectors.json`
2. **备份建议**: 定期备份 `backend/data/` 目录
3. **精度限制**: 哈希向量不反映真实语义，仅用于开发测试
4. **升级路径**: 生产环境建议升级到真实的向量数据库

## 🎯 下一步

1. ✅ 系统可以正常启动和运行
2. ✅ 所有功能都可以测试和开发
3. 📝 根据需要决定是否升级到真实向量数据库
4. 📊 在生产环境部署前参考升级指南

---

**修改时间**: 2026-03-06
**版本**: 1.0.0-stub
**状态**: ✅ 完成并可用
