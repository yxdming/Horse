# 多语言国际化（i18n）指南

## 概述

AIDP Manager 前端项目已实现完整的多语言支持，采用基于 React Context 的国际化解决方案。

## 技术架构

```
frontend/src/
├── locales/              # 语言包目录
│   ├── zh-CN.ts         # 简体中文语言包
│   ├── en-US.ts         # 英文语言包
│   └── index.ts         # 导出语言包
├── contexts/            # React Context
│   └── LanguageContext.tsx  # 语言上下文和Hook
├── utils/               # 工具函数
│   └── i18n.ts          # 国际化辅助函数
└── pages/               # 页面组件（使用翻译）
```

## 快速开始

### 1. 使用翻译Hook

在任何组件中使用 `useTranslation` Hook：

```tsx
import { useTranslation } from '../contexts/LanguageContext';
import { createTranslateProxy } from '../utils/i18n';

const MyComponent: React.FC = () => {
  const { t, language, setLanguage, languages } = useTranslation();
  const tp = createTranslateProxy(t);

  return (
    <div>
      <h1>{tp('common.add')}</h1>  {/* 输出: 新增 */}
      <button onClick={() => setLanguage('en-US')}>
        Switch to English
      </button>
    </div>
  );
};
```

### 2. 带参数的翻译

使用 `tp` 函数处理带占位符的翻译：

```tsx
// 语言包中定义
// common.pagination.total: '共 {total} 条'

// 组件中使用
<Table
  pagination={{
    showTotal: (total) => tp('common.pagination.total', { total: 100 })
    // 输出: 共 100 条
  }}
/>
```

### 3. 访问当前语言信息

```tsx
const { language, setLanguage, languages } = useTranslation();

// language: 'zh-CN' | 'en-US'
// languages: [{ label: '简体中文', value: 'zh-CN' }, { label: 'English', value: 'en-US' }]

// 语言切换器示例
<Select
  value={language}
  onChange={setLanguage}
  style={{ width: 120 }}
>
  {languages.map(lang => (
    <Select.Option key={lang.value} value={lang.value}>
      {lang.label}
    </Select.Option>
  ))}
</Select>
```

## 语言包结构

语言包采用嵌套对象结构，按功能模块组织：

```typescript
{
  common: {
    // 通用文本（按钮、状态等）
    add: '新增',
    edit: '编辑',
    // ...
  },

  sidebar: {
    // 侧边栏导航
    dashboard: '数据总览',
    // ...
  },

  knowledge: {
    // 知识库模块
    tabs: { /* ... */ },
    files: { /* ... */ },
    // ...
  },

  // ...其他模块
}
```

## 添加新的翻译文本

### 步骤1：在语言包中添加键值对

**frontend/src/locales/zh-CN.ts**
```typescript
export default {
  myModule: {
    myMessage: '我的消息',
    myMessageWithParams: '你好，{name}！',
  }
};
```

**frontend/src/locales/en-US.ts**
```typescript
export default {
  myModule: {
    myMessage: 'My Message',
    myMessageWithParams: 'Hello, {name}!',
  }
};
```

### 步骤2：在组件中使用

```tsx
const { t } = useTranslation();
const tp = createTranslateProxy(t);

// 简单文本
<Div>{tp('myModule.myMessage')}</Div>

// 带参数文本
<Div>{tp('myModule.myMessageWithParams', { name: 'John' })}</Div>
```

## 页面重构示例

### 重构前（硬编码）

```tsx
<Button onClick={handleClick}>
  新增用户
</Button>
```

### 重构后（国际化）

```tsx
import { useTranslation } from '../contexts/LanguageContext';
import { createTranslateProxy } from '../utils/i18n';

const MyPage: React.FC = () => {
  const { t } = useTranslation();
  const tp = createTranslateProxy(t);

  return (
    <Button onClick={handleClick}>
      {tp('users.addButton')}
    </Button>
  );
};
```

## 表单验证国际化

```tsx
<Form.Item
  label={tp('users.usernameLabel')}
  name="username"
  rules={[
    {
      required: true,
      message: tp('common.validation.required', {
        field: tp('users.usernameLabel')
      })
    }
  ]}
>
  <Input placeholder={tp('users.usernamePlaceholder')} />
</Form.Item>
```

## 消息提示国际化

```tsx
import { message } from 'antd';

// 成功消息
message.success(tp('users.createSuccess'));

// 错误消息
message.error(tp('users.deleteFailed'));

// 警告消息
message.warning(tp('knowledge.files.searchWarning'));
```

## 表格列配置国际化

```tsx
const columns = [
  {
    title: tp('users.username'),
    dataIndex: 'username',
    key: 'username',
  },
  {
    title: tp('common.actions'),
    key: 'action',
    render: (_, record) => (
      <Space>
        <Button>{tp('common.edit')}</Button>
        <Button>{tp('common.delete')}</Button>
      </Space>
    ),
  },
];
```

## 模态框国际化

```tsx
<Modal
  title={tp('users.addModalTitle')}
  open={visible}
  onOk={handleSubmit}
  onCancel={handleCancel}
  okText={tp('common.confirm')}
  cancelText={tp('common.cancel')}
>
  {/* ... */}
</Modal>
```

