import React, { useEffect, useState, useMemo } from 'react';
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
import { useTranslation } from '../contexts/LanguageContext';
import { createTranslateProxy } from '../utils/i18n';
import { useApp } from '../hooks/useApp';

const { TextArea } = Input;
const { Search } = Input;

const QuestioningPage: React.FC = () => {
  const { t } = useTranslation();
  const tp = useMemo(() => createTranslateProxy(t), [t]);
  const { message } = useApp();
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
      message.error(tp('questioning.databases.fetchFailed'));
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
      message.success(tp('questioning.databases.deleteSuccess'));
      fetchDatabases();
    } catch (error) {
      message.error(tp('questioning.databases.deleteFailed'));
    }
  };

  const handleSubmitDb = async () => {
    try {
      const values = await dbForm.validateFields();

      if (editingDb) {
        await questioningApi.updateDatabase(editingDb.id, values);
        message.success(tp('questioning.databases.updateSuccess'));
      } else {
        await questioningApi.createDatabase(values);
        message.success(tp('questioning.databases.createSuccess'));
      }

      setDbModalVisible(false);
      dbForm.resetFields();
      fetchDatabases();
    } catch (error) {
      message.error(editingDb ? tp('questioning.databases.updateFailed') : tp('questioning.databases.createFailed'));
    }
  };

  const handleTestConnection = async (db_id: string) => {
    try {
      message.loading(tp('questioning.databases.testConnecting'), 0);
      await questioningApi.testConnection(db_id);
      message.destroy();
      message.success(tp('questioning.databases.testSuccess'));
      fetchDatabases();
    } catch (error) {
      message.destroy();
      message.error(tp('questioning.databases.testFailed'));
    }
  };

  const databaseColumns = [
    {
      title: tp('questioning.databases.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: tp('questioning.databases.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: tp('questioning.databases.host'),
      dataIndex: 'host',
      key: 'host',
    },
    {
      title: tp('questioning.databases.port'),
      dataIndex: 'port',
      key: 'port',
    },
    {
      title: tp('questioning.databases.database'),
      dataIndex: 'database',
      key: 'database',
    },
    {
      title: tp('questioning.databases.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'connected' ? 'success' : 'error'} icon={status === 'connected' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {status === 'connected' ? tp('questioning.databases.statusConnected') : tp('questioning.databases.statusDisconnected')}
        </Tag>
      ),
    },
    {
      title: tp('questioning.databases.tableCount'),
      dataIndex: 'tableCount',
      key: 'tableCount',
    },
    {
      title: tp('questioning.databases.lastSync'),
      dataIndex: 'lastSync',
      key: 'lastSync',
    },
    {
      title: tp('common.actions'),
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleTestConnection(record.id)}
          >
            {tp('questioning.databases.testConnection')}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditDb(record)}
          >
            {tp('common.edit')}
          </Button>
          <Popconfirm
            title={tp('questioning.databases.deleteConfirm')}
            onConfirm={() => handleDeleteDb(record.id)}
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

  // ==================== 行业黑话管理 ====================
  const fetchGlossaries = async () => {
    try {
      const response = await questioningApi.getGlossaries();
      setGlossaries(response.glossaries || []);
    } catch (error) {
      message.error(tp('questioning.glossaries.fetchFailed'));
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
      message.success(tp('questioning.glossaries.deleteSuccess'));
      fetchGlossaries();
    } catch (error) {
      message.error(tp('questioning.glossaries.deleteFailed'));
    }
  };

  const handleSubmitGlossary = async () => {
    try {
      const values = await glossaryForm.validateFields();
      await questioningApi.createGlossary(values);
      setGlossaryModalVisible(false);
      glossaryForm.resetFields();
      fetchGlossaries();
      message.success(tp('questioning.glossaries.createSuccess'));
    } catch (error) {
      message.error(tp('questioning.glossaries.createFailed'));
    }
  };

  const glossaryColumns = [
    {
      title: tp('questioning.glossaries.term'),
      dataIndex: 'term',
      key: 'term',
      render: (term: string) => <Tag color="purple" style={{ fontSize: 14 }}>{term}</Tag>,
    },
    {
      title: tp('questioning.glossaries.definition'),
      dataIndex: 'definition',
      key: 'definition',
    },
    {
      title: tp('questioning.glossaries.mapping'),
      dataIndex: 'mapping',
      key: 'mapping',
      render: (mapping: string) => <Tag color="geekblue">{mapping}</Tag>,
    },
    {
      title: tp('questioning.glossaries.category'),
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: tp('questioning.glossaries.example'),
      dataIndex: 'example',
      key: 'example',
      ellipsis: true,
    },
    {
      title: tp('common.actions'),
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditGlossary(record)}
          >
            {tp('common.edit')}
          </Button>
          <Popconfirm
            title={tp('questioning.glossaries.deleteConfirm')}
            onConfirm={() => handleDeleteGlossary(record.id)}
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

  // ==================== 问数历史 ====================
  const fetchHistories = async () => {
    try {
      const response = await questioningApi.getHistories(0, 10);
      setHistories(response.histories || []);
    } catch (error) {
      message.error(tp('questioning.history.fetchFailed'));
    }
  };

  const historyColumns = [
    {
      title: tp('questioning.history.question'),
      dataIndex: 'question',
      key: 'question',
      width: 250,
    },
    {
      title: tp('questioning.history.sql'),
      dataIndex: 'sql',
      key: 'sql',
      width: 300,
      ellipsis: true,
    },
    {
      title: tp('questioning.history.resultCount'),
      dataIndex: 'result',
      key: 'result',
      width: 150,
      ellipsis: true,
    },
    {
      title: tp('questioning.history.duration'),
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
    },
    {
      title: tp('questioning.history.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'success' ? 'success' : 'error'} icon={status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {status === 'success' ? tp('questioning.history.statusSuccess') : tp('questioning.history.statusFailed')}
        </Tag>
      ),
    },
    {
      title: tp('questioning.history.database'),
      dataIndex: 'database',
      key: 'database',
      width: 120,
    },
    {
      title: tp('questioning.history.askTime'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
  ];

  // ==================== 问答测试 ====================
  const handleTestQuestion = async () => {
    if (!question.trim()) {
      message.warning(tp('questioning.ask.questionRequired'));
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
      message.error(tp('questioning.ask.askFailed'));
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
          {tp('questioning.tabs.databases')}
        </span>
      ),
      children: (
        <Card
          title={tp('questioning.databases.title')}
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDb}>
              {tp('questioning.databases.addButton')}
            </Button>
          }
        >
          <Alert
            message={tp('questioning.databases.alertMessage')}
            description={tp('questioning.databases.alertDescription')}
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
          {tp('questioning.tabs.glossaries')}
        </span>
      ),
      children: (
        <Card
          title={tp('questioning.glossaries.title')}
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddGlossary}>
              {tp('questioning.glossaries.addButton')}
            </Button>
          }
        >
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Statistic title={tp('questioning.glossaries.statsTotal')} value={glossaries.length} prefix={<BookOutlined />} />
            </Col>
            <Col span={6}>
              <Statistic title={tp('questioning.glossaries.statsSales')} value={glossaries.filter(g => g.category === tp('questioning.glossaries.categorySales')).length} />
            </Col>
            <Col span={6}>
              <Statistic title={tp('questioning.glossaries.statsUser')} value={glossaries.filter(g => g.category === tp('questioning.glossaries.categoryUser')).length} />
            </Col>
            <Col span={6}>
              <Statistic title={tp('questioning.glossaries.statsOther')} value={glossaries.filter(g => g.category !== tp('questioning.glossaries.categorySales') && g.category !== tp('questioning.glossaries.categoryUser')).length} />
            </Col>
          </Row>
          <Alert
            message={tp('questioning.glossaries.alertMessage')}
            description={tp('questioning.glossaries.alertDescription')}
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
          {tp('questioning.tabs.ask')}
        </span>
      ),
      children: (
        <Card title={tp('questioning.ask.title')}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card size="small">
              <Search
                placeholder={tp('questioning.ask.questionPlaceholder')}
                enterButton={tp('questioning.ask.askButton')}
                size="large"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onSearch={handleTestQuestion}
                loading={testing}
              />
              <div style={{ marginTop: 12 }}>
                <Space>
                  <span>{tp('questioning.ask.exampleLabel')}：</span>
                  <Tag
                    style={{ cursor: 'pointer' }}
                    onClick={() => setQuestion(tp('questioning.ask.example1'))}
                  >
                    {tp('questioning.ask.example1')}
                  </Tag>
                  <Tag
                    style={{ cursor: 'pointer' }}
                    onClick={() => setQuestion(tp('questioning.ask.example2'))}
                  >
                    {tp('questioning.ask.example2')}
                  </Tag>
                  <Tag
                    style={{ cursor: 'pointer' }}
                    onClick={() => setQuestion(tp('questioning.ask.example3'))}
                  >
                    {tp('questioning.ask.example3')}
                  </Tag>
                  <Tag
                    style={{ cursor: 'pointer' }}
                    onClick={() => setQuestion(tp('questioning.ask.example4'))}
                  >
                    {tp('questioning.ask.example4')}
                  </Tag>
                </Space>
              </div>
            </Card>

            {testResult && (
              <Card size="small" title={tp('questioning.ask.resultTitle')}>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label={tp('questioning.ask.confidence')}>
                    <Progress percent={Math.round(testResult.confidence * 100)} status="active" />
                  </Descriptions.Item>
                  <Descriptions.Item label={tp('questioning.ask.recognizedTerms')}>
                    {testResult.glossaries.map((g: string) => (
                      <Tag key={g} color="purple">{g}</Tag>
                    ))}
                  </Descriptions.Item>
                  <Descriptions.Item label={tp('questioning.ask.explanation')}>
                    {testResult.explanation}
                  </Descriptions.Item>
                  <Descriptions.Item label={tp('questioning.ask.generatedSQL')}>
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
                      {tp('questioning.ask.executeButton')}
                    </Button>
                    <Button onClick={() => setTestResult(null)}>
                      {tp('questioning.ask.clearButton')}
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
          {tp('questioning.tabs.history')}
        </span>
      ),
      children: (
        <Card title={tp('questioning.history.title')}>
          <Alert
            message={tp('questioning.history.alertMessage')}
            description={tp('questioning.history.alertDescription')}
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
        title={editingDb ? tp('questioning.databases.editModalTitle') : tp('questioning.databases.addModalTitle')}
        open={dbModalVisible}
        onOk={handleSubmitDb}
        onCancel={() => {
          setDbModalVisible(false);
          dbForm.resetFields();
        }}
        width={600}
        okText={tp('common.confirm')}
        cancelText={tp('common.cancel')}
      >
        <Form form={dbForm} layout="vertical">
          <Form.Item
            label={tp('questioning.databases.nameLabel')}
            name="name"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('questioning.databases.nameLabel') }) }]}
          >
            <Input placeholder={tp('questioning.databases.nameLabel')} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={tp('questioning.databases.typeLabel')}
                name="type"
                initialValue="MySQL"
                rules={[{ required: true, message: tp('common.validation.requiredSelect', { field: tp('questioning.databases.typeLabel') }) }]}
              >
                <Select placeholder={tp('questioning.databases.typeLabel')}>
                  <Select.Option value="MySQL">{tp('questioning.databases.typeMySQL')}</Select.Option>
                  <Select.Option value="PostgreSQL">{tp('questioning.databases.typePostgreSQL')}</Select.Option>
                  <Select.Option value="Oracle">{tp('questioning.databases.typeOracle')}</Select.Option>
                  <Select.Option value="SQLServer">{tp('questioning.databases.typeSQLServer')}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={tp('questioning.databases.portLabel')}
                name="port"
                initialValue={3306}
                rules={[{ required: true, message: tp('common.validation.required', { field: tp('questioning.databases.portLabel') }) }]}
              >
                <Input type="number" placeholder={tp('questioning.databases.portLabel')} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={tp('questioning.databases.hostLabel')}
            name="host"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('questioning.databases.hostLabel') }) }]}
          >
            <Input placeholder={tp('questioning.databases.hostPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={tp('questioning.databases.databaseLabel')}
            name="database"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('questioning.databases.databaseLabel') }) }]}
          >
            <Input placeholder={tp('questioning.databases.databaseLabel')} />
          </Form.Item>

          <Form.Item
            label={tp('questioning.databases.usernameLabel')}
            name="username"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('questioning.databases.usernameLabel') }) }]}
          >
            <Input placeholder={tp('questioning.databases.usernameLabel')} />
          </Form.Item>

          <Form.Item
            label={tp('questioning.databases.passwordLabel')}
            name="password"
          >
            <Input.Password placeholder={tp('questioning.databases.passwordLabel')} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 术语编辑弹窗 */}
      <Modal
        title={tp('questioning.glossaries.addModalTitle')}
        open={glossaryModalVisible}
        onOk={handleSubmitGlossary}
        onCancel={() => {
          setGlossaryModalVisible(false);
          glossaryForm.resetFields();
        }}
        width={600}
        okText={tp('common.confirm')}
        cancelText={tp('common.cancel')}
      >
        <Form form={glossaryForm} layout="vertical">
          <Form.Item
            label={tp('questioning.glossaries.termLabel')}
            name="term"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('questioning.glossaries.termLabel') }) }]}
          >
            <Input placeholder={tp('questioning.glossaries.termPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={tp('questioning.glossaries.definitionLabel')}
            name="definition"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('questioning.glossaries.definitionLabel') }) }]}
          >
            <Input placeholder={tp('questioning.glossaries.definitionPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={tp('questioning.glossaries.mappingLabel')}
            name="mapping"
            rules={[{ required: true, message: tp('questioning.glossaries.mappingRequired') }]}
          >
            <TextArea rows={3} placeholder={tp('questioning.glossaries.mappingPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={tp('questioning.glossaries.categoryLabel')}
            name="category"
            initialValue={tp('questioning.glossaries.categorySales')}
            rules={[{ required: true, message: tp('common.validation.requiredSelect', { field: tp('questioning.glossaries.categoryLabel') }) }]}
          >
            <Select placeholder={tp('questioning.glossaries.categoryPlaceholder')}>
              <Select.Option value={tp('questioning.glossaries.categorySales')}>{tp('questioning.glossaries.categorySales')}</Select.Option>
              <Select.Option value={tp('questioning.glossaries.categoryUser')}>{tp('questioning.glossaries.categoryUser')}</Select.Option>
              <Select.Option value={tp('questioning.glossaries.categoryProduct')}>{tp('questioning.glossaries.categoryProduct')}</Select.Option>
              <Select.Option value={tp('questioning.glossaries.categoryFinance')}>{tp('questioning.glossaries.categoryFinance')}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={tp('questioning.glossaries.exampleLabel')}
            name="example"
            rules={[{ required: true, message: tp('questioning.glossaries.exampleRequired') }]}
          >
            <Input placeholder={tp('questioning.glossaries.examplePlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuestioningPage;
