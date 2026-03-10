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
      message.error(tp('strategy.fetchConfigError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await configApi.updateQAStrategy(values);
      message.success(tp('strategy.saveConfigSuccess'));
      fetchConfig();
    } catch (error) {
      message.error(tp('strategy.saveConfigError'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      await configApi.resetQAStrategy();
      message.success(tp('strategy.resetConfigSuccess'));
      fetchConfig();
    } catch (error) {
      message.error(tp('strategy.resetConfigError'));
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
            <span>{tp('strategy.title')}</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchConfig} loading={loading}>
              {tp('strategy.refresh')}
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit} loading={loading}>
              {tp('strategy.saveConfig')}
            </Button>
          </Space>
        }
      >
        <Alert
          message={tp('strategy.configInfo.title')}
          description={tp('strategy.configInfo.description')}
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
          <Title level={4}>{tp('strategy.modelParams.title')}</Title>

          <Form.Item
            label={
              <Space>
                <Text strong>{tp('strategy.modelParams.temperature.label')}</Text>
                <Text type="secondary">: {form.getFieldValue('temperature')?.toFixed(2) || 0.7}</Text>
              </Space>
            }
            name="temperature"
            tooltip={tp('strategy.modelParams.temperature.tooltip')}
            rules={[{ required: true, message: tp('strategy.modelParams.temperature.required') }]}
          >
            <Slider
              min={0}
              max={2}
              step={0.1}
              marks={{
                0: tp('strategy.modelParams.temperature.marks.deterministic'),
                0.7: tp('strategy.modelParams.temperature.marks.balanced'),
                1.4: tp('strategy.modelParams.temperature.marks.creative'),
                2: tp('strategy.modelParams.temperature.marks.random'),
              }}
            />
          </Form.Item>

          <Form.Item
            label={tp('strategy.modelParams.maxTokens.label')}
            name="max_tokens"
            tooltip={tp('strategy.modelParams.maxTokens.tooltip')}
            rules={[{ required: true, message: tp('strategy.modelParams.maxTokens.required') }]}
          >
            <InputNumber
              min={100}
              max={8000}
              step={100}
              style={{ width: '100%' }}
              formatter={(value) => `${value} ${tp('strategy.modelParams.maxTokens.unit')}`}
              parser={(value: any) => value?.replace(` ${tp('strategy.modelParams.maxTokens.unit')}`, '')}
            />
          </Form.Item>

          <Divider />

          <Title level={4}>{tp('strategy.retrievalStrategy.title')}</Title>

          <Form.Item
            label={tp('strategy.retrievalStrategy.topK.label')}
            name="top_k"
            tooltip={tp('strategy.retrievalStrategy.topK.tooltip')}
            rules={[{ required: true, message: tp('strategy.retrievalStrategy.topK.required') }]}
          >
            <InputNumber
              min={1}
              max={20}
              style={{ width: '100%' }}
              formatter={(value) => `${value} ${tp('strategy.retrievalStrategy.topK.unit')}`}
              parser={(value: any) => value?.replace(` ${tp('strategy.retrievalStrategy.topK.unit')}`, '')}
            />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <Text strong>{tp('strategy.retrievalStrategy.similarityThreshold.label')}</Text>
                <Text type="secondary">
                  : {form.getFieldValue('similarity_threshold')?.toFixed(2) || 0.75}
                </Text>
              </Space>
            }
            name="similarity_threshold"
            tooltip={tp('strategy.retrievalStrategy.similarityThreshold.tooltip')}
            rules={[{ required: true, message: tp('strategy.retrievalStrategy.similarityThreshold.required') }]}
          >
            <Slider
              min={0}
              max={1}
              step={0.05}
              marks={{
                0: tp('strategy.retrievalStrategy.similarityThreshold.marks.all'),
                0.5: tp('strategy.retrievalStrategy.similarityThreshold.marks.loose'),
                0.75: tp('strategy.retrievalStrategy.similarityThreshold.marks.moderate'),
                0.9: tp('strategy.retrievalStrategy.similarityThreshold.marks.strict'),
                1: tp('strategy.retrievalStrategy.similarityThreshold.marks.precise'),
              }}
            />
          </Form.Item>

          <Divider />

          <Title level={4}>{tp('strategy.promptConfig.title')}</Title>

          <Form.Item
            label={tp('strategy.promptConfig.systemPrompt.label')}
            name="system_prompt"
            tooltip={tp('strategy.promptConfig.systemPrompt.tooltip')}
            rules={[{ required: true, message: tp('strategy.promptConfig.systemPrompt.required') }]}
          >
            <TextArea
              rows={8}
              placeholder={tp('strategy.promptConfig.systemPrompt.placeholder')}
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Divider />

          <Title level={4}>{tp('strategy.quickActions.title')}</Title>

          <Space>
            <Button danger onClick={handleReset} loading={loading}>
              {tp('strategy.quickActions.resetDefault')}
            </Button>
          </Space>
        </Form>

        <Divider />

        <Title level={4}>{tp('strategy.configPreview.title')}</Title>
        <Form.Item noStyle>
          <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues !== currentValues}>
            {() => (
              <Card size="small" style={{ background: '#f5f5f5' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text>
                    <Text strong>{tp('strategy.configPreview.fields.temperature')}:</Text> {form.getFieldValue('temperature') || 0.7}
                  </Text>
                  <Text>
                    <Text strong>{tp('strategy.configPreview.fields.maxTokens')}:</Text> {form.getFieldValue('max_tokens') || 2000}
                  </Text>
                  <Text>
                    <Text strong>{tp('strategy.configPreview.fields.topK')}:</Text> {form.getFieldValue('top_k') || 5}
                  </Text>
                  <Text>
                    <Text strong>{tp('strategy.configPreview.fields.similarityThreshold')}:</Text>{' '}
                    {form.getFieldValue('similarity_threshold') || 0.75}
                  </Text>
                  <Text>
                    <Text strong>{tp('strategy.configPreview.fields.systemPrompt')}:</Text>
                  </Text>
                  <Text type="secondary" style={{ whiteSpace: 'pre-wrap' }}>
                    {form.getFieldValue('system_prompt') || tp('strategy.configPreview.fields.notSet')}
                  </Text>
                </Space>
              </Card>
            )}
          </Form.Item>
        </Form.Item>
      </Card>
    </div>
  );
};

export default Strategy;
