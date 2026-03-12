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
  Upload,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ImportOutlined,
  ExportOutlined,
  FileOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import type { KnowledgeDocument, SearchResult } from '../types';
import { knowledgeApi } from '../services/api';
import { useTranslation } from '../contexts/LanguageContext';
import { createTranslateProxy } from '../utils/i18n';

const { TextArea } = Input;
const { Search } = Input;

const KnowledgeBase: React.FC = () => {
  const { t } = useTranslation();
  const tp = createTranslateProxy(t);
  const [activeTab, setActiveTab] = useState('documents');

  // 文档管理状态
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

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadFileList, setUploadFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments();
      fetchCategories();
    }
  }, [activeTab, page, pageSize, searchQuery, selectedCategory]);

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
      // Ensure response is an array
      const categoriesArray = Array.isArray(response) ? response : [];
      setCategories(categoriesArray);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  const handleAdd = () => {
    setEditingDoc(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (doc: KnowledgeDocument) => {
    setEditingDoc(doc);
    form.setFieldsValue(doc);
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
      fetchDocuments();
    } catch (error) {
      message.error(editingDoc ? tp('knowledge.files.updateFailed') : tp('knowledge.files.createFailed'));
    }
  };

  const handleUpload = () => {
    setUploadFileList([]);
    setUploadProgress(0);
    setUploadModalVisible(true);
  };

  const handleUploadSubmit = async () => {
    if (uploadFileList.length === 0) {
      message.warning('Please select files to upload');
      return;
    }

    setUploading(true);
    try {
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 200);

      // TODO: Implement actual upload API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      message.success('Files uploaded successfully');
      setUploadModalVisible(false);
      fetchDocuments();
    } catch (error) {
      message.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      title: tp('knowledge.files.colTitle'),
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => (
        <Space>
          <FileOutlined style={{ color: '#6366F1' }} />
          {text}
        </Space>
      ),
    },
    {
      title: tp('knowledge.files.colCategory'),
      dataIndex: 'category',
      key: 'category',
      filters: Array.isArray(categories) ? categories.map(cat => ({ text: cat, value: cat })) : [],
    },
    {
      title: tp('knowledge.files.colTags'),
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
      title: tp('knowledge.files.colVectorized'),
      dataIndex: 'vectorized',
      key: 'vectorized',
      render: (vectorized: boolean) => (
        <Tag color={vectorized ? 'success' : 'default'}>
          {vectorized ? tp('knowledge.files.yes') : tp('knowledge.files.no')}
        </Tag>
      ),
    },
    {
      title: tp('knowledge.files.colCreated'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: tp('knowledge.files.colActions'),
      key: 'actions',
      render: (_: any, record: KnowledgeDocument) => (
        <Space>
          <Button
            type="link"
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
        title={tp('knowledge.files.title')}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchDocuments}>
              {tp('common.refresh')}
            </Button>
            <Button icon={<ImportOutlined />} onClick={handleUpload}>
              {tp('knowledge.files.import')}
            </Button>
            <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>
              {tp('knowledge.files.addButton')}
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'documents',
              label: tp('knowledge.files.tabDocuments'),
              children: (
                <>
                  <Space style={{ marginBottom: 16 }}>
                    <Search
                      placeholder={tp('knowledge.files.searchPlaceholder')}
                      allowClear
                      enterButton={<SearchOutlined />}
                      size="large"
                      onSearch={setSearchQuery}
                      style={{ width: 300 }}
                    />
                    <Select
                      placeholder={tp('knowledge.files.filterCategory')}
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
                    dataSource={documents}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      current: page,
                      pageSize: pageSize,
                      total: total,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total) => tp('knowledge.files.total', { count: total }),
                      onChange: (page, pageSize) => {
                        setPage(page);
                        setPageSize(pageSize || 10);
                      },
                    }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>

      {/* Add/Edit Document Modal */}
      <Modal
        title={editingDoc ? tp('knowledge.files.editModalTitle') : tp('knowledge.files.addModalTitle')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label={tp('knowledge.files.titleLabel')}
            rules={[{ required: true, message: tp('knowledge.files.titleRequired') }]}
          >
            <Input placeholder={tp('knowledge.files.titlePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="content"
            label={tp('knowledge.files.contentLabel')}
            rules={[{ required: true, message: tp('knowledge.files.contentRequired') }]}
          >
            <TextArea rows={6} placeholder={tp('knowledge.files.contentPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="category"
            label={tp('knowledge.files.categoryLabel')}
            rules={[{ required: true, message: tp('knowledge.files.categoryRequired') }]}
          >
            <AutoComplete
              options={categories.map(cat => ({ value: cat }))}
              placeholder={tp('knowledge.files.categoryPlaceholder')}
              filterOption={(inputValue, option) =>
                option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />
          </Form.Item>

          <Form.Item
            name="tags"
            label={tp('knowledge.files.tagsLabel')}
          >
            <Select
              mode="tags"
              placeholder={tp('knowledge.files.tagsPlaceholder')}
              tokenSeparators={[',']}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Upload Modal */}
      <Modal
        title={tp('knowledge.files.uploadModalTitle')}
        open={uploadModalVisible}
        onOk={handleUploadSubmit}
        onCancel={() => setUploadModalVisible(false)}
        confirmLoading={uploading}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Upload.Dragger
            fileList={uploadFileList}
            onChange={({ fileList }) => setUploadFileList(fileList)}
            beforeUpload={() => false}
            multiple
          >
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined />
            </p>
            <p className="ant-upload-text">{tp('knowledge.files.uploadText')}</p>
            <p className="ant-upload-hint">{tp('knowledge.files.uploadHint')}</p>
          </Upload.Dragger>

          {uploading && (
            <Progress percent={uploadProgress} status="active" />
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default KnowledgeBase;
