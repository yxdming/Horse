import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Alert,
  Descriptions,
  Typography,
  Divider,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  CopyOutlined,
  PlayCircleOutlined,
  StarOutlined,
  StarFilled,
  MessageOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useTranslation } from '../contexts/LanguageContext';
import { createTranslateProxy } from '../utils/i18n';
import { useApp } from '../hooks/useApp';

const { TextArea } = Input;
const { Search } = Input;
const { Paragraph, Text } = Typography;

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  category: string;
  tags: string[];
  variables: string[];
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
  updated_at?: string;
}

const Prompts: React.FC = () => {
  const { t } = useTranslation();
  const tp = createTranslateProxy(t);
  const { message } = useApp();
  const [activeTab, setActiveTab] = useState('templates');

  // 状态管理
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const [modalVisible, setModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<PromptTemplate | null>(null);
  const [form] = Form.useForm();
  const [testForm] = Form.useForm();

  const [stats, setStats] = useState({
    totalTemplates: 0,
    favorites: 0,
    categories: 0,
    totalUsage: 0,
  });

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
      fetchCategories();
      fetchStats();
    }
  }, [activeTab, page, pageSize, searchQuery, selectedCategory]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await promptsApi.getTemplates({
      //   skip: (page - 1) * pageSize,
      //   limit: pageSize,
      //   category: selectedCategory,
      //   search: searchQuery || undefined,
      // });
      // setTemplates(response.templates || []);
      // setTotal(response.total || 0);

      // Mock data
      const mockTemplates: PromptTemplate[] = [
        {
          id: '1',
          name: 'Code Review Assistant',
          description: 'Helps review code for best practices and potential issues',
          template: 'You are a code review assistant. Review the following code:\n\n{code}\n\nProvide feedback on:\n1. Code quality\n2. Performance\n3. Security\n4. Best practices',
          category: 'Development',
          tags: ['code-review', 'development', 'best-practices'],
          variables: ['code'],
          is_favorite: true,
          usage_count: 156,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Document Summarizer',
          description: 'Summarizes long documents into concise key points',
          template: 'Please summarize the following document:\n\n{document}\n\nKey points:\n1.\n2.\n3.',
          category: 'Productivity',
          tags: ['summarization', 'document', 'productivity'],
          variables: ['document'],
          is_favorite: false,
          usage_count: 89,
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'SQL Query Generator',
          description: 'Generates SQL queries from natural language descriptions',
          template: 'Generate a SQL query to: {description}\n\nSchema:\n{schema}\n\nQuery:',
          category: 'Database',
          tags: ['sql', 'database', 'query'],
          variables: ['description', 'schema'],
          is_favorite: true,
          usage_count: 234,
          created_at: new Date().toISOString(),
        },
      ];
      setTemplates(mockTemplates);
      setTotal(mockTemplates.length);
    } catch (error) {
      message.error(tp('prompts.templates.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // TODO: Replace with actual API call
      const mockCategories = ['Development', 'Productivity', 'Database', 'Writing', 'Analysis'];
      setCategories(mockCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // TODO: Replace with actual API call
      setStats({
        totalTemplates: 45,
        favorites: 12,
        categories: 8,
        totalUsage: 3842,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleAdd = () => {
    setEditingTemplate(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (template: PromptTemplate) => {
    setEditingTemplate(template);
    form.setFieldsValue(template);
    setModalVisible(true);
  };

  const handlePreview = (template: PromptTemplate) => {
    setPreviewTemplate(template);
    setPreviewModalVisible(true);
  };

  const handleTest = (template: PromptTemplate) => {
    setEditingTemplate(template);
    testForm.resetFields();
    setTestModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // TODO: Replace with actual API call
      // await promptsApi.deleteTemplate(id);
      message.success(tp('prompts.templates.deleteSuccess'));
      fetchTemplates();
      fetchStats();
    } catch (error) {
      message.error(tp('prompts.templates.deleteFailed'));
    }
  };

  const handleToggleFavorite = async (template: PromptTemplate) => {
    try {
      // TODO: Replace with actual API call
      // await promptsApi.toggleFavorite(template.id);
      setTemplates(templates.map(t =>
        t.id === template.id ? { ...t, is_favorite: !t.is_favorite } : t
      ));
      fetchStats();
    } catch (error) {
      message.error(tp('prompts.templates.toggleFavoriteFailed'));
    }
  };

  const handleCopy = (template: string) => {
    navigator.clipboard.writeText(template);
    message.success(tp('prompts.templates.copySuccess'));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // TODO: Replace with actual API call
      // if (editingTemplate) {
      //   await promptsApi.updateTemplate(editingTemplate.id, values);
      // } else {
      //   await promptsApi.createTemplate(values);
      // }
      message.success(editingTemplate ? tp('prompts.templates.updateSuccess') : tp('prompts.templates.createSuccess'));
      setModalVisible(false);
      fetchTemplates();
      fetchStats();
    } catch (error) {
      message.error(editingTemplate ? tp('prompts.templates.updateFailed') : tp('prompts.templates.createFailed'));
    }
  };

  const handleTestSubmit = async () => {
    try {
      const values = await testForm.validateFields();
      // TODO: Implement test API call
      message.info(tp('prompts.templates.testRunning'));
      // Simulate test
      await new Promise(resolve => setTimeout(resolve, 2000));
      message.success(tp('prompts.templates.testSuccess'));
    } catch (error) {
      message.error(tp('prompts.templates.testFailed'));
    }
  };

  const columns = [
    {
      title: tp('prompts.templates.colName'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: PromptTemplate) => (
        <Space direction="vertical" size={0}>
          <Space>
            {record.is_favorite && <StarFilled style={{ color: '#F59E0B' }} />}
            <strong>{text}</strong>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.description}
          </Text>
        </Space>
      ),
    },
    {
      title: tp('prompts.templates.colCategory'),
      dataIndex: 'category',
      key: 'category',
      filters: categories.map(cat => ({ text: cat, value: cat })),
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: tp('prompts.templates.colTags'),
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <>
          {tags?.map(tag => (
            <Tag key={tag} color="blue">{tag}</Tag>
          ))}
        </>
      ),
    },
    {
      title: tp('prompts.templates.colVariables'),
      dataIndex: 'variables',
      key: 'variables',
      render: (variables: string[]) => (
        <>
          {variables?.map(v => (
            <Tag key={v} color="purple">{`{${v}}`}</Tag>
          ))}
        </>
      ),
    },
    {
      title: tp('prompts.templates.colUsage'),
      dataIndex: 'usage_count',
      key: 'usage_count',
      sorter: (a: PromptTemplate, b: PromptTemplate) => a.usage_count - b.usage_count,
    },
    {
      title: tp('prompts.templates.colCreated'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: tp('prompts.templates.colActions'),
      key: 'actions',
      render: (_: any, record: PromptTemplate) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<StarOutlined />}
            onClick={() => handleToggleFavorite(record)}
          >
            {record.is_favorite ? tp('common.unfavorite') : tp('common.favorite')}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleTest(record)}
          >
            {tp('common.test')}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CodeOutlined />}
            onClick={() => handlePreview(record)}
          >
            {tp('common.preview')}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {tp('common.edit')}
          </Button>
          <Popconfirm
            title={tp('prompts.templates.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
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

  return (
    <div>
      <Card
        title={
          <Space>
            <MessageOutlined />
            {tp('prompts.title')}
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchTemplates}>
              {tp('common.refresh')}
            </Button>
            <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>
              {tp('prompts.templates.addButton')}
            </Button>
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title={tp('prompts.stats.totalTemplates')}
              value={stats.totalTemplates}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#6366F1' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={tp('prompts.stats.favorites')}
              value={stats.favorites}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#F59E0B' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={tp('prompts.stats.categories')}
              value={stats.categories}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#10B981' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={tp('prompts.stats.totalUsage')}
              value={stats.totalUsage}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#EF4444' }}
            />
          </Col>
        </Row>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'templates',
              label: tp('prompts.tabs.templates'),
              children: (
                <>
                  <Space style={{ marginBottom: 16 }}>
                    <Search
                      placeholder={tp('prompts.templates.searchPlaceholder')}
                      allowClear
                      enterButton={<SearchOutlined />}
                      size="large"
                      onSearch={setSearchQuery}
                      style={{ width: 300 }}
                    />
                    <Select
                      placeholder={tp('prompts.templates.filterCategory')}
                      allowClear
                      style={{ width: 200 }}
                      value={selectedCategory}
                      onChange={setSelectedCategory}
                    >
                      {categories.map(cat => (
                        <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                      ))}
                    </Select>
                  </Space>

                  <Table
                    columns={columns}
                    dataSource={templates}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      current: page,
                      pageSize: pageSize,
                      total: total,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total) => tp('prompts.templates.total', { count: total }),
                      onChange: (page, pageSize) => {
                        setPage(page);
                        setPageSize(pageSize || 10);
                      },
                    }}
                  />
                </>
              ),
            },
            {
              key: 'favorites',
              label: tp('prompts.tabs.favorites'),
              children: (
                <Table
                  columns={columns}
                  dataSource={templates.filter(t => t.is_favorite)}
                  rowKey="id"
                  pagination={false}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Add/Edit Template Modal */}
      <Modal
        title={editingTemplate ? tp('prompts.templates.editModalTitle') : tp('prompts.templates.addModalTitle')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label={tp('prompts.templates.nameLabel')}
                rules={[{ required: true, message: tp('prompts.templates.nameRequired') }]}
              >
                <Input placeholder={tp('prompts.templates.namePlaceholder')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label={tp('prompts.templates.categoryLabel')}
                rules={[{ required: true, message: tp('prompts.templates.categoryRequired') }]}
              >
                <Select
                  placeholder={tp('prompts.templates.categoryPlaceholder')}
                  showSearch
                  optionFilterProp="children"
                >
                  {categories.map(cat => (
                    <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label={tp('prompts.templates.descriptionLabel')}
            rules={[{ required: true, message: tp('prompts.templates.descriptionRequired') }]}
          >
            <Input placeholder={tp('prompts.templates.descriptionPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="template"
            label={tp('prompts.templates.templateLabel')}
            rules={[{ required: true, message: tp('prompts.templates.templateRequired') }]}
            extra={tp('prompts.templates.templateHelp')}
          >
            <TextArea
              rows={10}
              placeholder={tp('prompts.templates.templatePlaceholder')}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item
            name="tags"
            label={tp('prompts.templates.tagsLabel')}
          >
            <Select
              mode="tags"
              placeholder={tp('prompts.templates.tagsPlaceholder')}
              tokenSeparators={[',']}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title={previewTemplate?.name}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button
            key="copy"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(previewTemplate?.template || '')}
          >
            {tp('common.copy')}
          </Button>,
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            {tp('common.close')}
          </Button>,
        ]}
        width={700}
      >
        {previewTemplate && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={tp('prompts.templates.description')}>
              {previewTemplate.description}
            </Descriptions.Item>
            <Descriptions.Item label={tp('prompts.templates.category')}>
              <Tag>{previewTemplate.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={tp('prompts.templates.tags')}>
              {previewTemplate.tags.map(tag => (
                <Tag key={tag} color="blue">{tag}</Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label={tp('prompts.templates.template')}>
              <Paragraph
                code
                copyable
                style={{
                  background: '#f5f5f5',
                  padding: 12,
                  borderRadius: 4,
                  margin: 0,
                }}
              >
                {previewTemplate.template}
              </Paragraph>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Test Modal */}
      <Modal
        title={`${tp('common.test')}: ${editingTemplate?.name}`}
        open={testModalVisible}
        onOk={handleTestSubmit}
        onCancel={() => setTestModalVisible(false)}
        width={700}
      >
        {editingTemplate && (
          <>
            <Alert
              message={tp('prompts.templates.testHelp')}
              description={tp('prompts.templates.testDescription')}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form form={testForm} layout="vertical">
              {editingTemplate.variables.map(variable => (
                <Form.Item
                  key={variable}
                  name={variable}
                  label={variable}
                  rules={[{ required: true, message: `${variable} is required` }]}
                >
                  <TextArea
                    rows={3}
                    placeholder={`Enter ${variable}...`}
                  />
                </Form.Item>
              ))}
            </Form>

            <Divider>{tp('prompts.templates.preview')}</Divider>

            <Paragraph
              code
              style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 4,
                whiteSpace: 'pre-wrap',
              }}
            >
              {editingTemplate.template}
            </Paragraph>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Prompts;
