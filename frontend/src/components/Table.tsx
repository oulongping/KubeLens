import React, { useState, useEffect, useMemo } from 'react';

interface Column {
  key: string;
  title: string;
  width?: string;
  render?: (value: any, row?: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  sortable?: boolean;
}

const Table: React.FC<TableProps> = ({ columns, data, loading = false, sortable = false }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    if (!sortable) return;
    
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = useMemo(() => {
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
  }, [data, sortConfig]);

  const sortedData = getSortedData;

  if (loading) {
    return (
      <div className="kubelens-table-loading">
        <div className="kubelens-loading-spinner"></div>
        <div className="kubelens-table-loading-text">正在加载数据...</div>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className="kubelens-table-empty">
        <div className="kubelens-table-empty-icon">📋</div>
        <div className="kubelens-table-empty-text">暂无数据</div>
        <div className="kubelens-table-empty-subtext">请检查您的集群或稍后重试</div>
      </div>
    );
  }

  return (
    <div className="kubelens-table">
      <div className="kubelens-table-container">
        <table className="kubelens-table-content">
          <thead className="kubelens-table-header">
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key}
                  className={`kubelens-table-header-cell ${sortable && column.key !== 'actions' ? 'sortable' : ''}`}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="kubelens-table-header-content">
                    {column.title}
                    {sortable && sortConfig && sortConfig.key === column.key && (
                      <span className="kubelens-table-sort-indicator">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr key={index} className="kubelens-table-row">
                {columns.map((column) => (
                  <td key={column.key} className="kubelens-table-cell">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
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