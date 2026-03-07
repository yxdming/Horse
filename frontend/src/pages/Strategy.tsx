import React, { useEffect, useState, useMemo } from 'react';
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
import { useTranslation } from '../contexts/LanguageContext';
import { createTranslateProxy } from '../utils/i18n';

const { TextArea } = Input;
const { Title, Text } = Typography;

const Strategy: React.FC = () => {
  const { t } = useTranslation();
  const tp = useMemo(() => createTranslateProxy(t), [t]);
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
      message.error(tp('fetchConfigError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await configApi.updateQAStrategy(values);
      message.success(tp('saveConfigSuccess'));
      fetchConfig();
    } catch (error) {
      message.error(tp('saveConfigError'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      await configApi.resetQAStrategy();
      message.success(tp('resetConfigSuccess'));
      fetchConfig();
    } catch (error) {
      message.error(tp('resetConfigError'));
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
            <span>{tp('title')}</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchConfig} loading={loading}>
              {tp('refresh')}
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit} loading={loading}>
              {tp('saveConfig')}
            </Button>
          </Space>
        }
      >
        <Alert
          message={tp('configInfo.title')}
          description={tp('configInfo.description')}
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
          <Title level={4}>{tp('modelParams.title')}</Title>

          <Form.Item
            label={
              <Space>
                <Text strong>{tp('modelParams.temperature.label')}</Text>
                <Text type="secondary">: {form.getFieldValue('temperature')?.toFixed(2) || 0.7}</Text>
              </Space>
            }
            name="temperature"
            tooltip={tp('modelParams.temperature.tooltip')}
            rules={[{ required: true, message: tp('modelParams.temperature.required') }]}
          >
            <Slider
              min={0}
              max={2}
              step={0.1}
              marks={{
                0: tp('modelParams.temperature.marks.deterministic'),
                0.7: tp('modelParams.temperature.marks.balanced'),
                1.4: tp('modelParams.temperature.marks.creative'),
                2: tp('modelParams.temperature.marks.random'),
              }}
            />
          </Form.Item>

          <Form.Item
            label={tp('modelParams.maxTokens.label')}
            name="max_tokens"
            tooltip={tp('modelParams.maxTokens.tooltip')}
            rules={[{ required: true, message: tp('modelParams.maxTokens.required') }]}
          >
            <InputNumber
              min={100}
              max={8000}
              step={100}
              style={{ width: '100%' }}
              formatter={(value) => `${value} ${tp('modelParams.maxTokens.unit')}`}
              parser={(value: any) => value?.replace(` ${tp('modelParams.maxTokens.unit')}`, '')}
            />
          </Form.Item>

          <Divider />

          <Title level={4}>{tp('retrievalStrategy.title')}</Title>

          <Form.Item
            label={tp('retrievalStrategy.topK.label')}
            name="top_k"
            tooltip={tp('retrievalStrategy.topK.tooltip')}
            rules={[{ required: true, message: tp('retrievalStrategy.topK.required') }]}
          >
            <InputNumber
              min={1}
              max={20}
              style={{ width: '100%' }}
              formatter={(value) => `${value} ${tp('retrievalStrategy.topK.unit')}`}
              parser={(value: any) => value?.replace(` ${tp('retrievalStrategy.topK.unit')}`, '')}
            />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <Text strong>{tp('retrievalStrategy.similarityThreshold.label')}</Text>
                <Text type="secondary">
                  : {form.getFieldValue('similarity_threshold')?.toFixed(2) || 0.75}
                </Text>
              </Space>
            }
            name="similarity_threshold"
            tooltip={tp('retrievalStrategy.similarityThreshold.tooltip')}
            rules={[{ required: true, message: tp('retrievalStrategy.similarityThreshold.required') }]}
          >
            <Slider
              min={0}
              max={1}
              step={0.05}
              marks={{
                0: tp('retrievalStrategy.similarityThreshold.marks.all'),
                0.5: tp('retrievalStrategy.similarityThreshold.marks.loose'),
                0.75: tp('retrievalStrategy.similarityThreshold.marks.moderate'),
                0.9: tp('retrievalStrategy.similarityThreshold.marks.strict'),
                1: tp('retrievalStrategy.similarityThreshold.marks.precise'),
              }}
            />
          </Form.Item>

          <Divider />

          <Title level={4}>{tp('promptConfig.title')}</Title>

          <Form.Item
            label={tp('promptConfig.systemPrompt.label')}
            name="system_prompt"
            tooltip={tp('promptConfig.systemPrompt.tooltip')}
            rules={[{ required: true, message: tp('promptConfig.systemPrompt.required') }]}
          >
            <TextArea
              rows={8}
              placeholder={tp('promptConfig.systemPrompt.placeholder')}
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Divider />

          <Title level={4}>{tp('quickActions.title')}</Title>

          <Space>
            <Button danger onClick={handleReset} loading={loading}>
              {tp('quickActions.resetDefault')}
            </Button>
          </Space>
        </Form>

        <Divider />

        <Title level={4}>{tp('configPreview.title')}</Title>
        <Card size="small" style={{ background: '#f5f5f5' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>
              <Text strong>{tp('configPreview.fields.temperature')}:</Text> {form.getFieldValue('temperature') || 0.7}
            </Text>
            <Text>
              <Text strong>{tp('configPreview.fields.maxTokens')}:</Text> {form.getFieldValue('max_tokens') || 2000}
            </Text>
            <Text>
              <Text strong>{tp('configPreview.fields.topK')}:</Text> {form.getFieldValue('top_k') || 5}
            </Text>
            <Text>
              <Text strong>{tp('configPreview.fields.similarityThreshold')}:</Text>{' '}
              {form.getFieldValue('similarity_threshold') || 0.75}
            </Text>
            <Text>
              <Text strong>{tp('configPreview.fields.systemPrompt')}:</Text>
            </Text>
            <Text type="secondary" style={{ whiteSpace: 'pre-wrap' }}>
              {form.getFieldValue('system_prompt') || tp('configPreview.fields.notSet')}
            </Text>
          </Space>
        </Card>
      </Card>
    </div>
  );
};

export default Strategy;
