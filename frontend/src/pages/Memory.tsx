import React, { useEffect, useState, useMemo } from 'react';
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
import { useTranslation } from '../contexts/LanguageContext';
import { createTranslateProxy } from '../utils/i18n';

const { TextArea } = Input;
const { Search } = Input;

const MemoryPage: React.FC = () => {
  const { t } = useTranslation();
  const tp = useMemo(() => createTranslateProxy(t), [t]);
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
      message.error(tp('memory.list.fetchFailed'));
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
      message.success(tp('memory.list.deleteSuccess'));
      fetchMemories();
    } catch (error) {
      message.error(tp('memory.list.deleteFailed'));
    }
  };

  const handleSubmitMemory = async () => {
    try {
      const values = await memoryForm.validateFields();

      if (editingMemory) {
        await memoryApi.updateMemory(editingMemory.id, values);
        message.success(tp('memory.list.updateSuccess'));
      } else {
        await memoryApi.createMemory(values);
        message.success(tp('memory.list.createSuccess'));
      }

      setMemoryModalVisible(false);
      memoryForm.resetFields();
      fetchMemories();
      fetchMemoryCategories();
    } catch (error) {
      message.error(editingMemory ? tp('memory.list.updateFailed') : tp('memory.list.createFailed'));
    }
  };

  const memoryColumns = [
    {
      title: tp('memory.list.colTitle'),
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: tp('memory.list.colCategory'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: tp('memory.list.colType'),
      dataIndex: 'memory_type',
      key: 'memory_type',
      width: 120,
      render: (type: string) => <Tag color="purple">{type}</Tag>,
    },
    {
      title: tp('memory.list.colImportance'),
      dataIndex: 'importance',
      key: 'importance',
      width: 100,
      render: (importance: number) => {
        const color = importance >= 4 ? 'red' : importance >= 3 ? 'orange' : 'green';
        return <Tag color={color}>{'★'.repeat(importance)}</Tag>;
      },
    },
    {
      title: tp('memory.list.colAccessCount'),
      dataIndex: 'access_count',
      key: 'access_count',
      width: 100,
    },
    {
      title: tp('memory.list.colCreateTime'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: tp('common.actions'),
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
            {tp('common.edit')}
          </Button>
          <Popconfirm
            title={tp('memory.list.deleteConfirm')}
            onConfirm={() => handleDeleteMemory(record.id)}
            okText={tp('common.confirm')}
            cancelText={tp('common.cancel')}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {tp('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ==================== 模板管理 ====================
  const fetchTemplates = async () => {
    try {
      const response = await memoryApi.getTemplates();
      setTemplates(response.templates || []);
    } catch (error) {
      message.error(tp('memory.templates.fetchFailed'));
    }
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

  const handleDeleteTemplate = async (id: string) => {
    try {
      await memoryApi.deleteTemplate(id);
      message.success(tp('memory.templates.deleteSuccess'));
      fetchTemplates();
    } catch (error) {
      message.error(tp('memory.templates.deleteFailed'));
    }
  };

  const handleSubmitTemplate = async () => {
    try {
      const values = await templateForm.validateFields();
      if (editingTemplate) {
        await memoryApi.updateTemplate(editingTemplate.id, values);
        message.success(tp('memory.list.updateSuccess'));
      } else {
        await memoryApi.createTemplate(values);
        message.success(tp('memory.list.createSuccess'));
      }
      setTemplateModalVisible(false);
      templateForm.resetFields();
      fetchTemplates();
    } catch (error) {
      message.error(editingTemplate ? tp('memory.templates.updateFailed') : tp('memory.templates.createFailed'));
    }
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
    message.info(tp('memory.templates.applied', { name: template.name }));
  };

  const templateColumns = [
    {
      title: tp('memory.templates.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: tp('memory.templates.colDescription'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: tp('memory.list.colCategory'),
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: tp('memory.list.colType'),
      dataIndex: 'memory_type',
      key: 'memory_type',
      render: (type: string) => <Tag color="purple">{type}</Tag>,
    },
    {
      title: tp('memory.templates.defaultImportance'),
      dataIndex: 'default_importance',
      key: 'default_importance',
      render: (importance: number) => <Tag color="orange">{'★'.repeat(importance)}</Tag>,
    },
    {
      title: tp('common.actions'),
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => handleUseTemplate(record)}
          >
            {tp('memory.templates.use')}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditTemplate(record)}
          >
            {tp('common.edit')}
          </Button>
          <Popconfirm
            title={tp('memory.templates.deleteConfirm')}
            onConfirm={() => handleDeleteTemplate(record.id)}
            okText={tp('common.confirm')}
            cancelText={tp('common.cancel')}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {tp('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ==================== 用户权限管理 ====================
  const fetchMemoryUsers = async () => {
    try {
      const response = await memoryApi.getMemoryUsers();
      setMemoryUsers(response.users || []);
    } catch (error) {
      message.error(tp('memory.permissions.fetchFailed'));
    }
  };

  const handleAddUser = async () => {
    userForm.resetFields();
    setUserModalVisible(true);
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await memoryApi.deleteMemoryUser(id);
      message.success(tp('memory.permissions.removeSuccess'));
      fetchMemoryUsers();
    } catch (error) {
      message.error(tp('memory.permissions.removeFailed'));
    }
  };

  const userColumns = [
    {
      title: tp('memory.permissions.colUsername'),
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: tp('memory.permissions.colRole'),
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: tp('memory.permissions.colPermissions'),
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
      title: tp('memory.permissions.colMemoryCount'),
      dataIndex: 'memoryCount',
      key: 'memoryCount',
    },
    {
      title: tp('memory.permissions.colLastAccess'),
      dataIndex: 'lastAccess',
      key: 'lastAccess',
      render: (date: string) => (
        <span style={{ marginLeft: 8 }}>
          <ClockCircleOutlined /> {date}
        </span>
      ),
    },
    {
      title: tp('common.actions'),
      key: 'action',
      render: (_: any, record: any) => (
        <Popconfirm
          title={tp('memory.permissions.removeConfirm')}
          onConfirm={() => handleDeleteUser(record.id)}
          okText={tp('common.confirm')}
          cancelText={tp('common.cancel')}
        >
          <Button type="link" size="small" danger>
            {tp('memory.permissions.remove')}
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
          {tp('memory.tabs.list')}
        </span>
      ),
      children: (
        <Card
          title={tp('memory.title')}
          extra={
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchMemories}>
                {tp('common.refresh')}
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMemory}>
                {tp('memory.list.addButton')}
              </Button>
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }} size="large">
            <Card size="small">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title={tp('memory.list.statsTotal')}
                    value={memoryTotal}
                    prefix={<BulbOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={tp('memory.list.statsCategories')}
                    value={memoryCategories.length}
                    prefix={<FolderOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={tp('memory.list.statsTypes')}
                    value={memoryTypes.length}
                    prefix={<Tag />}
                  />
                </Col>
                <Col span={6}>
                  <Button
                    icon={<SearchOutlined />}
                    onClick={() => message.info(tp('memory.list.semanticSearchDeveloping'))}
                  >
                    {tp('memory.list.semanticSearch')}
                  </Button>
                </Col>
              </Row>
            </Card>

            <Card size="small">
              <Space>
                <Search
                  placeholder={tp('memory.list.searchPlaceholder')}
                  allowClear
                  style={{ width: 300 }}
                  onSearch={setMemorySearchQuery}
                  enterButton
                />
                <Select
                  placeholder={tp('memory.list.categoryPlaceholder')}
                  allowClear
                  style={{ width: 150 }}
                  value={memorySelectedCategory}
                  onChange={setMemorySelectedCategory}
                  options={memoryCategories.map(cat => ({ label: cat, value: cat }))}
                />
                <Select
                  placeholder={tp('memory.list.typePlaceholder')}
                  allowClear
                  style={{ width: 150 }}
                  value={memorySelectedType}
                  onChange={setMemorySelectedType}
                  options={memoryTypes.map(type => ({ label: type, value: type }))}
                />
                <Select
                  placeholder={tp('memory.list.importancePlaceholder')}
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
                showTotal: (total) => tp('common.pagination.total', { total }),
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
          {tp('memory.tabs.templates')}
        </span>
      ),
      children: (
        <Card
          title={tp('memory.templates.title')}
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTemplate}>
              {tp('memory.templates.addButton')}
            </Button>
          }
        >
          <Alert
            message={tp('memory.templates.description')}
            description={tp('memory.templates.descriptionText')}
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
          {tp('memory.tabs.permissions')}
        </span>
      ),
      children: (
        <Card
          title={tp('memory.permissions.title')}
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
              {tp('memory.permissions.addButton')}
            </Button>
          }
        >
          <Alert
            message={tp('memory.permissions.description')}
            description={tp('memory.permissions.descriptionText')}
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
        title={editingMemory ? tp('memory.list.editModalTitle') : tp('memory.list.addModalTitle')}
        open={memoryModalVisible}
        onOk={handleSubmitMemory}
        onCancel={() => {
          setMemoryModalVisible(false);
          memoryForm.resetFields();
        }}
        width={800}
        okText={tp('common.confirm')}
        cancelText={tp('common.cancel')}
      >
        <Form form={memoryForm} layout="vertical">
          <Form.Item
            label={tp('memory.list.titleLabel')}
            name="title"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('memory.list.titleLabel') }) }]}
          >
            <Input placeholder={tp('memory.list.titlePlaceholder')} />
          </Form.Item>

          <Form.Item
            label={tp('memory.list.categoryLabel')}
            name="category"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('memory.list.categoryLabel') }) }]}
            extra={tp('memory.list.categoryHelp')}
          >
            <AutoComplete
              options={memoryCategories.map((cat) => ({ label: cat, value: cat }))}
              placeholder={tp('memory.list.categorySelectPlaceholder')}
              filterOption={(inputValue, option) =>
                option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />
          </Form.Item>

          <Form.Item label={tp('memory.list.tagsLabel')} name="tags">
            <Select mode="tags" placeholder={tp('memory.list.tagsPlaceholder')} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={tp('memory.list.typeLabel')}
                name="memory_type"
                initialValue={tp('memory.list.typeLongTerm')}
                rules={[{ required: true, message: tp('common.validation.requiredSelect', { field: tp('memory.list.typeLabel') }) }]}
              >
                <Select placeholder={tp('memory.list.typePlaceholder')}>
                  <Select.Option value={tp('memory.list.typeLongTerm')}>{tp('memory.list.typeLongTerm')}</Select.Option>
                  <Select.Option value={tp('memory.list.typeShortTerm')}>{tp('memory.list.typeShortTerm')}</Select.Option>
                  <Select.Option value={tp('memory.list.typeWorking')}>{tp('memory.list.typeWorking')}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={tp('memory.list.importanceLabel')}
                name="importance"
                initialValue={3}
                rules={[{ required: true, message: tp('common.validation.requiredSelect', { field: tp('memory.list.importanceLabel') }) }]}
              >
                <Select placeholder={tp('memory.list.importancePlaceholder')}>
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
            label={tp('memory.list.contentLabel')}
            name="content"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('memory.list.contentLabel') }) }]}
          >
            <TextArea rows={10} placeholder={tp('memory.list.contentPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 模板编辑弹窗 */}
      <Modal
        title={editingTemplate ? tp('memory.templates.editModalTitle') : tp('memory.templates.addModalTitle')}
        open={templateModalVisible}
        onOk={handleSubmitTemplate}
        onCancel={() => {
          setTemplateModalVisible(false);
          templateForm.resetFields();
        }}
        width={600}
        okText={tp('common.confirm')}
        cancelText={tp('common.cancel')}
      >
        <Form form={templateForm} layout="vertical">
          <Form.Item
            label={tp('memory.templates.nameLabel')}
            name="name"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('memory.templates.nameLabel') }) }]}
          >
            <Input placeholder={tp('memory.templates.namePlaceholder')} />
          </Form.Item>

          <Form.Item
            label={tp('memory.templates.descriptionLabel')}
            name="description"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('memory.templates.descriptionLabel') }) }]}
          >
            <TextArea rows={3} placeholder={tp('memory.templates.descriptionPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={tp('memory.list.categoryLabel')}
            name="category"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('memory.list.categoryLabel') }) }]}
          >
            <Input placeholder={tp('memory.templates.categoryPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={tp('memory.list.typeLabel')}
            name="memory_type"
            initialValue={tp('memory.list.typeLongTerm')}
            rules={[{ required: true, message: tp('common.validation.requiredSelect', { field: tp('memory.list.typeLabel') }) }]}
          >
            <Select placeholder={tp('memory.list.typePlaceholder')}>
              <Select.Option value={tp('memory.list.typeLongTerm')}>{tp('memory.list.typeLongTerm')}</Select.Option>
              <Select.Option value={tp('memory.list.typeShortTerm')}>{tp('memory.list.typeShortTerm')}</Select.Option>
              <Select.Option value={tp('memory.list.typeWorking')}>{tp('memory.list.typeWorking')}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={tp('memory.templates.defaultImportanceLabel')}
            name="default_importance"
            initialValue={3}
            rules={[{ required: true, message: tp('common.validation.requiredSelect', { field: tp('memory.templates.defaultImportanceLabel') }) }]}
          >
            <Select placeholder={tp('memory.templates.defaultImportancePlaceholder')}>
              <Select.Option value={1}>⭐</Select.Option>
              <Select.Option value={2}>⭐⭐</Select.Option>
              <Select.Option value={3}>⭐⭐⭐</Select.Option>
              <Select.Option value={4}>⭐⭐⭐⭐</Select.Option>
              <Select.Option value={5}>⭐⭐⭐⭐⭐</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label={tp('memory.templates.defaultTagsLabel')} name="tags">
            <Select mode="tags" placeholder={tp('memory.list.tagsPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加用户弹窗 */}
      <Modal
        title={tp('memory.permissions.addModalTitle')}
        open={userModalVisible}
        onOk={async () => {
          try {
            const values = await userForm.validateFields();
            await memoryApi.createMemoryUser(values);
            message.success(tp('memory.permissions.addSuccess'));
            setUserModalVisible(false);
            userForm.resetFields();
            fetchMemoryUsers();
          } catch (error) {
            message.error(tp('memory.permissions.addFailed'));
          }
        }}
        onCancel={() => {
          setUserModalVisible(false);
          userForm.resetFields();
        }}
        okText={tp('common.confirm')}
        cancelText={tp('common.cancel')}
      >
        <Form form={userForm} layout="vertical">
          <Form.Item
            label={tp('memory.permissions.usernameLabel')}
            name="username"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('memory.permissions.usernameLabel') }) }]}
          >
            <Input placeholder={tp('memory.permissions.usernamePlaceholder')} />
          </Form.Item>

          <Form.Item
            label={tp('memory.permissions.roleLabel')}
            name="role"
            rules={[{ required: true, message: tp('common.validation.requiredSelect', { field: tp('memory.permissions.roleLabel') }) }]}
          >
            <Select placeholder={tp('memory.permissions.rolePlaceholder')}>
              <Select.Option value={tp('memory.permissions.roleAdmin')}>{tp('memory.permissions.roleAdmin')}</Select.Option>
              <Select.Option value={tp('memory.permissions.roleEditor')}>{tp('memory.permissions.roleEditor')}</Select.Option>
              <Select.Option value={tp('memory.permissions.roleViewer')}>{tp('memory.permissions.roleViewer')}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={tp('memory.permissions.permissionsLabel')}
            name="permissions"
            rules={[{ required: true, message: tp('common.validation.requiredSelect', { field: tp('memory.permissions.permissionsLabel') }) }]}
          >
            <Select mode="multiple" placeholder={tp('memory.permissions.permissionsPlaceholder')}>
              <Select.Option value={tp('memory.permissions.permAll')}>{tp('memory.permissions.permAll')}</Select.Option>
              <Select.Option value={tp('memory.permissions.permCreate')}>{tp('memory.permissions.permCreate')}</Select.Option>
              <Select.Option value={tp('memory.permissions.permEdit')}>{tp('memory.permissions.permEdit')}</Select.Option>
              <Select.Option value={tp('memory.permissions.permView')}>{tp('memory.permissions.permView')}</Select.Option>
              <Select.Option value={tp('memory.permissions.permDelete')}>{tp('memory.permissions.permDelete')}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MemoryPage;
