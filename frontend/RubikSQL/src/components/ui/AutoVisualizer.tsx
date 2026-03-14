/**
 * Auto-Visualization Components
 *
 * Renders query results as charts or tables based on autoviz recommendations.
 * Following the "Invisible UI" and "Materialism" design philosophy.
 */

import { useState, useEffect, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';
import { Table2, BarChart3, Loader2, LineChart as LineChartIcon, PieChart as PieChartIcon, Radar as RadarIcon, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, type AutovizResponse } from '@/lib/api';
import { Markdown } from '@/features/chat/Markdown';

// =============================================================================
// Types
// =============================================================================

type VizType = 'bar' | 'line' | 'pie' | 'radar' | 'kpi' | 'table';

interface AutoVisualizerProps {
  question: string;
  data: Record<string, any>[];
  className?: string;
  initialVizResult?: AutovizResponse | null;
}

interface ChartConfig {
  x_key?: string;
  y_keys?: string[];
  title?: string;
  summary?: string;
  format?: string | Record<string, string>;  // Format string for KPI values (e.g., "$ {v:.2f}", "{v*100:.1f}%") or dict of y_key -> format_str
}

// Chart type compatibility: which types can be converted to others
// Format: source -> [compatible target types, ordered by preference]
const CHART_FALLBACK_MAP: Record<VizType, VizType[]> = {
  'bar': ['bar', 'table'],
  'line': ['line', 'bar', 'table'],
  'pie': ['pie', 'bar', 'table'],
  'radar': ['radar', 'bar', 'table'],
  'kpi': ['kpi', 'table'],
  'table': ['table'],
};

// Chart type icons and labels
const CHART_TYPE_INFO: Record<VizType, { icon: React.ElementType; label: string }> = {
  'bar': { icon: BarChart3, label: 'Bar' },
  'line': { icon: LineChartIcon, label: 'Line' },
  'pie': { icon: PieChartIcon, label: 'Pie' },
  'radar': { icon: RadarIcon, label: 'Radar' },
  'kpi': { icon: Percent, label: 'KPI' },
  'table': { icon: Table2, label: 'Table' },
};

// Chart color palette - neutral, professional colors
const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
  '#84cc16', // lime-500
];

// =============================================================================
// Table Visualization (Fallback)
// =============================================================================

interface TableVizProps {
  data: Record<string, any>[];
  className?: string;
}

