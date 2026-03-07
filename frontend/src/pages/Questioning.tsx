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
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Alert,
  Descriptions,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  BookOutlined,
  HistoryOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
// @ts-expect-error - Types are used for type checking
import type { DatabaseSource, GlossaryTerm, QuestionHistory } from '../types';
import { questioningApi } from '../services/api';

const { TextArea } = Input;
const { Search } = Input;

const QuestioningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('databases');

  // 数据库管理状态
  const [databases, setDatabases] = useState<any[]>([]);
  const [dbModalVisible, setDbModalVisible] = useState(false);
  const [editingDb, setEditingDb] = useState<any>(null);
  const [dbForm] = Form.useForm();

  // 行业黑话状态
  const [glossaries, setGlossaries] = useState<any[]>([]);
  const [glossaryModalVisible, setGlossaryModalVisible] = useState(false);
  const [glossaryForm] = Form.useForm();

  // 问数历史状态
  const [histories, setHistories] = useState<any[]>([]);

  // 问答测试状态
  const [question, setQuestion] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (activeTab === 'databases') {
      fetchDatabases();
    } else if (activeTab === 'glossaries') {
      fetchGlossaries();
    } else if (activeTab === 'history') {
      fetchHistories();
    }
  }, [activeTab]);

  // ==================== 数据库管理 ====================
  const fetchDatabases = async () => {
    try {
      const response = await questioningApi.getDatabases();
      setDatabases(response.databases || []);
    } catch (error) {
      message.error('获取数据库列表失败');
    }
  };

  const handleAddDb = () => {
    setEditingDb(null);
    dbForm.resetFields();
    setDbModalVisible(true);
  };

  const handleEditDb = (record: any) => {
    setEditingDb(record);
    dbForm.setFieldsValue(record);
    setDbModalVisible(true);
  };

  const handleDeleteDb = async (id: string) => {
    try {
      await questioningApi.deleteDatabase(id);
      message.success('删除成功');
      fetchDatabases();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmitDb = async () => {
    try {
      const values = await dbForm.validateFields();

      if (editingDb) {
        await questioningApi.updateDatabase(editingDb.id, values);
        message.success('更新成功');
      } else {
        await questioningApi.createDatabase(values);
        message.success('添加成功');
      }

      setDbModalVisible(false);
      dbForm.resetFields();
      fetchDatabases();
    } catch (error) {
      message.error(editingDb ? '更新失败' : '添加失败');
    }
  };

  const handleTestConnection = async (db_id: string) => {
    try {
      message.loading('正在测试连接...', 0);
      await questioningApi.testConnection(db_id);
      message.destroy();
      message.success('连接成功！');
      fetchDatabases();
    } catch (error) {
      message.destroy();
      message.error('连接失败');
    }
  };

  const databaseColumns = [
    {
      title: '数据库名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '主机',
      dataIndex: 'host',
      key: 'host',
    },
    {
      title: '端口',
      dataIndex: 'port',
      key: 'port',
    },
    {
      title: '数据库名',
      dataIndex: 'database',
      key: 'database',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'connected' ? 'success' : 'error'} icon={status === 'connected' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {status === 'connected' ? '已连接' : '未连接'}
        </Tag>
      ),
    },
    {
      title: '表数量',
      dataIndex: 'tableCount',
      key: 'tableCount',
    },
    {
      title: '最后同步',
      dataIndex: 'lastSync',
      key: 'lastSync',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleTestConnection(record.id)}
          >
            测试
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditDb(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个数据库连接吗？"
            onConfirm={() => handleDeleteDb(record.id)}
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

  // ==================== 行业黑话管理 ====================
  const fetchGlossaries = async () => {
    try {
      const response = await questioningApi.getGlossaries();
      setGlossaries(response.glossaries || []);
    } catch (error) {
      message.error('获取术语列表失败');
    }
  };

  const handleAddGlossary = () => {
    glossaryForm.resetFields();
    setGlossaryModalVisible(true);
  };

  const handleEditGlossary = (record: any) => {
    glossaryForm.setFieldsValue(record);
    setGlossaryModalVisible(true);
  };

  const handleDeleteGlossary = async (id: string) => {
    try {
      await questioningApi.deleteGlossary(id);
      message.success('删除成功');
      fetchGlossaries();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmitGlossary = async () => {
    try {
      const values = await glossaryForm.validateFields();
      await questioningApi.createGlossary(values);
      setGlossaryModalVisible(false);
      glossaryForm.resetFields();
      fetchGlossaries();
      message.success('添加成功');
    } catch (error) {
      message.error('添加失败');
    }
  };

  const glossaryColumns = [
    {
      title: '术语',
      dataIndex: 'term',
      key: 'term',
      render: (term: string) => <Tag color="purple" style={{ fontSize: 14 }}>{term}</Tag>,
    },
    {
      title: '定义',
      dataIndex: 'definition',
      key: 'definition',
    },
    {
      title: '映射规则',
      dataIndex: 'mapping',
      key: 'mapping',
      render: (mapping: string) => <Tag color="geekblue">{mapping}</Tag>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '示例问句',
      dataIndex: 'example',
      key: 'example',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditGlossary(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个术语吗？"
            onConfirm={() => handleDeleteGlossary(record.id)}
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

  // ==================== 问数历史 ====================
  const fetchHistories = async () => {
    try {
      const response = await questioningApi.getHistories(0, 10);
      setHistories(response.histories || []);
    } catch (error) {
      message.error('获取历史记录失败');
    }
  };

  const historyColumns = [
    {
      title: '问句',
      dataIndex: 'question',
      key: 'question',
      width: 250,
    },
    {
      title: '生成的SQL',
      dataIndex: 'sql',
      key: 'sql',
      width: 300,
      ellipsis: true,
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 150,
      ellipsis: true,
    },
    {
      title: '耗时(ms)',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'success' ? 'success' : 'error'} icon={status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {status === 'success' ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '数据库',
      dataIndex: 'database',
      key: 'database',
      width: 120,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
  ];

  // ==================== 问答测试 ====================
  const handleTestQuestion = async () => {
    if (!question.trim()) {
      message.warning('请输入问句');
      return;
    }

    try {
      setTesting(true);
      const response = await questioningApi.askQuestion({
        question: question,
        database_id: '1' // 默认使用第一个数据库
      });
      setTestResult(response);
    } catch (error) {
      message.error('生成SQL失败');
    } finally {
      setTesting(false);
    }
  };

  // ==================== 渲染 ====================
  const tabItems = [
    {
      key: 'databases',
      label: (
        <span>
          <DatabaseOutlined />
          数据库管理
        </span>
      ),
      children: (
        <Card
          title="数据源管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDb}>
              添加数据源
            </Button>
          }
        >
          <Alert
            message="数据源说明"
            description="配置和管理数据库连接，支持MySQL、PostgreSQL等主流数据库。系统会自动同步表结构信息用于自然语言转SQL。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Table
            columns={databaseColumns}
            dataSource={databases}
            rowKey="id"
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'glossaries',
      label: (
        <span>
          <BookOutlined />
          行业黑话
        </span>
      ),
      children: (
        <Card
          title="术语词典管理"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddGlossary}>
              添加术语
            </Button>
          }
        >
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Statistic title="术语总数" value={glossaries.length} prefix={<BookOutlined />} />
            </Col>
            <Col span={6}>
              <Statistic title="销售指标" value={glossaries.filter(g => g.category === '销售指标').length} />
            </Col>
            <Col span={6}>
              <Statistic title="用户指标" value={glossaries.filter(g => g.category === '用户指标').length} />
            </Col>
            <Col span={6}>
              <Statistic title="其他指标" value={glossaries.filter(g => g.category !== '销售指标' && g.category !== '用户指标').length} />
            </Col>
          </Row>
          <Alert
            message="行业黑话说明"
            description="维护业务术语词典，将行业黑话、业务术语映射到数据库字段和SQL表达式，提高问数理解的准确度。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Table
            columns={glossaryColumns}
            dataSource={glossaries}
            rowKey="id"
            pagination={false}
          />
        </Card>
      ),
    },
    {
      key: 'test',
      label: (
        <span>
          <PlayCircleOutlined />
          问答测试
        </span>
      ),
      children: (
        <Card title="自然语言问数测试">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card size="small">
              <Search
                placeholder="请输入问句，例如：本月销售额是多少、Top 10产品..."
                enterButton="生成SQL"
                size="large"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onSearch={handleTestQuestion}
                loading={testing}
              />
              <div style={{ marginTop: 12 }}>
                <Space>
                  <span>示例问句：</span>
                  <Tag
                    style={{ cursor: 'pointer' }}
                    onClick={() => setQuestion('本月销售额是多少')}
                  >
                    本月销售额是多少
                  </Tag>
                  <Tag
                    style={{ cursor: 'pointer' }}
                    onClick={() => setQuestion('Top 10销售产品')}
                  >
                    Top 10销售产品
                  </Tag>
                  <Tag
                    style={{ cursor: 'pointer' }}
                    onClick={() => setQuestion('最近7天用户增长趋势')}
                  >
                    最近7天用户增长趋势
                  </Tag>
                  <Tag
                    style={{ cursor: 'pointer' }}
                    onClick={() => setQuestion('各地区GMV排名')}
                  >
                    各地区GMV排名
                  </Tag>
                </Space>
              </div>
            </Card>

            {testResult && (
              <Card size="small" title="生成结果">
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="置信度">
                    <Progress percent={Math.round(testResult.confidence * 100)} status="active" />
                  </Descriptions.Item>
                  <Descriptions.Item label="识别术语">
                    {testResult.glossaries.map((g: string) => (
                      <Tag key={g} color="purple">{g}</Tag>
                    ))}
                  </Descriptions.Item>
                  <Descriptions.Item label="理解说明">
                    {testResult.explanation}
                  </Descriptions.Item>
                  <Descriptions.Item label="生成的SQL">
                    <pre style={{
                      background: '#f5f5f5',
                      padding: '12px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '300px'
                    }}>
                      {testResult.sql}
                    </pre>
                  </Descriptions.Item>
                </Descriptions>
                <div style={{ marginTop: 16 }}>
                  <Space>
                    <Button type="primary" icon={<PlayCircleOutlined />}>
                      执行查询
                    </Button>
                    <Button onClick={() => setTestResult(null)}>
                      清空结果
                    </Button>
                  </Space>
                </div>
              </Card>
            )}
          </Space>
        </Card>
      ),
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined />
          问数历史
        </span>
      ),
      children: (
        <Card title="问答历史记录">
          <Alert
            message="历史说明"
            description="查看用户的问数历史，包括问句、生成的SQL、执行结果等。可用于分析用户需求、优化术语词典。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Table
            columns={historyColumns}
            dataSource={histories}
            rowKey="id"
            pagination={{
              total: histories.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
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

      {/* 数据库编辑弹窗 */}
      <Modal
        title={editingDb ? '编辑数据源' : '添加数据源'}
        open={dbModalVisible}
        onOk={handleSubmitDb}
        onCancel={() => {
          setDbModalVisible(false);
          dbForm.resetFields();
        }}
        width={600}
        okText="确定"
        cancelText="取消"
      >
        <Form form={dbForm} layout="vertical">
          <Form.Item
            label="数据库名称"
            name="name"
            rules={[{ required: true, message: '请输入数据库名称' }]}
          >
            <Input placeholder="请输入数据库名称" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="数据库类型"
                name="type"
                initialValue="MySQL"
                rules={[{ required: true, message: '请选择数据库类型' }]}
              >
                <Select placeholder="请选择数据库类型">
                  <Select.Option value="MySQL">MySQL</Select.Option>
                  <Select.Option value="PostgreSQL">PostgreSQL</Select.Option>
                  <Select.Option value="Oracle">Oracle</Select.Option>
                  <Select.Option value="SQLServer">SQL Server</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="端口"
                name="port"
                initialValue={3306}
                rules={[{ required: true, message: '请输入端口号' }]}
              >
                <Input type="number" placeholder="端口号" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="主机地址"
            name="host"
            rules={[{ required: true, message: '请输入主机地址' }]}
          >
            <Input placeholder="例如：192.168.1.100" />
          </Form.Item>

          <Form.Item
            label="数据库名"
            name="database"
            rules={[{ required: true, message: '请输入数据库名' }]}
          >
            <Input placeholder="请输入数据库名" />
          </Form.Item>

          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 术语编辑弹窗 */}
      <Modal
        title="添加术语"
        open={glossaryModalVisible}
        onOk={handleSubmitGlossary}
        onCancel={() => {
          setGlossaryModalVisible(false);
          glossaryForm.resetFields();
        }}
        width={600}
        okText="确定"
        cancelText="取消"
      >
        <Form form={glossaryForm} layout="vertical">
          <Form.Item
            label="术语"
            name="term"
            rules={[{ required: true, message: '请输入术语' }]}
          >
            <Input placeholder="例如：GMV、DAU、转化率" />
          </Form.Item>

          <Form.Item
            label="定义"
            name="definition"
            rules={[{ required: true, message: '请输入定义' }]}
          >
            <Input placeholder="例如：成交总额、日活跃用户数" />
          </Form.Item>

          <Form.Item
            label="映射规则"
            name="mapping"
            rules={[{ required: true, message: '请输入SQL映射规则' }]}
          >
            <TextArea rows={3} placeholder="例如：SUM(order_amount)" />
          </Form.Item>

          <Form.Item
            label="分类"
            name="category"
            initialValue="销售指标"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              <Select.Option value="销售指标">销售指标</Select.Option>
              <Select.Option value="用户指标">用户指标</Select.Option>
              <Select.Option value="产品指标">产品指标</Select.Option>
              <Select.Option value="财务指标">财务指标</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="示例问句"
            name="example"
            rules={[{ required: true, message: '请输入示例问句' }]}
          >
            <Input placeholder="例如：本月GMV是多少" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuestioningPage;
