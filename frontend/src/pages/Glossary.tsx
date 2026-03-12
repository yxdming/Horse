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
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ImportOutlined,
  ExportOutlined,
  BookOutlined,
  FileTextOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { useTranslation } from '../contexts/LanguageContext';
import { createTranslateProxy } from '../utils/i18n';
import { useApp } from '../hooks/useApp';

const { TextArea } = Input;
const { Search } = Input;

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  mapping: string;
  category: string;
  example: string;
  created_at: string;
  updated_at?: string;
}

const Glossary: React.FC = () => {
  const { t } = useTranslation();
  const tp = createTranslateProxy(t);
  const { message } = useApp();
  const [activeTab, setActiveTab] = useState('terms');

  // 状态管理
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null);
  const [form] = Form.useForm();

  const [stats, setStats] = useState({
    totalTerms: 0,
    categories: 0,
    recentlyAdded: 0,
  });

  useEffect(() => {
    if (activeTab === 'terms') {
      fetchTerms();
      fetchCategories();
      fetchStats();
    }
  }, [activeTab, page, pageSize, searchQuery, selectedCategory]);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await glossaryApi.getTerms({
      //   skip: (page - 1) * pageSize,
      //   limit: pageSize,
      //   category: selectedCategory,
      //   search: searchQuery || undefined,
      // });
      // setTerms(response.terms || []);
      // setTotal(response.total || 0);

      // Mock data for now
      const mockTerms: GlossaryTerm[] = [
        {
          id: '1',
          term: 'DAU',
          definition: 'Daily Active Users',
          mapping: '日活跃用户数',
          category: 'Metrics',
          example: 'Yesterday DAU was 10,000',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          term: 'Conversion Rate',
          definition: 'The percentage of users who take a desired action',
          mapping: '转化率',
          category: 'Marketing',
          example: 'Our conversion rate increased by 2%',
          created_at: new Date().toISOString(),
        },
      ];
      setTerms(mockTerms);
      setTotal(mockTerms.length);
    } catch (error) {
      message.error(tp('glossary.terms.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // TODO: Replace with actual API call
      const mockCategories = ['Metrics', 'Marketing', 'Product', 'Sales', 'Engineering'];
      setCategories(mockCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // TODO: Replace with actual API call
      setStats({
        totalTerms: 156,
        categories: 12,
        recentlyAdded: 23,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleAdd = () => {
    setEditingTerm(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (term: GlossaryTerm) => {
    setEditingTerm(term);
    form.setFieldsValue(term);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // TODO: Replace with actual API call
      // await glossaryApi.deleteTerm(id);
      message.success(tp('glossary.terms.deleteSuccess'));
      fetchTerms();
      fetchStats();
    } catch (error) {
      message.error(tp('glossary.terms.deleteFailed'));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // TODO: Replace with actual API call
      // if (editingTerm) {
      //   await glossaryApi.updateTerm(editingTerm.id, values);
      // } else {
      //   await glossaryApi.createTerm(values);
      // }
      message.success(editingTerm ? tp('glossary.terms.updateSuccess') : tp('glossary.terms.createSuccess'));
      setModalVisible(false);
      fetchTerms();
      fetchStats();
    } catch (error) {
      message.error(editingTerm ? tp('glossary.terms.updateFailed') : tp('glossary.terms.createFailed'));
    }
  };

  const handleImport = () => {
    Modal.info({
      title: tp('glossary.import.title'),
      content: (
        <div>
          <p>{tp('glossary.import.description')}</p>
          <Alert
            message={tp('glossary.import.format')}
            description="CSV format: term, definition, mapping, category, example"
            type="info"
            showIcon
          />
        </div>
      ),
    });
  };

  const handleExport = () => {
    message.info(tp('glossary.export.success'));
  };

  const columns = [
    {
      title: tp('glossary.terms.colTerm'),
      dataIndex: 'term',
      key: 'term',
      render: (text: string) => (
        <Space>
          <TranslationOutlined style={{ color: '#6366F1' }} />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: tp('glossary.terms.colDefinition'),
      dataIndex: 'definition',
      key: 'definition',
      ellipsis: true,
    },
    {
      title: tp('glossary.terms.colMapping'),
      dataIndex: 'mapping',
      key: 'mapping',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: tp('glossary.terms.colCategory'),
      dataIndex: 'category',
      key: 'category',
      filters: categories.map(cat => ({ text: cat, value: cat })),
      render: (category: string) => <Tag>{category}</Tag>,
    },
    {
      title: tp('glossary.terms.colExample'),
      dataIndex: 'example',
      key: 'example',
      ellipsis: true,
    },
    {
      title: tp('glossary.terms.colCreated'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: tp('glossary.terms.colActions'),
      key: 'actions',
      render: (_: any, record: GlossaryTerm) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {tp('common.edit')}
          </Button>
          <Popconfirm
            title={tp('glossary.terms.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
            okText={tp('common.confirm')}
            cancelText={tp('common.cancel')}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
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
            <FileTextOutlined />
            {tp('glossary.title')}
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchTerms}>
              {tp('common.refresh')}
            </Button>
            <Button icon={<ImportOutlined />} onClick={handleImport}>
              {tp('glossary.import.button')}
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              {tp('glossary.export.button')}
            </Button>
            <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>
              {tp('glossary.terms.addButton')}
            </Button>
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Statistic
              title={tp('glossary.stats.totalTerms')}
              value={stats.totalTerms}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#6366F1' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title={tp('glossary.stats.categories')}
              value={stats.categories}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#10B981' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title={tp('glossary.stats.recentlyAdded')}
              value={stats.recentlyAdded}
              prefix={<TranslationOutlined />}
              valueStyle={{ color: '#F59E0B' }}
            />
          </Col>
        </Row>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'terms',
              label: tp('glossary.tabs.terms'),
              children: (
                <>
                  <Space style={{ marginBottom: 16 }}>
                    <Search
                      placeholder={tp('glossary.terms.searchPlaceholder')}
                      allowClear
                      enterButton={<SearchOutlined />}
                      size="large"
                      onSearch={setSearchQuery}
                      style={{ width: 300 }}
                    />
                    <Select
                      placeholder={tp('glossary.terms.filterCategory')}
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
                    dataSource={terms}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      current: page,
                      pageSize: pageSize,
                      total: total,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total) => tp('glossary.terms.total', { count: total }),
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
              key: 'categories',
              label: tp('glossary.tabs.categories'),
              children: (
                <Row gutter={[16, 16]}>
                  {categories.map(category => (
                    <Col span={6} key={category}>
                      <Card
                        size="small"
                        title={category}
                        hoverable
                        onClick={() => setSelectedCategory(category)}
                      >
                        <Statistic
                          value={terms.filter(t => t.category === category).length}
                          suffix={tp('glossary.terms.term')}
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              ),
            },
          ]}
        />
      </Card>

      {/* Add/Edit Term Modal */}
      <Modal
        title={editingTerm ? tp('glossary.terms.editModalTitle') : tp('glossary.terms.addModalTitle')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="term"
                label={tp('glossary.terms.termLabel')}
                rules={[{ required: true, message: tp('glossary.terms.termRequired') }]}
              >
                <Input placeholder={tp('glossary.terms.termPlaceholder')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label={tp('glossary.terms.categoryLabel')}
                rules={[{ required: true, message: tp('glossary.terms.categoryRequired') }]}
              >
                <Select
                  placeholder={tp('glossary.terms.categoryPlaceholder')}
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
            name="definition"
            label={tp('glossary.terms.definitionLabel')}
            rules={[{ required: true, message: tp('glossary.terms.definitionRequired') }]}
          >
            <TextArea rows={2} placeholder={tp('glossary.terms.definitionPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="mapping"
            label={tp('glossary.terms.mappingLabel')}
            rules={[{ required: true, message: tp('glossary.terms.mappingRequired') }]}
          >
            <Input placeholder={tp('glossary.terms.mappingPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="example"
            label={tp('glossary.terms.exampleLabel')}
          >
            <TextArea rows={2} placeholder={tp('glossary.terms.examplePlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Glossary;