export const TableViz = ({ data, className }: TableVizProps) => {
  const { t } = useTranslation();

  if (!data?.length) {
    return (
      <div className="p-8 text-center text-neutral-400 text-sm">
        {t('common:agent.autoviz.no_data', 'No data to display')}
      </div>
    );
  }

  const headers = Object.keys(data[0]);

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left text-sm">
        <thead className="border-b border-neutral-200">
          <tr>
            {headers.map(h => (
              <th key={h} className="pb-3 pr-4 font-medium text-neutral-500 capitalize whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
              {headers.map(h => (
                <td key={h} className="py-3 pr-4 text-neutral-700 whitespace-nowrap">
                  {formatCellValue(row[h])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// =============================================================================
// KPI Visualization
// =============================================================================

interface KpiVizProps {
  data: Record<string, any>[];
  config: ChartConfig;
}

interface KpiFormatResult {
  prefix: string;
  value: string;
  suffix: string;
  formatted: string;
}

// Hook for formatting KPI values using backend API
function useKpiFormatter(value: number, formatStr: string | undefined): KpiFormatResult | null {
  const [result, setResult] = useState<KpiFormatResult | null>(null);

  useEffect(() => {
    if (!formatStr || isNaN(value)) {
      setResult(null);
      return;
    }

    let cancelled = false;

    const formatValue = async () => {
      try {
        const response = await api.formatKpi(value, formatStr);
        if (!cancelled) {
          setResult(response);
        }
      } catch (err) {
        console.error('Failed to format KPI:', err);
        if (!cancelled) {
          // Fallback to simple formatting
          setResult({
            prefix: '',
            value: value.toFixed(3),
            suffix: '',
            formatted: value.toFixed(3)
          });
        }
      }
    };

    formatValue();

    return () => {
      cancelled = true;
    };
  }, [value, formatStr]);

  return result;
}

const KpiViz = ({ data, config }: KpiVizProps) => {
  if (!data?.length) return null;

  // KPI config structure:
  // - x_key: the label column name (e.g., "category", "metric_name")
  // - y_keys: list of value column names to display (e.g., ["revenue", "count"])
  // - x_rows: optional list of rows to select (e.g., ["Total"])
  // - title: KPI title (shared title below all numbers)
  // - format: optional format string (e.g., "$ {v:.2f}", "{v*100:.1f}%")

  const row = data[0];
  const keys = Object.keys(row);

  // Robust fallback logic for determining y_keys (value columns to display)
  let yKeys: string[];
  if (config.y_keys && config.y_keys.length > 0) {
    // Use provided y_keys
    yKeys = config.y_keys;
  } else if (config.x_key) {
    // Missing y_keys but have x_key: use all columns except x_key
    yKeys = keys.filter(k => k !== config.x_key);
  } else {
    // Both missing: use the first column as single value display
    yKeys = [keys[0]];
  }

  // If still no y_keys (shouldn't happen but defensive), return null
  if (yKeys.length === 0) return null;

  // Old 1 row 1 col display (single value, no x_key/y_keys provided)
  // This preserves backward compatibility
  const isLegacyMode = !config.x_key && !config.y_keys && keys.length === 1;

  // Determine which format string to use for a given key
  const getFormatStr = (key?: string): string | undefined => {
    if (!config.format) return undefined;
    if (typeof config.format === 'string') {
      return config.format;
    } else if (key && config.format[key]) {
      return config.format[key];
    }
    return undefined;
  };

  // Format a KPI value and return JSX with styled parts
  const formatKpiValue = (value: any, key?: string): React.ReactNode => {
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    const formatStr = getFormatStr(key);

    // Determine if this is multi-value display (smaller fonts)
    const isMultiValue = yKeys.length > 1 && !isLegacyMode;
    const prefixSize = isMultiValue ? "text-xl" : "text-3xl";
    const valueSize = isMultiValue ? "text-3xl" : "text-5xl";
    const suffixSize = isMultiValue ? "text-xl" : "text-3xl";

    // Use backend formatting if format string is provided
    const formattedResult = useKpiFormatter(numValue, formatStr);

    if (formattedResult) {
      // Backend formatting succeeded
      return (
        <>
          {formattedResult.prefix && <span className={`${prefixSize} text-neutral-500`}>{formattedResult.prefix}</span>}
          <span className={`${valueSize} font-bold text-neutral-800`}>{formattedResult.value}</span>
          {formattedResult.suffix && <span className={`${suffixSize} text-neutral-500`}>{formattedResult.suffix}</span>}
        </>
      );
    }

    // No format string or still loading - display value with large text
    const displayValue = formatCellValue(value);
    return (
      <span className={`${valueSize} font-bold text-neutral-800`}>{displayValue}</span>
    );
  };

  // Single value KPI (most common case)
  if (yKeys.length === 1 || isLegacyMode) {
    const valueKey = yKeys[0];
    const value = row[valueKey];

    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="flex items-baseline tabular-nums">
          {formatKpiValue(value, valueKey)}
        </div>
        {config.title && (
          <div className="mt-3 text-sm text-neutral-500">{config.title}</div>
        )}
        <div className="mt-1 text-xs text-neutral-400">{valueKey}</div>
      </div>
    );
  }

  // Multi-value KPI with grid layout (max 3 per line)
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        {yKeys.map((key) => (
          <div key={key} className="flex flex-col items-center min-w-0">
            <div className="flex items-baseline tabular-nums whitespace-nowrap overflow-hidden">
              {formatKpiValue(row[key], key)}
            </div>
            <div className="mt-2 text-xs text-neutral-400 truncate w-full text-center">{key}</div>
          </div>
        ))}
      </div>
      {config.title && (
        <div className="mt-4 text-sm text-neutral-500">{config.title}</div>
      )}
    </div>
  );
};

// =============================================================================
// Bar Chart Visualization
// =============================================================================

interface BarVizProps {
  data: Record<string, any>[];
  config: ChartConfig;
}

const BarViz = ({ data, config }: BarVizProps) => {
  const xKey = config.x_key || Object.keys(data[0])[0];
  const yKeys = config.y_keys || Object.keys(data[0]).filter(k => k !== xKey).slice(0, 3);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={xKey} 
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis 
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        />
        {yKeys.length > 1 && <Legend />}
        {yKeys.map((key, index) => (
          <Bar 
            key={key} 
            dataKey={key} 
            fill={CHART_COLORS[index % CHART_COLORS.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

// =============================================================================
// Line Chart Visualization
// =============================================================================

interface LineVizProps {
  data: Record<string, any>[];
  config: ChartConfig;
}

const LineViz = ({ data, config }: LineVizProps) => {
  const xKey = config.x_key || Object.keys(data[0])[0];
  const yKeys = config.y_keys || Object.keys(data[0]).filter(k => k !== xKey).slice(0, 3);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={xKey}
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis 
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        />
        {yKeys.length > 1 && <Legend />}
        {yKeys.map((key, index) => (
          <Line 
            key={key} 
            type="monotone" 
            dataKey={key} 
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS[index % CHART_COLORS.length], r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

// =============================================================================
// Pie Chart Visualization
// =============================================================================

interface PieVizProps {
  data: Record<string, any>[];
  config: ChartConfig;
}

const PieViz = ({ data, config }: PieVizProps) => {
  const keys = Object.keys(data[0]);
  const nameKey = config.x_key || keys[0];
  const valueKey = config.y_keys?.[0] || keys.find(k => k !== nameKey) || keys[1];

  // Limit to 8 slices for readability
  const chartData = data.slice(0, 8);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey={valueKey}
          nameKey={nameKey}
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// =============================================================================
// Radar Chart Visualization
// =============================================================================

interface RadarVizProps {
  data: Record<string, any>[];
  config: ChartConfig;
}

const RadarViz = ({ data, config }: RadarVizProps) => {
  const xKey = config.x_key || Object.keys(data[0])[0];
  const yKeys = config.y_keys || Object.keys(data[0]).filter(k => k !== xKey).slice(0, 1);

  // Limit data for readability (max 12 categories on radar)
  const chartData = data.slice(0, 12);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={chartData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
        <PolarGrid stroke="#f0f0f0" />
        <PolarAngleAxis
          dataKey={xKey}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <PolarRadiusAxis
          angle={90}
          tick={{ fill: '#6b7280', fontSize: 10 }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        />
        {yKeys.length > 1 && <Legend />}
        {yKeys.map((key, index) => (
          <Radar
            key={key}
            name={key}
            dataKey={key}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            fill={CHART_COLORS[index % CHART_COLORS.length]}
            fillOpacity={0.4}
            strokeWidth={2}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
};

// =============================================================================
// Chart Switch Component
// =============================================================================

interface ChartSwitchProps {
  vizType: VizType;
  data: Record<string, any>[];
  config: ChartConfig;
}

/**
 * Convert chart config when switching between chart types.
 * Ensures the config has the required fields for the target type.
 */
function convertConfigForType(
  sourceType: VizType,
  targetType: VizType,
  config: ChartConfig,
  data: Record<string, any>[]
): ChartConfig {
  // If same type or target is table, return as-is
  if (sourceType === targetType || targetType === 'table') {
    return config;
  }

  // For pie chart, ensure only one y_key
  if (targetType === 'pie' && config.y_keys && config.y_keys.length > 1) {
    return { ...config, y_keys: [config.y_keys[0]] };
  }

  // For KPI, ensure minimal config (KPI doesn't use x_key/y_keys)
  if (targetType === 'kpi') {
    const { x_key, y_keys, ...rest } = config;
    return rest;
  }

  // For other types (bar, line, radar), ensure we have x_key and y_keys
  const keys = Object.keys(data[0] || {});

  // If converting from KPI (which has no x_key/y_keys), derive them
  if (sourceType === 'kpi') {
    return {
      ...config,
      x_key: keys[0],
      y_keys: keys.slice(1, 2), // Take first value column
    };
  }

  return config;
}

const ChartSwitch = ({ vizType, data, config }: ChartSwitchProps) => {
  switch (vizType) {
    case 'kpi':
      return <KpiViz data={data} config={config} />;
    case 'bar':
      return <BarViz data={data} config={config} />;
    case 'line':
      return <LineViz data={data} config={config} />;
    case 'pie':
      return <PieViz data={data} config={config} />;
    case 'radar':
      return <RadarViz data={data} config={config} />;
    default:
      return <TableViz data={data} />;
  }
};

// =============================================================================
// Main AutoVisualizer Component
// =============================================================================

export const AutoVisualizer = ({ question, data, className, initialVizResult }: AutoVisualizerProps) => {
  const { t } = useTranslation();
  const [vizResult, setVizResult] = useState<AutovizResponse | null>(initialVizResult || null);
  const [isLoading, setIsLoading] = useState(!initialVizResult);
  const [currentVizType, setCurrentVizType] = useState<VizType>(initialVizResult?.viz_type || 'table');

  // Fetch autoviz recommendation
  useEffect(() => {
    let cancelled = false;

    const fetchAutoviz = async () => {
      // If initialVizResult is provided, use it directly
      if (initialVizResult) {
        setVizResult(initialVizResult);
        setCurrentVizType(initialVizResult.viz_type as VizType);
        setIsLoading(false);
        return;
      }

      // Skip if no data
      if (!data || data.length === 0) {
        const noDataResult: AutovizResponse = {
          viz_type: 'table',
          config: { title: 'No Data' },
          summary: '',
          chart_data: [],
          fallback_reason: 'empty_data'
        };
        setVizResult(noDataResult);
        setCurrentVizType('table');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const result = await api.computeAutoviz(question, data);
        if (!cancelled) {
          setVizResult(result);
          setCurrentVizType(result.viz_type as VizType);
        }
      } catch (err) {
        console.error('Autoviz error:', err);
        if (!cancelled) {
          // Fallback to table on error
          const errorResult: AutovizResponse = {
            viz_type: 'table',
            config: { title: 'Query Results' },
            summary: '',
            chart_data: data, // On error, show all data
            fallback_reason: 'api_error'
          };
          setVizResult(errorResult);
          setCurrentVizType('table');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchAutoviz();

    return () => {
      cancelled = true;
    };
  }, [question, data, initialVizResult]);

  // Compute compatible visualization types based on original recommendation
  const compatibleTypes = useMemo(() => {
    if (!vizResult) return ['table'];
    const originalType = vizResult.viz_type as VizType;
    return CHART_FALLBACK_MAP[originalType] || ['table'];
  }, [vizResult]);

  // Convert config for current viz type
  const convertedConfig = useMemo(() => {
    if (!vizResult) return {};
    const originalType = vizResult.viz_type as VizType;
    // Use chart_data for conversion if available, otherwise fall back to original data
    const dataForConfig = vizResult.chart_data ?? data;
    return convertConfigForType(originalType, currentVizType, vizResult.config, dataForConfig);
  }, [vizResult, currentVizType, data]);

  // Determine which data to use for visualization
  // - For charts (bar, line, pie, radar): use filtered chart_data (excludes aggregation rows)
  // - For KPI: use chart_data with y_keys filtering (includes aggregation rows if x_rows selects them)
  // - For tables: use original data (includes all rows and columns)
  const dataForViz = useMemo(() => {
    if (!vizResult) return data;

    // Table always uses original data (show all rows and columns)
    if (currentVizType === 'table') {
      return data;
    }

    // Charts and KPI use filtered chart_data if available
    // KPI chart_data contains y_keys-filtered data (may include aggregation rows)
    return vizResult.chart_data ?? data;
  }, [vizResult, currentVizType, data]);

  // Memoize the visualization content
  const vizContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      );
    }

    return (
      <ErrorBoundary fallback={<TableViz data={data} />}>
        <div className="animate-in fade-in duration-300">
          <ChartSwitch
            vizType={currentVizType}
            data={dataForViz}
            config={convertedConfig}
          />
        </div>
      </ErrorBoundary>
    );
  }, [isLoading, currentVizType, convertedConfig, dataForViz, data]);

  return (
    <div className={cn("border border-neutral-200 rounded-lg overflow-hidden", className)}>
      {/* Header with type switcher */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-50 border-b border-neutral-100">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          {vizResult?.config?.title && (
            <span className="font-medium">{vizResult.config.title}</span>
          )}
          {!vizResult?.config?.title && (
            <span className="font-medium">{t('common:agent.autoviz.results', 'Results')}</span>
          )}
          {data && (
            <span className="text-neutral-400">
              ({data.length} {data.length === 1 ? t('common:agent.autoviz.row', 'row') : t('common:agent.autoviz.rows', 'rows')})
            </span>
          )}
        </div>

        {/* Multi-switch for compatible chart types */}
        {compatibleTypes.length > 1 && (
          <div className="flex items-center gap-1">
            {compatibleTypes.map((type) => {
              const IconComponent = CHART_TYPE_INFO[type as VizType].icon;
              const isSelected = currentVizType === type;

              return (
                <button
                  key={type}
                  onClick={() => setCurrentVizType(type as VizType)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors",
                    isSelected
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                  )}
                  title={CHART_TYPE_INFO[type as VizType].label}
                >
                  <IconComponent size={14} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Visualization content */}
      <div className="p-4">
        {vizContent}
      </div>

      {/* Summary - display for all viz types with markdown rendering */}
      {(vizResult?.config?.summary || (vizResult as any)?.summary) && (
        <div className="px-4 pb-4">
          <div className="mt-0 pt-4 border-t border-neutral-100 prose prose-sm max-w-none text-neutral-800">
            {Markdown({
              id: `summary-${question.slice(0, 20)}`,
              content: formatSummaryAsBlockquote((vizResult as any)?.summary || vizResult?.config?.summary || '')
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Helpers
// =============================================================================

function formatSummaryAsBlockquote(summary: string): string {
  if (!summary) return '';
  return summary.split('\n').map(line => `> ${line}`).join('\n');
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    // Format numbers with locale-aware formatting
    return value.toLocaleString();
  }
  if (typeof value === 'boolean') {
    return value ? '✓' : '✗';
  }
  return String(value);
}

export default AutoVisualizer;
