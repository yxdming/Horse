import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  AutoComplete,
  Tag,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  FolderOutlined,
  BulbOutlined,
  TeamOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { Memory } from '../types';
import { memoryApi } from '../services/api';

const { TextArea } = Input;
const { Search } = Input;

const MemoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('memories');

  // 记忆管理状态
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoryCategories, setMemoryCategories] = useState<string[]>([]);
  const [memoryTypes, setMemoryTypes] = useState<string[]>([]);
  const [memoryTotal, setMemoryTotal] = useState(0);
  const [memoryPage, setMemoryPage] = useState(1);
  const [memoryPageSize, setMemoryPageSize] = useState(10);
  const [memorySearchQuery, setMemorySearchQuery] = useState('');
  const [memorySelectedCategory, setMemorySelectedCategory] = useState<string | undefined>();
  const [memorySelectedType, setMemorySelectedType] = useState<string | undefined>();
  const [memoryMinImportance, setMemoryMinImportance] = useState<number | undefined>();

  const [memoryModalVisible, setMemoryModalVisible] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [memoryForm] = Form.useForm();
  const [memoryLoading, setMemoryLoading] = useState(false);

  // 模板管理状态
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [templateForm] = Form.useForm();
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  // 用户权限状态
  const [memoryUsers, setMemoryUsers] = useState<any[]>([]);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [userForm] = Form.useForm();

  useEffect(() => {
    if (activeTab === 'memories') {
      fetchMemories();
      fetchMemoryCategories();
      fetchMemoryTypes();
    } else if (activeTab === 'templates') {
      fetchTemplates();
    } else if (activeTab === 'users') {
      fetchMemoryUsers();
    }
  }, [activeTab, memoryPage, memoryPageSize, memorySearchQuery, memorySelectedCategory, memorySelectedType, memoryMinImportance]);

  // ==================== 记忆管理 ====================
  const fetchMemories = async () => {
    try {
      setMemoryLoading(true);
      const response = await memoryApi.getMemories({
        skip: (memoryPage - 1) * memoryPageSize,
        limit: memoryPageSize,
        category: memorySelectedCategory,
        memory_type: memorySelectedType,
        search: memorySearchQuery || undefined,
        min_importance: memoryMinImportance,
      });
      setMemories(response.memories || []);
      setMemoryTotal(response.total || 0);
    } catch (error) {
      message.error('获取记忆列表失败');
    } finally {
      setMemoryLoading(false);
    }
  };

  const fetchMemoryCategories = async () => {
    try {
      const response = await memoryApi.getCategories();
      setMemoryCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to fetch memory categories:', error);
    }
  };

  const fetchMemoryTypes = async () => {
    try {
      const response = await memoryApi.getTypes();
      setMemoryTypes(response.types || []);
    } catch (error) {
      console.error('Failed to fetch memory types:', error);
    }
  };

  const handleAddMemory = () => {
    setEditingMemory(null);
    memoryForm.resetFields();
    setMemoryModalVisible(true);
  };

  const handleEditMemory = (record: Memory) => {
    setEditingMemory(record);
    memoryForm.setFieldsValue(record);
    setMemoryModalVisible(true);
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await memoryApi.deleteMemory(id);
      message.success('删除成功');
      fetchMemories();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmitMemory = async () => {
    try {
      const values = await memoryForm.validateFields();

      if (editingMemory) {
        await memoryApi.updateMemory(editingMemory.id, values);
        message.success('更新成功');
      } else {
        await memoryApi.createMemory(values);
        message.success('创建成功');
      }

      setMemoryModalVisible(false);
      memoryForm.resetFields();
      fetchMemories();
      fetchMemoryCategories();
    } catch (error) {
      message.error(editingMemory ? '更新失败' : '创建失败');
    }
  };

  const memoryColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '类型',
      dataIndex: 'memory_type',
      key: 'memory_type',
      width: 120,
      render: (type: string) => <Tag color="purple">{type}</Tag>,
    },
    {
      title: '重要性',
      dataIndex: 'importance',
      key: 'importance',
      width: 100,
      render: (importance: number) => {
        const color = importance >= 4 ? 'red' : importance >= 3 ? 'orange' : 'green';
        return <Tag color={color}>{'★'.repeat(importance)}</Tag>;
      },
    },
    {
      title: '访问次数',
      dataIndex: 'access_count',
      key: 'access_count',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Memory) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditMemory(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记忆吗？"
            onConfirm={() => handleDeleteMemory(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ==================== 模板管理 ====================
  const fetchTemplates = async () => {
    // 模拟模板数据
    setTemplates([
      {
        id: '1',
        name: '技术文档模板',
        description: '用于记录技术知识、代码片段、解决方案等',
        category: '技术',
        memory_type: '长期记忆',
        default_importance: 4,
        tags: ['技术', '文档'],
        created_at: '2026-03-07T10:00:00Z',
      },
      {
        id: '2',
        name: '会议记录模板',
        description: '用于记录会议内容、决策事项、行动项等',
        category: '工作',
        memory_type: '短期记忆',
        default_importance: 3,
        tags: ['会议', '工作'],
        created_at: '2026-03-07T10:00:00Z',
      },
      {
        id: '3',
        name: '学习笔记模板',
        description: '用于记录学习心得、知识点总结等',
        category: '学习',
        memory_type: '工作记忆',
        default_importance: 3,
        tags: ['学习', '笔记'],
        created_at: '2026-03-07T10:00:00Z',
      },
    ]);
  };

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    templateForm.resetFields();
    setTemplateModalVisible(true);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    templateForm.setFieldsValue(template);
    setTemplateModalVisible(true);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    message.success('删除成功');
  };

  const handleSubmitTemplate = () => {
    templateForm.validateFields().then((values) => {
      if (editingTemplate) {
        setTemplates(templates.map(t => t.id === editingTemplate.id ? { ...values, id: editingTemplate.id } : t));
        message.success('更新成功');
      } else {
        setTemplates([...templates, { ...values, id: Date.now().toString(), created_at: new Date().toISOString() }]);
        message.success('创建成功');
      }
      setTemplateModalVisible(false);
      templateForm.resetFields();
    });
  };

  const handleUseTemplate = (template: any) => {
    setActiveTab('memories');
    memoryForm.setFieldsValue({
      category: template.category,
      memory_type: template.memory_type,
      importance: template.default_importance,
      tags: template.tags,
    });
    setMemoryModalVisible(true);
    message.info(`已应用模板：${template.name}`);
  };

  const templateColumns = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '记忆类型',
      dataIndex: 'memory_type',
      key: 'memory_type',
      render: (type: string) => <Tag color="purple">{type}</Tag>,
    },
    {
      title: '默认重要性',
      dataIndex: 'default_importance',
      key: 'default_importance',
      render: (importance: number) => <Tag color="orange">{'★'.repeat(importance)}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => handleUseTemplate(record)}
          >
            使用
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditTemplate(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个模板吗？"
            onConfirm={() => handleDeleteTemplate(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ==================== 用户权限管理 ====================
  const fetchMemoryUsers = async () => {
    // 模拟用户权限数据
    setMemoryUsers([
      {
        id: '1',
        username: 'admin',
        role: '管理员',
        permissions: ['全部'],
        memoryCount: 0,
        lastAccess: '2026-03-07 10:30:00',
      },
      {
        id: '2',
        username: 'user1',
        role: '编辑者',
        permissions: ['创建', '编辑', '查看'],
        memoryCount: 15,
        lastAccess: '2026-03-07 09:15:00',
      },
      {
        id: '3',
        username: 'user2',
        role: '查看者',
        permissions: ['查看'],
        memoryCount: 0,
        lastAccess: '2026-03-06 16:45:00',
      },
    ]);
  };

  const handleAddUser = () => {
    userForm.resetFields();
    setUserModalVisible(true);
  };

  const handleDeleteUser = (id: string) => {
    setMemoryUsers(memoryUsers.filter(u => u.id !== id));
    message.success('移除成功');
  };

  const userColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <>
          {permissions.map((p) => (
            <Tag key={p} color="green">
              {p}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '记忆数量',
      dataIndex: 'memoryCount',
      key: 'memoryCount',
    },
    {
      title: '最后访问',
      dataIndex: 'lastAccess',
      key: 'lastAccess',
      render: (date: string) => (
        <span style={{ marginLeft: 8 }}>
          <ClockCircleOutlined /> {date}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Popconfirm
          title="确定要移除这个用户吗？"
          onConfirm={() => handleDeleteUser(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" size="small" danger>
            移除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // ==================== 渲染 ====================
  const tabItems = [
    {
      key: 'memories',
      label: (
        <span>
          <BulbOutlined />
          记忆列表
        </span>
      ),
      children: (
        <Card
          title="记忆库管理"
          extra={
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchMemories}>
                刷新
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMemory}>
                新增记忆
              </Button>
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }} size="large">
            <Card size="small">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="总记忆数"
                    value={memoryTotal}
                    prefix={<BulbOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="分类数"
                    value={memoryCategories.length}
                    prefix={<FolderOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="记忆类型"
                    value={memoryTypes.length}
                    prefix={<Tag />}
                  />
                </Col>
                <Col span={6}>
                  <Button
                    icon={<SearchOutlined />}
                    onClick={() => message.info('语义搜索功能开发中')}
                  >
                    语义搜索
                  </Button>
                </Col>
              </Row>
            </Card>

            <Card size="small">
              <Space>
                <Search
                  placeholder="搜索记忆标题、内容或标签"
                  allowClear
                  style={{ width: 300 }}
                  onSearch={setMemorySearchQuery}
                  enterButton
                />
                <Select
                  placeholder="选择分类"
                  allowClear
                  style={{ width: 150 }}
                  value={memorySelectedCategory}
                  onChange={setMemorySelectedCategory}
                  options={memoryCategories.map(cat => ({ label: cat, value: cat }))}
                />
                <Select
                  placeholder="记忆类型"
                  allowClear
                  style={{ width: 150 }}
                  value={memorySelectedType}
                  onChange={setMemorySelectedType}
                  options={memoryTypes.map(type => ({ label: type, value: type }))}
                />
                <Select
                  placeholder="最低重要性"
                  allowClear
                  style={{ width: 150 }}
                  value={memoryMinImportance}
                  onChange={setMemoryMinImportance}
                  options={[
                    { label: '⭐', value: 1 },
                    { label: '⭐⭐', value: 2 },
                    { label: '⭐⭐⭐', value: 3 },
                    { label: '⭐⭐⭐⭐', value: 4 },
                    { label: '⭐⭐⭐⭐⭐', value: 5 },
                  ]}
                />
              </Space>
            </Card>

            <Table
              columns={memoryColumns}
              dataSource={memories}
              rowKey="id"
              loading={memoryLoading}
              scroll={{ x: 1200 }}
              pagination={{
                current: memoryPage,
                pageSize: memoryPageSize,
                total: memoryTotal,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, pageSize) => {
                  setMemoryPage(page);
                  setMemoryPageSize(pageSize || 10);
                },
              }}
            />
          </Space>
        </Card>
      ),
    },
    {
      key: 'templates',
      label: (
        <span>
          <FileTextOutlined />
          记忆库模板
        </span>
      ),
      children: (
        <Card
          title="记忆库模板管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTemplate}>
              新增模板
            </Button>
          }
        >
          <Alert
            message="模板说明"
            description="预设记忆模板可以快速创建特定类型的记忆，提高记录效率。模板包含默认的分类、记忆类型、重要性和标签。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Table
            columns={templateColumns}
            dataSource={templates}
            rowKey="id"
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'users',
      label: (
        <span>
          <TeamOutlined />
          用户权限
        </span>
      ),
      children: (
        <Card
          title="记忆库用户权限"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
              添加用户
            </Button>
          }
        >
          <Alert
            message="权限说明"
            description="管理员拥有所有权限，编辑者可以创建、编辑和查看记忆，查看者只能浏览记忆内容。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Table
            columns={userColumns}
            dataSource={memoryUsers}
            rowKey="id"
            pagination={false}
          />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />

      {/* 记忆编辑弹窗 */}
      <Modal
        title={editingMemory ? '编辑记忆' : '新增记忆'}
        open={memoryModalVisible}
        onOk={handleSubmitMemory}
        onCancel={() => {
          setMemoryModalVisible(false);
          memoryForm.resetFields();
        }}
        width={800}
        okText="确定"
        cancelText="取消"
      >
        <Form form={memoryForm} layout="vertical">
          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入记忆标题' }]}
          >
            <Input placeholder="请输入记忆标题" />
          </Form.Item>

          <Form.Item
            label="分类"
            name="category"
            rules={[{ required: true, message: '请输入分类名称' }]}
            extra="可以从现有分类中选择，或输入新的分类名称"
          >
            <AutoComplete
              options={memoryCategories.map((cat) => ({ label: cat, value: cat }))}
              placeholder="输入或选择分类"
              filterOption={(inputValue, option) =>
                option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />
          </Form.Item>

          <Form.Item label="标签" name="tags">
            <Select mode="tags" placeholder="输入标签，按回车添加" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="记忆类型"
                name="memory_type"
                initialValue="长期记忆"
                rules={[{ required: true, message: '请选择记忆类型' }]}
              >
                <Select placeholder="请选择记忆类型">
                  <Select.Option value="长期记忆">长期记忆</Select.Option>
                  <Select.Option value="短期记忆">短期记忆</Select.Option>
                  <Select.Option value="工作记忆">工作记忆</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="重要性"
                name="importance"
                initialValue={3}
                rules={[{ required: true, message: '请选择重要性' }]}
              >
                <Select placeholder="请选择重要性">
                  <Select.Option value={1}>⭐</Select.Option>
                  <Select.Option value={2}>⭐⭐</Select.Option>
                  <Select.Option value={3}>⭐⭐⭐</Select.Option>
                  <Select.Option value={4}>⭐⭐⭐⭐</Select.Option>
                  <Select.Option value={5}>⭐⭐⭐⭐⭐</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="内容"
            name="content"
            rules={[{ required: true, message: '请输入记忆内容' }]}
          >
            <TextArea rows={10} placeholder="请输入记忆内容" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 模板编辑弹窗 */}
      <Modal
        title={editingTemplate ? '编辑模板' : '新增模板'}
        open={templateModalVisible}
        onOk={handleSubmitTemplate}
        onCancel={() => {
          setTemplateModalVisible(false);
          templateForm.resetFields();
        }}
        width={600}
        okText="确定"
        cancelText="取消"
      >
        <Form form={templateForm} layout="vertical">
          <Form.Item
            label="模板名称"
            name="name"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
            rules={[{ required: true, message: '请输入模板描述' }]}
          >
            <TextArea rows={3} placeholder="请输入模板描述" />
          </Form.Item>

          <Form.Item
            label="分类"
            name="category"
            rules={[{ required: true, message: '请输入分类' }]}
          >
            <Input placeholder="请输入分类" />
          </Form.Item>

          <Form.Item
            label="记忆类型"
            name="memory_type"
            initialValue="长期记忆"
            rules={[{ required: true, message: '请选择记忆类型' }]}
          >
            <Select placeholder="请选择记忆类型">
              <Select.Option value="长期记忆">长期记忆</Select.Option>
              <Select.Option value="短期记忆">短期记忆</Select.Option>
              <Select.Option value="工作记忆">工作记忆</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="默认重要性"
            name="default_importance"
            initialValue={3}
            rules={[{ required: true, message: '请选择默认重要性' }]}
          >
            <Select placeholder="请选择默认重要性">
              <Select.Option value={1}>⭐</Select.Option>
              <Select.Option value={2}>⭐⭐</Select.Option>
              <Select.Option value={3}>⭐⭐⭐</Select.Option>
              <Select.Option value={4}>⭐⭐⭐⭐</Select.Option>
              <Select.Option value={5}>⭐⭐⭐⭐⭐</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="默认标签" name="tags">
            <Select mode="tags" placeholder="输入标签，按回车添加" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加用户弹窗 */}
      <Modal
        title="添加记忆库用户"
        open={userModalVisible}
        onOk={() => {
          userForm.validateFields().then((values) => {
            setMemoryUsers([
              ...memoryUsers,
              {
                id: Date.now().toString(),
                ...values,
                memoryCount: 0,
                lastAccess: new Date().toLocaleString('zh-CN')
              }
            ]);
            setUserModalVisible(false);
            userForm.resetFields();
            message.success('添加成功');
          });
        }}
        onCancel={() => {
          setUserModalVisible(false);
          userForm.resetFields();
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={userForm} layout="vertical">
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Select.Option value="管理员">管理员</Select.Option>
              <Select.Option value="编辑者">编辑者</Select.Option>
              <Select.Option value="查看者">查看者</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="权限"
            name="permissions"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Select mode="multiple" placeholder="请选择权限">
              <Select.Option value="全部">全部</Select.Option>
              <Select.Option value="创建">创建</Select.Option>
              <Select.Option value="编辑">编辑</Select.Option>
              <Select.Option value="查看">查看</Select.Option>
              <Select.Option value="删除">删除</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MemoryPage;
