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
  Divider,
  Tabs,
  Descriptions,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ImportOutlined,
  ExportOutlined,
  FolderOutlined,
  FileOutlined,
  InfoCircleOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { KnowledgeDocument, SearchResult } from '../types';
import { knowledgeApi } from '../services/api';
import { useTranslation } from '../contexts/LanguageContext';
import { createTranslateProxy } from '../utils/i18n';

const { TextArea } = Input;
const { Search } = Input;

const Knowledge: React.FC = () => {
  const { t } = useTranslation();
  const tp = createTranslateProxy(t);
  const [activeTab, setActiveTab] = useState('files');

  // 文件管理状态
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KnowledgeDocument | null>(null);
  const [form] = Form.useForm();

  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQueryText, setSearchQueryText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // 目录映射状态
  const [mappings, setMappings] = useState<any[]>([]);
  const [mappingModalVisible, setMappingModalVisible] = useState(false);
  const [mappingForm] = Form.useForm();

  useEffect(() => {
    if (activeTab === 'files') {
      fetchDocuments();
      fetchCategories();
    } else if (activeTab === 'mappings') {
      fetchMappings();
    }
  }, [activeTab, page, pageSize, searchQuery, selectedCategory]);

  // ==================== 文件管理 ====================
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await knowledgeApi.getDocuments({
        skip: (page - 1) * pageSize,
        limit: pageSize,
        category: selectedCategory,
        search: searchQuery || undefined,
      });
      setDocuments(response.documents || []);
      setTotal(response.total || 0);
    } catch (error) {
      message.error(tp('knowledge.files.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await knowledgeApi.getCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleAdd = () => {
    setEditingDoc(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: KnowledgeDocument) => {
    setEditingDoc(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await knowledgeApi.deleteDocument(id);
      message.success(tp('knowledge.files.deleteSuccess'));
      fetchDocuments();
    } catch (error) {
      message.error(tp('knowledge.files.deleteFailed'));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingDoc) {
        await knowledgeApi.updateDocument(editingDoc.id, values);
        message.success(tp('knowledge.files.updateSuccess'));
      } else {
        await knowledgeApi.createDocument(values);
        message.success(tp('knowledge.files.createSuccess'));
      }

      setModalVisible(false);
      form.resetFields();
      fetchDocuments();
      fetchCategories();
    } catch (error) {
      message.error(editingDoc ? tp('knowledge.files.updateFailed') : tp('knowledge.files.createFailed'));
    }
  };

  const handleSemanticSearch = async () => {
    if (!searchQueryText.trim()) {
      message.warning(tp('knowledge.files.searchWarning'));
      return;
    }

    try {
      setSearchLoading(true);
      const response = await knowledgeApi.semanticSearch(searchQueryText, 5, selectedCategory);
      setSearchResults(response.results || []);
    } catch (error) {
      message.error(tp('knowledge.files.searchFailed'));
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRebuildVectors = async () => {
    try {
      setLoading(true);
      const response = await knowledgeApi.rebuildVectors();
      message.success(tp('knowledge.files.rebuildSuccess', {
        vectorized: response.vectorized,
        total: response.total,
      }));
      fetchDocuments();
    } catch (error) {
      message.error(tp('knowledge.files.rebuildFailed') || '重建失败');
    } finally {
      setLoading(false);
    }
  };

  const documentColumns = [
    {
      title: tp('knowledge.files.colTitle'),
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: tp('knowledge.files.colCategory'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: tp('knowledge.files.colTags'),
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string[]) => (
        <>
          {tags?.map((tag) => (
            <Tag key={tag} color="green">
              {tag}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: tp('knowledge.files.colVectorized'),
      dataIndex: 'vectorized',
      key: 'vectorized',
      width: 100,
      render: (vectorized: boolean) =>
        vectorized ? <Tag color="success">{tp('knowledge.files.indexed')}</Tag> : <Tag color="warning">{tp('knowledge.files.notIndexed')}</Tag>,
    },
    {
      title: tp('knowledge.files.colUpdateTime'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: tp('common.actions'),
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: KnowledgeDocument) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {tp('common.edit')}
          </Button>
          <Popconfirm
            title={tp('knowledge.files.deleteConfirm')}
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

  // ==================== 目录映射 ====================
  const fetchMappings = async () => {
    try {
      const response = await knowledgeApi.getMappings();
      setMappings(response.mappings || []);
    } catch (error) {
      message.error(tp('knowledge.mappings.fetchFailed'));
    }
  };

  const handleAddMapping = () => {
    mappingForm.resetFields();
    setMappingModalVisible(true);
  };

  const handleDeleteMapping = async (id: string) => {
    try {
      await knowledgeApi.deleteMapping(id);
      message.success(tp('knowledge.mappings.deleteSuccess'));
      fetchMappings();
    } catch (error) {
      message.error(tp('knowledge.mappings.deleteFailed'));
    }
  };

  const handleExecuteMapping = (id: string) => {
    message.success(tp('knowledge.mappings.executeSuccess', { id }));
  };

  const handleViewMappingDetail = (record: any) => {
    Modal.info({
      title: tp('knowledge.mappings.detailTitle'),
      width: 600,
      content: (
        <div>
          <p><strong>{tp('knowledge.mappings.taskId')}：</strong>{record.id}</p>
          <p><strong>{tp('knowledge.mappings.directoryName')}：</strong>{record.directory_name}</p>
          <p><strong>{tp('knowledge.mappings.directoryPath')}：</strong>{record.directory_path}</p>
          <p><strong>{tp('knowledge.mappings.fileSystem')}：</strong>{record.file_system}</p>
          <p><strong>{tp('knowledge.mappings.lastImportTime')}：</strong>{record.last_import_time}</p>
          <p><strong>{tp('knowledge.mappings.operator')}：</strong>{record.operator}</p>
        </div>
      ),
    });
  };

  const mappingColumns = [
    {
      title: tp('knowledge.mappings.taskId'),
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => <Tag color="blue">{id}</Tag>,
    },
    {
      title: tp('knowledge.mappings.directoryName'),
      dataIndex: 'directory_name',
      key: 'directory_name',
      width: 150,
    },
    {
      title: tp('knowledge.mappings.directoryPath'),
      dataIndex: 'directory_path',
      key: 'directory_path',
      width: 200,
      ellipsis: true,
    },
    {
      title: tp('knowledge.mappings.fileSystem'),
      dataIndex: 'file_system',
      key: 'file_system',
      width: 100,
      render: (fs: string) => {
        const colors: Record<string, string> = {
          'NFS': 'blue',
          'S3': 'green',
          'LOCAL': 'orange',
        };
        return <Tag color={colors[fs] || 'default'}>{fs}</Tag>;
      },
    },
    {
      title: tp('knowledge.mappings.lastImportTime'),
      dataIndex: 'last_import_time',
      key: 'last_import_time',
      width: 180,
    },
    {
      title: tp('knowledge.mappings.operator'),
      dataIndex: 'operator',
      key: 'operator',
      width: 120,
      render: (operator: string) => (
        <Space>
          <span>{operator}</span>
        </Space>
      ),
    },
    {
      title: tp('knowledge.mappings.actions'),
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<SearchOutlined />}
            onClick={() => handleViewMappingDetail(record)}
          >
            {tp('knowledge.mappings.view')}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleExecuteMapping(record.id)}
          >
            {tp('knowledge.mappings.execute')}
          </Button>
          <Popconfirm
            title={tp('knowledge.mappings.deleteConfirm')}
            onConfirm={() => handleDeleteMapping(record.id)}
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

  // ==================== 渲染 ====================
  const tabItems = [
    {
      key: 'intro',
      label: (
        <span>
          <InfoCircleOutlined />
          {tp('knowledge.tabs.intro')}
        </span>
      ),
      children: (
        <Card>
          <Descriptions title={tp('knowledge.intro.info')} bordered column={2}>
            <Descriptions.Item label={tp('knowledge.intro.name')}>{tp('knowledge.intro.nameValue')}</Descriptions.Item>
            <Descriptions.Item label={tp('knowledge.intro.createTime')}>2026-03-01</Descriptions.Item>
            <Descriptions.Item label={tp('knowledge.intro.totalDocs')}>{total}</Descriptions.Item>
            <Descriptions.Item label={tp('knowledge.intro.indexedDocs')}>{documents.filter(d => d.vectorized).length}</Descriptions.Item>
            <Descriptions.Item label={tp('knowledge.intro.categoryCount')}>{categories.length}</Descriptions.Item>
            <Descriptions.Item label={tp('knowledge.intro.vectorDimension')}>10</Descriptions.Item>
            <Descriptions.Item label={tp('knowledge.intro.storagePath')}>/data/knowledge</Descriptions.Item>
            <Descriptions.Item label={tp('knowledge.intro.indexStatus')}>
              <Tag color="success">{tp('knowledge.intro.indexStatusNormal')}</Tag>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Alert
            message={tp('knowledge.intro.description')}
            description={tp('knowledge.intro.descriptionText')}
            type="info"
            showIcon
          />

          <Divider />

          <Row gutter={16}>
            <Col span={8}>
              <Card>
                <Statistic
                  title={tp('knowledge.intro.statsTotal')}
                  value={total}
                  prefix={<FileOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title={tp('knowledge.intro.statsIndexed')}
                  value={documents.filter(d => d.vectorized).length}
                  suffix={`/ ${total}`}
                  prefix={<SearchOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title={tp('knowledge.intro.statsCategories')}
                  value={categories.length}
                  prefix={<FolderOutlined />}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      ),
    },
    {
      key: 'mappings',
      label: (
        <span>
          <LinkOutlined />
          {tp('knowledge.tabs.mappings')}
        </span>
      ),
      children: (
        <Card
          title={tp('knowledge.mappings.title')}
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMapping}>
              {tp('knowledge.mappings.addButton')}
            </Button>
          }
        >
          <Alert
            message={tp('knowledge.mappings.description')}
            description={tp('knowledge.mappings.descriptionText')}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Table
            columns={mappingColumns}
            dataSource={mappings}
            rowKey="id"
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'files',
      label: (
        <span>
          <FileOutlined />
          {tp('knowledge.tabs.files')}
        </span>
      ),
      children: (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title={tp('knowledge.files.statsTotal')} value={total} />
              </Col>
              <Col span={6}>
                <Statistic
                  title={tp('knowledge.files.statsIndexed')}
                  value={documents.filter((d) => d.vectorized).length}
                  suffix={`/ ${total}`}
                />
              </Col>
              <Col span={6}>
                <Statistic title={tp('knowledge.files.statsCategories')} value={categories.length} />
              </Col>
              <Col span={6}>
                <Statistic
                  title={tp('knowledge.files.statsCurrentPage')}
                  value={page}
                  suffix={`/ ${Math.ceil(total / pageSize) || 1}`}
                />
              </Col>
            </Row>
          </Card>

          <Card
            title={tp('knowledge.files.title')}
            extra={
              <Space>
                <Button icon={<ReloadOutlined />} onClick={fetchDocuments}>
                  {tp('common.refresh')}
                </Button>
                <Button icon={<SearchOutlined />} onClick={() => setSearchModalVisible(true)}>
                  {tp('knowledge.files.semanticSearch')}
                </Button>
                <Button icon={<ImportOutlined />}>{tp('common.import')}</Button>
                <Button icon={<ExportOutlined />}>{tp('common.export')}</Button>
                <Popconfirm
                  title={tp('knowledge.files.rebuildConfirm')}
                  onConfirm={handleRebuildVectors}
                  okText={tp('common.confirm')}
                  cancelText={tp('common.cancel')}
                >
                  <Button icon={<ReloadOutlined />}>{tp('knowledge.files.rebuildIndex')}</Button>
                </Popconfirm>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                  {tp('knowledge.files.addButton')}
                </Button>
              </Space>
            }
          >
            <Space style={{ marginBottom: 16 }} size="middle">
              <Search
                placeholder={tp('knowledge.files.searchPlaceholder')}
                allowClear
                style={{ width: 300 }}
                onSearch={setSearchQuery}
                enterButton
              />
              <Select
                placeholder={tp('knowledge.files.categoryPlaceholder')}
                allowClear
                style={{ width: 150 }}
                value={selectedCategory}
                onChange={setSelectedCategory}
              >
                {categories.map((cat) => (
                  <Select.Option key={cat} value={cat}>
                    {cat}
                  </Select.Option>
                ))}
              </Select>
            </Space>

            <Table
              columns={documentColumns}
              dataSource={documents}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200 }}
              pagination={{
                current: page,
                pageSize: pageSize,
                total: total,
                showSizeChanger: true,
                showTotal: (total) => tp('common.pagination.total', { total }),
                onChange: (page, pageSize) => {
                  setPage(page);
                  setPageSize(pageSize);
                },
              }}
            />
          </Card>
        </>
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

      {/* 文档编辑弹窗 */}
      <Modal
        title={editingDoc ? tp('knowledge.files.editModalTitle') : tp('knowledge.files.addModalTitle')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={800}
        okText={tp('common.confirm')}
        cancelText={tp('common.cancel')}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={tp('knowledge.files.titleLabel')}
            name="title"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('knowledge.files.titleLabel') }) }]}
          >
            <Input placeholder={tp('knowledge.files.titlePlaceholder')} />
          </Form.Item>

          <Form.Item
            label={tp('knowledge.files.categoryLabel')}
            name="category"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('knowledge.files.categoryLabel') }) }]}
            extra={tp('knowledge.files.categoryHelp')}
          >
            <AutoComplete
              options={categories.map((cat) => ({ label: cat, value: cat }))}
              placeholder={tp('knowledge.files.categoryPlaceholder')}
              filterOption={(inputValue, option) =>
                option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />
          </Form.Item>

          <Form.Item label={tp('knowledge.files.tagsLabel')} name="tags">
            <Select mode="tags" placeholder={tp('knowledge.files.tagsPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={tp('knowledge.files.contentLabel')}
            name="content"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('knowledge.files.contentLabel') }) }]}
          >
            <TextArea rows={10} placeholder={tp('knowledge.files.contentPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 语义搜索弹窗 */}
      <Modal
        title={tp('knowledge.files.searchModalTitle')}
        open={searchModalVisible}
        onCancel={() => setSearchModalVisible(false)}
        footer={null}
        width={800}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Search
            placeholder={tp('knowledge.files.searchModalPlaceholder')}
            allowClear
            enterButton={tp('common.search')}
            size="large"
            value={searchQueryText}
            onChange={(e) => setSearchQueryText(e.target.value)}
            onSearch={handleSemanticSearch}
            loading={searchLoading}
          />

          {searchResults.length > 0 && (
            <div>
              <Divider>{tp('knowledge.files.searchResults')}</Divider>
              {searchResults.map((result) => (
                <Card
                  key={result.id}
                  size="small"
                  style={{ marginBottom: 8 }}
                  title={
                    <Space>
                      <span>{result.title}</span>
                      <Tag color="blue">{tp('knowledge.files.similarity')}: {(result.similarity_score * 100).toFixed(1)}%</Tag>
                    </Space>
                  }
                >
                  <p>{result.content.substring(0, 200)}...</p>
                </Card>
              ))}
            </div>
          )}
        </Space>
      </Modal>

      {/* 目录映射弹窗 */}
      <Modal
        title={tp('knowledge.mappings.modalTitle')}
        open={mappingModalVisible}
        onOk={async () => {
          try {
            const values = await mappingForm.validateFields();
            await knowledgeApi.createMapping(values);
            message.success(tp('knowledge.mappings.addSuccess'));
            setMappingModalVisible(false);
            mappingForm.resetFields();
            fetchMappings();
          } catch (error) {
            message.error(tp('knowledge.mappings.addFailed'));
          }
        }}
        onCancel={() => {
          setMappingModalVisible(false);
          mappingForm.resetFields();
        }}
        okText={tp('common.confirm')}
        cancelText={tp('common.cancel')}
        width={600}
      >
        <Form form={mappingForm} layout="vertical">
          <Form.Item
            label={tp('knowledge.mappings.directoryNameLabel')}
            name="directoryName"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('knowledge.mappings.directoryNameLabel') }) }]}
          >
            <Input placeholder={tp('knowledge.mappings.directoryNamePlaceholder')} />
          </Form.Item>

          <Form.Item
            label={tp('knowledge.mappings.directoryPathLabel')}
            name="directoryPath"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('knowledge.mappings.directoryPathLabel') }) }]}
          >
            <Input placeholder={tp('knowledge.mappings.directoryPathPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={tp('knowledge.mappings.fileSystemLabel')}
            name="fileSystem"
            rules={[{ required: true, message: tp('common.validation.requiredSelect', { field: tp('knowledge.mappings.fileSystemLabel') }) }]}
            initialValue="NFS"
          >
            <Select placeholder={tp('knowledge.mappings.fileSystemPlaceholder')}>
              <Select.Option value="NFS">{tp('knowledge.mappings.fileSystemNFS')}</Select.Option>
              <Select.Option value="S3">{tp('knowledge.mappings.fileSystemS3')}</Select.Option>
              <Select.Option value="LOCAL">{tp('knowledge.mappings.fileSystemLOCAL')}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default Knowledge;
