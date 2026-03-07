/**
 * 国际化辅助工具函数
 */

/**
 * 格式化翻译字符串，替换占位符
 * @param template 翻译模板字符串，例如：'共 {total} 条'
 * @param params 参数对象，例如：{ total: 100 }
 * @returns 格式化后的字符串
 *
 * @example
 * formatMessage('共 {total} 条', { total: 100 }) // '共 100 条'
 * formatMessage('删除成功', {}) // '删除成功'
 */
export const formatMessage = (template: string, params: Record<string, string | number> = {}): string => {
  if (!params || Object.keys(params).length === 0) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() ?? match;
  });
};

/**
 * 创建一个翻译辅助函数，用于处理带参数的翻译
 * @param t 翻译函数
 * @returns 带参数处理的翻译函数
 *
 * @example
 * const { t } = useTranslation();
 * const tp = createTranslateProxy(t);
 * tp('common.pagination.total', { total: 100 }) // '共 100 条'
 */
export const createTranslateProxy = (
  t: Record<string, any>
): ((key: string, params?: Record<string, string | number>) => string) => {
  return (key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.');
    let value = t;

    for (const k of keys) {
      value = value?.[k];
    }

    if (typeof value !== 'string') {
      console.warn(`Translation key "${key}" not found or not a string`);
      return key;
    }

    return formatMessage(value, params);
  };
};
