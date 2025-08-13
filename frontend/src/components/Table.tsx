import React, { useState } from 'react';

interface Column {
  key: string;
  title: string;
  width?: string;
  render?: (value: any, record: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  sortable?: boolean;
}

const Table: React.FC<TableProps> = ({ columns, data, loading, sortable = false }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    if (!sortable) return;
    
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const sortedData = sortConfig ? getSortedData() : data;

  if (loading) {
    return (
      <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
        <div className="loading-spinner"></div>
        <div style={{ marginTop: '16px', color: '#6b7280' }}>加载中...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
        <div style={{ color: '#6b7280', fontSize: '16px' }}>暂无数据</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ 
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderBottom: '2px solid #e2e8f0'
            }}>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#374151',
                    width: column.width,
                    letterSpacing: '0.025em',
                    cursor: sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                    position: 'relative'
                  }}
                  onClick={() => handleSort(column.key)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{column.title}</span>
                    {sortable && sortConfig && sortConfig.key === column.key && (
                      <span>
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((record, index) => (
              <tr
                key={index}
                style={{
                  borderBottom: '1px solid #f1f5f9',
                  transition: 'all 0.2s ease'
                }}
                className="table-row"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: '#374151',
                      verticalAlign: 'middle'
                    }}
                  >
                    {column.render
                      ? column.render(record[column.key], record)
                      : record[column.key] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;