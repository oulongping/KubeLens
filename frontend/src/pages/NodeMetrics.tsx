import React, { useState, useEffect } from 'react';
import Table from '../components/Table';

interface NodeMetric {
  name: string;
  cpuUsage: number;
  memoryUsage: number;
}

const NodeMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<NodeMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/metrics/nodes');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // 每30秒自动刷新一次数据
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCPU = (cpu: number) => {
    return `${(cpu / 1000).toFixed(2)} cores`;
  };

  const formatMemory = (memory: number) => {
    // 将内存从KiB转换为GiB
    const memoryInGiB = memory / (1024 * 1024 * 1024);
    return `${memoryInGiB.toFixed(2)} GiB`;
  };

  const filteredMetrics = metrics.filter(metric => {
    return metric.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const columns = [
    {
      key: 'name',
      title: '节点名称',
      width: '200px'
    },
    {
      key: 'cpuUsage',
      title: 'CPU 使用率',
      width: '150px',
      render: (value: number) => formatCPU(value)
    },
    {
      key: 'memoryUsage',
      title: '内存使用率',
      width: '150px',
      render: (value: number) => formatMemory(value)
    }
  ];

  return (
    <div className="kubelens-node-metrics">
      <div className="kubelens-node-metrics-header">
        <button 
          onClick={fetchData}
          className="kubelens-btn kubelens-btn-primary"
        >
          🔄 刷新
        </button>
      </div>

      <div className="kubelens-card kubelens-node-metrics-search">
        <input
          type="text"
          placeholder="搜索节点..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="kubelens-input"
        />
      </div>

      <div className="kubelens-stats">
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">总计节点</div>
          <div className="kubelens-stat-value">{filteredMetrics.length}</div>
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredMetrics}
        loading={loading}
      />
    </div>
  );
};

export default NodeMetrics;