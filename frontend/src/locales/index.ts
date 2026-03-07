import zhCN from './zh-CN';
import enUS from './en-US';

export type Language = 'zh-CN' | 'en-US';

export const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export type Messages = typeof zhCN;

export { default as zhCN } from './zh-CN';
export { default as enUS } from './en-US';
