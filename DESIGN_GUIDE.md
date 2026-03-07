# AIDP Manager 系统设计指南

## 设计哲学

AIDP Manager管理系统采用**简约现代**的设计语言，强调内容至上、功能优先。

### 核心原则

1. **简约而不简单** - 去除装饰，保留必要元素
2. **一致的设计语言** - 统一的色彩、间距、字体
3. **清晰的视觉层次** - 通过灰度变化建立层次
4. **舒适的阅读体验** - 合适的对比度和留白

## 色彩系统

### 主色调 - 灰色系

```
深灰    #262626  - 标题、重要文字
中灰    #595959  - 主色调、按钮
浅灰    #8c8c8c  - 次要文字、图标
极浅灰  #bfbfbf  - 边框、禁用状态
背景灰  #d9d9d9  - 边框、分隔线
浅背景  #e8e8e8  - 细边框
底灰    #f0f0f0  - 背景块、悬停
纯白    #ffffff  - 卡片、容器
```

### 使用场景

| 颜色 | 应用场景 | 示例 |
|------|---------|------|
| #262626 | 一级标题、重要文字 | 页面标题、关键数据 |
| #595959 | 主按钮、链接 | 登录按钮、菜单文字 |
| #8c8c8c | 辅助文字 | 提示信息、时间戳 |
| #bfbfbf | 图标、分割线 | 头像背景、输入框边框 |
| #d9d9d9 | 边框 | 表格边框、卡片边框 |
| #e8e8e8 | 细边框 | Tag标签、分隔线 |
| #f0f0f0 | 背景块 | 代码块、悬停状态 |
| #fafafa | 页面背景 | 内容区背景 |
| #ffffff | 容器背景 | 卡片、侧边栏 |

## 间距系统

采用8px基础网格系统：

```
4px  - 极小间距（图标内边距）
8px  - 小间距（相关元素组）
12px - 中小间距（表单项）
16px - 中间距（卡片内部）
24px - 大间距（区块之间）
32px - 超大间距（页面级）
```

### 应用示例

```css
/* 卡片内边距 */
padding: 24px;

/* 表单项间距 */
margin-bottom: 16px;

/* 按钮组间距 */
gap: 8px;

/* 页面外边距 */
margin: 24px;
```

## 字体系统

### 字体家族

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  'Helvetica Neue', Arial, sans-serif;
```

### 字体大小

```
12px - 辅助文字
14px - 正文、按钮
16px - 小标题
18px - 中标题
20px - 大标题
24px - 页面标题
28px - 特殊标题（登录页）
```

### 字重

```
400 (Regular) - 正文
500 (Medium)  - 小标题、表格头
600 (SemiBold) - 导航Logo
```

## 组件规范

### Card 卡片

```css
.card {
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  padding: 24px;
}
```

**特点**:
- 白底灰边
- 极轻阴影
- 4px圆角
- 24px内边距

### Button 按钮

**主按钮**:
```css
background: #595959;
border: 1px solid #595959;
color: #ffffff;
border-radius: 4px;
```

**次要按钮**:
```css
background: #ffffff;
border: 1px solid #d9d9d9;
color: #595959;
```

**悬停状态**:
```css
/* 主按钮 */
background: #434343;

/* 次要按钮 */
border-color: #595959;
color: #595959;
```

### Input 输入框

```css
border: 1px solid #e8e8e8;
border-radius: 4px;
padding: 8px 12px;
font-size: 14px;
```

**状态**:
- 默认: 浅灰边框
- 悬停: 中灰边框 (#d9d9d9)
- 聚焦: 灰边框 (#bfbfbf) + 极淡阴影

### Table 表格

```css
/* 表头 */
background: #fafafa;
border-bottom: 1px solid #f0f0f0;

/* 表格行 */
border-bottom: 1px solid #f0f0f0;

/* 悬停 */
background: #fafafa;
```

### Tag 标签

```css
border-radius: 2px;
font-size: 12px;
padding: 2px 8px;
```

## 布局规范

### 页面布局

```
┌─────────────────────────────────┐
│ Header (64px)                   │  固定高度
├───┬─────────────────────────────┤
│ S│                              │
│ i│                              │
│ d│ Content (自动高度)            │  自适应
│ e│                              │
│ r│                              │
│ b│                              │
│ a│                              │
│ r│                              │
└───┴─────────────────────────────┘
```

### 容器规范

```css
/* 页面容器 */
.page-container {
  margin: 24px;
  padding: 24px;
  background: #fafafa;
  border-radius: 4px;
}

/* 卡片容器 */
.card-container {
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 24px;
}
```

## 状态设计

### 成功状态

```css
color: #52c41a;
background: #f6ffed;
border: 1px solid #b7eb8f;
```

### 警告状态

```css
color: #faad14;
background: #fffbe6;
border: 1px solid #ffe58f;
```

### 错误状态

```css
color: #ff4d4f;
background: #fff2f0;
border: 1px solid #ffccc7;
```

### 信息状态

```css
color: #1890ff;
background: #e6f7ff;
border: 1px solid #91d5ff;
```

## 响应式设计

### 断点定义

```
xs: < 576px   (手机)
sm: ≥ 576px   (大手机)
md: ≥ 768px   (平板)
lg: ≥ 992px   (小桌面)
xl: ≥ 1200px  (桌面)
xxl: ≥ 1600px (大桌面)
```

### 响应式策略

1. **移动优先** - 从小屏开始设计
2. **流式布局** - 使用百分比和flex
3. **隐藏次要内容** - 移动端隐藏侧边栏
4. **触摸优化** - 增大点击区域

## 动效规范

### 过渡时长

```css
/* 快速 */
transition: all 0.1s;

/* 标准 */
transition: all 0.3s;

/* 缓慢 */
transition: all 0.5s;
```

### 缓动函数

```css
/* 线性 */
ease: linear;

/* 缓入缓出 */
ease: ease-in-out;

/* 自定义 */
cubic-bezier(0.4, 0, 0.2, 1);
```

### 动效示例

```css
/* 悬停效果 */
.button:hover {
  background: #434343;
  transition: background 0.3s ease;
}

/* 淡入淡出 */
.fade {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

## 可访问性

### 对比度

- 正文文字: ≥ 4.5:1
- 大文字: ≥ 3:1
- 图标: ≥ 3:1

### 焦点状态

```css
:focus-visible {
  outline: 2px solid #595959;
  outline-offset: 2px;
}
```

### 键盘导航

- Tab: 焦点移动
- Enter/Space: 激活
- Esc: 关闭弹窗

## 设计资源

### 工具推荐

- **色彩工具**: https://ant.design/docs/spec/colors
- **间距工具**: 8pt Grid System
- **图标库**: @ant-design/icons
- **原型工具**: Figma, Sketch

### 参考网站

- Ant Design: https://ant.design/
- Material Design: https://material.io/design
- Atlassian Design: https://atlassian.design/

---

**版本**: 1.0.0
**更新**: 2026-03-06
**维护**: AIDP Design Team
