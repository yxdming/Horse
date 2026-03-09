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
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { User, UserCreate, UserUpdate } from '../types';
import { userApi } from '../services/api';
import { useTranslation } from '../contexts/LanguageContext';
import { createTranslateProxy } from '../utils/i18n';

const { Search } = Input;

const Users: React.FC = () => {
  const { t } = useTranslation();
  const tp = useMemo(() => createTranslateProxy(t), [t]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize, searchQuery, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getUsers({
        skip: (page - 1) * pageSize,
        limit: pageSize,
        search: searchQuery || undefined,
        role: roleFilter,
        status: statusFilter,
      });
      setUsers(response.users || []);
      setTotal(response.total || 0);
    } catch (error) {
      message.error(tp('users.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ role: 'user', status: 'active' });
    setModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await userApi.deleteUser(id);
      message.success(tp('users.deleteSuccess'));
      fetchUsers();
    } catch (error) {
      message.error(tp('users.deleteFailed'));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingUser) {
        const updateData: UserUpdate = {
          username: values.username,
          email: values.email,
          role: values.role,
          status: values.status,
        };
        await userApi.updateUser(editingUser.id, updateData);
        message.success(tp('users.updateSuccess'));
      } else {
        const createData: UserCreate = {
          username: values.username,
          email: values.email,
          role: values.role,
        };
        await userApi.createUser(createData);
        message.success(tp('users.createSuccess'));

        // 创建成功后，清除筛选条件并跳转到第一页
        setSearchQuery('');
        setRoleFilter(undefined);
        setStatusFilter(undefined);
        setPage(1);
      }

      setModalVisible(false);
      form.resetFields();

      // 延迟一下再刷新，确保后端数据已保存
      setTimeout(() => {
        fetchUsers();
      }, 100);
    } catch (error) {
      message.error(editingUser ? tp('users.updateFailed') : tp('users.createFailed'));
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'user':
        return 'blue';
      case 'readonly':
        return 'default';
      default:
        return 'default';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return tp('users.roleAdmin');
      case 'user':
        return tp('users.roleUser');
      case 'readonly':
        return tp('users.roleReadonly');
      default:
        return role;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'default';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? tp('users.statusActive') : tp('users.statusInactive');
  };

  const columns = [
    {
      title: tp('users.username'),
      dataIndex: 'username',
      key: 'username',
      width: 120,
      align: 'center' as const,
    },
    {
      title: tp('users.email'),
      dataIndex: 'email',
      key: 'email',
      width: 200,
      align: 'center' as const,
    },
    {
      title: tp('users.role'),
      dataIndex: 'role',
      key: 'role',
      width: 100,
      align: 'center' as const,
      render: (role: string) => <Tag color={getRoleColor(role)}>{getRoleText(role)}</Tag>,
    },
    {
      title: tp('users.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    {
      title: tp('users.createTime'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      align: 'center' as const,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: tp('users.lastLogin'),
      dataIndex: 'last_login',
      key: 'last_login',
      width: 180,
      align: 'center' as const,
      render: (date: string) => (date ? new Date(date).toLocaleString('zh-CN') : '-'),
    },
    {
      title: tp('common.actions'),
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: any, record: User) => (
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
            title={tp('users.deleteConfirm')}
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

  // Calculate statistics
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const activeUserCount = users.filter((u) => u.status === 'active').length;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title={tp('users.statsTotal')} value={total} prefix={<UserOutlined />} />
          </Col>
          <Col span={6}>
            <Statistic title={tp('users.statsActive')} value={activeUserCount} suffix={`/ ${total}`} />
          </Col>
          <Col span={6}>
            <Statistic title={tp('users.statsAdmin')} value={adminCount} />
          </Col>
          <Col span={6}>
            <Statistic title={tp('users.statsUser')} value={users.filter((u) => u.role === 'user').length} />
          </Col>
        </Row>
      </Card>

      <Card
        title={tp('users.title')}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
              {tp('common.refresh')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              {tp('users.addButton')}
            </Button>
          </Space>
        }
      >
        <Space style={{ marginBottom: 16 }} size="middle">
          <Search
            placeholder={tp('users.searchPlaceholder')}
            allowClear
            style={{ width: 300 }}
            onSearch={setSearchQuery}
            enterButton
          />
          <Select
            placeholder={tp('users.roleFilter')}
            allowClear
            style={{ width: 120 }}
            value={roleFilter}
            onChange={setRoleFilter}
          >
            <Select.Option value="admin">{tp('users.roleAdmin')}</Select.Option>
            <Select.Option value="user">{tp('users.roleUser')}</Select.Option>
            <Select.Option value="readonly">{tp('users.roleReadonly')}</Select.Option>
          </Select>
          <Select
            placeholder={tp('users.statusFilter')}
            allowClear
            style={{ width: 120 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Select.Option value="active">{tp('users.statusActive')}</Select.Option>
            <Select.Option value="inactive">{tp('users.statusInactive')}</Select.Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={users}
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

      <Modal
        title={editingUser ? tp('users.editModalTitle') : tp('users.addModalTitle')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        okText={tp('common.confirm')}
        cancelText={tp('common.cancel')}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={tp('users.usernameLabel')}
            name="username"
            rules={[{ required: true, message: tp('common.validation.required', { field: tp('users.usernameLabel') }) }]}
          >
            <Input placeholder={tp('users.usernamePlaceholder')} />
          </Form.Item>

          <Form.Item
            label={tp('users.emailLabel')}
            name="email"
            rules={[
              { required: true, message: tp('common.validation.required', { field: tp('users.emailLabel') }) },
              { type: 'email', message: tp('common.validation.email') },
            ]}
          >
            <Input placeholder={tp('users.emailPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={tp('users.roleLabel')}
            name="role"
            rules={[{ required: true, message: tp('common.validation.requiredSelect', { field: tp('users.roleLabel') }) }]}
          >
            <Select placeholder={tp('users.rolePlaceholder')}>
              <Select.Option value="admin">{tp('users.roleAdmin')}</Select.Option>
              <Select.Option value="user">{tp('users.roleUser')}</Select.Option>
              <Select.Option value="readonly">{tp('users.roleReadonly')}</Select.Option>
            </Select>
          </Form.Item>

          {editingUser && (
            <Form.Item
              label={tp('users.statusLabel')}
              name="status"
              rules={[{ required: true, message: tp('common.validation.requiredSelect', { field: tp('users.statusLabel') }) }]}
            >
              <Select placeholder={tp('users.statusPlaceholder')}>
                <Select.Option value="active">{tp('users.statusActive')}</Select.Option>
                <Select.Option value="inactive">{tp('users.statusInactive')}</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