## 确认对话框国际化

```tsx
<Popconfirm
  title={tp('knowledge.files.deleteConfirm')}
  onConfirm={handleDelete}
  okText={tp('common.confirm')}
  cancelText={tp('common.cancel')}
>
  <Button danger>{tp('common.delete')}</Button>
</Popconfirm>
```

## API工具函数

### `formatMessage(template, params)`

格式化带占位符的字符串：

```typescript
import { formatMessage } from '../utils/i18n';

const template = '共 {total} 条';
const result = formatMessage(template, { total: 100 });
// result: '共 100 条'
```

### `createTranslateProxy(t)`

创建带参数处理的翻译函数：

```typescript
import { useTranslation } from '../contexts/LanguageContext';
import { createTranslateProxy } from '../utils/i18n';

const { t } = useTranslation();
const tp = createTranslateProxy(t);

// 简单使用
tp('common.add')  // '新增'

// 带参数
tp('common.pagination.total', { total: 100 })  // '共 100 条'
```

## 添加新语言支持

### 1. 创建新语言文件

**frontend/src/locales/ja-JP.ts**
```typescript
export default {
  common: {
    add: '追加',
    edit: '編集',
    // ... 其他翻译
  },
  // ... 其他模块
};
```

### 2. 更新索引文件

**frontend/src/locales/index.ts**
```typescript
import jaJP from './ja-JP';

export type Language = 'zh-CN' | 'en-US' | 'ja-JP';

export const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP,
};
```

### 3. 更新语言列表

**frontend/src/contexts/LanguageContext.tsx**
```typescript
const languages = [
  { label: '简体中文', value: 'zh-CN' as Language },
  { label: 'English', value: 'en-US' as Language },
  { label: '日本語', value: 'ja-JP' as Language },
];
```

## Ant Design 组件国际化

Ant Design 组件会根据当前语言自动切换：

```tsx
// App.tsx
import { LanguageProvider, useTranslation } from './contexts/LanguageContext';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';

const antdLocales: Record<string, any> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

const AppContent: React.FC = () => {
  const { language } = useTranslation();
  const antdLocale = antdLocales[language];

  return (
    <ConfigProvider locale={antdLocale}>
      {/* ... */}
    </ConfigProvider>
  );
};
```

## 最佳实践

### 1. 键命名规范

- 使用点分隔的命名空间：`module.section.key`
- 使用有意义的键名：`user.email` 而不是 `user.field2`
- 保持一致性：所有按钮使用 `common.add`、`common.edit` 等

### 2. 参数占位符

- 使用花括号：`{parameterName}`
- 使用驼峰命名：`{userName}` 而不是 `{user_name}`
- 在所有语言的翻译中保持相同的占位符名称

### 3. 组织结构

- 按功能模块分组：`users`、`knowledge`、`questioning` 等
- 通用文本放在 `common` 下
- 避免深层嵌套（最多3-4层）

### 4. 类型安全

TypeScript 会自动检查翻译键是否正确：

```typescript
const tp = createTranslateProxy(t);

// ✅ 类型安全
tp('common.add')

// ❌ 编译时错误（如果键不存在）
tp('common.nonExistentKey')
```

### 5. 性能优化

- 在组件顶层创建 `tp` 函数，避免在渲染循环中重复创建
- 使用 `useMemo` 缓存复杂的翻译计算

```tsx
const { t } = useTranslation();
const tp = useMemo(() => createTranslateProxy(t), [t]);
```

## 故障排除

### 问题：翻译键显示为原始字符串

**原因**：键在语言包中不存在

**解决方案**：检查语言包中是否定义了该键

### 问题：参数替换不生效

**原因**：占位符名称不匹配

**解决方案**：确保语言包中的占位符名称与传递的参数名称一致

### 问题：切换语言后某些文本未更新

**原因**：缓存了翻译结果

**解决方案**：确保使用 `tp` 函数而不是缓存翻译字符串

## 迁移检查清单

将现有页面迁移到国际化时，确保完成以下步骤：

- [ ] 导入 `useTranslation` 和 `createTranslateProxy`
- [ ] 在组件中初始化 `const { t } = useTranslation()`
- [ ] 创建 `const tp = createTranslateProxy(t)`
- [ ] 替换所有硬编码的 UI 文本
- [ ] 替换所有 message 提示
- [ ] 替换所有表单验证消息
- [ ] 替换所有 Modal 和 Popconfirm 文本
- [ ] 替换所有表格列标题
- [ ] 替换所有按钮文本
- [ ] 在两个语言包中都添加相应的翻译键
- [ ] 测试两种语言的显示效果

## 参考资源

- [React i18n 最佳实践](https://react.i18next.com/)
- [Ant Design 国际化](https://ant.design/components/locale/)
- [TypeScript 类型安全](https://www.typescriptlang.org/)

## 贡献指南

1. Fork 项目
2. 创建特性分支：`git checkout -b feature/i18n-language`
3. 添加新语言或更新翻译
4. 提交更改：`git commit -m 'Add Japanese language support'`
5. 推送分支：`git push origin feature/i18n-language`
6. 创建 Pull Request

---

**版本**: 1.0.0
**最后更新**: 2026-03-07
