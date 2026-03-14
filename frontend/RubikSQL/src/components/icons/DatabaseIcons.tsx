import { cn } from '@/lib/utils';
import sqliteLogo from '@/assets/providers/sqlite.png';
import postgresLogo from '@/assets/providers/postgresql.png';
import mysqlLogo from '@/assets/providers/mysql.png';
import duckdbLogo from '@/assets/providers/duckdb.png';
import mssqlLogo from '@/assets/providers/mssql.png';

interface ProviderIconProps {
  className?: string;
  size?: number;
}

const ProviderIcon = ({ src, alt, className, size = 24 }: ProviderIconProps & { src: string; alt: string }) => (
  <img
    src={src}
    alt={alt}
    width={size}
    height={size}
    className={cn('object-contain select-none', className)}
    draggable={false}
  />
);

export const SqliteIcon = ({ className, size }: ProviderIconProps) => (
  <ProviderIcon src={sqliteLogo} alt="SQLite" className={className} size={size} />
);

export const PostgresIcon = ({ className, size }: ProviderIconProps) => (
  <ProviderIcon src={postgresLogo} alt="PostgreSQL" className={className} size={size} />
);

export const MysqlIcon = ({ className, size }: ProviderIconProps) => (
  <ProviderIcon src={mysqlLogo} alt="MySQL" className={className} size={size} />
);

export const DuckdbIcon = ({ className, size }: ProviderIconProps) => (
  <ProviderIcon src={duckdbLogo} alt="DuckDB" className={className} size={size} />
);

export const MssqlIcon = ({ className, size }: ProviderIconProps) => (
  <ProviderIcon src={mssqlLogo} alt="SQL Server" className={className} size={size} />
);
