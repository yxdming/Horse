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
  TeamOutlined,
  InfoCircleOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { KnowledgeDocument, SearchResult } from '../types';
import { knowledgeApi } from '../services/api';

const { TextArea } = Input;
const { Search } = Input;

const Knowledge: React.FC = () => {
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

  // 用户管理状态
  const [kbUsers, setKbUsers] = useState<any[]>([]);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [userForm] = Form.useForm();

  useEffect(() => {
    if (activeTab === 'files') {
      fetchDocuments();
      fetchCategories();
    } else if (activeTab === 'mappings') {
      fetchMappings();
    } else if (activeTab === 'users') {
      fetchKbUsers();
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
      message.error('获取文档列表失败');
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
      message.success('删除成功');
      fetchDocuments();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingDoc) {
        await knowledgeApi.updateDocument(editingDoc.id, values);
        message.success('更新成功');
      } else {
        await knowledgeApi.createDocument(values);
        message.success('创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      fetchDocuments();
      fetchCategories();
    } catch (error) {
      message.error(editingDoc ? '更新失败' : '创建失败');
    }
  };

  const handleSemanticSearch = async () => {
    if (!searchQueryText.trim()) {
      message.warning('请输入搜索内容');
      return;
    }

    try {
      setSearchLoading(true);
      const response = await knowledgeApi.semanticSearch(searchQueryText, 5, selectedCategory);
      setSearchResults(response.results || []);
    } catch (error) {
      message.error('搜索失败');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRebuildVectors = async () => {
    try {
      setLoading(true);
      const response = await knowledgeApi.rebuildVectors();
      message.success(`重建完成: ${response.vectorized}/${response.total} 个文档`);
      fetchDocuments();
    } catch (error) {
      message.error('重建失败');
    } finally {
      setLoading(false);
    }
  };

  const documentColumns = [
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
      title: '标签',
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
      title: '向量化',
      dataIndex: 'vectorized',
      key: 'vectorized',
      width: 100,
      render: (vectorized: boolean) =>
        vectorized ? <Tag color="success">已索引</Tag> : <Tag color="warning">未索引</Tag>,
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
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
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个文档吗？"
            onConfirm={() => handleDelete(record.id)}
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

  // ==================== 目录映射 ====================
  const fetchMappings = () => {
    // 模拟数据
    setMappings([
      {
        id: 'TASK-001',
        directoryName: '技术文档目录',
        directoryPath: '/data/documents/tech',
        fileSystem: 'NFS',
        lastImportTime: '2026-03-06 10:30:00',
        operator: 'admin'
      },
      {
        id: 'TASK-002',
        directoryName: '用户手册目录',
        directoryPath: '/data/documents/manuals',
        fileSystem: 'NFS',
        lastImportTime: '2026-03-06 09:15:00',
        operator: 'admin'
      },
      {
        id: 'TASK-003',
        directoryName: '政策文件目录',
        directoryPath: '/data/documents/policies',
        fileSystem: 'S3',
        lastImportTime: '2026-03-05 16:45:00',
        operator: 'user1'
      },
      {
        id: 'TASK-004',
        directoryName: '知识库归档',
        directoryPath: '/data/archive',
        fileSystem: 'LOCAL',
        lastImportTime: '2026-03-04 14:20:00',
        operator: 'user2'
      },
      {
        id: 'TASK-005',
        directoryName: '临时文档目录',
        directoryPath: '/data/temp',
        fileSystem: 'NFS',
        lastImportTime: '2026-03-06 11:00:00',
        operator: 'admin'
      },
    ]);
  };

  const handleAddMapping = () => {
    mappingForm.resetFields();
    setMappingModalVisible(true);
  };

  const handleDeleteMapping = (id: string) => {
    setMappings(mappings.filter(m => m.id !== id));
    message.success('删除成功');
  };

  const handleExecuteMapping = (id: string) => {
    message.success(`任务 ${id} 已开始执行`);
  };

  const handleViewMappingDetail = (record: any) => {
    Modal.info({
      title: '目录映射详情',
      width: 600,
      content: (
        <div>
          <p><strong>任务ID：</strong>{record.id}</p>
          <p><strong>目录名称：</strong>{record.directoryName}</p>
          <p><strong>目录路径：</strong>{record.directoryPath}</p>
          <p><strong>文件系统：</strong>{record.fileSystem}</p>
          <p><strong>最近入库时间：</strong>{record.lastImportTime}</p>
          <p><strong>操作人：</strong>{record.operator}</p>
        </div>
      ),
    });
  };

  const mappingColumns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => <Tag color="blue">{id}</Tag>,
    },
    {
      title: '目录名称',
      dataIndex: 'directoryName',
      key: 'directoryName',
      width: 150,
    },
    {
      title: '目录路径',
      dataIndex: 'directoryPath',
      key: 'directoryPath',
      width: 200,
      ellipsis: true,
    },
    {
      title: '文件系统',
      dataIndex: 'fileSystem',
      key: 'fileSystem',
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
      title: '最近一次目录入库时间',
      dataIndex: 'lastImportTime',
      key: 'lastImportTime',
      width: 180,
    },
    {
      title: '任务操作人',
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
      title: '操作',
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
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleExecuteMapping(record.id)}
          >
            执行
          </Button>
          <Popconfirm
            title="确定要删除这个映射任务吗？"
            onConfirm={() => handleDeleteMapping(record.id)}
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

  // ==================== 用户管理 ====================
  const fetchKbUsers = () => {
    // 模拟数据
    setKbUsers([
      { id: '1', username: 'admin', role: '管理员', permissions: ['全部'], lastAccess: '2026-03-06 12:00' },
      { id: '2', username: 'user1', role: '编辑者', permissions: ['编辑', '查看'], lastAccess: '2026-03-06 10:30' },
      { id: '3', username: 'user2', role: '查看者', permissions: ['查看'], lastAccess: '2026-03-05 16:20' },
    ]);
  };

  const handleAddKbUser = () => {
    userForm.resetFields();
    setUserModalVisible(true);
  };

  const handleDeleteKbUser = (id: string) => {
    setKbUsers(kbUsers.filter(u => u.id !== id));
    message.success('删除成功');
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
      title: '最后访问',
      dataIndex: 'lastAccess',
      key: 'lastAccess',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Popconfirm
          title="确定要移除这个用户吗？"
          onConfirm={() => handleDeleteKbUser(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            移除
          </Button>
        </Popconfirm>
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
          知识库简介
        </span>
      ),
      children: (
        <Card>
          <Descriptions title="知识库信息" bordered column={2}>
            <Descriptions.Item label="知识库名称">AIDP 知识库</Descriptions.Item>
            <Descriptions.Item label="创建时间">2026-03-01</Descriptions.Item>
            <Descriptions.Item label="文档总数">{total}</Descriptions.Item>
            <Descriptions.Item label="已索引文档">{documents.filter(d => d.vectorized).length}</Descriptions.Item>
            <Descriptions.Item label="分类数量">{categories.length}</Descriptions.Item>
            <Descriptions.Item label="向量维度">10</Descriptions.Item>
            <Descriptions.Item label="存储路径">/data/knowledge</Descriptions.Item>
            <Descriptions.Item label="索引状态">
              <Tag color="success">正常</Tag>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Alert
            message="知识库说明"
            description="本知识库采用向量检索技术，支持语义搜索。文档被向量化后，可以通过自然语言进行智能检索，系统会返回语义最相关的文档内容。"
            type="info"
            showIcon
          />

          <Divider />

          <Row gutter={16}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="总文档数"
                  value={total}
                  prefix={<FileOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="已索引"
                  value={documents.filter(d => d.vectorized).length}
                  suffix={`/ ${total}`}
                  prefix={<SearchOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="分类数"
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
          目录映射
        </span>
      ),
      children: (
        <Card
          title="目录映射配置"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMapping}>
              新增映射
            </Button>
          }
        >
          <Alert
            message="目录映射说明"
            description="配置需要定期扫描和导入的目录任务。支持 NFS、S3 和本地文件系统。系统会记录每次入库的时间和操作人信息，可通过执行按钮手动触发入库任务。"
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
          文件管理
        </span>
      ),
      children: (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="总文档数" value={total} />
              </Col>
              <Col span={6}>
                <Statistic
                  title="已索引"
                  value={documents.filter((d) => d.vectorized).length}
                  suffix={`/ ${total}`}
                />
              </Col>
              <Col span={6}>
                <Statistic title="分类数" value={categories.length} />
              </Col>
              <Col span={6}>
                <Statistic title="当前页" value={page} suffix={`/ ${Math.ceil(total / pageSize) || 1}`} />
              </Col>
            </Row>
          </Card>

          <Card
            title="文档列表"
            extra={
              <Space>
                <Button icon={<ReloadOutlined />} onClick={fetchDocuments}>
                  刷新
                </Button>
                <Button icon={<SearchOutlined />} onClick={() => setSearchModalVisible(true)}>
                  语义搜索
                </Button>
                <Button icon={<ImportOutlined />}>批量导入</Button>
                <Button icon={<ExportOutlined />}>批量导出</Button>
                <Popconfirm
                  title="确定要重建向量索引吗？这可能需要一些时间。"
                  onConfirm={handleRebuildVectors}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button icon={<ReloadOutlined />}>重建索引</Button>
                </Popconfirm>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                  新增文档
                </Button>
              </Space>
            }
          >
            <Space style={{ marginBottom: 16 }} size="middle">
              <Search
                placeholder="搜索文档标题、内容或标签"
                allowClear
                style={{ width: 300 }}
                onSearch={setSearchQuery}
                enterButton
              />
              <Select
                placeholder="选择分类"
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
                showTotal: (total) => `共 ${total} 条`,
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
    {
      key: 'users',
      label: (
        <span>
          <TeamOutlined />
          用户管理
        </span>
      ),
      children: (
        <Card
          title="知识库用户权限"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddKbUser}>
              添加用户
            </Button>
          }
        >
          <Alert
            message="权限说明"
            description="管理员拥有所有权限，编辑者可以编辑和查看文档，查看者只能浏览文档内容。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Table
            columns={userColumns}
            dataSource={kbUsers}
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

      {/* 文档编辑弹窗 */}
      <Modal
        title={editingDoc ? '编辑文档' : '新增文档'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={800}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入文档标题' }]}
          >
            <Input placeholder="请输入文档标题" />
          </Form.Item>

          <Form.Item
            label="分类"
            name="category"
            rules={[{ required: true, message: '请输入分类名称' }]}
            extra="可以从现有分类中选择，或输入新的分类名称"
          >
            <AutoComplete
              options={categories.map((cat) => ({ label: cat, value: cat }))}
              placeholder="输入或选择分类"
              filterOption={(inputValue, option) =>
                option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />
          </Form.Item>

          <Form.Item label="标签" name="tags">
            <Select mode="tags" placeholder="输入标签，按回车添加" />
          </Form.Item>

          <Form.Item
            label="内容"
            name="content"
            rules={[{ required: true, message: '请输入文档内容' }]}
          >
            <TextArea rows={10} placeholder="请输入文档内容" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 语义搜索弹窗 */}
      <Modal
        title="语义搜索"
        open={searchModalVisible}
        onCancel={() => setSearchModalVisible(false)}
        footer={null}
        width={800}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Search
            placeholder="输入搜索内容，系统将使用语义搜索找到相关文档"
            allowClear
            enterButton="搜索"
            size="large"
            value={searchQueryText}
            onChange={(e) => setSearchQueryText(e.target.value)}
            onSearch={handleSemanticSearch}
            loading={searchLoading}
          />

          {searchResults.length > 0 && (
            <div>
              <Divider>搜索结果</Divider>
              {searchResults.map((result) => (
                <Card
                  key={result.id}
                  size="small"
                  style={{ marginBottom: 8 }}
                  title={
                    <Space>
                      <span>{result.title}</span>
                      <Tag color="blue">相似度: {(result.similarity_score * 100).toFixed(1)}%</Tag>
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
        title="新增目录映射"
        open={mappingModalVisible}
        onOk={() => {
          mappingForm.validateFields().then((values) => {
            const taskId = `TASK-${String(mappings.length + 1).padStart(3, '0')}`;
            setMappings([
              ...mappings,
              {
                id: taskId,
                ...values,
                lastImportTime: new Date().toLocaleString('zh-CN'),
                operator: '当前用户'
              }
            ]);
            setMappingModalVisible(false);
            mappingForm.resetFields();
            message.success('添加成功');
          });
        }}
        onCancel={() => {
          setMappingModalVisible(false);
          mappingForm.resetFields();
        }}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={mappingForm} layout="vertical">
          <Form.Item
            label="目录名称"
            name="directoryName"
            rules={[{ required: true, message: '请输入目录名称' }]}
          >
            <Input placeholder="例如：技术文档目录" />
          </Form.Item>

          <Form.Item
            label="目录路径"
            name="directoryPath"
            rules={[{ required: true, message: '请输入目录路径' }]}
          >
            <Input placeholder="/data/documents/tech" />
          </Form.Item>

          <Form.Item
            label="文件系统"
            name="fileSystem"
            rules={[{ required: true, message: '请选择文件系统类型' }]}
            initialValue="NFS"
          >
            <Select placeholder="请选择文件系统">
              <Select.Option value="NFS">NFS</Select.Option>
              <Select.Option value="S3">S3</Select.Option>
              <Select.Option value="LOCAL">本地文件系统</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加用户弹窗 */}
      <Modal
        title="添加知识库用户"
        open={userModalVisible}
        onOk={() => {
          userForm.validateFields().then((values) => {
            setKbUsers([
              ...kbUsers,
              {
                id: Date.now().toString(),
                ...values,
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
              <Select.Option value="编辑">编辑</Select.Option>
              <Select.Option value="查看">查看</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default Knowledge;
