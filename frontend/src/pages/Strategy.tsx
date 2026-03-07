import React, { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  message,
  Slider,
  Typography,
  Divider,
  Alert,
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { QAStrategy } from '../types';
import { configApi } from '../services/api';

const { TextArea } = Input;
const { Title, Text } = Typography;

const Strategy: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<QAStrategy | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await configApi.getQAStrategy();
      setConfig(data);
      form.setFieldsValue(data);
    } catch (error) {
      message.error('获取配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await configApi.updateQAStrategy(values);
      message.success('配置保存成功');
      fetchConfig();
    } catch (error) {
      message.error('配置保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      await configApi.resetQAStrategy();
      message.success('配置已重置为默认值');
      fetchConfig();
    } catch (error) {
      message.error('配置重置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card
        title={
          <Space>
            <SettingOutlined />
            <span>问答策略配置</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchConfig} loading={loading}>
              刷新
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit} loading={loading}>
              保存配置
            </Button>
          </Space>
        }
      >
        <Alert
          message="配置说明"
          description="这些配置将影响AI问答系统的行为和回复质量。请根据实际需求调整参数。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          initialValues={config || undefined}
          disabled={loading}
        >
          <Title level={4}>模型参数</Title>

          <Form.Item
            label={
              <Space>
                <Text strong>Temperature（温度）</Text>
                <Text type="secondary">: {form.getFieldValue('temperature')?.toFixed(2) || 0.7}</Text>
              </Space>
            }
            name="temperature"
            tooltip="控制回答的随机性和创造性。值越高，回答越随机；值越低，回答越确定。"
            rules={[{ required: true, message: '请输入Temperature值' }]}
          >
            <Slider
              min={0}
              max={2}
              step={0.1}
              marks={{
                0: '确定',
                0.7: '平衡',
                1.4: '创造',
                2: '随机',
              }}
            />
          </Form.Item>

          <Form.Item
            label="Max Tokens（最大生成长度）"
            name="max_tokens"
            tooltip="控制AI回答的最大长度（字符数）。"
            rules={[{ required: true, message: '请输入Max Tokens值' }]}
          >
            <InputNumber
              min={100}
              max={8000}
              step={100}
              style={{ width: '100%' }}
              formatter={(value) => `${value} 字符`}
              parser={(value: any) => value?.replace(' 字符', '')}
            />
          </Form.Item>

          <Divider />

          <Title level={4}>检索策略</Title>

          <Form.Item
            label="Top-K（检索数量）"
            name="top_k"
            tooltip="从知识库中检索最相关的K个文档用于生成回答。"
            rules={[{ required: true, message: '请输入Top-K值' }]}
          >
            <InputNumber
              min={1}
              max={20}
              style={{ width: '100%' }}
              formatter={(value) => `${value} 个文档`}
              parser={(value: any) => value?.replace(' 个文档', '')}
            />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <Text strong>Similarity Threshold（相似度阈值）</Text>
                <Text type="secondary">
                  : {form.getFieldValue('similarity_threshold')?.toFixed(2) || 0.75}
                </Text>
              </Space>
            }
            name="similarity_threshold"
            tooltip="只使用相似度高于此阈值的文档。值越高，检索结果越精确但可能越少。"
            rules={[{ required: true, message: '请输入相似度阈值' }]}
          >
            <Slider
              min={0}
              max={1}
              step={0.05}
              marks={{
                0: '全部',
                0.5: '宽松',
                0.75: '适中',
                0.9: '严格',
                1: '精确',
              }}
            />
          </Form.Item>

          <Divider />

          <Title level={4}>提示词配置</Title>

          <Form.Item
            label="System Prompt（系统提示词）"
            name="system_prompt"
            tooltip="设置AI助手的角色和行为方式，这将影响回答的风格和质量。"
            rules={[{ required: true, message: '请输入系统提示词' }]}
          >
            <TextArea
              rows={8}
              placeholder="请输入系统提示词，例如：你是一个专业的AI助手，基于知识库内容回答用户问题。"
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Divider />

          <Title level={4}>快捷操作</Title>

          <Space>
            <Button danger onClick={handleReset} loading={loading}>
              恢复默认配置
            </Button>
          </Space>
        </Form>

        <Divider />

        <Title level={4}>配置预览</Title>
        <Card size="small" style={{ background: '#f5f5f5' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>
              <Text strong>Temperature:</Text> {form.getFieldValue('temperature') || 0.7}
            </Text>
            <Text>
              <Text strong>Max Tokens:</Text> {form.getFieldValue('max_tokens') || 2000}
            </Text>
            <Text>
              <Text strong>Top-K:</Text> {form.getFieldValue('top_k') || 5}
            </Text>
            <Text>
              <Text strong>Similarity Threshold:</Text>{' '}
              {form.getFieldValue('similarity_threshold') || 0.75}
            </Text>
            <Text>
              <Text strong>System Prompt:</Text>
            </Text>
            <Text type="secondary" style={{ whiteSpace: 'pre-wrap' }}>
              {form.getFieldValue('system_prompt') || '未设置'}
            </Text>
          </Space>
        </Card>
      </Card>
    </div>
  );
};

export default Strategy;
