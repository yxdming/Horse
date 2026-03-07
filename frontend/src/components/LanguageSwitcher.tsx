import React from 'react';
import { Select } from 'antd';
import { useTranslation } from '../contexts/LanguageContext';
import { GlobalOutlined } from '@ant-design/icons';

/**
 * 语言切换器组件
 *
 * @example
 * <LanguageSwitcher />
 *
 * @example
 * <LanguageSwitcher style={{ width: 120 }} />
 */
const LanguageSwitcher: React.FC<{
  style?: React.CSSProperties;
  className?: string;
}> = ({ style, className }) => {
  const { language, setLanguage, languages } = useTranslation();

  return (
    <Select
      className={className}
      style={style}
      value={language}
      onChange={setLanguage}
      suffixIcon={<GlobalOutlined />}
      options={languages.map((lang) => ({
        label: lang.label,
        value: lang.value,
      }))}
    />
  );
};

export default LanguageSwitcher;
