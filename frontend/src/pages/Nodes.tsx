import React, { useState, useEffect } from 'react';
import Table from '../components/Table';

interface Node {
  name: string;
  status: string;
  roles: string;
  age: string;
  version: string;
  internalIP: string;
  externalIP: string;
  osImage: string;
  kernelVersion: string;
  containerRuntime: string;
}

const Nodes: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/nodes');
      if (response.ok) {
        const data = await response.json();
        setNodes(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Ready': 'success',
      'NotReady': 'error',
      'Unknown': 'warning'
    };
    return (
      <span className={`status-badge status-${statusMap[status] || 'default'}`}>
        {status}
      </span>
    );
  };

  const getRoleBadge = (roles: string) => {
    if (roles.includes('master') || roles.includes('control-plane')) {
      return (
        <span className="status-badge status-info">
          🎯 {roles}
        </span>
      );
    }
    return (
      <span className="status-badge status-default">
        🔧 {roles || 'worker'}
      </span>
    );
  };

  const filteredNodes = nodes.filter(node => {
    return node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           node.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
           node.roles.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const columns = [
    {
      key: 'name',
      title: '名称',
      width: '200px'
    },
    {
      key: 'status',
      title: '状态',
      width: '120px',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'roles',
      title: '角色',
      width: '150px',
      render: (value: string) => getRoleBadge(value)
    },
    {
      key: 'age',
      title: '运行时间',
      width: '120px'
    },
    {
      key: 'version',
      title: 'Kubernetes 版本',
      width: '150px',
      render: (value: string) => (
        <code className="kubelens-code kubelens-code-version">
          {value}
        </code>
      )
    },
    {
      key: 'internalIP',
      title: '内部 IP',
      width: '140px',
      render: (value: string) => (
        <code className="kubelens-code kubelens-code-ip">
          {value || '-'}
        </code>
      )
    },
    {
      key: 'externalIP',
      title: '外部 IP',
      width: '140px',
      render: (value: string) => (
        value ? (
          <code className="kubelens-code kubelens-code-external-ip">
            {value}
          </code>
        ) : '-'
      )
    },
    {
      key: 'osImage',
      title: '操作系统'
    }
  ];

  return (
    <div className="kubelens-nodes">
      <div className="kubelens-nodes-header">
        <button 
          onClick={fetchData}
          className="kubelens-btn kubelens-btn-primary"
        >
          🔄 刷新
        </button>
      </div>

      <div className="kubelens-card kubelens-nodes-search">
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
          <div className="kubelens-stat-value">{filteredNodes.length}</div>
        </div>
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">就绪</div>
          <div className="kubelens-stat-value">{filteredNodes.filter(n => n.status === 'Ready').length}</div>
        </div>
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">未就绪</div>
          <div className="kubelens-stat-value">{filteredNodes.filter(n => n.status === 'NotReady').length}</div>
        </div>
        <div className="kubelens-stat-card">
          <div className="kubelens-stat-label">主节点</div>
          <div className="kubelens-stat-value">{filteredNodes.filter(n => n.roles.includes('master') || n.roles.includes('control-plane')).length}</div>
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredNodes}
        loading={loading}
      />
    </div>
  );
};

export default Nodes;